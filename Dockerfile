# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

COPY . .
ENV DATABASE_URL=file:./dev.db
RUN npm run postinstall
RUN npx prisma db push && npm run seed
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat openssl

COPY --from=build /app/.output ./.output
COPY --from=build /app/prisma/dev.db ./prisma/dev.db

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
