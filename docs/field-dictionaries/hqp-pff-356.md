# Field Dictionary — Application for the Release of MP2 Annual Dividends

> Authoritative reference for HQP-PFF-356. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | Application for the Release of MP2 Annual Dividends |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-PFF-356 (V02 (03/2024)) |
| **Category** | Savings & Dividends |
| **Slug** | `hqp-pff-356` |
| **Source PDF** | `public/forms/hqp-pff-356.pdf` |
| **API** | `POST /api/generate` body `{slug:"hqp-pff-356", values:{…}}` |
| **Field Count** | 21 |
| **Steps / Sections** | 3 |

**Purpose:** Request release of your Pag-IBIG MP2 savings annual dividends via bank credit.
<!-- AUTOGEN:END name="metadata" -->

---

## 2) Form-Level Rules

> _Human-curated. Edit freely; regen will not touch this section._

**User Type(s):**
- [ ] Individual
- [ ] Employer
- [ ] Self-employed
- [ ] OFW

**Completion Method:** [ ] Typed  [ ] Handwritten  [ ] Either

**Global Rules:**
- Required ink color: _TODO_
- Required capitalization: _TODO_
- Date format: `mm/dd/yyyy`
- Signature required: [ ] Yes [ ] No
- Thumbmark required: [ ] Yes [ ] No
- Photo required: [ ] Yes [ ] No

**Agency-Use-Only fields (must remain blank):** _TODO_

---

## 3) Section Breakdown

<!-- AUTOGEN:START name="sections" -->
| Section ID | Section Name | Notes |
|---|---|---|
| S1 | Account Info | 7 fields |
| S2 | Contact & Address | 9 fields |
| S3 | Bank Details | 5 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `mp2_account_no` | Account Info | MP2 Account Number | Text | Yes | inputMode=numeric | — | e.g., 01-2345-6789-0 |
| `branch` | Account Info | Pag-IBIG Branch | Text | No |  | — | e.g., Quezon City Branch |
| `last_name` | Account Info | Last Name | Text | Yes | UPPERCASE | — | e.g., DELA CRUZ |
| `first_name` | Account Info | First Name | Text | Yes | UPPERCASE | — | e.g., JUAN |
| `middle_name` | Account Info | Middle Name | Text | No | UPPERCASE | — | e.g., SANTOS |
| `name_ext` | Account Info | Name Extension | Dropdown | No | 6 options | — |  |
| `mid_no` | Account Info | Pag-IBIG MID No. | Text | Yes | inputMode=numeric | — | 0000-0000-0000 |
| `street` | Contact & Address | Street / House No. / Building | Text | Yes |  | — | e.g., Unit 4B, 123 Rizal Street |
| `barangay` | Contact & Address | Barangay | Text | Yes |  | — | e.g., Brgy. San Jose |
| `city` | Contact & Address | City / Municipality | Text | Yes |  | — | e.g., Quezon City |
| `province` | Contact & Address | Province | Dropdown | Yes | 83 options | — |  |
| `zip` | Contact & Address | ZIP Code | Text | Yes | inputMode=numeric | 4 | 1100 |
| `cellphone` | Contact & Address | Cellphone Number | Text (phone) | Yes | inputMode=tel | — | 09XX-XXX-XXXX |
| `email` | Contact & Address | Email Address | Text (email) | No |  | — | your@email.com |
| `home_tel` | Contact & Address | Home Telephone No. | Text (phone) | No |  | — | (02) XXXX-XXXX |
| `biz_tel` | Contact & Address | Business Telephone No. | Text (phone) | No |  | — | (02) XXXX-XXXX |
| `bank_name` | Bank Details | Bank Name | Dropdown | No | 14 options | — |  |
| `bank_account_no` | Bank Details | Bank Account Number | Text | No | inputMode=numeric | — | Enter bank account number |
| `bank_branch` | Bank Details | Bank Branch | Text | No |  | — | e.g., Quezon Ave. Branch |
| `bank_address` | Bank Details | Bank Address | Text (long) | No |  | — | e.g., 123 Quezon Ave., Quezon City |
| `date` | Bank Details | Date | Date | No |  | — |  |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`name_ext` — Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`province` — Province** (dropdown)

| Option | Value |
|---|---|
| Metro Manila (NCR) | `Metro Manila (NCR)` |
| Abra | `Abra` |
| Agusan del Norte | `Agusan del Norte` |
| Agusan del Sur | `Agusan del Sur` |
| Aklan | `Aklan` |
| Albay | `Albay` |
| Antique | `Antique` |
| Apayao | `Apayao` |
| Aurora | `Aurora` |
| Basilan | `Basilan` |
| Bataan | `Bataan` |
| Batanes | `Batanes` |
| Batangas | `Batangas` |
| Benguet | `Benguet` |
| Biliran | `Biliran` |
| Bohol | `Bohol` |
| Bukidnon | `Bukidnon` |
| Bulacan | `Bulacan` |
| Cagayan | `Cagayan` |
| Camarines Norte | `Camarines Norte` |
| Camarines Sur | `Camarines Sur` |
| Camiguin | `Camiguin` |
| Capiz | `Capiz` |
| Catanduanes | `Catanduanes` |
| Cavite | `Cavite` |
| Cebu | `Cebu` |
| Cotabato | `Cotabato` |
| Davao de Oro | `Davao de Oro` |
| Davao del Norte | `Davao del Norte` |
| Davao del Sur | `Davao del Sur` |
| Davao Occidental | `Davao Occidental` |
| Davao Oriental | `Davao Oriental` |
| Dinagat Islands | `Dinagat Islands` |
| Eastern Samar | `Eastern Samar` |
| Guimaras | `Guimaras` |
| Ifugao | `Ifugao` |
| Ilocos Norte | `Ilocos Norte` |
| Ilocos Sur | `Ilocos Sur` |
| Iloilo | `Iloilo` |
| Isabela | `Isabela` |
| Kalinga | `Kalinga` |
| La Union | `La Union` |
| Laguna | `Laguna` |
| Lanao del Norte | `Lanao del Norte` |
| Lanao del Sur | `Lanao del Sur` |
| Leyte | `Leyte` |
| Maguindanao del Norte | `Maguindanao del Norte` |
| Maguindanao del Sur | `Maguindanao del Sur` |
| Marinduque | `Marinduque` |
| Masbate | `Masbate` |
| Misamis Occidental | `Misamis Occidental` |
| Misamis Oriental | `Misamis Oriental` |
| Mountain Province | `Mountain Province` |
| Negros Occidental | `Negros Occidental` |
| Negros Oriental | `Negros Oriental` |
| Northern Samar | `Northern Samar` |
| Nueva Ecija | `Nueva Ecija` |
| Nueva Vizcaya | `Nueva Vizcaya` |
| Occidental Mindoro | `Occidental Mindoro` |
| Oriental Mindoro | `Oriental Mindoro` |
| Palawan | `Palawan` |
| Pampanga | `Pampanga` |
| Pangasinan | `Pangasinan` |
| Quezon | `Quezon` |
| Quirino | `Quirino` |
| Rizal | `Rizal` |
| Romblon | `Romblon` |
| Samar | `Samar` |
| Sarangani | `Sarangani` |
| Siquijor | `Siquijor` |
| Sorsogon | `Sorsogon` |
| South Cotabato | `South Cotabato` |
| Southern Leyte | `Southern Leyte` |
| Sultan Kudarat | `Sultan Kudarat` |
| Sulu | `Sulu` |
| Surigao del Norte | `Surigao del Norte` |
| Surigao del Sur | `Surigao del Sur` |
| Tarlac | `Tarlac` |
| Tawi-Tawi | `Tawi-Tawi` |
| Zambales | `Zambales` |
| Zamboanga del Norte | `Zamboanga del Norte` |
| Zamboanga del Sur | `Zamboanga del Sur` |
| Zamboanga Sibugay | `Zamboanga Sibugay` |

**`bank_name` — Bank Name** (dropdown)

| Option | Value |
|---|---|
|  | `` |
| BDO Unibank | `BDO Unibank` |
| Bank of the Philippine Islands (BPI) | `Bank of the Philippine Islands (BPI)` |
| Metrobank | `Metrobank` |
| UnionBank of the Philippines | `UnionBank of the Philippines` |
| RCBC | `RCBC` |
| Landbank of the Philippines | `Landbank of the Philippines` |
| Philippine National Bank (PNB) | `Philippine National Bank (PNB)` |
| Security Bank | `Security Bank` |
| Eastwest Bank | `Eastwest Bank` |
| Chinabank | `Chinabank` |
| GCash (GSave) | `GCash (GSave)` |
| Maya Bank | `Maya Bank` |
| Other | `Other` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0, -449.4
**Checkbox coord groups:** 0

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `bank_account_no` | 0 | 131 | 678.00 | undefined | 135 | ✓ |
| `bank_address` | 0 | 100 | 648.00 | undefined | 168 | ✓ |
| `bank_branch` | 0 | 97 | 663.00 | undefined | 170 | ✓ |
| `barangay` | 0 | 37 | 740.00 | undefined | 225 | ✓ |
| `biz_tel` | 0 | 403 | 727.00 | undefined | 175 | ✓ |
| `branch` | 0 | 252 | 874.00 | undefined | 115 | ✓ |
| `cellphone` | 0 | 271 | 751.00 | undefined | 123 | ✓ |
| `city` | 0 | 37 | 728.00 | undefined | 88 | ✓ |
| `date` | 0 | 393 | 591.00 | undefined | 90 | ✓ |
| `email` | 0 | 403 | 751.00 | undefined | 175 | ✓ |
| `first_name` | 0 | 120 | 791.00 | undefined | 72 | ✓ |
| `home_tel` | 0 | 271 | 727.00 | undefined | 123 | ✓ |
| `last_name` | 0 | 37 | 791.00 | undefined | 75 | ✓ |
| `mid_no` | 0 | 403 | 791.00 | undefined | 175 | ✓ |
| `middle_name` | 0 | 332 | 791.00 | undefined | 62 | ✓ |
| `mp2_account_no` | 0 | 403 | 817.00 | undefined | 175 | ✓ |
| `name_ext` | 0 | 200 | 791.00 | undefined | 124 | ✓ |
| `province` | 0 | 130 | 728.00 | undefined | 100 | ✓ |
| `street` | 0 | 37 | 752.00 | undefined | 225 | ✓ |
| `zip` | 0 | 235 | 728.00 | undefined | 27 | ✓ |

**Skip values (treated as blank):**

- `name_ext`: `N/A`
- `bank_name`: `<empty>`, `Other`
<!-- AUTOGEN:END name="layout" -->

---

## 7) HTML Form Translation Notes

> _Human-curated._

### UX Transformations Allowed
- _TODO_

### UX Constraints (Must Preserve)
- Do not merge segmented government fields (last/first/middle).
- Do not change field order.
- Do not remove mandatory fields even if redundant.

---

## 8) Common User Mistakes

> _Human-curated._

- _TODO_

---

## 9) QA Validation Checklist

<!-- AUTOGEN:START name="qa-checklist" -->
- [x] Coverage CI: every field has coord or skip entry — `npm run test:coverage`
- [x] Smoke test: random payload renders valid PDF — `npm run test:smoke`
- [ ] Visual QA: rasterize at 100 DPI, no off-page text or wrong-cell overflow
- [ ] Per-digit boxes (PIN/MID/TIN/ZIP) align character-by-character
- [ ] Multi-page / multi-copy alignment preserved
- [ ] Conditional logic exercised end-to-end
- [ ] Mobile keyboard correct for numeric / email / tel fields
<!-- AUTOGEN:END name="qa-checklist" -->

---

## 10) Change Log

> _Append-only history. Add a row whenever the form version changes or a coord bug is fixed._

| Date | Change | Reason | Updated By |
|---|---|---|---|
| 2026-04-23 | Initial dictionary | Adopt template | scripts/generate-field-dictionaries.ts |
