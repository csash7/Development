# Ghost Shift Hunter - Production Deployment Guide

## Prerequisites
- VPS with Ubuntu 20.04+ (Hostinger VPS)
- Domain name (optional but recommended)
- SSH access to server

## 1. Server Setup

```bash
# SSH into your server
ssh root@31.97.212.67

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y python3 python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx git

# Install Node.js 18+ (for Next.js)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

## 2. Clone and Setup Application

```bash
# Create app directory
mkdir -p /var/www/ghost-shift-hunter
cd /var/www/ghost-shift-hunter

# Clone your repo (or copy files)
# Option A: Git clone
git clone <your-repo-url> .

# Option B: SCP from local machine
# Run this on your LOCAL machine:
# scp -r /Users/sriharshachaturvedula/Desktop/Development/atlas/ghost-shift-hunter-final/* root@31.97.212.67:/var/www/ghost-shift-hunter/
```

## 3. Backend Setup

```bash
cd /var/www/ghost-shift-hunter/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_api_key_here
ALLOWED_ORIGINS=https://yourdomain.com,http://31.97.212.67
EOF

# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

## 4. Frontend Setup

```bash
cd /var/www/ghost-shift-hunter/frontend

# Install dependencies
npm install

# Create .env.local for production
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://31.97.212.67:8000
EOF

# Build for production
npm run build
```

## 5. Create Systemd Services

### Backend Service
```bash
cat > /etc/systemd/system/ghost-shift-backend.service << 'EOF'
[Unit]
Description=Ghost Shift Hunter Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/ghost-shift-hunter/backend
Environment="PATH=/var/www/ghost-shift-hunter/backend/venv/bin"
ExecStart=/var/www/ghost-shift-hunter/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF
```

### Frontend Service
```bash
cat > /etc/systemd/system/ghost-shift-frontend.service << 'EOF'
[Unit]
Description=Ghost Shift Hunter Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/ghost-shift-hunter/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
```

### Enable and Start Services
```bash
systemctl daemon-reload
systemctl enable ghost-shift-backend ghost-shift-frontend
systemctl start ghost-shift-backend ghost-shift-frontend

# Check status
systemctl status ghost-shift-backend
systemctl status ghost-shift-frontend
```

## 6. Nginx Configuration

```bash
cat > /etc/nginx/sites-available/ghost-shift << 'EOF'
server {
    listen 80;
    server_name 31.97.212.67;  # Replace with your domain

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;  # For image uploads
    }

    # Static uploads
    location /uploads/ {
        proxy_pass http://localhost:8000/uploads/;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/ghost-shift /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 7. Firewall Setup

```bash
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

## 8. SSL Certificate (Optional - if you have a domain)

```bash
certbot --nginx -d yourdomain.com
```

## 9. Verify Deployment

```bash
# Check services
systemctl status ghost-shift-backend
systemctl status ghost-shift-frontend
systemctl status nginx

# Check logs
journalctl -u ghost-shift-backend -f
journalctl -u ghost-shift-frontend -f

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:3000
```

## Quick Commands

```bash
# Restart backend
systemctl restart ghost-shift-backend

# Restart frontend
systemctl restart ghost-shift-frontend

# View backend logs
journalctl -u ghost-shift-backend -f

# View frontend logs
journalctl -u ghost-shift-frontend -f

# Rebuild frontend
cd /var/www/ghost-shift-hunter/frontend && npm run build && systemctl restart ghost-shift-frontend
```

## Troubleshooting

1. **502 Bad Gateway**: Check if backend/frontend services are running
2. **CORS errors**: Update ALLOWED_ORIGINS in backend .env
3. **API not working**: Check backend logs with `journalctl -u ghost-shift-backend -f`
4. **Image uploads fail**: Check permissions on /var/www/ghost-shift-hunter/backend/uploads
