# Admin registration access

## Scope

Staff can sign in from the registration footer, search registration-eligible students, inspect all sections, edit answers, and upload documents. Only `am@brilliantmicroschool.org` is allowed. Parents alone sign agreements and submit registration. The parent login email stays read-only: changing it would let staff receive a parent code and bypass that boundary. Browsing does not change registration progress or notify parents.

Admin codes and cookies are separate from parent credentials. Server-side sessions and OTP records are encrypted with a separate secret. Codes expire after 5 minutes; sessions expire after 30 idle minutes or 8 hours total. The user confirmed mailbox two-step verification. Email OTP remains vulnerable to phishing.

## Deployment gate

This branch does not enable or deploy production access. Configure:

- `ADMIN_ACCESS_ENABLED=true` only after the checks below
- `ADMIN_AUTH_SECRET`: a new random secret of at least 32 characters, different from `AUTH_SECRET`
- `ADMIN_AUDIT_TABLE=reg_admin_audit`
- existing Backendless settings and the correct `NEXT_PUBLIC_APP_URL`
- `EXTERNAL_WRITES_ENABLED=true` only where registration edits are authorized

Pre-create the audit table. Columns: `eventId` STRING, `event` STRING, `occurredAt` DATETIME, `actorRef` STRING, `leadRef` STRING, `studentRef` STRING, `operationId` STRING. Deny public reads, updates, and deletes; allow the server integration to create records. Verify table/API-key permissions before enabling. This branch makes no live schema or permission changes.

Audit references are keyed hashes. No names, emails, answers, URLs, or tokens are logged. Authorized operators can correlate records using `adminRef(kind, value)` on the server. Choose an organizational retention policy and restrict backups too. Requested and verified mutations share an operation ID; staff identity and operation ID also appear in the existing student change history.

Backendless atomic counters do not expire automatically. Maintain a cleanup policy for expired admin challenge/window counters; never reset active counters. Cache records expire separately.

## Checks

Run typecheck, lint, unit tests, build, Knip, and the parent browser suite. Run `npm run test:browser:admin` for the admin desktop/mobile flow. It uses synthetic data and isolated local servers on ports 3028 and 3039. Fixture control endpoints exist only in the test server, not in the app.

## Post-deploy monitoring and validation

Andreas owns preview validation before production enablement. Confirm real code delivery through `uiBuilder.emailFrontend` with an empty lead association, a 5-minute expiry label, the exact allowlist, and no parent notification. Verify audit permissions, atomic-counter support, and the production email encryption format.

Search by student name, parent email, and pasted registration link, including siblings and submitted forms. With an explicitly approved test student, change one field and upload one harmless document. Confirm the fresh Backendless readback, unchanged signature/submission fields, and paired `save_requested/save_verified` or `upload_requested/upload_verified` events.

Contact saves reuse the existing parent-map synchronization. On the approved test family, also verify sharing preferences and student relations in `parent_maps`, including siblings. The admin readback confirms the student record, not this downstream map. This branch does not change that existing synchronization.

Check idle/max-session expiry, logout replay, and parent-only credentials against admin routes. During the first working day, inspect admin API failures and unpaired mutation events. Missing audit events, a wrong student, cross-role access, or an unexpected write are stop conditions: set `ADMIN_ACCESS_ENABLED=false`, rotate the admin secret if necessary, and investigate before re-enabling.

## Limits

Snapshot checks reject edits made against an older view. They are not database-level transactions against a simultaneous parent write. Admin saves send only changed allowed fields and read them back. A downstream or audit failure after a write can mean data changed without a success response: reload and inspect the record/audit trail before retrying.

Documents keep their existing Google Drive permissions. The app checks and audits access before redirecting; signing out cannot revoke already-open Drive tabs or downloaded copies.
