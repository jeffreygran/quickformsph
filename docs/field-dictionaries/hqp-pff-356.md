# Field Dictionary — Application for the Release of MP2 Annual Dividends

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | Application for the Release of MP2 Annual Dividends |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-PFF-356 (V02 (03/2024)) |
| **Category** | Savings & Dividends |
| **Slug** | `hqp-pff-356` |
| **Source PDF Location** | `public/forms/hqp-pff-356.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"hqp-pff-356", values:{…}}` |
| **Field Count** | 21 |
| **Steps / Sections** | 3 |

**Purpose:** Request release of your Pag-IBIG MP2 savings annual dividends via bank credit.

---

## 2) Form-Level Rules — **TODO (human)**

**User Type(s):**
- [ ] Individual
- [ ] Employer
- [ ] Self-employed
- [ ] OFW

**Completion Method:** [ ] Typed  [ ] Handwritten  [ ] Either

**Global Rules:**
- Required ink color: _TODO_
- Required capitalization: _TODO_  (e.g., ALL CAPS for legal names)
- Date format: `mm/dd/yyyy` (current default in schema)
- Signature required: [ ] Yes [ ] No
- Thumbmark required: [ ] Yes [ ] No
- Photo required: [ ] Yes [ ] No

**Agency-Use-Only fields (must remain blank):** _TODO — list all "For Office Use" sections._

---

## 3) Section Breakdown

| Section ID | Section Name | Page | Notes |
|---|---|---|---|
| S1 | Account Info | — | step 1, 7 fields |
| S2 | Contact & Address | — | step 2, 9 fields |
| S3 | Bank Details | — | step 3, 5 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mp2_account_no | Account Info | MP2 Account Number | Text (short) | Yes | Yes | inputMode=numeric | — | — | — | e.g., 01-2345-6789-0 |  |
| branch | Account Info | Pag-IBIG Branch | Text (short) | No | Yes |  | — | — | — | e.g., Quezon City Branch |  |
| last_name | Account Info | Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., DELA CRUZ |  |
| first_name | Account Info | First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., JUAN |  |
| middle_name | Account Info | Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | e.g., SANTOS |  |
| name_ext | Account Info | Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| mid_no | Account Info | Pag-IBIG MID No. | Text (short) | Yes | Yes | inputMode=numeric | — | Maybe | — | 0000-0000-0000 |  |
| street | Contact & Address | Street / House No. / Building | Text (short) | Yes | Yes |  | — | — | — | e.g., Unit 4B, 123 Rizal Street |  |
| barangay | Contact & Address | Barangay | Text (short) | Yes | Yes |  | — | — | — | e.g., Brgy. San Jose |  |
| city | Contact & Address | City / Municipality | Text (short) | Yes | Yes |  | — | — | — | e.g., Quezon City |  |
| province | Contact & Address | Province | Dropdown | Yes | Yes | options(83) | — | — | — |  |  |
| zip | Contact & Address | ZIP Code | Text (short) | Yes | Yes | inputMode=numeric | 4 | Maybe | — | 1100 |  |
| cellphone | Contact & Address | Cellphone Number | Text (phone) | Yes | Yes | inputMode=tel | — | — | — | 09XX-XXX-XXXX |  |
| email | Contact & Address | Email Address | Text (email) | No | Yes |  | — | — | — | your@email.com |  |
| home_tel | Contact & Address | Home Telephone No. | Text (phone) | No | Yes |  | — | — | — | (02) XXXX-XXXX |  |
| biz_tel | Contact & Address | Business Telephone No. | Text (phone) | No | Yes |  | — | — | — | (02) XXXX-XXXX |  |
| bank_name | Bank Details | Bank Name | Dropdown | No | Yes | options(14) | — | — | — |  |  |
| bank_account_no | Bank Details | Bank Account Number | Text (short) | No | Yes | inputMode=numeric | — | — | — | Enter bank account number |  |
| bank_branch | Bank Details | Bank Branch | Text (short) | No | Yes |  | — | — | — | e.g., Quezon Ave. Branch |  |
| bank_address | Bank Details | Bank Address | Text (long) | No | Yes |  | — | — | — | e.g., 123 Quezon Ave., Quezon City |  |
| date | Bank Details | Date | Date | No | Yes |  | — | — | — |  |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `name_ext` — Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `province` — Province  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Metro Manila (NCR) | Metro Manila (NCR) | No |
| Abra | Abra | No |
| Agusan del Norte | Agusan del Norte | No |
| Agusan del Sur | Agusan del Sur | No |
| Aklan | Aklan | No |
| Albay | Albay | No |
| Antique | Antique | No |
| Apayao | Apayao | No |
| Aurora | Aurora | No |
| Basilan | Basilan | No |
| Bataan | Bataan | No |
| Batanes | Batanes | No |
| Batangas | Batangas | No |
| Benguet | Benguet | No |
| Biliran | Biliran | No |
| Bohol | Bohol | No |
| Bukidnon | Bukidnon | No |
| Bulacan | Bulacan | No |
| Cagayan | Cagayan | No |
| Camarines Norte | Camarines Norte | No |
| Camarines Sur | Camarines Sur | No |
| Camiguin | Camiguin | No |
| Capiz | Capiz | No |
| Catanduanes | Catanduanes | No |
| Cavite | Cavite | No |
| Cebu | Cebu | No |
| Cotabato | Cotabato | No |
| Davao de Oro | Davao de Oro | No |
| Davao del Norte | Davao del Norte | No |
| Davao del Sur | Davao del Sur | No |
| Davao Occidental | Davao Occidental | No |
| Davao Oriental | Davao Oriental | No |
| Dinagat Islands | Dinagat Islands | No |
| Eastern Samar | Eastern Samar | No |
| Guimaras | Guimaras | No |
| Ifugao | Ifugao | No |
| Ilocos Norte | Ilocos Norte | No |
| Ilocos Sur | Ilocos Sur | No |
| Iloilo | Iloilo | No |
| Isabela | Isabela | No |
| Kalinga | Kalinga | No |
| La Union | La Union | No |
| Laguna | Laguna | No |
| Lanao del Norte | Lanao del Norte | No |
| Lanao del Sur | Lanao del Sur | No |
| Leyte | Leyte | No |
| Maguindanao del Norte | Maguindanao del Norte | No |
| Maguindanao del Sur | Maguindanao del Sur | No |
| Marinduque | Marinduque | No |
| Masbate | Masbate | No |
| Misamis Occidental | Misamis Occidental | No |
| Misamis Oriental | Misamis Oriental | No |
| Mountain Province | Mountain Province | No |
| Negros Occidental | Negros Occidental | No |
| Negros Oriental | Negros Oriental | No |
| Northern Samar | Northern Samar | No |
| Nueva Ecija | Nueva Ecija | No |
| Nueva Vizcaya | Nueva Vizcaya | No |
| Occidental Mindoro | Occidental Mindoro | No |
| Oriental Mindoro | Oriental Mindoro | No |
| Palawan | Palawan | No |
| Pampanga | Pampanga | No |
| Pangasinan | Pangasinan | No |
| Quezon | Quezon | No |
| Quirino | Quirino | No |
| Rizal | Rizal | No |
| Romblon | Romblon | No |
| Samar | Samar | No |
| Sarangani | Sarangani | No |
| Siquijor | Siquijor | No |
| Sorsogon | Sorsogon | No |
| South Cotabato | South Cotabato | No |
| Southern Leyte | Southern Leyte | No |
| Sultan Kudarat | Sultan Kudarat | No |
| Sulu | Sulu | No |
| Surigao del Norte | Surigao del Norte | No |
| Surigao del Sur | Surigao del Sur | No |
| Tarlac | Tarlac | No |
| Tawi-Tawi | Tawi-Tawi | No |
| Zambales | Zambales | No |
| Zamboanga del Norte | Zamboanga del Norte | No |
| Zamboanga del Sur | Zamboanga del Sur | No |
| Zamboanga Sibugay | Zamboanga Sibugay | No |

**Field Group:** `bank_name` — Bank Name  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
|  |  | No |
| BDO Unibank | BDO Unibank | No |
| Bank of the Philippine Islands (BPI) | Bank of the Philippine Islands (BPI) | No |
| Metrobank | Metrobank | No |
| UnionBank of the Philippines | UnionBank of the Philippines | No |
| RCBC | RCBC | No |
| Landbank of the Philippines | Landbank of the Philippines | No |
| Philippine National Bank (PNB) | Philippine National Bank (PNB) | No |
| Security Bank | Security Bank | No |
| Eastwest Bank | Eastwest Bank | No |
| Chinabank | Chinabank | No |
| GCash (GSave) | GCash (GSave) | No |
| Maya Bank | Maya Bank | No |
| Other | Other | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `HQP_PFF_356_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
Coordinates use pdf-lib origin (bottom-left); helper `<form>Y(nextRowTop) = pageH - nextRowTop + 3` converts pdfplumber top-origin row tops to pdf-lib Y.

---

## 7) HTML Form Translation Notes — **TODO (human)**

### UX Transformations Allowed
- _TODO_

### UX Constraints (Must Preserve)
- Do not merge segmented government fields (last/first/middle).
- Do not change field order.
- Do not remove mandatory fields even if redundant.

---

## 8) Common User Mistakes — **TODO (human)**

- _TODO_

---

## 9) QA Validation Checklist

- [x] Field coverage: every field mapped to coord or skip entry (`npm run test:coverage`)
- [x] Smoke test: random payload renders valid PDF (`npm run test:smoke`)
- [ ] Visual QA: rasterize page-1 at 100 DPI and confirm no off-page text
- [ ] Per-digit boxes (PIN/MID/TIN/ZIP) align character-by-character
- [ ] Multi-page alignment preserved across copies
- [ ] Conditional logic exercised end-to-end
- [ ] Mobile keyboard correct for numeric/email/tel fields

---

## 10) Change Log

| Date | Change | Reason | Updated By |
|---|---|---|---|
| 2026-04-23 | Initial auto-generated field dictionary | Adopt template from `projects/quickformsph/field_dictionary_template_government_forms.md` | scripts/generate-field-dictionaries.ts |

---

_Generated: 2026-04-23T17:02:26.384Z_
