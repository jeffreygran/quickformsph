# QuickForms Payment Screenshot OCR — Learnings & Fixes

**Date**: April 23, 2026  
**Affected feature**: GCash payment screenshot verification (`/api/payment/verify-screenshot`)

---

## Bug: OCR Failed on a Valid GCash Receipt Photo

### Symptom
User submitted a valid GCash payment screenshot but the OCR verification returned **Verification Failed** — none of the checks (phone, amount, ref no.) passed.

### Root Cause Analysis

The submitted image (`Gcashpayment-screenshot1.jpg`) was a **photo of a screen** displaying the GCash receipt in a file viewer (at 53% zoom). This caused multiple failure modes:

| Issue | Detail |
|-------|--------|
| **Photo-of-screen** | Not a direct phone screenshot — embedded in a dark background with UI chrome (Windows taskbar, file viewer buttons, zoom indicator) |
| **Low OCR contrast** | Receipt card on blue gradient background; surrounding dark area confuses Tesseract page segmentation |
| **Small text** | Receipt displayed at 53% zoom = effective low DPI for OCR |
| **Currency symbol** | ₱ (Philippine Peso) often OCR'd as `F`, `R`, or omitted entirely — old regex only accepted `₱`, `P`, `£` |
| **Amount format** | GCash shows "5.00-" with a trailing dash (separator line artifact) — while the old regex handled this, it missed bare amounts near "Total Amount Sent" |
| **Phone number** | Old regex: `\+63\s*917[\s.-]*551[\s.-]*4822` — too strict for screens where OCR may insert extra spaces or misread `+` |
| **Ref No. regex** | Old: `ref\s*no\.?\s+(\d[\d\s]{10,17}\d)` — didn't handle "Ref. No." with extra period, or dashes in the number group |
| **`capture="environment"`** | File input forced camera-only on iOS/Android, preventing users from selecting from photo library |

---

## Fixes Applied

### 1. ImageMagick Preprocessing (`verify-screenshot/route.ts`)
Before passing the image to Tesseract, now runs:
```
convert <input>
  -auto-orient          ← fix EXIF rotation (phone photos)
  -colorspace Gray      ← grayscale significantly improves Tesseract
  -auto-level           ← maximize contrast range
  -sharpen 0x1          ← crisp text edges
  -resize 200%          ← 2× upscale for small/zoomed text
  -density 300          ← hint 300 DPI for Tesseract
  <output>
```
Falls back to original image if ImageMagick fails.

### 2. Better Tesseract Options
Changed from bare `tesseract` call to:
```
tesseract <img> stdout -l eng --oem 3 --psm 3
```
- `--oem 3`: LSTM + Legacy (best accuracy)
- `--psm 3`: Auto page segmentation with OSD (handles complex backgrounds)

### 3. More Robust Regex Patterns

**Phone** — now handles extra OCR spaces between digit groups and mangled `+`:
```js
/(?:\+63|0063|0)?[\s.-]*9[\s.-]*1[\s.-]*7[\s.-]*[5s][\s.-]*5[\s.-]*1[\s.-]*4[\s.-]*8[\s.-]*2[\s.-]*2/i
```

**Amount** — fallback chain:
```js
text.match(/(?:[₱P£F]\s*)(\d+(?:\.\d+)?/)          // currency prefix
  ?? text.match(/total\s+amount\s+sent[^\d]*(\d+…/i)  // label-based
  ?? text.match(/amount[^\d]*(\d+…/i)                  // bare fallback
```

**Ref No.** — handles "Ref. No.", colons, dashes in number:
```js
text.match(/ref\.?\s*no\.?\s+(\d[\d\s-]{10,17}\d)/i)
  ?? text.match(/ref\s+no\.?\s*[:\-]?\s*(\d[\d\s-]{10,17}\d)/i)
```

### 4. Removed `capture="environment"` from File Input
The `capture` attribute forced camera-only on mobile. Removing it presents the OS picker (Camera OR Photo Library), which is the correct UX for both iOS and Android.

---

## Prevention Guidelines

1. **Never use `capture="environment"` alone** for payment screenshot inputs — always let users pick from their gallery.
2. **Always preprocess images** before OCR — real-world images are noisy; Tesseract performs 2–3× better on preprocessed images.
3. **Use fallback regex chains** for OCR fields — the primary regex handles the ideal case; fallbacks handle screen photos, different devices, and OCR noise.
4. **Test with real-world photos** not just direct screenshots — users routinely photograph their screens.
5. **Log OCR text to server console** in non-production environments to diagnose failures without exposing data.
6. **Provide manual ref entry fallback** after 2 failed screenshot attempts — always have a human escape hatch.

---

## Known Remaining Limitations
- Very low-light or heavily blurred phone camera photos may still fail — manual ref entry is the fallback.
- Receipt screenshots with heavy screenshot-app overlays (e.g., color filters, stickers) may cause OCR issues.
- `--psm 3` works well for most layouts but a portrait phone screenshot of the receipt with no surrounding UI is still the ideal input.
