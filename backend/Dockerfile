# ============================================================
# DevSchool Pro — Multi-Stage Dockerfile
# ============================================================
# Stage 1: Builder — installs all deps + compiles TypeScript
# Stage 2: Production — only production deps + compiled code
# Non-root user for security
# ============================================================

# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching — only reinstalls if package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY . .
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────
FROM node:20-alpine AS production

# Security: create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy prisma schema (needed for prisma generate at runtime)
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client for production
RUN npx prisma generate

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R appuser:appgroup logs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 4000

# Health check — used by Docker Compose and AWS ECS
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Start the server
CMD ["node", "dist/server.js"]
