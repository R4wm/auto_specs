import clicksend_client
from clicksend_client import SmsMessage
from clicksend_client.rest import ApiException
import os
import random
import string
import base64
from datetime import datetime, timedelta
from typing import Optional
from db import get_db_cursor

# ClickSend API Configuration
# Token is base64 encoded in format: username:api_key
CLICKSEND_TOKEN = os.getenv('CLICKSEND_TOKEN', '')

# Decode token to get username and API key
try:
    decoded_token = base64.b64decode(CLICKSEND_TOKEN).decode('utf-8').strip()
    CLICKSEND_USERNAME, CLICKSEND_API_KEY = decoded_token.split(':', 1)
except Exception as e:
    print(f"Warning: Failed to decode ClickSend token: {e}")
    CLICKSEND_USERNAME = ''
    CLICKSEND_API_KEY = ''

# Configure ClickSend client
configuration = clicksend_client.Configuration()
configuration.username = CLICKSEND_USERNAME
configuration.password = CLICKSEND_API_KEY

def generate_verification_code(length: int = 6) -> str:
    """Generate a random numeric verification code."""
    return ''.join(random.choices(string.digits, k=length))

def send_verification_sms(phone_number: str, verification_code: str) -> bool:
    """
    Send SMS verification code using ClickSend.

    Args:
        phone_number: Phone number in E.164 format (e.g., +14155552671)
        verification_code: The verification code to send

    Returns:
        True if SMS sent successfully, False otherwise
    """
    try:
        # Create an instance of the SMS API
        api_instance = clicksend_client.SMSApi(clicksend_client.ApiClient(configuration))

        # Create SMS message
        sms_message = SmsMessage(
            source="python",
            body=f"Your Auto Specs Manager verification code is: {verification_code}",
            to=phone_number
        )

        # Send SMS
        sms_messages = clicksend_client.SmsMessageCollection(messages=[sms_message])
        api_response = api_instance.sms_send_post(sms_messages)

        # Check if message was sent successfully
        if api_response.data and api_response.data.messages:
            message_status = api_response.data.messages[0].status
            return message_status == 'SUCCESS'

        return False

    except ApiException as e:
        print(f"Exception when calling SMSApi->sms_send_post: {e}")
        return False
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return False

def create_verification_code(phone_number: str, db_path: str = '') -> Optional[str]:
    """
    Create a verification code for a phone number and store it in the database.

    Args:
        phone_number: Phone number to send verification code to
        db_path: Path to the database (unused, kept for backward compatibility)

    Returns:
        The verification code if created successfully, None otherwise
    """
    try:
        # Generate verification code
        code = generate_verification_code()

        # Calculate expiration time (10 minutes from now)
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Store in database
        with get_db_cursor() as cursor:
            cursor.execute('''
                INSERT INTO sms_verification_codes (phone_number, verification_code, expires_at)
                VALUES (%s, %s, %s)
            ''', (phone_number, code, expires_at))

        return code

    except Exception as e:
        print(f"Error creating verification code: {e}")
        return None

def verify_code(phone_number: str, code: str, db_path: str = '') -> bool:
    """
    Verify a code for a phone number.

    Args:
        phone_number: Phone number to verify
        code: Verification code to check
        db_path: Path to the database (unused, kept for backward compatibility)

    Returns:
        True if code is valid and not expired, False otherwise
    """
    try:
        with get_db_cursor() as cursor:
            # Find the most recent verification code for this phone number
            cursor.execute('''
                SELECT * FROM sms_verification_codes
                WHERE phone_number = %s AND verification_code = %s AND verified = FALSE
                ORDER BY created_at DESC
                LIMIT 1
            ''', (phone_number, code))
            result = cursor.fetchone()

            if not result:
                return False

            # Check if code is expired
            expires_at = result['expires_at']
            if datetime.utcnow() > expires_at:
                return False

            # Mark code as verified
            cursor.execute('''
                UPDATE sms_verification_codes
                SET verified = TRUE
                WHERE id = %s
            ''', (result['id'],))

        return True

    except Exception as e:
        print(f"Error verifying code: {e}")
        return False

def send_verification_code(phone_number: str) -> bool:
    """
    Generate and send a verification code via SMS.

    Args:
        phone_number: Phone number in E.164 format

    Returns:
        True if code was generated and sent successfully, False otherwise
    """
    # Create verification code in database
    code = create_verification_code(phone_number)

    if not code:
        return False

    # Send SMS
    return send_verification_sms(phone_number, code)
