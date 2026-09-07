---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Secure student registration deep links and admin preview

## Goal Capsule

Build student-specific registration links that take a parent to the right student and section after the normal one-time password (OTP) sign-in. Add a separate, read-only admin preview route so Andreas can test the same routing while already signed in as an admin. Keep parent and admin authentication separate, avoid new Backendless fields, and preserve the existing admin editor for approved write and upload tests.

Current baseline:

- `/reg` accepts only `lead_id` and the OTP client does not preserve a requested student or section (`src/app/reg/page.tsx`, `src/app/reg/_components/otp-form.tsx`).
- The OTP service already accepts an optional student name and redirects to `/reg/sis`, but it does not validate that the requested name belongs to the enrolled students or carry a step (`src/modules/otp/otp-service.ts`).
- `/reg/sis` authorizes the parent session against `lead_id`, then `SisWorkspace` always starts at step `1` (`src/app/reg/sis/page.tsx`, `src/server/auth/require-parent-session.ts`, `src/app/reg/sis/_components/sis-workspace.tsx`).
- Step `10` is the State section and contains the immunization document upload (`src/modules/wizard/steps.ts`, `src/app/reg/sis/_components/step-form.tsx`).
- Admin sessions and admin APIs already use a separate cookie, OTP, timeout, audit trail, and write gate (`src/server/admin/session.ts`, `src/server/admin/route.ts`, `docs/admin-access.md`).
- The worktree already contains unrelated user edits in `src/modules/tos/tos-copy.ts`, `tests/modules/tos/tos-copy.test.ts`, and `.impeccable/`. The implementation must not include or modify them.

## Product Contract

### Requirements

- R1. A canonical family link may include `lead_id`, `student_name`, and `step`; for the Texas follow-up, the link targets the enrolled student and step `10` (State).
- R2. The link is a routing hint, not an authentication credential. A parent must still request and enter the normal OTP sent to an email already on the lead.
- R3. After successful OTP verification, the server must preserve the requested student when it is one of that lead's enrolled students. A missing student falls back to the existing first-student behavior; an invalid student must not select an arbitrary record.
- R4. The server must validate `step` against the existing `WizardStepId` values. A missing or invalid step safely falls back to the first section. Do not introduce a second step-number mapping.
- R5. The parent landing page must load the selected student and initialize the selected step after OTP verification. Existing student switching must continue to return to step `1` unless the user explicitly follows another deep link.
- R6. A parent route must continue to require a parent session whose `leadId` exactly matches the URL. An admin cookie must not bypass parent OTP or parent-route authorization.
- R7. Add an explicit admin preview route, such as `/admin/preview?lead_id=...&student_name=...&step=10`, which requires an active admin session and loads the selected registration without OTP. It must be visibly read-only and must not call parent save, parent upload, sign, or submit endpoints.
- R8. Admin preview must resolve the exact lead and student on the server before loading the record. Invalid or ambiguous targets must fail safely without exposing another family's registration.
- R9. Keep the existing `/admin` editor for approved mutation testing. Its current write and upload behavior must not be weakened or silently reused by preview.
- R10. Do not add a Backendless database field or change OTP storage/provider behavior. The change should be limited to URL state, server-side validation, routing, and UI mode handling.
- R11. The design must support one link per student, including sibling leads. Do not add a household student picker to the email-link contract.
- R12. The browser tests must prove both the parent flow and the admin testing boundary with synthetic data. Tests must not use production student records, live OTPs, or live document uploads.

### Actors and flows

Actors:

- Parent: opens a link, completes OTP verification, reviews the selected student's saved information, and adds the required State information or document.
- Admin: signs in with the existing admin OTP, opens an explicit preview link to verify routing, and uses the existing admin editor when a controlled write/upload test is needed.
- Registration app: treats query parameters as untrusted routing input and applies the relevant server-side session guard before loading data.
- Backendless and email services: remain the existing source for enrolled-student lookup, OTP cache/email delivery, saved registration data, and document storage.

Parent flow:

1. The family opens `/reg?lead_id=...&student_name=...&step=10`.
2. The app masks the stored parent email and sends the normal six-digit OTP.
3. The verify request carries the requested student and validated target step as routing context only.
4. The server verifies the OTP, confirms the student belongs to the enrolled lead, creates the existing parent session, and redirects to `/reg/sis` with the selected student and step.
5. The parent sees the selected student's State section, reads any saved values, selects the relevant Texas status, and uploads the immunization record if needed.

Admin test flow:

1. Andreas signs in at `/admin/login` and keeps that admin session in the same browser.
2. He opens the explicit `/admin/preview?...` version of a family link.
3. The admin session guard loads the selected registration in preview mode, starts at the requested section, and shows a clear read-only label.
4. To test an actual upload or save, he leaves preview and uses the existing `/admin` editor, which keeps its version check, write gate, audit events, and readback.

Security failure flow:

- No parent OTP: `/reg/sis` redirects to parent sign-in even if an admin cookie exists.
- Wrong lead/student combination: the server returns a safe not-found/invalid-target response and does not load the record.
- Invalid step: authenticate normally, then use step `1`; do not execute an arbitrary component or endpoint.
- No or expired admin session: `/admin/preview` redirects to `/admin/login` and does not fall back to the parent route.

### Acceptance examples

- A Texas link for an enrolled student opens the OTP page without exposing raw parent email, OTP, document URLs, or answers.
- After the correct synthetic OTP, the family lands on `Section 10 of 14 · State` for the named student.
- A link with no `step` behaves exactly as the current link and lands on step `1`.
- A link with `step=999`, `step=0`, or non-numeric step lands safely on step `1` after authentication.
- A link naming another enrolled sibling selects that sibling after authentication; a nonexistent name does not select the first sibling by accident.
- A signed-in admin opening `/reg?...` still sees the parent OTP flow. Only `/admin/preview?...` uses the admin session.
- A signed-in admin opening `/admin/preview?...&step=10` sees the correct student's State section, has no save/upload/edit/sign/submit action, and cannot mutate state through the preview UI.
- The existing admin editor continues to support a controlled synthetic immunization upload, including the existing admin audit/readback behavior.
- The existing parent flow, sibling switching, and parent-only sign/submit boundaries remain green.

### Scope boundaries

In scope:

- Deep-link query parsing, validation, OTP context preservation, and initial wizard step selection.
- Explicit read-only admin preview for testing deep links.
- Targeted unit and browser coverage, plus concise admin-access documentation.

Out of scope:

- Sending the 55 Texas emails or creating/updating Asana tasks.
- A bulk-email sender, a new Backendless field, a new pathway field, or a new document storage path.
- Changing parent OTP delivery, expiry, rate limits, or session cookie policy.
- Making the public parent route trust admin authentication.
- Expanding admin permissions or making preview capable of saving, uploading, signing, or submitting.

### High-level technical design

```mermaid
sequenceDiagram
    participant P as Parent
    participant R as /reg deep link
    participant O as OTP API/service
    participant S as Parent session
    participant W as Parent wizard
    participant A as /admin/preview
    participant AS as Admin session
    participant D as Backendless

    P->>R: lead_id + student_name + step
    R->>P: OTP form with masked email
    P->>O: send OTP
    O->>D: existing OTP cache and email flow
    P->>O: OTP + routing context
    O->>D: verify enrolled lead/student
    O->>S: create existing parent session
    O->>W: redirect with validated student + step
    W->>S: require matching parent lead session
    W->>D: load selected student

    P->>A: explicit admin preview link
    A->>AS: require active admin session
    A->>D: server-side exact target lookup and read-only load
    A->>P: preview selected section; no mutation controls

    Note over R,A: Admin cookie never authenticates /reg
    Note over A,W: Actual writes remain in existing /admin editor
```

## Planning Contract

### Known decisions

- KTD1 (session-settled: user-approved — use a separate read-only admin preview route rather than allowing admin preview writes): preserve the parent/admin auth boundary and use the existing admin editor for mutation tests.
- KTD2 (session-settled: user-approved — one student-specific link per student rather than a household link with a student picker): keep each Texas follow-up unambiguous and make `student_name` part of the routing context.
- KTD3: treat `lead_id`, `student_name`, and `step` as untrusted query parameters. Validate them server-side and never place an OTP, email-choice token, document URL, or answer in a link.
- KTD4: reuse the existing `WizardStepId` and State step `10`; do not create a parallel section numbering scheme.
- KTD5: do not change the Backendless schema. This feature carries routing state through the existing URL and OTP redirect only.
- KTD6: the public parent route must remain parent-session-only, even when the same browser has an admin cookie. Preview is explicit in both path and UI.

### Constraints and assumptions

- The existing `findEnrolledStudents` result provides the student name/object ID pair needed to validate the requested student. The implementation should use the existing normalization rules and should not decrypt unrelated families.
- The existing admin registration loader accepts a validated `leadId` and `objectId`; preview should resolve the object ID server-side before calling it.
- `StepForm` currently uses persistence mode to decide whether saving, uploading, or unlocking is possible. Add a clearly read-only preview mode or a dedicated preview component; do not approximate preview by passing real data through parent persistence.
- Existing admin session limits, audit policy, and deployment gates in `docs/admin-access.md` remain authoritative.
- The current worktree is dirty for unrelated Terms-of-Service changes. Do not reset, stash, stage, or include those files as part of this work.

## Implementation Units

### U1. Define and validate deep-link context

Goal: create one shared representation for the optional student and target step, and make invalid input safe by construction.

Likely files:

- Add a small module near the existing wizard/auth helpers, such as `src/modules/registration/registration-link.ts`.
- Update `src/app/reg/page.tsx` and `src/app/reg/_components/otp-form.tsx`.
- Update `src/app/api/otp/verify/route.ts` and `src/modules/otp/otp-service.ts`.
- Extend `src/modules/wizard/steps.ts` only if a reusable parser needs an exported step guard; do not duplicate the step list.

Approach:

- Parse `student_name` with the existing student-name normalization and parse `step` through the existing `WizardStepId` list.
- Preserve an absent step as `INITIAL_ACTIVE_STEP`.
- Pass only validated/normalized routing context from the server page into the client OTP form. The client may echo it, but the server must revalidate it.
- Extend the verify payload and OTP service result so the redirect contains the selected student and validated target step.
- Compare the requested student against the enrolled students returned for the same lead. If it does not match, return a safe invalid-target result rather than redirecting to a guessed student.
- Keep the OTP cache key, rate limits, email-choice token behavior, hashing, and parent session creation unchanged.

Test scenarios:

- Existing no-context link retains the current first-student/step-1 behavior.
- Valid named student plus `step=10` produces a redirect containing that student and `step=10`.
- Invalid step, blank step, and unsupported future step fall back to step `1`.
- Non-member student cannot be selected by changing the URL.
- OTP verification still deletes the OTP cache after success and preserves current error messages for expired or incorrect codes.

Verification: targeted OTP service tests, route/context tests where practical, then typecheck.

### U2. Carry deep-link context into the parent wizard

Goal: land the authenticated parent at the requested student and section without breaking normal navigation.

Likely files:

- `src/app/reg/sis/page.tsx`
- `src/app/reg/sis/_components/sis-workspace.tsx`
- `src/app/reg/sis/_components/step-form.tsx` only if shared typing or mode behavior requires it
- Relevant wizard progress/navigation tests

Approach:

- Add optional `step` to the `/reg/sis` search params and normalize it with the shared link parser.
- Require the existing parent session before loading any student data. Keep the exact `session.leadId === leadId` check.
- Pass the validated initial step into the live workspace. Initialize it once for the page load; do not reapply it after an in-app sibling switch or refresh.
- Keep student switching URLs free of the original target step and reset switches to step `1`, matching current behavior.
- Ensure the selected State section renders saved status fields and the existing immunization uploader, with no new persistence path.

Test scenarios:

- `/reg/sis` without a parent session still redirects to `/reg`.
- Valid parent session plus `student_name` and `step=10` renders the named student and State section.
- Reload preserves the URL target without resetting to step `1`.
- Switching students resets to step `1` and does not carry the prior student's State target.
- Demo mode still starts at step `1` and cannot save or send anything.

Verification: targeted parent browser tests plus wizard unit tests; confirm no parent save/upload route is called merely by loading a deep link.

### U3. Add explicit read-only admin preview

Goal: let an already authenticated admin test the same student/section link without making the public parent route trust admin credentials.

Likely files:

- Add `src/app/admin/preview/page.tsx`.
- Add a focused client component such as `src/app/admin/_components/admin-preview.tsx` or a read-only variant of `AdminRegistration`.
- Extend `src/server/admin/registrations.ts` with a server-side exact target resolver that returns an existing object ID only after matching the requested lead and normalized student name.
- Extend `src/app/reg/sis/_components/step-form.tsx` or introduce a shared read-only step renderer so preview cannot render parent/admin persistence actions.
- Update `docs/admin-access.md` with the preview boundary and test procedure.

Approach:

- Require `requireAdminSession(false)` in the page. On failure, redirect to `/admin/login`.
- Parse and validate `lead_id`, `student_name`, and `step` with the same helper as the parent flow.
- Resolve the exact enrolled target on the server using the lead plus student name; reject missing or ambiguous targets before loading the registration DTO.
- Reuse the existing guarded admin document links for viewing already stored documents, but do not expose raw Backendless or Drive values.
- Render a clear `Admin · Read-only preview` label and the requested step. The preview mode must hide save, edit/unlock, upload, sign, submit, and any navigation that would silently mutate state.
- Do not add an admin-preview flag to `/reg` that changes its authentication behavior. The route path is the explicit security boundary.
- Keep actual controlled writes in `/admin`, which already supplies `adminVersion`, write-enabled checks, audit pairs, and fresh readback.

Test scenarios:

- Admin session plus a valid preview link loads the correct synthetic student's State section.
- Parent session alone cannot open `/admin/preview`.
- Admin session alone cannot skip OTP on `/reg`.
- Preview has no save/upload/edit/sign/submit controls and its network activity is read-only.
- Invalid lead/student/step cannot load another record.
- Existing admin editor mutation tests remain unchanged and continue to upload a synthetic document only in the editor.

Verification: admin browser suite with the synthetic backend, targeted admin registration tests, and a manual network assertion in the browser test that preview does not call mutation endpoints.

### U4. Add regression coverage and operator test instructions

Goal: make the feature testable without access to a parent's mailbox and make the safe production testing boundary explicit.

Likely files:

- Extend `tests/modules/otp/otp-service.test.ts`.
- Add a unit test for the link parser/step guard and, if extracted, the admin target resolver.
- Extend `tests/browser/admin-flow.spec.ts` with parent deep-link and admin-preview cases.
- Extend synthetic records in `tests/fixtures/admin-backend.ts` only with non-production fixture data needed to prove a selected State section; do not add real names or documents.
- Update `docs/admin-access.md` with the short test sequence.

Test design:

- Use the existing synthetic OTP test endpoint and `iron-session` synthetic parent/admin cookies where direct route coverage is clearer.
- Test the parent path with `/reg?lead_id=lead_bennett&student_name=Noah&step=10`, verify the State section, then verify sibling switching returns to step `1`.
- Test the admin path by signing in through the existing fixture, opening `/admin/preview?...`, verifying read-only controls, then separately use the existing editor test for the synthetic upload path.
- Assert the URL and request bodies do not contain raw OTPs, parent emails, document URLs, or student answers beyond the synthetic UI fixture data already required by the test.
- Keep the existing browser configuration: parent suite on ports `3028` and `3039`, admin suite with `ADMIN_BROWSER_TESTS=true`.

Verification: run targeted Vitest and Playwright cases first, then the full repository checks.

## Verification Contract

### Automated checks

From the repository root:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run knip`
- `npm run test:browser`
- `npm run test:browser:admin`

Targeted checks should cover the link parser, OTP redirect validation, parent deep-link landing, admin preview authorization, preview read-only behavior, and existing admin mutation behavior before the full suite.

### Security checks

- Verify the public `/reg` route never branches on the admin cookie.
- Verify every parent data request still uses the matching parent lead session guard.
- Verify preview uses only the admin session and an exact server-side lead/student lookup.
- Verify preview cannot invoke `/api/students/save`, `/api/uploads`, `/api/sis/complete`, `/api/admin/save`, or `/api/admin/uploads`.
- Verify `step` is an allowlisted `WizardStepId` and cannot select an arbitrary component or endpoint.
- Verify no new logs contain OTPs, raw parent emails, document URLs, answers, or additional student data.
- Recheck the existing admin deployment gate before enabling or testing against live data; synthetic browser tests are the default evidence.

### Manual test sequence

1. Start the local app with the synthetic browser configuration.
2. Sign in through the existing admin OTP fixture.
3. Open a synthetic `/admin/preview?lead_id=...&student_name=...&step=10` link and confirm the selected student's State section is visible and read-only.
4. While the admin cookie remains present, open the same link under `/reg?...`; confirm the parent OTP form still appears.
5. Use the existing `/admin` editor, not preview, for a controlled synthetic upload test. Confirm fresh readback and paired audit events.
6. Test a real parent only through an approved preview deployment using the normal OTP. Do not use admin preview to impersonate or submit for the parent.

## Definition of Done

- [ ] A validated student-specific link preserves the selected student and initial wizard step through OTP verification.
- [ ] Texas links can target State step `10` without a Backendless schema change.
- [ ] Missing and invalid routing parameters fall back safely and do not change authorization.
- [ ] Parent routes still require a matching parent session, regardless of admin-cookie presence.
- [ ] `/admin/preview` requires the separate admin session, resolves the target server-side, and is visibly read-only.
- [ ] Existing `/admin` editing, immunization uploads, version checks, audits, and readbacks remain intact.
- [ ] Unit and browser tests cover valid, invalid, sibling, unauthenticated, cross-role, and no-mutation cases.
- [ ] Typecheck, lint, unit tests, build, Knip, parent browser tests, and admin browser tests pass.
- [ ] No unrelated worktree changes are staged or included.
- [ ] Documentation explains how Andreas can test with admin preview and when to use the existing admin editor.

## Appendix

### Current implementation references

- `src/app/reg/page.tsx`: current `lead_id` parsing and OTP form construction.
- `src/app/reg/_components/otp-form.tsx`: current send/verify client payloads and redirect handling.
- `src/app/api/otp/verify/route.ts`: current request schema and parent session creation.
- `src/modules/otp/otp-service.ts`: current OTP verification, enrolled-student lookup, and redirect construction.
- `src/app/reg/sis/page.tsx`: current parent session guard and live workspace construction.
- `src/server/auth/require-parent-session.ts`: exact parent lead/session check and student-name normalization.
- `src/app/reg/sis/_components/sis-workspace.tsx`: current step state, data loading, and sibling switching behavior.
- `src/modules/wizard/steps.ts`: canonical steps; State is step `10`.
- `src/app/reg/sis/_components/step-form.tsx`: State fields and immunization upload behavior, plus persistence-mode actions.
- `src/app/admin/page.tsx`, `src/app/admin/_components/admin-registration.tsx`, and `src/server/admin/registrations.ts`: existing admin session, editor, guarded document links, and versioned loading.
- `tests/browser/admin-flow.spec.ts`, `tests/fixtures/admin-backend.ts`, and `tests/fixtures/admin-http-server.ts`: existing synthetic admin OTP, registration, upload, and readback patterns.
- `docs/admin-access.md`: existing admin security, deployment, audit, and synthetic test constraints.

### Evidence notes

- The current code already has the optional `studentName` parameter in the OTP service and verify schema, so this work should complete and validate that existing path instead of inventing a parallel authentication flow.
- The existing admin editor already has the requested State/immunization support. The main product change is preserving the target through parent OTP and adding a safe read-only route for testing.
- No external framework change is load-bearing for this plan. Execution should still verify the installed Next.js and `iron-session` behavior through the repository checks before any deployment.
