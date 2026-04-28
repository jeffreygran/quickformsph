// Pag-IBIG MPL Loan Purposes — from SLF-065 form (HQP-SLF-065 v.07).
// Used as an autocomplete source AND as a contextual-hints map on dropdowns
// (rendered when the user selects an option).
//
// Sources:
//   - SLF-065 PDF (Loan Particulars section): /public/forms/Pagibig - SLF065_MultiPurposeLoanApplicationForm.pdf
//   - Pag-IBIG Member Handbook (2025 ed.) — required attachments per purpose

export const PH_LOAN_PURPOSES_MPL: string[] = [
  'Livelihood / additional capital in small business',
  'Tuition / Educational Expenses',
  'Payment of utility / credit card bills',
  'Purchase of appliance & furniture / electronic gadgets',
  'Minor home improvement / home renovation / upgrades',
  'Vacation / travel',
  'Special events',
  'Car repair',
  'Health & wellness',
  'Others',
];

/**
 * Per-option contextual hint shown when the user selects a loan purpose.
 * Keyed by the EXACT option string above.
 */
export const PH_LOAN_PURPOSES_MPL_HINTS: Record<string, string> = {
  'Livelihood / additional capital in small business':
    'Attach DTI registration, business plan, or barangay clearance to speed approval.',
  'Tuition / Educational Expenses':
    'Attach proof of enrollment or school assessment / demand letter.',
  'Payment of utility / credit card bills':
    'Attach the latest statement of account from the creditor.',
  'Purchase of appliance & furniture / electronic gadgets':
    'A pro-forma invoice / quotation from an accredited retailer is recommended.',
  'Minor home improvement / home renovation / upgrades':
    'A contractor quote or list of materials helps Pag-IBIG validate the amount.',
  'Vacation / travel':
    'For larger amounts, an itinerary or booking confirmation may be requested.',
  'Special events':
    'Vendor quotes (catering, venue, supplier) speed processing for weddings, birthdays, etc.',
  'Car repair':
    'Attach the auto-shop estimate or quotation for the repair scope.',
  'Health & wellness':
    'Medical certificate or hospital quote helps justify the requested amount.',
  'Others':
    'Provide a brief written justification when you submit the form.',
};
