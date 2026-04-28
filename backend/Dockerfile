# Backend Dockerfile
FROM node:20-slim

# Install OpenSSL + curl (required by Prisma engine and Docker healthcheck)
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for prisma CLI)
RUN npm install

# Copy source
COPY . ./

# Generate Prisma Client
RUN npx prisma generate

# Remove devDependencies to keep image small
RUN npm prune --production

EXPOSE 5000

# Run migrations first, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]