# Phase 1: Marketplace Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the seeded demo into a real marketplace where a person can register, publish a listing through moderation, and where the desktop layout follows CIAN's information architecture.

**Architecture:** Keep the existing monorepo and FSD layering. Add a `User`/`Session` layer to the API with phone-OTP and Telegram login, an `Organization`-free single-user ownership model for listings (organizations arrive in Phase 5), and a listing lifecycle state machine. On the frontend, rebuild the desktop (`desk:`, ≥1440px) presentation of list pages into CIAN's three-column result row; the phone layout below 1440px stays untouched.

**Tech Stack:** NestJS 11 · Prisma 6 · PostgreSQL 16 · Zod · React 19 · Vite 6 · Tailwind v4 · React Router 7 · TanStack Query 5 · Feature-Sliced Design

**Spec:** `docs/superpowers/specs/2026-08-21-platform-spec.md`

## Global Constraints

- Code in English only — identifiers, routes, comments. User-facing copy is Uzbek.
- Do not write automated tests unless explicitly asked. Verification is lint, typecheck, and a real browser check.
- Below 1440px nothing may change. Every desktop style is written under the `desk:` variant.
- Every listing URL must still produce a correct Telegram OG preview.
- Content container: max 1440px, 32px side padding. Accent `#6d28d9`, surface `#f4f4f7`, card radius 18px, Inter.
- FSD boundaries are ESLint-enforced: `app → pages → widgets → features → entities → shared`. A widget may not import another widget.
- Commit after every task.

---

### Task 1: User and Session data model

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_add_user_session/migration.sql` (generated)

**Interfaces:**

- Produces: Prisma models `User`, `Session`, `OtpCode`; enum `UserRole`; `Listing.ownerId` nullable relation to `User`.

- [ ] **Step 1: Add the models to the schema**

Append to `apps/api/prisma/schema.prisma`:

```prisma
enum UserRole {
  USER
  REALTOR
  MODERATOR
  ADMIN
}

model User {
  id         String    @id @default(cuid())
  /// E.164 without the plus: "998901234567". Unique across the platform.
  phone      String    @unique
  name       String?
  /// Telegram numeric id, present only when the account was created via Telegram Login.
  telegramId String?   @unique
  photoUrl   String?
  role       UserRole  @default(USER)
  createdAt  DateTime  @default(now())
  sessions   Session[]
  listings   Listing[]
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  /// SHA-256 of the refresh token. The raw token never touches the database.
  refreshHash  String   @unique
  userAgent    String?
  createdAt    DateTime @default(now())
  expiresAt    DateTime

  @@index([userId])
}

model OtpCode {
  id        String   @id @default(cuid())
  phone     String
  /// SHA-256 of the six digits, same reasoning as Session.refreshHash.
  codeHash  String
  attempts  Int      @default(0)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([phone])
}
```

- [ ] **Step 2: Give Listing an owner**

In the existing `model Listing`, add these two lines above `@@index([type])`:

```prisma
  /// Null for the seeded demo rows, which predate accounts.
  ownerId     String?
  owner       User?       @relation(fields: [ownerId], references: [id], onDelete: SetNull)
```

And add to the index block:

```prisma
  @@index([ownerId])
```

- [ ] **Step 3: Create and apply the migration**

Run: `yarn workspace @rieltor/api prisma migrate dev --name add_user_session`
Expected: migration applied, client regenerated, no data loss prompt (all new columns are nullable).

- [ ] **Step 4: Verify the client typechecks**

Run: `yarn typecheck`
Expected: 4 successful tasks.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma
git commit -m "feat(api): add User, Session and OtpCode models"
```

---

### Task 2: OTP request and verification endpoints

**Files:**

- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/token.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `packages/shared/src/schemas.ts`

**Interfaces:**

- Consumes: Prisma models from Task 1.
- Produces: `POST /api/auth/otp/request { phone } → { expiresInSec: number }`; `POST /api/auth/otp/verify { phone, code } → { accessToken, refreshToken, user }`; Zod schemas `OtpRequestSchema`, `OtpVerifySchema`, `AuthUserSchema`, `AuthTokensSchema`; `TokenService.issue(userId, userAgent)`, `TokenService.rotate(refreshToken)`, `TokenService.revoke(refreshToken)`.

- [ ] **Step 1: Add the shared schemas**

Append to `packages/shared/src/schemas.ts`:

```ts
/** Uzbek mobile numbers, E.164 without the plus. */
export const PhoneSchema = z
  .string()
  .regex(/^998\d{9}$/, 'Telefon raqami 998 bilan boshlanishi va 12 raqamdan iborat bo‘lishi kerak');

export const OtpRequestSchema = z.object({ phone: PhoneSchema });

export const OtpVerifySchema = z.object({
  phone: PhoneSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const AuthUserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  photoUrl: z.string().nullable(),
  role: z.enum(['USER', 'REALTOR', 'MODERATOR', 'ADMIN']),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: AuthUserSchema,
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
```

- [ ] **Step 2: Write the token service**

Create `apps/api/src/auth/token.service.ts`:

```ts
import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

/** Refresh tokens live for 30 days; access tokens for 15 minutes. */
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async issue(userId: string, userAgent?: string) {
    const refreshToken = randomBytes(32).toString('hex');

    await this.prisma.session.create({
      data: {
        userId,
        refreshHash: hash(refreshToken),
        userAgent: userAgent ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    const accessToken = await this.jwt.signAsync({ sub: userId });
    return { accessToken, refreshToken };
  }

  /** One-time use: the old session row is deleted as the new one is written. */
  async rotate(refreshToken: string, userAgent?: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshHash: hash(refreshToken) },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessiya muddati tugagan');
    }

    await this.prisma.session.delete({ where: { id: session.id } });
    return this.issue(session.userId, userAgent);
  }

  async revoke(refreshToken: string) {
    await this.prisma.session
      .delete({ where: { refreshHash: hash(refreshToken) } })
      .catch(() => undefined);
  }
}
```

- [ ] **Step 3: Write the auth service**

Create `apps/api/src/auth/auth.service.ts`:

```ts
import { createHash, randomInt } from 'node:crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

const OTP_TTL_SEC = 120;
const MAX_ATTEMPTS = 5;

function hash(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async requestOtp(phone: string) {
    // One live code per phone: issuing a new one invalidates the previous.
    await this.prisma.otpCode.deleteMany({ where: { phone } });

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash: hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_SEC * 1000),
      },
    });

    // The SMS provider arrives in Task 4. Until then the code goes to the log so
    // the flow is testable end to end in development.
    this.logger.log(`OTP for ${phone}: ${code}`);

    return { expiresInSec: OTP_TTL_SEC };
  }

  async verifyOtp(phone: string, code: string, userAgent?: string) {
    const record = await this.prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Kod muddati tugagan, qaytadan so‘rang');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Urinishlar tugadi, qaytadan so‘rang');
    }

    if (record.codeHash !== hash(code)) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Kod noto‘g‘ri');
    }

    await this.prisma.otpCode.delete({ where: { id: record.id } });

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const tokens = await this.tokens.issue(user.id, userAgent);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        photoUrl: user.photoUrl,
        role: user.role,
      },
    };
  }
}
```

- [ ] **Step 4: Write the controller**

Create `apps/api/src/auth/auth.controller.ts`:

```ts
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { OtpRequestSchema, OtpVerifySchema } from '@rieltor/shared';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() body: unknown) {
    const { phone } = OtpRequestSchema.parse(body);
    return this.auth.requestOtp(phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: unknown, @Headers('user-agent') userAgent?: string) {
    const { phone, code } = OtpVerifySchema.parse(body);
    return this.auth.verifyOtp(phone, code, userAgent);
  }
}
```

- [ ] **Step 5: Wire the module**

Create `apps/api/src/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  exports: [TokenService],
})
export class AuthModule {}
```

Add `AuthModule` to the `imports` array in `apps/api/src/app.module.ts`.

Add `JWT_SECRET: z.string().min(32)` to the env schema in `apps/api/src/config/`, and a `JWT_SECRET=` line to `apps/api/.env.example`.

Install the dependency: `yarn workspace @rieltor/api add @nestjs/jwt`

- [ ] **Step 6: Verify by hand**

Start the API, then:

```bash
curl -s -X POST localhost:3000/api/auth/otp/request -H 'content-type: application/json' -d '{"phone":"998901234567"}'
```

Expected: `{"expiresInSec":120}` and the code printed in the API log. Then verify with that code:

```bash
curl -s -X POST localhost:3000/api/auth/otp/verify -H 'content-type: application/json' -d '{"phone":"998901234567","code":"<code from log>"}'
```

Expected: JSON containing `accessToken`, `refreshToken` and a `user` object.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.module.ts packages/shared/src/schemas.ts apps/api/.env.example
git commit -m "feat(api): phone OTP authentication with rotating refresh tokens"
```

---

### Task 3: Telegram Login

**Files:**

- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `packages/shared/src/schemas.ts`

**Interfaces:**

- Consumes: `TokenService.issue` from Task 2.
- Produces: `POST /api/auth/telegram { id, first_name, username?, photo_url?, auth_date, hash } → AuthTokens`; Zod schema `TelegramAuthSchema`.

- [ ] **Step 1: Add the shared schema**

Append to `packages/shared/src/schemas.ts`:

```ts
/** The payload the Telegram Login widget hands back, verbatim. */
export const TelegramAuthSchema = z.object({
  id: z.number().int(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number().int(),
  hash: z.string(),
});
```

- [ ] **Step 2: Add signature verification and login to the service**

Add to `apps/api/src/auth/auth.service.ts` — imports first:

```ts
import { createHmac } from 'node:crypto';
```

Then the method, inside the class:

```ts
  /**
   * Telegram signs the payload with HMAC-SHA256 where the key is SHA-256 of the
   * bot token. Without this check anyone could POST an arbitrary telegram id and
   * take over an account.
   */
  async loginWithTelegram(
    payload: Record<string, string | number>,
    userAgent?: string,
  ) {
    const { hash: providedHash, ...fields } = payload;

    const checkString = Object.keys(fields)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join('\n');

    const secret = createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN ?? '').digest();
    const expected = createHmac('sha256', secret).update(checkString).digest('hex');

    if (expected !== providedHash) {
      throw new BadRequestException('Telegram imzosi noto‘g‘ri');
    }

    // Telegram recommends rejecting payloads older than a day.
    const ageSec = Date.now() / 1000 - Number(fields.auth_date);
    if (ageSec > 86_400) {
      throw new BadRequestException('Telegram sessiyasi eskirgan');
    }

    const telegramId = String(fields.id);

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        name: String(fields.first_name),
        photoUrl: fields.photo_url ? String(fields.photo_url) : null,
      },
      create: {
        telegramId,
        // Telegram never gives us a phone through the login widget. The account
        // is usable immediately; the phone is collected when the user first
        // publishes a listing.
        phone: `tg:${telegramId}`,
        name: String(fields.first_name),
        photoUrl: fields.photo_url ? String(fields.photo_url) : null,
      },
    });

    const tokens = await this.tokens.issue(user.id, userAgent);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        photoUrl: user.photoUrl,
        role: user.role,
      },
    };
  }
```

- [ ] **Step 3: Add the route**

In `apps/api/src/auth/auth.controller.ts` add the import `TelegramAuthSchema` and the handler:

```ts
  @Post('telegram')
  loginWithTelegram(@Body() body: unknown, @Headers('user-agent') userAgent?: string) {
    const payload = TelegramAuthSchema.parse(body);
    return this.auth.loginWithTelegram(payload, userAgent);
  }
```

Add `TELEGRAM_BOT_TOKEN: z.string()` to the env schema and `TELEGRAM_BOT_TOKEN=` to `.env.example`.

- [ ] **Step 4: Verify the signature check rejects a forgery**

```bash
curl -s -X POST localhost:3000/api/auth/telegram -H 'content-type: application/json' \
  -d '{"id":1,"first_name":"X","auth_date":1,"hash":"deadbeef"}'
```

Expected: HTTP 400, `"Telegram imzosi noto'g'ri"`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth packages/shared/src/schemas.ts apps/api/.env.example
git commit -m "feat(api): Telegram Login with HMAC signature verification"
```

---

### Task 4: Auth guard and current-user endpoint

**Files:**

- Create: `apps/api/src/auth/jwt.guard.ts`
- Create: `apps/api/src/auth/current-user.decorator.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`

**Interfaces:**

- Produces: `JwtGuard` (use as `@UseGuards(JwtGuard)`); `@CurrentUser()` parameter decorator yielding `{ id: string; role: UserRole }`; `GET /api/auth/me → AuthUser`; `POST /api/auth/refresh { refreshToken } → AuthTokens`; `POST /api/auth/logout { refreshToken } → 204`.

- [ ] **Step 1: Write the guard**

Create `apps/api/src/auth/jwt.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();

    try {
      const { sub } = await this.jwt.verifyAsync(header.slice(7));
      const user = await this.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, role: true },
      });

      if (!user) throw new UnauthorizedException();

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

- [ ] **Step 2: Write the decorator**

Create `apps/api/src/auth/current-user.decorator.ts`:

```ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest().user as { id: string; role: string };
});
```

- [ ] **Step 3: Add the three routes**

In `apps/api/src/auth/auth.controller.ts`:

```ts
  @Get('me')
  @UseGuards(JwtGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.auth.findById(user.id);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }, @Headers('user-agent') userAgent?: string) {
    return this.tokens.rotate(body.refreshToken, userAgent);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: { refreshToken: string }) {
    await this.tokens.revoke(body.refreshToken);
  }
```

Inject `TokenService` into the controller constructor, and add `findById` to `AuthService`:

```ts
  async findById(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, phone: true, name: true, photoUrl: true, role: true },
    });
    return user;
  }
```

- [ ] **Step 4: Verify**

```bash
curl -s localhost:3000/api/auth/me -H "Authorization: Bearer <accessToken from Task 2>"
```

Expected: the user JSON. Without the header: HTTP 401.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth
git commit -m "feat(api): JWT guard, current user, refresh and logout"
```

---

### Task 5: Listing lifecycle and ownership

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/listings/listings.service.ts`
- Modify: `packages/shared/src/schemas.ts`

**Interfaces:**

- Produces: Prisma enum `ListingStatus { DRAFT MODERATION PUBLISHED REJECTED ARCHIVED }`; `Listing.status`, `Listing.rejectionReason`, `Listing.publishedAt`; public queries filter to `PUBLISHED`.

- [ ] **Step 1: Extend the schema**

Add the enum and three fields to `model Listing`:

```prisma
enum ListingStatus {
  DRAFT
  MODERATION
  PUBLISHED
  REJECTED
  ARCHIVED
}
```

```prisma
  /// Seeded demo rows are published; anything a user creates starts as DRAFT.
  status          ListingStatus @default(PUBLISHED)
  rejectionReason String?
  publishedAt     DateTime?
```

Add `@@index([status])` to the index block.

- [ ] **Step 2: Migrate**

Run: `yarn workspace @rieltor/api prisma migrate dev --name add_listing_status`
Expected: applied; existing rows default to `PUBLISHED`, so the public site is unaffected.

- [ ] **Step 3: Filter the public queries**

In `apps/api/src/listings/listings.service.ts`, add `status: 'PUBLISHED'` to the `where` clause of both the list query and the single-listing query.

- [ ] **Step 4: Verify nothing disappeared**

```bash
curl -s localhost:3000/api/objects | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
```

Expected: the same count as before the change.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma apps/api/src/listings
git commit -m "feat(api): listing lifecycle status, public queries show published only"
```

---

### Task 6: Listing create and update endpoints

**Files:**

- Create: `apps/api/src/listings/listing-draft.controller.ts`
- Modify: `apps/api/src/listings/listings.service.ts`
- Modify: `apps/api/src/listings/listings.module.ts`
- Modify: `packages/shared/src/schemas.ts`

**Interfaces:**

- Consumes: `JwtGuard`, `@CurrentUser()` from Task 4; `ListingStatus` from Task 5.
- Produces: `ListingDraftSchema`; `POST /api/my/listings → { id }`; `PATCH /api/my/listings/:id`; `POST /api/my/listings/:id/submit`; `GET /api/my/listings`.

- [ ] **Step 1: Add the draft schema**

Append to `packages/shared/src/schemas.ts`:

```ts
/**
 * Everything the six-step wizard collects. Every field is optional because a
 * draft is saved after each step; the submit endpoint is what enforces
 * completeness.
 */
export const ListingDraftSchema = z.object({
  deal: DealSchema.optional(),
  type: ListingTypeSchema.optional(),
  district: z.string().min(2).optional(),
  address: z.string().min(4).optional(),
  landmark: z.string().min(2).optional(),
  rooms: z.number().int().min(0).max(20).nullable().optional(),
  areaM2: z.number().positive().max(10_000).optional(),
  floor: z.string().nullable().optional(),
  title: z.string().min(10).max(120).optional(),
  description: z.string().min(20).max(4000).optional(),
  priceSom: z.string().regex(/^\d+$/).optional(),
  priceUsd: z.number().int().positive().optional(),
});

/** Fields that must be present before a draft may go to moderation. */
export const LISTING_REQUIRED_FIELDS = [
  'deal',
  'type',
  'district',
  'address',
  'landmark',
  'areaM2',
  'title',
  'description',
  'priceSom',
  'priceUsd',
] as const;
```

- [ ] **Step 2: Add the service methods**

Add to `apps/api/src/listings/listings.service.ts`:

```ts
  async createDraft(ownerId: string) {
    const listing = await this.prisma.listing.create({
      data: {
        id: `u-${randomBytes(6).toString('hex')}`,
        ownerId,
        status: 'DRAFT',
        // Placeholders that the wizard overwrites step by step. The columns are
        // non-null in the schema, which the seeded rows rely on.
        title: '',
        priceSom: 0n,
        priceUsd: 0,
        areaM2: 0,
        district: '',
        address: '',
        landmark: '',
        description: '',
        type: 'SECONDARY',
        deal: 'SALE',
        listedAt: new Date(),
        agentId: DEFAULT_AGENT_ID,
      },
      select: { id: true },
    });

    return listing;
  }

  async updateDraft(id: string, ownerId: string, patch: Record<string, unknown>) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!listing || listing.ownerId !== ownerId) throw new NotFoundException();
    if (listing.status === 'PUBLISHED') {
      throw new BadRequestException('E’lon tahrirlash uchun avval arxivlanishi kerak');
    }

    const data = { ...patch };
    if (typeof data.priceSom === 'string') data.priceSom = BigInt(data.priceSom);

    await this.prisma.listing.update({ where: { id }, data });
  }

  async submitForModeration(id: string, ownerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing || listing.ownerId !== ownerId) throw new NotFoundException();

    const missing = LISTING_REQUIRED_FIELDS.filter((field) => {
      const value = listing[field as keyof typeof listing];
      return value === null || value === undefined || value === '' || value === 0;
    });

    if (missing.length > 0) {
      throw new BadRequestException(`To‘ldirilmagan maydonlar: ${missing.join(', ')}`);
    }

    const images = await this.prisma.image.count({ where: { listingId: id } });
    if (images === 0) throw new BadRequestException('Kamida bitta rasm yuklang');

    await this.prisma.listing.update({
      where: { id },
      data: { status: 'MODERATION', rejectionReason: null },
    });
  }

  listMine(ownerId: string) {
    return this.prisma.listing.findMany({
      where: { ownerId },
      orderBy: { listedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        rejectionReason: true,
        priceSom: true,
        deal: true,
      },
    });
  }
```

Add the imports it needs: `randomBytes` from `node:crypto`, `BadRequestException` and `NotFoundException` from `@nestjs/common`, `LISTING_REQUIRED_FIELDS` from `@rieltor/shared`. Define `DEFAULT_AGENT_ID` as the seeded agency agent id — user listings are attributed to their own account in Phase 3, when the realtor profile exists.

Serialise `priceSom` with `.toString()` before returning it, the same way the existing list endpoint does.

- [ ] **Step 3: Write the controller**

Create `apps/api/src/listings/listing-draft.controller.ts`:

```ts
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ListingDraftSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ListingsService } from './listings.service';

@Controller('api/my/listings')
@UseGuards(JwtGuard)
export class ListingDraftController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  listMine(@CurrentUser() user: { id: string }) {
    return this.listings.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }) {
    return this.listings.createDraft(user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.listings.updateDraft(id, user.id, ListingDraftSchema.parse(body));
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.listings.submitForModeration(id, user.id);
  }
}
```

Register it in `apps/api/src/listings/listings.module.ts` and import `AuthModule` there so `JwtGuard` can resolve `JwtService`.

- [ ] **Step 4: Verify the full draft flow**

```bash
TOKEN="<accessToken>"
ID=$(curl -s -X POST localhost:3000/api/my/listings -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
curl -s -X PATCH localhost:3000/api/my/listings/$ID -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"title":"Test e’lon sarlavhasi","areaM2":58}'
curl -s -X POST localhost:3000/api/my/listings/$ID/submit -H "Authorization: Bearer $TOKEN"
```

Expected: the submit call returns HTTP 400 listing the still-missing fields — that is the validation working.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/listings packages/shared/src/schemas.ts
git commit -m "feat(api): listing draft create, patch and submit for moderation"
```

---

### Task 7: Moderation queue

**Files:**

- Create: `apps/api/src/listings/moderation.controller.ts`
- Create: `apps/api/src/auth/roles.guard.ts`
- Modify: `apps/api/src/listings/listings.service.ts`

**Interfaces:**

- Produces: `RolesGuard` + `@Roles('MODERATOR','ADMIN')`; `GET /api/moderation/listings`; `POST /api/moderation/listings/:id/approve`; `POST /api/moderation/listings/:id/reject { reason }`.

- [ ] **Step 1: Write the roles guard**

Create `apps/api/src/auth/roles.guard.ts`:

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowed?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!allowed.includes(user?.role)) throw new ForbiddenException();

    return true;
  }
}
```

- [ ] **Step 2: Add the service methods**

```ts
  listForModeration() {
    return this.prisma.listing.findMany({
      where: { status: 'MODERATION' },
      orderBy: { listedAt: 'asc' },
      include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    });
  }

  async approve(id: string) {
    await this.prisma.listing.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), rejectionReason: null },
    });
  }

  async reject(id: string, reason: string) {
    await this.prisma.listing.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
  }
```

- [ ] **Step 3: Write the controller**

Create `apps/api/src/listings/moderation.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { ListingsService } from './listings.service';

@Controller('api/moderation/listings')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class ModerationController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  queue() {
    return this.listings.listForModeration();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.listings.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.listings.reject(id, body.reason);
  }
}
```

Register it in the listings module.

- [ ] **Step 4: Verify the role check**

Call `GET /api/moderation/listings` with a `USER` token.
Expected: HTTP 403. Then promote the row in the database to `MODERATOR` and repeat.
Expected: HTTP 200 with the queue.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/roles.guard.ts apps/api/src/listings
git commit -m "feat(api): moderation queue with role-guarded approve and reject"
```

---

### Task 8: Phone reveal tracking

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/listings/listings.service.ts`
- Create: `apps/api/src/listings/contact.controller.ts`

**Interfaces:**

- Produces: Prisma model `ContactReveal`; `GET /api/objects/:id/contact → { phone, telegram }`; the listing detail payload returns `phoneMasked` instead of the raw number.

- [ ] **Step 1: Add the model**

```prisma
model ContactReveal {
  id        String   @id @default(cuid())
  listingId String
  /// Null for anonymous visitors — most reveals will be anonymous.
  userId    String?
  ip        String
  createdAt DateTime @default(now())

  @@index([listingId, createdAt])
}
```

Run: `yarn workspace @rieltor/api prisma migrate dev --name add_contact_reveal`

- [ ] **Step 2: Mask the phone in the detail payload**

In the listing detail mapper, replace the raw `agent.phone` with:

```ts
/** "+998 90 123 45 67" → "+998 90 ••• •• 67": enough to look real, not enough to dial. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `+${digits.slice(0, 5)} ${digits.slice(5, 7)} ••• •• ${digits.slice(-2)}`;
}
```

Return `phoneMasked` and drop `phone` from the public detail response. Update `ListingDetailSchema` in `packages/shared/src/schemas.ts` accordingly.

- [ ] **Step 3: Add the reveal endpoint**

Create `apps/api/src/listings/contact.controller.ts`:

```ts
import { Controller, Get, Ip, Param } from '@nestjs/common';
import { ListingsService } from './listings.service';

@Controller('api/objects')
export class ContactController {
  constructor(private readonly listings: ListingsService) {}

  /** Called when the user taps the masked number — this event *is* the lead. */
  @Get(':id/contact')
  reveal(@Param('id') id: string, @Ip() ip: string) {
    return this.listings.revealContact(id, ip);
  }
}
```

Service method:

```ts
  async revealContact(listingId: string, ip: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: 'PUBLISHED' },
      select: { agent: { select: { phone: true, telegram: true } } },
    });

    if (!listing) throw new NotFoundException();

    await this.prisma.contactReveal.create({ data: { listingId, ip } });

    return listing.agent;
  }
```

- [ ] **Step 4: Verify**

```bash
curl -s localhost:3000/api/objects/bx-001 | grep -o 'phoneMasked[^,]*'
curl -s localhost:3000/api/objects/bx-001/contact
```

Expected: the detail shows a masked number; the contact call returns the real one and inserts a `ContactReveal` row.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma apps/api/src/listings packages/shared/src/schemas.ts
git commit -m "feat(api): mask listing phone and track reveals"
```

---

### Task 9: Frontend auth store and API client

**Files:**

- Create: `apps/web/src/shared/api/auth-storage.ts`
- Modify: `apps/web/src/shared/api/client.ts`
- Create: `apps/web/src/entities/session/model/use-session.ts`
- Create: `apps/web/src/entities/session/index.ts`

**Interfaces:**

- Produces: `readTokens()`, `writeTokens(tokens)`, `clearTokens()`; `useSession()` returning `{ user, isPending, isAuthenticated }`; the shared `apiFetch` attaches the access token and retries once after a refresh.

- [ ] **Step 1: Write the token storage**

Create `apps/web/src/shared/api/auth-storage.ts`:

```ts
import type { AuthTokens } from '@rieltor/shared';

const KEY = 'rieltor.auth';

type Stored = Pick<AuthTokens, 'accessToken' | 'refreshToken'>;

export function readTokens(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    // Private mode, disabled storage, or corrupted JSON — treat as logged out.
    return null;
  }
}

export function writeTokens(tokens: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tokens));
  } catch {
    // Nothing to do: the session simply will not survive a reload.
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
```

- [ ] **Step 2: Teach the client about tokens**

In `apps/web/src/shared/api/client.ts`, wrap the existing fetch: attach `Authorization: Bearer <accessToken>` when tokens exist; on a 401, call `POST /api/auth/refresh` once with the refresh token, store the new pair, and replay the original request. If the refresh also fails, `clearTokens()` and rethrow.

- [ ] **Step 3: Write the session hook**

Create `apps/web/src/entities/session/model/use-session.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import type { AuthUser } from '@rieltor/shared';
import { apiFetch } from '@/shared/api/client';
import { readTokens } from '@/shared/api/auth-storage';

export function useSession() {
  const hasTokens = readTokens() !== null;

  const { data, isPending } = useQuery({
    queryKey: ['session'],
    queryFn: () => apiFetch<AuthUser>('/api/auth/me'),
    // Without a token there is nothing to ask about, and firing the request
    // anyway would make every anonymous page load a guaranteed 401.
    enabled: hasTokens,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    user: data ?? null,
    isPending: hasTokens && isPending,
    isAuthenticated: Boolean(data),
  };
}
```

Export it from `apps/web/src/entities/session/index.ts`.

- [ ] **Step 4: Verify**

Run `yarn lint && yarn typecheck`.
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/shared/api apps/web/src/entities/session
git commit -m "feat(web): auth token storage, refreshing API client, session hook"
```

---

### Task 10: Login modal

**Files:**

- Create: `apps/web/src/features/auth/ui/login-modal.tsx`
- Create: `apps/web/src/features/auth/ui/telegram-login-button.tsx`
- Create: `apps/web/src/features/auth/model/use-login.ts`
- Create: `apps/web/src/features/auth/index.ts`
- Modify: `apps/web/src/widgets/site-header/ui/site-header.tsx`

**Interfaces:**

- Consumes: `writeTokens` from Task 9.
- Produces: `<LoginModal open onClose />`; `useLogin()` with `requestOtp(phone)`, `verifyOtp(phone, code)`.

- [ ] **Step 1: Write the login hook**

Two mutations against `/api/auth/otp/request` and `/api/auth/otp/verify`. On success, `writeTokens(data)` and invalidate the `['session']` query.

- [ ] **Step 2: Write the modal**

Two panes. Pane one: phone input, prefixed `+998`, digits only, submit button "Kodni olish", plus the Telegram button and the line "Davom etish orqali ommaviy oferta shartlariga rozilik bildirasiz". Pane two: six-digit code input, a 120-second countdown, "Qayta yuborish" enabled when it hits zero, and an inline error area for a wrong code.

Match the existing visual language: `rounded-[14px]`, gradient primary button `from-violet-600 to-accent-dark`, `text-[15px] font-extrabold`.

- [ ] **Step 3: Write the Telegram button**

The widget is a third-party script tag. Load it on mount into a ref'd container:

```tsx
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.async = true;
  script.dataset.telegramLogin = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  script.dataset.size = 'large';
  script.dataset.radius = '14';
  script.dataset.onauth = 'onTelegramAuth(user)';
  containerRef.current?.appendChild(script);
  return () => script.remove();
}, []);
```

Expose `window.onTelegramAuth` to POST the payload to `/api/auth/telegram`, then `writeTokens` and invalidate `['session']`.

- [ ] **Step 4: Wire it into the header**

Replace the desktop header's right-hand area: when `isAuthenticated` is false show a "Kirish" button that opens the modal; when true show the user's name and an avatar. Add the primary CTA button "+ E'lon joylash" pointing at `/my/listings/new`, matching CIAN's header placement.

- [ ] **Step 5: Verify in the browser**

Start the API and `yarn workspace @rieltor/web dev`. At 1440px click "Kirish", enter `998901234567`, read the code from the API log, submit.
Expected: modal closes, the header shows the account, `GET /api/auth/me` returns 200.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/auth apps/web/src/widgets/site-header
git commit -m "feat(web): login modal with phone OTP and Telegram login"
```

---

### Task 11: CIAN-style search result row

**Files:**

- Create: `apps/web/src/entities/listing/ui/listing-result-row.tsx`
- Modify: `apps/web/src/entities/listing/index.ts`
- Modify: `apps/web/src/pages/search/ui/search-page.tsx`

**Interfaces:**

- Consumes: `ListingSummary` from `@rieltor/shared`.
- Produces: `<ListingResultRow listing favoriteSlot />` — renders only at ≥1440px; the phone list keeps `ListingCard`.

- [ ] **Step 1: Build the row**

Three columns as specified in spec §2.2, using CSS grid `desk:grid-cols-[19.375rem_1fr_14.375rem]` (310px / flex / 230px), 20px gaps:

- Column 1: main image `aspect-[4/3] rounded-xl`, then a three-up thumbnail strip; the third thumbnail carries a "Yana N ta" overlay when `imageCount > 4`.
- Column 2: title `text-xl font-bold text-accent-dark`, spec line `{rooms}-xona · {areaM2} m² · {floor}-qavat`, geo line with the pin icon, address in `text-ink-3`, price `text-[28px] font-extrabold`, price per m², description clamped with `line-clamp-4`, footer with the relative date.
- Column 3: `rounded-card bg-surface p-4` panel — heart top-right, seller name, `TEKSHIRILGAN` badge, masked phone button, "Yozish" secondary button.

- [ ] **Step 2: Use it on the search page**

In the results block render both and let CSS pick:

```tsx
<div className="flex flex-col gap-4 desk:hidden">…ListingCard…</div>
<div className="hidden desk:flex desk:flex-col desk:gap-5">…ListingResultRow…</div>
```

Remove the `desk:grid desk:grid-cols-3` classes added to the card list in the previous phase — the desktop search page is now a row list, not a grid.

- [ ] **Step 3: Verify at both widths**

At 1439px: the search page is unchanged from today. At 1440px: three-column rows.
Check that only one of the two lists is in the accessibility tree at a time.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/entities/listing apps/web/src/pages/search
git commit -m "feat(web): CIAN-style three-column result row on desktop search"
```

---

### Task 12: Sticky filter bar

**Files:**

- Create: `apps/web/src/features/listing-filters/ui/filter-bar.tsx`
- Modify: `apps/web/src/features/listing-filters/index.ts`
- Modify: `apps/web/src/pages/home/ui/home-page.tsx`
- Modify: `apps/web/src/pages/search/ui/search-page.tsx`

**Interfaces:**

- Produces: `<FilterBar deal onDealChange type onTypeChange search onSearchChange />` — desktop only, sticky under the header.

- [ ] **Step 1: Build the bar**

A single sticky row (`desk:sticky desk:top-[7.5rem] desk:z-40`) on a white background with a bottom border: pill buttons for deal and type that open small popovers, a free-text input with a search icon, and a "Qidiruvni saqlash" button on the right with a heart icon. Hidden below 1440px (`hidden desk:flex`).

- [ ] **Step 2: Replace the desktop sidebar on the home page**

Keep `ListingFacets` for the phone. At desktop, render `FilterBar` above the results and drop the left sidebar, so the grid runs full width — matching CIAN, where filters are horizontal and results take the whole column.

- [ ] **Step 3: Verify**

At 1440px the filter bar sticks under the two header rows while scrolling and the card grid is four across. At 1439px nothing changed.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/listing-filters apps/web/src/pages
git commit -m "feat(web): sticky desktop filter bar, full-width results grid"
```

---

### Task 13: Listing creation wizard

**Files:**

- Create: `apps/web/src/pages/listing-create/ui/listing-create-page.tsx`
- Create: `apps/web/src/pages/listing-create/ui/steps/*.tsx` (six files: `deal-step`, `location-step`, `params-step`, `photos-step`, `price-step`, `contacts-step`)
- Create: `apps/web/src/pages/listing-create/model/use-listing-draft.ts`
- Create: `apps/web/src/pages/listing-create/index.ts`
- Modify: `apps/web/src/app/router.tsx`

**Interfaces:**

- Consumes: the draft endpoints from Task 6.
- Produces: route `/my/listings/new`; `useListingDraft()` with `draftId`, `patch(fields)`, `submit()`, `step`, `next()`, `back()`.

- [ ] **Step 1: Write the draft hook**

Creates the draft on mount, keeps the step index in `useState`, and PATCHes on every `next()` so a reload never loses more than one step.

- [ ] **Step 2: Build the six steps**

Follow the reference flow: deal type + property category → address with a map pin → rooms/area/floor → photo upload → price and terms → contacts. Left rail shows the step number, an illustration, a hint, and a progress bar, exactly like the reference; the form is on the right. Below 1440px it is a single column — the current phone treatment.

- [ ] **Step 3: Add the route**

Add to `apps/web/src/app/router.tsx`, outside `TabLayout` (the wizard has its own chrome):

```tsx
{ path: '/my/listings/new', element: <ListingCreatePage /> },
```

- [ ] **Step 4: Verify end to end**

Log in, open `/my/listings/new`, complete all six steps, submit.
Expected: the listing appears in `GET /api/my/listings` with status `MODERATION`, and `GET /api/objects` does **not** include it.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/listing-create apps/web/src/app/router.tsx
git commit -m "feat(web): six-step listing creation wizard"
```

---

### Task 14: My-listings cabinet and saved searches

**Files:**

- Create: `apps/web/src/pages/my-listings/ui/my-listings-page.tsx`
- Create: `apps/web/src/features/saved-search/model/use-saved-searches.ts`
- Create: `apps/web/src/features/saved-search/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/saved-search/*`
- Modify: `apps/web/src/app/router.tsx`

**Interfaces:**

- Produces: Prisma model `SavedSearch { id, userId, name, query, createdAt }`; `GET/POST/DELETE /api/my/saved-searches`; route `/my/listings`.

- [ ] **Step 1: Add the model and endpoints**

```prisma
model SavedSearch {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  /// The search page's query string, replayed verbatim when the user opens it.
  query     String
  createdAt DateTime @default(now())

  @@index([userId])
}
```

Add the `savedSearches SavedSearch[]` back-relation to `User`. Migrate. Add a guarded controller with list, create and delete.

- [ ] **Step 2: Build the cabinet page**

A table of the user's listings: thumbnail, title, price, status chip (`DRAFT` grey, `MODERATION` amber, `PUBLISHED` green, `REJECTED` rose with the reason as a tooltip), and per-row actions. Saved searches sit in a second section, each a row with its name and a "Ochish" link.

- [ ] **Step 3: Hook up "Qidiruvni saqlash"**

The button added in Task 12 POSTs the current query string; when logged out it opens the login modal first.

- [ ] **Step 4: Verify**

Save a search from `/search`, confirm it appears at `/my/listings`, click it, confirm the filters are restored.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma apps/api/src/saved-search apps/web/src/pages/my-listings apps/web/src/features/saved-search apps/web/src/app/router.tsx
git commit -m "feat: my-listings cabinet and saved searches"
```

---

### Task 15: Phase close-out

- [ ] **Step 1: Full check**

```bash
yarn lint && yarn typecheck && yarn workspace @rieltor/web test && yarn workspace @rieltor/shared test
```

Expected: all pass.

- [ ] **Step 2: Confirm the phone layout never moved**

Screenshot `/`, `/search` and `/obj/bx-001` at 390px and compare against `verify-screenshots/`. Any difference is a bug in this phase, not an improvement.

- [ ] **Step 3: Confirm the Telegram preview still works**

```bash
curl -s localhost:3000/obj/bx-001 | grep -o '<meta property="og:[^>]*>'
```

Expected: `og:title`, `og:description`, `og:image` all present and listing-specific.

- [ ] **Step 4: Update the project overview**

Rewrite `docs/project-overview.md` §4 to describe accounts, listing creation, moderation and the desktop layout.

- [ ] **Step 5: Commit and open the PR**

```bash
git add -A
git commit -m "docs: update project overview for phase 1"
```

---

## Self-review notes

- **Spec coverage:** this plan covers spec §3.2 items A1–A3, A7, A8 and §2.1–2.5 of the design system. A4 (voice), A5 (Telegram bot), A6 (AI description) are deliberately held for Phase 2, where the AI provider is introduced once for valuation and description together — splitting them would mean wiring Claude twice.
- **Deferred within phase:** photo upload in Task 13 Step 2 assumes the existing image pipeline accepts an upload endpoint. If it does not, that becomes Task 13a — an S3-backed upload route — before the wizard's photo step can be finished.
- **Known ordering constraint:** Task 6 depends on Task 5's `ListingStatus`, and Task 10 depends on Task 9's token storage. Everything else can be reordered.
