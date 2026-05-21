# State 1: Build compilation
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install all dependencies (development + production)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Compile built artifacts
RUN npm run build

# Stage 2: Minimalist production runtime container
FROM node:20-alpine AS runner

WORKDIR /app

# Configure application environment
ENV NODE_ENV=production

# Copy only build artifacts, dependency configuration, and initial state files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install strictly production dependencies to optimize start-up duration and size
RUN npm ci --only=production

# Cloud Run binds to dynamic port - default documentation port
EXPOSE 8080

# Start command
CMD ["npm", "start"]
