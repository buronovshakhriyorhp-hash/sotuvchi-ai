# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . ./

# Build if needed, but since commonjs, no build
# RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]