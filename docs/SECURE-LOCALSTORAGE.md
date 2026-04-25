# QuickFormsPH — Client-Side Storage Security

> **Document type:** Engineering Reference
> **Scope:** Browser localStorage / IndexedDB — encryption standard and implementation
> **Status:** Active — adopted April 2026
> **Maintained by:** QuickFormsPH Engineering Team

---

## Overview

QuickFormsPH stores a small set of non-server-side state in the browser to enable draft
auto-save, offline mode readiness, and session continuity. All values that contain
user-identifiable data are encrypted before being written to `localStorage` using the
browser's built-in **Web Crypto API** (`SubtleCrypto`).

This document describes the threat model, the chosen cryptographic approach, the key
management strategy, and the specific storage keys that fall under this policy.

---

## Threat Model

Client-side encryption protects against:

| Threat | Protected? |
|---|---|
| Passive disk inspection (another OS user reads the browser profile directory) | ✅ Yes |
| Browser DevTools → Application → Storage dump | ✅ Yes |
| Browser extension reading raw `localStorage` values | ✅ Yes |
| Active XSS attack (attacker runs JS in our origin) | ⚠️ Partial — see note |
| Server-side data breach | ✅ N/A — encrypted data never reaches the server |

> **XSS note:** An attacker with arbitrary JS execution in the origin can read both
> `localStorage` *and* `IndexedDB`. Client-side encryption does not substitute for
> a strict [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
> QuickFormsPH enforces CSP headers at the Cloudflare / Next.js layer as a complementary
> control.

---

## Cryptographic Standard

### Algorithm: AES-256-GCM

QuickFormsPH uses **AES-256-GCM** (Advanced Encryption Standard, 256-bit key,
Galois/Counter Mode) for all localStorage encryption.

| Property | Value |
|---|---|
| Algorithm | AES-GCM |
| Key length | 256 bits |
| IV length | 96 bits (12 bytes) — NIST SP 800-38D recommended size |
| Authentication tag | 128 bits (16 bytes) — detects ciphertext tampering |
| IV generation | `crypto.getRandomValues()` — cryptographically secure, fresh per write |
| API | [Web Crypto API — `SubtleCrypto`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) |

GCM mode provides **authenticated encryption**: any tampering with the ciphertext or IV
will cause `decrypt()` to throw, preventing silent data corruption.

### Why not AES-CBC?

AES-CBC requires a separate MAC (message authentication code) to detect tampering.
AES-GCM provides confidentiality + integrity in a single pass and is the NIST-recommended
mode for new applications.

---

## Key Management

### Strategy: Non-extractable CryptoKey in IndexedDB

The encryption key is **never stored in `localStorage`** alongside the ciphertext.

```
┌─────────────────────────────────────────────────────┐
│  localStorage                                        │
│  qfph_draft_{slug}  →  { v:1, iv:[...], data:[...] }│  ← ciphertext only
│  qfph_access_token  →  { v:1, iv:[...], data:[...] }│
└─────────────────────────────────────────────────────┘
          ↑ encrypted/decrypted by ↓
┌─────────────────────────────────────────────────────┐
│  IndexedDB  (qfph_secure_v1 / keys store)           │
│  "main"  →  CryptoKey (non-extractable, AES-GCM)    │  ← key only, never in LS
└─────────────────────────────────────────────────────┘
```

**Key properties:**

| Property | Value | Rationale |
|---|---|---|
| `extractable` | `false` | Key cannot be exported or read from JS — bound to the origin |
| Scope | Browser origin (`https://www.quickformsph.com`) | IDB is same-origin; inaccessible from other sites |
| Lifetime | Until the user clears site data | Tied to the browser profile; lost ciphertexts are auto-removed |
| Generation | `SubtleCrypto.generateKey()` on first use | CSPRNG-backed; not user-derived |

### Key Loss Handling

If the IndexedDB key is deleted (e.g., the user clears site data) while old ciphertext
remains in `localStorage`, the decryption call will throw. The library catches this,
removes the unreadable entry, and returns `null` — the same behaviour as if the key
had never existed. Affected flows (draft restore, token restore) gracefully restart.

---

## Implementation: `src/lib/secure-storage.ts`

The canonical implementation lives in:

```
src/lib/secure-storage.ts
```

**Public API:**

```typescript
// Encrypt `value` with AES-256-GCM and write to localStorage under `storageKey`.
secureSet(storageKey: string, value: string): Promise<void>

// Read and decrypt. Returns null if key is absent or unreadable.
secureGet(storageKey: string): Promise<string | null>

// Remove the entry from localStorage.
secureRemove(storageKey: string): Promise<void>
```

**Stored payload format (JSON, base-10 byte arrays):**

```jsonc
{
  "v":    1,              // schema version — allows future migration
  "iv":   [/* 12 bytes */],
  "data": [/* AES-GCM ciphertext + 16-byte auth tag appended by SubtleCrypto */]
}
```

**Graceful degradation:** If `SubtleCrypto` or `IndexedDB` is unavailable (very old
browsers, certain private-browsing implementations), the library falls back to plain
`localStorage` writes. Affected browsers represent < 0.1% of current global web traffic
([Can I Use — SubtleCrypto](https://caniuse.com/cryptography)).

---

## Encrypted Storage Keys

| localStorage key | Contains | Encrypted |
|---|---|---|
| `qfph_draft_{slug}` | Form field values (personal info) | ✅ Yes |
| `qfph_access_token_v2` | Payment token + reference number | ✅ Yes |
| `qfph_last_code` | 5-character download code + expiry timestamp | ✅ Yes |
| `qfph_admin_user` | Admin username (no password stored) | ✅ Yes |
| `qfph_local_ready_{slug}` | Boolean readiness flag (`"1"`) | — Not sensitive |
| `qfph_local_privacy_ack` | Boolean consent flag (`"1"`) | — Not sensitive |

---

## Relationship to Server-Side Encryption

QuickFormsPH uses a layered encryption approach:

| Layer | What is encrypted | Algorithm | Key storage |
|---|---|---|---|
| **Browser (this document)** | Draft data, tokens, codes — in localStorage | AES-256-GCM | IndexedDB (non-extractable CryptoKey) |
| **Server at rest** | Paid-tier form values — in `{code}.json` files | AES-256-GCM | `FORM_DATA_ENCRYPTION_KEY` env var (see `src/lib/encrypt.ts`) |

These two layers are independent. Browser-encrypted data is decrypted client-side before
PDF generation. Server-encrypted data is decrypted server-side at download time.
Form values are **never** transmitted in encrypted browser form to the server.

---

## External References

| Resource | URL |
|---|---|
| MDN — Web Crypto API (`SubtleCrypto`) | https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto |
| NIST SP 800-38D — GCM Recommendation | https://csrc.nist.gov/publications/detail/sp/800-38d/final |
| OWASP HTML5 Security — localStorage | https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage |
| OWASP Cryptographic Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html |
| Can I Use — Web Crypto API | https://caniuse.com/cryptography |

---

## Changelog

| Date | Change |
|---|---|
| 2026-04-25 | Initial document. AES-256-GCM + IDB key strategy adopted across all sensitive localStorage keys. |
