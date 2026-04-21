# Multi-stage build for Mobile/Progressive Web App Client - PRODUCTION READY
# Stage 1: Build with Node
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install

# Copy source files
COPY . .

# Build
RUN npm run build || npm run dist || (mkdir -p dist && cp index.html dist/)

# Stage 2: Runtime with Nginx
# Use a current nginx-alpine tag to stay on a supported Alpine release.
FROM nginx:1.27-alpine

# Install curl for health checks
RUN apk upgrade --no-cache && apk add --no-cache curl

# Create directories with write permissions for nginx user
RUN mkdir -p /var/run/nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/run/nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html && \
    chmod 775 /var/run/nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html

# Remove default config BEFORE copying custom ones
RUN rm -f /etc/nginx/conf.d/*.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Ensure config permissions
RUN chmod 644 /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf && \
    chown nginx:nginx /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY --from=build /app/dist /usr/share/nginx/html/
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod 755 /usr/share/nginx/html

# Drop to non-root
USER nginx

EXPOSE 8080

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
