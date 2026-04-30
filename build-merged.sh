#!/bin/bash
echo "🔨 Building Business App..."
npm run build:business

echo "🔨 Building Admin App..."
npm run build:admin

echo "📦 Merging admin into dist-business..."
mkdir -p dist-business/admin

# Copy admin assets and files to admin subdirectory
# First, copy everything EXCEPT admin.html
cp -r dist-admin/assets dist-business/admin/ 2>/dev/null || true

# Then, copy admin.html and rename it to index.html in the admin subdirectory
if [ -f dist-admin/admin.html ]; then
  cp dist-admin/admin.html dist-business/admin/index.html
  echo "✅ Copied admin.html → admin/index.html"
else
  echo "⚠️ Warning: dist-admin/admin.html not found"
fi

# Also remove any stray admin.html from root (if it exists from previous builds)
if [ -f dist-business/admin.html ]; then
  rm dist-business/admin.html
  echo "✅ Removed stray admin.html from root"
fi

echo "✅ Build complete - both apps in dist-business"
