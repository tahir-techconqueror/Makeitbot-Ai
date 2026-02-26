#!/bin/bash
# GCE VM Startup Script for NotebookLLM MCP Server
# This script installs all dependencies and sets up the sidecar service

set -e

echo "=== Markitbot NotebookLLM VM Setup ==="

# Update system
apt-get update
apt-get upgrade -y

# Install Python 3.11 and pip
apt-get install -y python3.11 python3.11-venv python3-pip

# Install Chrome dependencies
apt-get install -y wget gnupg2 unzip curl

# Install Google Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update
apt-get install -y google-chrome-stable

# Create app directory
mkdir -p /opt/markitbot-sidecar
cd /opt/markitbot-sidecar

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python packages
pip install --upgrade pip
pip install fastapi uvicorn notebooklm-mcp mcp pydantic fastmcp httpx firebase-admin python-dotenv

# Create systemd service for the sidecar
cat > /etc/systemd/system/markitbot-sidecar.service << 'EOF'
[Unit]
Description=Markitbot NotebookLLM Sidecar
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/markitbot-sidecar
Environment=PORT=8080
Environment=ENABLE_NOTEBOOKLM_MCP=true
Environment=PYTHONUNBUFFERED=True
ExecStart=/opt/markitbot-sidecar/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "=== Setup Complete ==="
echo "Next steps:"
echo "1. Copy main.py and other files to /opt/markitbot-sidecar/"
echo "2. Run: notebooklm-mcp init <notebook-url>"
echo "3. Start service: systemctl enable markitbot-sidecar && systemctl start markitbot-sidecar"

