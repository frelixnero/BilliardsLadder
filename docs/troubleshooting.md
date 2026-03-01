# Troubleshooting — ActionLadder

## Most Common Issues

---

### ❌ Server won't start: "Missing required environment variable"

**Cause:** `server/config/env.ts` validates all env vars at startup. One or more are missing.

**Fix:**
```bash
# Check which variable is missing from the error message, then:
cp .env.example .env     # if .env doesn't exist
# Open .env and fill in the missing value
# On Replit: add it in the Secrets panel
```

---

### ❌ `DATABASE_URL must be set. Did you forget to provision a database?`

**Cause:** No Neon / Postgres database connected.

**Fix:**
1. Go to Neon (neon.tech) → create a new project
2. Copy the connection string
3. Set `DATABASE_URL=<connection string>` in `.env` or Replit Secrets
4. Run `npm run db:push` to create tables

---

### ❌ TypeScript: 475 errors / `npx tsc --noEmit` times out

**Cause:** `server/storage.ts` is ~6,800 lines. Full type check takes 5–10 minutes.

**Fix:**
```bash
# Check individual files instead:
npx tsc --noEmit --isolatedModules client/src/App.tsx

# Or skip tsc and just build (esbuild is much faster):
npm run build
```

---

### ❌ Stripe webhook returns 400: "No signatures found"

**Cause:** `STRIPE_WEBHOOK_SECRET` is missing or wrong.

**Fix:**
1. Stripe Dashboard → Webhooks → click your endpoint
2. Copy the "Signing secret" (starts with `whsec_`)
3. Set `STRIPE_WEBHOOK_SECRET=whsec_...` in Replit Secrets
4. Re-send the webhook event from Stripe dashboard

---

### ❌ Login fails: "Environment variable REPLIT_DOMAINS not provided"

**Cause:** App isn't running on Replit, or `REPLIT_DOMAINS` isn't set.

**Fix (local dev):**
```bash
# Set REPLIT_DOMAINS to localhost for local dev:
REPLIT_DOMAINS=localhost:5000
REPL_ID=your-repl-id-here
```

---

### ❌ `React.Children.only expected to receive a single React element child`

**Cause:** A shadcn/ui or Radix UI component (usually `TooltipTrigger`, `SheetTrigger`, etc.) received multiple children.

**How to find it:**
1. Check the browser stack trace — it shows the component name
2. Look for JSX like `<TooltipTrigger><A /><B /></TooltipTrigger>` — wrap in a single `<span>` or `<>` fragment

**Fix example:**
```tsx
// ❌ Wrong
<TooltipTrigger>
  <Icon />
  <Text />
</TooltipTrigger>

// ✅ Correct
<TooltipTrigger>
  <span className="flex items-center gap-2">
    <Icon />
    <Text />
  </span>
</TooltipTrigger>
```

---

### ❌ 500 errors with no useful message

**Cause:** Error handler wasn't returning structured error info.

**Fix:** The new `server/middleware/errorHandler.ts` now returns:
```json
{
  "code": "INTERNAL_ERROR",
  "message": "...",
  "requestId": "abc123",
  "stack": ["..."] // only in development
}
```
Use the `requestId` to find the full log entry.

---

### ❌ `Cannot find module '@shared/schema'`

**Cause:** TypeScript path alias not configured, or running `tsc` without the project tsconfig.

**Fix:**
```bash
# Use project-aware check:
npm run check    # uses tsconfig.json with @shared/* → shared/*

# NOT:
npx tsc --noEmit --isolatedModules file.ts  # ignores path aliases
```

---

### ❌ Socket.IO challenge events not firing

**Cause:** Socket.IO server not initialized, or CORS blocking the WS upgrade.

**Fix:**
1. Confirm `initializeSocketManager(server)` is called in `server/routes.ts`
2. Check CORS origin list includes your domain
3. Client: ensure `socket.io-client` URL matches the server port

---

### ❌ AI features return 500: "OpenAI error"

**Cause:** `OPENAI_API_KEY` missing or invalid.

**Fix:**
1. Set `OPENAI_API_KEY=sk-...` in Replit Secrets
2. Verify the key has billing enabled at platform.openai.com

---

### ❌ Emails not sending

**Cause:** `SENDGRID_API_KEY` missing or `EMAIL_FROM` domain not verified.

**Fix:**
1. Set `SENDGRID_API_KEY=SG....`
2. In SendGrid: verify your sender domain
3. Set `EMAIL_FROM=noreply@your-verified-domain.com`

---

### ❌ Build fails: `esbuild` can't resolve module

**Cause:** A server-side import references a file that doesn't exist.

**Common missing files:**
- `server/utils/transparency-logs.ts` (stub exists — should export `logTransparencyEvent`)
- Any service imported in `server/routes.ts` that hasn't been created yet

**Fix:** Create the missing file as a stub:
```typescript
// server/utils/missing-module.ts
export async function missingFunction(): Promise<void> {}
```

---

## AI Debugging Prompt Template

When asking AI to fix something, always provide:

```
Goal: [what should happen]
Actual: [what happens instead]
Steps to reproduce:
  1. ...
  2. ...
Error output:
  [full stack trace here]
Files involved:
  - server/controllers/xxx.ts
  - client/src/pages/xxx.tsx
Constraints:
  - Don't change the API response shape
  - Keep DB schema the same
Expected response JSON:
  { "id": 1, "status": "active" }
```
