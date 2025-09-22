#!/bin/bash

# Deployment script for people.com.de
echo "🚀 Deploying to people.com.de..."

# Build the project
echo "📦 Building production version..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed! No build directory found."
    exit 1
fi

echo "✅ Build successful!"

# Display build size
echo "📊 Build size:"
du -sh build/

echo ""
echo "🎯 Next steps:"
echo "1. Upload the 'build' folder contents to your web server"
echo "2. Configure your web server to serve the React app"
echo "3. Update Render environment variables for the whitelisted domain"
echo ""
echo "📁 Build files are ready in the 'build' directory"
echo "🌐 Deploy these files to: http://www.people.com.de/"
