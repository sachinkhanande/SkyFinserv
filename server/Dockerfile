FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/db/schema.ts ./src/db/schema.ts
COPY package*.json ./
COPY drizzle.config.ts ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
