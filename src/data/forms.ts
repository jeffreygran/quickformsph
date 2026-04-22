// Form schema definitions for QuickFormsPH
// Fields are AI-extracted; currently hard-coded for HQP-PFF-356

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'textarea';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  optional_note?: string;
  placeholder?: string;
  hint?: string;
  options?: string[];          // for dropdown
  maxLength?: number;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text';
  autoUppercase?: boolean;
  step?: number;               // wizard step this field belongs to (1-indexed)
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
      fieldIds: ['mp2_account_no', 'last_name', 'first_name', 'middle_name', 'name_ext', 'mid_no'],
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
      inputMode: 'numeric',
      step: 1,
    },
    {
      id: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., DELA CRUZ',
      autoUppercase: true,
      step: 1,
    },
    {
      id: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., JUAN',
      autoUppercase: true,
      step: 1,
    },
    {
      id: 'middle_name',
      label: 'Middle Name',
      type: 'text',
      required: false,
      placeholder: 'e.g., SANTOS',
      autoUppercase: true,
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
      inputMode: 'numeric',
      step: 1,
    },

    // ── Step 2: Contact & Address ──
    {
      id: 'street',
      label: 'Street / House No. / Building',
      type: 'text',
      required: true,
      placeholder: 'e.g., Unit 4B, 123 Rizal Street',
      step: 2,
    },
    {
      id: 'barangay',
      label: 'Barangay',
      type: 'text',
      required: true,
      placeholder: 'e.g., Brgy. San Jose',
      step: 2,
    },
    {
      id: 'city',
      label: 'City / Municipality',
      type: 'text',
      required: true,
      placeholder: 'e.g., Quezon City',
      step: 2,
    },
    {
      id: 'province',
      label: 'Province',
      type: 'dropdown',
      required: true,
      options: [
        'Metro Manila (NCR)',
        'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay',
        'Antique', 'Apayao', 'Aurora', 'Basilan', 'Bataan', 'Batanes',
        'Batangas', 'Benguet', 'Biliran', 'Bohol', 'Bukidnon', 'Bulacan',
        'Cagayan', 'Camarines Norte', 'Camarines Sur', 'Camiguin', 'Capiz',
        'Catanduanes', 'Cavite', 'Cebu', 'Cotabato', 'Davao de Oro',
        'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental',
        'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao', 'Ilocos Norte',
        'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga', 'La Union', 'Laguna',
        'Lanao del Norte', 'Lanao del Sur', 'Leyte', 'Maguindanao del Norte',
        'Maguindanao del Sur', 'Marinduque', 'Masbate', 'Misamis Occidental',
        'Misamis Oriental', 'Mountain Province', 'Negros Occidental',
        'Negros Oriental', 'Northern Samar', 'Nueva Ecija', 'Nueva Vizcaya',
        'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Pampanga',
        'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 'Romblon', 'Samar',
        'Sarangani', 'Siquijor', 'Sorsogon', 'South Cotabato', 'Southern Leyte',
        'Sultan Kudarat', 'Sulu', 'Surigao del Norte', 'Surigao del Sur',
        'Tarlac', 'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte',
        'Zamboanga del Sur', 'Zamboanga Sibugay',
      ],
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
      inputMode: 'tel',
      step: 2,
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: false,
      placeholder: 'your@email.com',
      hint: 'For Pag-IBIG confirmation notifications',
      step: 2,
    },
    {
      id: 'home_tel',
      label: 'Home Telephone No.',
      type: 'tel',
      required: false,
      placeholder: '(02) XXXX-XXXX',
      step: 2,
    },
    {
      id: 'biz_tel',
      label: 'Business Telephone No.',
      type: 'tel',
      required: false,
      placeholder: '(02) XXXX-XXXX',
      step: 2,
    },

    // ── Step 3: Bank Details (all optional) ──
    {
      id: 'bank_name',
      label: 'Bank Name',
      type: 'dropdown',
      required: false,
      optional_note: 'Optional',
      options: [
        '',
        'BDO Unibank',
        'Bank of the Philippine Islands (BPI)',
        'Metrobank',
        'UnionBank of the Philippines',
        'RCBC',
        'Landbank of the Philippines',
        'Philippine National Bank (PNB)',
        'Security Bank',
        'Eastwest Bank',
        'Chinabank',
        'GCash (GSave)',
        'Maya Bank',
        'Other',
      ],
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
      inputMode: 'numeric',
      step: 3,
    },
    {
      id: 'bank_branch',
      label: 'Bank Branch',
      type: 'text',
      required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., Quezon Ave. Branch',
      step: 3,
    },
    {
      id: 'bank_address',
      label: 'Bank Address',
      type: 'textarea',
      required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., 123 Quezon Ave., Quezon City',
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

// ─── Form Catalog ─────────────────────────────────────────────────────────────
export const FORMS: FormSchema[] = [hqpPff356];

export function getFormBySlug(slug: string): FormSchema | undefined {
  return FORMS.find((f) => f.slug === slug);
}
