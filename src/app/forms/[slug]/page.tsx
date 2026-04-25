'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getFormBySlug, FormField, FormSchema } from '@/data/forms';
import LocalModeOverlay, { LocalModeBanner } from '@/components/LocalModeOverlay';
import PaymentGate from '@/components/PaymentGate';
import { fetchFormTemplateBytes } from '@/lib/local-mode';
import type { StoredAccessToken } from '@/lib/access-token-client';
import { generatePDF } from '@/lib/pdf-generator';

const GCASH_NUMBER = process.env.NEXT_PUBLIC_GCASH_NUMBER ?? '0917-551-4822';
const GCASH_NAME   = process.env.NEXT_PUBLIC_GCASH_NAME   ?? 'JE****Y JO*N G.';

// ─── Agency logos ────────────────────────────────────────────────────────────
const AGENCY_LOGO: Record<string, { src: string; w: number; h: number }> = {
  'Bureau of Internal Revenue': { src: '/logos/bir.png',       w: 36, h: 36 },
  'Pag-IBIG Fund':              { src: '/logos/pagibig.png',   w: 36, h: 36 },
  'PhilHealth':                 { src: '/logos/philhealth.png', w: 72, h: 22 },
};

// ─── Types ───────────────────────────────────────────────────────────────────
type FormValues = Record<string, string>;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;   // 0-based, supports up to 6 steps

// ─── Draft persistence ───────────────────────────────────────────────────────
function draftKey(slug: string) { return `qfph_draft_${slug}`; }

function saveDraft(slug: string, values: FormValues) {
  try { localStorage.setItem(draftKey(slug), JSON.stringify(values)); } catch {}
}

function loadDraft(slug: string): FormValues | null {
  try {
    const raw = localStorage.getItem(draftKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft(slug: string) {
  try { localStorage.removeItem(draftKey(slug)); } catch {}
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FormWizardPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const router = useRouter();

  const form = getFormBySlug(slug);

  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [values, setValues]             = useState<FormValues>({});
  const [mode, setMode]                 = useState<'form' | 'review' | 'preview'>('form');
  const [previewing, setPreviewing]     = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  // Privacy & payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloadCode, setDownloadCode]         = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDemoMode, setIsDemoMode]             = useState(false);

  // Draft resume modal
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [pendingDraft, setPendingDraft]     = useState<FormValues | null>(null);


  // ─── Local Mode (v2.0) gate ────────────────────────────────────────────────────
  // Form rendering is gated until the device has cached everything required
  // to generate the PDF entirely in-browser. After activation a green banner
  // stays at the top of the page.
  const [localModeActive, setLocalModeActive] = useState(false);
  // Always start fresh — never skip the overlay on re-entry.

  // Blank PDF viewer
  const [showBlankViewer, setShowBlankViewer] = useState(false);
  const [blankPdfPage, setBlankPdfPage]       = useState(1);
  const [blankPdfTotal, setBlankPdfTotal]     = useState(0);
  const [blankPdfZoom, setBlankPdfZoom]       = useState(1.0);
  const [blankPdfCanvas, setBlankPdfCanvas]   = useState('');
  const [blankPdfLoading, setBlankPdfLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blankPdfDocRef = useRef<any>(null);

  // Populate today's date for the date field
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setValues((v) => ({ ...v, date: v.date ?? today }));
  }, []);

  // On mount: check for an existing draft and prompt instead of silently clearing
  useEffect(() => {
    if (!slug) return;
    const draft = loadDraft(slug);
    if (draft && Object.keys(draft).length > 0) {
      setPendingDraft(draft);
      setDraftModalOpen(true);
    }
  }, [slug]);

  // Auto-save draft on every change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback((id: string, value: string) => {
    setValues((prev) => {
      let next = { ...prev, [id]: value };
      // "Same as Above" — copy permanent address to mailing address when checked
      if (id === 'mail_same_as_above' && value === 'true') {
        next = {
          ...next,
          mail_unit:        prev.perm_unit        ?? '',
          mail_building:    prev.perm_building    ?? '',
          mail_lot:         prev.perm_lot         ?? '',
          mail_street:      prev.perm_street      ?? '',
          mail_subdivision: prev.perm_subdivision ?? '',
          mail_barangay:    prev.perm_barangay    ?? '',
          mail_city:        prev.perm_city        ?? '',
          mail_province:    prev.perm_province    ?? '',
          mail_zip:         prev.perm_zip         ?? '',
        };
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveDraft(slug, next), 600);
      return next;
    });
  }, [slug]);

  // ── Step completion check ────────────────────────────────────────────────
  function stepFilledCount(stepIdx: number) {
    if (!form) return 0;
    const stepFields = form.fields.filter((f) => f.step === stepIdx + 1 && f.required);
    return stepFields.filter((f) => (values[f.id] ?? '').trim() !== '').length;
  }

  function stepRequiredCount(stepIdx: number) {
    if (!form) return 0;
    return form.fields.filter((f) => f.step === stepIdx + 1 && f.required).length;
  }

  function totalFilled() {
    if (!form) return 0;
    return form.fields.filter((f) => (values[f.id] ?? '').trim() !== '').length;
  }

  // ── Auto-populate ────────────────────────────────────────────────────────
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [showSampleButton, setShowSampleButton] = useState(false);

  function autoPopulate(sampleIndex?: number) {
    const hqpSamples = [
      {
        mp2_account_no: '01-2345-6789-0', last_name: 'DELA CRUZ', first_name: 'JUAN',
        middle_name: 'SANTOS', name_ext: 'Jr.', mid_no: '1234-5678-9012',
        street: 'Unit 4B, 123 Rizal Street', barangay: 'Brgy. San Jose',
        city: 'Quezon City', province: 'Metro Manila (NCR)', zip: '1100',
        cellphone: '09171234567', email: 'juan.delacruz@gmail.com',
        home_tel: '028123-4567', biz_tel: '028765-4321',
        bank_name: 'BDO Unibank', bank_account_no: '001234567890',
        bank_branch: 'Quezon Ave. Branch', bank_address: '123 Quezon Ave., Quezon City',
        date: new Date().toISOString().split('T')[0],
      },
      {
        mp2_account_no: '02-9876-5432-1', last_name: 'REYES', first_name: 'MARIA',
        middle_name: 'GARCIA', name_ext: 'N/A', mid_no: '9876-5432-1098',
        street: 'Blk 5 Lot 12, Maharlika Village', barangay: 'Brgy. Bagumbayan',
        city: 'Taguig', province: 'Metro Manila (NCR)', zip: '1630',
        cellphone: '09281234567', email: 'maria.reyes@yahoo.com',
        home_tel: '', biz_tel: '',
        bank_name: 'Bank of the Philippine Islands (BPI)', bank_account_no: '9876543210',
        bank_branch: 'Bonifacio Global City Branch', bank_address: '32nd St., BGC, Taguig',
        date: new Date().toISOString().split('T')[0],
      },
    ];
    const pmrfSamples = [
      {
        // ── Step 1: Personal Info ──
        pin: '12-345-678-9012',
        purpose: 'Registration',
        konsulta_provider: '01-234-567-8901',
        last_name: 'DELA CRUZ', first_name: 'JUAN ANDRES', middle_name: 'REYES', name_ext: 'Jr.',
        dob_month: '03', dob_day: '15', dob_year: '1990',
        place_of_birth: 'Quezon City, Metro Manila',
        sex: 'Male', civil_status: 'Single', citizenship: 'Filipino',
        philsys_id: '1234-5678901-2', tin: '123-456-789-000',
        // ── Step 2: Family Names ──
        mother_last_name: 'REYES', mother_first_name: 'MARIA', mother_middle_name: 'SANTOS',
        spouse_last_name: '', spouse_first_name: '', spouse_middle_name: '',
        // ── Step 3: Address & Contact ──
        perm_unit: 'Unit 4B', perm_building: 'Sunrise Tower', perm_lot: 'Lot 12 Blk 3',
        perm_street: 'Katipunan Avenue', perm_subdivision: 'Loyola Grand Villas',
        perm_barangay: 'Brgy. Batasan Hills', perm_city: 'Quezon City',
        perm_province: 'Metro Manila (NCR)', perm_zip: '1126',
        mail_same_as_above: '',
        mail_unit: 'Room 2', mail_building: 'MNL Suites', mail_lot: 'Lot 3',
        mail_street: 'Taft Avenue', mail_subdivision: '',
        mail_barangay: 'Brgy. Ermita', mail_city: 'Manila',
        mail_province: 'Metro Manila (NCR)', mail_zip: '1000',
        mobile: '09171234567', home_phone: '028123-4567', email: 'juan.delacruz@gmail.com',
        // ── Step 4: Dependents ──
        dep1_last_name: 'REYES', dep1_first_name: 'CARLOS', dep1_name_ext: '',
        dep1_middle_name: 'SANTOS', dep1_relationship: 'Brother',
        dep1_dob: '05-22-1995', dep1_citizenship: 'Filipino',
        dep1_no_middle_name: '', dep1_mononym: '', dep1_disability: '',
        dep2_last_name: 'DELA CRUZ', dep2_first_name: 'ELENA', dep2_name_ext: '',
        dep2_middle_name: 'REYES', dep2_relationship: 'Sister',
        dep2_dob: '09-14-1993', dep2_citizenship: 'Filipino',
        dep2_no_middle_name: '', dep2_mononym: '', dep2_disability: '',
        dep3_last_name: '', dep3_first_name: '', dep3_name_ext: '',
        dep3_middle_name: '', dep3_relationship: '', dep3_dob: '', dep3_citizenship: '',
        dep3_no_middle_name: '', dep3_mononym: '', dep3_disability: '',
        dep4_last_name: '', dep4_first_name: '', dep4_name_ext: '',
        dep4_middle_name: '', dep4_relationship: '', dep4_dob: '', dep4_citizenship: '',
        dep4_no_middle_name: '', dep4_mononym: '', dep4_disability: '',
        // ── Step 5: Member Type ──
        member_type: 'Employed Private', indirect_contributor: '',
        profession: 'Civil Engineer', monthly_income: '55000',
        proof_of_income: 'Certificate of Employment',
      },
      {
        // ── Step 1: Personal Info ──
        pin: '09-876-543-2109',
        purpose: 'Updating/Amendment',
        konsulta_provider: '09-876-543-0001',
        last_name: 'SANTOS', first_name: 'ANNA MARIE', middle_name: 'GARCIA', name_ext: '',
        dob_month: '07', dob_day: '22', dob_year: '1985',
        place_of_birth: 'Cebu City, Cebu',
        sex: 'Female', civil_status: 'Married', citizenship: 'Filipino',
        philsys_id: '9876-5432109-8', tin: '987-654-321-000',
        // ── Step 2: Family Names ──
        mother_last_name: 'GARCIA', mother_first_name: 'LUCIA', mother_middle_name: 'VIDAL',
        spouse_last_name: 'SANTOS', spouse_first_name: 'PEDRO', spouse_middle_name: 'LIM',
        // ── Step 3: Address & Contact ──
        perm_unit: 'Unit 3A', perm_building: 'Greenfield Residences', perm_lot: 'Blk 5 Lot 7',
        perm_street: 'Mabini Street', perm_subdivision: 'Greenfield Village',
        perm_barangay: 'Brgy. Poblacion', perm_city: 'Makati City',
        perm_province: 'Metro Manila (NCR)', perm_zip: '1210',
        mail_same_as_above: 'true',
        mail_unit: '', mail_building: '', mail_lot: '',
        mail_street: '', mail_subdivision: '',
        mail_barangay: '', mail_city: '',
        mail_province: '', mail_zip: '',
        mobile: '09281234567', home_phone: '028765-4321', email: 'anna.santos@gmail.com',
        // ── Step 4: Dependents ──
        dep1_last_name: 'SANTOS', dep1_first_name: 'PEDRO', dep1_name_ext: '',
        dep1_middle_name: 'LIM', dep1_relationship: 'Spouse',
        dep1_dob: '04-05-1983', dep1_citizenship: 'Filipino',
        dep1_no_middle_name: '', dep1_mononym: '', dep1_disability: '',
        dep2_last_name: 'SANTOS', dep2_first_name: 'CLAIRE ANNE', dep2_name_ext: '',
        dep2_middle_name: 'LIM', dep2_relationship: 'Child',
        dep2_dob: '11-02-2010', dep2_citizenship: 'Filipino',
        dep2_no_middle_name: '', dep2_mononym: '', dep2_disability: 'true',
        dep3_last_name: 'SANTOS', dep3_first_name: 'MIGUEL', dep3_name_ext: '',
        dep3_middle_name: 'LIM', dep3_relationship: 'Child',
        dep3_dob: '03-18-2013', dep3_citizenship: 'Filipino',
        dep3_no_middle_name: '', dep3_mononym: '', dep3_disability: '',
        dep4_last_name: '', dep4_first_name: '', dep4_name_ext: '',
        dep4_middle_name: '', dep4_relationship: '', dep4_dob: '', dep4_citizenship: '',
        dep4_no_middle_name: '', dep4_mononym: '', dep4_disability: '',
        // ── Step 5: Member Type ──
        member_type: 'Self-Earning Individual', indirect_contributor: '',
        profession: 'Freelance Designer', monthly_income: '25000',
        proof_of_income: 'Notarized Affidavit of Income',
      },
    ];

    const cf1Samples = [
      {
        // ── Sample 1: Member is the patient (employed, with employer cert) ──
        // Step 1: Member Info
        member_pin: '123456789012',
        member_last_name: 'DELA CRUZ', member_first_name: 'JUAN ANDRES',
        member_name_ext: 'Jr.', member_middle_name: 'SANTOS',
        member_dob_month: '03', member_dob_day: '15', member_dob_year: '1990',
        member_sex: 'Male',
        // Step 2: Mailing Address
        addr_unit: 'Unit 4B', addr_building: 'Sunrise Tower', addr_lot: 'Lot 12 Blk 3',
        addr_street: 'Katipunan Avenue', addr_subdivision: 'Loyola Grand Villas',
        addr_barangay: 'Brgy. Batasan Hills', addr_city: 'Quezon City',
        addr_province: 'Metro Manila (NCR)', addr_country: 'Philippines', addr_zip: '1126',
        // Step 3: Contact & Patient Type
        contact_landline: '(02) 8123-4567', contact_mobile: '09171234567',
        contact_email: 'juan.delacruz@gmail.com',
        patient_is_member: 'Yes — I am the Patient',
        // Step 4: Dependent (blank — patient is the member)
        patient_pin: '', patient_last_name: '', patient_first_name: '',
        patient_name_ext: '', patient_middle_name: '',
        patient_dob_month: '', patient_dob_day: '', patient_dob_year: '',
        patient_relationship: '', patient_sex: '',
        // Step 5: Employer Certification
        employer_pen: '17-123456789-0', employer_contact: '(02) 8888-9999',
        employer_business_name: 'ABC COMPANY INC',
      },
      {
        // ── Sample 2: Dependent (child) is the patient, self-employed member ──
        // Step 1: Member Info
        member_pin: '098765432109',
        member_last_name: 'SANTOS', member_first_name: 'ANNA MARIE',
        member_name_ext: 'N/A', member_middle_name: 'GARCIA',
        member_dob_month: '07', member_dob_day: '22', member_dob_year: '1985',
        member_sex: 'Female',
        // Step 2: Mailing Address
        addr_unit: '', addr_building: 'Greenfield Residences', addr_lot: 'Blk 5 Lot 7',
        addr_street: 'Mabini Street', addr_subdivision: 'Greenfield Village',
        addr_barangay: 'Brgy. Poblacion', addr_city: 'Makati City',
        addr_province: 'Metro Manila (NCR)', addr_country: 'Philippines', addr_zip: '1210',
        // Step 3: Contact & Patient Type
        contact_landline: '', contact_mobile: '09281234567',
        contact_email: 'anna.santos@gmail.com',
        patient_is_member: 'No — Patient is a Dependent',
        // Step 4: Dependent (child)
        patient_pin: '112233445566',
        patient_last_name: 'SANTOS', patient_first_name: 'CLAIRE ANNE',
        patient_name_ext: 'N/A', patient_middle_name: 'GARCIA',
        patient_dob_month: '11', patient_dob_day: '02', patient_dob_year: '2010',
        patient_relationship: 'Child', patient_sex: 'Female',
        // Step 5: Employer (blank — self-employed)
        employer_pen: '', employer_contact: '', employer_business_name: '',
      },
    ];

    const samplesBySlug: Record<string, Record<string, string>[]> = {
      'hqp-pff-356': hqpSamples,
      'philhealth-pmrf': pmrfSamples as Record<string, string>[],
      'philhealth-claim-form-1': cf1Samples,

      // ── PhilHealth Claim Form 2 ───────────────────────────────────────────
      'philhealth-claim-form-2': [
        {
          // Sample 1: Standard appendicitis admission
          hci_pan: '10-1234-5678', hci_name: 'Makati Medical Center',
          hci_bldg_street: '2 Amorsolo St', hci_city: 'Makati City',
          hci_province: 'Metro Manila (NCR)',
          patient_last_name: 'DELA CRUZ', patient_first_name: 'JUAN', patient_name_ext: 'N/A', patient_middle_name: 'SANTOS',
          referred_by_hci: 'NO',
          referring_hci_name: '', referring_hci_bldg_street: '', referring_hci_city: '', referring_hci_province: '', referring_hci_zip: '',
          date_admitted_month: '04', date_admitted_day: '10', date_admitted_year: '2026',
          time_admitted_hour: '08', time_admitted_min: '30', time_admitted_ampm: 'AM',
          date_discharged_month: '04', date_discharged_day: '15', date_discharged_year: '2026',
          time_discharged_hour: '02', time_discharged_min: '00', time_discharged_ampm: 'PM',
          patient_disposition: 'Recovered',
          expired_month: '', expired_day: '', expired_year: '', expired_hour: '', expired_min: '', expired_ampm: '',
          transferred_hci_name: '', transferred_hci_bldg_street: '', transferred_hci_city: '', transferred_hci_province: '', transferred_hci_zip: '',
          reason_for_referral: '',
          accommodation_type: 'Non-Private (Charity/Service)',
          admission_diagnosis_1: 'Acute Appendicitis', admission_diagnosis_2: '',
          discharge_diagnosis_1: 'Appendicitis', discharge_icd10_1: 'K37', discharge_procedure_1: 'Appendectomy', discharge_rvs_1: '10060', discharge_procedure_date_1: '04/11/2026', discharge_laterality_1: 'N/A',
          discharge_diagnosis_2: '', discharge_icd10_2: '', discharge_procedure_2: '', discharge_rvs_2: '', discharge_procedure_date_2: '', discharge_laterality_2: 'N/A',
          discharge_diagnosis_3: '', discharge_icd10_3: '', discharge_procedure_3: '', discharge_rvs_3: '', discharge_procedure_date_3: '', discharge_laterality_3: 'N/A',
          discharge_diagnosis_4: '', discharge_icd10_4: '', discharge_procedure_4: '', discharge_rvs_4: '', discharge_procedure_date_4: '', discharge_laterality_4: 'N/A',
          discharge_diagnosis_5: '', discharge_icd10_5: '', discharge_procedure_5: '', discharge_rvs_5: '', discharge_procedure_date_5: '', discharge_laterality_5: 'N/A',
          discharge_diagnosis_6: '', discharge_icd10_6: '', discharge_procedure_6: '', discharge_rvs_6: '', discharge_procedure_date_6: '', discharge_laterality_6: 'N/A',
          special_hemodialysis: '', special_peritoneal_dialysis: '', special_radiotherapy_linac: '', special_radiotherapy_cobalt: '', special_blood_transfusion: '', special_brachytherapy: '', special_chemotherapy: '', special_simple_debridement: '',
          zbenefit_package_code: '', mcp_dates: '', tbdots_intensive_phase: '', tbdots_maintenance_phase: '',
          animal_bite_arv_day1: '', animal_bite_arv_day2: '', animal_bite_arv_day3: '', animal_bite_rig: '', animal_bite_others: '',
          newborn_essential_care: '', newborn_hearing_screening: '', newborn_screening_test: '', hiv_lab_number: '',
          philhealth_benefit_first_case_rate: 'Appendectomy', philhealth_benefit_second_case_rate: '', philhealth_benefit_icd_rvs_code: 'K37 / 10060',
          hcp1_accreditation_no: 'DR-2025-01234 — DR. RICARDO GOMEZ', hcp1_date_signed_month: '04', hcp1_date_signed_day: '15', hcp1_date_signed_year: '2026', hcp1_copay: '',
          hcp2_accreditation_no: '', hcp2_date_signed_month: '', hcp2_date_signed_day: '', hcp2_date_signed_year: '', hcp2_copay: '',
          hcp3_accreditation_no: '', hcp3_date_signed_month: '', hcp3_date_signed_day: '', hcp3_date_signed_year: '', hcp3_copay: '',
          total_hci_fees: '35000', total_professional_fees: '8000', grand_total: '43000',
          total_actual_charges: '43000', discount_amount: '0', philhealth_benefit_amount: '18000', amount_after_philhealth: '25000',
          hci_amount_paid_by: '25000', hci_paid_member_patient: '', hci_paid_hmo: '', hci_paid_others: '',
          pf_amount_paid_by: '8000', pf_paid_member_patient: '', pf_paid_hmo: '', pf_paid_others: '',
          drug_purchase_none: '', drug_purchase_total_amount: '2500',
          diagnostic_purchase_none: '', diagnostic_purchase_total_amount: '3500',
        },
        {
          // Sample 2: Pneumonia admission with referral
          hci_pan: '20-9876-5432', hci_name: 'Philippine General Hospital',
          hci_bldg_street: 'Taft Avenue', hci_city: 'Manila', hci_province: 'Metro Manila (NCR)',
          patient_last_name: 'SANTOS', patient_first_name: 'ANNA MARIE', patient_name_ext: 'N/A', patient_middle_name: 'GARCIA',
          referred_by_hci: 'YES',
          referring_hci_name: 'City Health Center Malate', referring_hci_bldg_street: 'Adriatico St', referring_hci_city: 'Manila', referring_hci_province: 'Metro Manila', referring_hci_zip: '1004',
          date_admitted_month: '03', date_admitted_day: '22', date_admitted_year: '2026',
          time_admitted_hour: '11', time_admitted_min: '45', time_admitted_ampm: 'AM',
          date_discharged_month: '03', date_discharged_day: '28', date_discharged_year: '2026',
          time_discharged_hour: '10', time_discharged_min: '00', time_discharged_ampm: 'AM',
          patient_disposition: 'Improved',
          expired_month: '', expired_day: '', expired_year: '', expired_hour: '', expired_min: '', expired_ampm: '',
          transferred_hci_name: '', transferred_hci_bldg_street: '', transferred_hci_city: '', transferred_hci_province: '', transferred_hci_zip: '',
          reason_for_referral: 'Requires higher level of care',
          accommodation_type: 'Non-Private (Charity/Service)',
          admission_diagnosis_1: 'Community Acquired Pneumonia', admission_diagnosis_2: 'Hypertension',
          discharge_diagnosis_1: 'CAP-Moderate Risk', discharge_icd10_1: 'J18.9', discharge_procedure_1: 'Supportive Management', discharge_rvs_1: '', discharge_procedure_date_1: '', discharge_laterality_1: 'N/A',
          discharge_diagnosis_2: 'Hypertension Stage 2', discharge_icd10_2: 'I10', discharge_procedure_2: '', discharge_rvs_2: '', discharge_procedure_date_2: '', discharge_laterality_2: 'N/A',
          discharge_diagnosis_3: '', discharge_icd10_3: '', discharge_procedure_3: '', discharge_rvs_3: '', discharge_procedure_date_3: '', discharge_laterality_3: 'N/A',
          discharge_diagnosis_4: '', discharge_icd10_4: '', discharge_procedure_4: '', discharge_rvs_4: '', discharge_procedure_date_4: '', discharge_laterality_4: 'N/A',
          discharge_diagnosis_5: '', discharge_icd10_5: '', discharge_procedure_5: '', discharge_rvs_5: '', discharge_procedure_date_5: '', discharge_laterality_5: 'N/A',
          discharge_diagnosis_6: '', discharge_icd10_6: '', discharge_procedure_6: '', discharge_rvs_6: '', discharge_procedure_date_6: '', discharge_laterality_6: 'N/A',
          special_hemodialysis: '', special_peritoneal_dialysis: '', special_radiotherapy_linac: '', special_radiotherapy_cobalt: '', special_blood_transfusion: '', special_brachytherapy: '', special_chemotherapy: '', special_simple_debridement: '',
          zbenefit_package_code: 'CAP-MR', mcp_dates: '', tbdots_intensive_phase: '', tbdots_maintenance_phase: '',
          animal_bite_arv_day1: '', animal_bite_arv_day2: '', animal_bite_arv_day3: '', animal_bite_rig: '', animal_bite_others: '',
          newborn_essential_care: '', newborn_hearing_screening: '', newborn_screening_test: '', hiv_lab_number: '',
          philhealth_benefit_first_case_rate: 'CAP-MR', philhealth_benefit_second_case_rate: '', philhealth_benefit_icd_rvs_code: 'J18.9',
          hcp1_accreditation_no: 'DR-2024-98765 — DR. ELENA REYES', hcp1_date_signed_month: '03', hcp1_date_signed_day: '28', hcp1_date_signed_year: '2026', hcp1_copay: '',
          hcp2_accreditation_no: '', hcp2_date_signed_month: '', hcp2_date_signed_day: '', hcp2_date_signed_year: '', hcp2_copay: '',
          hcp3_accreditation_no: '', hcp3_date_signed_month: '', hcp3_date_signed_day: '', hcp3_date_signed_year: '', hcp3_copay: '',
          total_hci_fees: '28000', total_professional_fees: '6000', grand_total: '34000',
          total_actual_charges: '34000', discount_amount: '0', philhealth_benefit_amount: '16000', amount_after_philhealth: '18000',
          hci_amount_paid_by: '18000', hci_paid_member_patient: '', hci_paid_hmo: '', hci_paid_others: '',
          pf_amount_paid_by: '6000', pf_paid_member_patient: '', pf_paid_hmo: '', pf_paid_others: '',
          drug_purchase_none: '', drug_purchase_total_amount: '4500',
          diagnostic_purchase_none: '', diagnostic_purchase_total_amount: '2200',
        },
        {
          // Sample 3: FULL — all fields including special packages, multiple diagnoses, 3 HCPs
          hci_pan: '33-1111-2222', hci_name: 'St. Luke\'s Medical Center',
          hci_bldg_street: 'E. Rodriguez Sr. Blvd', hci_city: 'Quezon City', hci_province: 'Metro Manila (NCR)',
          patient_last_name: 'REYES', patient_first_name: 'CARLOS MIGUEL', patient_name_ext: 'Jr.', patient_middle_name: 'VILLANUEVA',
          referred_by_hci: 'YES',
          referring_hci_name: 'Quezon City General Hospital', referring_hci_bldg_street: 'Seminary Rd', referring_hci_city: 'Quezon City', referring_hci_province: 'Metro Manila', referring_hci_zip: '1100',
          date_admitted_month: '02', date_admitted_day: '14', date_admitted_year: '2026',
          time_admitted_hour: '09', time_admitted_min: '15', time_admitted_ampm: 'AM',
          date_discharged_month: '02', date_discharged_day: '28', date_discharged_year: '2026',
          time_discharged_hour: '03', time_discharged_min: '30', time_discharged_ampm: 'PM',
          patient_disposition: 'Improved',
          expired_month: '', expired_day: '', expired_year: '', expired_hour: '', expired_min: '', expired_ampm: '',
          transferred_hci_name: 'National Kidney Institute', transferred_hci_bldg_street: 'East Ave', transferred_hci_city: 'Quezon City', transferred_hci_province: 'Metro Manila', transferred_hci_zip: '1101',
          reason_for_referral: 'Requires dialysis management',
          accommodation_type: 'Private',
          admission_diagnosis_1: 'End Stage Renal Disease', admission_diagnosis_2: 'Diabetes Mellitus Type 2',
          discharge_diagnosis_1: 'ESRD on Hemodialysis', discharge_icd10_1: 'N18.6', discharge_procedure_1: 'Hemodialysis', discharge_rvs_1: '90935', discharge_procedure_date_1: '02/16/2026', discharge_laterality_1: 'N/A',
          discharge_diagnosis_2: 'DM Type 2 uncontrolled', discharge_icd10_2: 'E11.9', discharge_procedure_2: 'Insulin Therapy', discharge_rvs_2: '', discharge_procedure_date_2: '', discharge_laterality_2: 'N/A',
          discharge_diagnosis_3: 'Hypertension', discharge_icd10_3: 'I10', discharge_procedure_3: 'Antihypertensive meds', discharge_rvs_3: '', discharge_procedure_date_3: '', discharge_laterality_3: 'N/A',
          discharge_diagnosis_4: 'Anemia of CKD', discharge_icd10_4: 'D63.1', discharge_procedure_4: 'Blood Transfusion', discharge_rvs_4: '86950', discharge_procedure_date_4: '02/18/2026', discharge_laterality_4: 'N/A',
          discharge_diagnosis_5: '', discharge_icd10_5: '', discharge_procedure_5: '', discharge_rvs_5: '', discharge_procedure_date_5: '', discharge_laterality_5: 'N/A',
          discharge_diagnosis_6: '', discharge_icd10_6: '', discharge_procedure_6: '', discharge_rvs_6: '', discharge_procedure_date_6: '', discharge_laterality_6: 'N/A',
          special_hemodialysis: '3', special_peritoneal_dialysis: '', special_radiotherapy_linac: '', special_radiotherapy_cobalt: '', special_blood_transfusion: '2', special_brachytherapy: '', special_chemotherapy: '', special_simple_debridement: '',
          zbenefit_package_code: 'ESRD-HD', mcp_dates: '', tbdots_intensive_phase: '', tbdots_maintenance_phase: '',
          animal_bite_arv_day1: '', animal_bite_arv_day2: '', animal_bite_arv_day3: '', animal_bite_rig: '', animal_bite_others: '',
          newborn_essential_care: '', newborn_hearing_screening: '', newborn_screening_test: '', hiv_lab_number: '',
          philhealth_benefit_first_case_rate: 'ESRD (HD)', philhealth_benefit_second_case_rate: 'Anemia of CKD', philhealth_benefit_icd_rvs_code: 'N18.6 / 90935',
          hcp1_accreditation_no: 'DR-2025-11111 — DR. JOSE MENDOZA (Nephrologist)', hcp1_date_signed_month: '02', hcp1_date_signed_day: '28', hcp1_date_signed_year: '2026', hcp1_copay: '',
          hcp2_accreditation_no: 'DR-2025-22222 — DR. LINDA TAN (Endocrinologist)', hcp2_date_signed_month: '02', hcp2_date_signed_day: '28', hcp2_date_signed_year: '2026', hcp2_copay: '',
          hcp3_accreditation_no: 'DR-2025-33333 — DR. ROBERTO CRUZ (Hematologist)', hcp3_date_signed_month: '02', hcp3_date_signed_day: '28', hcp3_date_signed_year: '2026', hcp3_copay: '',
          total_hci_fees: '95000', total_professional_fees: '18000', grand_total: '113000',
          total_actual_charges: '113000', discount_amount: '5000', philhealth_benefit_amount: '45000', amount_after_philhealth: '63000',
          hci_amount_paid_by: '63000', hci_paid_member_patient: '', hci_paid_hmo: '', hci_paid_others: '',
          pf_amount_paid_by: '18000', pf_paid_member_patient: '', pf_paid_hmo: '', pf_paid_others: '',
          drug_purchase_none: '', drug_purchase_total_amount: '12500',
          diagnostic_purchase_none: '', diagnostic_purchase_total_amount: '8700',
        },
      ],

      // ── PhilHealth PMRF (Foreign National) ───────────────────────────────
      'philhealth-pmrf-foreign-natl': [
        {
          philhealth_number: '22-0000001234', acr_icard_number: 'A12345678', pra_srrv_number: '',
          last_name: 'SMITH', first_name: 'JOHN WILLIAM', middle_name: 'ANDERSON',
          sex: 'Male', nationality: 'American', dob_month: '09', dob_day: '14', dob_year: '1982',
          civil_status: 'Married',
          philippine_address_line1: '88 Legaspi St, Legaspi Village',
          philippine_address_line2: 'Makati City, Metro Manila 1229',
          contact_phone: '09171002020', email: 'j.smith@company.com.ph',
          signature_printed_name: 'JOHN WILLIAM ANDERSON SMITH', signature_date: new Date().toISOString().split('T')[0],
        },
        {
          philhealth_number: '', acr_icard_number: 'B98765432', pra_srrv_number: 'SRRV-2022-00123',
          last_name: 'TANAKA', first_name: 'HIROSHI', middle_name: '',
          sex: 'Male', nationality: 'Japanese', dob_month: '03', dob_day: '22', dob_year: '1975',
          civil_status: 'Married',
          philippine_address_line1: 'Unit 12F, One Bonifacio High Street',
          philippine_address_line2: 'BGC, Taguig, Metro Manila 1634',
          contact_phone: '09281112233', email: 'h.tanaka@jp-corp.ph',
          signature_printed_name: 'HIROSHI TANAKA', signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // Full — all fields
          philhealth_number: '22-9999888777', acr_icard_number: 'C11223344', pra_srrv_number: 'SRRV-2023-00456',
          last_name: 'GARCIA', first_name: 'MARIA ELENA', middle_name: 'RODRIGUEZ',
          sex: 'Female', nationality: 'Spanish', dob_month: '06', dob_day: '15', dob_year: '1988',
          civil_status: 'Single',
          philippine_address_line1: '32 Escolta Street, Binondo',
          philippine_address_line2: 'Manila, Metro Manila 1006',
          contact_phone: '09171234567', email: 'maria.garcia@eu-company.ph',
          signature_printed_name: 'MARIA ELENA RODRIGUEZ GARCIA', signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── PhilHealth Claim Signature Form ──────────────────────────────────
      'philhealth-claim-signature-form': [
        {
          series_no: '2026-001-00123',
          member_pin: '123456789012', member_last_name: 'DELA CRUZ', member_first_name: 'JUAN ANDRES',
          member_ext_name: 'Jr.', member_middle_name: 'SANTOS',
          member_dob_month: '03', member_dob_day: '15', member_dob_year: '1990',
          dependent_pin: '', patient_last_name: 'DELA CRUZ', patient_first_name: 'JUAN ANDRES',
          patient_ext_name: 'Jr.', patient_middle_name: 'SANTOS',
          relationship_to_member: 'Self',
          date_admitted_month: '04', date_admitted_day: '10', date_admitted_year: '2026',
          date_discharged_month: '04', date_discharged_day: '15', date_discharged_year: '2026',
          patient_dob_month: '03', patient_dob_day: '15', patient_dob_year: '1990',
          employer_pen: '17-123456789-0', employer_contact_no: '0288889999',
          business_name: 'ABC COMPANY INC',
          employer_date_signed_month: '04', employer_date_signed_day: '16', employer_date_signed_year: '2026',
          consent_date_signed_month: '04', consent_date_signed_day: '16', consent_date_signed_year: '2026',
        },
        {
          series_no: '2026-001-00456',
          member_pin: '098765432109', member_last_name: 'SANTOS', member_first_name: 'ANNA MARIE',
          member_ext_name: '', member_middle_name: 'GARCIA',
          member_dob_month: '07', member_dob_day: '22', member_dob_year: '1985',
          dependent_pin: '112233445566', patient_last_name: 'SANTOS', patient_first_name: 'CLAIRE ANNE',
          patient_ext_name: '', patient_middle_name: 'GARCIA',
          relationship_to_member: 'Child',
          date_admitted_month: '03', date_admitted_day: '22', date_admitted_year: '2026',
          date_discharged_month: '03', date_discharged_day: '28', date_discharged_year: '2026',
          patient_dob_month: '11', patient_dob_day: '02', patient_dob_year: '2010',
          employer_pen: '', employer_contact_no: '', business_name: '',
          employer_date_signed_month: '', employer_date_signed_day: '', employer_date_signed_year: '',
          consent_date_signed_month: '03', consent_date_signed_day: '28', consent_date_signed_year: '2026',
        },
        {
          // Full — all fields filled
          series_no: '2026-001-00789',
          member_pin: '556677889900', member_last_name: 'REYES', member_first_name: 'PEDRO JOSE',
          member_ext_name: 'Sr.', member_middle_name: 'VILLANUEVA',
          member_dob_month: '05', member_dob_day: '10', member_dob_year: '1978',
          dependent_pin: '445566778899', patient_last_name: 'REYES', patient_first_name: 'PEDRO MIGUEL',
          patient_ext_name: 'Jr.', patient_middle_name: 'VILLANUEVA',
          relationship_to_member: 'Child',
          date_admitted_month: '02', date_admitted_day: '01', date_admitted_year: '2026',
          date_discharged_month: '02', date_discharged_day: '10', date_discharged_year: '2026',
          patient_dob_month: '08', patient_dob_day: '25', patient_dob_year: '2005',
          employer_pen: '33-987654321-0', employer_contact_no: '0277778888',
          business_name: 'XYZ CORPORATION',
          employer_date_signed_month: '02', employer_date_signed_day: '11', employer_date_signed_year: '2026',
          consent_date_signed_month: '02', consent_date_signed_day: '11', consent_date_signed_year: '2026',
        },
      ],

      // ── Pag-IBIG PFF-049 (MCIF) ──────────────────────────────────────────
      'pagibig-pff-049': [
        {
          mid_no: '1234-5678-9012', housing_account_no: '',
          loyalty_card_holder: 'No', loyalty_partner_bank: '',
          current_last_name: 'DELA CRUZ', current_first_name: 'JUAN ANDRES', current_ext_name: 'Jr.', current_middle_name: 'SANTOS',
          category_from: '', category_to: '',
          name_from_last: '', name_from_first: '', name_from_ext: 'N/A', name_from_middle: '',
          name_to_last: '', name_to_first: '', name_to_ext: 'N/A', name_to_middle: '',
          dob_from: '', dob_to: '',
          marital_from: 'Single', marital_to: 'Married',
          spouse_last_name: 'REYES', spouse_first_name: 'MARIA', spouse_ext_name: 'N/A', spouse_middle_name: 'GARCIA',
          new_address_line: '123 Rizal St, Sampaloc', new_barangay: 'Brgy. 101', new_city: 'Manila', new_province: 'Metro Manila (NCR)', new_zip: '1008',
          new_cell_phone: '09171234567', new_email: 'juan.delacruz@gmail.com',
          preferred_mailing: 'Present Home Address',
          others_from: '', others_to: '',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          mid_no: '9876-5432-1098', housing_account_no: 'HL-2024-001234',
          loyalty_card_holder: 'Yes', loyalty_partner_bank: 'BDO Unibank',
          current_last_name: 'SANTOS', current_first_name: 'ANNA MARIE', current_ext_name: 'N/A', current_middle_name: 'GARCIA',
          category_from: '', category_to: '',
          name_from_last: '', name_from_first: '', name_from_ext: 'N/A', name_from_middle: '',
          name_to_last: '', name_to_first: '', name_to_ext: 'N/A', name_to_middle: '',
          dob_from: '', dob_to: '',
          marital_from: 'Married', marital_to: 'Widowed',
          spouse_last_name: '', spouse_first_name: '', spouse_ext_name: 'N/A', spouse_middle_name: '',
          new_address_line: 'Blk 5 Lot 7, Greenfield Village, Mabini St', new_barangay: 'Brgy. Poblacion', new_city: 'Makati City', new_province: 'Metro Manila (NCR)', new_zip: '1210',
          new_cell_phone: '09281234567', new_email: 'anna.santos@gmail.com',
          preferred_mailing: 'Permanent Home Address',
          others_from: '', others_to: '',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // Full — name change + all categories
          mid_no: '5555-6666-7777', housing_account_no: 'HL-2023-009876',
          loyalty_card_holder: 'Yes', loyalty_partner_bank: 'BPI Family Savings Bank',
          current_last_name: 'REYES', current_first_name: 'MARIA ELENA', current_ext_name: 'N/A', current_middle_name: 'GARCIA',
          category_from: 'Employed', category_to: 'Self-Employed',
          name_from_last: 'GARCIA', name_from_first: 'MARIA ELENA', name_from_ext: 'N/A', name_from_middle: 'VILLANUEVA',
          name_to_last: 'REYES', name_to_first: 'MARIA ELENA', name_to_ext: 'N/A', name_to_middle: 'GARCIA',
          dob_from: '06/15/1988', dob_to: '06/15/1988',
          marital_from: 'Single', marital_to: 'Married',
          spouse_last_name: 'REYES', spouse_first_name: 'CARLOS', spouse_ext_name: 'N/A', spouse_middle_name: 'SANTOS',
          new_address_line: '32 Escolta St, Binondo', new_barangay: 'Brgy. 292', new_city: 'Manila', new_province: 'Metro Manila (NCR)', new_zip: '1006',
          new_cell_phone: '09171112233', new_email: 'maria.reyes@biz.ph',
          preferred_mailing: 'Employer/Business Address',
          others_from: 'Government Employed', others_to: 'Private Self-Employed',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── Pag-IBIG SLF-089 (HELPs) ────────────────────────────────────────
      'pagibig-slf-089': [
        {
          mid_no: '9876543210 98', application_no: '',
          last_name: 'MENDOZA', first_name: 'ROBERTO', ext_name: 'N/A', middle_name: 'LINDO', no_maiden_middle_name: '',
          dob: '07/04/1980', place_of_birth: 'Manila, Metro Manila', mothers_maiden_name: 'LINDO, CECILIA SANTOS',
          sex: 'Male', marital_status: 'Married', citizenship: 'Filipino', nationality: 'Filipino',
          perm_unit: '', perm_street: '789 Tindalo St', perm_cell_phone: '09203334444', perm_home_tel: '028234-5678',
          perm_subdivision: 'Sta. Mesa Heights', perm_barangay: 'Brgy. Sta. Mesa', perm_city: 'Manila', perm_province: 'Metro Manila (NCR)', perm_zip: '1016',
          perm_email: 'roberto.mendoza@yahoo.com', perm_tin: '456-789-012',
          pres_unit: 'Unit 3B', pres_street: 'Ortigas Ave', pres_employee_id: 'EMP-2022-001', pres_nature_of_work: 'Permanent',
          pres_subdivision: 'Wack-Wack Village', pres_barangay: 'Brgy. Wack-Wack', pres_city: 'Mandaluyong', pres_province: 'Metro Manila (NCR)', pres_zip: '1550',
          pres_sss_gsis: '34-5678901-2', pres_business_tel: '026321-9999',
          employer_name: 'Manila Electric Company', date_of_employment: '06/01/2015',
          desired_loan_amount: '50000', loan_amount_type: 'Others (specify in Desired Amount)',
          employer_address_line: 'Ortigas Ave', source_of_fund: 'Provident Fund',
          employer_subdivision: 'Wack-Wack', employer_barangay: 'Brgy. Wack-Wack', employer_city: 'Mandaluyong', employer_province: 'Metro Manila (NCR)', employer_zip: '1550',
          loan_purpose: 'Educational Expenses',
          beneficiary_last: 'MENDOZA', beneficiary_first: 'LORNA', beneficiary_ext: 'N/A', beneficiary_middle: 'SANTOS',
          student_id_no: '2024-STU-001234', loan_term: '24 months',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          mid_no: '1111222233 34', application_no: 'APP-2026-003456',
          last_name: 'GARCIA', first_name: 'PATRICIA ANN', ext_name: 'N/A', middle_name: 'REYES', no_maiden_middle_name: '',
          dob: '03/18/1992', place_of_birth: 'Cebu City, Cebu', mothers_maiden_name: 'REYES, LINDA SANTOS',
          sex: 'Female', marital_status: 'Single/Unmarried', citizenship: 'Filipino', nationality: 'Filipino',
          perm_unit: 'Unit 2A', perm_street: 'Aurora Blvd', perm_cell_phone: '09162223333', perm_home_tel: '',
          perm_subdivision: '', perm_barangay: 'Brgy. Cubao', perm_city: 'Quezon City', perm_province: 'Metro Manila (NCR)', perm_zip: '1109',
          perm_email: 'p.garcia@work.com', perm_tin: '789-012-345',
          pres_unit: '', pres_street: 'Ortigas Center', pres_employee_id: 'BD-2023-9876', pres_nature_of_work: 'Regular',
          pres_subdivision: '', pres_barangay: 'Ortigas', pres_city: 'Pasig', pres_province: 'Metro Manila (NCR)', pres_zip: '1605',
          pres_sss_gsis: '11-2345678-9', pres_business_tel: '028840-7000',
          employer_name: 'BDO Unibank Inc', date_of_employment: '01/15/2019',
          desired_loan_amount: '30000', loan_amount_type: 'Others (specify in Desired Amount)',
          employer_address_line: 'BDO Corporate Center, Ortigas', source_of_fund: 'Provident Fund',
          employer_subdivision: '', employer_barangay: 'Ortigas', employer_city: 'Pasig', employer_province: 'Metro Manila (NCR)', employer_zip: '1605',
          loan_purpose: 'Medical Expenses',
          beneficiary_last: 'GARCIA', beneficiary_first: 'ELENA', beneficiary_ext: 'N/A', beneficiary_middle: 'REYES',
          student_id_no: '', loan_term: '12 months',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // Full — all fields
          mid_no: '3333444455 56', application_no: 'APP-2026-007890',
          last_name: 'VILLANUEVA', first_name: 'CARLO MIGUEL', ext_name: 'Jr.', middle_name: 'NAVARRO', no_maiden_middle_name: '',
          dob: '11/25/1987', place_of_birth: 'Davao City, Davao del Sur', mothers_maiden_name: 'NAVARRO, ROSA DELA CRUZ',
          sex: 'Male', marital_status: 'Married', citizenship: 'Filipino', nationality: 'Filipino',
          perm_unit: 'House 12', perm_street: 'Sampaguita St', perm_cell_phone: '09177778888', perm_home_tel: '0822234567',
          perm_subdivision: 'Greenfield Subdivision', perm_barangay: 'Brgy. Mintal', perm_city: 'Davao City', perm_province: 'Davao del Sur', perm_zip: '8023',
          perm_email: 'carlo.villanueva@corp.ph', perm_tin: '321-654-987',
          pres_unit: '', pres_street: 'Torres St', pres_employee_id: 'EMP-CORP-0001', pres_nature_of_work: 'Permanent',
          pres_subdivision: 'Bajada Commercial', pres_barangay: 'Brgy. Bajada', pres_city: 'Davao City', pres_province: 'Davao del Sur', pres_zip: '8000',
          pres_sss_gsis: '34-1122334-5', pres_business_tel: '0822345678',
          employer_name: 'Southern Philippine Bank', date_of_employment: '03/01/2012',
          desired_loan_amount: '80000', loan_amount_type: 'Others (specify in Desired Amount)',
          employer_address_line: 'Magsaysay Ave', source_of_fund: 'Savings',
          employer_subdivision: 'Poblacion District', employer_barangay: 'Brgy. Poblacion', employer_city: 'Davao City', employer_province: 'Davao del Sur', employer_zip: '8000',
          loan_purpose: 'Healthcare Plan from accredited HMO',
          beneficiary_last: 'VILLANUEVA', beneficiary_first: 'DIANA ROSE', beneficiary_ext: 'N/A', beneficiary_middle: 'NAVARRO',
          student_id_no: '', loan_term: '36 months',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── Pag-IBIG SLF-065 (Multi-Purpose Loan) ───────────────────────────
      'pagibig-slf-065': [
        {
          mid_no: '555566667777', application_no: '',
          last_name: 'GARCIA', first_name: 'PATRICIA ANN', ext_name: 'N/A', middle_name: 'REYES', no_maiden_middle_name: '',
          dob: '03/18/1992', place_of_birth: 'Quezon City, Metro Manila', mothers_maiden_name: 'REYES, LINDA SANTOS',
          nationality: 'Filipino', sex: 'Female', marital_status: 'Single/Unmarried', citizenship: 'Filipino',
          email: 'p.garcia@work.com',
          perm_unit: 'Unit 2A', perm_cell_phone: '09162223333', perm_home_tel: '',
          perm_street: 'Aurora Blvd', perm_subdivision: '', perm_barangay: 'Brgy. Cubao', perm_city: 'Quezon City', perm_province: 'Metro Manila (NCR)', perm_zip: '1109',
          perm_tin: '789-012-345', perm_sss_gsis: '11-2345678-9',
          pres_unit: '', pres_business_tel: '028840-7000', pres_nature_of_work: 'Regular',
          pres_street: 'BDO Corporate Center Ortigas', pres_subdivision: '', pres_barangay: 'Ortigas', pres_city: 'Pasig', pres_province: 'Metro Manila (NCR)', pres_zip: '1605',
          loan_term: '24 months', desired_loan_amount: '80000',
          employer_name: 'BDO Unibank Inc', loan_purpose: 'Healthcare Plan from accredited HMO',
          employer_address_line: 'BDO Corporate Center, Ortigas', employer_subdivision: '', employer_barangay: 'Ortigas', employer_city: 'Pasig', employer_province: 'Metro Manila (NCR)', employer_zip: '1605',
          employee_id_no: 'BD-2023-9876', date_of_employment: '01/15/2019',
          source_of_fund: 'Provident Fund', payroll_bank_name: 'BDO Unibank — Ortigas Branch',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          mid_no: '888899990001', application_no: 'APP-2026-011234',
          last_name: 'TORRES', first_name: 'MARIO JOSE', ext_name: 'N/A', middle_name: 'DELA VEGA', no_maiden_middle_name: '',
          dob: '09/25/1985', place_of_birth: 'Cebu City, Cebu', mothers_maiden_name: 'DELA VEGA, CARLA SANTOS',
          nationality: 'Filipino', sex: 'Male', marital_status: 'Married', citizenship: 'Filipino',
          email: 'mario.torres@cebu.ph',
          perm_unit: 'House 3', perm_cell_phone: '09221112222', perm_home_tel: '0322345678',
          perm_street: '12 Sampaguita St', perm_subdivision: 'Cebu Village', perm_barangay: 'Brgy. Camputhaw', perm_city: 'Cebu City', perm_province: 'Cebu', perm_zip: '6000',
          perm_tin: '654-321-098', perm_sss_gsis: '34-9876543-2',
          pres_unit: '', pres_business_tel: '0322234567', pres_nature_of_work: 'Regular',
          pres_street: 'Jones Ave', pres_subdivision: '', pres_barangay: 'Brgy. Kamputhaw', pres_city: 'Cebu City', pres_province: 'Cebu', pres_zip: '6000',
          loan_term: '36 months', desired_loan_amount: '120000',
          employer_name: 'Cebu Pacific Air', loan_purpose: 'Healthcare Plan from accredited HMO',
          employer_address_line: 'MIA Road, Pasay City', employer_subdivision: '', employer_barangay: 'Brgy. 183', employer_city: 'Pasay', employer_province: 'Metro Manila (NCR)', employer_zip: '1300',
          employee_id_no: 'CEB-2018-4567', date_of_employment: '06/01/2018',
          source_of_fund: 'Savings', payroll_bank_name: 'BPI — Cebu City Branch',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // Full — all fields
          mid_no: '111122223334', application_no: 'APP-2026-099999',
          last_name: 'NAVARRO', first_name: 'DIANA ROSE', ext_name: 'N/A', middle_name: 'ESPIRITU', no_maiden_middle_name: '',
          dob: '04/12/1979', place_of_birth: 'Davao City, Davao del Sur', mothers_maiden_name: 'ESPIRITU, NORA SANTOS',
          nationality: 'Filipino', sex: 'Female', marital_status: 'Married', citizenship: 'Filipino',
          email: 'diana.navarro@southbank.ph',
          perm_unit: 'Unit 4C', perm_cell_phone: '09257778888', perm_home_tel: '0822227777',
          perm_street: '100 Sampaguita Ave', perm_subdivision: 'Poblacion Heights', perm_barangay: 'Brgy. Poblacion', perm_city: 'Davao City', perm_province: 'Davao del Sur', perm_zip: '8000',
          perm_tin: '321-654-099', perm_sss_gsis: '34-9876543-9',
          pres_unit: '', pres_business_tel: '0822234560', pres_nature_of_work: 'Permanent',
          pres_street: 'Magsaysay Ave', pres_subdivision: '', pres_barangay: 'Brgy. Poblacion', pres_city: 'Davao City', pres_province: 'Davao del Sur', pres_zip: '8000',
          loan_term: '48 months', desired_loan_amount: '200000',
          employer_name: 'Southern Philippine Bank', loan_purpose: 'Healthcare Plan from accredited HMO',
          employer_address_line: 'Magsaysay Ave, Davao City', employer_subdivision: '', employer_barangay: 'Brgy. Poblacion', employer_city: 'Davao City', employer_province: 'Davao del Sur', employer_zip: '8000',
          employee_id_no: 'SPB-2005-00123', date_of_employment: '03/01/2005',
          source_of_fund: 'Provident Fund', payroll_bank_name: 'Southern Philippine Bank — Main Branch',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── Pag-IBIG HLF-868 (HEAL Co-Borrower) ─────────────────────────────
      'pagibig-hlf-868': [
        {
          mid_no: '333344445555', housing_account_no: 'HL-2024-000123',
          last_name: 'TORRES', first_name: 'MARK CHRISTIAN', ext_name: 'N/A', middle_name: 'DELA VEGA', maiden_middle_name: '',
          dob: '09/25/1983', citizenship: 'Filipino', proportionate_share: '50',
          perm_unit: '', perm_street: '12 Sampaguita St', perm_subdivision: 'Primavera Residences', perm_barangay: 'Brgy. Sta. Cruz', perm_city: 'Antipolo', perm_province: 'Rizal', perm_zip: '1870',
          perm_country_tel: '', perm_home_tel: '028123-4567',
          pres_unit: '', pres_street: '12 Sampaguita St', pres_subdivision: 'Primavera Residences', pres_barangay: 'Brgy. Sta. Cruz', pres_city: 'Antipolo', pres_province: 'Rizal', pres_zip: '1870',
          pres_business_tel: '028765-4321', pres_cellphone: '09221112222',
          email_address: 'm.torres@email.com', years_stay_present: '5',
          tin: '789-012-345', sss_gsis: '34-9876543-1',
          occupation: 'Civil Engineer', employer_name: 'Torres Construction Inc',
          employer_address_line: 'EDSA cor Shaw Blvd', employer_subdivision: 'Wack-Wack', employer_barangay: 'Brgy. Wack-Wack', employer_city: 'Mandaluyong', employer_province: 'Metro Manila (NCR)', employer_zip: '1550',
          employer_business_tel: '026321-1111', employer_email: 'hr@torrresconstruction.ph',
          position_dept: 'Senior Engineer / Engineering Dept', preferred_time_contact: '9:00 AM - 5:00 PM',
          place_assignment: 'Mandaluyong Main Office', years_employment: '8', no_dependents: '2',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          mid_no: '666677778888', housing_account_no: '',
          last_name: 'FLORES', first_name: 'JOSE RAMON', ext_name: 'Jr.', middle_name: 'ABAD', maiden_middle_name: '',
          dob: '12/01/1980', citizenship: 'Filipino', proportionate_share: '30',
          perm_unit: 'Unit 5A', perm_street: 'Magnolia St', perm_subdivision: 'Valle Verde', perm_barangay: 'Brgy. Ugong', perm_city: 'Pasig', perm_province: 'Metro Manila (NCR)', perm_zip: '1604',
          perm_country_tel: '', perm_home_tel: '027234-5678',
          pres_unit: 'Unit 5A', pres_street: 'Magnolia St', pres_subdivision: 'Valle Verde', pres_barangay: 'Brgy. Ugong', pres_city: 'Pasig', pres_province: 'Metro Manila (NCR)', pres_zip: '1604',
          pres_business_tel: '027222-3333', pres_cellphone: '09335556666',
          email_address: 'jr.flores@email.ph', years_stay_present: '3',
          tin: '321-654-099', sss_gsis: '11-9876543-0',
          occupation: 'IT Manager', employer_name: 'TechPH Solutions Inc',
          employer_address_line: 'E. Rodriguez Jr. Ave', employer_subdivision: 'Bagumbayan', employer_barangay: 'Brgy. Bagumbayan', employer_city: 'Quezon City', employer_province: 'Metro Manila (NCR)', employer_zip: '1110',
          employer_business_tel: '028765-9999', employer_email: 'hr@techph.com',
          position_dept: 'IT Manager / Technology Dept', preferred_time_contact: '8:00 AM - 5:00 PM',
          place_assignment: 'Quezon City Head Office', years_employment: '6', no_dependents: '1',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // Full — all fields
          mid_no: '999900001112', housing_account_no: 'HL-2025-004567',
          last_name: 'REYES', first_name: 'MARIA THERESA', ext_name: 'N/A', middle_name: 'SANTOS', maiden_middle_name: 'VILLANUEVA',
          dob: '06/15/1988', citizenship: 'Filipino', proportionate_share: '50',
          perm_unit: 'Lot 12 Block 5', perm_street: 'Rosal Street', perm_subdivision: 'Greenfield Subdivision', perm_barangay: 'Brgy. San Isidro', perm_city: 'Antipolo', perm_province: 'Rizal', perm_zip: '1870',
          perm_country_tel: '63-2-8123-4567', perm_home_tel: '028123-4567',
          pres_unit: 'Torre de Manila Unit 304', pres_street: 'Pablo Ocampo Avenue', pres_subdivision: 'Malate', pres_barangay: 'Brgy. 708 Zone 77', pres_city: 'Manila', pres_province: 'Metro Manila (NCR)', pres_zip: '1004',
          pres_business_tel: '027234-5678', pres_cellphone: '09171234567',
          email_address: 'mtheresa.reyes@globalbank.ph', years_stay_present: '2',
          tin: '456-789-012', sss_gsis: '34-1122334-5',
          occupation: 'Branch Manager', employer_name: 'Global Bank Philippines',
          employer_address_line: 'GT Tower, Ayala Avenue', employer_subdivision: 'Makati Central Business District', employer_barangay: 'Brgy. San Lorenzo', employer_city: 'Makati City', employer_province: 'Metro Manila (NCR)', employer_zip: '1223',
          employer_business_tel: '028888-8888', employer_email: 'hr@globalbank.ph',
          position_dept: 'Branch Manager / Retail Banking', preferred_time_contact: '8:00 AM - 6:00 PM',
          place_assignment: 'Makati Main Branch', years_employment: '10', no_dependents: '3',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── Pag-IBIG HLF-858 (HEAL Principal Borrower) ──────────────────────
      'pagibig-hlf-858': [
        {
          mid_no: '111122223333', housing_account_no: 'HL-2024-001111',
          desired_loan_amount: '3000000',
          last_name: 'FLORES', first_name: 'CARMEN', ext_name: 'N/A', middle_name: 'ABAD', maiden_middle_name: 'SANTOS',
          dob: '12/01/1975', citizenship: 'Filipino', no_dependents: '2',
          perm_unit: '', perm_street: '56 Magnolia St', perm_subdivision: 'Valle Verde', perm_barangay: 'Brgy. Kapasigan', perm_city: 'Pasig', perm_province: 'Metro Manila (NCR)', perm_zip: '1600',
          perm_country_tel: '', perm_home_tel: '027234-1111', perm_business_tel: '027234-2222',
          pres_unit: '', pres_street: '56 Magnolia St', pres_subdivision: 'Valle Verde', pres_barangay: 'Brgy. Kapasigan', pres_city: 'Pasig', pres_province: 'Metro Manila (NCR)', pres_zip: '1600',
          pres_cellphone: '09235556666', email_address: 'c.flores@business.ph', years_stay_present: '7',
          occupation: 'Accountant', tin: '321-654-987', sss_gsis: '34-0000001-2',
          employer_business_tel: '028840-1234', employer_name: 'Metrobank',
          employer_address_line: 'Metrobank Plaza, Gil Puyat Ave', employer_subdivision: '', employer_barangay: 'Brgy. Bel-Air', employer_city: 'Makati City', employer_province: 'Metro Manila (NCR)', employer_zip: '1209',
          employer_email: 'hr@metrobank.com.ph',
          position_dept: 'Senior Accountant / Finance Division', preferred_time_contact: '9:00 AM - 5:00 PM',
          place_assignment: 'Makati Head Office', years_employment: '10',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          mid_no: '444455556667', housing_account_no: '',
          desired_loan_amount: '1500000',
          last_name: 'AQUINO', first_name: 'ELENA GRACE', ext_name: 'N/A', middle_name: 'CRUZ', maiden_middle_name: 'SANTOS',
          dob: '11/30/1987', citizenship: 'Filipino', no_dependents: '3',
          perm_unit: '', perm_street: '22 Colon St', perm_subdivision: '', perm_barangay: 'Brgy. Kamputhaw', perm_city: 'Cebu City', perm_province: 'Cebu', perm_zip: '6000',
          perm_country_tel: '', perm_home_tel: '0322345678', perm_business_tel: '',
          pres_unit: '', pres_street: '22 Colon St', pres_subdivision: '', pres_barangay: 'Brgy. Kamputhaw', pres_city: 'Cebu City', pres_province: 'Cebu', pres_zip: '6000',
          pres_cellphone: '09198887777', email_address: 'elena.aquino@cebu.ph', years_stay_present: '4',
          occupation: 'Nurse', tin: '456-789-123', sss_gsis: '34-8765432-0',
          employer_business_tel: '0322234567', employer_name: 'Cebu Doctor\'s University Hospital',
          employer_address_line: 'Osmeña Blvd', employer_subdivision: '', employer_barangay: 'Brgy. Capitol Site', employer_city: 'Cebu City', employer_province: 'Cebu', employer_zip: '6000',
          employer_email: 'hr@cduhosp.ph',
          position_dept: 'Registered Nurse / ICU Dept', preferred_time_contact: '8:00 AM - 4:00 PM',
          place_assignment: 'Cebu City Main Campus', years_employment: '5',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // Full — all fields
          mid_no: '777788889990', housing_account_no: 'HL-2023-009999',
          desired_loan_amount: '6000000',
          last_name: 'REYES', first_name: 'MARIA THERESA', ext_name: 'N/A', middle_name: 'SANTOS', maiden_middle_name: 'VILLANUEVA',
          dob: '06/15/1988', citizenship: 'Filipino', no_dependents: '2',
          perm_unit: 'Lot 12 Block 5', perm_street: 'Rosal Street', perm_subdivision: 'Greenfield Subdivision', perm_barangay: 'Brgy. San Isidro', perm_city: 'Antipolo', perm_province: 'Rizal', perm_zip: '1870',
          perm_country_tel: '63-2-8123-4567', perm_home_tel: '028123-4567', perm_business_tel: '028888-8888',
          pres_unit: 'Torre de Manila Unit 304', pres_street: 'Pablo Ocampo Avenue', pres_subdivision: 'Malate', pres_barangay: 'Brgy. 708 Zone 77', pres_city: 'Manila', pres_province: 'Metro Manila (NCR)', pres_zip: '1004',
          pres_cellphone: '09171234567', email_address: 'mtheresa.reyes@globalbank.ph', years_stay_present: '2',
          occupation: 'Branch Manager', tin: '456-789-012', sss_gsis: '34-1122334-5',
          employer_business_tel: '028888-8888', employer_name: 'Global Bank Philippines',
          employer_address_line: 'GT Tower, Ayala Avenue', employer_subdivision: 'Makati Central Business District', employer_barangay: 'Brgy. San Lorenzo', employer_city: 'Makati City', employer_province: 'Metro Manila (NCR)', employer_zip: '1223',
          employer_email: 'hr@globalbank.ph',
          position_dept: 'Branch Manager / Retail Banking', preferred_time_contact: '8:00 AM - 6:00 PM',
          place_assignment: 'Makati Main Branch', years_employment: '10',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── Pag-IBIG HLF-068 (Housing Loan Application) ─────────────────────
      'pagibig-hlf-068': [
        {
          mid_no: '888899990000', housing_account_no: '',
          desired_loan_amount: '6000000',
          existing_housing_application: 'No',
          loan_purpose: 'Purchase of a residential house and lot/townhouse',
          loan_term: '20', mode_of_payment: 'Salary deduction',
          property_type: 'Single Detached', property_mortgaged: 'No', offsite_collateral: 'No',
          sex: 'Male', marital_status: 'Married',
          home_ownership: 'Owned', employment_type: 'Employed',
          last_name: 'NAVARRO', first_name: 'DANIEL JOSE', ext_name: 'N/A', middle_name: 'RICO',
          citizenship: 'Filipino', dob: '06/20/1979',
          perm_unit: '', perm_street: '100 Sampaguita Ave', perm_subdivision: 'Poblacion Heights', perm_barangay: 'Brgy. Poblacion', perm_city: 'Davao City', perm_province: 'Davao del Sur', perm_zip: '8000',
          pres_unit: '', pres_street: '100 Sampaguita Ave', pres_subdivision: 'Poblacion Heights', pres_barangay: 'Brgy. Poblacion', pres_city: 'Davao City', pres_province: 'Davao del Sur', pres_zip: '8000',
          pres_cellphone: '09257778888', email_address: 'd.navarro@corp.com', years_stay_present: '10',
          sss_gsis: '34-9876543-1', employer_name: 'Southern Philippine Bank', tin: '654-321-098',
          employer_address_line: 'Magsaysay Ave', occupation: 'Bank Manager',
          employer_subdivision: '', employer_barangay: 'Brgy. Poblacion', employer_city: 'Davao City', employer_province: 'Davao del Sur', employer_zip: '8000',
          position_dept: 'Manager / Branch Banking', years_employment: '15',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          mid_no: '222233334445', housing_account_no: 'HL-2022-004567',
          desired_loan_amount: '3500000',
          existing_housing_application: 'Yes',
          loan_purpose: 'Refinancing of an existing housing loan',
          loan_term: '15', mode_of_payment: 'Over-the-Counter',
          property_type: 'Condominium', property_mortgaged: 'Yes', offsite_collateral: 'No',
          sex: 'Male', marital_status: 'Married',
          home_ownership: 'Mortgaged', employment_type: 'Employed',
          last_name: 'REYES', first_name: 'PEDRO JOSE', ext_name: 'Sr.', middle_name: 'SANTOS',
          citizenship: 'Filipino', dob: '05/10/1976',
          perm_unit: 'Blk 3 Lot 8', perm_street: 'Acacia Ave', perm_subdivision: 'Ayala Alabang Village', perm_barangay: 'Brgy. Ayala Alabang', perm_city: 'Muntinlupa', perm_province: 'Metro Manila (NCR)', perm_zip: '1780',
          pres_unit: 'Blk 3 Lot 8', pres_street: 'Acacia Ave', pres_subdivision: 'Ayala Alabang Village', pres_barangay: 'Brgy. Ayala Alabang', pres_city: 'Muntinlupa', pres_province: 'Metro Manila (NCR)', pres_zip: '1780',
          pres_cellphone: '09191234567', email_address: 'p.reyes@mnlcorp.com', years_stay_present: '8',
          sss_gsis: '11-1234567-8', employer_name: 'Manila Corporation', tin: '123-456-789',
          employer_address_line: 'Ayala Ave', occupation: 'Operations Director',
          employer_subdivision: 'Ayala Triangle', employer_barangay: 'Brgy. Legazpi Village', employer_city: 'Makati City', employer_province: 'Metro Manila (NCR)', employer_zip: '1226',
          position_dept: 'Operations Director / Corporate Affairs', years_employment: '18',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // Full — all fields
          mid_no: '111122223334', housing_account_no: 'HL-2024-010101',
          desired_loan_amount: '8000000',
          last_name: 'DELA VEGA', first_name: 'MARIA CARLA', ext_name: 'N/A', middle_name: 'TORRES',
          citizenship: 'Filipino', dob: '09/30/1981',
          perm_unit: 'House 5 Block 3', perm_street: 'Ilang-Ilang Street', perm_subdivision: 'Filinvest East', perm_barangay: 'Brgy. San Isidro', perm_city: 'Cainta', perm_province: 'Rizal', perm_zip: '1900',
          pres_unit: 'Unit 22A', pres_street: 'Annapolis St', pres_subdivision: 'Greenhills', pres_barangay: 'Brgy. Addition Hills', pres_city: 'San Juan', pres_province: 'Metro Manila (NCR)', pres_zip: '1500',
          pres_cellphone: '09178889990', email_address: 'carla.delavega@ph-corp.com', years_stay_present: '3',
          sss_gsis: '34-5566778-9', employer_name: 'PhilCorp Global Inc',
          tin: '654-999-333', employer_address_line: 'Emerald Ave, Ortigas Center', occupation: 'CFO',
          employer_subdivision: 'Ortigas Center', employer_barangay: 'Brgy. San Antonio', employer_city: 'Pasig', employer_province: 'Metro Manila (NCR)', employer_zip: '1605',
          position_dept: 'Chief Financial Officer / Finance', years_employment: '12',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],
    };

    const samples = samplesBySlug[slug] ?? hqpSamples;
    const idx = sampleIndex !== undefined ? sampleIndex % samples.length : Math.floor(Math.random() * samples.length);
    const pick = samples[idx];
    setValues(pick as Record<string, string>);
    setCurrentStep(0);
    saveDraft(slug, pick as Record<string, string>);
    setShowSamplePicker(false);
  }

  // ── Blank PDF viewer helpers ──────────────────────────────────────────────
  const renderBlankPage = useCallback(async (doc: any, pageNum: number, zoom: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setBlankPdfLoading(true);
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom * 2.0 }); // ×2 for retina clarity
      const canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx as never, viewport }).promise;
      setBlankPdfCanvas(canvas.toDataURL('image/jpeg', 0.92));
    } finally {
      setBlankPdfLoading(false);
    }
  }, []);

  async function handleOpenBlankViewer() {
    if (blankPdfDocRef.current) {
      setBlankPdfPage(1);
      setShowBlankViewer(true);
      await renderBlankPage(blankPdfDocRef.current, 1, blankPdfZoom);
      return;
    }
    setBlankPdfCanvas('');
    setBlankPdfLoading(true);
    setShowBlankViewer(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      const doc = await pdfjsLib.getDocument(`/forms/${encodeURIComponent(form!.pdfPath)}`).promise;
      blankPdfDocRef.current = doc;
      setBlankPdfTotal(doc.numPages);
      setBlankPdfPage(1);
      await renderBlankPage(doc, 1, blankPdfZoom);
    } catch (err) {
      console.error('Blank PDF load error:', err);
      setShowBlankViewer(false);
    } finally {
      setBlankPdfLoading(false);
    }
  }

  // ── Preview in PDF: generate PDF locally → render page 1 as image with watermark ──
  async function handlePreviewInPDF() {
    setPreviewing(true);
    try {
      // Local Mode v2.0: generate the PDF entirely in the browser using the
      // pre-cached form template. No personal data is sent to the server.
      const sourceBytes = await fetchFormTemplateBytes(form!.pdfPath);
      const pdfBytes = await generatePDF(form!, values, sourceBytes);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

      // Render PDF page 1 to canvas
      const arrayBuffer = await blob.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      const npdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const page = await npdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx as never, viewport }).promise;

      // Apply tiled watermark
      const fSize = Math.max(22, Math.round(canvas.width / 11));
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = '#1d4ed8';
      ctx.font = `bold ${fSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const gapY = fSize * 3.8;
      const gapX = canvas.width * 0.55;
      for (let row = -1; row * gapY < canvas.height + gapY; row++) {
        for (let col = -1; col * gapX < canvas.width + gapX; col++) {
          ctx.save();
          ctx.translate(
            col * gapX + (row % 2 === 0 ? 0 : gapX / 2),
            row * gapY
          );
          ctx.rotate(-Math.PI / 6);
          ctx.fillText('QuickFormsPH', 0, 0);
          if (isDemoMode) {
            ctx.font = `bold ${Math.round(fSize * 0.65)}px Arial, sans-serif`;
            ctx.fillText('Demo', 0, fSize * 0.9);
            ctx.font = `bold ${fSize}px Arial, sans-serif`;
          }
          ctx.restore();
        }
      }
      ctx.restore();

      setPreviewImageUrl(canvas.toDataURL('image/jpeg', 0.92));
      setMode('preview');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Could not generate preview.';
      alert(msg + '\n\nPlease try again.');
    } finally {
      setPreviewing(false);
    }
  }

  // ── Local download (v2.0): generate PDF in-browser + save Blob ──────────
  // Replaces the legacy server-side `/api/payment/confirm` flow. Payment is
  // already verified at Step 0 (PaymentGate) so this requires no network.
  async function handleLocalDownload() {
    if (!form) return;
    try {
      const sourceBytes = await fetchFormTemplateBytes(form.pdfPath);
      const pdfBytes = await generatePDF(form, values, sourceBytes);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      const firstName = (values.first_name ?? '').trim();
      const lastName  = (values.last_name  ?? '').trim();
      const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Applicant';
      const safeName  = fullName
        .replace(/[\u0000-\u001F\u007F-\uFFFF]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase() || 'Applicant';

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${safeName} - ${form.agency} - ${form.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      setShowSuccessModal(true);
    } catch (err) {
      console.error('[local-download]', err);
      alert('Could not generate PDF. Please try again.');
    }
  }

  // ── Payment confirmed → generate final PDF + return 5-digit code ──────────
  // (LEGACY v1.0 — kept for reference; no longer wired in v2.0.)
  async function handlePaymentConfirm(meta: { refNo: string | null; ocrAmount: number | null }) {
    if (!form) return;
    const res = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, values, refNo: meta.refNo, amount: meta.ocrAmount ?? 5 }),
    });
    if (!res.ok) throw new Error('PDF generation failed');

    const code    = res.headers.get('X-Download-Code') ?? '';
    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const firstName = (values.first_name ?? '').trim();
    const lastName  = (values.last_name  ?? '').trim();
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Applicant';
    const safeName  = fullName.replace(/[\u0000-\u001F\u007F-\uFFFF]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
    const a    = document.createElement('a');
    a.href     = blobUrl;
    a.download = `${safeName} - ${form.agency} - ${form.code}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    // Save code to localStorage so home page download widget auto-populates
    try {
      localStorage.setItem('qfph_last_code', JSON.stringify({
        code,
        expires_at: Date.now() + 2 * 24 * 60 * 60 * 1000,
      }));
    } catch { /* ignore */ }

    setDownloadCode(code);
    setShowPaymentModal(false);
    setShowSuccessModal(true);
    clearDraft(slug);
  }

  function handleResumeDraft() {
    if (pendingDraft) {
      setValues(pendingDraft);
    }
    setPendingDraft(null);
    setDraftModalOpen(false);
  }

  function handleDiscardDraft() {
    clearDraft(slug);
    setPendingDraft(null);
    setDraftModalOpen(false);
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <div className="text-5xl mb-4">🤔</div>
          <h2 className="text-lg font-semibold text-gray-900">Form not found</h2>
          <p className="text-sm text-gray-500 mt-2">
            The form <code className="bg-gray-100 px-1 rounded">{slug}</code> does not exist yet.
          </p>
          <button
            className="btn-primary mt-5"
            onClick={() => router.push('/')}
          >
            ← Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 0 (PaymentGate) → Step 1 (Local Mode) gate ─────────────────────
  // PaymentGate verifies a valid 48h access token; if absent it shows the
  // "Pay ₱5 to Unlock" intro screen which opens PaymentModal. Once a token
  // exists, LocalModeOverlay runs and primes offline assets. Both gates
  // short-circuit BEFORE any draft prompt or wizard content.
  if (!localModeActive) {
    return (
      <PaymentGate
        formName={form.name}
        formCode={form.code}
        onAccessGranted={(isDemo) => setIsDemoMode(isDemo)}
        renderPaymentModal={({ onSuccess, onClose }) => (
          <PaymentModal
            gcashNumber={GCASH_NUMBER}
            gcashName={GCASH_NAME}
            onTokenIssued={(t: StoredAccessToken) => onSuccess(t)}
            onClose={onClose}
          />
        )}
      >
        <LocalModeOverlay
          pdfPath={form.pdfPath}
          formName={form.name}
          formCode={form.code}
          onActivated={() => setLocalModeActive(true)}
        />
      </PaymentGate>
    );
  }

  if (draftModalOpen && pendingDraft) {
    const fieldCount = Object.values(pendingDraft).filter((v) => v.trim() !== '').length;
    return (
      <>
        <LocalModeBanner />
        <DraftResumeModal
          formName={form?.name ?? ''}
          filledCount={fieldCount}
          onResume={handleResumeDraft}
          onStartNew={handleDiscardDraft}
        />
      </>
    );
  }

  if (mode === 'review') {
    return (
      <>
        <LocalModeBanner />
        <ReviewScreen
          form={form}
          values={values}
          onEdit={(stepIdx) => {
            if (stepIdx !== undefined) setCurrentStep(stepIdx as StepIndex);
            setMode('form');
          }}
          onPreview={handlePreviewInPDF}
          previewing={previewing}
        />
      </>
    );
  }

  if (mode === 'preview') {
    return (
      <>
        <LocalModeBanner />
        <PreviewScreen
          form={form}
          imageUrl={previewImageUrl}
          isDemoMode={isDemoMode}
          onDownload={handleLocalDownload}
          onBack={() => setMode('review')}
          onCloseSession={() => {
            clearDraft(form.slug);
            router.push('/');
          }}
        />
        {showSuccessModal && (
          <SuccessCodeModal
            onDownloadAgain={handleLocalDownload}
            onClose={() => setShowSuccessModal(false)}
            onCloseSession={() => { clearDraft(form.slug); router.push('/'); }}
          />
        )}
      </>
    );
  }

  const stepDef = form.steps[currentStep];
  const stepFields = form.fields.filter((f) => f.step === currentStep + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <LocalModeBanner />
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {AGENCY_LOGO[form.agency] && (
              <Image
                src={AGENCY_LOGO[form.agency].src}
                alt={form.agency}
                width={AGENCY_LOGO[form.agency].w}
                height={AGENCY_LOGO[form.agency].h}
                className="object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="text-xs font-mono text-gray-400 truncate">{form.code}</div>
              <div className="text-xs font-medium text-gray-700 truncate">{form.name}</div>
            </div>
          </div>
          <button
            onClick={handleOpenBlankViewer}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors whitespace-nowrap"
            title="View blank PDF form"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            PDF
          </button>
          <button
            onClick={() => setMode('review')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Review
          </button>
        </div>
      </header>

      {/* Step progress bar */}
      <div className="mx-auto max-w-lg px-4 pt-4 pb-2">
        <div className="flex items-start">
          {form.steps.map((step, i) => {
            const filled = stepFilledCount(i);
            const required = stepRequiredCount(i);
            const done = filled >= required && required > 0;
            const active = i === currentStep;
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div className="flex-shrink-0 w-2 h-0.5 bg-gray-200 rounded mt-[14px]" />
                )}
                <button
                  onClick={() => setCurrentStep(i as StepIndex)}
                  className="flex flex-1 min-w-0 flex-col items-center gap-1"
                >
                  <div
                    className={`flex-shrink-0 step-dot ${
                      done ? 'step-dot-done' : active ? 'step-dot-active' : 'step-dot-idle'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium text-center leading-tight min-h-[2.5em] w-full break-words ${
                      active ? 'text-blue-700' : done ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
          {/* Connector to Review */}
          <div className="flex-shrink-0 w-2 h-0.5 bg-gray-200 rounded mt-[14px]" />
          {/* Review pseudo-step */}
          <div className="flex flex-1 min-w-0 flex-col items-center gap-1">
            <div className="flex-shrink-0 step-dot step-dot-idle">✎</div>
            <span className="text-[10px] font-medium text-gray-400 text-center leading-tight min-h-[2.5em] w-full">Review</span>
          </div>
        </div>
      </div>

      {/* Step content */}
      <main className="mx-auto max-w-lg px-4 pb-32">
        <div className="mt-2 mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Step {currentStep + 1}: {stepDef.label}
            {slug === 'hqp-pff-356' && currentStep === 2 && (
              <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
            )}
          </h2>
          {slug === 'hqp-pff-356' && currentStep === 2 && (
            <p className="text-xs text-gray-500 mt-0.5">
              Leave blank if you don&apos;t want to prefill bank info.
            </p>
          )}
        </div>

        <div className="space-y-4">
          {stepFields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.id] ?? ''}
              onChange={(v) => handleChange(field.id, v)}
            />
          ))}
        </div>

        {/* Step nav */}
        <div className="mt-8 flex gap-3">
          {currentStep > 0 && (
            <button
              className="btn-secondary flex-1"
              onClick={() => setCurrentStep((s) => (s - 1) as StepIndex)}
            >
              ← Back
            </button>
          )}
          {currentStep < form.steps.length - 1 ? (
            <button
              className="btn-primary flex-1"
              onClick={() => setCurrentStep((s) => (s + 1) as StepIndex)}
            >
              Next: {form.steps[currentStep + 1].label} →
            </button>
          ) : (
            <button
              className="btn-primary flex-1"
              onClick={() => setMode('review')}
            >
              Next: Review →
            </button>
          )}
        </div>

        {/* Progress note + sample picker */}
        <div className="mt-3 flex flex-col items-center gap-1">
          <p
            className="text-center text-xs text-gray-400 select-none"
            onClick={(e) => { if (e.shiftKey) setShowSampleButton(true); }}
          >
            {totalFilled()} of {form.fields.length} fields filled &mdash; Empty fields will be left blank on the PDF.
          </p>
          {showSampleButton && (
          <div className="relative">
            <button
              className="text-[11px] text-blue-500 hover:text-blue-700 underline underline-offset-2"
              onClick={() => setShowSamplePicker((v) => !v)}
            >
              ✦ Fill with sample data
            </button>
            {showSamplePicker && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-40 w-56 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden">
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Choose a sample</p>
                {[
                  'Sample 1 — Standard',
                  'Sample 2 — Alternate',
                  'Sample 3 — All Fields',
                ].map((label, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => autoPopulate(i)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 border-t border-gray-100"
                  onClick={() => setShowSamplePicker(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </main>

      {/* ── Blank PDF Viewer Modal ── */}
      {showBlankViewer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
          {/* Header toolbar */}
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 shrink-0 border-b border-gray-700">
            <span className="flex-1 min-w-0 text-xs font-semibold text-white truncate">{form.name}</span>

            {/* Page navigation */}
            {blankPdfTotal > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={blankPdfPage <= 1 || blankPdfLoading}
                  onClick={async () => {
                    const p = blankPdfPage - 1;
                    setBlankPdfPage(p);
                    await renderBlankPage(blankPdfDocRef.current, p, blankPdfZoom);
                  }}
                  className="rounded bg-gray-700 hover:bg-gray-600 w-7 h-7 text-sm text-white disabled:opacity-30 flex items-center justify-center transition-colors"
                >‹</button>
                <span className="text-xs text-gray-300 min-w-[4.5rem] text-center tabular-nums">
                  {blankPdfPage} / {blankPdfTotal}
                </span>
                <button
                  disabled={blankPdfPage >= blankPdfTotal || blankPdfLoading}
                  onClick={async () => {
                    const p = blankPdfPage + 1;
                    setBlankPdfPage(p);
                    await renderBlankPage(blankPdfDocRef.current, p, blankPdfZoom);
                  }}
                  className="rounded bg-gray-700 hover:bg-gray-600 w-7 h-7 text-sm text-white disabled:opacity-30 flex items-center justify-center transition-colors"
                >›</button>
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                disabled={blankPdfZoom <= 0.5 || blankPdfLoading}
                onClick={async () => {
                  const z = Math.max(0.5, +(blankPdfZoom - 0.25).toFixed(2));
                  setBlankPdfZoom(z);
                  await renderBlankPage(blankPdfDocRef.current, blankPdfPage, z);
                }}
                className="rounded bg-gray-700 hover:bg-gray-600 w-7 h-7 text-base font-bold text-white disabled:opacity-30 flex items-center justify-center transition-colors"
              >−</button>
              <button
                onClick={async () => {
                  setBlankPdfZoom(1.0);
                  await renderBlankPage(blankPdfDocRef.current, blankPdfPage, 1.0);
                }}
                disabled={blankPdfLoading}
                className="rounded bg-gray-700 hover:bg-gray-600 px-2 h-7 text-xs text-gray-200 disabled:opacity-30 tabular-nums transition-colors"
              >
                {Math.round(blankPdfZoom * 100)}%
              </button>
              <button
                disabled={blankPdfZoom >= 3.0 || blankPdfLoading}
                onClick={async () => {
                  const z = Math.min(3.0, +(blankPdfZoom + 0.25).toFixed(2));
                  setBlankPdfZoom(z);
                  await renderBlankPage(blankPdfDocRef.current, blankPdfPage, z);
                }}
                className="rounded bg-gray-700 hover:bg-gray-600 w-7 h-7 text-base font-bold text-white disabled:opacity-30 flex items-center justify-center transition-colors"
              >+</button>
            </div>

            <button
              onClick={() => setShowBlankViewer(false)}
              className="rounded bg-gray-700 hover:bg-red-700 px-3 h-7 text-xs text-white shrink-0 transition-colors"
            >✕ Close</button>
          </div>

          {/* PDF canvas area */}
          <div className="flex-1 overflow-auto bg-gray-950 flex justify-center p-4">
            {blankPdfLoading && !blankPdfCanvas ? (
              <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-sm">Loading PDF…</span>
              </div>
            ) : blankPdfCanvas ? (
              <div className="relative inline-block">
                {blankPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded z-10">
                    <div className="w-7 h-7 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={blankPdfCanvas}
                  alt={`Page ${blankPdfPage}`}
                  className="block shadow-2xl rounded max-w-full"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            ) : null}
          </div>

          {/* Bottom hint */}
          <div className="bg-gray-800 text-center py-2 text-[10px] text-gray-500 shrink-0">
            Use ‹ › to navigate pages · − % + to zoom · pinch-to-zoom works on touch devices
          </div>
        </div>
      )}

    </div>
  );
}

// ─── FieldInput ───────────────────────────────────────────────────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const isOptional = !field.required;
  const labelText = field.label;

  const commonProps = {
    id: field.id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const v = field.autoUppercase ? e.target.value.toUpperCase() : e.target.value;
      onChange(v);
    },
    placeholder: field.placeholder ?? '',
    className: field.type === 'dropdown' ? 'select-field' : field.type === 'textarea' ? 'input-field min-h-[80px] resize-none' : 'input-field',
    inputMode: field.inputMode as never,
    maxLength: field.maxLength,
    autoComplete: 'off',
  };

  return (
    <div>
      <label htmlFor={field.id} className="field-label">
        {labelText}
        {isOptional ? (
          <span className="badge-optional">(optional)</span>
        ) : (
          <span className="text-red-500 ml-0.5 text-xs">*</span>
        )}
      </label>

      {field.type === 'dropdown' ? (
        <div className="relative">
          <select {...commonProps}>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt || `— Select ${field.label} —`}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>
      ) : field.type === 'textarea' ? (
        <textarea {...commonProps} rows={3} />
      ) : (
        <input type={field.type} {...commonProps} />
      )}

      {field.hint && (
        <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
      )}
    </div>
  );
}

// ─── DraftResumeModal ────────────────────────────────────────────────────────
function DraftResumeModal({
  formName,
  filledCount,
  onResume,
  onStartNew,
}: {
  formName: string;
  filledCount: number;
  onResume: () => void;
  onStartNew: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center text-3xl mb-3">📝</div>
        <h3 className="text-base font-bold text-gray-900 text-center">Unsaved Draft Found</h3>
        <p className="mt-2 text-sm text-center text-gray-600">
          You have an unfinished <span className="font-medium">{formName}</span> with{' '}
          <span className="font-semibold text-blue-700">{filledCount} field{filledCount !== 1 ? 's' : ''}</span> already filled in.
        </p>
        <p className="mt-1 text-xs text-center text-gray-400">
          This was saved because your last PDF generation was not completed.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button className="btn-primary w-full" onClick={onResume}>
            Continue Editing
          </button>
          <button className="btn-secondary w-full" onClick={onStartNew}>
            Start New (discard draft)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  totalFilled,
  totalFields,
  onConfirm,
  onCancel,
  loading,
}: {
  totalFilled: number;
  totalFields: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const unfilled = totalFields - totalFilled;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center text-3xl mb-3">📄</div>

        <h3 className="text-base font-bold text-gray-900 text-center">Generate PDF?</h3>
        <p className="mt-2 text-sm text-center text-gray-600">
          {totalFilled} of {totalFields} fields are filled.
          {unfilled > 0 && (
            <span className="block text-amber-600 mt-1">
              {unfilled} empty {unfilled === 1 ? 'field' : 'fields'} will be left blank on the PDF.
            </span>
          )}
        </p>
        <p className="mt-2 text-xs text-center text-gray-400">
          Your saved progress will be cleared after generating.
        </p>
        <div className="mt-5 flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Generating…' : 'Generate & Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewScreen ─────────────────────────────────────────────────────────────
function ReviewScreen({
  form,
  values,
  onEdit,
  onPreview,
  previewing,
}: {
  form: FormSchema;
  values: FormValues;
  onEdit: (stepIdx?: number) => void;
  onPreview: () => void;
  previewing: boolean;
}) {
  const totalFilled = form.fields.filter((f) => (values[f.id] ?? '').trim() !== '').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            onClick={() => onEdit(2)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            ←
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {AGENCY_LOGO[form.agency] && (
              <Image
                src={AGENCY_LOGO[form.agency].src}
                alt={form.agency}
                width={AGENCY_LOGO[form.agency].w}
                height={AGENCY_LOGO[form.agency].h}
                className="object-contain flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="text-xs font-mono text-gray-400 truncate">{form.code}</div>
              <div className="text-xs font-medium text-gray-700">Review Your Entries</div>
            </div>
          </div>
          <div className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
            {totalFilled}/{form.fields.length} filled
          </div>
        </div>
      </header>

      {/* Progress — all form steps done, Review active */}
      <div className="mx-auto max-w-lg px-4 pt-4 pb-2">
        <div className="flex items-start">
          {form.steps.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="flex-shrink-0 w-2 h-0.5 bg-green-200 rounded mt-[14px]" />}
              <button onClick={() => onEdit(i)} className="flex flex-1 min-w-0 flex-col items-center gap-1">
                <div className="flex-shrink-0 step-dot step-dot-done">{i + 1}</div>
                <span className="text-[10px] font-medium text-green-600 text-center leading-tight min-h-[2.5em] w-full break-words">{step.label}</span>
              </button>
            </React.Fragment>
          ))}
          <div className="flex-shrink-0 w-2 h-0.5 bg-green-200 rounded mt-[14px]" />
          <div className="flex flex-1 min-w-0 flex-col items-center gap-1">
            <div className="flex-shrink-0 step-dot step-dot-active">✎</div>
            <span className="text-[10px] font-medium text-blue-700 text-center leading-tight min-h-[2.5em] w-full">Review</span>
          </div>
        </div>
      </div>

      {/* Field groups */}
      <div className="mx-auto max-w-lg px-4 pt-2 pb-44 space-y-4">
        <p className="text-xs text-gray-400 text-center pt-1">
          Review your entries. Tap &quot;Edit&quot; on any section to make changes.
        </p>

        {form.steps.map((step, stepIdx) => {
          const stepFields = form.fields.filter((f) => f.step === stepIdx + 1);
          const filledCount = stepFields.filter((f) => (values[f.id] ?? '').trim() !== '').length;
          return (
            <div key={stepIdx} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-800">{step.label}</span>
                  <span className="text-[10px] text-blue-400">
                    {filledCount}/{stepFields.length}
                  </span>
                </div>
                <button
                  onClick={() => onEdit(stepIdx)}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {stepFields.map((field) => {
                  const val = (values[field.id] ?? '').trim();
                  return (
                    <div
                      key={field.id}
                      className="flex items-baseline justify-between px-4 py-2.5 gap-4"
                    >
                      <span className="text-[11px] text-gray-500 w-2/5 shrink-0 leading-snug">
                        {field.label}
                      </span>
                      <span
                        className={`text-[11px] text-right leading-snug break-all ${
                          val ? 'text-gray-900 font-medium' : 'text-gray-300 italic'
                        }`}
                      >
                        {val || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6 shadow-lg">
        <div className="mx-auto max-w-lg">
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2">
          <span className="text-sm shrink-0 mt-0.5">⚠️</span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <span className="font-bold">Review carefully before proceeding.</span> Make sure all details are correct.
          </p>
        </div>
        <button
          className="w-full rounded-xl bg-blue-700 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2"
          onClick={onPreview}
          disabled={previewing}
        >
          {previewing ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating preview…
            </>
          ) : (
            '🔍 Preview in PDF'
          )}
        </button>
        </div>
      </div>
    </div>
  );
}

// ─── PreviewScreen ────────────────────────────────────────────────────────────
function PreviewScreen({
  form,
  imageUrl,
  isDemoMode,
  onDownload,
  onBack,
  onCloseSession,
}: {
  form: FormSchema;
  imageUrl: string;
  isDemoMode: boolean;
  onDownload: () => void;
  onBack: () => void;
  onCloseSession: () => void;
}) {
  const [lightbox, setLightbox] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-700"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 truncate">{form.code}</div>
          <div className="text-xs font-medium text-white">PDF Preview</div>
        </div>
        <div className={isDemoMode
          ? 'text-[10px] text-orange-400 bg-orange-400/10 border border-orange-400/30 px-2 py-1 rounded'
          : 'text-[10px] text-green-400 bg-green-400/10 border border-green-400/30 px-2 py-1 rounded'
        }>
          {isDemoMode ? '[ Demo Mode ]' : '[ Paid Version ]'}
        </div>
      </header>

      {/* Preview image */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setLightbox(true)}
            className="w-full block rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-700 active:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="PDF Preview" className="w-full block" />
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Tap to view full screen
          </p>
          <p className="text-center text-[10px] text-gray-600 mt-0.5">
            Watermark will not appear on the downloaded PDF.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 pt-3 pb-8 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="flex-1 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
          >
            ⬇️ Download PDF
          </button>
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-gray-600 py-3 text-sm text-gray-400 hover:bg-gray-800"
          >
            ← Back to Editor
          </button>
        </div>
        <button
          onClick={() => setShowCloseConfirm(true)}
          className="w-full rounded-xl py-3 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
        >
          Close Session
        </button>
      </div>

      {/* Close Session Confirmation */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">Close Session?</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              This will clear all your entered data, the current draft, and the PDF preview.
              <strong className="text-gray-900"> This cannot be undone.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onCloseSession}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Clear &amp; Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2"
          onClick={() => setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="PDF Preview" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-4 right-4 text-white text-xl bg-gray-800/80 rounded-full w-9 h-9 flex items-center justify-center"
            onClick={() => setLightbox(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PaymentModal ─────────────────────────────────────────────────────────────
type PaymentStep = 'details' | 'verifying' | 'verified' | 'failed' | 'manual_ref' | 'generating' | 'gen_failed';

const GEN_STEPS = [
  { icon: '📋', label: 'Reading form data…' },
  { icon: '🖊️', label: 'Filling in your details…' },
  { icon: '📄', label: 'Composing PDF pages…' },
  { icon: '🔒', label: 'Finalizing document…' },
  { icon: '⬇️', label: 'Almost ready…' },
];

function GeneratingScreen() {
  const [tick, setTick] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 900);
    return () => clearInterval(interval);
  }, []);

  // Smoothly animate progress up to 92% over the steps
  useEffect(() => {
    const target = Math.min(((tick + 1) / GEN_STEPS.length) * 92, 92);
    setProgress(target);
  }, [tick]);

  const activeIdx = Math.min(tick, GEN_STEPS.length - 1);

  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-col items-center gap-2 text-center py-2">
        <div className="text-3xl animate-pulse">{GEN_STEPS[activeIdx]?.icon}</div>
        <div className="text-sm font-bold text-gray-900">Generating your PDF…</div>
        <div className="text-xs text-gray-500">{GEN_STEPS[activeIdx]?.label}</div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Processing</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-1.5">
        {GEN_STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-2.5 text-xs ${
            i < activeIdx ? 'text-gray-400' : i === activeIdx ? 'text-gray-900 font-semibold' : 'text-gray-300'
          }`}>
            <span className="text-sm">{s.icon}</span>
            <span>{s.label}</span>
            {i < activeIdx && <span className="ml-auto text-green-500 font-bold">✓</span>}
            {i === activeIdx && (
              <span className="ml-auto inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 text-center">Please don't close this window…</p>
    </div>
  );
}

function PaymentModal({
  gcashNumber: gcashNumberProp,
  gcashName: gcashNameProp,
  onTokenIssued,
  onClose,
}: {
  gcashNumber: string;
  gcashName: string;
  onTokenIssued: (token: StoredAccessToken) => void;
  onClose: () => void;
}) {
  const [step, setStep]                   = useState<PaymentStep>('details');
  const [verifyErrors, setVerifyErrors]   = useState<string[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [amount] = useState<number>(5);
  const [verifiedMeta, setVerifiedMeta]   = useState<StoredAccessToken | null>(null);
  const [failCount, setFailCount]         = useState(0);
  const [manualRef, setManualRef]         = useState('');
  const [manualRefError, setManualRefError] = useState('');
  const [manualRefBusy, setManualRefBusy] = useState(false);
  const [gcashCopied, setGcashCopied]     = useState(false);
  const [qrFullscreen, setQrFullscreen]   = useState(false);
  // Live settings fetched from API (fall back to props)
  const [liveNumber, setLiveNumber] = useState(gcashNumberProp);
  const [liveName, setLiveName]     = useState(gcashNameProp);
  const [liveQrUrl, setLiveQrUrl]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/gcash-settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: { gcash_number?: string; gcash_name?: string; qr_url?: string | null } | null) => {
        if (!d) return;
        if (d.gcash_number) setLiveNumber(d.gcash_number);
        if (d.gcash_name)   setLiveName(d.gcash_name);
        setLiveQrUrl(d.qr_url ?? null);
      })
      .catch(() => { /* use prop defaults */ });
  }, []);

  const gcashNumber = liveNumber;
  const gcashName   = liveName;

  function handleOpenGcash(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    // iOS Safari requires clipboard write during direct user gesture
    const text = gcashNumber.replace(/\D/g, '');
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    } catch { fallbackCopy(text); }
    setGcashCopied(true);
  }

  function fallbackCopy(text: string) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch { /* silently skip */ }
  }

  function handleUnderstood() {
    // Open GCash app now that user has read the instructions
    window.location.href = 'gcash://';
    setGcashCopied(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotUrl(URL.createObjectURL(file));
    setStep('verifying');
    setVerifyErrors([]);

    const fd = new FormData();
    fd.append('screenshot', file);
    fd.append('amount', String(Math.max(amount, 5)));
    try {
      const res  = await fetch('/api/payment/verify-screenshot', { method: 'POST', body: fd });
      const data = await res.json() as {
        valid: boolean;
        errors: string[];
        refNo: string | null;
        ocrAmount: number | null;
        token?: string | null;
        tokenExpiresAt?: number | null;
      };
      if (data.valid && data.token && data.tokenExpiresAt && data.refNo) {
        setVerifiedMeta({
          token: data.token,
          refNo: data.refNo,
          amount: data.ocrAmount ?? 5,
          expiresAt: data.tokenExpiresAt,
        });
        setStep('verified');
      } else {
        setVerifyErrors(data.errors ?? ['Verification failed']);
        setFailCount(c => c + 1);
        setStep('failed');
      }
    } catch {
      setVerifyErrors(['Could not reach verification server. Please try again.']);
      setFailCount(c => c + 1);
      setStep('failed');
    }
  }

  function handleRetry() {
    setStep('details');
    setVerifyErrors([]);
    setScreenshotUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleManualRefInput(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 4)  formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    if (digits.length > 7)  formatted = digits.slice(0, 4) + '-' + digits.slice(4, 7) + '-' + digits.slice(7);
    setManualRef(formatted);
    setManualRefError('');
  }

  async function handleManualRefSubmit(e: React.FormEvent) {
    e.preventDefault();
    setManualRefError('');
    if (!/^\d{4}-\d{3}-\d{6}$/.test(manualRef)) {
      setManualRefError('Enter the full 13-digit ref in XXXX-XXX-XXXXXX format.');
      return;
    }
    setManualRefBusy(true);
    try {
      const res  = await fetch('/api/payment/validate-ref', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refNo: manualRef }),
      });
      const data = await res.json() as {
        valid: boolean;
        refNo?: string;
        error?: string;
        token?: string | null;
        tokenExpiresAt?: number | null;
      };
      if (data.valid && data.refNo && data.token && data.tokenExpiresAt) {
        setVerifiedMeta({
          token: data.token,
          refNo: data.refNo,
          amount: 5,
          expiresAt: data.tokenExpiresAt,
        });
        setStep('verified');
      } else {
        setManualRefError(data.error ?? 'Invalid reference number.');
      }
    } catch {
      setManualRefError('Network error. Please try again.');
    } finally {
      setManualRefBusy(false);
    }
  }

  return (
    <>
      {/* QR fullscreen overlay */}
      {qrFullscreen && liveQrUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setQrFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
            onClick={() => setQrFullscreen(false)}
          >×</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={liveQrUrl}
            alt="GCash QR Code"
            className="max-w-xs w-full rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white/70 text-xs">Tap anywhere to close</p>
        </div>
      )}

    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b7c3e] to-[#00a651] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💚</span>
              <div>
                <div className="text-white font-bold text-sm">Support QuickFormsPH</div>
              </div>
            </div>
            {step !== 'generating' && (
              <button onClick={onClose} className="text-green-200 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
            )}
          </div>
        </div>

        {/* ── STEP: details ── */}
        {step === 'details' && (
          <div className="p-5 space-y-4">
            {/* Heartfelt note */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                Built with a lot of time and effort to make it easier for Filipinos to fill out government forms. Your ₱5 or any amount above that helps cover hosting and supports future improvements. Any additional support would be greatly appreciated. Maraming salamat Po🙏
              </p>
            </div>

            {/* GCash details */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">GCash Payment Details</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Number</span>
                <span className="text-sm font-black text-gray-900 font-mono tracking-wide">{gcashNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Account Name</span>
                <span className="text-sm font-semibold text-gray-900">{gcashName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Amount</span>
                <div className="flex items-center gap-1">
                  <span className="text-base font-black text-green-700">₱</span>
                  <span className="text-base font-black text-green-700">{amount.toFixed(2)}</span>
                </div>
              </div>
              {/* QR option */}
              {liveQrUrl && (
                <button
                  onClick={() => setQrFullscreen(true)}
                  className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  📷 Or pay via QR Code — tap to view full screen
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Flip card: Open GCash → copied info */}
              <div style={{ perspective: '600px' }}>
                <div
                  style={{
                    transition: 'transform 0.5s',
                    transformStyle: 'preserve-3d',
                    transform: gcashCopied ? 'rotateX(180deg)' : 'rotateX(0deg)',
                    position: 'relative',
                    minHeight: '48px',
                  }}
                >
                  {/* Front: Open GCash button */}
                  <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                    <button
                      onClick={handleOpenGcash}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00a651] py-3 text-sm font-bold text-white hover:bg-[#008c44] transition-colors"
                    >
                      📱 Open GCash
                    </button>
                  </div>
                  {/* Back: info + Understood button that opens app */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateX(180deg)',
                      position: 'absolute',
                      inset: 0,
                    }}
                  >
                    <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800 leading-relaxed">
                      <p className="font-semibold mb-0.5">📋 Number copied!</p>
                      <p>The number <span className="font-mono font-bold">{gcashNumber}</span> has been copied. Tap <strong>Understood</strong> to open GCash, go to <strong>Send Money</strong>, and paste the number.</p>
                      <button
                        onClick={handleUnderstood}
                        className="mt-2 w-full rounded-lg bg-green-600 text-white text-xs font-bold py-1.5 hover:bg-green-700 transition-colors"
                      >
                        ✅ Understood — Open GCash
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attach screenshot */}
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 py-3 text-sm font-semibold text-blue-700 cursor-pointer transition-colors">
                📎 Attach Payment Screenshot
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <button
                onClick={onClose}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-xs text-gray-400 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: verifying ── */}
        {step === 'verifying' && (
          <VerifyingScreen screenshotUrl={screenshotUrl} />
        )}

        {/* ── STEP: generating ── */}
        {step === 'generating' && (
          <GeneratingScreen />
        )}

        {/* ── STEP: gen_failed ── */}
        {step === 'gen_failed' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="text-3xl">⚠️</div>
              <div className="text-sm font-bold text-red-700">PDF Generation Failed</div>
              <div className="text-xs text-gray-500">
                Something went wrong while generating your PDF.
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 leading-relaxed">
              Don't worry — your payment has already been verified. Please try again and your PDF will be generated. If the issue persists, contact support with your GCash Ref No.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('verified')}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: verified ── */}
        {step === 'verified' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="text-3xl">✅</div>
              <div className="text-sm font-bold text-green-700">Payment Verified!</div>
              <div className="text-xs text-gray-500 text-center">
                Your GCash receipt has been confirmed.<br />
                Salamat po ❤️ 🙏
              </div>
            </div>
            {screenshotUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={screenshotUrl} alt="Receipt" className="w-full max-h-48 object-contain rounded-xl border border-green-200" />
            )}
            <button
              onClick={() => {
                if (verifiedMeta) onTokenIssued(verifiedMeta);
              }}
              className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
            >
              → Continue to Form
            </button>
          </div>
        )}

        {/* ── STEP: failed ── */}
        {step === 'failed' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="text-3xl">❌</div>
              <div className="text-sm font-bold text-red-700">Verification Failed</div>
              <div className="text-xs text-gray-500">Your screenshot did not pass the checks below:</div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-1.5">
              {verifyErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                  <span className="shrink-0 font-bold mt-0.5">✗</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 leading-relaxed">
              Make sure the screenshot is from today&apos;s GCash payment of <strong>₱{amount.toFixed(2)}</strong> to{' '}
              <strong>{gcashNumber}</strong> and is taken immediately after paying.
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 rounded-xl bg-blue-700 hover:bg-blue-800 py-2.5 text-xs font-bold text-white"
              >
                Try Again
              </button>
            </div>
            {failCount >= 2 && (
              <button
                onClick={() => { setManualRef(''); setManualRefError(''); setStep('manual_ref'); }}
                className="w-full rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                ✏️ Enter Reference Number Instead
              </button>
            )}
          </div>
        )}

        {/* ── STEP: manual_ref ── */}
        {step === 'manual_ref' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="text-3xl">📝</div>
              <div className="text-sm font-bold text-gray-800">Enter GCash Reference No.</div>
              <div className="text-xs text-gray-500 leading-relaxed">
                Find it in your GCash receipt under <strong>Ref No.</strong>
              </div>
            </div>
            {/* Trust divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="text-[11px] text-gray-400 italic text-center leading-relaxed">
                We trust you&apos;ve completed your payment — QuickFormsPH is built on good faith. We&apos;re committed to giving you honest, reliable service every time. 🙏
              </p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 leading-relaxed">
              Enter the 13-digit reference number from your GCash receipt using dashes:{' '}
              <strong className="font-mono">XXXX-XXX-XXXXXX</strong>
            </div>
            <form onSubmit={handleManualRefSubmit} className="space-y-3">
              <div>
                <label className="field-label">GCash Ref No.</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualRef}
                  onChange={(e) => handleManualRefInput(e.target.value)}
                  placeholder="0000-000-000000"
                  maxLength={15}
                  className="input-field font-mono tracking-widest text-center text-base"
                  required
                  autoComplete="off"
                />
                {manualRefError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">✗ {manualRefError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={manualRefBusy || manualRef.length < 15}
                className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
              >
                {manualRefBusy ? '⏳ Validating…' : '✅ Validate & Proceed'}
              </button>
              <button
                type="button"
                onClick={() => setStep('failed')}
                className="w-full rounded-xl border border-gray-200 py-2 text-xs text-gray-400 hover:bg-gray-50"
              >
                ← Back
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
    </>
  );
}

// ─── VerifyingScreen ──────────────────────────────────────────────────────────
const VERIFY_STEPS = [
  { icon: '📸', label: 'Reading screenshot…' },
  { icon: '🔍', label: 'Scanning receipt text…' },
  { icon: '👤', label: 'Checking account name…' },
  { icon: '📱', label: 'Verifying mobile number…' },
  { icon: '💰', label: 'Confirming amount…' },
  { icon: '🕐', label: 'Checking transaction time…' },
  { icon: '✅', label: 'Finalizing…' },
];

const WAITING_MSGS = [
  'Still processing, hang tight…',
  'OCR is working hard…',
  'Almost there, just a moment…',
  'Taking a bit longer than usual…',
];

function VerifyingScreen({ screenshotUrl }: { screenshotUrl: string }) {
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(interval);
  }, []);

  const allDone = tick >= VERIFY_STEPS.length;
  const activeIdx = allDone ? VERIFY_STEPS.length : Math.min(tick, VERIFY_STEPS.length - 1);
  const waitingMsg = WAITING_MSGS[(tick - VERIFY_STEPS.length) % WAITING_MSGS.length] ?? WAITING_MSGS[0];

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      {/* Thumbnail */}
      {screenshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screenshotUrl}
          alt="Screenshot"
          className="w-20 rounded-xl border-2 border-blue-200 shadow-sm"
        />
      )}

      {/* Active step or extended-wait message */}
      {!allDone ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="text-2xl">{VERIFY_STEPS[activeIdx]?.icon}</div>
          <div className="text-sm font-bold text-gray-900">{VERIFY_STEPS[activeIdx]?.label}</div>
          <div className="text-[11px] text-gray-400">Verifying your GCash payment…</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="text-sm font-bold text-gray-800">{waitingMsg}</div>
          <div className="text-[11px] text-gray-400">Please don&apos;t close this window.</div>
        </div>
      )}

      {/* Step progress dots */}
      <div className="flex items-center gap-1.5">
        {VERIFY_STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              allDone || i < activeIdx
                ? 'w-2 h-2 bg-green-500'
                : i === activeIdx
                ? 'w-3 h-3 bg-blue-600 animate-pulse'
                : 'w-2 h-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Show details toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-[11px] text-blue-500 hover:text-blue-700 underline underline-offset-2"
      >
        {expanded ? 'Hide details ▲' : 'Show details ▼'}
      </button>

      {/* Expanded step list */}
      {expanded && (
        <div className="w-full space-y-1.5">
          {VERIFY_STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-300 ${
                allDone || i < activeIdx
                  ? 'bg-green-50 text-green-700'
                  : i === activeIdx
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-300'
              }`}
            >
              <span className={`text-sm ${!allDone && i > activeIdx ? 'opacity-30' : ''}`}>{s.icon}</span>
              <span>{s.label}</span>
              {(allDone || i < activeIdx) && <span className="ml-auto text-green-500 font-bold">✓</span>}
              {!allDone && i === activeIdx && (
                <span className="ml-auto">
                  <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SuccessCodeModal ─────────────────────────────────────────────────────────
function SuccessCodeModal({
  onDownloadAgain,
  onClose,
  onCloseSession,
}: {
  onDownloadAgain: () => void;
  onClose: () => void;
  onCloseSession: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
          <h3 className="text-base font-bold text-gray-900 mb-2">Close Session?</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            This will clear all your entered data, the current draft, and the PDF preview.
            <strong className="text-gray-900"> This cannot be undone.</strong>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onCloseSession}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Clear &amp; Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-700 px-5 py-5 text-center">
          <div className="text-4xl mb-1">🎉</div>
          <div className="text-white font-bold text-base">Your PDF is ready!</div>
          <div className="text-blue-200 text-xs mt-0.5">Your download has started</div>
        </div>
        {/* Body */}
        <div className="p-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            OK
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  );
}
