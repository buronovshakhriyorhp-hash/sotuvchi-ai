# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source
COPY backend/ ./

# Build if needed, but since commonjs, no build
# RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]