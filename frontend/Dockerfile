# ============================================================
# DevSchool Pro — Frontend Dockerfile (Multi-Stage)
# ============================================================
# Stage 1: Build React app with Vite
# Stage 2: Serve static files with Nginx (tiny ~25MB image)
# ============================================================

# ── Stage 1: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root (nginx user already exists in nginx:alpine)
# Expose port 80 for internal Docker networking
EXPOSE 80

# Nginx runs in foreground
CMD ["nginx", "-g", "daemon off;"]
