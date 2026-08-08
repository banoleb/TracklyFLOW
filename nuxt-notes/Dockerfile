# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY . .
ARG API_BASE=http://localhost:5000
ENV API_BASE=$API_BASE
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output /app/.output
ENV HOST=0.0.0.0 PORT=3001 NODE_ENV=production
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
