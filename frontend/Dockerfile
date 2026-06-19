# Stage 1: Build the React Application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package descriptors and install packages
COPY package*.json ./
RUN npm ci

# Copy source code and build project
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine-slim

# Copy compiled static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx port
EXPOSE 80

# Launch server
CMD ["nginx", "-g", "daemon off;"]
