# Production Dockerfile for Railway
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build contracts (generate artifacts) - only if hardhat.config.cjs exists
RUN if [ -f "hardhat.config.cjs" ]; then \
      echo "🔨 Compiling contracts..."; \
      npx hardhat compile || echo "⚠️  Contract compilation failed, continuing..."; \
    else \
      echo "ℹ️  No Hardhat config found, skipping contract compilation"; \
    fi

# Create production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache curl tini

# Create app directory
WORKDIR /app

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/contracts ./contracts 2>/dev/null || true
COPY --from=builder /app/artifacts ./artifacts 2>/dev/null || true
COPY --from=builder /app/cache ./cache 2>/dev/null || true
COPY --from=builder /app/scripts ./scripts 2>/dev/null || true
COPY --from=builder /app/*.js* ./ 2>/dev/null || true
COPY --from=builder /app/*.json ./ 2>/dev/null || true

# Copy the entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# Create necessary directories with correct permissions
RUN mkdir -p \
    /app/cases \
    /app/data/settlements \
    /app/wallets/cases \
    /app/cache \
    /app/logs \
    /app/temp && \
    chmod +x /app/docker-entrypoint.sh && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_OPTIONS="--max-old-space-size=512"

# Expose port (Railway provides PORT env var)
EXPOSE 3000

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--", "/app/docker-entrypoint.sh"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start the application
CMD ["node", "src/app.js"]
