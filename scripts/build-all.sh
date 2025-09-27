#!/bin/bash

# InterviewSpark Complete Build Script
set -e

VERSION=${1:-2.0.0}
BUILD_TYPE=${2:-all}

echo "🚀 InterviewSpark Build System v$VERSION"
echo "========================================"

# Function to build Docker images
build_docker() {
    echo "🐳 Building Docker images..."
    chmod +x scripts/build-docker.sh
    ./scripts/build-docker.sh $VERSION
}

# Function to build desktop app
build_desktop() {
    echo "🖥️  Building desktop application..."
    cd apps/desktop
    npm install
    npm run dist
    cd ../..
    echo "✅ Desktop builds available in apps/desktop/dist/"
}

# Function to build installer
build_installer() {
    echo "📦 Building installer packages..."
    chmod +x scripts/create-installer.sh
    
    # Build for different platforms
    ./scripts/create-installer.sh $VERSION linux
    ./scripts/create-installer.sh $VERSION windows
    ./scripts/create-installer.sh $VERSION macos
    
    echo "✅ Installer packages available in dist/"
}

# Function to prepare cloud deployment
prepare_cloud() {
    echo "☁️  Preparing cloud deployment packages..."
    
    # Vercel deployment
    echo "📤 Vercel configuration ready: deploy/vercel.json"
    
    # AWS CloudFormation
    echo "🏗️  AWS CloudFormation template ready: deploy/aws/cloudformation.yml"
    
    # Create deployment archive
    mkdir -p dist/cloud
    tar -czf dist/cloud/interviewspark-cloud-v$VERSION.tar.gz \
        apps/web \
        deploy/ \
        package.json \
        README.md
    
    echo "✅ Cloud deployment package: dist/cloud/interviewspark-cloud-v$VERSION.tar.gz"
}

# Main build logic
case $BUILD_TYPE in
    "docker")
        build_docker
        ;;
    "desktop")
        build_desktop
        ;;
    "installer")
        build_installer
        ;;
    "cloud")
        prepare_cloud
        ;;
    "all")
        echo "🔄 Building all package types..."
        build_docker
        build_desktop
        build_installer
        prepare_cloud
        ;;
    *)
        echo "❌ Unknown build type: $BUILD_TYPE"
        echo "Available options: docker, desktop, installer, cloud, all"
        exit 1
        ;;
esac

echo ""
echo "🎉 Build complete! Available packages:"
echo "📁 Docker images: interviewspark/interviewspark-web:$VERSION"
echo "📁 Desktop apps: apps/desktop/dist/"
echo "📁 Installers: dist/interviewspark-v$VERSION-*.tar.gz"
echo "📁 Cloud package: dist/cloud/interviewspark-cloud-v$VERSION.tar.gz"
echo ""
echo "📖 Deployment instructions:"
echo "   Docker: docker-compose up -d"
echo "   Desktop: Install from apps/desktop/dist/"
echo "   Installer: Extract and run install.sh"
echo "   Cloud: Deploy using platform-specific configs"
