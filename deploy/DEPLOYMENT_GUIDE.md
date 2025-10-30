# AutoSpecs Deployment Guide

Complete guide for deploying AutoSpecs to production on specs.prsmusa.com.

## Prerequisites

- Ubuntu 20.04+ server with root access
- Domain name (specs.prsmusa.com) pointing to server IP
- At least 2GB RAM, 20GB disk space

## 1. Server Setup

### Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.9+
sudo apt install -y python3 python3-pip python3-venv

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

## 2. Database Setup

### Create PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE autospecs;
CREATE USER autospecs_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE autospecs TO autospecs_user;
\q
```

## 3. Application Setup

### Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/autospecs
sudo chown $USER:$USER /var/www/autospecs

# Clone repository
cd /var/www/autospecs
git clone https://github.com/yourusername/auto_specs.git .
```

### Backend Setup

```bash
cd /var/www/autospecs/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL=postgresql://autospecs_user:your_secure_password_here@localhost/autospecs

# Security
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Storage
STORAGE_PATH=/tmp/auto_spec/storage

# Stripe (get from https://dashboard.stripe.com/)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_price_id

# ClickSend SMS (get from https://dashboard.clicksend.com/)
CLICKSEND_USERNAME=your_clicksend_username
CLICKSEND_API_KEY=your_clicksend_api_key

# CORS
FRONTEND_URL=https://specs.prsmusa.com
EOF

# Create storage directory
sudo mkdir -p /tmp/auto_spec/storage
sudo chown -R www-data:www-data /tmp/auto_spec

# Run database migrations
alembic upgrade head
```

### Frontend Setup

```bash
cd /var/www/autospecs/frontend

# Install dependencies
npm install

# Create .env.production file
cat > .env.production << EOF
VITE_API_URL=https://specs.prsmusa.com
EOF

# Build for production
npm run build

# Copy build files to nginx directory
sudo mkdir -p /var/www/autospecs/frontend/dist
sudo cp -r dist/* /var/www/autospecs/frontend/dist/
```

## 4. Create Systemd Service

### Backend Service

```bash
sudo cat > /etc/systemd/system/autospecs.service << EOF
[Unit]
Description=AutoSpecs FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/autospecs/backend
Environment="PATH=/var/www/autospecs/backend/venv/bin"
ExecStart=/var/www/autospecs/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable autospecs
sudo systemctl start autospecs

# Check status
sudo systemctl status autospecs
```

## 5. SSL and Nginx Setup

### Setup SSL Certificate

```bash
# Make script executable
chmod +x /var/www/autospecs/deploy/setup-ssl.sh

# Run SSL setup script
sudo /var/www/autospecs/deploy/setup-ssl.sh
```

The script will:
- Install certbot
- Obtain SSL certificates from Let's Encrypt
- Configure automatic renewal
- Setup and reload Nginx

## 6. Stripe Webhook Configuration

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://specs.prsmusa.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and update `.env` file

## 7. Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

## 8. Monitoring and Logs

### View Application Logs

```bash
# Backend logs
sudo journalctl -u autospecs -f

# Nginx access logs
sudo tail -f /var/log/nginx/autospecs_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/autospecs_error.log
```

### Monitor Service Status

```bash
# Check backend service
sudo systemctl status autospecs

# Check nginx
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates
```

## 9. Backup Strategy

### Database Backup

```bash
# Create backup script
cat > /var/www/autospecs/deploy/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/autospecs"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U autospecs_user autospecs | gzip > $BACKUP_DIR/autospecs_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "autospecs_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /var/www/autospecs/deploy/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/autospecs/deploy/backup-db.sh") | crontab -
```

### File Storage Backup

```bash
# Backup user uploads
sudo rsync -av /tmp/auto_spec/storage/ /var/backups/autospecs/storage/
```

## 10. Deployment Updates

### Update Application

```bash
cd /var/www/autospecs

# Pull latest changes
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# Update frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/autospecs/frontend/dist/

# Restart services
sudo systemctl restart autospecs
sudo systemctl reload nginx
```

## 11. Health Checks

Test the following URLs after deployment:

- https://specs.prsmusa.com - Frontend should load
- https://specs.prsmusa.com/api/health - Should return "OK"
- https://specs.prsmusa.com/health - Nginx health check

## 12. Troubleshooting

### Backend not starting

```bash
# Check logs
sudo journalctl -u autospecs -n 50 --no-pager

# Check if port 8000 is in use
sudo netstat -tlnp | grep 8000

# Restart service
sudo systemctl restart autospecs
```

### Frontend not loading

```bash
# Check nginx logs
sudo tail -50 /var/log/nginx/autospecs_error.log

# Verify build files exist
ls -la /var/www/autospecs/frontend/dist/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

### Database connection issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U autospecs_user -d autospecs -h localhost

# Check database logs
sudo tail -50 /var/log/postgresql/postgresql-*-main.log
```

## 13. Security Checklist

- [ ] Strong passwords for all accounts
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled (disable password auth)
- [ ] SSL certificates installed and auto-renewing
- [ ] Database user has minimal required permissions
- [ ] `.env` files have proper permissions (600)
- [ ] Regular backups configured
- [ ] Server updates automated
- [ ] Fail2ban installed for brute force protection
- [ ] Rate limiting configured in nginx

## 14. Performance Optimization

### Enable HTTP/2

Already configured in nginx.

### Database Connection Pooling

Already configured in FastAPI app.

### Redis Caching (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Update backend to use Redis for session caching
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/auto_specs/issues
- Email: support@prsmusa.com

## License

Copyright © 2025 PRSM USA. All rights reserved.
