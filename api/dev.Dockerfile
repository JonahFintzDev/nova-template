# Development Dockerfile for API
FROM node:26

WORKDIR /app

# copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install all dependencies (including dev)
RUN npm ci

# generate prisma client
COPY prisma.config.ts .
COPY prisma ./prisma
ENV DATABASE_URL=postgresql://dev:dev@db:5432/dev
RUN npx prisma generate


# copy additional files
COPY tsconfig.json ./

# copy wait script
COPY --chmod=777 ./entrypoint-dev.sh /app/entrypoint-dev.sh

ENTRYPOINT ["/app/entrypoint-dev.sh"]
