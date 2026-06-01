# Development Dockerfile for Dashboard
FROM node:24

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Expose port
EXPOSE 3001

# Start the development server
CMD ["npm", "run", "dev"]
