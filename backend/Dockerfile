# Multi-stage build for better security and smaller image
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci 

# Build contracts (generate artifacts)
RUN npx hardhat compile

# Copy source code
COPY . .

# Create production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app ./

# Create necessary directories with proper permissions
RUN mkdir -p /app/cases /app/data /app/cache /app/wallets /app/data/settlements && \
    chown -R nodejs:nodejs /app/cases /app/data /app/cache /app/wallets /app/data/settlements

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"] 