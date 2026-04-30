#!/bin/bash
echo "🔨 Building Business App..."
npm run build:business

echo "🔨 Building Admin App..."
npm run build:admin

echo "📦 Merging admin into dist-business..."
mkdir -p dist-business/admin
cp -r dist-admin/* dist-business/admin/

echo "✅ Build complete - both apps in dist-business"
