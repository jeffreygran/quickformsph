# Task: Integrate EPPS (eWallet Payment Processor) into QuickFormsPH Checkout

> **Paste-ready prompt** to brief the QuickFormsPH dev team in a fresh session.
> Open alongside: `~/projects/ewallet-payment-processor/docs/INTEGRATION-GUIDE.md`.

---

## Context

After a user uploads a GCash payment screenshot on a QuickFormsPH form that
requires payment, the QuickFormsPH backend calls **EPPS** to validate the
screenshot and marks the form **Paid** if `isValid === true`.

**Spec to read first (end-to-end, before coding):**
- `~/projects/ewallet-payment-processor/docs/INTEGRATION-GUIDE.md`
- `~/projects/ewallet-payment-processor/docs/API-REFERENCE.md`
- `~/projects/ewallet-payment-processor/docs/SECURITY.md`

---

## Non-negotiables

1. **Backend-to-backend only.** `X-Api-Key` MUST never appear in browser
   bundles or client-side code. Put the key in a server-side env var
   `EPPS_API_KEY`.
2. **Environment config**
   - `EPPS_BASE_URL` dev → `http://192.168.79.11:8500`
   - `EPPS_BASE_URL` prod → `https://epps.quickformsph.com`
   - Prod key: request from **@Gan**. Do **not** reuse the dev sandbox key
     `dev-sandbox-key-dc4f8e2b9a1c`.
3. **Trust `isValid`.** Do not re-implement the name/amount/ref policy
   locally. If `isValid` is true → mark paid. Otherwise surface a friendly
   reason derived from `fields[*].status`.
4. **Never log raw image bytes or OCR `rawText`.** Log only `refNo`,
   `isValid`, and per-field `status`.
5. **Strip EXIF** before persisting the uploaded screenshot.
6. **Rate-limit awareness.** EPPS enforces **20 req / 5 min per key** globally.
   - `429` → queue with backoff.
   - `500` → one retry, then route to manual review.
7. **Preserve the existing user flow.** Do not alter the current QuickFormsPH
   checkout experience. If automatic screenshot validation fails on the
   **first attempt**, follow the current fallback (let the user retry; on
   the **second failed attempt**, fall back to the existing manual
   reference-number entry UI). EPPS adds validation rigor — it must not add
   steps, screens, or friction that users don't see today.

---

## Deliverables

1. **Server lib `lib/epps.ts`** exposing:
   - `checkPaymentScreenshot(opts)` — multipart `POST /api/payment/CheckPaymentScreenshot`.
   - `checkRefNo(refNo)` — JSON `POST /api/payment/CheckRefNo`.
   Use the TypeScript snippet in the integration guide as the reference
   implementation.

2. **Route `POST /api/checkout/:formId/verify-payment`** (or equivalent) that:
   - accepts the screenshot (multer or native multipart);
   - calls `checkPaymentScreenshot` with the form's stored
     `expectedMaskedName`, `expectedMobile`, `amountDue`;
   - persists a `PaymentAttempt` row
     `{ formId, refNo, isValid, fieldsStatus, processingMs, createdAt }`
     (per-field status only — **NOT** raw OCR text);
   - on `isValid === true` → updates `form.paidAt = now()` and returns
     `{ accepted: true }`;
   - on `!isValid` → returns `422 { accepted: false, reasons: [...] }`.

3. **DB migration** for `PaymentAttempt` and any new columns on `forms`
   (`expectedMaskedName`, `expectedMobile`, `amountDue`).

4. **Friendly error mapper `humanize(fields)`** that translates EPPS
   statuses into **existing QuickFormsPH error copy and existing fallback
   UI** — do not introduce new error screens. Mapping guidance:
   - `name: mismatch` → reuse current "name doesn't match" message.
   - `amount: under` (blocks) / `amount: over` (passes) → reuse current
     amount-mismatch copy.
   - `refNo: duplicate` → reuse "reference already used" message.
   - `refNo: unreadable` on **1st attempt** → retry path; on **2nd
     attempt** trigger the existing manual key-in fallback, then call
     `CheckRefNo` to confirm the typed ref isn't a duplicate before
     accepting.

5. **Unit tests** for the lib (mock `fetch`) covering happy path, `401`,
   `413`, `415`, `429`, `500`, and `isValid=false` with a `name mismatch`.

6. **Integration / e2e test** against dev EPPS
   (`http://192.168.79.11:8500`) using a known-good fixture screenshot.

7. **`.env.example`** updated with `EPPS_BASE_URL` and `EPPS_API_KEY`;
   document both in the QuickFormsPH README.

8. **Do not touch EPPS source.** All changes live in the QuickFormsPH repo.

---

## Acceptance Checklist

- [ ] Dev smoke: upload the fixture receipt → `accepted: true`, form marked
  Paid.
- [ ] Dev smoke: re-upload the same receipt → `refNo.duplicate` →
  `accepted: false` with the existing "already used" message.
- [ ] Wrong-amount receipt → `amount.under` → `accepted: false` via existing
  copy.
- [ ] Bad / missing API key → alert ops (500 to caller); never a user-visible
  401.
- [ ] `429` → client gets queued-retry UX, not a raw error.
- [ ] No `X-Api-Key` in any bundled JS
  (`grep -r "X-Api-Key" .next/ dist/` must be empty).
- [ ] Jest / test suite green; lint clean.
- [ ] **No user-flow changes.** Manual QA compares screen-by-screen against
  the pre-integration checkout. Any new screen, extra button, or reworded
  prompt is a blocker unless approved by **@Gan**.
- [ ] 1st-attempt failure path unchanged (user can retry).
- [ ] 2nd-attempt failure triggers the existing manual key-in fallback (not
  a new UI).
- [ ] Manual-entered ref is run through `CheckRefNo` before acceptance.
- [ ] PR description includes a link to `INTEGRATION-GUIDE.md` and a
  screenshot of the happy-path test passing.

---

## Out of Scope (for this PR)

- Webhooks, refunds, reconciliation jobs.
- Any eWallet other than GCash.
- Changing the EPPS service itself.

---

## Handoff

Ping **@Gan** in the PR when ready for review. **Prod key** is issued only
after green CI + approved PR.

---

## Revision History

| Date | Rev | Author | Notes |
|---|---|---|---|
| 2026-04-24 | r1 | @Gan | Initial brief: backend-to-backend, isValid trust, rate-limit + error mapping. |
| 2026-04-24 | r2 | @Gan | Added Non-negotiable #7 (preserve existing user flow); clarified `humanize` reuses existing copy; added acceptance items for no-UX-change and 2nd-attempt manual key-in fallback with `CheckRefNo`. |
