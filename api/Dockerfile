# --------------------------------------------------
# dashboard build stage
# --------------------------------------------------
FROM node:26 AS dashboard-build-stage

WORKDIR /build/dashboard

# Copy package files
COPY dashboard/package.json ./
COPY dashboard/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY dashboard ./

# Build the application
RUN npm run build

# --------------------------------------------------
# production stage
# --------------------------------------------------
FROM node:26 AS production
WORKDIR /app

# Copy package files
COPY api/package.json ./
COPY api/package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Prisma schema + generate client for runtime
COPY api/prisma ./prisma
COPY api/prisma.config.ts ./
ENV DATABASE_URL=postgresql://dev:dev@db:5432/dev
RUN npx prisma generate

# Copy source files
COPY api/ ./

# Copy built files from builder
COPY --from=builder /build/dashboard /dashboard

# Start the application
ENTRYPOINT [ "/app/entrypoint.sh" ]
