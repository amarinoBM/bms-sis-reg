# BMS student registration

This Next.js app lets Brilliant Microschools families complete student registration. It uses Backendless for live student data, one-time login codes, file uploads, and form submission.

You can run the full user interface with made-up data. You do not need Backendless access for this mode.

## Run the demo

You need Node.js 20.9 or later.

1. Install the packages.

   ```bash
   npm ci
   ```

2. Copy the example environment file.

   ```bash
   cp .env.example .env.local
   ```

3. Start the app.

   ```bash
   npm run dev
   ```

4. Open [the local demo](http://localhost:3010/demo).

The demo is read-only. It does not connect to Backendless, save changes, upload files, sign documents, or submit a registration. The app ignores demo mode when `NODE_ENV=production`.

## Connect to Backendless

Set `DEMO_MODE=false` in `.env.local`, then add:

- `AUTH_SECRET`: a random secret with at least 32 characters
- `BACKENDLESS_REST_URL`: the Backendless REST API URL, including the app ID and API key
- `BACKENDLESS_CODE_URL`: the Backendless Cloud Code URL, including the app ID and code key
- `NEXT_PUBLIC_APP_URL`: the exact origin for the app, such as `http://localhost:3010`

Keep `EXTERNAL_WRITES_ENABLED=false` until you intend to test saves against the selected Backendless environment.

Generate a local secret with:

```bash
openssl rand -base64 32
```

Start a live registration from a valid link:

```text
http://localhost:3010/reg?lead_id=YOUR_TEST_LEAD_ID
```

Use an approved test family. Do not use a production family for local development.

## Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DEMO_MODE` | local demo | Set to `true` to enable `/demo`. Production always disables it. |
| `NEXT_PUBLIC_APP_URL` | all live environments | Used to check the origin of requests that change data. |
| `AUTH_SECRET` | parent sign-in | Must contain at least 32 characters in production. |
| `BACKENDLESS_REST_URL` | live data | Server-only. Do not expose the key to browser code. |
| `BACKENDLESS_CODE_URL` | login codes and Cloud Code | Server-only. Required in production. |
| `EXTERNAL_WRITES_ENABLED` | live saves | Keep `false` unless writes are approved. |
| `ADMIN_ACCESS_ENABLED` | admin area | Keep `false` unless you are testing admin access. |
| `ADMIN_AUTH_SECRET` | admin sessions | Must differ from `AUTH_SECRET`. |
| `ADMIN_AUDIT_TABLE` | admin audit log | Defaults to the named table in `.env.example`. |
| `ADMIN_EMAIL_LEAD_ID` | admin login code email | Use only the approved internal test lead. |

See [admin access](docs/admin-access.md) before you enable the admin area.

## Checks

Run the main checks before you open a pull request:

```bash
npm run check
```

The command runs TypeScript, lint, unit tests, the production build, and unused-code checks.

Run browser tests separately:

```bash
npm run test:browser
```

## Security boundaries

- Backendless keys stay on the server
- parent data routes check the signed-in family ID
- production needs a separate 32-character session secret
- live writes need `EXTERNAL_WRITES_ENABLED=true`
- demo mode cannot run in production
- logs must not contain student information, login codes, or secrets

Do not commit `.env.local` or any real credentials.
