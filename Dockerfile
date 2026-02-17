# ---------- Build Stage ----------
FROM node:24-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ---------- Production Stage ----------
FROM node:24-slim

WORKDIR /app

COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8000

CMD ["node", "dist/src/main.js"]
