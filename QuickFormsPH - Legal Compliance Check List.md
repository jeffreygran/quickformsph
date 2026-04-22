# QuickFormsPH — Legal Compliance Check List

**Jurisdiction:** Republic of the Philippines
**Primary Law:** Data Privacy Act of 2012 (RA 10173)
**Reviewed:** April 2026

---

## Governing Law Summary

QuickFormsPH falls under **RA 10173** because it:
- Collects personal data (names, addresses, civil status, gov IDs, etc.)
- Processes it into government form PDFs
- Temporarily stores it server-side for the paid-tier re-download feature

This classifies the app as a **Personal Information Controller (PIC)** for the paid tier and a **processor tool** for the free tier.

---

## Compliance Status

### ✅ Compliant — Already In Place

| Item | How It's Handled |
|---|---|
| HTTPS (encrypted transport) | Azure App Service enforces HTTPS |
| Input sanitization | `src/lib/sanitize.ts` — all user inputs sanitized before use |
| Rate limiting | `src/lib/rate-limit.ts` — per-IP limits on all API routes |
| IP blocklist | `src/lib/ip-blocklist.ts` — admin-managed blocklist |
| Security audit log | `src/lib/audit-log.ts` — append-only `.jsonl` with ring buffer |
| Privacy consent modal | Shown before first PDF generation; acknowledgement stored in `localStorage` |
| 48h auto-expiry of stored data | `expires_at` timestamp checked on every download; file deleted on expiry |
| Draft data stays client-side | `localStorage` only; never sent to server |
| No third-party data sharing | Confirmed in Privacy Policy Section 6 |
| No tracking cookies or analytics | Confirmed in Privacy Policy Section 5 |
| Privacy Policy page | `/privacy` — NPC-compliant |
| Contact for privacy concerns | `hello@jeffreygran.com` + NPC complaint path |

---

### 🔧 Remediated in April 2026

| Risk | Finding | Fix Applied |
|---|---|---|
| **Sensitive data stored unencrypted at rest** | Paid-tier `{code}.json` files contained full `values` (personal data) as plain JSON | **AES-256-GCM encryption** added via `src/lib/encrypt.ts`; `payment/confirm` encrypts before write, `download/[code]` decrypts on read |
| **False "no server storage" claim** | About page said "No data stored on any server" and "never sent to server" — false for paid tier | Corrected to accurate language describing free vs. paid tier data flow |
| **No government non-affiliation disclaimer** | No statement anywhere clarifying the app is private / not a government portal | Added to: global footer (`layout.tsx`) + About page (`about/page.tsx`) with ⚠️ badge |
| **Privacy Policy: no IP audit log disclosure** | IP addresses logged but not mentioned in policy | Added Section 3 — IP logging, 90-day retention policy |
| **Privacy Policy: inaccurate data flow description** | Section 2 implied everything runs locally | Rewritten with accurate free-tier vs. paid-tier breakdown |
| **Privacy Policy: no NPC complaint path** | Users had no escalation route | Added `privacy.gov.ph` link in Section 7 |

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/encrypt.ts` | **New** — AES-256-GCM `encryptValues()` / `decryptValues()` helpers |
| `src/app/api/payment/confirm/route.ts` | Encrypt `values` before writing `{code}.json` |
| `src/app/api/download/[code]/route.ts` | Decrypt on read; legacy plain-text fallback (phases out within 48h TTL) |
| `src/app/about/page.tsx` | Corrected data-flow statements; added non-affiliation disclaimer |
| `src/app/layout.tsx` | Non-affiliation line in global footer (visible on every page) |
| `src/app/privacy/page.tsx` | Full rewrite — IP log disclosure, non-affiliation, NPC link, accurate Section 2 |
| `.env.example` | Added `FORM_DATA_ENCRYPTION_KEY` with generation instructions |
| `.env.local` | Added `FORM_DATA_ENCRYPTION_KEY` (dev key — do not use in production) |

---

## Production Action Items

> These must be done manually — cannot be automated by code changes.

- [ ] **Set `FORM_DATA_ENCRYPTION_KEY` in Azure App Service** — generate a fresh production key:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Add via: Azure Portal → quickformsph-webapp → Configuration → Application settings

- [ ] **Verify HTTPS is enforced** on Azure App Service (HTTPS-only toggle → On)

- [ ] **Monitor user volume** — NPC registration is required if you cross certain thresholds or begin processing employee data at scale. Review NPC guidelines at [privacy.gov.ph](https://www.privacy.gov.ph) annually.

- [ ] **Review audit log retention** — confirm the 90-day IP log retention stated in the Privacy Policy matches actual server/Azure log settings.

---

## Legal Risk Matrix

| Scenario | Risk Level | Status |
|---|---|---|
| Free-tier (no storage) | 🟢 Low | No personal data retained server-side |
| Paid-tier (48h encrypted storage) | 🟡 Moderate | Mitigated: AES-256-GCM, auto-expiry, explicit consent |
| Users perceiving app as official govt portal | 🟡 Moderate | Mitigated: non-affiliation disclaimer in footer + About |
| IP address logging without disclosure | 🟡 Moderate | Mitigated: disclosed in Privacy Policy Section 3 |
| Large-scale storage / no NPC registration | 🔴 High (if triggered) | Mitigated: minimal retention, monitor thresholds |

---

## Key References

- Republic Act No. 10173 — Data Privacy Act of 2012
- NPC Implementing Rules and Regulations (IRR)
- NPC Advisory No. 2017-01 (Privacy Management Program)
- National Privacy Commission: [privacy.gov.ph](https://www.privacy.gov.ph)
