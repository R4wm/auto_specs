#!/bin/bash

# AutoSpecs SSL Certificate Setup Script
# Sets up Let's Encrypt SSL certificates for specs.prsmusa.com

set -e

echo "=================================="
echo "AutoSpecs SSL Certificate Setup"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Configuration
DOMAIN="specs.prsmusa.com"
EMAIL="admin@prsmusa.com"  # Change this to your email
WEBROOT="/var/www/certbot"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Certbot not found. Installing..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
else
    echo "Certbot is already installed"
fi

# Create webroot directory for ACME challenge
mkdir -p $WEBROOT
chown -R www-data:www-data $WEBROOT

echo ""
echo "Step 1: Obtaining SSL certificate for $DOMAIN"
echo "----------------------------------------------"

# Obtain certificate
certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domain $DOMAIN \
    --domain www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✓ SSL certificate obtained successfully"
else
    echo "✗ Failed to obtain SSL certificate"
    exit 1
fi

echo ""
echo "Step 2: Setting up automatic renewal"
echo "-------------------------------------"

# Test renewal
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✓ Certificate renewal test successful"
else
    echo "✗ Certificate renewal test failed"
    exit 1
fi

# Create renewal cron job (runs twice daily)
CRON_JOB="0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

echo "✓ Automatic renewal cron job created"

echo ""
echo "Step 3: Configuring Nginx"
echo "-------------------------"

# Copy nginx configuration
cp /home/r4wm/github/auto_specs/nginx/specs.prsmusa.com.conf /etc/nginx/sites-available/specs.prsmusa.com

# Create symbolic link to enable site
ln -sf /etc/nginx/sites-available/specs.prsmusa.com /etc/nginx/sites-enabled/specs.prsmusa.com

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration is valid"

    # Reload nginx
    systemctl reload nginx
    echo "✓ Nginx reloaded successfully"
else
    echo "✗ Nginx configuration test failed"
    exit 1
fi

echo ""
echo "=================================="
echo "SSL Setup Complete!"
echo "=================================="
echo ""
echo "Your site is now accessible at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "Certificate details:"
certbot certificates | grep -A 10 $DOMAIN
echo ""
echo "Certificate will auto-renew twice daily."
echo "Check renewal status: sudo certbot renew --dry-run"
echo ""
