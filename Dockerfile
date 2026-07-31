# syntax=docker/dockerfile:1

FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

# ---------- bog'liqliklar ----------
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases/ .yarn/releases/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN yarn install --immutable

# ---------- build ----------
FROM deps AS build
COPY . .
RUN yarn workspace @rieltor/api exec prisma generate
RUN yarn workspace @rieltor/shared build
RUN yarn workspace @rieltor/web build
RUN yarn workspace @rieltor/api build

# ---------- prod bog'liqliklari ----------
FROM deps AS prod-deps
COPY . .
RUN yarn workspace @rieltor/api exec prisma generate
RUN yarn workspace @rieltor/shared build
RUN yarn workspaces focus --production @rieltor/api

# ---------- ishga tushirish ----------
FROM base AS runner
ENV NODE_ENV=production
# sharp glibc talab qiladi — node:22-slim da bor, alpine'da qo'shimcha paket kerak bo'lardi.

# nodeLinker: node-modules bilan Yarn barcha bog'liqliklarni /app/node_modules ga hoisting qiladi —
# apps/api/node_modules va packages/shared/node_modules alohida mavjud emas, shuning uchun faqat ildiz nusxalanadi.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages/shared ./packages/shared

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY package.json ./

# configureApp() shu yo'lni kutadi: apps/api/dist dan ../../web/dist
WORKDIR /app/apps/api
EXPOSE 3000

# Migratsiya har deploy'da, so'ng seed (rasmlarni qayta generatsiya qiladi), so'ng server.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/main"]
