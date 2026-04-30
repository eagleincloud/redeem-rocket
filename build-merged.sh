#!/bin/bash
echo "🔨 Building Business App..."
npm run build:business

echo "🔨 Building Admin App..."
npm run build:admin

echo "📦 Merging admin into dist-business..."
mkdir -p dist-business/admin
cp -r dist-admin/* dist-business/admin/

echo "📝 Renaming admin.html to index.html for Vercel routing..."
if [ -f dist-business/admin/admin.html ]; then
  mv dist-business/admin/admin.html dist-business/admin/index.html
  echo "✅ Renamed admin.html → index.html"
fi

echo "✅ Build complete - both apps in dist-business"
