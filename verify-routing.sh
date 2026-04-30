#!/bin/bash

echo "Verifying Content-Based Routing Implementation..."
echo ""

# Check all required files exist
echo "✓ Checking required files..."

files=(
    "public/router.html"
    "scripts/merge-builds.mjs"
    "dist-business/router.html"
    "dist-business/business.html"
    "dist-business/admin.html"
    "CONTENT_BASED_ROUTING_IMPLEMENTATION.md"
    "ROUTING_IMPLEMENTATION_SUMMARY.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file MISSING"
    fi
done

echo ""
echo "✓ Checking required directories..."

dirs=(
    "dist-business/assets"
    "dist-business/admin/assets"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir"
    else
        echo "  ✗ $dir MISSING"
    fi
done

echo ""
echo "✓ Checking vercel.json configuration..."
if grep -q '"router.html"' vercel.json; then
    echo "  ✓ vercel.json includes router.html route"
else
    echo "  ✗ vercel.json missing router.html route"
fi

echo ""
echo "✓ Checking package.json build script..."
if grep -q '"build:all"' package.json; then
    echo "  ✓ package.json includes build:all script"
else
    echo "  ✗ package.json missing build:all script"
fi

echo ""
echo "✓ File sizes..."
if [ -f "dist-business/router.html" ]; then
    size=$(wc -c < dist-business/router.html)
    echo "  ✓ router.html: $size bytes"
fi

if [ -f "dist-business/admin.html" ]; then
    size=$(wc -c < dist-business/admin.html)
    echo "  ✓ admin.html: $size bytes"
fi

if [ -f "dist-business/business.html" ]; then
    size=$(wc -c < dist-business/business.html)
    echo "  ✓ business.html: $size bytes"
fi

echo ""
echo "✓ Asset counts..."
if [ -d "dist-business/assets" ]; then
    count=$(find dist-business/assets -type f | wc -l)
    echo "  ✓ Business assets: $count files"
fi

if [ -d "dist-business/admin/assets" ]; then
    count=$(find dist-business/admin/assets -type f | wc -l)
    echo "  ✓ Admin assets: $count files"
fi

echo ""
echo "✅ Routing implementation verification complete!"
