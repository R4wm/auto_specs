import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { subscriptionAPI, SubscriptionStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PricingPage: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

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

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await subscriptionAPI.createCheckoutSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err: any) {
      console.error('Failed to create checkout session:', err);
      setError('Unable to start checkout process. Please try again.');
      setProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    setProcessing(true);
    setError('');

    try {
      const response = await subscriptionAPI.createPortalSession();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err: any) {
      console.error('Failed to open portal:', err);
      setError('Unable to open subscription portal. Please try again.');
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPremier = subscription?.tier === 'premier';

  return (
    <div className="pricing-page">
      <header className="pricing-header">
        <div className="header-content">
          <div className="logo">
            <Link to="/">AutoSpecs</Link>
          </div>
          <div className="header-actions">
            {user ? (
              <>
                <Link to="/builds" className="btn btn-secondary">
                  My Builds
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="pricing-container">
        <div className="pricing-hero">
          <h1>Choose Your Plan</h1>
          <p className="hero-subtitle">
            Start tracking your builds for free, or upgrade to Premier for unlimited possibilities
          </p>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <div className="pricing-cards">
          {/* Default Plan */}
          <div className="pricing-card default-card">
            <div className="card-header">
              <h2 className="plan-name">Default</h2>
              <div className="plan-price">
                <span className="price">$0</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-description">Perfect for getting started</p>
            </div>

            <div className="card-features">
              <h3>What's included:</h3>
              <ul className="feature-list">
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>1 build project</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>100 MB storage</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Complete build tracking</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Maintenance history</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Performance logs</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Photo uploads</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Version history</span>
                </li>
              </ul>
            </div>

            <div className="card-footer">
              {!user ? (
                <Link to="/register" className="btn btn-outline">
                  Get Started Free
                </Link>
              ) : isPremier ? (
                <button className="btn btn-outline" disabled>
                  Current Plan
                </button>
              ) : (
                <button className="btn btn-outline" disabled>
                  Current Plan
                </button>
              )}
            </div>
          </div>

          {/* Premier Plan */}
          <div className="pricing-card premier-card featured">
            <div className="featured-badge">Most Popular</div>
            <div className="card-header">
              <h2 className="plan-name">Premier</h2>
              <div className="plan-price">
                <span className="price">$9.99</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-description">For serious builders</p>
            </div>

            <div className="card-features">
              <h3>Everything in Default, plus:</h3>
              <ul className="feature-list">
                <li className="feature-item highlighted">
                  <span className="feature-icon">⭐</span>
                  <span><strong>Up to 10 builds</strong></span>
                </li>
                <li className="feature-item highlighted">
                  <span className="feature-icon">⭐</span>
                  <span><strong>1 GB storage</strong></span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Export to PDF</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Build comparison tools</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Early access to new features</span>
                </li>
              </ul>
            </div>

            <div className="card-footer">
              {!user ? (
                <Link to="/register" className="btn btn-primary">
                  Start Premier Trial
                </Link>
              ) : isPremier ? (
                <button
                  className="btn btn-secondary"
                  onClick={handleManageSubscription}
                  disabled={processing}
                >
                  {processing ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSubscribe}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Upgrade to Premier'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pricing-faq">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Can I change plans later?</h3>
              <p>
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately, and we'll prorate any charges.
              </p>
            </div>
            <div className="faq-item">
              <h3>What happens to my data if I downgrade?</h3>
              <p>
                Your data is never deleted. If you exceed the Default plan limits, you'll be
                prompted to upgrade or won't be able to add more builds until you free up space.
              </p>
            </div>
            <div className="faq-item">
              <h3>Can I cancel anytime?</h3>
              <p>
                Absolutely. There are no long-term contracts. Cancel anytime from your subscription
                settings, and you'll retain access until the end of your billing period.
              </p>
            </div>
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>
                We accept all major credit cards through Stripe, including Visa, MasterCard,
                American Express, and Discover.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pricing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .pricing-header {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo a {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .pricing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
        }

        .pricing-hero {
          text-align: center;
          margin-bottom: 60px;
          color: white;
        }

        .pricing-hero h1 {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
          margin-bottom: 80px;
        }

        .pricing-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .pricing-card.featured {
          border: 3px solid #f5576c;
        }

        .featured-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 6px 20px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .plan-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 16px;
        }

        .plan-price {
          margin-bottom: 12px;
        }

        .price {
          font-size: 3rem;
          font-weight: 800;
          color: #2d3748;
        }

        .period {
          font-size: 1rem;
          color: #718096;
        }

        .plan-description {
          color: #4a5568;
          font-size: 1rem;
        }

        .card-features {
          flex: 1;
          margin-bottom: 32px;
        }

        .card-features h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
        }

        .feature-item:last-child {
          border-bottom: none;
        }

        .feature-item.highlighted {
          color: #2d3748;
          font-weight: 500;
        }

        .feature-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .card-footer {
          text-align: center;
        }

        .btn {
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
          width: 100%;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #4c51bf;
          border: 2px solid white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.9);
        }

        .btn-outline {
          background: transparent;
          color: #4c51bf;
          border: 2px solid #4c51bf;
        }

        .btn-outline:hover:not(:disabled) {
          background: #4c51bf;
          color: white;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pricing-faq {
          color: white;
          max-width: 900px;
          margin: 0 auto;
        }

        .pricing-faq h2 {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 40px;
        }

        .faq-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
        }

        .faq-item {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 24px;
        }

        .faq-item h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .faq-item p {
          font-size: 0.9375rem;
          line-height: 1.6;
          opacity: 0.9;
        }

        .alert {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: center;
        }

        .alert-error {
          background-color: #fed7d7;
          border: 1px solid #fc8181;
          color: #c53030;
        }

        @media (max-width: 768px) {
          .pricing-hero h1 {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .pricing-cards {
            grid-template-columns: 1fr;
          }

          .faq-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
