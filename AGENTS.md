# BMS SIS parent registration — agent guide

Parent-facing Next.js app replacing Clever `Main_Page` OTP + `SIS` wizard.

**Domain spec:** `backendless/drafts/sis-nextjs-ce-plan.md`, `sis-field-spec.json`, `sis-reg-implementation-plan.md`.

**Reference:** `bms-student-records` (Transcripts repo) for Backendless connectors, API envelope, CI, and BMS design tokens.

## Architecture

- **Server-only Backendless** — `fetch()` to `BACKENDLESS_REST_URL`; no browser SDK.
- **Writes gated** — `EXTERNAL_WRITES_ENABLED=true` required for prod saves (enabled for pilot on Vercel production).
- **Routes** in `src/app`; app UI in `src/app/_components`; shadcn in `src/components/ui`.
- **Modules** in `src/modules/` (otp, students, wizard) — cross-step flows in `src/server/workflows/` when needed.

## URLs

- **Preview:** Vercel `*.vercel.app` (initial deploy target).
- **Production:** `reg.brilliantmicroschools.org` (cutover after full wizard + submit).

## Backendless

- Credential names match learning repo: `BACKENDLESS_APP_ID`, `BACKENDLESS_API_KEY`, `BACKENDLESS_REST_URL`, `BACKENDLESS_CODE_KEY`, `BACKENDLESS_CODE_URL`.
- Primary tables: `ms_student_dir`, `StudentInfo`, `weekly_slots`.
- Save path: diff → UpdateHistory → `BG_13_HR/EncryptDecryptMSStudentDir` → PUT `ms_student_dir`.
- Submit: `BG_21_Microschool/SISCompletedForm`.

## UI

- BMS brand tokens in `src/app/globals.css` (navy `#12324a`, orange `#d43d16`, Poppins).
- Orange reserved for primary actions.

## Safety

- Do not write to production Backendless without explicit approval.
- Enable `EXTERNAL_WRITES_ENABLED=true` on Vercel production before pilot saves.
- Never log student PII or secrets.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run knip
npm run test:browser
```
