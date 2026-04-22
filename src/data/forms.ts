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
      inputMode: 'numeric',
      step: 1,
    },
    {
      id: 'branch',
      label: 'Pag-IBIG Branch',
      type: 'text',
      required: false,
      placeholder: 'e.g., Quezon City Branch',
      hint: 'Branch where you are submitting this form',
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
        'pin', 'konsulta_provider',
        'last_name', 'first_name', 'middle_name', 'name_ext',
        'dob_month', 'dob_day', 'dob_year', 'place_of_birth',
        'sex', 'civil_status', 'citizenship',
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
        'mobile', 'home_phone', 'email',
      ],
    },
    {
      label: 'Member Type',
      fieldIds: ['member_type', 'profession', 'monthly_income', 'proof_of_income'],
    },
  ],
  fields: [
    // ── Step 1: Personal Info ──
    {
      id: 'pin',
      label: 'PhilHealth Identification Number (PIN)',
      type: 'text',
      required: true,
      placeholder: 'e.g., 12-345-678-9012',
      inputMode: 'numeric',
      step: 1,
    },
    {
      id: 'konsulta_provider',
      label: 'Preferred KonSulTa Provider',
      type: 'text',
      required: false,
      optional_note: 'Optional',
      placeholder: 'e.g., 12-345-678-9012',
      hint: 'Your preferred KonSulTa/Primary Care Provider number',
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
      placeholder: 'e.g., JUAN ANDRES',
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
      id: 'dob_month',
      label: 'Date of Birth — Month',
      type: 'dropdown',
      required: true,
      options: ['01','02','03','04','05','06','07','08','09','10','11','12'],
      hint: 'Month (MM)',
      step: 1,
    },
    {
      id: 'dob_day',
      label: 'Date of Birth — Day',
      type: 'dropdown',
      required: true,
      options: [
        '01','02','03','04','05','06','07','08','09','10',
        '11','12','13','14','15','16','17','18','19','20',
        '21','22','23','24','25','26','27','28','29','30','31',
      ],
      hint: 'Day (DD)',
      step: 1,
    },
    {
      id: 'dob_year',
      label: 'Date of Birth — Year',
      type: 'text',
      required: true,
      placeholder: 'e.g., 1990',
      inputMode: 'numeric',
      maxLength: 4,
      hint: 'Year (YYYY)',
      step: 1,
    },
    {
      id: 'place_of_birth',
      label: 'Place of Birth',
      type: 'text',
      required: true,
      placeholder: 'e.g., Quezon City, Metro Manila',
      hint: 'City/Municipality/Province/Country',
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
      step: 1,
    },
    {
      id: 'citizenship',
      label: 'Citizenship',
      type: 'dropdown',
      required: true,
      options: ['Filipino', 'Dual Citizen', 'Foreign National'],
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
      hint: 'As it appears on your birth certificate',
      step: 2,
    },
    {
      id: 'mother_first_name',
      label: "Mother's First Name",
      type: 'text',
      required: true,
      placeholder: 'e.g., MARIA',
      autoUppercase: true,
      step: 2,
    },
    {
      id: 'mother_middle_name',
      label: "Mother's Middle Name",
      type: 'text',
      required: false,
      placeholder: 'e.g., GARCIA',
      autoUppercase: true,
      step: 2,
    },
    {
      id: 'spouse_last_name',
      label: "Spouse's Last Name",
      type: 'text',
      required: false,
      optional_note: 'If married',
      placeholder: 'e.g., SANTOS',
      autoUppercase: true,
      step: 2,
    },
    {
      id: 'spouse_first_name',
      label: "Spouse's First Name",
      type: 'text',
      required: false,
      optional_note: 'If married',
      placeholder: 'e.g., ANA',
      autoUppercase: true,
      step: 2,
    },
    {
      id: 'spouse_middle_name',
      label: "Spouse's Middle Name",
      type: 'text',
      required: false,
      optional_note: 'If married',
      placeholder: 'e.g., LIRA',
      autoUppercase: true,
      step: 2,
    },

    // ── Step 3: Address & Contact ──
    {
      id: 'perm_unit',
      label: 'Unit/Room No./Floor',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Unit 4B',
      step: 3,
    },
    {
      id: 'perm_building',
      label: 'Building Name',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Sunrise Tower',
      step: 3,
    },
    {
      id: 'perm_lot',
      label: 'Lot/Block/Phase/House Number',
      type: 'text',
      required: false,
      placeholder: 'e.g., Lot 12 Block 5',
      step: 3,
    },
    {
      id: 'perm_street',
      label: 'Street Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Rizal Street',
      step: 3,
    },
    {
      id: 'perm_subdivision',
      label: 'Subdivision',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Loyola Grand Villas',
      step: 3,
    },
    {
      id: 'perm_barangay',
      label: 'Barangay',
      type: 'text',
      required: true,
      placeholder: 'e.g., Brgy. San Jose',
      step: 3,
    },
    {
      id: 'perm_city',
      label: 'Municipality/City',
      type: 'text',
      required: true,
      placeholder: 'e.g., Quezon City',
      step: 3,
    },
    {
      id: 'perm_province',
      label: 'Province/State/Country',
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
        'Abroad',
      ],
      step: 3,
    },
    {
      id: 'perm_zip',
      label: 'ZIP Code',
      type: 'text',
      required: true,
      placeholder: '1100',
      inputMode: 'numeric',
      maxLength: 4,
      step: 3,
    },
    {
      id: 'mobile',
      label: 'Mobile Number',
      type: 'tel',
      required: true,
      placeholder: '09XX-XXX-XXXX',
      hint: 'Required — valid PH mobile number',
      inputMode: 'tel',
      step: 3,
    },
    {
      id: 'home_phone',
      label: 'Home Phone Number',
      type: 'tel',
      required: false,
      optional_note: 'Optional',
      placeholder: '(02) XXXX-XXXX',
      step: 3,
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: false,
      optional_note: 'Required for OFW',
      placeholder: 'your@email.com',
      step: 3,
    },

    // ── Step 4: Member Type ──
    {
      id: 'member_type',
      label: 'Member Type',
      type: 'dropdown',
      required: true,
      options: [
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
        'Senior Citizen',
        '4Ps/MCCT',
        'Listahanan',
        'LGU-sponsored',
        'NGA-sponsored',
        'Private-sponsored',
        'PAMANA',
        'Person with Disability',
        'KIA/KIPO',
        'Bangsamoro/Normalization',
        'Foreign National',
      ],
      step: 4,
    },
    {
      id: 'profession',
      label: 'Profession',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Nurse, Engineer',
      hint: 'Required if not Employed, Lifetime Member, or Sea-based Migrant Worker',
      step: 4,
    },
    {
      id: 'monthly_income',
      label: 'Monthly Income (PHP)',
      type: 'number',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., 15000',
      hint: 'Required for Self-Earning, Kasambahay, Family Driver',
      inputMode: 'numeric',
      step: 4,
    },
    {
      id: 'proof_of_income',
      label: 'Proof of Income',
      type: 'text',
      required: false,
      optional_note: 'If applicable',
      placeholder: 'e.g., Certificate of Employment',
      hint: 'Document proving your monthly income (e.g., payslip, ITR, COE)',
      step: 4,
    },
  ],
};

// ─── Form Catalog ─────────────────────────────────────────────────────────────
export const FORMS: FormSchema[] = [hqpPff356, philhealthPmrf];

export function getFormBySlug(slug: string): FormSchema | undefined {
  return FORMS.find((f) => f.slug === slug);
}
