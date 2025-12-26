#!/bin/bash
# Ghost Shift Hunter - Quick Deploy Script
# Run this on your VPS after copying the files

set -e

echo "🚀 Starting Ghost Shift Hunter Deployment..."

# Variables
APP_DIR="/var/www/ghost-shift-hunter"
SERVER_IP="31.97.212.67"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
apt install -y python3 python3-pip python3-venv nginx git curl

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Create app directory
echo "📁 Setting up application directory..."
mkdir -p $APP_DIR

# Backend setup
echo "🐍 Setting up Python backend..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Prompt for API keys
echo ""
echo "🔑 Please enter your API keys:"
read -p "OpenAI API Key: " OPENAI_KEY
read -p "Google API Key (press enter to skip): " GOOGLE_KEY

cat > .env << EOF
OPENAI_API_KEY=$OPENAI_KEY
GOOGLE_API_KEY=$GOOGLE_KEY
ALLOWED_ORIGINS=http://$SERVER_IP,http://localhost
EOF

# Frontend setup
echo "⚛️ Setting up Next.js frontend..."
cd $APP_DIR/frontend
npm install

cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://$SERVER_IP:8000
EOF

echo "🔨 Building frontend for production..."
npm run build

# Create systemd services
echo "⚙️ Creating systemd services..."

cat > /etc/systemd/system/ghost-shift-backend.service << EOF
[Unit]
Description=Ghost Shift Hunter Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/ghost-shift-frontend.service << EOF
[Unit]
Description=Ghost Shift Hunter Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/ghost-shift << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50M;
    }

    location /uploads/ {
        proxy_pass http://localhost:8000/uploads/;
    }

    location /health {
        proxy_pass http://localhost:8000/health;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ghost-shift /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Start services
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable ghost-shift-backend ghost-shift-frontend nginx
systemctl restart ghost-shift-backend ghost-shift-frontend nginx

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is now live at: http://$SERVER_IP"
echo ""
echo "📋 Useful commands:"
echo "   View backend logs:  journalctl -u ghost-shift-backend -f"
echo "   View frontend logs: journalctl -u ghost-shift-frontend -f"
echo "   Restart backend:    systemctl restart ghost-shift-backend"
echo "   Restart frontend:   systemctl restart ghost-shift-frontend"
