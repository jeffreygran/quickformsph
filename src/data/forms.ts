// Form schema definitions for QuickFormsPH
// Fields are AI-extracted; currently hard-coded for HQP-PFF-356

import {
  PH_LOAN_PURPOSES_MPL,
  PH_LOAN_PURPOSES_MPL_HINTS,
} from './autocomplete-sources/ph_loan_purposes_mpl';

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'autocomplete'
  | 'textarea'
  | 'checkbox';

/**
 * Smart-assistance input mask. When set, the FieldInput auto-formats
 * the user's typed text. See src/lib/smart-assistance.ts.
 */
export type FieldMask = 'mid' | 'tin' | 'date' | 'time' | 'currency' | 'mobile' | 'zip' | 'pin' | 'psn' | 'pen' | 'landline' | 'phPhone' | 'hciPan' | 'hcpPan';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  optional_note?: string;
  placeholder?: string;
  hint?: string;
  options?: string[];          // for dropdown
  /**
   * For type='autocomplete': key into AUTOCOMPLETE_SOURCES registry
   * (see src/data/autocomplete-sources/index.ts).
   * Examples: 'ph_cities', 'ph_provinces', 'ph_banks', 'countries'.
   */
  optionsSource?: string;
  /**
   * Smart-assistance per-option contextual hint shown in green when the
   * user selects this value. Keys must match `options` (for dropdowns) or
   * any value coming from `optionsSource` (for autocomplete fields).
   */
  optionHints?: Record<string, string>;
  /**
   * Smart-assistance: when set, value is auto-formatted as the user types.
   * See FieldMask above.
   */
  mask?: FieldMask;
  /**
   * Smart-assistance: when this field is bound to a sibling checkbox of
   * `type:'checkbox'` whose id is `${mirrorGroup}`, ticking that checkbox
   * mirrors `mirrorFrom` field's value into this field.
   */
  mirrorFrom?: string;
  mirrorGroup?: string;
  /**
   * Smart-assistance: hide this field when another field's value does not
   * satisfy the predicate. Used to declutter optional sections (e.g. CSF-2018
   * "Has employer" toggle hides the entire Employer block).
   * - `equals`     : show when target value === equals
   * - `notEmpty`   : show when target value is non-empty
   * - `equalsOneOf`: show when target value matches any in the array
   */
  visibleWhen?:
    | { field: string; equals: string }
    | { field: string; equalsOneOf: string[] }
    | { field: string; notEmpty: true };
  maxLength?: number;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text';
  autoUppercase?: boolean;
  step?: number;               // wizard step this field belongs to (1-indexed)
  /**
   * Soft-validation regex (string form, parsed at the call site).
   * When the value is non-empty AND does not match, a warning is shown
   * beneath the input; submit is NOT blocked unless `NEXT_PUBLIC_QFPH_TIN_HARD=1`.
   * See L-TINSOFT-01 in QuickFormsPH-PDFGenerationLearnings.md.
   */
  warnPattern?: string;
  warnMessage?: string;
}

/**
 * Smart Assistance configuration that lives on a FormSchema.
 * Drives the optional Smart Panel (eligibility checks + amortization
 * calculator) shown on form steps. Fully OFFLINE — no API calls.
 */
export interface SmartAssistanceConfig {
  amortization?: {
    principalFieldId: string;
    termFieldId: string;
    /** annual interest rate as decimal, e.g. 0.055 for 5.5% */
    annualRate: number;
    /** dropdown labels → numeric months (e.g. "One (1) Year" → 12) */
    termMap: Record<string, number>;
    label?: string;
  };
  eligibility?: Array<
    | { id: string; label: string; rule: 'age-min'; fieldId: string; min: number }
    | { id: string; label: string; rule: 'months-min'; fieldId: string; min: number }
    | { id: string; label: string; rule: 'amount-max'; fieldId: string; max: number }
    | { id: string; label: string; rule: 'digits-eq'; fieldId: string; count: number }
    | { id: string; label: string; rule: 'email'; fieldId: string }
    | { id: string; label: string; rule: 'date-not-before'; fieldId: string; notBeforeFieldId: string }
    | { id: string; label: string; rule: 'days-since-max'; fieldId: string; max: number }
    /** True when at least one of the listed fields has a non-empty value.
     *  L-SMART-PMRF-FN-01 (any-non-empty): cascade-ready for any form that
     *  accepts alternative IDs (e.g. ACR I-Card OR PRA SRRV). */
    | { id: string; label: string; rule: 'any-non-empty'; fieldIds: string[] }
    /** PH phone: passes when the digit-only count is 10 (landline w/o leading 0)
     *  or 11 (mobile starting 09). Pairs with mask:'phPhone'.
     *  L-SMART-PMRF-FN-01. */
    | { id: string; label: string; rule: 'phone-ph'; fieldId: string }
  >;
}

export interface FormSchema {
  slug: string;
  code: string;
  version: string;
  name: string;
  agency: string;
  category: string;
  pdfPath: string;             // relative to /public/forms/
  description: string;
  fields: FormField[];
  steps: { label: string; fieldIds: string[] }[];
  /**
   * Optional smart-assistance config. When defined, the Form Editor renders
   * a Smart Panel with live eligibility checks + amortization (if applicable).
   * See L-SMART-01 in QuickFormsPH-PDFGenerationLearnings.md.
   */
  smartAssistance?: SmartAssistanceConfig;
}

// ─── HQP-PFF-356 ─────────────────────────────────────────────────────────────
const hqpPff356: FormSchema = {
  slug: 'hqp-pff-356',
  code: 'HQP-PFF-356',
  version: 'V02 (03/2024)',
  name: 'Application for the Release of MP2 Annual Dividends',
  agency: 'Pag-IBIG Fund',
  category: 'Savings & Dividends',
  pdfPath: 'hqp-pff-356.pdf',
  description:
    'Request release of your Pag-IBIG MP2 savings annual dividends via bank credit.',
  steps: [
    {
      label: 'Account Info',
      fieldIds: ['mp2_account_no', 'branch', 'last_name', 'first_name', 'middle_name', 'name_ext', 'mid_no'],
    },
    {
      label: 'Contact & Address',
      fieldIds: ['street', 'barangay', 'city', 'province', 'zip', 'cellphone', 'email', 'home_tel', 'biz_tel'],
    },
    {
      label: 'Bank Details',
      fieldIds: ['bank_name', 'bank_account_no', 'bank_branch', 'bank_address', 'date'],
    },
  ],
  fields: [
    // ── Step 1: Account Info ──
    {
      id: 'mp2_account_no',
      label: 'MP2 Account Number',
      type: 'text',
      required: true,
      placeholder: 'e.g., 01-2345-6789-0',
      hint: 'Your 12-digit Pag-IBIG MP2 savings account number',
      inputMode: 'numeric', maxLength: 14,
      step: 1,
    },
    {
      id: 'branch',
      label: 'Pag-IBIG Branch',
      type: 'autocomplete',
      optionsSource: 'ph_pagibig_branches',
      required: false,
      placeholder: 'e.g., Quezon City-Cubao Branch',
      hint: 'Branch where you are submitting this form',
      step: 1,
    },
    {
      id: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., DELA CRUZ',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., JUAN',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'middle_name',
      label: 'Middle Name',
      type: 'text',
      required: false,
      placeholder: 'e.g., SANTOS',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'name_ext',
      label: 'Name Extension',
      type: 'dropdown',
      required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'],
      step: 1,
    },
    {
      id: 'mid_no',
      label: 'Pag-IBIG MID No.',
      type: 'text',
      required: true,
      placeholder: '0000-0000-0000',
      hint: 'Found on your Pag-IBIG ID or virtual account',
      inputMode: 'numeric', maxLength: 14,
      step: 1,
    },

    // ── Step 2: Contact & Address ──
    {
      id: 'street',
      label: 'Street / House No. / Building',
      type: 'text',
      required: true,
      placeholder: 'e.g., Unit 4B, 123 Rizal Street', maxLength: 60, autoUppercase: true,
      step: 2,
    },
    {
      id: 'barangay',
      label: 'Barangay',
      type: 'text',
      required: true,
      placeholder: 'e.g., Brgy. San Jose', maxLength: 60, autoUppercase: true,
      step: 2,
    },
    {
      id: 'city',
      label: 'City / Municipality',
      type: 'autocomplete',
      optionsSource: 'ph_cities',
      required: true,
      placeholder: 'e.g., Quezon City', maxLength: 60, autoUppercase: true,
      step: 2,
    },
    {
      id: 'province',
      label: 'Province',
      type: 'autocomplete',
      required: true,
      optionsSource: 'ph_provinces',
      step: 2,
    },
    {
      id: 'zip',
      label: 'ZIP Code',
      type: 'text',
      required: true,
      placeholder: '1100',
      inputMode: 'numeric',
      maxLength: 4,
      step: 2,
    },
    {
      id: 'cellphone',
      label: 'Cellphone Number',
      type: 'tel',
      required: true,
      placeholder: '09XX-XXX-XXXX',
      hint: 'Must be a valid PH mobile number',
      inputMode: 'tel', maxLength: 11,
      step: 2,
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: false,
      placeholder: 'your@email.com',
      hint: 'For Pag-IBIG confirmation notifications', maxLength: 80,
      step: 2,
    },
    {
      id: 'home_tel',
      label: 'Home Telephone No.',
      type: 'tel',
      required: false,
      placeholder: '(02) XXXX-XXXX', maxLength: 20,
      step: 2,
    },
    {
      id: 'biz_tel',
      label: 'Business Telephone No.',
      type: 'tel',
      required: false,
      placeholder: '(02) XXXX-XXXX', maxLength: 20,
      step: 2,
    },

    // ── Step 3: Bank Details (all optional) ──
    {
      id: 'bank_name',
      label: 'Bank Name',
      type: 'autocomplete',
      required: false,
      optional_note: 'Optional',
      optionsSource: 'ph_banks',
      step: 3,
    },
    {
      id: 'bank_account_no',
      label: 'Bank Account Number',
      type: 'text',
      required: false,
      optional_note: 'Optional',
      placeholder: 'Enter bank account number',
      hint: 'Must be in your name only',
      inputMode: 'numeric', maxLength: 24,
      step: 3,
    },
    {
      id: 'bank_branch',
      label: 'Bank Branch',
      type: 'text',
      required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., Quezon Ave. Branch', autoUppercase: true,
      step: 3,
    },
    {
      id: 'bank_address',
      label: 'Bank Address',
      type: 'textarea',
      required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., 123 Quezon Ave., Quezon City', maxLength: 150, autoUppercase: true,
      step: 3,
    },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
      required: false,
      hint: 'Auto-filled to today',
      step: 3,
    },
  ],
};

// ─── PhilHealth PMRF ─────────────────────────────────────────────────────────
const philhealthPmrf: FormSchema = {
  slug: 'philhealth-pmrf',
  code: 'PMRF-012020',
  version: 'UHC v.1 January 2020',
  name: 'PhilHealth Member Registration Form',
  agency: 'PhilHealth',
  category: 'Health Insurance',
  pdfPath: 'PhilHealth - pmrf_012020.pdf',
  description:
    'Register as a new PhilHealth member or update your existing member record.',
  steps: [
    {
      label: 'Personal Info',
      fieldIds: [
        'pin', 'purpose', 'konsulta_provider',
        'last_name', 'first_name', 'middle_name', 'name_ext',
        'dob', 'place_of_birth',
        'sex', 'civil_status', 'citizenship',
        'philsys_id', 'tin',
      ],
    },
    {
      label: 'Family Names',
      fieldIds: [
        'mother_last_name', 'mother_first_name', 'mother_middle_name',
        'spouse_last_name', 'spouse_first_name', 'spouse_middle_name',
      ],
    },
    {
      label: 'Address & Contact',
      fieldIds: [
        'perm_unit', 'perm_building', 'perm_lot', 'perm_street',
        'perm_subdivision', 'perm_barangay', 'perm_city', 'perm_province', 'perm_zip',
        'mail_same_as_above',
        'mail_unit', 'mail_building', 'mail_lot', 'mail_street',
        'mail_subdivision', 'mail_barangay', 'mail_city', 'mail_province', 'mail_zip',
        'mobile', 'home_phone', 'email',
      ],
    },
    {
      label: 'Dependents',
      fieldIds: [
        'dep1_last_name', 'dep1_first_name', 'dep1_name_ext', 'dep1_middle_name',
        'dep1_relationship', 'dep1_dob', 'dep1_citizenship',
        'dep1_no_middle_name', 'dep1_mononym', 'dep1_disability',
        'dep2_last_name', 'dep2_first_name', 'dep2_name_ext', 'dep2_middle_name',
        'dep2_relationship', 'dep2_dob', 'dep2_citizenship',
        'dep2_no_middle_name', 'dep2_mononym', 'dep2_disability',
        'dep3_last_name', 'dep3_first_name', 'dep3_name_ext', 'dep3_middle_name',
        'dep3_relationship', 'dep3_dob', 'dep3_citizenship',
        'dep3_no_middle_name', 'dep3_mononym', 'dep3_disability',
        'dep4_last_name', 'dep4_first_name', 'dep4_name_ext', 'dep4_middle_name',
        'dep4_relationship', 'dep4_dob', 'dep4_citizenship',
        'dep4_no_middle_name', 'dep4_mononym', 'dep4_disability',
      ],
    },
    {
      label: 'Member Type',
      fieldIds: ['member_type', 'indirect_contributor', 'profession', 'monthly_income', 'proof_of_income'],
    },
  ],
  fields: [
    // ── Step 1: Personal Info ──
    {
      id: 'pin',
      label: 'PhilHealth Identification Number (PIN)',
      type: 'text',
      required: true,
      placeholder: 'XX-XXXXXXXXX-X',
      mask: 'pin',
      hint: '12-digit PhilHealth PIN. Auto-formats as you type.',
      inputMode: 'numeric', maxLength: 14,
      step: 1,
    },
    {
      id: 'purpose',
      label: 'Purpose',
      type: 'dropdown',
      required: true,
      options: ['Registration', 'Updating/Amendment'],
      step: 1,
    },
    {
      id: 'konsulta_provider',
      label: 'Preferred KonSulTa Provider',
      type: 'autocomplete',
      optionsSource: 'philhealth_konsulta',
      required: false,
      optional_note: 'Optional',
      placeholder: 'Type city, facility, or PIN to search…',
      hint: 'Type-ahead from the accredited KonSulTa list, or enter any code manually.',
      step: 1,
    },
    {
      id: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., DELA CRUZ',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., JUAN ANDRES',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'middle_name',
      label: 'Middle Name',
      type: 'text',
      required: false,
      placeholder: 'e.g., SANTOS',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'name_ext',
      label: 'Name Extension',
      type: 'dropdown',
      required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'],
      step: 1,
    },
    {
      id: 'dob',
      label: 'Date of Birth',
      type: 'date',
      required: true,
      placeholder: 'mm / dd / yyyy',
      mask: 'date',
      step: 1,
    },
    {
      id: 'place_of_birth',
      label: 'Place of Birth',
      type: 'text',
      required: true,
      placeholder: 'e.g., Quezon City, Metro Manila',
      hint: 'City/Municipality/Province/Country', maxLength: 60, autoUppercase: true,
      step: 1,
    },
    {
      id: 'sex',
      label: 'Sex',
      type: 'dropdown',
      required: true,
      options: ['Male', 'Female'],
      step: 1,
    },
    {
      id: 'civil_status',
      label: 'Civil Status',
      type: 'dropdown',
      required: true,
      options: ['Single', 'Married', 'Widow/er', 'Annulled', 'Legally Separated'],
      optionHints: {
        'Married': 'Spouse fields in Step 2 are required and your spouse can be added as a dependent.',
        'Widow/er': 'Spouse name is optional but helpful for record matching.',
      },
      step: 1,
    },
    {
      id: 'citizenship',
      label: 'Citizenship',
      type: 'dropdown',
      required: true,
      options: ['Filipino', 'Dual Citizen', 'Foreign National'],
      optionHints: {
        'Filipino': 'Use this PMRF-012020.',
        'Dual Citizen': 'Use this PMRF-012020. Bring proof of dual citizenship at submission.',
        'Foreign National': '⚠ Switch to PMRF-FN — separate form for foreign nationals.',
      },
      step: 1,
    },
    {
      id: 'philsys_id',
      label: 'PhilSys PCN (Card Number)',
      type: 'text',
      required: false,
      optional_note: 'Optional',
      placeholder: 'XXXX-XXXX-XXXX',
      mask: 'psn',
      hint: '12-digit PhilSys Card Number — auto-formats to XXXX-XXXX-XXXX.',
      inputMode: 'numeric', maxLength: 14,
      step: 1,
    },
    {
      id: 'tin',
      label: 'Tax Payer Identification Number (TIN)',
      type: 'text',
      required: false,
      optional_note: 'Optional',
      placeholder: 'XXX-XXX-XXX-XXX',
      mask: 'tin',
      hint: '9 (legacy) or 12 digits — auto-formats with hyphens.',
      inputMode: 'numeric', maxLength: 15,
      step: 1,
    },

    // ── Step 2: Family Names ──
    {
      id: 'mother_last_name',
      label: "Mother's Maiden Last Name",
      type: 'text',
      required: true,
      placeholder: 'e.g., REYES',
      autoUppercase: true,
      hint: 'As it appears on your birth certificate', maxLength: 80,
      step: 2,
    },
    {
      id: 'mother_first_name',
      label: "Mother's First Name",
      type: 'text',
      required: true,
      placeholder: 'e.g., MARIA',
      autoUppercase: true, maxLength: 80,
      step: 2,
    },
    {
      id: 'mother_middle_name',
      label: "Mother's Middle Name",
      type: 'text',
      required: false,
      placeholder: 'e.g., GARCIA',
      autoUppercase: true, maxLength: 80, inputMode: 'numeric',
      step: 2,
    },
    {
      id: 'spouse_last_name',
      label: "Spouse's Last Name",
      type: 'text',
      required: false,
      optional_note: 'If married',
      placeholder: 'e.g., SANTOS',
      autoUppercase: true, maxLength: 80,
      step: 2,
    },
    {
      id: 'spouse_first_name',
      label: "Spouse's First Name",
      type: 'text',
      required: false,
      optional_note: 'If married',
      placeholder: 'e.g., ANA',
      autoUppercase: true, maxLength: 80,
      step: 2,
    },
    {
      id: 'spouse_middle_name',
      label: "Spouse's Middle Name",
      type: 'text',
      required: false,
      optional_note: 'If married',
      placeholder: 'e.g., LIRA',
      autoUppercase: true, maxLength: 80, inputMode: 'numeric',
      step: 2,
    },

    // ── Step 3: Address & Contact ──
    {
      id: 'perm_unit',
      label: 'Unit/Room No./Floor',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Unit 4B', maxLength: 50,
      step: 3,
    },
    {
      id: 'perm_building',
      label: 'Building Name',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Sunrise Tower', maxLength: 50, autoUppercase: true,
      step: 3,
    },
    {
      id: 'perm_lot',
      label: 'Lot/Block/Phase/House Number',
      type: 'text',
      required: false,
      placeholder: 'e.g., Lot 12 Block 5', maxLength: 50, autoUppercase: true,
      step: 3,
    },
    {
      id: 'perm_street',
      label: 'Street Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Rizal Street', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'perm_subdivision',
      label: 'Subdivision',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Loyola Grand Villas', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'perm_barangay',
      label: 'Barangay',
      type: 'text',
      required: true,
      placeholder: 'e.g., Brgy. San Jose', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'perm_city',
      label: 'Municipality/City',
      type: 'autocomplete', optionsSource: 'ph_cities',
      required: true,
      placeholder: 'e.g., Quezon City', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'perm_province',
      label: 'Province/State/Country',
      type: 'autocomplete',
      required: true,
      optionsSource: 'ph_provinces',
      step: 3,
    },
    {
      id: 'perm_zip',
      label: 'ZIP Code',
      type: 'text',
      required: true,
      placeholder: '1100',
      mask: 'zip',
      inputMode: 'numeric',
      maxLength: 4,
      step: 3,
    },
    {
      id: 'mobile',
      label: 'Mobile Number',
      type: 'tel',
      required: true,
      placeholder: '09XX XXX XXXX',
      mask: 'mobile',
      hint: '11-digit PH mobile number — auto-formats as you type.',
      inputMode: 'tel', maxLength: 13,
      step: 3,
    },
    {
      id: 'home_phone',
      label: 'Home Phone Number',
      type: 'tel',
      required: false,
      optional_note: 'Optional',
      placeholder: '(02) XXXX-XXXX', maxLength: 20,
      step: 3,
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: false,
      optional_note: 'Required for OFW',
      placeholder: 'your@email.com',
      hint: 'Required for OFW (Land-based) members. Recommended for everyone for KonSulTa notifications.',
      maxLength: 80,
      step: 3,
    },
    {
      id: 'mail_same_as_above',
      label: 'Mailing Address same as Permanent Address',
      type: 'checkbox',
      required: false,
      hint: 'Check if your mailing address is the same as your permanent address above',
      step: 3,
    },
    {
      id: 'mail_unit',
      label: 'Mailing — Unit/Room No./Floor',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Unit 4B', maxLength: 50,
      step: 3,
    },
    {
      id: 'mail_building',
      label: 'Mailing — Building Name',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Sunrise Tower', maxLength: 50, autoUppercase: true,
      step: 3,
    },
    {
      id: 'mail_lot',
      label: 'Mailing — Lot/Block/Phase/House Number',
      type: 'text',
      required: false,
      placeholder: 'e.g., Lot 12 Block 5', maxLength: 50, autoUppercase: true,
      step: 3,
    },
    {
      id: 'mail_street',
      label: 'Mailing — Street Name',
      type: 'text',
      required: false,
      placeholder: 'e.g., Rizal Street', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'mail_subdivision',
      label: 'Mailing — Subdivision',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Loyola Grand Villas', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'mail_barangay',
      label: 'Mailing — Barangay',
      type: 'text',
      required: false,
      placeholder: 'e.g., Brgy. San Jose', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'mail_city',
      label: 'Mailing — Municipality/City',
      type: 'autocomplete',
      optionsSource: 'ph_cities',
      required: false,
      placeholder: 'e.g., Quezon City', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'mail_province',
      label: 'Mailing — Province/State/Country',
      type: 'autocomplete',
      optionsSource: 'ph_provinces',
      required: false,
      placeholder: 'e.g., Metro Manila or Abroad', maxLength: 60, autoUppercase: true,
      step: 3,
    },
    {
      id: 'mail_zip',
      label: 'Mailing — ZIP Code',
      type: 'text',
      required: false,
      placeholder: '1100',
      mask: 'zip',
      inputMode: 'numeric',
      maxLength: 4,
      step: 3,
    },

    // ── Step 4: Declaration of Dependents ──
    // Dependent 1
    { id: 'dep1_last_name',    label: 'Dependent 1 — Last Name',        type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'Last name' },
    { id: 'dep1_first_name',   label: 'Dependent 1 — First Name',       type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'First name' },
    { id: 'dep1_name_ext',     label: 'Dependent 1 — Name Extension',   type: 'text',     required: false, maxLength: 6, step: 4, placeholder: 'Jr./Sr./II' },
    { id: 'dep1_middle_name',  label: 'Dependent 1 — Middle Name',      type: 'text',     required: false, maxLength: 80, inputMode: 'numeric', step: 4, placeholder: 'Middle name' },
    { id: 'dep1_relationship', label: 'Dependent 1 — Relationship',     type: 'text',     required: false, maxLength: 60, step: 4, placeholder: 'e.g., Spouse, Child' },
    { id: 'dep1_dob',          label: 'Dependent 1 — Date of Birth',    type: 'text',     required: false, step: 4, placeholder: 'mm / dd / yyyy' },
    { id: 'dep1_citizenship',  label: 'Dependent 1 — Citizenship',      type: 'text',     required: false, step: 4, placeholder: 'e.g., Filipino' },
    { id: 'dep1_no_middle_name', label: 'Dependent 1 — No Middle Name', type: 'checkbox', required: false, step: 4 },
    { id: 'dep1_mononym',      label: 'Dependent 1 — Mononym',          type: 'checkbox', required: false, step: 4 },
    { id: 'dep1_disability',   label: 'Dependent 1 — Permanent Disability', type: 'checkbox', required: false, step: 4 },
    // Dependent 2
    { id: 'dep2_last_name',    label: 'Dependent 2 — Last Name',        type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'Last name' },
    { id: 'dep2_first_name',   label: 'Dependent 2 — First Name',       type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'First name' },
    { id: 'dep2_name_ext',     label: 'Dependent 2 — Name Extension',   type: 'text',     required: false, maxLength: 6, step: 4, placeholder: 'Jr./Sr./II' },
    { id: 'dep2_middle_name',  label: 'Dependent 2 — Middle Name',      type: 'text',     required: false, maxLength: 80, inputMode: 'numeric', step: 4, placeholder: 'Middle name' },
    { id: 'dep2_relationship', label: 'Dependent 2 — Relationship',     type: 'text',     required: false, maxLength: 60, step: 4, placeholder: 'e.g., Spouse, Child' },
    { id: 'dep2_dob',          label: 'Dependent 2 — Date of Birth',    type: 'text',     required: false, step: 4, placeholder: 'mm / dd / yyyy' },
    { id: 'dep2_citizenship',  label: 'Dependent 2 — Citizenship',      type: 'text',     required: false, step: 4, placeholder: 'e.g., Filipino' },
    { id: 'dep2_no_middle_name', label: 'Dependent 2 — No Middle Name', type: 'checkbox', required: false, step: 4 },
    { id: 'dep2_mononym',      label: 'Dependent 2 — Mononym',          type: 'checkbox', required: false, step: 4 },
    { id: 'dep2_disability',   label: 'Dependent 2 — Permanent Disability', type: 'checkbox', required: false, step: 4 },
    // Dependent 3
    { id: 'dep3_last_name',    label: 'Dependent 3 — Last Name',        type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'Last name' },
    { id: 'dep3_first_name',   label: 'Dependent 3 — First Name',       type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'First name' },
    { id: 'dep3_name_ext',     label: 'Dependent 3 — Name Extension',   type: 'text',     required: false, maxLength: 6, step: 4, placeholder: 'Jr./Sr./II' },
    { id: 'dep3_middle_name',  label: 'Dependent 3 — Middle Name',      type: 'text',     required: false, maxLength: 80, inputMode: 'numeric', step: 4, placeholder: 'Middle name' },
    { id: 'dep3_relationship', label: 'Dependent 3 — Relationship',     type: 'text',     required: false, maxLength: 60, step: 4, placeholder: 'e.g., Spouse, Child' },
    { id: 'dep3_dob',          label: 'Dependent 3 — Date of Birth',    type: 'text',     required: false, step: 4, placeholder: 'mm / dd / yyyy' },
    { id: 'dep3_citizenship',  label: 'Dependent 3 — Citizenship',      type: 'text',     required: false, step: 4, placeholder: 'e.g., Filipino' },
    { id: 'dep3_no_middle_name', label: 'Dependent 3 — No Middle Name', type: 'checkbox', required: false, step: 4 },
    { id: 'dep3_mononym',      label: 'Dependent 3 — Mononym',          type: 'checkbox', required: false, step: 4 },
    { id: 'dep3_disability',   label: 'Dependent 3 — Permanent Disability', type: 'checkbox', required: false, step: 4 },
    // Dependent 4
    { id: 'dep4_last_name',    label: 'Dependent 4 — Last Name',        type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'Last name' },
    { id: 'dep4_first_name',   label: 'Dependent 4 — First Name',       type: 'text',     required: false, maxLength: 80, step: 4, placeholder: 'First name' },
    { id: 'dep4_name_ext',     label: 'Dependent 4 — Name Extension',   type: 'text',     required: false, maxLength: 6, step: 4, placeholder: 'Jr./Sr./II' },
    { id: 'dep4_middle_name',  label: 'Dependent 4 — Middle Name',      type: 'text',     required: false, maxLength: 80, inputMode: 'numeric', step: 4, placeholder: 'Middle name' },
    { id: 'dep4_relationship', label: 'Dependent 4 — Relationship',     type: 'text',     required: false, maxLength: 60, step: 4, placeholder: 'e.g., Spouse, Child' },
    { id: 'dep4_dob',          label: 'Dependent 4 — Date of Birth',    type: 'text',     required: false, step: 4, placeholder: 'mm / dd / yyyy' },
    { id: 'dep4_citizenship',  label: 'Dependent 4 — Citizenship',      type: 'text',     required: false, step: 4, placeholder: 'e.g., Filipino' },
    { id: 'dep4_no_middle_name', label: 'Dependent 4 — No Middle Name', type: 'checkbox', required: false, step: 4 },
    { id: 'dep4_mononym',      label: 'Dependent 4 — Mononym',          type: 'checkbox', required: false, step: 4 },
    { id: 'dep4_disability',   label: 'Dependent 4 — Permanent Disability', type: 'checkbox', required: false, step: 4 },

    // ── Step 5: Member Type ──
    {
      id: 'member_type',
      label: 'Direct Contributor',
      type: 'dropdown',
      required: false,
      options: [
        '',
        'Employed Private',
        'Employed Government',
        'Professional Practitioner',
        'Self-Earning Individual',
        'Kasambahay',
        'Family Driver',
        'Migrant Worker (Land-Based)',
        'Migrant Worker (Sea-Based)',
        'Lifetime Member',
        'Filipinos with Dual Citizenship / Living Abroad',
        'Foreign National',
      ],
      optionHints: {
        'Employed Private':              'Premium 5% — employer pays 50%. Profession/Income optional.',
        'Employed Government':           'Premium 5% — employer pays 50%. Profession/Income optional.',
        'Self-Earning Individual':       'Profession + Monthly Income + Proof of Income are required.',
        'Professional Practitioner':     'Profession (license) + Income + Proof of Income are required.',
        'Kasambahay':                    'Earning ≤ ₱5,000/mo: employer pays full premium per Kasambahay Law.',
        'Family Driver':                 'Profession + Income + Proof are required.',
        'Migrant Worker (Land-Based)':   'OFW — email is effectively required.',
        'Migrant Worker (Sea-Based)':    'Premium typically deducted from manning agency.',
        'Lifetime Member':               '60+ retired with 120+ contributions. No further premiums.',
        'Filipinos with Dual Citizenship / Living Abroad': 'Voluntary — Income + Proof recommended.',
        'Foreign National':              '⚠ Use PMRF-FN form instead.',
      },
      step: 5,
    },
    {
      id: 'indirect_contributor',
      label: 'Indirect Contributor',
      type: 'dropdown',
      required: false,
      options: [
        '',
        'Listahanan',
        '4Ps/MCCT',
        'Senior Citizen',
        'PAMANA',
        'KIA/KIPO',
        'Bangsamoro/Normalization',
        'LGU-sponsored',
        'NGA-sponsored',
        'Private-sponsored',
        'Person with Disability',
        'Solo Parent',
      ],
      hint: 'Mutually exclusive with Direct Contributor — pick only one of the two.',
      optionHints: {
        'Senior Citizen':           'Auto-qualifies at age 60+ — bring OSCA ID. Premium subsidized.',
        'Person with Disability':   'Bring PWD ID. Premium subsidized.',
        'Solo Parent':              'RA 11861 — full premium subsidy. Bring Solo Parent ID.',
        '4Ps/MCCT':                 'Premium fully subsidized through DSWD.',
      },
      step: 5,
    },
    {
      id: 'profession',
      label: 'Profession',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Nurse, Engineer',
      hint: 'Required if not Employed, Lifetime Member, or Sea-based Migrant Worker', maxLength: 60,
      step: 5,
    },
    {
      id: 'monthly_income',
      label: 'Monthly Income (PHP)',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: '15,000',
      mask: 'currency',
      hint: 'Required for Self-Earning, Kasambahay, Family Driver. Smart Assist computes your premium at 5%.',
      inputMode: 'numeric',
      step: 5,
    },
    {
      id: 'proof_of_income',
      label: 'Proof of Income',
      type: 'dropdown',
      required: false,
      optional_note: 'If applicable',
      options: [
        '',
        'Certificate of Employment (COE)',
        'Latest Payslip',
        'Income Tax Return (ITR)',
        'BIR Form 2316',
        'DTI / SEC Registration',
        'PTR / Professional License',
        'Notarized Affidavit of Income',
        'Bank Statement (3 months)',
      ],
      hint: 'Document proving your monthly income.',
      step: 5,
    },
  ],
  smartAssistance: {
    eligibility: [
      { id: 'age',     label: 'Member is at least 18',          rule: 'age-min',    fieldId: 'dob',         min: 18 },
      { id: 'pin',     label: 'PhilHealth PIN is 12 digits',    rule: 'digits-eq',  fieldId: 'pin',         count: 12 },
      { id: 'mobile',  label: 'Mobile number is 11 digits',     rule: 'digits-eq',  fieldId: 'mobile',      count: 11 },
      { id: 'tin',     label: 'TIN is 12 digits (when given)',  rule: 'digits-eq',  fieldId: 'tin',         count: 12 },
      { id: 'psn',     label: 'PhilSys PCN is 12 digits',       rule: 'digits-eq',  fieldId: 'philsys_id',  count: 12 },
      { id: 'email',   label: 'Email address is well-formed',   rule: 'email',      fieldId: 'email' },
    ],
  },
};

// ─── PhilHealth Claim Form 1 ─────────────────────────────────────────────────
const philhealthClaimForm1: FormSchema = {
  slug: 'philhealth-claim-form-1',
  code: 'CF-1',
  version: 'Revised September 2018',
  name: 'PhilHealth Claim Form 1',
  agency: 'PhilHealth',
  category: 'Health Insurance',
  pdfPath: 'PhilHealth - ClaimForm1_092018.pdf',
  description:
    'Required PhilHealth claim form for inpatient/hospital availment. Submit to the hospital billing section together with other supporting documents.',
  steps: [
    {
      label: 'Member Info',
      fieldIds: [
        'member_pin',
        'member_last_name', 'member_first_name', 'member_name_ext', 'member_middle_name',
        'member_dob',
        'member_sex',
      ],
    },
    {
      label: 'Mailing Address',
      fieldIds: [
        'addr_unit', 'addr_building', 'addr_lot', 'addr_street', 'addr_subdivision',
        'addr_barangay', 'addr_city', 'addr_province', 'addr_country', 'addr_zip',
      ],
    },
    {
      label: 'Contact & Patient',
      fieldIds: ['contact_landline', 'contact_mobile', 'contact_email', 'patient_is_member'],
    },
    {
      label: 'Dependent Info',
      fieldIds: [
        'patient_pin',
        'patient_last_name', 'patient_first_name', 'patient_name_ext', 'patient_middle_name',
        'patient_dob',
        'patient_relationship', 'patient_sex',
      ],
    },
    {
      label: 'Employer Cert',
      fieldIds: ['has_employer', 'employer_pen', 'employer_contact', 'employer_business_name'],
    },
  ],
  fields: [
    // ── Step 1: Member Information ──
    {
      id: 'member_pin',
      label: 'PhilHealth Identification Number (PIN) of Member',
      type: 'text',
      required: true,
      placeholder: '12-345678901-2',
      hint: '12 digits — auto-formatted as you type.',
      mask: 'pin',
      inputMode: 'numeric', maxLength: 14,
      step: 1,
    },
    {
      id: 'member_last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., DELA CRUZ',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'member_first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., JUAN ANDRES',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'member_name_ext',
      label: 'Name Extension',
      type: 'dropdown',
      required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'],
      step: 1,
    },
    {
      id: 'member_middle_name',
      label: 'Middle Name',
      type: 'text',
      required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., SANTOS',
      autoUppercase: true, maxLength: 80,
      step: 1,
    },
    {
      id: 'member_dob',
      label: 'Date of Birth',
      type: 'date',
      required: true,
      hint: 'Format: mm / dd / yyyy',
      step: 1,
    },
    {
      id: 'member_sex',
      label: 'Sex',
      type: 'dropdown',
      required: true,
      options: ['Male', 'Female'],
      step: 1,
    },

    // ── Step 2: Mailing Address ──
    {
      id: 'addr_unit',
      label: 'Unit/Room No./Floor',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Unit 4B', maxLength: 50,
      step: 2,
    },
    {
      id: 'addr_building',
      label: 'Building Name',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Sunrise Tower', maxLength: 50, autoUppercase: true,
      step: 2,
    },
    {
      id: 'addr_lot',
      label: 'Lot/Block/House/Building No.',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Lot 12 Block 5', maxLength: 50, autoUppercase: true,
      step: 2,
    },
    {
      id: 'addr_street',
      label: 'Street',
      type: 'text',
      required: true,
      placeholder: 'e.g., Rizal Street', maxLength: 60, autoUppercase: true,
      step: 2,
    },
    {
      id: 'addr_subdivision',
      label: 'Subdivision/Village',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Loyola Grand Villas', maxLength: 60, autoUppercase: true,
      step: 2,
    },
    {
      id: 'addr_barangay',
      label: 'Barangay',
      type: 'text',
      required: true,
      placeholder: 'e.g., Brgy. San Jose', maxLength: 60, autoUppercase: true,
      step: 2,
    },
    {
      id: 'addr_city',
      label: 'City/Municipality',
      type: 'autocomplete',
      optionsSource: 'ph_cities',
      required: true,
      placeholder: 'e.g., Quezon City', maxLength: 60, autoUppercase: true,
      step: 2,
    },
    {
      id: 'addr_province',
      label: 'Province',
      type: 'autocomplete',
      required: true,
      optionsSource: 'ph_provinces',
      step: 2,
    },
    {
      id: 'addr_country',
      label: 'Country',
      type: 'autocomplete',
      required: true,
      optionsSource: 'countries',
      hint: 'Local availment: 60-day filing window. Abroad / OFW: 180 days.',
      step: 2,
    },
    {
      id: 'addr_zip',
      label: 'ZIP Code',
      type: 'text',
      required: true,
      placeholder: '1100',
      mask: 'zip',
      inputMode: 'numeric',
      maxLength: 4,
      step: 2,
    },

    // ── Step 3: Contact Information & Patient Type ──
    {
      id: 'contact_landline',
      label: 'Landline No. (Area Code + Tel. No.)',
      type: 'tel',
      required: false,
      optional_note: 'Optional',
      placeholder: '(02) 1234-5678',
      mask: 'landline',
      maxLength: 20,
      step: 3,
    },
    {
      id: 'contact_mobile',
      label: 'Mobile No.',
      type: 'tel',
      required: true,
      placeholder: '0917 123 4567',
      hint: '11 digits — PH mobile, auto-formatted.',
      mask: 'mobile',
      inputMode: 'tel', maxLength: 13,
      step: 3,
    },
    {
      id: 'contact_email',
      label: 'Email Address',
      type: 'email',
      required: false,
      optional_note: 'Optional',
      placeholder: 'your@email.com', maxLength: 80,
      step: 3,
    },
    {
      id: 'patient_is_member',
      label: 'Patient is the same as the PhilHealth Member',
      type: 'checkbox',
      required: false,
      hint: 'Tick to copy member name + DOB to the patient block (and skip the Dependent Info step entirely).',
      step: 3,
    },

    // ── Step 4: Dependent / Patient Information (hidden when patient = member) ──
    {
      id: 'patient_pin',
      label: "Dependent's PhilHealth PIN",
      type: 'text',
      required: false,
      optional_note: 'Only if patient is a dependent',
      placeholder: '12-345678901-2',
      mask: 'pin',
      inputMode: 'numeric', maxLength: 14,
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },
    {
      id: 'patient_last_name',
      label: "Patient's Last Name",
      type: 'text',
      required: false,
      placeholder: 'e.g., DELA CRUZ',
      autoUppercase: true, maxLength: 80,
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },
    {
      id: 'patient_first_name',
      label: "Patient's First Name",
      type: 'text',
      required: false,
      placeholder: 'e.g., MARIA',
      autoUppercase: true, maxLength: 80,
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },
    {
      id: 'patient_name_ext',
      label: "Patient's Name Extension",
      type: 'dropdown',
      required: false,
      optional_note: 'If applicable',
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'],
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },
    {
      id: 'patient_middle_name',
      label: "Patient's Middle Name",
      type: 'text',
      required: false,
      placeholder: 'e.g., SANTOS',
      autoUppercase: true, maxLength: 80,
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },
    {
      id: 'patient_dob',
      label: "Patient's Date of Birth",
      type: 'date',
      required: false,
      hint: 'Format: mm / dd / yyyy',
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },
    {
      id: 'patient_relationship',
      label: 'Relationship to Member',
      type: 'dropdown',
      required: false,
      options: ['Child', 'Spouse', 'Parent'],
      optionHints: {
        'Child':  'Legitimate / illegitimate / adopted child below 21 (or PWD of any age).',
        'Spouse': 'Legal spouse — not separately covered as a member.',
        'Parent': 'Parent aged ≥ 60 and not a member-dependent of someone else.',
      },
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },
    {
      id: 'patient_sex',
      label: "Patient's Sex",
      type: 'dropdown',
      required: false,
      options: ['Male', 'Female'],
      step: 4,
      visibleWhen: { field: 'patient_is_member', equals: '' },
    },

    // ── Step 5: Employer Certification (employed members only) ──
    {
      id: 'has_employer',
      label: 'Member is currently employed',
      type: 'checkbox',
      required: false,
      hint: 'Untick if self-employed / OFW / unemployed — the entire Employer block will be hidden and skipped.',
      step: 5,
    },
    {
      id: 'employer_pen',
      label: 'PhilHealth Employer Number (PEN)',
      type: 'text',
      required: false,
      optional_note: 'Employed members only',
      placeholder: '17-123456789-0',
      hint: '12 digits — auto-formatted.',
      mask: 'pen',
      inputMode: 'numeric',
      maxLength: 14,
      step: 5,
      visibleWhen: { field: 'has_employer', equals: 'true' },
    },
    {
      id: 'employer_contact',
      label: 'Employer Contact No.',
      type: 'tel',
      required: false,
      optional_note: 'Employed members only',
      placeholder: '(02) 1234-5678',
      mask: 'landline',
      maxLength: 20,
      step: 5,
      visibleWhen: { field: 'has_employer', equals: 'true' },
    },
    {
      id: 'employer_business_name',
      label: 'Business Name of Employer',
      type: 'text',
      required: false,
      optional_note: 'Employed members only',
      placeholder: 'e.g., ABC Company, Inc.',
      autoUppercase: true, maxLength: 80,
      step: 5,
      visibleWhen: { field: 'has_employer', equals: 'true' },
    },
  ],
  smartAssistance: {
    eligibility: [
      { id: 'mpin',   label: 'Member PIN is 12 digits', rule: 'digits-eq', fieldId: 'member_pin', count: 12 },
      { id: 'dpin',   label: 'Dependent PIN is 12 digits (when given)', rule: 'digits-eq', fieldId: 'patient_pin', count: 12 },
      { id: 'pen',    label: 'Employer PEN is 12 digits (when given)', rule: 'digits-eq', fieldId: 'employer_pen', count: 12 },
      { id: 'mobile', label: 'Mobile is 11 digits', rule: 'digits-eq', fieldId: 'contact_mobile', count: 11 },
      { id: 'email',  label: 'Email format is valid (when given)', rule: 'email', fieldId: 'contact_email' },
      { id: 'age',    label: 'Member age is sane (≥ 0)', rule: 'age-min', fieldId: 'member_dob', min: 0 },
    ],
  },
};

// ─── PhilHealth Claim Form 2 (CF-2) ──────────────────────────────────────────
// L-SMART-CF2-01 — Smart Assistance pass:
//   • Combined dates  (date_admitted / date_discharged / expired_date /
//                      hcp{1,2,3}_date_signed) — auto-split by
//                      expandCombinedDates() at PDF write-time.
//   • Combined times  (time_admitted / time_discharged / expired_time) —
//                      new pattern, auto-split by expandCombinedTimes().
//   • Boolean toggle  for `referred_by_hci` (was 'NO'/'YES' dropdown).
//   • visibleWhen     gates referring-HCI / Expired / Transferred sub-blocks.
//   • Currency masks  on all peso amounts in Steps 7 & 8.
//   • optionHints     on patient_disposition + ICD/RVS/Z-benefit fields.
//   • smartAssistance.eligibility[]  for HCI PAN + HCP PAN + filing window.
const philhealthClaimForm2: FormSchema = {
  slug: 'philhealth-claim-form-2',
  code: 'CF-2',
  version: 'Revised September 2018',
  name: 'PhilHealth Claim Form 2',
  agency: 'PhilHealth',
  category: 'Health Insurance',
  pdfPath: 'PhilHealth - ClaimForm2_092018.pdf',
  description:
    'PhilHealth Claim Form 2 — submitted by the Health Care Institution (HCI). Contains HCI info, patient confinement details, diagnoses, procedures, special considerations, HCP fees, and certification of benefits consumption.',
  steps: [
    {
      label: 'HCI Information',
      fieldIds: ['hci_pan', 'hci_name', 'hci_bldg_street', 'hci_city', 'hci_province'],
    },
    {
      label: 'Patient Information',
      fieldIds: ['patient_last_name', 'patient_first_name', 'patient_name_ext', 'patient_middle_name'],
    },
    {
      label: 'Referral & Confinement',
      fieldIds: [
        'referred_by_hci',
        'referring_hci_name', 'referring_hci_bldg_street',
        'referring_hci_city', 'referring_hci_province', 'referring_hci_zip',
        'date_admitted', 'time_admitted',
        'date_discharged', 'time_discharged',
      ],
    },
    {
      label: 'Disposition & Accommodation',
      fieldIds: [
        'patient_disposition',
        'expired_date', 'expired_time',
        'transferred_hci_name', 'transferred_hci_bldg_street',
        'transferred_hci_city', 'transferred_hci_province', 'transferred_hci_zip',
        'reason_for_referral',
        'accommodation_type',
      ],
    },
    {
      label: 'Diagnoses & Procedures',
      fieldIds: [
        'admission_diagnosis_1', 'admission_diagnosis_2',
        'discharge_diagnosis_1', 'discharge_icd10_1', 'discharge_procedure_1', 'discharge_rvs_1', 'discharge_procedure_date_1', 'discharge_laterality_1',
        'discharge_diagnosis_2', 'discharge_icd10_2', 'discharge_procedure_2', 'discharge_rvs_2', 'discharge_procedure_date_2', 'discharge_laterality_2',
        'discharge_diagnosis_3', 'discharge_icd10_3', 'discharge_procedure_3', 'discharge_rvs_3', 'discharge_procedure_date_3', 'discharge_laterality_3',
        'discharge_diagnosis_4', 'discharge_icd10_4', 'discharge_procedure_4', 'discharge_rvs_4', 'discharge_procedure_date_4', 'discharge_laterality_4',
        'discharge_diagnosis_5', 'discharge_icd10_5', 'discharge_procedure_5', 'discharge_rvs_5', 'discharge_procedure_date_5', 'discharge_laterality_5',
        'discharge_diagnosis_6', 'discharge_icd10_6', 'discharge_procedure_6', 'discharge_rvs_6', 'discharge_procedure_date_6', 'discharge_laterality_6',
      ],
    },
    {
      label: 'Special Considerations',
      fieldIds: [
        'special_hemodialysis', 'special_peritoneal_dialysis',
        'special_radiotherapy_linac', 'special_radiotherapy_cobalt',
        'special_blood_transfusion', 'special_brachytherapy',
        'special_chemotherapy', 'special_simple_debridement',
        'zbenefit_package_code', 'mcp_dates',
        'tbdots_intensive_phase', 'tbdots_maintenance_phase',
        'animal_bite_arv_day1', 'animal_bite_arv_day2', 'animal_bite_arv_day3',
        'animal_bite_rig', 'animal_bite_others',
        'newborn_essential_care', 'newborn_hearing_screening', 'newborn_screening_test',
        'hiv_lab_number',
        'philhealth_benefit_first_case_rate', 'philhealth_benefit_second_case_rate', 'philhealth_benefit_icd_rvs_code',
      ],
    },
    {
      label: 'HCP Accreditation & Fees',
      fieldIds: [
        'hcp1_accreditation_no', 'hcp1_date_signed', 'hcp1_copay',
        'hcp2_accreditation_no', 'hcp2_date_signed', 'hcp2_copay',
        'hcp3_accreditation_no', 'hcp3_date_signed', 'hcp3_copay',
      ],
    },
    {
      label: 'Certification of Benefits',
      fieldIds: [
        'total_hci_fees', 'total_professional_fees', 'grand_total',
        'total_actual_charges', 'discount_amount',
        'philhealth_benefit_amount', 'amount_after_philhealth',
        'hci_amount_paid_by',
        'hci_paid_member_patient', 'hci_paid_hmo', 'hci_paid_others',
        'pf_amount_paid_by',
        'pf_paid_member_patient', 'pf_paid_hmo', 'pf_paid_others',
        'drug_purchase_none', 'drug_purchase_total_amount',
        'diagnostic_purchase_none', 'diagnostic_purchase_total_amount',
      ],
    },
  ],
  fields: [
    // ── Step 1: HCI Information ──
    {
      id: 'hci_pan',
      label: 'PhilHealth Accreditation Number (PAN) of Health Care Institution',
      type: 'text', required: true,
      placeholder: 'HCI-12-345678',
      hint: '8-digit PAN issued by PhilHealth — auto-formatted.',
      mask: 'hciPan', inputMode: 'numeric', maxLength: 14,
      step: 1,
    },
    { id: 'hci_name', label: 'Name of Health Care Institution', type: 'text', required: true,
      placeholder: "e.g., ST. LUKE'S MEDICAL CENTER", autoUppercase: true, step: 1 },
    { id: 'hci_bldg_street', label: 'Building Number and Street Name', type: 'text', required: true,
      placeholder: 'e.g., 279 E. Rodriguez Sr. Blvd.', maxLength: 60, autoUppercase: true, step: 1 },
    { id: 'hci_city', label: 'City/Municipality', type: 'autocomplete', optionsSource: 'ph_cities',
      required: true, placeholder: 'e.g., Quezon City', maxLength: 60, autoUppercase: true, step: 1 },
    { id: 'hci_province', label: 'Province', type: 'autocomplete', optionsSource: 'ph_provinces',
      required: true, step: 1 },

    // ── Step 2: Patient Information ──
    { id: 'patient_last_name', label: 'Last Name', type: 'text', required: true,
      placeholder: 'e.g., DELA CRUZ', autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'patient_first_name', label: 'First Name', type: 'text', required: true,
      placeholder: 'e.g., JUAN ANDRES', autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'patient_name_ext', label: 'Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 2 },
    { id: 'patient_middle_name', label: 'Middle Name', type: 'text', required: false,
      optional_note: 'Optional', placeholder: 'e.g., SANTOS',
      autoUppercase: true, maxLength: 80, step: 2 },

    // ── Step 3: Referral & Confinement ──
    {
      id: 'referred_by_hci',
      label: 'Patient was referred by another Health Care Institution',
      type: 'checkbox', required: false,
      hint: 'Tick to reveal the referring-HCI block (5 fields). Leave unticked when the patient was a direct admission — the printed form\'s NO box will be ticked automatically.',
      step: 3,
    },
    { id: 'referring_hci_name', label: 'Name of Referring Health Care Institution', type: 'text',
      required: false, placeholder: 'e.g., HEALTH CENTER MANILA', autoUppercase: true,
      step: 3, visibleWhen: { field: 'referred_by_hci', equals: 'true' } },
    { id: 'referring_hci_bldg_street', label: 'Building Number and Street Name (Referring HCI)',
      type: 'text', required: false, placeholder: 'e.g., 123 Rizal Ave.',
      maxLength: 60, autoUppercase: true,
      step: 3, visibleWhen: { field: 'referred_by_hci', equals: 'true' } },
    { id: 'referring_hci_city', label: 'City/Municipality (Referring HCI)', type: 'autocomplete',
      optionsSource: 'ph_cities', required: false, placeholder: 'e.g., Manila',
      maxLength: 60, autoUppercase: true,
      step: 3, visibleWhen: { field: 'referred_by_hci', equals: 'true' } },
    { id: 'referring_hci_province', label: 'Province (Referring HCI)', type: 'autocomplete',
      optionsSource: 'ph_provinces', required: false, autoUppercase: true,
      step: 3, visibleWhen: { field: 'referred_by_hci', equals: 'true' } },
    { id: 'referring_hci_zip', label: 'ZIP Code (Referring HCI)', type: 'text', required: false,
      placeholder: '1000', mask: 'zip', inputMode: 'numeric', maxLength: 4,
      step: 3, visibleWhen: { field: 'referred_by_hci', equals: 'true' } },
    {
      id: 'date_admitted',
      label: 'Date Admitted',
      type: 'date', required: true,
      hint: 'Format: mm / dd / yyyy — auto-split into the per-digit boxes on the form.',
      step: 3,
    },
    {
      id: 'time_admitted',
      label: 'Time Admitted',
      type: 'text', required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., 08 : 30 AM',
      hint: '12-hour clock. Type 4 digits + a/p.',
      mask: 'time', maxLength: 13,
      step: 3,
    },
    {
      id: 'date_discharged',
      label: 'Date Discharged',
      type: 'date', required: true,
      hint: 'Filing window: 60 days from this date.',
      step: 3,
    },
    {
      id: 'time_discharged',
      label: 'Time Discharged',
      type: 'text', required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., 02 : 00 PM',
      mask: 'time', maxLength: 13,
      step: 3,
    },

    // ── Step 4: Disposition & Accommodation ──
    {
      id: 'patient_disposition',
      label: 'Patient Disposition',
      type: 'dropdown', required: true,
      options: ['Improved', 'Recovered', 'Expired', 'Transferred/Referred', 'Home/Discharged Against Medical Advise', 'Absconded'],
      hint: 'Select one. "Expired" reveals date/time of death; "Transferred/Referred" reveals the receiving-HCI block.',
      optionHints: {
        'Improved':                               'Patient stable enough to leave the HCI; condition better than admission.',
        'Recovered':                              'Patient fully recovered.',
        'Expired':                                'Patient expired in this HCI — fill in date/time of death below.',
        'Transferred/Referred':                   'Patient transferred to another HCI for further care — fill the receiving-HCI block below.',
        'Home/Discharged Against Medical Advise': 'Patient or representative signed AMA waiver.',
        'Absconded':                              'Patient left the HCI without notice.',
      },
      step: 4,
    },
    {
      id: 'expired_date',
      label: 'Date Expired',
      type: 'date', required: false, optional_note: 'Only if disposition = Expired',
      step: 4,
      visibleWhen: { field: 'patient_disposition', equals: 'Expired' },
    },
    {
      id: 'expired_time',
      label: 'Time Expired',
      type: 'text', required: false, optional_note: 'Only if disposition = Expired',
      placeholder: 'e.g., 03 : 45 AM',
      mask: 'time', maxLength: 13,
      step: 4,
      visibleWhen: { field: 'patient_disposition', equals: 'Expired' },
    },
    { id: 'transferred_hci_name', label: 'Name of Receiving Health Care Institution',
      type: 'text', required: false, placeholder: 'e.g., PHILIPPINE GENERAL HOSPITAL',
      autoUppercase: true,
      step: 4, visibleWhen: { field: 'patient_disposition', equals: 'Transferred/Referred' } },
    { id: 'transferred_hci_bldg_street', label: 'Building Number and Street Name (Receiving HCI)',
      type: 'text', required: false, placeholder: 'e.g., Taft Ave.',
      maxLength: 60, autoUppercase: true,
      step: 4, visibleWhen: { field: 'patient_disposition', equals: 'Transferred/Referred' } },
    { id: 'transferred_hci_city', label: 'City/Municipality (Receiving HCI)', type: 'autocomplete',
      optionsSource: 'ph_cities', required: false, placeholder: 'e.g., Manila',
      maxLength: 60, autoUppercase: true,
      step: 4, visibleWhen: { field: 'patient_disposition', equals: 'Transferred/Referred' } },
    { id: 'transferred_hci_province', label: 'Province (Receiving HCI)', type: 'autocomplete',
      optionsSource: 'ph_provinces', required: false, autoUppercase: true,
      step: 4, visibleWhen: { field: 'patient_disposition', equals: 'Transferred/Referred' } },
    { id: 'transferred_hci_zip', label: 'ZIP Code (Receiving HCI)', type: 'text', required: false,
      placeholder: '1000', mask: 'zip', inputMode: 'numeric', maxLength: 4,
      step: 4, visibleWhen: { field: 'patient_disposition', equals: 'Transferred/Referred' } },
    { id: 'reason_for_referral', label: 'Reason/s for Referral/Transfer', type: 'text',
      required: false, placeholder: 'e.g., Needs specialist care',
      step: 4, visibleWhen: { field: 'patient_disposition', equals: 'Transferred/Referred' } },
    { id: 'accommodation_type', label: 'Type of Accommodation', type: 'dropdown', required: true,
      options: ['Private', 'Non-Private (Charity/Service)'], step: 4 },

    // ── Step 5: Diagnoses & Procedures ──
    { id: 'admission_diagnosis_1', label: 'Admission Diagnosis 1', type: 'text', required: true,
      placeholder: 'e.g., COMMUNITY-ACQUIRED PNEUMONIA', autoUppercase: true, step: 5 },
    { id: 'admission_diagnosis_2', label: 'Admission Diagnosis 2', type: 'text', required: false,
      optional_note: 'If applicable', placeholder: 'e.g., HYPERTENSION',
      autoUppercase: true, step: 5 },

    // 6 discharge rows; date fields use combined `'date'` mask.
    ...['1','2','3','4','5','6'].flatMap<FormField>((n) => [
      { id: `discharge_diagnosis_${n}`, label: `Discharge Diagnosis ${n}.`,
        type: 'text', required: n === '1',
        optional_note: n === '1' ? undefined : 'If applicable',
        placeholder: n === '1' ? 'e.g., PNEUMONIA, UNSPECIFIED' : '',
        autoUppercase: true, step: 5 },
      { id: `discharge_icd10_${n}`, label: `ICD-10 Code ${n}.`,
        type: 'text', required: false, optional_note: 'If applicable',
        placeholder: n === '1' ? 'e.g., J18.9' : '', step: 5 },
      { id: `discharge_procedure_${n}`, label: `Related Procedure ${n}.`,
        type: 'text', required: false, optional_note: 'If applicable',
        placeholder: n === '1' ? 'e.g., CHEST X-RAY' : '',
        autoUppercase: true, step: 5 },
      { id: `discharge_rvs_${n}`, label: `RVS Code ${n}.`,
        type: 'text', required: false, optional_note: 'If applicable',
        placeholder: n === '1' ? 'e.g., 71046' : '', step: 5 },
      { id: `discharge_procedure_date_${n}`, label: `Date of Procedure ${n}.`,
        type: 'date', required: false, optional_note: 'If applicable',
        hint: 'mm / dd / yyyy', step: 5 },
      { id: `discharge_laterality_${n}`, label: `Laterality ${n}.`,
        type: 'dropdown', required: false, optional_note: 'If applicable',
        options: ['N/A', 'left', 'right', 'both'], step: 5 },
    ]),

    // ── Step 6: Special Considerations ──
    ...([
      ['special_hemodialysis',          'Hemodialysis'],
      ['special_peritoneal_dialysis',   'Peritoneal Dialysis'],
      ['special_radiotherapy_linac',    'Radiotherapy (LINAC)'],
      ['special_radiotherapy_cobalt',   'Radiotherapy (COBALT)'],
      ['special_blood_transfusion',     'Blood Transfusion'],
      ['special_brachytherapy',         'Brachytherapy'],
      ['special_chemotherapy',          'Chemotherapy'],
      ['special_simple_debridement',    'Simple Debridement'],
    ] as const).map<FormField>(([id, label]) => ({
      id, label: `${label} — applicable?`, type: 'dropdown', required: false,
      options: ['No', 'Yes'], step: 6,
    })),
    { id: 'zbenefit_package_code', label: 'Z-Benefit Package Code', type: 'text', required: false,
      optional_note: 'Only if Z-Benefit applies', placeholder: 'e.g., Z01 — Breast Cancer',
      step: 6 },
    { id: 'mcp_dates', label: 'MCP Package — 4 Pre-natal Check-up Dates (mm-dd-yyyy)',
      type: 'text', required: false, optional_note: 'Only for MCP Package',
      placeholder: 'e.g., 06-01-2024, 07-01-2024, 08-01-2024, 09-01-2024', step: 6 },
    { id: 'tbdots_intensive_phase', label: 'TB DOTS — Intensive Phase Dates',
      type: 'text', required: false, placeholder: 'e.g., 01-01-2024 to 02-28-2024', step: 6 },
    { id: 'tbdots_maintenance_phase', label: 'TB DOTS — Maintenance Phase Dates',
      type: 'text', required: false, placeholder: 'e.g., 03-01-2024 to 06-30-2024', step: 6 },
    { id: 'animal_bite_arv_day1', label: 'Animal Bite — ARV Day 1 Date',
      type: 'text', required: false, placeholder: 'mm-dd-yyyy', step: 6 },
    { id: 'animal_bite_arv_day2', label: 'Animal Bite — ARV Day 2 Date',
      type: 'text', required: false, placeholder: 'mm-dd-yyyy', step: 6 },
    { id: 'animal_bite_arv_day3', label: 'Animal Bite — ARV Day 3 Date',
      type: 'text', required: false, placeholder: 'mm-dd-yyyy', step: 6 },
    { id: 'animal_bite_rig', label: 'Animal Bite — RIG Date',
      type: 'text', required: false, placeholder: 'mm-dd-yyyy', step: 6 },
    { id: 'animal_bite_others', label: 'Animal Bite — Others (Specify)',
      type: 'text', required: false, step: 6 },
    { id: 'newborn_essential_care', label: 'Newborn Care — Essential Newborn Care (done?)',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 6 },
    { id: 'newborn_hearing_screening', label: 'Newborn Care — Hearing Screening Test (done?)',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 6 },
    { id: 'newborn_screening_test', label: 'Newborn Care — Newborn Screening Test (done?)',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 6 },
    { id: 'hiv_lab_number', label: 'HIV/AIDS — Laboratory Number',
      type: 'text', required: false, placeholder: 'e.g., LAB-20240101', step: 6 },
    { id: 'philhealth_benefit_first_case_rate', label: 'PhilHealth Benefits — First Case Rate Amount',
      type: 'text', required: false, optional_note: 'Filled by HCI',
      placeholder: 'e.g., 32,000', mask: 'currency', inputMode: 'numeric', step: 6 },
    { id: 'philhealth_benefit_second_case_rate', label: 'PhilHealth Benefits — Second Case Rate Amount',
      type: 'text', required: false, optional_note: 'Filled by HCI',
      placeholder: 'e.g., 16,000', mask: 'currency', inputMode: 'numeric', step: 6 },
    { id: 'philhealth_benefit_icd_rvs_code', label: 'PhilHealth Benefits — ICD/RVS Code',
      type: 'text', required: false, optional_note: 'Filled by HCI',
      placeholder: 'e.g., J18.9', step: 6 },

    // ── Step 7: HCP Accreditation & Fees ──
    { id: 'hcp1_accreditation_no', label: 'HCP 1 — Accreditation No.',
      type: 'text', required: false, optional_note: 'At least 1 required',
      placeholder: 'HCP-12-345678', mask: 'hcpPan', inputMode: 'numeric', maxLength: 14, step: 7 },
    { id: 'hcp1_date_signed', label: 'HCP 1 — Date Signed',
      type: 'date', required: false, hint: 'mm / dd / yyyy', step: 7 },
    { id: 'hcp1_copay', label: 'HCP 1 — Co-pay', type: 'dropdown', required: false,
      options: ['No co-pay on top of PhilHealth Benefit', 'With co-pay on top of PhilHealth Benefit'],
      step: 7 },
    { id: 'hcp2_accreditation_no', label: 'HCP 2 — Accreditation No.',
      type: 'text', required: false, optional_note: 'If 2nd HCP',
      placeholder: 'HCP-12-345678', mask: 'hcpPan', inputMode: 'numeric', maxLength: 14, step: 7 },
    { id: 'hcp2_date_signed', label: 'HCP 2 — Date Signed',
      type: 'date', required: false, hint: 'mm / dd / yyyy', step: 7,
      visibleWhen: { field: 'hcp2_accreditation_no', notEmpty: true } },
    { id: 'hcp2_copay', label: 'HCP 2 — Co-pay', type: 'dropdown', required: false,
      options: ['No co-pay on top of PhilHealth Benefit', 'With co-pay on top of PhilHealth Benefit'],
      step: 7,
      visibleWhen: { field: 'hcp2_accreditation_no', notEmpty: true } },
    { id: 'hcp3_accreditation_no', label: 'HCP 3 — Accreditation No.',
      type: 'text', required: false, optional_note: 'If 3rd HCP',
      placeholder: 'HCP-12-345678', mask: 'hcpPan', inputMode: 'numeric', maxLength: 14, step: 7,
      visibleWhen: { field: 'hcp2_accreditation_no', notEmpty: true } },
    { id: 'hcp3_date_signed', label: 'HCP 3 — Date Signed',
      type: 'date', required: false, hint: 'mm / dd / yyyy', step: 7,
      visibleWhen: { field: 'hcp3_accreditation_no', notEmpty: true } },
    { id: 'hcp3_copay', label: 'HCP 3 — Co-pay', type: 'dropdown', required: false,
      options: ['No co-pay on top of PhilHealth Benefit', 'With co-pay on top of PhilHealth Benefit'],
      step: 7,
      visibleWhen: { field: 'hcp3_accreditation_no', notEmpty: true } },

    // ── Step 8: Certification of Benefits ──
    { id: 'total_hci_fees', label: 'Total Health Care Institution Fees', type: 'text',
      required: false, placeholder: 'e.g., 45,000', mask: 'currency',
      inputMode: 'numeric', maxLength: 14, step: 8 },
    { id: 'total_professional_fees', label: 'Total Professional Fees', type: 'text',
      required: false, placeholder: 'e.g., 10,000', mask: 'currency',
      inputMode: 'numeric', maxLength: 14, step: 8 },
    { id: 'grand_total', label: 'Grand Total (auto = HCI + Professional Fees)', type: 'text',
      required: false, placeholder: 'e.g., 55,000',
      hint: 'Computed automatically when both fees are filled.',
      mask: 'currency', inputMode: 'numeric', step: 8 },
    { id: 'total_actual_charges', label: 'Total Actual Charges (after discount)', type: 'text',
      required: false, placeholder: 'e.g., 50,000', mask: 'currency',
      inputMode: 'numeric', step: 8 },
    { id: 'discount_amount', label: 'Discount Amount (Senior Citizen / PWD)', type: 'text',
      required: false, placeholder: 'e.g., 5,000', mask: 'currency',
      inputMode: 'numeric', maxLength: 14, step: 8 },
    { id: 'philhealth_benefit_amount', label: 'PhilHealth Benefit Amount', type: 'text',
      required: false, placeholder: 'e.g., 32,000', mask: 'currency',
      inputMode: 'numeric', maxLength: 14, step: 8 },
    { id: 'amount_after_philhealth', label: 'Amount After PhilHealth Deduction', type: 'text',
      required: false, placeholder: 'e.g., 18,000',
      hint: 'Computed: Actual Charges − Discount − PhilHealth Benefit.',
      mask: 'currency', inputMode: 'numeric', step: 8 },
    { id: 'hci_amount_paid_by', label: 'HCI Fees — Amount Paid', type: 'text', required: false,
      placeholder: 'e.g., 35,000', mask: 'currency', inputMode: 'numeric', step: 8 },
    { id: 'hci_paid_member_patient', label: 'HCI Fees — Paid by Member/Patient?',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 8 },
    { id: 'hci_paid_hmo', label: 'HCI Fees — Paid by HMO?',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 8 },
    { id: 'hci_paid_others', label: 'HCI Fees — Paid by Others (PCSO / Promissory Note)?',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 8 },
    { id: 'pf_amount_paid_by', label: 'Professional Fees — Amount Paid', type: 'text',
      required: false, placeholder: 'e.g., 10,000', mask: 'currency', inputMode: 'numeric', step: 8 },
    { id: 'pf_paid_member_patient', label: 'Professional Fees — Paid by Member/Patient?',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 8 },
    { id: 'pf_paid_hmo', label: 'Professional Fees — Paid by HMO?',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 8 },
    { id: 'pf_paid_others', label: 'Professional Fees — Paid by Others (PCSO / Promissory Note)?',
      type: 'dropdown', required: false, options: ['No', 'Yes'], step: 8 },
    { id: 'drug_purchase_none', label: 'Drug/Medicine Purchase — None?',
      type: 'dropdown', required: false, options: ['No', 'Yes — None'], step: 8 },
    { id: 'drug_purchase_total_amount', label: 'Drug/Medicine Purchase — Total Amount',
      type: 'text', required: false, placeholder: 'e.g., 2,500',
      mask: 'currency', inputMode: 'numeric', maxLength: 14, step: 8 },
    { id: 'diagnostic_purchase_none', label: 'Diagnostic/Laboratory Examination — None?',
      type: 'dropdown', required: false, options: ['No', 'Yes — None'], step: 8 },
    { id: 'diagnostic_purchase_total_amount', label: 'Diagnostic/Laboratory Examination — Total Amount',
      type: 'text', required: false, placeholder: 'e.g., 1,800',
      mask: 'currency', inputMode: 'numeric', maxLength: 14, step: 8 },
  ],
  smartAssistance: {
    eligibility: [
      { id: 'hcipan', label: 'HCI PAN is 8 digits', rule: 'digits-eq',
        fieldId: 'hci_pan', count: 8 },
      { id: 'hcp1pan', label: 'HCP 1 Accreditation No. is 8 digits (when given)',
        rule: 'digits-eq', fieldId: 'hcp1_accreditation_no', count: 8 },
      { id: 'discharge-after-admit',
        label: 'Discharge date is on or after Admission date',
        rule: 'date-not-before', fieldId: 'date_discharged',
        notBeforeFieldId: 'date_admitted' },
      { id: 'filing-window-60',
        label: 'Filing window: ≤ 60 days since Date Discharged',
        rule: 'days-since-max', fieldId: 'date_discharged', max: 60 },
    ],
  },
};

// ─── PhilHealth PMRF — Foreign National variant ───────────────────────────────
// Separate source PDF "PhilHealth - PMRF_ForeignNatl.pdf" (A4, 1 page).
// Simpler layout than the domestic PMRF: underline-based fields, no digit boxes,
// only 2 checkbox squares (Sex: Male/Female).
// ─── PhilHealth PMRF — Foreign National (PMRF-FN) ────────────────────────────
// Source: PhilHealth - PMRF_ForeignNatl.pdf (A4, 595 × 842, 1 page).
//
// L-SMART-PMRF-FN-01 (2026-04-28) Smart Assistance pass:
//   • Member DOB triple → single combined `dob` (mask:'date'); same for the 6
//     dependent rows. expandCombinedDates() re-splits at PDF render time.
//   • `documentation_type` dropdown gates ACR I-Card vs PRA SRRV (visibleWhen
//     equalsOneOf cascade of L-SMART-CF2-01 dropdown branching). Either is
//     mandatory — enforced by the `any-non-empty` eligibility rule (NEW).
//   • `is_mononymous` boolean toggle clears + suppresses first/middle name
//     in the `handleChange` branch (cascade pattern for any form supporting
//     single-name applicants — Indonesian, Burmese, Javanese, etc.).
//   • Combined PH-phone mask `phPhone` auto-detects mobile vs landline
//     (cascade-ready for any single contact-no field site-wide).
//   • Nationality + dep nationalities use the new `nationalities`
//     autocomplete source (~190 ISO 3166 demonyms).
//   • Dependents expanded 3 → 6 rows to match the printed PDF (schema-mismatch
//     fix; cascade lesson for any underdeveloped schema).
//   • Eligibility rules: docs (any-non-empty), age-min 18, pin (digits-eq 12
//     when given), phone-ph, email.
const philhealthPmrfForeignNatl: FormSchema = {
  slug: 'philhealth-pmrf-foreign-natl',
  code: 'PMRF-FN',
  version: 'Foreign National (2018)',
  name: 'PhilHealth Member Registration Form (Foreign National)',
  agency: 'PhilHealth',
  category: 'Membership',
  pdfPath: 'PhilHealth - PMRF_ForeignNatl.pdf',
  description:
    'Register as a PhilHealth member as a foreign national residing in the Philippines.',
  steps: [
    {
      label: "Member's Profile",
      fieldIds: [
        'philhealth_number',
        'documentation_type', 'acr_icard_number', 'pra_srrv_number',
        'is_mononymous',
        'last_name', 'first_name', 'middle_name',
        'sex', 'nationality',
        'dob',
        'civil_status',
      ],
    },
    {
      label: 'Contact & Address',
      fieldIds: [
        'philippine_address_line1', 'philippine_address_line2',
        'contact_phone', 'email',
      ],
    },
    {
      label: 'Dependents (Optional)',
      fieldIds: [
        'dep1_last', 'dep1_first', 'dep1_middle', 'dep1_sex', 'dep1_relationship', 'dep1_dob', 'dep1_nationality',
        'dep2_last', 'dep2_first', 'dep2_middle', 'dep2_sex', 'dep2_relationship', 'dep2_dob', 'dep2_nationality',
        'dep3_last', 'dep3_first', 'dep3_middle', 'dep3_sex', 'dep3_relationship', 'dep3_dob', 'dep3_nationality',
        'dep4_last', 'dep4_first', 'dep4_middle', 'dep4_sex', 'dep4_relationship', 'dep4_dob', 'dep4_nationality',
        'dep5_last', 'dep5_first', 'dep5_middle', 'dep5_sex', 'dep5_relationship', 'dep5_dob', 'dep5_nationality',
        'dep6_last', 'dep6_first', 'dep6_middle', 'dep6_sex', 'dep6_relationship', 'dep6_dob', 'dep6_nationality',
      ],
    },
    {
      label: 'Signature',
      fieldIds: ['signature_printed_name', 'signature_date'],
    },
  ],
  fields: [
    // ── Step 1: Members Profile ──
    { id: 'philhealth_number', label: 'PhilHealth Number', type: 'text', required: false,
      optional_note: 'Leave blank if new applicant', placeholder: '12-345678901-2',
      mask: 'pin', maxLength: 14, inputMode: 'numeric', step: 1 },

    // Documentation gate — at least one of ACR / PRA is required.
    { id: 'documentation_type', label: 'Documentation Type', type: 'dropdown', required: true,
      options: ['ACR I-Card', 'PRA SRRV', 'Both'],
      hint: 'Foreign nationals registering with PhilHealth must hold either an ACR I-Card or a PRA SRRV (or both).',
      optionHints: {
        'ACR I-Card': 'Alien Certificate of Registration Identity Card — issued by Bureau of Immigration.',
        'PRA SRRV':   "Special Resident Retiree's Visa — issued by Philippine Retirement Authority.",
        'Both':       'You hold both. Provide both numbers below.',
      },
      step: 1 },
    { id: 'acr_icard_number', label: 'ACR I-Card Number', type: 'text', required: true,
      placeholder: 'E.g., E-1234567', hint: 'Bureau of Immigration ACR I-Card number.',
      visibleWhen: { field: 'documentation_type', equalsOneOf: ['ACR I-Card', 'Both'] },
      maxLength: 24, step: 1 },
    { id: 'pra_srrv_number', label: 'PRA SRRV Number', type: 'text', required: true,
      placeholder: 'E.g., SRRV-12345', hint: 'Special Resident Retiree\u2019s Visa number.',
      visibleWhen: { field: 'documentation_type', equalsOneOf: ['PRA SRRV', 'Both'] },
      maxLength: 24, step: 1 },

    // Mononymous toggle (clears first/middle in handleChange when ticked).
    { id: 'is_mononymous', label: 'I have only one legal name', type: 'checkbox', required: false,
      hint: 'Tick if you have a single legal name (e.g., common in Indonesian, Burmese, or Javanese cultures). First/Middle Name will be cleared and skipped.',
      step: 1 },

    { id: 'last_name', label: 'Last Name (or Sole Legal Name)', type: 'text', required: true,
      autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'first_name', label: 'First Name', type: 'text', required: true,
      autoUppercase: true, maxLength: 80,
      visibleWhen: { field: 'is_mononymous', equals: '' },
      step: 1 },
    { id: 'middle_name', label: 'Middle Name', type: 'text', required: false,
      optional_note: 'Leave blank if none',
      autoUppercase: true, maxLength: 80,
      visibleWhen: { field: 'is_mononymous', equals: '' },
      step: 1 },

    { id: 'sex', label: 'Sex', type: 'dropdown', required: true,
      options: ['Male', 'Female'], step: 1 },
    { id: 'nationality', label: 'Nationality', type: 'autocomplete', required: true,
      optionsSource: 'nationalities',
      placeholder: 'e.g., American, Japanese, Korean', maxLength: 60, step: 1 },

    { id: 'dob', label: 'Date of Birth', type: 'date', required: true,
      hint: 'Format: mm / dd / yyyy', step: 1 },

    { id: 'civil_status', label: 'Civil Status', type: 'dropdown', required: true,
      options: ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'], step: 1 },

    // ── Step 2: Contact & Address ──
    { id: 'philippine_address_line1', label: 'Philippine Address — Line 1', type: 'text',
      required: true, placeholder: 'Unit / Building / Street',
      hint: 'PhilHealth membership is mandatory for foreign nationals residing in the Philippines for 6 months or more.',
      maxLength: 150, autoUppercase: true, step: 2 },
    { id: 'philippine_address_line2', label: 'Philippine Address — Line 2', type: 'text',
      required: false, optional_note: 'Barangay, City, Province, ZIP',
      maxLength: 150, autoUppercase: true, step: 2 },
    { id: 'contact_phone', label: 'Contact / Phone Number', type: 'tel', required: true,
      placeholder: '+63 9XX XXX XXXX or (02) XXXX-XXXX',
      hint: 'Mobile or landline — auto-formatted as you type.',
      mask: 'phPhone', maxLength: 20, step: 2 },
    { id: 'email', label: 'Email Address', type: 'email', required: true, maxLength: 80, step: 2 },

    // ── Step 3: Dependents (all optional, 6 rows to match the printed PDF) ──
    ...([1, 2, 3, 4, 5, 6] as const).flatMap((i): FormField[] => [
      { id: `dep${i}_last`, label: `Dependent ${i} — Last Name`, type: 'text', required: false,
        optional_note: 'Leave blank if none', autoUppercase: true, maxLength: 80, step: 3 },
      { id: `dep${i}_first`, label: `Dependent ${i} — First Name`, type: 'text', required: false,
        autoUppercase: true, maxLength: 80, step: 3 },
      { id: `dep${i}_middle`, label: `Dependent ${i} — Middle Name`, type: 'text', required: false,
        autoUppercase: true, maxLength: 80, step: 3 },
      { id: `dep${i}_sex`, label: `Dependent ${i} — Sex (M/F)`, type: 'dropdown', required: false,
        options: ['M', 'F'], step: 3 },
      { id: `dep${i}_relationship`, label: `Dependent ${i} — Relationship`, type: 'text', required: false,
        placeholder: 'Spouse, Child, Parent', autoUppercase: true, maxLength: 30, step: 3 },
      { id: `dep${i}_dob`, label: `Dependent ${i} — Date of Birth`, type: 'date', required: false,
        hint: 'Format: mm / dd / yyyy', step: 3 },
      { id: `dep${i}_nationality`, label: `Dependent ${i} — Nationality`, type: 'autocomplete', required: false,
        optionsSource: 'nationalities', maxLength: 60, step: 3 },
    ]),

    // ── Step 4: Signature ──
    { id: 'signature_printed_name', label: 'Printed Name (Signatory)', type: 'text', required: true,
      hint: 'Full printed name matching the signature', autoUppercase: true, maxLength: 80, step: 4 },
    { id: 'signature_date', label: 'Date Signed', type: 'date', required: true, step: 4 },
  ],
  smartAssistance: {
    eligibility: [
      { id: 'docs',  label: 'Provide ACR I-Card or PRA SRRV (or both)', rule: 'any-non-empty',
        fieldIds: ['acr_icard_number', 'pra_srrv_number'] },
      { id: 'age',   label: 'Member is at least 18',               rule: 'age-min',   fieldId: 'dob',               min: 18 },
      { id: 'pin',   label: 'PhilHealth PIN is 12 digits (when given)', rule: 'digits-eq', fieldId: 'philhealth_number', count: 12 },
      { id: 'phone', label: 'Phone is a valid PH number',          rule: 'phone-ph',  fieldId: 'contact_phone' },
      { id: 'email', label: 'Email address is well-formed',        rule: 'email',     fieldId: 'email' },
    ],
  },
};

// ─── PhilHealth Claim Signature Form (CSF_2018) ──────────────────────────────
// Source: PhilHealth - ClaimSignatureForm_2018.pdf (Legal, 1 page, 612 × 936).
// Filled by member + (optionally) employer + HCI consenter. We implement the
// member/employer portions only — HCI/HCP sections (Part IV/V) are outside
// the scope of a self-service workflow.
//
// L-SMART-CSF-01 (2026-04-28) Smart Assistance pass:
//   • 6 date triples collapsed into single masked `mm / dd / yyyy` fields;
//     pdf-generator.expandCombinedDates() re-splits at write time so PDF
//     coordinates are unchanged.
//   • PhilHealth PIN / Dependent PIN / Employer PEN auto-masked (12 digits).
//   • Employer Contact No. masked as PH mobile (when 11-digit cell).
//   • "Patient is the same as Member" mirror toggle clones name + DOB and
//     forces relationship_to_member = Self (handled in page.tsx).
//   • "Has employer" toggle hides the entire Employer block via visibleWhen.
//   • optionHints on relationship_to_member (eligibility blurbs).
//   • Eligibility rules: discharge ≥ admit and 60-day filing window.
const philhealthClaimSignatureForm: FormSchema = {
  slug: 'philhealth-claim-signature-form',
  code: 'CSF-2018',
  version: 'Revised September 2018',
  name: 'PhilHealth Claim Signature Form',
  agency: 'PhilHealth',
  category: 'Claims',
  pdfPath: 'PhilHealth - ClaimSignatureForm_2018.pdf',
  description:
    'Sign-off companion form for PhilHealth claims — member/patient certification, employer certification, and consent to access patient records.',
  steps: [
    {
      label: 'Member Info',
      fieldIds: [
        'series_no',
        'member_pin',
        'member_last_name', 'member_first_name', 'member_ext_name', 'member_middle_name',
        'member_dob',
      ],
    },
    {
      label: 'Patient & Confinement',
      fieldIds: [
        'patient_is_self',
        'dependent_pin',
        'patient_last_name', 'patient_first_name', 'patient_ext_name', 'patient_middle_name',
        'relationship_to_member',
        'date_admitted',
        'date_discharged',
        'patient_dob',
      ],
    },
    {
      label: 'Employer (if employed)',
      fieldIds: [
        'has_employer',
        'employer_pen',
        'employer_contact_no',
        'business_name',
        'employer_date_signed',
      ],
    },
    {
      label: 'Consent Signature',
      fieldIds: [
        'consent_date_signed',
      ],
    },
  ],
  fields: [
    // ── Step 1: Member Info ──
    { id: 'series_no', label: 'Series #', type: 'text', required: false,
      optional_note: 'Provided by HCI — leave blank if unknown',
      placeholder: 'up to 13 digits', inputMode: 'numeric', maxLength: 13, step: 1 },
    { id: 'member_pin', label: 'Member PhilHealth PIN', type: 'text', required: true,
      placeholder: '12-345678901-2', hint: '12 digits — auto-formatted as you type.',
      mask: 'pin', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'member_last_name', label: 'Member — Last Name', type: 'text', required: true, autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'member_first_name', label: 'Member — First Name', type: 'text', required: true, autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'member_ext_name', label: 'Member — Name Extension (JR/SR/III)', type: 'text', required: false,
      optional_note: 'Leave blank if none', autoUppercase: true, maxLength: 6, step: 1 },
    { id: 'member_middle_name', label: 'Member — Middle Name', type: 'text', required: false, autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'member_dob', label: 'Member Date of Birth', type: 'date', required: true,
      hint: 'Format: mm / dd / yyyy', step: 1 },

    // ── Step 2: Patient ──
    { id: 'patient_is_self', label: 'Patient is the same as the Member', type: 'checkbox', required: false,
      hint: 'Tick to copy member name + DOB to the patient block (sets Relationship to Self).', step: 2 },
    { id: 'dependent_pin', label: 'Dependent PhilHealth PIN (if applicable)', type: 'text', required: false,
      optional_note: 'Leave blank if patient is the member',
      placeholder: '12-345678901-2', mask: 'pin', inputMode: 'numeric', maxLength: 14, step: 2 },
    { id: 'patient_last_name', label: 'Patient — Last Name', type: 'text', required: true,
      mirrorFrom: 'member_last_name', mirrorGroup: 'patient_is_self',
      autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'patient_first_name', label: 'Patient — First Name', type: 'text', required: true,
      mirrorFrom: 'member_first_name', mirrorGroup: 'patient_is_self',
      autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'patient_ext_name', label: 'Patient — Name Extension', type: 'text', required: false,
      optional_note: 'Leave blank if none',
      mirrorFrom: 'member_ext_name', mirrorGroup: 'patient_is_self',
      autoUppercase: true, maxLength: 6, step: 2 },
    { id: 'patient_middle_name', label: 'Patient — Middle Name', type: 'text', required: false,
      mirrorFrom: 'member_middle_name', mirrorGroup: 'patient_is_self',
      autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'relationship_to_member', label: 'Relationship to Member', type: 'dropdown', required: true,
      options: ['Self', 'Child', 'Parent', 'Spouse'],
      optionHints: {
        'Self':   'Patient is the member — leave Dependent PIN blank.',
        'Child':  'Legitimate / illegitimate / adopted child below 21 (or PWD of any age).',
        'Parent': 'Parent aged ≥ 60 and not a member-dependent of someone else.',
        'Spouse': 'Legal spouse — not separately covered as a member.',
      },
      step: 2 },
    { id: 'date_admitted', label: 'Date Admitted', type: 'date', required: true,
      hint: 'Format: mm / dd / yyyy', step: 2 },
    { id: 'date_discharged', label: 'Date Discharged', type: 'date', required: true,
      hint: 'Local availment must be filed within 60 days of discharge (180 days if abroad).', step: 2 },
    { id: 'patient_dob', label: 'Patient Date of Birth', type: 'date', required: true,
      mirrorFrom: 'member_dob', mirrorGroup: 'patient_is_self',
      hint: 'Format: mm / dd / yyyy', step: 2 },

    // ── Step 3: Employer ──
    { id: 'has_employer', label: 'Member is currently employed', type: 'checkbox', required: false,
      hint: 'Untick if self-employed / unemployed — the entire Employer block will be hidden and skipped.', step: 3 },
    { id: 'employer_pen', label: 'Employer PhilHealth Number (PEN)', type: 'text', required: false,
      optional_note: 'Leave blank if not employed',
      placeholder: '12-345678901-2', mask: 'pen', inputMode: 'numeric', maxLength: 14, step: 3,
      visibleWhen: { field: 'has_employer', equals: 'true' } },
    { id: 'employer_contact_no', label: 'Employer Contact No.', type: 'tel', required: false,
      optional_note: 'Leave blank if not employed',
      mask: 'mobile', inputMode: 'tel', maxLength: 20, step: 3,
      visibleWhen: { field: 'has_employer', equals: 'true' } },
    { id: 'business_name', label: 'Business Name (Employer)', type: 'text', required: false,
      optional_note: 'Leave blank if not employed', autoUppercase: true, maxLength: 80, step: 3,
      visibleWhen: { field: 'has_employer', equals: 'true' } },
    { id: 'employer_date_signed', label: 'Employer Date Signed', type: 'date', required: false,
      optional_note: 'Leave blank if not employed', hint: 'Format: mm / dd / yyyy', step: 3,
      visibleWhen: { field: 'has_employer', equals: 'true' } },

    // ── Step 4: Consent Signature ──
    { id: 'consent_date_signed', label: 'Consent Date Signed', type: 'date', required: true,
      hint: 'Format: mm / dd / yyyy', step: 4 },
  ],
  smartAssistance: {
    eligibility: [
      { id: 'mpin',    label: 'Member PIN is 12 digits',         rule: 'digits-eq', fieldId: 'member_pin',    count: 12 },
      { id: 'dpin',    label: 'Dependent PIN is 12 digits (when given)', rule: 'digits-eq', fieldId: 'dependent_pin', count: 12 },
      { id: 'pen',     label: 'Employer PEN is 12 digits (when given)',  rule: 'digits-eq', fieldId: 'employer_pen',  count: 12 },
      { id: 'mobile',  label: 'Employer contact is 11 digits (when given)', rule: 'digits-eq', fieldId: 'employer_contact_no', count: 11 },
      { id: 'discharge_after_admit',
        label: 'Date Discharged is on or after Date Admitted',
        rule: 'date-not-before', fieldId: 'date_discharged', notBeforeFieldId: 'date_admitted' },
      { id: 'filing_window',
        label: 'Filing window: ≤ 60 days since Date Discharged',
        rule: 'days-since-max', fieldId: 'date_discharged', max: 60 },
    ],
  },
};

// ─── PhilHealth Claim Form 3 — Patient's Clinical Record + MCP ───────────────
// Revised November 2013, 2 pages US Legal 612×1008 pt.
// v0 ONBOARDING SCOPE (L-SMART-CF3-V0): Part I narrative + admission/discharge
// + disposition (~35 fields). Part II (Maternity Care Package — 12-visit grid,
// obstetric tuple, birth outcomes) is stubbed in schema but not yet
// PDF-rendered. Follow-up sprints will add the 84-cell prenatal grid via the
// proposed `gridRepeat` primitive once cascadable.
//
// Cascade reuse:
//  - PIN / hciPan masks ............................ from L-SMART-CSF-01
//  - Combined dates (mm/dd/yyyy) × 4 ............... from L-SMART-CSF-01
//  - Combined times (hh:mm AM/PM) × 2 .............. from L-SMART-CF2-01
//  - Boolean toggle ⇄ Yes/No bridge ................ from L-SMART-CF1-01
//  - Dropdown-value `visibleWhen` (disposition) .... from L-SMART-CF2-01
const philhealthClaimForm3: FormSchema = {
  slug: 'philhealth-claim-form-3',
  code: 'CF-3',
  version: 'Revised November 2013',
  name: 'PhilHealth Claim Form 3',
  agency: 'PhilHealth',
  category: 'Health Insurance',
  pdfPath: 'PhilHealth - ClaimForm3.pdf',
  description:
    "PhilHealth Claim Form 3 — Patient's Clinical Record and Maternity Care Package (MCP) report, attached to CF-1/CF-2 for MCP claims. v0 release covers Part I narrative + admission/discharge/disposition; Part II (MCP) onboarding scaffolded for follow-up.",
  steps: [
    {
      label: 'HCI & Patient',
      fieldIds: ['hci_pan', 'hci_name', 'patient_last_name', 'patient_first_name', 'patient_name_ext', 'patient_middle_name'],
    },
    {
      label: 'Admission & Discharge',
      fieldIds: ['chief_complaint', 'date_admitted', 'time_admitted', 'date_discharged', 'time_discharged'],
    },
    {
      label: 'Clinical Narrative',
      fieldIds: [
        'history_of_present_illness',
        'pe_general_survey', 'pe_heent', 'pe_chest_lungs', 'pe_cvs', 'pe_abdomen', 'pe_genitourinary', 'pe_extremities',
        'vs_blood_pressure', 'vs_cardiac_rate', 'vs_respiratory_rate', 'vs_temperature',
        'course_in_the_ward',
        'pertinent_lab_findings',
      ],
    },
    {
      label: 'Disposition',
      fieldIds: [
        'patient_disposition',
        'transferred_hci_name',
        'expired_date',
        'admitting_diagnosis', 'final_diagnosis',
      ],
    },
    {
      label: 'Certification',
      fieldIds: ['attending_physician_name', 'attending_physician_prc', 'attending_physician_date_signed'],
    },
  ],
  fields: [
    // ── Step 1: HCI & Patient ──
    { id: 'hci_pan', label: 'HCI PhilHealth Accreditation Number (PAN)',
      type: 'text', required: true, placeholder: 'HCI-12-345678',
      hint: '8-digit PAN issued by PhilHealth — auto-formatted.',
      mask: 'hciPan', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'hci_name', label: 'Name of Hospital / Health Care Institution',
      type: 'text', required: true, placeholder: "e.g., ST. LUKE'S MEDICAL CENTER",
      autoUppercase: true, step: 1 },
    { id: 'patient_last_name', label: "Patient's Last Name", type: 'text',
      required: true, autoUppercase: true, step: 1 },
    { id: 'patient_first_name', label: "Patient's First Name", type: 'text',
      required: true, autoUppercase: true, step: 1 },
    { id: 'patient_last_name', label: "Patient's Last Name", type: 'text',
      required: true, autoUppercase: true, maxLength: 30, step: 1 },
    { id: 'patient_first_name', label: "Patient's First Name", type: 'text',
      required: true, autoUppercase: true, maxLength: 30, step: 1 },
    { id: 'patient_name_ext', label: 'Name Extension', type: 'dropdown',
      required: false,
      options: ['N/A', 'JR.', 'SR.', 'II', 'III', 'IV', 'V'],
      placeholder: 'N/A', step: 1 },
    { id: 'patient_middle_name', label: "Patient's Middle Name", type: 'text',
      required: false, autoUppercase: true, maxLength: 30, step: 1 },

    // ── Step 2: Admission & Discharge ──
    // maxLength values reflect PDF cell capacity at the min legible 6pt floor
    //   (avg ≈3pt/char in Helvetica). UI inputs enforce this so users see the
    //   cap BEFORE the PDF would have to truncate with “…”. See L-SMART-CF3-04.
    { id: 'chief_complaint', label: 'Chief Complaint', type: 'textarea',
      required: true, placeholder: 'e.g., Labor pains, fever, abdominal pain',
      hint: "The patient's primary reason for admission, in their own words.",
      maxLength: 55, step: 2 },
    { id: 'date_admitted', label: 'Date Admitted', type: 'date',
      required: true, hint: 'Format: mm / dd / yyyy', step: 2 },
    { id: 'time_admitted', label: 'Time Admitted', type: 'text',
      required: true, mask: 'time', hint: 'Format: hh:mm AM/PM', step: 2 },
    { id: 'date_discharged', label: 'Date Discharged', type: 'date',
      required: true, hint: 'Format: mm / dd / yyyy', step: 2 },
    { id: 'time_discharged', label: 'Time Discharged', type: 'text',
      required: true, mask: 'time', hint: 'Format: hh:mm AM/PM', step: 2 },

    // ── Step 3: Clinical Narrative ──
    // L-SMART-CF3-05: narrative bands now use bounded multi-line word-wrap.
    //   Q6 (95pt usable / 10pt line) = 9 lines × ≈130 chars ≈ 1100 cap.
    //   Q8 (130pt) = 12 lines → 1500 cap.
    //   Q9 (75pt)  = 7 lines  → 900 cap.
    { id: 'history_of_present_illness', label: 'Brief History of Present Illness / OB History',
      type: 'textarea', required: true, maxLength: 1100,
      hint: 'Onset, duration, character, associated symptoms, treatments tried.',
      step: 3 },
    { id: 'pe_general_survey', label: 'General Survey', type: 'textarea',
      required: false,
      placeholder: 'e.g., Conscious, coherent, ambulatory, NICRD',
      maxLength: 80, step: 3 },
    { id: 'vs_blood_pressure', label: 'Blood Pressure', type: 'text',
      required: false, placeholder: '120/80', maxLength: 10,
      hint: 'Systolic / Diastolic in mmHg.', step: 3 },
    { id: 'vs_cardiac_rate', label: 'Cardiac Rate (bpm)', type: 'text',
      required: false, placeholder: '78', inputMode: 'numeric', maxLength: 3, step: 3 },
    { id: 'vs_respiratory_rate', label: 'Respiratory Rate (cpm)', type: 'text',
      required: false, placeholder: '18', inputMode: 'numeric', maxLength: 2, step: 3 },
    { id: 'vs_temperature', label: 'Temperature (°C)', type: 'text',
      required: false, placeholder: '36.8', maxLength: 5,
      hint: 'In degrees Celsius.', step: 3 },
    // PE rows: left column maxWidth=230 (≈76 chars @ 6pt); right column 170 (≈56 chars).
    { id: 'pe_heent', label: 'HEENT', type: 'textarea', required: false, maxLength: 75, step: 3 },
    { id: 'pe_chest_lungs', label: 'Chest / Lungs', type: 'textarea', required: false, maxLength: 75, step: 3 },
    { id: 'pe_cvs', label: 'Cardiovascular System', type: 'textarea', required: false, maxLength: 75, step: 3 },
    { id: 'pe_abdomen', label: 'Abdomen', type: 'textarea', required: false, maxLength: 56, step: 3 },
    { id: 'pe_genitourinary', label: 'Genitourinary (GU/IE)', type: 'textarea', required: false, maxLength: 56, step: 3 },
    { id: 'pe_extremities', label: 'Extremities', type: 'textarea', required: false, maxLength: 46, step: 3 },
    { id: 'course_in_the_ward', label: 'Course in the Ward', type: 'textarea',
      required: true, maxLength: 1500,
      hint: 'Chronological clinical course, treatments given, response.', step: 3 },
    { id: 'pertinent_lab_findings', label: 'Pertinent Laboratory & Diagnostic Findings',
      type: 'textarea', required: false, maxLength: 900,
      placeholder: 'e.g., CBC: Hgb 12.4 g/dL, WBC 8.6; UA: normal; CXR: clear',
      hint: 'CBC, urinalysis, fecalysis, X-ray, biopsy, etc.', step: 3 },

    // ── Step 4: Disposition ──
    { id: 'patient_disposition', label: 'Disposition on Discharge', type: 'dropdown',
      options: ['Improved', 'Transferred', 'HAMA', 'Absconded', 'Expired'],
      required: true,
      hint: 'HAMA = Home Against Medical Advice. Transferred-HCI / Expired-date fields appear when applicable.',
      step: 4 },
    { id: 'transferred_hci_name', label: 'Receiving HCI Name (if Transferred)',
      type: 'text', required: false, autoUppercase: true,
      visibleWhen: { field: 'patient_disposition', equals: 'Transferred' }, step: 4 },
    { id: 'expired_date', label: 'Date of Expiration', type: 'date',
      required: false, hint: 'Format: mm / dd / yyyy',
      visibleWhen: { field: 'patient_disposition', equals: 'Expired' }, step: 4 },
    { id: 'admitting_diagnosis', label: 'Admitting Diagnosis', type: 'textarea',
      required: true, maxLength: 200, step: 4 },
    { id: 'final_diagnosis', label: 'Final Diagnosis', type: 'textarea',
      required: true, maxLength: 200, step: 4 },

    // ── Step 5: Certification ──
    { id: 'attending_physician_name', label: 'Attending Physician / Midwife — Name',
      type: 'text', required: true, autoUppercase: true,
      placeholder: 'e.g., JUAN DELA CRUZ, MD', step: 5 },
    { id: 'attending_physician_prc', label: 'PRC License Number', type: 'text',
      required: true, inputMode: 'numeric', maxLength: 7,
      placeholder: '0123456', step: 5 },
    { id: 'attending_physician_date_signed', label: 'Date Signed', type: 'date',
      required: true, hint: 'Format: mm / dd / yyyy', step: 5 },
  ],
  smartAssistance: {
    eligibility: [
      { id: 'pan',  label: 'HCI PAN is 8 digits',  rule: 'digits-eq', fieldId: 'hci_pan', count: 8 },
      { id: 'prc',  label: 'PRC license is 7 digits', rule: 'digits-eq', fieldId: 'attending_physician_prc', count: 7 },
      { id: 'discharge_after_admit',
        label: 'Date Discharged is on or after Date Admitted',
        rule: 'date-not-before', fieldId: 'date_discharged', notBeforeFieldId: 'date_admitted' },
      { id: 'signed_after_discharge',
        label: 'Date Signed is on or after Date Discharged',
        rule: 'date-not-before', fieldId: 'attending_physician_date_signed', notBeforeFieldId: 'date_discharged' },
    ],
  },
};

// ─── Pag-IBIG PFF-049 (MCIF) ─────────────────────────────────────────────────
// Member's Change of Information Form (V12 12/2025), 2 pages legal 612×936.
// MVP scope: covers the most common change requests — identity, membership
// category, name, DOB, marital status, address/contacts, "others". Sections 6
// (Employment) and 7 (Heirs) are intentionally omitted in this release.
const pagibigPff049: FormSchema = {
  slug: 'pagibig-pff-049',
  code: 'HQP-PFF-049',
  version: 'V12 (12/2025)',
  name: "Member's Change of Information Form (MCIF)",
  agency: 'Pag-IBIG Fund',
  category: 'Membership',
  pdfPath: 'Pagibig - PFF049_MembersChangeInformationForm.pdf',
  description:
    "Update your Pag-IBIG records — name, marital status, date of birth, address, and contact details. Only fill in the sections that apply to your change request.",
  steps: [
    { label: 'Identification', fieldIds: ['mid_no', 'housing_account_no', 'loyalty_card_holder', 'loyalty_partner_bank', 'current_last_name', 'current_first_name', 'current_ext_name', 'current_middle_name'] },
    { label: 'Name / Category / DOB', fieldIds: ['category_from', 'category_to', 'name_from_last', 'name_from_first', 'name_from_ext', 'name_from_middle', 'name_to_last', 'name_to_first', 'name_to_ext', 'name_to_middle', 'dob_from', 'dob_to'] },
    { label: 'Marital Status', fieldIds: ['marital_from', 'marital_to', 'spouse_last_name', 'spouse_first_name', 'spouse_ext_name', 'spouse_middle_name'] },
    { label: 'Address & Contact', fieldIds: ['new_address_line', 'new_barangay', 'new_city', 'new_province', 'new_zip', 'new_cell_phone', 'new_email', 'preferred_mailing'] },
    { label: 'Others & Signature', fieldIds: ['others_from', 'others_to', 'signature_date'] },
  ],
  fields: [
    // ── Step 1: Identification ──
    { id: 'mid_no', label: 'Pag-IBIG MID No.', type: 'text', required: true,
      placeholder: '0000-0000-0000', hint: 'Your 12-digit Pag-IBIG MID', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'housing_account_no', label: 'Housing Account No. (if applicable)', type: 'text', required: false,
      placeholder: 'Leave blank if not applicable', maxLength: 24, step: 1 },
    { id: 'loyalty_card_holder', label: 'Pag-IBIG Loyalty Card Holder?', type: 'dropdown', required: true,
      options: ['No', 'Yes'], step: 1 },
    { id: 'loyalty_partner_bank', label: 'Loyalty Card Issuing Partner-Bank/s', type: 'text', required: false,
      placeholder: 'e.g., UnionBank', hint: 'Only if Loyalty Card = Yes', maxLength: 60, step: 1 },
    { id: 'current_last_name', label: 'Current Last Name', type: 'text', required: true,
      placeholder: 'DELA CRUZ', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'current_first_name', label: 'Current First Name', type: 'text', required: true,
      placeholder: 'JUAN', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'current_ext_name', label: 'Current Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 1 },
    { id: 'current_middle_name', label: 'Current Middle Name', type: 'text', required: false,
      placeholder: 'SANTOS', autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 1 },

    // ── Step 2: Category / Name / DOB Changes ──
    { id: 'category_from', label: 'Membership Category — FROM', type: 'text', required: false,
      placeholder: 'e.g., Employed Local', hint: 'Leave both blank if no category change', step: 2 },
    { id: 'category_to', label: 'Membership Category — TO', type: 'text', required: false,
      placeholder: 'e.g., Self-Employed', step: 2 },
    { id: 'name_from_last', label: 'Name Change — FROM Last Name', type: 'text', required: false,
      autoUppercase: true, hint: 'Leave all Name fields blank if no name change', maxLength: 80, step: 2 },
    { id: 'name_from_first', label: 'Name Change — FROM First Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'name_from_ext', label: 'Name Change — FROM Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 2 },
    { id: 'name_from_middle', label: 'Name Change — FROM Middle Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 2 },
    { id: 'name_to_last', label: 'Name Change — TO Last Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'name_to_first', label: 'Name Change — TO First Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'name_to_ext', label: 'Name Change — TO Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 2 },
    { id: 'name_to_middle', label: 'Name Change — TO Middle Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 2 },
    { id: 'dob_from', label: 'DOB Correction — FROM (mm/dd/yyyy)', type: 'text', required: false,
      placeholder: '01/15/1985', hint: 'Only if correcting DOB', step: 2 },
    { id: 'dob_to', label: 'DOB Correction — TO (mm/dd/yyyy)', type: 'text', required: false,
      placeholder: '01/15/1986', step: 2 },

    // ── Step 3: Marital Status ──
    { id: 'marital_from', label: 'Marital Status — FROM', type: 'dropdown', required: false,
      options: ['N/A', 'Single', 'Married', 'Legally Separated', 'Annulled/Nullified', 'Widowed', 'Divorced'], step: 3 },
    { id: 'marital_to', label: 'Marital Status — TO', type: 'dropdown', required: false,
      options: ['N/A', 'Single', 'Married', 'Legally Separated', 'Annulled/Nullified', 'Widowed', 'Divorced'], step: 3 },
    { id: 'spouse_last_name', label: 'Spouse Last Name', type: 'text', required: false,
      autoUppercase: true, hint: 'Only if Married', maxLength: 80, step: 3 },
    { id: 'spouse_first_name', label: 'Spouse First Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, step: 3 },
    { id: 'spouse_ext_name', label: 'Spouse Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 3 },
    { id: 'spouse_middle_name', label: 'Spouse Middle Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 3 },

    // ── Step 4: Address & Contact ──
    { id: 'new_address_line', label: 'New Address — Street / House / Unit', type: 'text', required: false,
      placeholder: 'Unit 4B, 123 Rizal Street, Brgy. San Jose',
      hint: 'Leave all address fields blank if no address change', maxLength: 150, autoUppercase: true, step: 4 },
    { id: 'new_barangay', label: 'New Barangay', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'new_city', label: 'New City / Municipality', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'new_province', label: 'New Province / State / Country', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'new_zip', label: 'New Zip Code', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, placeholder: '1100', step: 4 },
    { id: 'new_cell_phone', label: 'New Cell Phone', type: 'tel', required: false,
      placeholder: '09171234567', inputMode: 'tel', maxLength: 11, step: 4 },
    { id: 'new_email', label: 'New Email Address', type: 'email', required: false,
      placeholder: 'juan@example.com', inputMode: 'email', maxLength: 80, step: 4 },
    { id: 'preferred_mailing', label: 'Preferred Mailing Address', type: 'dropdown', required: false,
      options: ['N/A', 'Present Home Address', 'Permanent Home Address', 'Employer/Business Address'], step: 4 },

    // ── Step 5: Others & Signature ──
    { id: 'others_from', label: 'Other Update — FROM', type: 'text', required: false,
      placeholder: 'e.g., Place of Birth — Manila', hint: 'For Place of Birth / Mother\u2019s Maiden Name / Sex corrections', maxLength: 60, step: 5 },
    { id: 'others_to', label: 'Other Update — TO', type: 'text', required: false,
      placeholder: 'e.g., Place of Birth — Quezon City', maxLength: 60, step: 5 },
    { id: 'signature_date', label: 'Date Signed (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '04/15/2026', maxLength: 10, step: 5 },
  ],
};

// ─── Pag-IBIG SLF-089 (HELPs Application Form) ────────────────────────────────
const pagibigSlf089: FormSchema = {
  slug: 'pagibig-slf-089',
  code: 'HQP-SLF-089',
  version: 'V05 (05/2025)',
  name: 'Pag-IBIG HELPs Application Form',
  agency: 'Pag-IBIG Fund',
  category: 'Loans',
  pdfPath: 'PagIbig - SLF089_PagIBIGHELPsApplicationForm.pdf',
  description:
    'Apply for the Pag-IBIG Health and Education Loan Programs (HELPs). MVP fills the main applicant identification, address, employer, and loan details on page 1.',
  steps: [
    { label: 'Identification', fieldIds: ['mid_no', 'application_no', 'last_name', 'first_name', 'ext_name', 'middle_name', 'no_maiden_middle_name', 'dob', 'place_of_birth'] },
    { label: 'Personal Info', fieldIds: ['mothers_maiden_name', 'sex', 'marital_status', 'citizenship', 'nationality'] },
    { label: 'Permanent Address', fieldIds: ['perm_unit', 'perm_street', 'perm_cell_phone', 'perm_home_tel', 'perm_subdivision', 'perm_barangay', 'perm_city', 'perm_province', 'perm_zip', 'perm_email', 'perm_tin'] },
    { label: 'Present Address', fieldIds: ['pres_unit', 'pres_street', 'pres_employee_id', 'pres_nature_of_work', 'pres_subdivision', 'pres_barangay', 'pres_city', 'pres_province', 'pres_zip', 'pres_sss_gsis', 'pres_business_tel'] },
    { label: 'Employer / Loan', fieldIds: ['employer_name', 'date_of_employment', 'desired_loan_amount', 'loan_amount_type', 'employer_address_line', 'source_of_fund', 'employer_subdivision', 'employer_barangay', 'employer_city', 'employer_province', 'employer_zip', 'loan_purpose', 'beneficiary_last', 'beneficiary_first', 'beneficiary_ext', 'beneficiary_middle', 'student_id_no', 'loan_term', 'signature_date'] },
    { label: 'Previous Employment', fieldIds: ['prev_emp1_name', 'prev_emp1_address', 'prev_emp1_from', 'prev_emp1_to', 'prev_emp2_name', 'prev_emp2_address', 'prev_emp2_from', 'prev_emp2_to', 'prev_emp3_name', 'prev_emp3_address', 'prev_emp3_from', 'prev_emp3_to'] },
  ],
  fields: [
    // ── Step 1: Identification ──
    { id: 'mid_no', label: 'Pag-IBIG MID No.', type: 'text', required: true,
      placeholder: '0000-0000-0000', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'application_no', label: 'Application No. (leave blank for new)', type: 'text', required: false,
      placeholder: 'Office use', maxLength: 14, inputMode: 'numeric', step: 1 },
    { id: 'last_name', label: 'Last Name', type: 'text', required: true,
      placeholder: 'DELA CRUZ', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'first_name', label: 'First Name', type: 'text', required: true,
      placeholder: 'JUAN', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'ext_name', label: 'Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 1 },
    { id: 'middle_name', label: 'Middle Name', type: 'text', required: false,
      placeholder: 'SANTOS', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'no_maiden_middle_name', label: 'No Maiden Middle Name (married women)', type: 'text', required: false,
      placeholder: 'Maiden surname if applicable', autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 1 },
    { id: 'dob', label: 'Date of Birth (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '01/15/1990', maxLength: 10, step: 1 },
    { id: 'place_of_birth', label: 'Place of Birth', type: 'text', required: true,
      placeholder: 'QUEZON CITY', autoUppercase: true, maxLength: 60, step: 1 },

    // ── Step 2: Personal Info ──
    { id: 'mothers_maiden_name', label: "Complete Mother's Maiden Name", type: 'text', required: true,
      placeholder: 'MARIA REYES SANTOS', autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'sex', label: 'Sex', type: 'dropdown', required: true,
      options: ['Male', 'Female'], step: 2 },
    { id: 'marital_status', label: 'Marital Status', type: 'dropdown', required: true,
      options: ['Single/Unmarried', 'Married', 'Widower', 'Legally Separated', 'Annulled'], step: 2 },
    { id: 'citizenship', label: 'Citizenship', type: 'text', required: true,
      placeholder: 'Filipino', maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'nationality', label: 'Nationality', type: 'text', required: true,
      placeholder: 'Filipino', maxLength: 60, autoUppercase: true, step: 2 },

    // ── Step 3: Permanent Home Address ──
    { id: 'perm_unit', label: 'Unit/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: true,
      placeholder: 'Unit 4B, 123 Bldg, Block 5', maxLength: 50, step: 3 },
    { id: 'perm_street', label: 'Street Name', type: 'text', required: true,
      placeholder: 'Rizal Street', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_cell_phone', label: 'Cell Phone Number', type: 'tel', required: true,
      placeholder: '09171234567', inputMode: 'tel', maxLength: 11, step: 3 },
    { id: 'perm_home_tel', label: 'Home Telephone Number', type: 'tel', required: false,
      placeholder: '02-12345678', maxLength: 20, step: 3 },
    { id: 'perm_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_barangay', label: 'Barangay', type: 'text', required: true,
      placeholder: 'SAN JOSE', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: true,
      placeholder: 'QUEZON CITY', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: true,
      placeholder: 'METRO MANILA', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_zip', label: 'ZIP Code', type: 'text', required: true,
      placeholder: '1100', inputMode: 'numeric', maxLength: 4, step: 3 },
    { id: 'perm_email', label: 'Email Address', type: 'email', required: true,
      placeholder: 'juan@example.com', inputMode: 'email', maxLength: 80, step: 3 },
    { id: 'perm_tin', label: "Applicant's Taxpayer Identification Number (TIN)", type: 'text', required: true,
      placeholder: '123456789000', inputMode: 'numeric', maxLength: 12, step: 3 },

    // ── Step 4: Present Home Address ──
    { id: 'pres_unit', label: 'Unit/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: false,
      placeholder: 'Same as Permanent if blank', maxLength: 50, step: 4 },
    { id: 'pres_street', label: 'Street Name', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'pres_employee_id', label: 'Employee ID Number', type: 'text', required: false,
      placeholder: 'EMP-12345', maxLength: 24, step: 4 },
    { id: 'pres_nature_of_work', label: 'Nature of Work', type: 'text', required: true,
      placeholder: 'Software Engineer', step: 4 },
    { id: 'pres_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'pres_barangay', label: 'Barangay', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'pres_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'pres_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'pres_zip', label: 'ZIP Code', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 4 },
    { id: 'pres_sss_gsis', label: 'SSS / GSIS No.', type: 'text', required: false,
      placeholder: '12-3456789-0', maxLength: 14, inputMode: 'numeric', step: 4 },
    { id: 'pres_business_tel', label: 'Business Telephone Number', type: 'tel', required: false,
      placeholder: '02-12345678', maxLength: 20, step: 4 },

    // ── Step 5: Employer & Loan ──
    { id: 'employer_name', label: 'Employer / Business Name', type: 'text', required: true,
      placeholder: 'ACME Corp.', maxLength: 80, autoUppercase: true, step: 5 },
    { id: 'date_of_employment', label: 'Date of Employment (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '01/15/2020', maxLength: 10, step: 5 },
    { id: 'desired_loan_amount', label: 'Desired Loan Amount (PHP)', type: 'text', required: true,
      placeholder: '50000', inputMode: 'numeric', maxLength: 14, step: 5 },
    { id: 'loan_amount_type', label: 'Loan Amount Type', type: 'dropdown', required: true,
      options: ['Maximum Loan Amount', 'Others (specify in Desired Amount)'], step: 5 },
    { id: 'employer_address_line', label: "Employer Address — Unit/Bldg/Street", type: 'text', required: true,
      placeholder: '5th Floor ACME Bldg, Ayala Avenue', maxLength: 150, autoUppercase: true, step: 5 },
    { id: 'source_of_fund', label: 'Source of Fund', type: 'text', required: true,
      placeholder: 'Salary', maxLength: 60, step: 5 },
    { id: 'employer_subdivision', label: 'Employer Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_barangay', label: 'Employer Barangay', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_city', label: 'Employer City', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_province', label: 'Employer Province / Country', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_zip', label: 'Employer ZIP', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 5 },
    { id: 'loan_purpose', label: 'Loan Purpose', type: 'dropdown', required: true,
      options: ['Educational Expenses', 'Medical Expenses', 'Healthcare Plan from accredited HMO'], step: 5 },
    { id: 'beneficiary_last', label: "Beneficiary's Last Name", type: 'text', required: true,
      placeholder: 'DELA CRUZ', autoUppercase: true, maxLength: 80, step: 5 },
    { id: 'beneficiary_first', label: "Beneficiary's First Name", type: 'text', required: true,
      placeholder: 'MARIA', autoUppercase: true, maxLength: 80, step: 5 },
    { id: 'beneficiary_ext', label: "Beneficiary's Name Extension", type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 5 },
    { id: 'beneficiary_middle', label: "Beneficiary's Middle Name", type: 'text', required: false,
      autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 5 },
    { id: 'student_id_no', label: 'Student Number / Identification Number', type: 'text', required: false,
      placeholder: 'For educational loans only', maxLength: 24, step: 5 },
    { id: 'loan_term', label: 'Loan Term', type: 'dropdown', required: true,
      options: ['Six (6) Months', 'Twelve (12) Months', 'Twenty-four (24) Months', 'Thirty-six (36) Months'], step: 5 },
    { id: 'signature_date', label: 'Date Signed (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '04/23/2026', maxLength: 10, step: 5 },

    // ── Step 6: Previous Employment Details (3 rows, optional) ──
    { id: 'prev_emp1_name',    label: 'Prev. Employer #1 — Name',        type: 'text', required: false, maxLength: 80, step: 6 },
    { id: 'prev_emp1_address', label: 'Prev. Employer #1 — Address',     type: 'text', required: false, maxLength: 150, autoUppercase: true, step: 6 },
    { id: 'prev_emp1_from',    label: 'Prev. Employer #1 — From (mm/yy)', type: 'text', required: false, placeholder: '06/10', maxLength: 5, step: 6 },
    { id: 'prev_emp1_to',      label: 'Prev. Employer #1 — To (mm/yy)',   type: 'text', required: false, placeholder: '03/15', maxLength: 5, step: 6 },
    { id: 'prev_emp2_name',    label: 'Prev. Employer #2 — Name',        type: 'text', required: false, maxLength: 80, step: 6 },
    { id: 'prev_emp2_address', label: 'Prev. Employer #2 — Address',     type: 'text', required: false, maxLength: 150, autoUppercase: true, step: 6 },
    { id: 'prev_emp2_from',    label: 'Prev. Employer #2 — From (mm/yy)', type: 'text', required: false, maxLength: 5, step: 6 },
    { id: 'prev_emp2_to',      label: 'Prev. Employer #2 — To (mm/yy)',   type: 'text', required: false, maxLength: 5, step: 6 },
    { id: 'prev_emp3_name',    label: 'Prev. Employer #3 — Name',        type: 'text', required: false, maxLength: 80, step: 6 },
    { id: 'prev_emp3_address', label: 'Prev. Employer #3 — Address',     type: 'text', required: false, maxLength: 150, autoUppercase: true, step: 6 },
    { id: 'prev_emp3_from',    label: 'Prev. Employer #3 — From (mm/yy)', type: 'text', required: false, maxLength: 5, step: 6 },
    { id: 'prev_emp3_to',      label: 'Prev. Employer #3 — To (mm/yy)',   type: 'text', required: false, maxLength: 5, step: 6 },
  ],
};

// ─── Pag-IBIG SLF-065 (Multi-Purpose Loan Application) ───────────────────────
const pagibigSlf065: FormSchema = {
  slug: 'pagibig-slf-065',
  code: 'HQP-SLF-065',
  version: 'V10 (05/2025)',
  name: 'Pag-IBIG Multi-Purpose Loan Application Form',
  agency: 'Pag-IBIG Fund',
  category: 'Loans',
  pdfPath: 'Pagibig - SLF065_MultiPurposeLoanApplicationForm.pdf',
  description:
    'Apply for the Pag-IBIG Multi-Purpose Loan (MPL). MVP fills the main applicant identification, address, employer, and loan details on page 1.',
  // ── Smart Assistance: live eligibility + amortization (offline) ─────────
  smartAssistance: {
    amortization: {
      principalFieldId: 'desired_loan_amount',
      termFieldId: 'loan_term',
      annualRate: 0.055, // 5.5% p.a. — Pag-IBIG MPL standard, 2025-2026
      termMap: {
        'One (1) Year': 12,
        'Two (2) Years': 24,
        'Three (3) Years': 36,
      },
      label: 'Live Amortization (5.5% p.a.)',
    },
    eligibility: [
      { id: 'age',  label: 'Age \u2265 18 (from DOB)',                    rule: 'age-min',    fieldId: 'dob',                 min: 18 },
      { id: 'cont', label: '\u2265 24 months Pag-IBIG contributions',     rule: 'months-min', fieldId: 'date_of_employment',  min: 24 },
      { id: 'cap',  label: 'Loan amount \u2264 \u20b1680,000 cap',        rule: 'amount-max', fieldId: 'desired_loan_amount', max: 680000 },
      { id: 'mid',  label: 'MID No. is 12 digits',                        rule: 'digits-eq',  fieldId: 'mid_no',              count: 12 },
      { id: 'tin',  label: 'TIN is 12 digits',                            rule: 'digits-eq',  fieldId: 'perm_tin',            count: 12 },
      { id: 'eml',  label: 'Email format valid',                          rule: 'email',      fieldId: 'email' },
    ],
  },
  steps: [
    { label: 'Identification', fieldIds: ['mid_no', 'application_no', 'last_name', 'first_name', 'ext_name', 'middle_name', 'no_maiden_middle_name', 'dob', 'place_of_birth'] },
    { label: 'Personal Info', fieldIds: ['mothers_maiden_name', 'nationality', 'sex', 'marital_status', 'citizenship', 'email'] },
    { label: 'Permanent Address', fieldIds: ['perm_unit', 'perm_cell_phone', 'perm_home_tel', 'perm_street', 'perm_subdivision', 'perm_barangay', 'perm_city', 'perm_province', 'perm_zip', 'perm_tin', 'perm_sss_gsis'] },
    { label: 'Present Address', fieldIds: ['same_as_permanent', 'pres_unit', 'pres_business_tel', 'pres_nature_of_work', 'pres_street', 'pres_subdivision', 'pres_barangay', 'pres_city', 'pres_province', 'pres_zip', 'loan_term', 'desired_loan_amount'] },
    { label: 'Employer / Loan', fieldIds: ['employer_name', 'loan_purpose', 'employer_address_line', 'employer_subdivision', 'employer_barangay', 'employer_city', 'employer_province', 'employer_zip', 'employee_id_no', 'date_of_employment', 'source_of_fund', 'payroll_bank_name', 'source_of_referral', 'signature_date'] },
  ],
  fields: [
    // ── Step 1: Identification ──
    { id: 'mid_no', label: 'Pag-IBIG MID No.', type: 'text', required: true,
      placeholder: 'XXXX-XXXX-XXXX', inputMode: 'numeric', maxLength: 14, mask: 'mid', step: 1,
      warnPattern: '^\\d{4}-\\d{4}-\\d{4}$', warnMessage: 'MID No. should be 12 digits (XXXX-XXXX-XXXX).' },
    { id: 'application_no', label: 'Application No. (leave blank for new)', type: 'text', required: false,
      placeholder: 'Office use', maxLength: 14, inputMode: 'numeric', step: 1 },
    { id: 'last_name', label: 'Last Name', type: 'text', required: true,
      placeholder: 'DELA CRUZ', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'first_name', label: 'First Name', type: 'text', required: true,
      placeholder: 'JUAN', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'ext_name', label: 'Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 1 },
    { id: 'middle_name', label: 'Middle Name', type: 'text', required: false,
      placeholder: 'SANTOS', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'no_maiden_middle_name', label: 'Maiden Middle Name (married women)', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: true,
      placeholder: 'mm / dd / yyyy', step: 1,
      hint: 'You must be 18+ years old to qualify (Pag-IBIG MPL eligibility rule).' },
    { id: 'place_of_birth', label: 'Place of Birth', type: 'text', required: true,
      placeholder: 'QUEZON CITY', autoUppercase: true, maxLength: 60, step: 1 },

    // ── Step 2: Personal ──
    { id: 'mothers_maiden_name', label: "Complete Mother's Maiden Name", type: 'text', required: true,
      placeholder: 'MARIA REYES SANTOS', autoUppercase: true, maxLength: 80, step: 2 },
    { id: 'nationality', label: 'Nationality', type: 'text', required: true,
      placeholder: 'Filipino', maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'sex', label: 'Sex', type: 'dropdown', required: true,
      options: ['Male', 'Female'], step: 2 },
    { id: 'marital_status', label: 'Marital Status', type: 'dropdown', required: true,
      options: ['Single/Unmarried', 'Married', 'Widow/er', 'Legally Separated', 'Annulled'], step: 2 },
    { id: 'citizenship', label: 'Citizenship', type: 'text', required: true,
      placeholder: 'Filipino', maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'email', label: 'Email Address', type: 'email', required: true,
      placeholder: 'juan@example.com', inputMode: 'email', maxLength: 80, step: 2,
      hint: 'Pag-IBIG sends loan status updates to this email.' },

    // ── Step 3: Permanent Address ──
    { id: 'perm_unit', label: 'Unit/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: true,
      placeholder: 'Unit 4B, 123 Bldg, Block 5', maxLength: 50, step: 3 },
    { id: 'perm_cell_phone', label: 'Cell Phone Number', type: 'tel', required: true,
      placeholder: '0917 123 4567', inputMode: 'tel', maxLength: 13, mask: 'mobile', step: 3,
      hint: 'PH mobile (auto-formats 09XX XXX XXXX).' },
    { id: 'perm_home_tel', label: 'Home Telephone Number', type: 'tel', required: false,
      placeholder: '02-12345678', maxLength: 20, step: 3 },
    { id: 'perm_street', label: 'Street Name', type: 'text', required: true,
      placeholder: 'Rizal St', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_barangay', label: 'Barangay', type: 'text', required: true,
      placeholder: 'SAN JOSE', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: true,
      placeholder: 'QUEZON CITY', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: true,
      placeholder: 'METRO MANILA', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'perm_zip', label: 'ZIP Code', type: 'text', required: true,
      placeholder: '1100', inputMode: 'numeric', maxLength: 4, mask: 'zip', step: 3 },
    { id: 'perm_tin', label: "Applicant's Taxpayer Identification Number (TIN)", type: 'text', required: true,
      placeholder: 'XXX-XXX-XXX-XXX', inputMode: 'numeric', maxLength: 15, mask: 'tin', step: 3,
      hint: '12-digit BIR Tax Identification Number.',
      warnPattern: '^\\d{3}-\\d{3}-\\d{3}-\\d{3}$', warnMessage: 'TIN should be 12 digits (XXX-XXX-XXX-XXX).' },
    { id: 'perm_sss_gsis', label: 'SSS / GSIS No.', type: 'text', required: false,
      placeholder: '12-3456789-0', maxLength: 14, inputMode: 'numeric', step: 3 },

    // ── Step 4: Present Address & Loan Term ──
    { id: 'same_as_permanent', label: 'Same as Permanent Address', type: 'checkbox', required: false, step: 4,
      hint: 'When checked, mirrors your permanent address into the present-address fields below.' },
    { id: 'pres_unit', label: 'Unit/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: false,
      placeholder: 'Same as Permanent if blank', maxLength: 50, step: 4,
      mirrorFrom: 'perm_unit', mirrorGroup: 'same_as_permanent' },
    { id: 'pres_business_tel', label: 'Business Telephone Number', type: 'tel', required: false,
      placeholder: '02-12345678', maxLength: 20, step: 4 },
    { id: 'pres_nature_of_work', label: 'Nature of Work', type: 'text', required: true,
      placeholder: 'Software Engineer', step: 4 },
    { id: 'pres_street', label: 'Street Name', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4,
      mirrorFrom: 'perm_street', mirrorGroup: 'same_as_permanent' },
    { id: 'pres_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4,
      mirrorFrom: 'perm_subdivision', mirrorGroup: 'same_as_permanent' },
    { id: 'pres_barangay', label: 'Barangay', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4,
      mirrorFrom: 'perm_barangay', mirrorGroup: 'same_as_permanent' },
    { id: 'pres_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: false, maxLength: 60, autoUppercase: true, step: 4,
      mirrorFrom: 'perm_city', mirrorGroup: 'same_as_permanent' },
    { id: 'pres_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: false, maxLength: 60, autoUppercase: true, step: 4,
      mirrorFrom: 'perm_province', mirrorGroup: 'same_as_permanent' },
    { id: 'pres_zip', label: 'ZIP Code', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, mask: 'zip', step: 4,
      mirrorFrom: 'perm_zip', mirrorGroup: 'same_as_permanent' },
    { id: 'loan_term', label: 'Loan Term', type: 'dropdown', required: true,
      options: ['One (1) Year', 'Two (2) Years', 'Three (3) Years'], step: 4,
      hint: 'Repayment period — standard MPL: 1, 2, or 3 years. You may reapply for extension.',
      optionHints: {
        'One (1) Year':   '1-year term — fastest payoff, lowest total interest.',
        'Two (2) Years':  '2-year term — common balance of monthly load and total interest.',
        'Three (3) Years':'3-year term — lowest monthly payment, highest total interest.',
      } },
    { id: 'desired_loan_amount', label: 'Desired Loan Amount (PHP)', type: 'text', required: true,
      placeholder: '50,000', inputMode: 'numeric', maxLength: 14, mask: 'currency', step: 4,
      hint: 'Maximum: \u20b1680,000 (8\u00d7 monthly contribution OR 80% of TAV \u2014 whichever is lower).' },

    // ── Step 5: Employer & Loan ──
    { id: 'employer_name', label: 'Employer / Business Name', type: 'text', required: true,
      placeholder: 'ACME Corp.', maxLength: 80, autoUppercase: true, step: 5 },
    { id: 'loan_purpose', label: 'Loan Purpose', type: 'dropdown', required: true,
      options: PH_LOAN_PURPOSES_MPL,
      optionHints: PH_LOAN_PURPOSES_MPL_HINTS,
      hint: 'Choose from approved Pag-IBIG MPL purposes (10 options). Selecting one shows attachment guidance.',
      step: 5 },
    { id: 'employer_address_line', label: 'Employer Address — Unit/Bldg/Street', type: 'text', required: true,
      placeholder: '5th Floor ACME Bldg, Ayala Avenue', maxLength: 150, autoUppercase: true, step: 5 },
    { id: 'employer_subdivision', label: 'Employer Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_barangay', label: 'Employer Barangay', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_city', label: 'Employer City', type: 'autocomplete', optionsSource: 'ph_cities', required: true, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_province', label: 'Employer Province / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: true, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'employer_zip', label: 'Employer ZIP', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, mask: 'zip', step: 5 },
    { id: 'employee_id_no', label: 'Employee ID Number', type: 'text', required: false,
      placeholder: 'EMP-12345', step: 5 },
    { id: 'date_of_employment', label: 'Date of Employment', type: 'date', required: true,
      placeholder: 'mm / dd / yyyy', step: 5,
      hint: 'You must reflect \u226524 months of Pag-IBIG contributions to qualify for MPL.' },
    { id: 'source_of_fund', label: 'Source of Fund', type: 'autocomplete', required: true,
      optionsSource: 'ph_employment_sources',
      placeholder: 'Salary', maxLength: 60, step: 5,
      hint: 'Pick the closest match or type your own. Pag-IBIG categorizes for reporting.' },
    { id: 'payroll_bank_name', label: 'Payroll Account Bank / Branch', type: 'autocomplete', required: false,
      optionsSource: 'ph_banks',
      placeholder: 'BDO Unibank', step: 5,
      hint: 'For auto-deduction setup. Type to search PH banks (offline list).' },
    { id: 'signature_date', label: 'Date Signed', type: 'date', required: true,
      placeholder: 'mm / dd / yyyy', step: 5,
      hint: 'Auto-filled to today; site-wide format mm / dd / yyyy.' },
    { id: 'source_of_referral', label: 'How did you hear about Pag-IBIG?', type: 'dropdown', required: false,
      options: ['N/A', 'Pag-IBIG Fund Website', 'Social media', 'Radio', 'Television', 'Streaming Service Ad', 'Newspaper/Online Newspaper', 'Billboard', 'Word of Mouth', 'Referral', 'Employer/Fund Coordinator', 'Others'], step: 5 },
  ],
};

// ─── Pag-IBIG HLF-868 (HEAL Co-Borrower) ─────────────────────────────────────
// Shared industry/nature-of-business options for HLF family (Iteration 3)
const HLF_INDUSTRY_OPTIONS = [
  'N/A', 'Accounting', 'Activities of Private Households as Employers',
  'Agriculture, Hunting, Forestry & Fishing', 'Basic Materials',
  'Business Process Outsourcing (BPO)', 'Construction', 'Education & Training',
  'Electricity, Gas and Water Supply', 'Extra-Territorial Organization & Bodies',
  'Financial Services/Intermediation', 'HR/Recruitment', 'Health and Medical Services',
  'Health and Social Work', 'Life Sciences', 'Management', 'Manufacturing',
  'Media', 'Mining and Quarrying',
  'Other Community, Social & Personal Service Activities',
  'Public Administration & Defense', 'Social Security', 'Technology',
  'Transport, Storage and Communications', 'Travel and Leisure',
  'Wholesale & Retail Trade',
];

const pagibigHlf868: FormSchema = {
  slug: 'pagibig-hlf-868',
  code: 'HQP-HLF-868',
  version: 'V01 (07/2021)',
  name: 'Pag-IBIG HEAL Application — Co-Borrower',
  agency: 'Pag-IBIG Fund',
  category: 'Loans',
  pdfPath: 'PagIbig - HLF868_ApplicationHomeEquityAppreciationLoan(Co-borrower).pdf',
  description:
    'Application for Home Equity Appreciation Loan (HEAL) — Co-borrower section. MVP fills the co-borrower identification, address, and employer info on page 1.',
  steps: [
    { label: 'Identification', fieldIds: ['mid_no', 'housing_account_no', 'last_name', 'first_name', 'ext_name', 'middle_name', 'maiden_middle_name', 'dob', 'citizenship', 'proportionate_share', 'sex', 'marital_status', 'relationship_to_principal'] },
    { label: 'Permanent Address', fieldIds: ['perm_unit', 'perm_street', 'perm_subdivision', 'perm_barangay', 'perm_city', 'perm_province', 'perm_zip', 'perm_country_tel', 'perm_home_tel'] },
    { label: 'Present Address', fieldIds: ['pres_unit', 'pres_street', 'pres_subdivision', 'pres_barangay', 'pres_city', 'pres_province', 'pres_zip', 'pres_business_tel', 'pres_cellphone', 'email_address', 'years_stay_present', 'tin', 'sss_gsis', 'home_ownership', 'mailing_preference'] },
    { label: 'Employer', fieldIds: ['employment_type', 'industry_category', 'occupation', 'employer_name', 'employer_address_line', 'employer_subdivision', 'employer_barangay', 'employer_city', 'employer_province', 'employer_zip', 'employer_business_tel', 'employer_email', 'position_dept', 'preferred_time_contact', 'place_assignment', 'years_employment', 'no_dependents', 'signature_date'] },
  ],
  fields: [
    // Step 1: Identification
    { id: 'mid_no', label: 'Pag-IBIG MID Number', type: 'text', required: true,
      placeholder: '0000-0000-0000', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'housing_account_no', label: 'Housing Account No.', type: 'text', required: false,
      placeholder: 'Office use', maxLength: 14, step: 1 },
    { id: 'last_name', label: 'Last Name', type: 'text', required: true,
      placeholder: 'DELA CRUZ', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'first_name', label: 'First Name', type: 'text', required: true,
      placeholder: 'JUAN', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'ext_name', label: 'Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 1 },
    { id: 'middle_name', label: 'Middle Name', type: 'text', required: false,
      placeholder: 'SANTOS', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'maiden_middle_name', label: 'Maiden Middle Name (married women)', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 1 },
    { id: 'dob', label: 'Date of Birth (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '01/15/1990', maxLength: 10, step: 1 },
    { id: 'citizenship', label: 'Citizenship', type: 'text', required: true,
      placeholder: 'Filipino', maxLength: 60, autoUppercase: true, step: 1 },
    { id: 'proportionate_share', label: 'Desired Proportionate Share (%)', type: 'text', required: true,
      placeholder: '50', inputMode: 'numeric', maxLength: 5, step: 1 },
    { id: 'sex', label: 'Sex', type: 'dropdown', required: true,
      options: ['Male', 'Female'], step: 1 },
    { id: 'marital_status', label: 'Marital Status', type: 'dropdown', required: true,
      options: ['Single/Unmarried', 'Married', 'Legally Separated', 'Annulled/Nullified', 'Widow/er'], step: 1 },
    { id: 'relationship_to_principal', label: 'Relationship to Principal Borrower', type: 'dropdown', required: true,
      options: ['Spouse', 'Parent', 'Son/Daughter', 'Brother/Sister', 'Other'], step: 1 },

    // Step 2: Permanent Address
    { id: 'perm_unit', label: 'Unit/Room/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: true,
      placeholder: 'Unit 4B, 123 Bldg', maxLength: 50, step: 2 },
    { id: 'perm_street', label: 'Street Name', type: 'text', required: true,
      placeholder: 'Rizal St', maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_barangay', label: 'Barangay', type: 'text', required: true,
      placeholder: 'SAN JOSE', maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: true,
      placeholder: 'QUEZON CITY', maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: true,
      placeholder: 'METRO MANILA', maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_zip', label: 'ZIP Code', type: 'text', required: true,
      placeholder: '1100', inputMode: 'numeric', maxLength: 4, step: 2 },
    { id: 'perm_country_tel', label: 'Country + Area Code Telephone', type: 'text', required: false,
      placeholder: '63-2', step: 2 },
    { id: 'perm_home_tel', label: 'Home Telephone Number', type: 'tel', required: false,
      placeholder: '12345678', maxLength: 20, step: 2 },

    // Step 3: Present Address & Contacts
    { id: 'pres_unit', label: 'Unit/Room/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: false,
      placeholder: 'Same as Permanent if blank', maxLength: 50, step: 3 },
    { id: 'pres_street', label: 'Street Name', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_barangay', label: 'Barangay', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_zip', label: 'ZIP Code', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 3 },
    { id: 'pres_business_tel', label: 'Business Telephone Number', type: 'tel', required: false,
      placeholder: '02-12345678', maxLength: 20, step: 3 },
    { id: 'pres_cellphone', label: 'Cellphone Number (REQUIRED)', type: 'tel', required: true,
      placeholder: '09171234567', inputMode: 'tel', maxLength: 11, step: 3 },
    { id: 'email_address', label: 'Email Address (REQUIRED)', type: 'email', required: true,
      placeholder: 'juan@example.com', inputMode: 'email', maxLength: 150, step: 3 },
    { id: 'years_stay_present', label: 'Years of Stay in Present Home Address', type: 'text', required: false,
      placeholder: '5', inputMode: 'numeric', maxLength: 3, step: 3 },
    { id: 'tin', label: 'Taxpayer Identification No. (TIN)', type: 'text', required: true,
      placeholder: '123456789000', inputMode: 'numeric', maxLength: 12, step: 3 },
    { id: 'sss_gsis', label: 'SSS / GSIS ID Number', type: 'text', required: false,
      placeholder: '12-3456789-0', maxLength: 14, inputMode: 'numeric', step: 3 },

    // HLF-868 Step 3 checkbox fields (Iteration 2)
    { id: 'home_ownership', label: 'Home Ownership (Present)', type: 'dropdown', required: false,
      options: ['N/A', 'Owned', 'Mortgaged', 'Rented', 'Company-Provided', 'Living with relatives/parents'], step: 3 },
    { id: 'mailing_preference', label: 'Mailing Address Preference', type: 'dropdown', required: false,
      options: ['N/A', 'Permanent Home Address', 'Present Home Address', 'Employer/Business Address'], step: 3 },

    // Step 4: Employer
    { id: 'employment_type', label: 'Employment Type', type: 'dropdown', required: true,
      options: ['Locally Employed', 'Self-Employed', 'Overseas Filipino Worker'], step: 4 },
    { id: 'industry_category', label: 'Industry / Nature of Business', type: 'dropdown', required: false,
      options: HLF_INDUSTRY_OPTIONS, step: 4 },
    { id: 'occupation', label: 'Occupation', type: 'text', required: true,
      placeholder: 'Software Engineer', maxLength: 60, step: 4 },
    { id: 'employer_name', label: 'Employer / Business Name', type: 'text', required: true,
      placeholder: 'ACME Corp.', maxLength: 80, autoUppercase: true, step: 4 },
    { id: 'employer_address_line', label: 'Employer Address — Unit/Floor/Bldg/Street', type: 'text', required: true,
      placeholder: '5th Floor ACME Bldg, Ayala Avenue', maxLength: 150, autoUppercase: true, step: 4 },
    { id: 'employer_subdivision', label: 'Employer Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_barangay', label: 'Employer Barangay', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_city', label: 'Employer City', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_province', label: 'Employer Province / Country', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_zip', label: 'Employer ZIP', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 4 },
    { id: 'employer_business_tel', label: 'Business Telephone (Direct or Trunk Line)', type: 'tel', required: false,
      placeholder: '02-12345678', maxLength: 20, step: 4 },
    { id: 'employer_email', label: 'Employer / Business Email Address', type: 'email', required: false,
      placeholder: 'hr@acme.com', maxLength: 80, step: 4 },
    { id: 'position_dept', label: 'Position & Department', type: 'text', required: true,
      placeholder: 'Senior Engineer / IT', step: 4 },
    { id: 'preferred_time_contact', label: 'Preferred Time to be Contacted (Employer)', type: 'text', required: false,
      placeholder: 'Mon-Fri 9am-5pm', step: 4 },
    { id: 'place_assignment', label: 'Place of Assignment', type: 'text', required: false,
      placeholder: 'Makati Office', step: 4 },
    { id: 'years_employment', label: 'Years in Employment / Business', type: 'text', required: true,
      placeholder: '5', inputMode: 'numeric', maxLength: 3, step: 4 },
    { id: 'no_dependents', label: 'No. of Dependent/s', type: 'text', required: true,
      placeholder: '2', inputMode: 'numeric', maxLength: 3, step: 4 },
    { id: 'signature_date', label: 'Date Signed (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '04/23/2026', maxLength: 10, step: 4 },
  ],
};

// ─── Pag-IBIG HLF-858 (HEAL Principal) ───────────────────────────────────────
const pagibigHlf858: FormSchema = {
  slug: 'pagibig-hlf-858',
  code: 'HQP-HLF-858',
  version: 'V01 (07/2021)',
  name: 'Pag-IBIG HEAL Application — Principal Borrower',
  agency: 'Pag-IBIG Fund',
  category: 'Loans',
  pdfPath: 'PagIbig - HLF858_ApplicationHomeEquityAppreciationLoan.pdf',
  description:
    'Application for Home Equity Appreciation Loan (HEAL) — Principal borrower section. MVP fills the borrower identification, address, employer info on page 1 (loan particulars checkboxes deferred).',
  steps: [
    { label: 'Loan & Identification', fieldIds: ['mid_no', 'housing_account_no', 'desired_loan_amount', 'loan_purpose', 'loan_term', 'mode_of_payment', 'request_for_reinspection', 'last_name', 'first_name', 'ext_name', 'middle_name', 'maiden_middle_name', 'dob', 'citizenship', 'no_dependents', 'sex', 'marital_status'] },
    { label: 'Permanent Address', fieldIds: ['perm_unit', 'perm_street', 'perm_subdivision', 'perm_barangay', 'perm_city', 'perm_province', 'perm_zip', 'perm_country_tel', 'perm_home_tel', 'perm_business_tel'] },
    { label: 'Present Address', fieldIds: ['pres_unit', 'pres_street', 'pres_subdivision', 'pres_barangay', 'pres_city', 'pres_province', 'pres_zip', 'pres_cellphone', 'email_address', 'years_stay_present', 'home_ownership', 'mailing_preference'] },
    { label: 'Employer', fieldIds: ['employment_type', 'industry_category', 'occupation', 'tin', 'sss_gsis', 'employer_business_tel', 'employer_name', 'employer_address_line', 'employer_subdivision', 'employer_barangay', 'employer_city', 'employer_province', 'employer_zip', 'employer_email', 'position_dept', 'preferred_time_contact', 'place_assignment', 'years_employment', 'signature_date'] },
    { label: 'Spouse (if Married)', fieldIds: ['spouse_last_name', 'spouse_first_name', 'spouse_ext_name', 'spouse_middle_name', 'spouse_dob', 'spouse_citizenship', 'spouse_tin', 'spouse_occupation', 'spouse_employer_name', 'spouse_place_assignment', 'spouse_years_employment', 'spouse_employer_address_line', 'spouse_position_dept', 'spouse_employer_subdivision', 'spouse_employer_barangay', 'spouse_employer_city', 'spouse_employer_province', 'spouse_employer_zip', 'spouse_business_tel'] },
  ],
  fields: [
    { id: 'mid_no', label: 'Pag-IBIG MID Number', type: 'text', required: true,
      placeholder: '0000-0000-0000', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'housing_account_no', label: 'Housing Account No.', type: 'text', required: false,
      placeholder: 'Office use', maxLength: 14, step: 1 },
    { id: 'desired_loan_amount', label: 'Desired Loan Amount (PHP)', type: 'text', required: true,
      placeholder: '500000', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'loan_purpose', label: 'Loan Purpose', type: 'dropdown', required: true,
      options: [
        'Home Improvement',
        'Livelihood/additional capital for business',
        'Educational expenses',
        'Health and wellness',
        'Travel and leisure',
        'Special Events',
        'Car Repair',
        'Purchase of appliance/electronic gadgets',
        'Purchase of memorial lot or columbary',
        'Payment of utilities/credit card bills',
        'Others',
      ], step: 1 },
    { id: 'loan_term', label: 'Loan Term (years)', type: 'dropdown', required: true,
      options: ['1', '3', '5', '10', '15', '20', '25', '30'], step: 1 },
    { id: 'mode_of_payment', label: 'Mode of Payment', type: 'dropdown', required: true,
      options: [
        'Salary deduction',
        'Over-the-Counter',
        'Post-Dated Checks',
        'Cash/Check',
        'Collecting Agent',
        'Bank',
        'Credit to Disbursement Card',
        'Collection Partner',
        'Check Disbursement',
      ], step: 1 },
    { id: 'request_for_reinspection', label: 'Request for Re-inspection?', type: 'dropdown', required: false,
      options: ['N/A', 'Yes', 'No'], step: 1 },
    { id: 'last_name', label: 'Last Name', type: 'text', required: true,
      placeholder: 'DELA CRUZ', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'first_name', label: 'First Name', type: 'text', required: true,
      placeholder: 'JUAN', autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'ext_name', label: 'Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 1 },
    { id: 'middle_name', label: 'Middle Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, step: 1 },
    { id: 'maiden_middle_name', label: 'Maiden Middle Name (married women)', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 1 },
    { id: 'dob', label: 'Date of Birth (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '01/15/1990', maxLength: 10, step: 1 },
    { id: 'citizenship', label: 'Citizenship', type: 'text', required: true,
      placeholder: 'Filipino', maxLength: 60, autoUppercase: true, step: 1 },
    { id: 'no_dependents', label: 'No. of Dependent/s', type: 'text', required: true,
      placeholder: '2', inputMode: 'numeric', maxLength: 3, step: 1 },
    { id: 'sex', label: 'Sex', type: 'dropdown', required: true,
      options: ['Male', 'Female'], step: 1 },
    { id: 'marital_status', label: 'Marital Status', type: 'dropdown', required: true,
      options: ['Single/Unmarried', 'Married', 'Widow/er', 'Legally Separated', 'Annulled'], step: 1 },

    { id: 'perm_unit', label: 'Permanent — Unit/Room/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: true, maxLength: 50, step: 2 },
    { id: 'perm_street', label: 'Street Name', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_barangay', label: 'Barangay', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: true, maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: true, maxLength: 60, autoUppercase: true, step: 2 },
    { id: 'perm_zip', label: 'ZIP Code', type: 'text', required: true, inputMode: 'numeric', maxLength: 4, step: 2 },
    { id: 'perm_country_tel', label: 'Country + Area Code Telephone', type: 'text', required: false, placeholder: '63-2', step: 2 },
    { id: 'perm_home_tel', label: 'Home Telephone Number', type: 'tel', required: false, placeholder: '12345678', maxLength: 20, step: 2 },
    { id: 'perm_business_tel', label: 'Business Telephone Number (Permanent contact)', type: 'tel', required: false, maxLength: 20, step: 2 },

    { id: 'pres_unit', label: 'Present — Unit/Room/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: false, maxLength: 50, step: 3 },
    { id: 'pres_street', label: 'Street Name', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_barangay', label: 'Barangay', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: false, maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'pres_zip', label: 'ZIP Code', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 3 },
    { id: 'pres_cellphone', label: 'Cellphone Number', type: 'tel', required: true, placeholder: '09171234567', inputMode: 'tel', maxLength: 11, step: 3 },
    { id: 'email_address', label: 'Email Address', type: 'email', required: true, inputMode: 'email', maxLength: 150, step: 3 },
    { id: 'years_stay_present', label: 'Years of Stay in Present Home Address', type: 'text', required: false, inputMode: 'numeric', maxLength: 3, step: 3 },
    { id: 'home_ownership', label: 'Home Ownership (Present)', type: 'dropdown', required: false,
      options: ['N/A', 'Owned', 'Mortgaged', 'Rented', 'Company-Provided', 'Living with relatives/parents'], step: 3 },
    { id: 'mailing_preference', label: 'Mailing Address Preference', type: 'dropdown', required: false,
      options: ['N/A', 'Permanent Home Address', 'Present Home Address', 'Employer/Business Address'], step: 3 },

    { id: 'occupation', label: 'Occupation', type: 'text', required: true, maxLength: 60, step: 4 },
    { id: 'employment_type', label: 'Employment Type', type: 'dropdown', required: true,
      options: ['Locally Employed', 'Self-Employed', 'Overseas Filipino Worker'], step: 4 },
    { id: 'industry_category', label: 'Industry / Nature of Business', type: 'dropdown', required: false,
      options: HLF_INDUSTRY_OPTIONS, step: 4 },
    { id: 'tin', label: 'Taxpayer Identification No. (TIN)', type: 'text', required: true, inputMode: 'numeric', maxLength: 12, step: 4 },
    { id: 'sss_gsis', label: 'SSS / GSIS ID Number', type: 'text', required: false, maxLength: 14, inputMode: 'numeric', step: 4 },
    { id: 'employer_business_tel', label: 'Employer Business Telephone', type: 'tel', required: false, maxLength: 20, step: 4 },
    { id: 'employer_name', label: 'Employer / Business Name', type: 'text', required: true, maxLength: 80, autoUppercase: true, step: 4 },
    { id: 'employer_address_line', label: 'Employer Address — Unit/Floor/Bldg/Street', type: 'text', required: true, maxLength: 150, autoUppercase: true, step: 4 },
    { id: 'employer_subdivision', label: 'Employer Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_barangay', label: 'Employer Barangay', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_city', label: 'Employer City', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_province', label: 'Employer Province / Country', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'employer_zip', label: 'Employer ZIP', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 4 },
    { id: 'employer_email', label: 'Employer / Business Email', type: 'email', required: false, maxLength: 80, step: 4 },
    { id: 'position_dept', label: 'Position & Department', type: 'text', required: true, step: 4 },
    { id: 'preferred_time_contact', label: 'Preferred Time to be Contacted (Employer)', type: 'text', required: false, step: 4 },
    { id: 'place_assignment', label: 'Place of Assignment', type: 'text', required: false, step: 4 },
    { id: 'years_employment', label: 'Years in Employment / Business', type: 'text', required: true, inputMode: 'numeric', maxLength: 3, step: 4 },
    { id: 'signature_date', label: 'Date Signed (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '04/23/2026', maxLength: 10, step: 4 },

    // ── Step 5: Spouse's Personal Data (page 2) — populated when Married ─────
    { id: 'spouse_last_name', label: 'Spouse Last Name', type: 'text', required: false, autoUppercase: true, maxLength: 80, step: 5 },
    { id: 'spouse_first_name', label: 'Spouse First Name', type: 'text', required: false, autoUppercase: true, maxLength: 80, step: 5 },
    { id: 'spouse_ext_name', label: 'Spouse Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 5 },
    { id: 'spouse_middle_name', label: 'Spouse Middle Name', type: 'text', required: false, autoUppercase: true, maxLength: 80, inputMode: 'numeric', step: 5 },
    { id: 'spouse_dob', label: 'Spouse Date of Birth (mm/dd/yyyy)', type: 'text', required: false, maxLength: 10, step: 5 },
    { id: 'spouse_citizenship', label: 'Spouse Citizenship', type: 'text', required: false, step: 5 },
    { id: 'spouse_tin', label: 'Spouse TIN', type: 'text', required: false, inputMode: 'numeric', maxLength: 12, step: 5 },
    { id: 'spouse_occupation', label: 'Spouse Occupation', type: 'text', required: false, step: 5 },
    { id: 'spouse_employer_name', label: 'Spouse Employer/Business Name', type: 'text', required: false, maxLength: 80, autoUppercase: true, step: 5 },
    { id: 'spouse_place_assignment', label: 'Spouse Place of Assignment', type: 'text', required: false, step: 5 },
    { id: 'spouse_years_employment', label: 'Spouse Years in Employment', type: 'text', required: false, inputMode: 'numeric', maxLength: 3, step: 5 },
    { id: 'spouse_employer_address_line', label: 'Spouse Employer Address — Unit/Floor/Bldg/Street', type: 'text', required: false, maxLength: 150, autoUppercase: true, step: 5 },
    { id: 'spouse_position_dept', label: 'Spouse Position & Department', type: 'text', required: false, step: 5 },
    { id: 'spouse_employer_subdivision', label: 'Spouse Employer Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'spouse_employer_barangay', label: 'Spouse Employer Barangay', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'spouse_employer_city', label: 'Spouse Employer City', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'spouse_employer_province', label: 'Spouse Employer Province / Country', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'spouse_employer_zip', label: 'Spouse Employer ZIP', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 5 },
    { id: 'spouse_business_tel', label: 'Spouse Business Telephone', type: 'tel', required: false, maxLength: 20, step: 5 },
  ],
};

// ─── Pag-IBIG HLF-068 (Housing Loan Application) ─────────────────────────────
const pagibigHlf068: FormSchema = {
  slug: 'pagibig-hlf-068',
  code: 'HQP-HLF-068',
  version: 'V01 (07/2021)',
  name: 'Pag-IBIG Housing Loan Application',
  agency: 'Pag-IBIG Fund',
  category: 'Loans',
  pdfPath: 'PagIbig - HLF068_HousingLoanApplication.pdf',
  description:
    'Apply for a Pag-IBIG Housing Loan. Iteration 2 adds LOAN PARTICULARS (purpose, term, mode of payment), PROPERTY DETAILS (type, mortgage status, offsite collateral), and BORROWER personal attributes (sex, marital status, home ownership, employment type) to the MVP. Spouse/co-borrower sections and property TCT/Tax-Dec details deferred to iteration 3.',
  steps: [
    { label: 'Loan Particulars', fieldIds: ['mid_no', 'housing_account_no', 'desired_loan_amount', 'existing_housing_application', 'loan_purpose', 'loan_term', 'mode_of_payment'] },
    { label: 'Property Details', fieldIds: ['property_type', 'property_mortgaged', 'offsite_collateral'] },
    { label: 'Identification', fieldIds: ['last_name', 'first_name', 'ext_name', 'middle_name', 'citizenship', 'dob', 'sex', 'marital_status'] },
    { label: 'Permanent Address', fieldIds: ['perm_unit', 'perm_street', 'perm_subdivision', 'perm_barangay', 'perm_city', 'perm_province', 'perm_zip'] },
    { label: 'Present Address & Contacts', fieldIds: ['pres_unit', 'pres_street', 'pres_subdivision', 'pres_barangay', 'pres_city', 'pres_province', 'pres_zip', 'pres_cellphone', 'email_address', 'years_stay_present', 'sss_gsis', 'home_ownership'] },
    { label: 'Employer', fieldIds: ['employment_type', 'employer_name', 'tin', 'employer_address_line', 'occupation', 'employer_subdivision', 'employer_barangay', 'employer_city', 'employer_province', 'employer_zip', 'position_dept', 'years_employment', 'signature_date'] },
  ],
  fields: [
    { id: 'mid_no', label: 'Pag-IBIG MID Number / RTN', type: 'text', required: true,
      placeholder: '0000-0000-0000', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'housing_account_no', label: 'Housing Account Number (HAN), if existing', type: 'text', required: false,
      placeholder: 'Office use', maxLength: 14, step: 1 },
    { id: 'desired_loan_amount', label: 'Desired Loan Amount (PHP)', type: 'text', required: true,
      placeholder: '1500000', inputMode: 'numeric', maxLength: 14, step: 1 },
    { id: 'existing_housing_application', label: 'With Existing Housing Application?', type: 'dropdown', required: false,
      options: ['N/A', 'Yes', 'No'], step: 1 },
    { id: 'loan_purpose', label: 'Purpose of Loan', type: 'dropdown', required: true,
      options: [
        'Purchase of fully developed residential lot',
        'Purchase of a residential house and lot/townhouse',
        'Construction or completion of a residential unit',
        'Home improvement',
        'Refinancing of an existing housing loan',
        'Purchase of a parking slot',
        'Purchase of residential lot plus cost of transfer',
        'Purchase of residential unit plus cost of transfer',
      ], step: 1 },
    { id: 'loan_term', label: 'Desired Loan Term (years)', type: 'dropdown', required: true,
      options: ['1', '3', '5', '10', '15', '20', '25', '30'], step: 1 },
    { id: 'mode_of_payment', label: 'Mode of Payment', type: 'dropdown', required: true,
      options: [
        'Salary deduction', 'Over-the-Counter', 'Post-Dated Checks', 'Cash/Check',
        'Collecting Agent', 'Bank', 'Developer', 'Remittance Center',
      ], step: 1 },

    { id: 'property_type', label: 'Type of Property', type: 'dropdown', required: false,
      options: ['N/A', 'Rowhouse', 'Single Detached', 'Townhouse', 'Single Attached', 'Condominium', 'Duplex'], step: 2 },
    { id: 'property_mortgaged', label: 'Is Property Presently Mortgaged?', type: 'dropdown', required: false,
      options: ['N/A', 'Yes', 'No'], step: 2 },
    { id: 'offsite_collateral', label: 'Is Property an Offsite Collateral?', type: 'dropdown', required: false,
      options: ['N/A', 'Yes', 'No'], step: 2 },

    { id: 'last_name', label: 'Last Name', type: 'text', required: true,
      placeholder: 'DELA CRUZ', autoUppercase: true, maxLength: 80, step: 3 },
    { id: 'first_name', label: 'First Name', type: 'text', required: true,
      placeholder: 'JUAN', autoUppercase: true, maxLength: 80, step: 3 },
    { id: 'ext_name', label: 'Name Extension', type: 'dropdown', required: false,
      options: ['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV'], step: 3 },
    { id: 'middle_name', label: 'Middle Name', type: 'text', required: false,
      autoUppercase: true, maxLength: 80, step: 3 },
    { id: 'citizenship', label: 'Citizenship', type: 'text', required: true,
      placeholder: 'Filipino', maxLength: 60, autoUppercase: true, step: 3 },
    { id: 'dob', label: 'Date of Birth (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '01/15/1990', maxLength: 10, step: 3 },
    { id: 'sex', label: 'Sex', type: 'dropdown', required: true,
      options: ['Male', 'Female'], step: 3 },
    { id: 'marital_status', label: 'Marital Status', type: 'dropdown', required: true,
      options: ['Single', 'Married', 'Legally Separated', 'Annulled', 'Widow/er'], step: 3 },

    { id: 'perm_unit', label: 'Permanent — Unit/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: true, maxLength: 50, step: 4 },
    { id: 'perm_street', label: 'Street Name', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'perm_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'perm_barangay', label: 'Barangay', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'perm_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'perm_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: true, maxLength: 60, autoUppercase: true, step: 4 },
    { id: 'perm_zip', label: 'ZIP Code', type: 'text', required: true, inputMode: 'numeric', maxLength: 4, step: 4 },

    { id: 'pres_unit', label: 'Present — Unit/Floor/Building/Lot/Block/Phase/House No.', type: 'text', required: false, maxLength: 50, step: 5 },
    { id: 'pres_street', label: 'Street Name', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'pres_subdivision', label: 'Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'pres_barangay', label: 'Barangay', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'pres_city', label: 'Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'pres_province', label: 'Province / State / Country', type: 'autocomplete', optionsSource: 'ph_provinces', required: false, maxLength: 60, autoUppercase: true, step: 5 },
    { id: 'pres_zip', label: 'ZIP Code', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 5 },
    { id: 'pres_cellphone', label: 'Cellphone Number', type: 'tel', required: true,
      placeholder: '09171234567', inputMode: 'tel', maxLength: 11, step: 5 },
    { id: 'email_address', label: 'Email Address', type: 'email', required: true,
      inputMode: 'email', maxLength: 150, step: 5 },
    { id: 'years_stay_present', label: 'Years of Stay in Present Home Address', type: 'text', required: false,
      inputMode: 'numeric', maxLength: 3, step: 5 },
    { id: 'sss_gsis', label: 'SSS / GSIS ID Number', type: 'text', required: false,
      placeholder: '12-3456789-0', maxLength: 14, inputMode: 'numeric', step: 5 },
    { id: 'home_ownership', label: 'Home Ownership (Present)', type: 'dropdown', required: false,
      options: ['N/A', 'Owned', 'Mortgaged', 'Rented', 'Company-Provided', 'Living with relatives/parents'], step: 5 },

    { id: 'employment_type', label: 'Employment Type', type: 'dropdown', required: true,
      options: ['Employed', 'Self-Employed'], step: 6 },
    { id: 'employer_name', label: 'Employer / Business Name', type: 'text', required: true, maxLength: 80, autoUppercase: true, step: 6 },
    { id: 'tin', label: 'Taxpayer Identification No. (TIN)', type: 'text', required: true,
      inputMode: 'numeric', maxLength: 12, step: 6 },
    { id: 'employer_address_line', label: 'Employer Address — Unit/Floor/Bldg/Street', type: 'text', required: true, maxLength: 150, autoUppercase: true, step: 6 },
    { id: 'occupation', label: 'Occupation', type: 'text', required: true,
      placeholder: 'Software Engineer', maxLength: 60, step: 6 },
    { id: 'employer_subdivision', label: 'Employer Subdivision', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 6 },
    { id: 'employer_barangay', label: 'Employer Barangay', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 6 },
    { id: 'employer_city', label: 'Employer City', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 6 },
    { id: 'employer_province', label: 'Employer Province / Country', type: 'text', required: true, maxLength: 60, autoUppercase: true, step: 6 },
    { id: 'employer_zip', label: 'Employer ZIP', type: 'text', required: false, inputMode: 'numeric', maxLength: 4, step: 6 },
    { id: 'position_dept', label: 'Position & Department', type: 'text', required: true, step: 6 },
    { id: 'years_employment', label: 'Years in Employment / Business', type: 'text', required: true,
      inputMode: 'numeric', maxLength: 3, step: 6 },
    { id: 'signature_date', label: 'Date Signed (mm/dd/yyyy)', type: 'text', required: true,
      placeholder: '04/23/2026', maxLength: 10, step: 6 },
  ],
};

// ─── BIR 2316 — Certificate of Compensation Payment / Tax Withheld ──────────
const bir2316: FormSchema = {
  slug: 'bir-2316',
  code: 'BIR-2316',
  version: 'September 2021 (ENCS)',
  name: 'Certificate of Compensation Payment / Tax Withheld',
  agency: 'Bureau of Internal Revenue',
  category: 'Tax',
  pdfPath: 'BIR - 2316_CertificateOfCompensationPaymentTaxWithheld.pdf',
  description:
    'Annual certificate issued by employer showing total compensation paid and taxes withheld for each employee. Used for substituted filing or as attachment to BIR Form 1700.',
  steps: [
    {
      label: 'Period & Employee',
      fieldIds: [
        'year', 'period_from', 'period_to',
        'emp_tin_1', 'emp_tin_2', 'emp_tin_3', 'emp_tin_branch',
        'emp_name', 'emp_rdo',
        'emp_reg_address', 'emp_reg_zip',
        'emp_local_address', 'emp_local_zip',
        'emp_foreign_address',
        'emp_dob', 'emp_contact',
        'min_wage_per_day', 'min_wage_per_month',
      ],
    },
    {
      label: 'Present Employer',
      fieldIds: [
        'pres_emp_tin_1', 'pres_emp_tin_2', 'pres_emp_tin_3', 'pres_emp_tin_branch',
        'pres_emp_name', 'pres_emp_address', 'pres_emp_zip',
      ],
    },
    {
      label: 'Previous Employer (if any)',
      fieldIds: [
        'prev_emp_tin_1', 'prev_emp_tin_2', 'prev_emp_tin_3', 'prev_emp_tin_branch',
        'prev_emp_name', 'prev_emp_address', 'prev_emp_zip',
      ],
    },
    {
      label: 'Summary (Part IVA)',
      fieldIds: [
        'gross_compensation', 'less_non_taxable', 'taxable_present', 'taxable_previous',
        'gross_taxable', 'tax_due', 'taxes_withheld_present', 'taxes_withheld_previous',
        'total_withheld_adjusted', 'tax_credit_pera', 'total_taxes_withheld',
      ],
    },
    {
      label: 'Non-Taxable (Part IV-B A)',
      fieldIds: [
        'basic_salary_mwe', 'holiday_pay_mwe', 'overtime_pay_mwe', 'night_shift_mwe',
        'hazard_pay_mwe', 'thirteenth_month', 'de_minimis',
        'sss_gsis_phic_hdmf', 'salaries_other', 'total_non_taxable',
      ],
    },
    {
      label: 'Taxable & Supplementary (Part IV-B B)',
      fieldIds: [
        'basic_salary', 'representation', 'transportation', 'cola',
        'fixed_housing', 'others_a_label', 'others_a_amount', 'others_b_label', 'others_b_amount',
        'commission', 'profit_sharing', 'fees_director', 'taxable_13th_benefits',
        'supp_hazard', 'supp_overtime', 'others_supp_label',
        'others_51a_label', 'others_51a_amount', 'others_51b_label', 'others_51b_amount',
        'total_taxable_compensation',
      ],
    },
    {
      label: 'Signatures & Dates',
      fieldIds: [
        'present_emp_date_signed', 'employee_date_signed',
        'ctc_no', 'ctc_place', 'ctc_date_issued', 'ctc_amount',
      ],
    },
  ],
  fields: [
    // ── Step 1: Period & Employee ──
    { id: 'year', label: '1. For the Year (YYYY)', type: 'text', required: true, maxLength: 4, inputMode: 'numeric', placeholder: '2025', step: 1 },
    { id: 'period_from', label: '2. For the Period From (MM/DD)', type: 'text', required: true, maxLength: 5, placeholder: '01/01', step: 1 },
    { id: 'period_to', label: '2. For the Period To (MM/DD)', type: 'text', required: true, maxLength: 5, placeholder: '12/31', step: 1 },
    { id: 'emp_tin_1', label: '3. TIN — First 3 digits', type: 'text', required: true, maxLength: 3, inputMode: 'numeric', placeholder: '123', step: 1 },
    { id: 'emp_tin_2', label: '3. TIN — Next 3 digits', type: 'text', required: true, maxLength: 3, inputMode: 'numeric', placeholder: '456', step: 1 },
    { id: 'emp_tin_3', label: '3. TIN — Last 3 digits', type: 'text', required: true, maxLength: 3, inputMode: 'numeric', placeholder: '789', step: 1 },
    { id: 'emp_tin_branch', label: '3. TIN — Branch code', type: 'text', required: false, maxLength: 5, inputMode: 'numeric', placeholder: '00000', step: 1 },
    { id: 'emp_name', label: "4. Employee's Name (Last, First, Middle)", type: 'text', required: true, maxLength: 60, autoUppercase: true, placeholder: 'DELA CRUZ, JUAN PONCE', step: 1 },
    { id: 'emp_rdo', label: '5. RDO Code', type: 'text', required: true, maxLength: 3, inputMode: 'numeric', placeholder: '044', step: 1 },
    { id: 'emp_reg_address', label: '6. Registered Address', type: 'text', required: true, maxLength: 100, autoUppercase: true, step: 1 },
    { id: 'emp_reg_zip', label: '6A. ZIP Code', type: 'text', required: true, maxLength: 4, inputMode: 'numeric', step: 1 },
    { id: 'emp_local_address', label: '6B. Local Home Address', type: 'text', required: false, maxLength: 100, autoUppercase: true, step: 1 },
    { id: 'emp_local_zip', label: '6C. ZIP Code', type: 'text', required: false, maxLength: 4, inputMode: 'numeric', step: 1 },
    { id: 'emp_foreign_address', label: '6D. Foreign Address', type: 'text', required: false, maxLength: 120, autoUppercase: true, step: 1 },
    { id: 'emp_dob', label: '7. Date of Birth (MM/DD/YYYY)', type: 'text', required: true, maxLength: 10, placeholder: '06/15/1990', step: 1 },
    { id: 'emp_contact', label: '8. Contact Number', type: 'tel', required: true, maxLength: 15, placeholder: '0917-555-1234', step: 1 },
    { id: 'min_wage_per_day', label: '9. Statutory Minimum Wage rate per day', type: 'text', required: false, inputMode: 'numeric', maxLength: 12, step: 1 },
    { id: 'min_wage_per_month', label: '10. Statutory Minimum Wage rate per month', type: 'text', required: false, inputMode: 'numeric', maxLength: 12, step: 1 },
    // ── Step 2: Present Employer ──
    { id: 'pres_emp_tin_1', label: '12. TIN — First 3', type: 'text', required: true, maxLength: 3, inputMode: 'numeric', step: 2 },
    { id: 'pres_emp_tin_2', label: '12. TIN — Next 3', type: 'text', required: true, maxLength: 3, inputMode: 'numeric', step: 2 },
    { id: 'pres_emp_tin_3', label: '12. TIN — Last 3', type: 'text', required: true, maxLength: 3, inputMode: 'numeric', step: 2 },
    { id: 'pres_emp_tin_branch', label: '12. TIN — Branch', type: 'text', required: false, maxLength: 5, inputMode: 'numeric', step: 2 },
    { id: 'pres_emp_name', label: "13. Employer's Name", type: 'text', required: true, maxLength: 80, autoUppercase: true, step: 2 },
    { id: 'pres_emp_address', label: '14. Registered Address', type: 'text', required: true, maxLength: 100, autoUppercase: true, step: 2 },
    { id: 'pres_emp_zip', label: '14A. ZIP Code', type: 'text', required: true, maxLength: 4, inputMode: 'numeric', step: 2 },
    // ── Step 3: Previous Employer ──
    { id: 'prev_emp_tin_1', label: '16. TIN — First 3', type: 'text', required: false, maxLength: 3, inputMode: 'numeric', step: 3 },
    { id: 'prev_emp_tin_2', label: '16. TIN — Next 3', type: 'text', required: false, maxLength: 3, inputMode: 'numeric', step: 3 },
    { id: 'prev_emp_tin_3', label: '16. TIN — Last 3', type: 'text', required: false, maxLength: 3, inputMode: 'numeric', step: 3 },
    { id: 'prev_emp_tin_branch', label: '16. TIN — Branch', type: 'text', required: false, maxLength: 5, inputMode: 'numeric', step: 3 },
    { id: 'prev_emp_name', label: "17. Employer's Name", type: 'text', required: false, maxLength: 80, autoUppercase: true, step: 3 },
    { id: 'prev_emp_address', label: '18. Registered Address', type: 'text', required: false, maxLength: 100, autoUppercase: true, step: 3 },
    { id: 'prev_emp_zip', label: '18A. ZIP Code', type: 'text', required: false, maxLength: 4, inputMode: 'numeric', step: 3 },
    // ── Step 4: Summary (Part IVA) ──
    { id: 'gross_compensation', label: '19. Gross Compensation Income from Present Employer', type: 'text', required: true, inputMode: 'numeric', step: 4 },
    { id: 'less_non_taxable', label: '20. Less: Total Non-Taxable / Exempt Compensation', type: 'text', required: false, inputMode: 'numeric', step: 4 },
    { id: 'taxable_present', label: '21. Taxable Compensation from Present Employer', type: 'text', required: true, inputMode: 'numeric', step: 4 },
    { id: 'taxable_previous', label: '22. Add: Taxable from Previous Employer', type: 'text', required: false, inputMode: 'numeric', step: 4 },
    { id: 'gross_taxable', label: '23. Gross Taxable Compensation Income', type: 'text', required: true, inputMode: 'numeric', step: 4 },
    { id: 'tax_due', label: '24. Tax Due', type: 'text', required: true, inputMode: 'numeric', step: 4 },
    { id: 'taxes_withheld_present', label: '25A. Amount of Taxes Withheld — Present Employer', type: 'text', required: true, inputMode: 'numeric', step: 4 },
    { id: 'taxes_withheld_previous', label: '25B. Amount of Taxes Withheld — Previous Employer', type: 'text', required: false, inputMode: 'numeric', step: 4 },
    { id: 'total_withheld_adjusted', label: '26. Total Amount of Taxes Withheld as Adjusted', type: 'text', required: true, inputMode: 'numeric', step: 4 },
    { id: 'tax_credit_pera', label: '27. 5% Tax Credit (PERA Act of 2008)', type: 'text', required: false, inputMode: 'numeric', step: 4 },
    { id: 'total_taxes_withheld', label: '28. Total Taxes Withheld', type: 'text', required: true, inputMode: 'numeric', step: 4 },
    // ── Step 5: Non-Taxable ──
    { id: 'basic_salary_mwe', label: '29. Basic Salary (MWE / exempt up to P250K)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'holiday_pay_mwe', label: '30. Holiday Pay (MWE)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'overtime_pay_mwe', label: '31. Overtime Pay (MWE)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'night_shift_mwe', label: '32. Night Shift Differential (MWE)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'hazard_pay_mwe', label: '33. Hazard Pay (MWE)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'thirteenth_month', label: '34. 13th Month Pay & Other Benefits (max P90K)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'de_minimis', label: '35. De Minimis Benefits', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'sss_gsis_phic_hdmf', label: '36. SSS/GSIS/PHIC/HDMF & Union Dues (employee share)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'salaries_other', label: '37. Salaries & Other Forms of Compensation', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    { id: 'total_non_taxable', label: '38. Total Non-Taxable Compensation (sum 29-37)', type: 'text', required: false, inputMode: 'numeric', step: 5 },
    // ── Step 6: Taxable & Supplementary ──
    { id: 'basic_salary', label: '39. Basic Salary', type: 'text', required: true, inputMode: 'numeric', step: 6 },
    { id: 'representation', label: '40. Representation', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'transportation', label: '41. Transportation', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'cola', label: '42. Cost of Living Allowance (COLA)', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'fixed_housing', label: '43. Fixed Housing Allowance', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'others_a_label', label: '44A. Others (specify)', type: 'text', required: false, maxLength: 30, step: 6 },
    { id: 'others_a_amount', label: '44A. Amount', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'others_b_label', label: '44B. Others (specify)', type: 'text', required: false, maxLength: 30, step: 6 },
    { id: 'others_b_amount', label: '44B. Amount', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'commission', label: '45. Commission', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'profit_sharing', label: '46. Profit Sharing', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'fees_director', label: "47. Fees Including Director's Fees", type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'taxable_13th_benefits', label: '48. Taxable 13th Month Benefits', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'supp_hazard', label: '49. Hazard Pay', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'supp_overtime', label: '50. Overtime Pay', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'others_supp_label', label: '51. Others (specify)', type: 'text', required: false, maxLength: 30, step: 6 },
    { id: 'others_51a_label', label: '51A. Others label', type: 'text', required: false, maxLength: 30, step: 6 },
    { id: 'others_51a_amount', label: '51A. Amount', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'others_51b_label', label: '51B. Others label', type: 'text', required: false, maxLength: 30, step: 6 },
    { id: 'others_51b_amount', label: '51B. Amount', type: 'text', required: false, inputMode: 'numeric', step: 6 },
    { id: 'total_taxable_compensation', label: '52. Total Taxable Compensation (sum 39-51B)', type: 'text', required: true, inputMode: 'numeric', step: 6 },
    // ── Step 7: Signatures & Dates ──
    { id: 'present_emp_date_signed', label: '53. Date Signed — Present Employer (MM/DD/YYYY)', type: 'text', required: true, maxLength: 10, placeholder: '04/15/2026', step: 7 },
    { id: 'employee_date_signed', label: '54. Date Signed — Employee (MM/DD/YYYY)', type: 'text', required: true, maxLength: 10, step: 7 },
    { id: 'ctc_no', label: 'CTC / Valid ID No. of Employee', type: 'text', required: false, maxLength: 24, step: 7 },
    { id: 'ctc_place', label: 'Place of Issue', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 7 },
    { id: 'ctc_date_issued', label: 'Date Issued (MM/DD/YYYY)', type: 'text', required: false, maxLength: 10, step: 7 },
    { id: 'ctc_amount', label: 'Amount paid, if CTC', type: 'text', required: false, inputMode: 'numeric', maxLength: 10, step: 7 },
  ],
};

// ─── BIR 1904 — Application for Registration for One-Time Taxpayer and Persons Registering under EO 98 ──
// NOTE (Session 2 intake, 2026-04-25): Schema only (Gate 3). Coord map (Gate 4+) NOT
// implemented yet — see docs/bir-intake-scaffolding/bir-1904-fields.md and the corrected
// colour-convention addendum in QuickFormsPH-PDFGenerationLearnings.md. This form is NOT
// wired into pdf-generator.ts's FORM_PDF_CONFIGS, so PDF generation will fail until
// Session 3 implements BIR1904_FIELD_COORDS + BIR1904_SKIP_VALUES + BIR1904_CHECKBOX_COORDS.
const bir1904: FormSchema = {
  slug: 'bir-1904',
  code: 'BIR-1904',
  version: 'October 2025 (ENCS)',
  name: 'Application for Registration — One-Time Taxpayer & Persons Registering under E.O. 98',
  agency: 'Bureau of Internal Revenue',
  category: 'Tax',
  pdfPath: 'BIR - 1904 October 2025 ENCS Final.pdf',
  description:
    'BIR 1904 is used by one-time taxpayers (capital gains, donor\'s tax, estate transfers) and individuals registering under Executive Order 98 (needing a TIN for government transactions). Covers Filipino citizens, foreign nationals, estates, and trusts.',
  steps: [
    {
      label: 'Taxpayer Type & Identity',
      fieldIds: [
        'date_of_registration', 'philsys_pcn', 'rdo_code',
        'taxpayer_type',
        'foreign_tin', 'country_of_residence',
        'last_name', 'first_name', 'middle_name', 'name_suffix', 'nickname',
        'registered_name', 'estate_trust_name',
      ],
    },
    {
      label: 'Birth & Local Address',
      fieldIds: [
        'date_of_birth', 'place_of_birth',
        'local_unit', 'local_building', 'local_lot', 'local_street',
        'local_subdivision', 'local_barangay', 'local_town',
        'local_city', 'local_province', 'local_zip',
      ],
    },
    {
      label: 'Foreign Address & Contact',
      fieldIds: [
        'foreign_address', 'municipality_code', 'date_of_arrival',
        'gender', 'civil_status',
        'contact_number', 'email',
      ],
    },
    {
      label: 'Parents & ID',
      fieldIds: [
        'mothers_name', 'fathers_name',
        'id_type', 'id_number', 'id_effectivity', 'id_expiry',
      ],
    },
    {
      label: 'Spouse (if married)',
      fieldIds: [
        'spouse_employment_status', 'spouse_name',
        'spouse_tin', 'spouse_employer_name', 'spouse_employer_tin',
      ],
    },
    {
      label: 'Purpose of TIN Application',
      fieldIds: ['purpose_of_tin', 'purpose_other_specify'],
    },
    {
      label: 'Withholding Agent (if applicable)',
      fieldIds: [
        'wa_tin', 'wa_rdo_code', 'wa_name',
        'wa_address', 'wa_zip', 'wa_contact', 'wa_email',
        'wa_title',
      ],
    },
  ],
  fields: [
    // ── Step 1: Taxpayer Type & Identity ──
    { id: 'date_of_registration', label: '1. Date of Registration (MM/DD/YYYY) — BIR-only', type: 'text', required: false, maxLength: 10, placeholder: '01/01/2026', hint: 'To be filled out by BIR', step: 1 },
    { id: 'philsys_pcn', label: '2. PhilSys Card Number (PCN) — 16 digits', type: 'text', required: false, maxLength: 16, inputMode: 'numeric', placeholder: '1234567890123456', step: 1 },
    { id: 'rdo_code', label: '3. RDO Code (3 digits) — BIR-only', type: 'text', required: false, maxLength: 3, inputMode: 'numeric', hint: 'To be filled out by BIR', step: 1 },
    { id: 'taxpayer_type', label: '4. Taxpayer Type', type: 'dropdown', required: true,
      options: [
        'E.O. 98 — Filipino Citizen',
        'E.O. 98 — Foreign National',
        'One-Time Taxpayer — Filipino Citizen',
        'One-Time Taxpayer — Foreign National',
        'Persons Registering under Passive Income (excluding dividends/interest)',
        'Estate / Trust',
      ],
      step: 1,
    },
    { id: 'foreign_tin', label: '5. Foreign TIN (if applicable)', type: 'text', required: false, maxLength: 30, inputMode: 'numeric', step: 1 },
    { id: 'country_of_residence', label: '6. Country of Residence (if foreign national)', type: 'autocomplete', optionsSource: 'countries', required: false, maxLength: 40, autoUppercase: true, step: 1 },
    { id: 'last_name', label: '7A. Last Name (if Individual)', type: 'text', required: false, maxLength: 40, autoUppercase: true, placeholder: 'DELA CRUZ', step: 1 },
    { id: 'first_name', label: '7A. First Name', type: 'text', required: false, maxLength: 30, autoUppercase: true, placeholder: 'JUAN', step: 1 },
    { id: 'middle_name', label: '7A. Middle Name', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 1 },
    { id: 'name_suffix', label: '7A. Suffix (Jr/Sr/III)', type: 'text', required: false, maxLength: 6, step: 1 },
    { id: 'nickname', label: '7A. Nickname', type: 'text', required: false, maxLength: 20, step: 1 },
    { id: 'registered_name', label: '7B. Registered Name (if Non-Individual)', type: 'text', required: false, maxLength: 80, autoUppercase: true, hint: 'For non-individual taxpayers only', step: 1 },
    { id: 'estate_trust_name', label: '7C. If ESTATE, ESTATE of ____ / If TRUST, FAO: ____', type: 'text', required: false, maxLength: 80, autoUppercase: true, step: 1 },

    // ── Step 2: Birth & Local Address ──
    { id: 'date_of_birth', label: '8. Date of Birth / Organization (MM/DD/YYYY)', type: 'text', required: true, maxLength: 10, placeholder: '06/15/1990', step: 2 },
    { id: 'place_of_birth', label: '9. Place of Birth', type: 'text', required: true, maxLength: 40, autoUppercase: true, step: 2 },
    { id: 'local_unit', label: '10. Unit / Room / Floor / Building No.', type: 'text', required: false, maxLength: 20, step: 2 },
    { id: 'local_building', label: '10. Building Name / Tower', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 2 },
    { id: 'local_lot', label: '10. Lot / Block / Phase / House No.', type: 'text', required: false, maxLength: 20, autoUppercase: true, step: 2 },
    { id: 'local_street', label: '10. Street Name', type: 'text', required: true, maxLength: 40, autoUppercase: true, step: 2 },
    { id: 'local_subdivision', label: '10. Subdivision / Village / Zone', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 2 },
    { id: 'local_barangay', label: '10. Barangay', type: 'text', required: true, maxLength: 30, autoUppercase: true, step: 2 },
    { id: 'local_town', label: '10. Town / District', type: 'autocomplete', optionsSource: 'ph_cities', required: false, maxLength: 30, autoUppercase: true, step: 2 },
    { id: 'local_city', label: '10. Municipality / City', type: 'autocomplete', optionsSource: 'ph_cities', required: true, maxLength: 30, autoUppercase: true, step: 2 },
    { id: 'local_province', label: '10. Province', type: 'autocomplete', optionsSource: 'ph_provinces', required: true, maxLength: 30, autoUppercase: true, step: 2 },
    { id: 'local_zip', label: '10. ZIP Code (4 digits)', type: 'text', required: true, maxLength: 4, inputMode: 'numeric', placeholder: '1100', step: 2 },

    // ── Step 3: Foreign Address & Contact ──
    { id: 'foreign_address', label: '11. Principal Foreign Address (foreign nationals only)', type: 'text', required: false, maxLength: 120, autoUppercase: true, step: 3 },
    { id: 'municipality_code', label: '12. Municipality Code (5 digits) — BIR-only', type: 'text', required: false, maxLength: 5, inputMode: 'numeric', hint: 'To be filled out by BIR', step: 3 },
    { id: 'date_of_arrival', label: '13. Date of Arrival in the Philippines (MM/DD/YYYY)', type: 'text', required: false, maxLength: 10, hint: 'Foreign nationals only', step: 3 },
    { id: 'gender', label: '14. Gender', type: 'dropdown', required: true, options: ['Male', 'Female'], step: 3 },
    { id: 'civil_status', label: '15. Civil Status', type: 'dropdown', required: true,
      options: ['Single', 'Married', 'Widow/er', 'Legally Separated'], step: 3 },
    { id: 'contact_number', label: '16. Contact Number (Landline / Mobile)', type: 'tel', required: true, maxLength: 20, placeholder: '0917-555-1234', step: 3 },
    { id: 'email', label: '17. Official Email Address', type: 'email', required: true, maxLength: 60, step: 3 },

    // ── Step 4: Parents & ID ──
    { id: 'mothers_name', label: "18. Mother's Maiden Name (First · Middle · Last · Suffix)", type: 'text', required: true, maxLength: 80, autoUppercase: true, step: 4 },
    { id: 'fathers_name', label: "19. Father's Name (First · Middle · Last · Suffix)", type: 'text', required: true, maxLength: 80, autoUppercase: true, step: 4 },
    { id: 'id_type', label: '20. Identification Type (e.g. Passport, UMID, Driver\'s License)', type: 'text', required: true, maxLength: 30, autoUppercase: true, step: 4 },
    { id: 'id_number', label: '20. ID Number', type: 'text', required: true, maxLength: 24, step: 4 },
    { id: 'id_effectivity', label: '20. ID Effectivity Date (MM/DD/YYYY)', type: 'text', required: false, maxLength: 10, step: 4 },
    { id: 'id_expiry', label: '20. ID Expiry Date (MM/DD/YYYY)', type: 'text', required: false, maxLength: 10, step: 4 },

    // ── Step 5: Spouse (conditional on civil_status = Married) ──
    { id: 'spouse_employment_status', label: '21. Employment Status of Spouse', type: 'dropdown', required: false,
      options: ['Unemployed', 'Employed in the Philippines', 'Employed Abroad', 'Engaged in Business'],
      hint: 'Required if civil status is Married', step: 5 },
    { id: 'spouse_name', label: '22. Spouse Name (Last · First · Middle · Suffix)', type: 'text', required: false, maxLength: 80, autoUppercase: true, step: 5 },
    { id: 'spouse_tin', label: '23. Spouse TIN — 12 digits (trailing 5 zeros are agency-reserved)', type: 'text', required: false, maxLength: 12, inputMode: 'numeric', warnPattern: '^\\d{7}00000$', warnMessage: 'Individual filers normally have 5 trailing zeros (e.g. 1234567 00000). Double-check the TIN.', step: 5 },
    { id: 'spouse_employer_name', label: "24. Spouse Employer's Name", type: 'text', required: false, maxLength: 80, autoUppercase: true, step: 5 },
    { id: 'spouse_employer_tin', label: "25. Spouse Employer's TIN — 12 digits", type: 'text', required: false, maxLength: 12, inputMode: 'numeric', step: 5 },

    // ── Step 6: Purpose of TIN Application ──
    { id: 'purpose_of_tin', label: '26. Purpose of TIN Application', type: 'dropdown', required: true,
      options: [
        'A. Dealings with banks, financial institutions, insurance companies',
        'B. Dealings with government offices (e.g. LTO, DFA, NBI)',
        'C. Tax treaty relief applications',
        'D. Shares of stock / bonds',
        'E. Real property — capital asset',
        'F. Real property — ordinary asset',
        'G. Donation of property',
        'H. Transfer by succession (estate)',
        'I. First-time jobseeker (RA 11261)',
        'J. Other (specify below)',
      ],
      step: 6,
    },
    { id: 'purpose_other_specify', label: '26-J. If Other, please specify', type: 'text', required: false, maxLength: 60, autoUppercase: true, step: 6 },

    // ── Step 7: Withholding Agent / Tax Agent (conditional) ──
    { id: 'wa_tin', label: '27. Withholding Agent / Tax Agent TIN — 12 digits', type: 'text', required: false, maxLength: 12, inputMode: 'numeric', step: 7 },
    { id: 'wa_rdo_code', label: '28. Withholding Agent RDO Code (3 digits)', type: 'text', required: false, maxLength: 3, inputMode: 'numeric', step: 7 },
    { id: 'wa_name', label: '29. Withholding Agent / Tax Agent Name', type: 'text', required: false, maxLength: 80, autoUppercase: true, step: 7 },
    { id: 'wa_address', label: '30. Withholding Agent Registered Address', type: 'text', required: false, maxLength: 120, autoUppercase: true, step: 7 },
    { id: 'wa_zip', label: '30A. ZIP Code (4 digits)', type: 'text', required: false, maxLength: 4, inputMode: 'numeric', step: 7 },
    { id: 'wa_contact', label: '31. Contact Number', type: 'tel', required: false, maxLength: 20, step: 7 },
    { id: 'wa_email', label: '32. Official Email Address', type: 'email', required: false, maxLength: 60, step: 7 },
    { id: 'wa_title', label: '33. Title / Position of Signatory', type: 'text', required: false, maxLength: 40, step: 7 },
  ],
};

// ─── BIR 1902 — Application for Registration For Individuals Earning Purely Compensation Income ──
// R10 MVP scaffold (April 2026): full schema + free-text coord overlay.
// Per-cell precision for 40-cell name/address rows DEFERRED to R10b — see learnings.
const bir1902: FormSchema = {
  slug: 'bir-1902',
  code: 'BIR-1902',
  version: 'October 2025 (ENCS)',
  name: 'Application for Registration For Individuals Earning Purely Compensation Income',
  agency: 'Bureau of Internal Revenue',
  category: 'Tax',
  pdfPath: 'BIR - 1902 October 2025 (ENCS) Final.pdf',
  description: 'BIR 1902 is filed by employees earning purely compensation income (local and resident-alien). Captures TIN application, identity, address, ID, contact, and spouse details.',
  steps: [
    { label: 'Identity & TIN', fieldIds: ['philsys_pcn', 'tin', 'taxpayer_type', 'last_name', 'first_name', 'middle_name', 'name_suffix', 'gender', 'civil_status', 'date_of_birth', 'place_of_birth'] },
    { label: 'Family & Citizenship', fieldIds: ['mothers_maiden_name', 'fathers_name', 'citizenship', 'other_citizenship'] },
    { label: 'Address', fieldIds: ['local_unit', 'local_building', 'local_lot', 'local_street', 'local_subdivision', 'local_barangay', 'local_town', 'local_city', 'local_province', 'local_zip', 'foreign_address'] },
    { label: 'ID & Contact', fieldIds: ['id_type', 'id_number', 'id_effectivity', 'id_expiry', 'id_issuer', 'id_place_issue', 'preferred_contact_type', 'contact_landline', 'contact_fax', 'contact_mobile', 'contact_email'] },
    { label: 'Spouse (if married)', fieldIds: ['spouse_employment_status', 'spouse_last_name', 'spouse_first_name', 'spouse_middle_name', 'spouse_suffix', 'spouse_tin', 'spouse_employer_name', 'spouse_employer_tin'] },
  ],
  fields: [
    // Step 1
    { id: 'philsys_pcn', label: '2. PhilSys Card Number (PCN) — 16 digits', type: 'text', required: false, maxLength: 16, inputMode: 'numeric', placeholder: '1234567890123456', step: 1 },
    { id: 'tin', label: '3. TIN — 12 digits (5 trailing 0s are agency-reserved)', type: 'text', required: true, maxLength: 12, inputMode: 'numeric', placeholder: '123456789012', warnPattern: '^\\d{7}00000$', warnMessage: 'Individual filers normally have 5 trailing zeros (e.g. 1234567 00000). Double-check your TIN.', step: 1 },
    { id: 'taxpayer_type', label: '5. Taxpayer Type', type: 'dropdown', required: true,
      options: ['Local Employee', 'Resident Alien', 'Special Non-Resident Alien'], step: 1 },
    { id: 'last_name', label: '6. Last Name', type: 'text', required: true, maxLength: 40, autoUppercase: true, step: 1 },
    { id: 'first_name', label: '6. First Name', type: 'text', required: true, maxLength: 40, autoUppercase: true, step: 1 },
    { id: 'middle_name', label: '6. Middle Name', type: 'text', required: false, maxLength: 40, autoUppercase: true, step: 1 },
    { id: 'name_suffix', label: '6. Suffix (Jr/Sr/III)', type: 'text', required: false, maxLength: 8, step: 1 },
    { id: 'gender', label: '7. Gender', type: 'dropdown', required: true, options: ['Male', 'Female'], step: 1 },
    { id: 'civil_status', label: '8. Civil Status', type: 'dropdown', required: true,
      options: ['Single', 'Married', 'Widow/er', 'Legally Separated'], step: 1 },
    { id: 'date_of_birth', label: '9. Date of Birth (MM/DD/YYYY)', type: 'text', required: true, maxLength: 10, placeholder: '01/15/1990', step: 1 },
    { id: 'place_of_birth', label: '10. Place of Birth', type: 'text', required: true, maxLength: 50, autoUppercase: true, step: 1 },

    // Step 2
    { id: 'mothers_maiden_name', label: "11. Mother's Maiden Name (First · Middle · Last · Suffix)", type: 'text', required: true, maxLength: 80, autoUppercase: true, step: 2 },
    { id: 'fathers_name', label: "12. Father's Name (First · Middle · Last · Suffix)", type: 'text', required: true, maxLength: 80, autoUppercase: true, step: 2 },
    { id: 'citizenship', label: '13. Citizenship', type: 'text', required: true, maxLength: 30, autoUppercase: true, placeholder: 'FILIPINO', step: 2 },
    { id: 'other_citizenship', label: '14. Other Citizenship (if applicable)', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 2 },

    // Step 3
    { id: 'local_unit', label: '15. Unit / Room / Floor', type: 'text', required: false, maxLength: 20, step: 3 },
    { id: 'local_building', label: '15. Building Name', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 3 },
    { id: 'local_lot', label: '15. Lot / Block / House No.', type: 'text', required: false, maxLength: 20, autoUppercase: true, step: 3 },
    { id: 'local_street', label: '15. Street Name', type: 'text', required: true, maxLength: 40, autoUppercase: true, step: 3 },
    { id: 'local_subdivision', label: '15. Subdivision / Village', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 3 },
    { id: 'local_barangay', label: '15. Barangay', type: 'text', required: true, maxLength: 30, autoUppercase: true, step: 3 },
    { id: 'local_town', label: '15. Town / District', type: 'text', required: false, maxLength: 30, autoUppercase: true, step: 3 },
    { id: 'local_city', label: '15. Municipality / City', type: 'text', required: true, maxLength: 30, autoUppercase: true, step: 3 },
    { id: 'local_province', label: '15. Province', type: 'text', required: true, maxLength: 30, autoUppercase: true, step: 3 },
    { id: 'local_zip', label: '15. ZIP Code (4 digits)', type: 'text', required: true, maxLength: 4, inputMode: 'numeric', placeholder: '1100', step: 3 },
    { id: 'foreign_address', label: '16. Foreign Address (resident aliens only)', type: 'text', required: false, maxLength: 120, autoUppercase: true, step: 3 },

    // Step 4
    { id: 'id_type', label: '21. ID Type (e.g. Passport, UMID)', type: 'text', required: true, maxLength: 30, autoUppercase: true, step: 4 },
    { id: 'id_number', label: '21. ID Number', type: 'text', required: true, maxLength: 24, step: 4 },
    { id: 'id_effectivity', label: '21. ID Effective Date (MM/DD/YYYY)', type: 'text', required: false, maxLength: 10, step: 4 },
    { id: 'id_expiry', label: '21. ID Expiry Date (MM/DD/YYYY)', type: 'text', required: false, maxLength: 10, step: 4 },
    { id: 'id_issuer', label: '21. Issuing Office / Agency', type: 'text', required: true, maxLength: 40, autoUppercase: true, step: 4 },
    { id: 'id_place_issue', label: '21. Place of Issue', type: 'text', required: false, maxLength: 40, autoUppercase: true, step: 4 },
    { id: 'preferred_contact_type', label: '22. Preferred Contact Type', type: 'dropdown', required: true,
      options: ['Landline', 'Fax', 'Mobile', 'Email'], step: 4 },
    { id: 'contact_landline', label: '22. Landline Number', type: 'tel', required: false, maxLength: 20, step: 4 },
    { id: 'contact_fax', label: '22. Fax Number', type: 'tel', required: false, maxLength: 20, step: 4 },
    { id: 'contact_mobile', label: '22. Mobile Number', type: 'tel', required: false, maxLength: 20, placeholder: '0917-555-1234', step: 4 },
    { id: 'contact_email', label: '22. Email Address', type: 'email', required: false, maxLength: 60, step: 4 },

    // Step 5
    { id: 'spouse_employment_status', label: '23. Spouse Employment Status', type: 'dropdown', required: false,
      options: ['Unemployed', 'Employed in the Philippines', 'Employed Abroad', 'Engaged in Business'], step: 5 },
    { id: 'spouse_last_name', label: '24. Spouse Last Name', type: 'text', required: false, maxLength: 40, autoUppercase: true, step: 5 },
    { id: 'spouse_first_name', label: '24. Spouse First Name', type: 'text', required: false, maxLength: 40, autoUppercase: true, step: 5 },
    { id: 'spouse_middle_name', label: '24. Spouse Middle Name', type: 'text', required: false, maxLength: 40, autoUppercase: true, step: 5 },
    { id: 'spouse_suffix', label: '24. Spouse Suffix', type: 'text', required: false, maxLength: 8, step: 5 },
    { id: 'spouse_tin', label: '25. Spouse TIN — 12 digits', type: 'text', required: false, maxLength: 12, inputMode: 'numeric', warnPattern: '^\\d{7}00000$', warnMessage: 'Individual filers normally have 5 trailing zeros (e.g. 1234567 00000). Double-check the TIN.', step: 5 },
    { id: 'spouse_employer_name', label: "26. Spouse's Employer Name", type: 'text', required: false, maxLength: 80, autoUppercase: true, step: 5 },
    { id: 'spouse_employer_tin', label: "27. Spouse's Employer TIN — 12 digits", type: 'text', required: false, maxLength: 12, inputMode: 'numeric', step: 5 },
  ],
};

// ─── Form Catalog ─────────────────────────────────────────────────────────────
export const FORMS: FormSchema[] = [hqpPff356, philhealthPmrf, philhealthClaimForm1, philhealthClaimForm2, philhealthClaimForm3, philhealthPmrfForeignNatl, philhealthClaimSignatureForm, pagibigPff049, pagibigSlf089, pagibigSlf065, pagibigHlf868, pagibigHlf858, pagibigHlf068, bir2316, bir1904, bir1902];

export function getFormBySlug(slug: string): FormSchema | undefined {
  return FORMS.find((f) => f.slug === slug);
}
