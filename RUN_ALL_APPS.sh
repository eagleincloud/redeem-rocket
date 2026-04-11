#!/bin/bash

# Redeem Rocket - Run All Three Apps
# This script starts all three development servers in the background

cd "$(dirname "$0")"

echo "🚀 Starting Redeem Rocket - All Three Apps"
echo ""

# Kill any existing servers
echo "⏹️ Stopping any existing servers..."
pkill -f vite 2>/dev/null || true
sleep 2

# Clear caches
echo "🧹 Clearing caches..."
rm -rf .next dist dist-business dist-admin 2>/dev/null || true
rm -rf node_modules/.vite 2>/dev/null || true

echo ""
echo "📦 Starting servers..."
echo ""

# Start Customer App (Port 5173)
echo "1️⃣  Customer App (Port 5173)..."
npm run dev > /tmp/customer.log 2>&1 &
CUSTOMER_PID=$!
sleep 3

# Start Business App (Port 5174)
echo "2️⃣  Business App (Port 5174)..."
npm run dev:business > /tmp/business.log 2>&1 &
BUSINESS_PID=$!
sleep 3

# Start Admin App (Port 5175)
echo "3️⃣  Admin App (Port 5175)..."
npm run dev:admin > /tmp/admin.log 2>&1 &
ADMIN_PID=$!
sleep 3

echo ""
echo "✅ All servers started!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🌐 OPEN THESE URLS IN YOUR BROWSER:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🛒 Customer App:  http://localhost:5173"
echo "📊 Business App:  http://localhost:5174/business.html"
echo "🛡️  Admin App:     http://localhost:5175/admin.html"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Process IDs:"
echo "   Customer: $CUSTOMER_PID"
echo "   Business: $BUSINESS_PID"
echo "   Admin:    $ADMIN_PID"
echo ""
echo "📝 Logs:"
echo "   tail -f /tmp/customer.log"
echo "   tail -f /tmp/business.log"
echo "   tail -f /tmp/admin.log"
echo ""
echo "⏹️  To stop all servers:"
echo "   pkill -f vite"
echo ""
echo "═══════════════════════════════════════════════════════════════"

# Keep script running
wait

