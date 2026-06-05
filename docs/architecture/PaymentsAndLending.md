# Payments & legal lending (developer reference)

## Razorpay (client checkout)

| File | Role |
|------|------|
| `src/services/razorpay.js` | Load checkout script, open modal |
| `src/ui/features/profile/PlansModal.jsx` | Upgrade buttons, success/error state |
| `src/constants/subscriptionTiers.js` | Tier ids, prices, `PRO_FEATURES` / `POWER_FEATURES` |
| `src/ui/patterns/ProGate.jsx` | Feature gating by tier |
| `src/types/global.d.ts` | `window.Razorpay` types |

### Amounts (annual, paise)

| Tier | Paise | INR |
|------|-------|-----|
| Pro | `79900` | ₹799/yr |
| Power | `149900` | ₹1,499/yr |

### Production checklist

1. Set `VITE_RAZORPAY_KEY_ID` in CI secrets (live key in production).
2. Implement Supabase Edge Function to verify payment signature + order id.
3. Only set `subscriptionTier` after server confirms payment — replace client-only handler in `PlansModal`.

## Promissory note export

| File | Role |
|------|------|
| `src/engines/lendingAgreement.js` | `buildPromissoryNoteText()`, `numberToWords()`, `isAgreementFullyLocked()` |
| `src/utils/agreementExport.js` | `generateLegalAgreementHtml()`, `downloadLendingAgreementHtml()` |
| `src/ui/features/lending/LendingDetailDashboard.jsx` | **Print agreement** button (unchanged entry point) |

### Flow today

1. User opens lending detail → **Print agreement**.
2. Export uses `buildPromissoryNoteText()` unless `lending.agreementText` is already set.
3. HTML includes stamp-duty banner when `esignStatus !== "completed"`.

### Optional lending fields

Engine reads these when present (UI to collect them is deferred):

```
borrowerFullName, borrowerAddress, borrowerPhone
lenderFullName, lenderAddress, lenderPhone
loanPurpose, agreementCity
witness1Name, witness1Phone
idProofType, idProofLast4
penaltyRatePerMonth, arbitrationClause
esignStatus, esignDocumentId, esignCompletedAt
lenderConfirmedAt, borrowerConfirmedAt, lenderConfirmationRef
```

## Declared confirmation (not eSign)

| File | Role |
|------|------|
| `src/services/otpConfirmation.js` | `generateConfirmationRef()`, `buildConfirmationRecord()`, `verifyPhoneLast4()` |
| `src/services/__tests__/otpConfirmation.test.js` | Unit tests |

This is **not** Aadhaar OTP eSign. For court-grade digital signatures, integrate a licensed provider (e.g. Leegality) in a future phase.

## Tests

```bash
npm test -- numberToWords
npm test -- otpConfirmation
```

## Related

- [../09-implementation-status.md](../09-implementation-status.md) — shipped vs deferred
- [../06-workflow.md](../06-workflow.md) — contributor checklists
