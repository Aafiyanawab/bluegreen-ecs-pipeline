# Stage 1 - Install dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install --production

# Stage 2 - Run the app
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY app.js .
COPY package.json .

# Don't run as root - security best practice
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "app.js"]