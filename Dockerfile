FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/domain/package.json ./packages/domain/package.json
COPY packages/database/package.json ./packages/database/package.json

RUN npm ci

COPY . .

RUN npm run db:generate

EXPOSE 3000

CMD ["npm", "--workspace", "@coritech/web", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
