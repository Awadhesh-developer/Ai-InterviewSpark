#!/bin/bash

# InterviewSpark Docker Build Script
set -e

echo "🚀 Building InterviewSpark Docker Images..."

# Build arguments
VERSION=${1:-latest}
REGISTRY=${2:-interviewspark}

echo "📦 Version: $VERSION"
echo "🏷️  Registry: $REGISTRY"

# Build web application
echo "🌐 Building Web Application..."
docker build -t $REGISTRY/interviewspark-web:$VERSION -f apps/web/Dockerfile .

# Build API (if exists)
if [ -f "apps/api/Dockerfile" ]; then
    echo "🔧 Building API..."
    docker build -t $REGISTRY/interviewspark-api:$VERSION -f apps/api/Dockerfile .
fi

# Tag as latest
docker tag $REGISTRY/interviewspark-web:$VERSION $REGISTRY/interviewspark-web:latest

if [ -f "apps/api/Dockerfile" ]; then
    docker tag $REGISTRY/interviewspark-api:$VERSION $REGISTRY/interviewspark-api:latest
fi

echo "✅ Docker images built successfully!"
echo "📋 Available images:"
docker images | grep $REGISTRY

# Optional: Push to registry
read -p "🚀 Push to registry? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing images to registry..."
    docker push $REGISTRY/interviewspark-web:$VERSION
    docker push $REGISTRY/interviewspark-web:latest
    
    if [ -f "apps/api/Dockerfile" ]; then
        docker push $REGISTRY/interviewspark-api:$VERSION
        docker push $REGISTRY/interviewspark-api:latest
    fi
    echo "✅ Images pushed successfully!"
fi

echo "🎉 Build complete!"
