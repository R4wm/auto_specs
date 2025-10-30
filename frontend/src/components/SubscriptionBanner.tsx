import React, { useState, useEffect } from 'react';
import { subscriptionAPI, SubscriptionStatus } from '../services/api';

interface SubscriptionBannerProps {
  onUpgradeClick?: () => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onUpgradeClick }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await subscriptionAPI.getStatus();
      setSubscription(data);
    } catch (err: any) {
      console.error('Failed to load subscription:', err);
      setError('Unable to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await subscriptionAPI.createPortalSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err: any) {
      console.error('Failed to open portal:', err);
      setError('Unable to open subscription portal');
    }
  };

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default behavior: navigate to pricing page
      window.location.href = '/pricing';
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (error || !subscription) {
    return null; // Silently fail if we can't load subscription
  }

  const isPremier = subscription.tier === 'premier';
  const buildUsagePercentage = subscription.build_usage_percentage;
  const storageUsagePercentage = subscription.storage_usage_percentage;

  // Determine warning level
  const isNearLimit = buildUsagePercentage >= 80 || storageUsagePercentage >= 80;
  const isAtLimit = buildUsagePercentage >= 100 || storageUsagePercentage >= 100;

  return (
    <div className={`subscription-banner ${isPremier ? 'premier' : 'default'} ${isAtLimit ? 'at-limit' : isNearLimit ? 'near-limit' : ''}`}>
      <div className="banner-content">
        <div className="banner-info">
          <div className="tier-badge">
            {isPremier ? (
              <>
                <span className="tier-icon">⭐</span>
                <span className="tier-name">Premier</span>
              </>
            ) : (
              <>
                <span className="tier-icon">🔓</span>
                <span className="tier-name">Default Plan</span>
              </>
            )}
          </div>

          <div className="usage-stats">
            <div className="usage-item">
              <div className="usage-label">Builds</div>
              <div className="usage-bar-container">
                <div className="usage-bar">
                  <div
                    className="usage-fill"
                    style={{ width: `${Math.min(buildUsagePercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="usage-text">
                  {subscription.builds_used} / {subscription.builds_limit}
                </div>
              </div>
            </div>

            <div className="usage-item">
              <div className="usage-label">Storage</div>
              <div className="usage-bar-container">
                <div className="usage-bar">
                  <div
                    className="usage-fill"
                    style={{ width: `${Math.min(storageUsagePercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="usage-text">
                  {subscription.storage_used_mb.toFixed(1)} MB / {subscription.storage_limit_mb} MB
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="banner-actions">
          {isPremier ? (
            <button className="btn btn-secondary" onClick={handleManageSubscription}>
              Manage Subscription
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleUpgrade}>
              Upgrade to Premier
            </button>
          )}
        </div>
      </div>

      <style>{`
        .subscription-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .subscription-banner.default {
          background: linear-gradient(135deg, #4c51bf 0%, #667eea 100%);
        }

        .subscription-banner.premier {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .subscription-banner.near-limit {
          background: linear-gradient(135deg, #fa8c16 0%, #faad14 100%);
        }

        .subscription-banner.at-limit {
          background: linear-gradient(135deg, #f5222d 0%, #ff7875 100%);
        }

        .banner-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .banner-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tier-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .tier-icon {
          font-size: 1.5rem;
        }

        .tier-name {
          font-weight: 700;
        }

        .usage-stats {
          display: flex;
          gap: 32px;
        }

        .usage-item {
          flex: 1;
          max-width: 300px;
        }

        .usage-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .usage-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .usage-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: white;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .usage-text {
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          min-width: 100px;
        }

        .banner-actions {
          display: flex;
          align-items: center;
        }

        .banner-actions .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .banner-actions .btn-primary {
          background-color: white;
          color: #4c51bf;
        }

        .banner-actions .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .banner-actions .btn-secondary {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid white;
        }

        .banner-actions .btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .banner-content {
            flex-direction: column;
            align-items: stretch;
          }

          .usage-stats {
            flex-direction: column;
            gap: 16px;
          }

          .usage-item {
            max-width: 100%;
          }

          .banner-actions {
            justify-content: center;
          }

          .banner-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
