FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/domain/package.json ./packages/domain/package.json
COPY packages/database/package.json ./packages/database/package.json

RUN npm ci

COPY . .

ENV CORITECH_ENVIRONMENT=local \
    NODE_ENV=production \
    NEXT_PUBLIC_APP_NAME="CoriTech MVP" \
    APP_BASE_URL=http://localhost:3000 \
    API_BASE_URL=http://localhost:3000 \
    DATABASE_URL=postgresql://coritech:coritech_dev_password@db:5432/coritech_mvp?schema=public \
    AUDIT_LOG_RETENTION_DAYS=30 \
    AUTH_PROVIDER_CLIENT_ID=docker-build-managed-auth-client \
    AUTH_PROVIDER_CLIENT_SECRET=docker-build-managed-auth-secret \
    AUTH_PROVIDER_DOMAIN=https://accounts.google.com \
    AUTH_SESSION_SECRET=docker-build-session-secret \
    EMAIL_PROVIDER=console \
    EMAIL_PROVIDER_API_KEY=docker-build-email-placeholder \
    EMAIL_PROVIDER_ENDPOINT=http://localhost:3000/api/dev-email \
    EMAIL_FROM_ADDRESS=support@local.coritech.test \
    EMAIL_FROM_NAME="CoriTech Local" \
    MONITORING_PROVIDER=console \
    MONITORING_ENDPOINT=http://localhost:3000/api/dev-monitoring \
    ERROR_TRACKING_DSN=docker-build-error-tracking-disabled \
    OBJECT_STORAGE_PROVIDER=minio \
    OBJECT_STORAGE_ENDPOINT=minio \
    OBJECT_STORAGE_PORT=9000 \
    OBJECT_STORAGE_USE_SSL=false \
    OBJECT_STORAGE_BUCKET=coritech-local-dev \
    OBJECT_STORAGE_REGION=local-dev \
    OBJECT_STORAGE_ACCESS_KEY=coritech_minio_dev \
    OBJECT_STORAGE_SECRET_KEY=coritech_minio_dev_password \
    PAYMENT_PROVIDER_SECRET=docker-build-payment-placeholder \
    LOGISTICS_PROVIDER_API_KEY=docker-build-logistics-placeholder

RUN npm run db:generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "--workspace", "@coritech/web", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
