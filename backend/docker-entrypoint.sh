# 1. If using the first approach, create docker-entrypoint.sh
echo '#!/bin/sh
set -e

echo "🚀 Starting AI Lawsuit Backend..."
echo "📍 Environment: ${NODE_ENV:-production}"
echo "🔌 Port: ${PORT:-3000}"

# Handle Coinbase configuration
if [ -n "$COINBASE_API_KEY_NAME" ] && [ -n "$COINBASE_API_KEY_PRIVATE_KEY" ]; then
    echo "✅ Coinbase credentials found in environment (API_KEY_NAME)"
elif [ -n "$COINBASE_PROJECT_ID" ] && [ -n "$COINBASE_PRIVATE_KEY" ]; then
    echo "✅ Coinbase credentials found in environment (PROJECT_ID)"
    export COINBASE_API_KEY_NAME="$COINBASE_PROJECT_ID"
    export COINBASE_API_KEY_PRIVATE_KEY="$COINBASE_PRIVATE_KEY"
else
    echo "⚠️  No Coinbase credentials found - wallet features will be limited"
fi

exec "$@"' > backend/docker-entrypoint.sh

# 2. Make it executable
chmod +x backend/docker-entrypoint.sh

# 3. Add and commit
git add backend/Dockerfile.prod backend/docker-entrypoint.sh
git commit -m "Fix Dockerfile syntax error"

# 4. Push
git push origin main

# 5. Deploy
railway up