"""
Utility functions for managing user subscriptions and tier limits.
"""
from db import get_db_cursor, row_to_dict
from datetime import datetime
from typing import Dict, Optional
import os


def get_user_subscription(user_id: int) -> Dict:
    """
    Get user's current subscription tier and limits.

    Args:
        user_id: ID of the user

    Returns:
        Dictionary containing tier info and limits:
        {
            'tier': 'default' or 'premier',
            'build_limit': int,
            'storage_limit': int (bytes)
        }
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT tier, status, end_date
            FROM subscriptions
            WHERE user_id = %s AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        """, (user_id,))
        sub = cursor.fetchone()

    # Determine tier (default if no active subscription)
    tier = 'default'
    if sub and sub['status'] == 'active':
        # Check if subscription hasn't expired
        if not sub['end_date'] or datetime.utcnow() < sub['end_date']:
            tier = sub['tier']

    # Get limits based on tier
    if tier == 'premier':
        return {
            'tier': 'premier',
            'build_limit': int(os.getenv('PREMIER_BUILD_LIMIT', '10')),
            'storage_limit': int(os.getenv('PREMIER_STORAGE_LIMIT', '1073741824'))  # 1GB default
        }
    else:
        return {
            'tier': 'default',
            'build_limit': int(os.getenv('DEFAULT_BUILD_LIMIT', '1')),
            'storage_limit': int(os.getenv('DEFAULT_STORAGE_LIMIT', '104857600'))  # 100MB default
        }


def check_build_limit(user_id: int) -> bool:
    """
    Check if user can create another build.

    Args:
        user_id: ID of the user

    Returns:
        True if user can create another build, False otherwise
    """
    sub_info = get_user_subscription(user_id)

    with get_db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM builds WHERE user_id = %s", (user_id,))
        build_count = cursor.fetchone()['count']

    return build_count < sub_info['build_limit']


def get_build_count(user_id: int) -> int:
    """
    Get the number of builds a user has created.

    Args:
        user_id: ID of the user

    Returns:
        Number of builds
    """
    with get_db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM builds WHERE user_id = %s", (user_id,))
        return cursor.fetchone()['count']


def check_storage_limit(user_id: int, file_size_bytes: int) -> bool:
    """
    Check if user has storage space for a file.

    Args:
        user_id: ID of the user
        file_size_bytes: Size of the file in bytes

    Returns:
        True if user has enough storage space, False otherwise
    """
    sub_info = get_user_subscription(user_id)

    with get_db_cursor() as cursor:
        cursor.execute("SELECT storage_used_bytes FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

    current_usage = user['storage_used_bytes'] or 0
    return (current_usage + file_size_bytes) <= sub_info['storage_limit']


def get_storage_usage(user_id: int) -> int:
    """
    Get user's current storage usage in bytes.

    Args:
        user_id: ID of the user

    Returns:
        Storage usage in bytes
    """
    with get_db_cursor() as cursor:
        cursor.execute("SELECT storage_used_bytes FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

    return user['storage_used_bytes'] or 0


def update_storage_usage(user_id: int, bytes_delta: int) -> int:
    """
    Update user's storage usage.

    Args:
        user_id: ID of the user
        bytes_delta: Change in storage (positive to add, negative to subtract)

    Returns:
        New storage usage in bytes
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE users
            SET storage_used_bytes = GREATEST(COALESCE(storage_used_bytes, 0) + %s, 0)
            WHERE id = %s
            RETURNING storage_used_bytes
        """, (bytes_delta, user_id))

        result = cursor.fetchone()
        return result['storage_used_bytes'] if result else 0


def get_subscription_status(user_id: int) -> Dict:
    """
    Get detailed subscription status including usage statistics.

    Args:
        user_id: ID of the user

    Returns:
        Dictionary with subscription details and usage stats
    """
    sub_info = get_user_subscription(user_id)

    with get_db_cursor() as cursor:
        # Get build count
        cursor.execute("SELECT COUNT(*) as count FROM builds WHERE user_id = %s", (user_id,))
        builds_used = cursor.fetchone()['count']

        # Get storage usage
        cursor.execute("SELECT storage_used_bytes FROM users WHERE id = %s", (user_id,))
        storage_used = cursor.fetchone()['storage_used_bytes'] or 0

        # Get subscription details
        cursor.execute("""
            SELECT * FROM subscriptions
            WHERE user_id = %s AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        """, (user_id,))
        sub = cursor.fetchone()

    # Calculate percentages
    build_usage_pct = (builds_used / sub_info['build_limit'] * 100) if sub_info['build_limit'] > 0 else 0
    storage_usage_pct = (storage_used / sub_info['storage_limit'] * 100) if sub_info['storage_limit'] > 0 else 0

    return {
        'tier': sub_info['tier'],
        'status': sub['status'] if sub else 'none',
        'builds_used': builds_used,
        'builds_limit': sub_info['build_limit'],
        'build_usage_percentage': round(build_usage_pct, 1),
        'storage_used_bytes': storage_used,
        'storage_used_mb': round(storage_used / 1024 / 1024, 2),
        'storage_limit_bytes': sub_info['storage_limit'],
        'storage_limit_mb': round(sub_info['storage_limit'] / 1024 / 1024, 2),
        'storage_usage_percentage': round(storage_usage_pct, 1),
        'stripe_customer_id': sub['stripe_customer_id'] if sub else None,
        'stripe_subscription_id': sub['stripe_subscription_id'] if sub else None,
        'start_date': sub['start_date'].isoformat() if sub and sub['start_date'] else None,
        'end_date': sub['end_date'].isoformat() if sub and sub.get('end_date') else None
    }


def create_subscription(
    user_id: int,
    tier: str,
    stripe_customer_id: str = None,
    stripe_subscription_id: str = None
) -> int:
    """
    Create a new subscription for a user.

    Args:
        user_id: ID of the user
        tier: Subscription tier ('default' or 'premier')
        stripe_customer_id: Optional Stripe customer ID
        stripe_subscription_id: Optional Stripe subscription ID

    Returns:
        ID of the created subscription
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO subscriptions
            (user_id, tier, status, stripe_customer_id, stripe_subscription_id, start_date)
            VALUES (%s, %s, 'active', %s, %s, NOW())
            RETURNING id
        """, (user_id, tier, stripe_customer_id, stripe_subscription_id))

        sub_id = cursor.fetchone()['id']
        return sub_id


def cancel_subscription(user_id: int, stripe_subscription_id: str = None) -> bool:
    """
    Cancel a user's subscription.

    Args:
        user_id: ID of the user
        stripe_subscription_id: Optional Stripe subscription ID to match

    Returns:
        True if subscription was cancelled, False otherwise
    """
    with get_db_cursor() as cursor:
        if stripe_subscription_id:
            cursor.execute("""
                UPDATE subscriptions
                SET status = 'cancelled', cancelled_at = NOW(), end_date = NOW()
                WHERE user_id = %s AND stripe_subscription_id = %s AND status = 'active'
            """, (user_id, stripe_subscription_id))
        else:
            cursor.execute("""
                UPDATE subscriptions
                SET status = 'cancelled', cancelled_at = NOW(), end_date = NOW()
                WHERE user_id = %s AND status = 'active'
            """, (user_id,))

        return True


def update_subscription_from_stripe(
    stripe_subscription_id: str,
    status: str,
    end_date: datetime = None
) -> bool:
    """
    Update subscription status from Stripe webhook.

    Args:
        stripe_subscription_id: Stripe subscription ID
        status: New status ('active', 'cancelled', 'expired')
        end_date: Optional end date

    Returns:
        True if updated successfully
    """
    with get_db_cursor() as cursor:
        if end_date:
            cursor.execute("""
                UPDATE subscriptions
                SET status = %s, end_date = %s, updated_at = NOW()
                WHERE stripe_subscription_id = %s
            """, (status, end_date, stripe_subscription_id))
        else:
            cursor.execute("""
                UPDATE subscriptions
                SET status = %s, updated_at = NOW()
                WHERE stripe_subscription_id = %s
            """, (status, stripe_subscription_id))

        return True
