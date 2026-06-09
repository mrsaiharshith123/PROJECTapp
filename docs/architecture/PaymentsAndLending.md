# Payments & legal lending (developer reference)

## Razorpay (client checkout)

| File | Role |
|------|------|
| `src/services/razorpaySubscription.js` | Load checkout script, open modal, server order/verify |
| `src/ui/features/profile/PlansModal.jsx` | Upgrade buttons, success/error state |
| `src/constants/subscriptionTiers.js` | Tier ids, prices, `PRO_FEATURES` / `POWER_FEATURES` |
| `src/ui/patterns/ProGate.jsx` | Feature gating by tier |
| `src/types/global.d.ts` | `window.Razorpay` types |

### Amounts (annual, paise)

| Tier | Paise | INR |
|------|-------|-----|
| Pro | `79900` | ₹799/yr |
| Power | `149900` | ₹1,499/yr |

### Dev with test keys

1. Add `VITE_RAZORPAY_KEY_ID=rzp_test_…` to `.env` and restart `npm run dev`.
2. When a Razorpay key is set, simulation mode is **off** — checkout uses the real Razorpay test modal.
3. Sign in before upgrading (payment is tied to your Supabase profile).

### Server verify

| File | Role |
|------|------|
| `supabase/functions/razorpay-checkout/index.ts` | Create order + verify HMAC signature |
| `src/services/razorpaySubscription.js` | Client orchestration (order → checkout → verify) |

Deploy: `supabase functions deploy razorpay-checkout` with secrets `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`.

### Production checklist

1. Set `VITE_RAZORPAY_KEY_ID` in CI secrets (live `rzp_live_…` key).
2. Deploy `razorpay-checkout` with live secrets.
3. Prefer verified flow — client-only fallback in `razorpaySubscription.js` is for dev without the function.

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
