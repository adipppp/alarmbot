#!/bin/sh
# Entrypoint script for Discord Alarm Bot
# Handles database migrations and bot startup

set -e  # Exit on error

echo "🤖 Starting Alarm Bot..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✓ DATABASE_URL is configured"

# Run Prisma migrations
echo ""
echo "📦 Running Prisma migrations..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm run migrate

# Check migration result
if [ $? -eq 0 ]; then
  echo "✓ Database migrations completed successfully"
else
  echo "❌ Database migrations failed"
  exit 1
fi

# Start the bot
echo ""
echo "🚀 Starting Discord bot..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exec pnpm start
