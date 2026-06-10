# Multi-stage production build for Vite React frontend
FROM node:20-alpine AS build-env
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy all source files
COPY . ./

# Build-time environment variable to support relative Nginx reverse proxying
ENV VITE_API_BASE_URL=""

# Build production static bundle
RUN npm run build

# Nginx web server runtime stage
FROM nginx:alpine
COPY --from=build-env /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
