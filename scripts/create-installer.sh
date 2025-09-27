#!/bin/bash

# InterviewSpark Self-Contained Installer Creator
set -e

VERSION=${1:-2.0.0}
PLATFORM=${2:-linux}
OUTPUT_DIR="dist/installer"

echo "🚀 Creating InterviewSpark Installer v$VERSION for $PLATFORM"

# Create output directory
mkdir -p $OUTPUT_DIR

# Build the application
echo "📦 Building application..."
npm run build

# Create installer structure
echo "📁 Creating installer structure..."
mkdir -p $OUTPUT_DIR/interviewspark
mkdir -p $OUTPUT_DIR/interviewspark/app
mkdir -p $OUTPUT_DIR/interviewspark/data
mkdir -p $OUTPUT_DIR/interviewspark/logs
mkdir -p $OUTPUT_DIR/interviewspark/config

# Copy application files
echo "📋 Copying application files..."
cp -r apps/web/.next/standalone/* $OUTPUT_DIR/interviewspark/app/
cp -r apps/web/.next/static $OUTPUT_DIR/interviewspark/app/.next/
cp -r apps/web/public $OUTPUT_DIR/interviewspark/app/

# Copy Node.js runtime (if needed)
if [ "$PLATFORM" = "linux" ]; then
    echo "📥 Downloading Node.js runtime..."
    NODE_VERSION="18.19.0"
    wget -q "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" -O node.tar.xz
    tar -xf node.tar.xz
    mv node-v$NODE_VERSION-linux-x64 $OUTPUT_DIR/interviewspark/node
    rm node.tar.xz
fi

# Create startup script
cat > $OUTPUT_DIR/interviewspark/start.sh << 'EOF'
#!/bin/bash

# InterviewSpark Startup Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set environment variables
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Start the application
echo "🚀 Starting InterviewSpark..."
echo "📍 Application directory: $SCRIPT_DIR"
echo "🌐 Server will be available at: http://localhost:3000"

# Use bundled Node.js if available
if [ -d "node" ]; then
    ./node/bin/node app/server.js
else
    node app/server.js
fi
EOF

chmod +x $OUTPUT_DIR/interviewspark/start.sh

# Create stop script
cat > $OUTPUT_DIR/interviewspark/stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping InterviewSpark..."
pkill -f "server.js" || echo "No running InterviewSpark processes found"
echo "✅ InterviewSpark stopped"
EOF

chmod +x $OUTPUT_DIR/interviewspark/stop.sh

# Create configuration file
cat > $OUTPUT_DIR/interviewspark/config/app.json << 'EOF'
{
  "name": "InterviewSpark",
  "version": "2.0.0",
  "port": 3000,
  "host": "0.0.0.0",
  "environment": "production",
  "features": {
    "advancedSecurity": true,
    "complianceManagement": true,
    "securityAnalytics": true,
    "enterpriseAudit": true,
    "computerVision": true,
    "sentimentAnalysis": true
  },
  "database": {
    "type": "sqlite",
    "path": "./data/interviewspark.db"
  },
  "logging": {
    "level": "info",
    "file": "./logs/app.log"
  }
}
EOF

# Create README
cat > $OUTPUT_DIR/interviewspark/README.md << 'EOF'
# InterviewSpark v2.0.0

## Installation

1. Extract the InterviewSpark package to your desired location
2. Open a terminal and navigate to the InterviewSpark directory
3. Run the startup script:
   ```bash
   ./start.sh
   ```
4. Open your web browser and go to: http://localhost:3000

## System Requirements

- Operating System: Linux, macOS, or Windows
- RAM: 4GB minimum, 8GB recommended
- Disk Space: 2GB free space
- Network: Internet connection for AI features

## Features

✅ Advanced Security Framework
✅ Compliance Management System
✅ Security Analytics & Intelligence
✅ Enterprise Audit & Governance
✅ Computer Vision Analysis
✅ Real-time Sentiment Analysis
✅ Attention Tracking
✅ Body Language Analysis

## Configuration

Edit `config/app.json` to customize application settings.

## Logs

Application logs are stored in the `logs/` directory.

## Support

For support, visit: https://interviewspark.com/support
EOF

# Create installer script
cat > $OUTPUT_DIR/install.sh << 'EOF'
#!/bin/bash

echo "🚀 InterviewSpark Installer v2.0.0"
echo "=================================="

# Check system requirements
echo "🔍 Checking system requirements..."

# Check for Node.js (if not bundled)
if [ ! -d "interviewspark/node" ]; then
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed."
        echo "Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js 18+ is required. Current version: $(node --version)"
        exit 1
    fi
fi

# Get installation directory
read -p "📁 Installation directory [/opt/interviewspark]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/opt/interviewspark}

# Create installation directory
echo "📁 Creating installation directory: $INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"

# Copy files
echo "📋 Installing InterviewSpark..."
sudo cp -r interviewspark/* "$INSTALL_DIR/"
sudo chown -R $USER:$USER "$INSTALL_DIR"

# Create systemd service (Linux)
if command -v systemctl &> /dev/null; then
    echo "🔧 Creating system service..."
    sudo tee /etc/systemd/system/interviewspark.service > /dev/null << EOL
[Unit]
Description=InterviewSpark Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

    sudo systemctl daemon-reload
    sudo systemctl enable interviewspark
    
    echo "✅ Installation complete!"
    echo "🚀 Start InterviewSpark with: sudo systemctl start interviewspark"
    echo "📊 Check status with: sudo systemctl status interviewspark"
else
    echo "✅ Installation complete!"
    echo "🚀 Start InterviewSpark by running: $INSTALL_DIR/start.sh"
fi

echo "🌐 Access InterviewSpark at: http://localhost:3000"
EOF

chmod +x $OUTPUT_DIR/install.sh

# Create archive
echo "📦 Creating installer package..."
cd $OUTPUT_DIR
tar -czf "../interviewspark-v$VERSION-$PLATFORM.tar.gz" .
cd - > /dev/null

echo "✅ Installer created: dist/interviewspark-v$VERSION-$PLATFORM.tar.gz"
echo "📋 Package contents:"
echo "   - Self-contained application"
echo "   - Node.js runtime (if bundled)"
echo "   - Installation script"
echo "   - Configuration files"
echo "   - Documentation"

echo "🎉 Installer creation complete!"
