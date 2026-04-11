# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start application
CMD ["serve", "-s", "dist", "-l", "3000"]
