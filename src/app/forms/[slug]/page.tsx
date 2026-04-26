'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getFormBySlug, FormField, FormSchema } from '@/data/forms';
import { AUTOCOMPLETE_SOURCES, AutocompleteSource } from '@/data/autocomplete-sources';
import LocalModeOverlay, { LocalModeBanner } from '@/components/LocalModeOverlay';
import PaymentGate from '@/components/PaymentGate';
import { fetchFormTemplateBytes } from '@/lib/local-mode';
import type { StoredAccessToken } from '@/lib/access-token-client';
import { generatePDF } from '@/lib/pdf-generator';
import { getPdfjsLib } from '@/lib/get-pdfjs';

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
        mail_street: 'Taft Avenue', mail_subdivision: 'Ermita Heights',
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
        dep3_last_name: 'DELA CRUZ', dep3_first_name: 'PEDRO', dep3_name_ext: 'Sr.',
        dep3_middle_name: 'GARCIA', dep3_relationship: 'Father',
        dep3_dob: '06-08-1960', dep3_citizenship: 'Filipino',
        dep3_no_middle_name: '', dep3_mononym: '', dep3_disability: '',
        dep4_last_name: 'REYES', dep4_first_name: 'MARIA', dep4_name_ext: '',
        dep4_middle_name: 'SANTOS', dep4_relationship: 'Mother',
        dep4_dob: '12-20-1962', dep4_citizenship: 'Filipino',
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
        // Sample B uses mail_same_as_above='true'. Because autoPopulate sets values
        // directly (bypassing the handleChange auto-copy), we mirror perm_* into
        // mail_* explicitly so every Step 3 field shows a value in the UI.
        perm_unit: 'Unit 3A', perm_building: 'Greenfield Residences', perm_lot: 'Blk 5 Lot 7',
        perm_street: 'Mabini Street', perm_subdivision: 'Greenfield Village',
        perm_barangay: 'Brgy. Poblacion', perm_city: 'Makati City',
        perm_province: 'Metro Manila (NCR)', perm_zip: '1210',
        mail_same_as_above: 'true',
        mail_unit: 'Unit 3A', mail_building: 'Greenfield Residences', mail_lot: 'Blk 5 Lot 7',
        mail_street: 'Mabini Street', mail_subdivision: 'Greenfield Village',
        mail_barangay: 'Brgy. Poblacion', mail_city: 'Makati City',
        mail_province: 'Metro Manila (NCR)', mail_zip: '1210',
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
        dep4_last_name: 'GARCIA', dep4_first_name: 'LUCIA', dep4_name_ext: '',
        dep4_middle_name: 'VIDAL', dep4_relationship: 'Mother',
        dep4_dob: '08-10-1958', dep4_citizenship: 'Filipino',
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
        // Step 4: Dependent Info — populated with the member's on-file registered
        // dependent (his son). Even though the current claim's patient IS the member,
        // the dependent block on the printed form shows the household's first
        // registered dependent so QA can validate every field's alignment.
        patient_pin: '345678901234',
        patient_last_name: 'DELA CRUZ', patient_first_name: 'CARLO MIGUEL',
        patient_name_ext: 'N/A', patient_middle_name: 'SANTOS',
        patient_dob_month: '06', patient_dob_day: '12', patient_dob_year: '2018',
        patient_relationship: 'Child', patient_sex: 'Male',
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
        addr_unit: 'Unit 3A', addr_building: 'Greenfield Residences', addr_lot: 'Blk 5 Lot 7',
        addr_street: 'Mabini Street', addr_subdivision: 'Greenfield Village',
        addr_barangay: 'Brgy. Poblacion', addr_city: 'Makati City',
        addr_province: 'Metro Manila (NCR)', addr_country: 'Philippines', addr_zip: '1210',
        // Step 3: Contact & Patient Type
        contact_landline: '(02) 8765-4321', contact_mobile: '09281234567',
        contact_email: 'anna.santos@gmail.com',
        patient_is_member: 'No — Patient is a Dependent',
        // Step 4: Dependent (child)
        patient_pin: '112233445566',
        patient_last_name: 'SANTOS', patient_first_name: 'CLAIRE ANNE',
        patient_name_ext: 'N/A', patient_middle_name: 'GARCIA',
        patient_dob_month: '11', patient_dob_day: '02', patient_dob_year: '2010',
        patient_relationship: 'Child', patient_sex: 'Female',
        // Step 5: Employer Certification (self-employed \u2014 use her own DTI-registered
        // single proprietorship details so every field has a value for QA)
        employer_pen: '17-987654321-0', employer_contact: '(02) 8123-9876',
        employer_business_name: 'ANNA M. SANTOS DESIGN STUDIO',
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
          admission_diagnosis_1: 'Acute Appendicitis', admission_diagnosis_2: 'GENERALIZED ABDOMINAL PAIN',
          discharge_diagnosis_1: 'Appendicitis', discharge_icd10_1: 'K37', discharge_procedure_1: 'Appendectomy', discharge_rvs_1: '10060', discharge_procedure_date_1: '04/11/2026', discharge_laterality_1: 'N/A',
          discharge_diagnosis_2: '', discharge_icd10_2: '', discharge_procedure_2: '', discharge_rvs_2: '', discharge_procedure_date_2: '', discharge_laterality_2: 'N/A',
          discharge_diagnosis_3: '', discharge_icd10_3: '', discharge_procedure_3: '', discharge_rvs_3: '', discharge_procedure_date_3: '', discharge_laterality_3: 'N/A',
          discharge_diagnosis_4: '', discharge_icd10_4: '', discharge_procedure_4: '', discharge_rvs_4: '', discharge_procedure_date_4: '', discharge_laterality_4: 'N/A',
          discharge_diagnosis_5: '', discharge_icd10_5: '', discharge_procedure_5: '', discharge_rvs_5: '', discharge_procedure_date_5: '', discharge_laterality_5: 'N/A',
          discharge_diagnosis_6: '', discharge_icd10_6: '', discharge_procedure_6: '', discharge_rvs_6: '', discharge_procedure_date_6: '', discharge_laterality_6: 'N/A',
          // Special Considerations — none applied for simple appendicitis; set all 8 dropdowns to 'No' so no field is left empty.
          special_hemodialysis: 'No', special_peritoneal_dialysis: 'No', special_radiotherapy_linac: 'No', special_radiotherapy_cobalt: 'No', special_blood_transfusion: 'No', special_brachytherapy: 'No', special_chemotherapy: 'No', special_simple_debridement: 'No',
          zbenefit_package_code: '', mcp_dates: '', tbdots_intensive_phase: '', tbdots_maintenance_phase: '',
          animal_bite_arv_day1: '', animal_bite_arv_day2: '', animal_bite_arv_day3: '', animal_bite_rig: '', animal_bite_others: '',
          newborn_essential_care: '', newborn_hearing_screening: '', newborn_screening_test: '', hiv_lab_number: '',
          philhealth_benefit_first_case_rate: 'Appendectomy', philhealth_benefit_second_case_rate: '', philhealth_benefit_icd_rvs_code: 'K37 / 10060',
          hcp1_accreditation_no: 'DR-2025-01234 — DR. RICARDO GOMEZ', hcp1_date_signed_month: '04', hcp1_date_signed_day: '15', hcp1_date_signed_year: '2026', hcp1_copay: 'No co-pay on top of PhilHealth Benefit',
          hcp2_accreditation_no: '', hcp2_date_signed_month: '', hcp2_date_signed_day: '', hcp2_date_signed_year: '', hcp2_copay: '',
          hcp3_accreditation_no: '', hcp3_date_signed_month: '', hcp3_date_signed_day: '', hcp3_date_signed_year: '', hcp3_copay: '',
          total_hci_fees: '35000', total_professional_fees: '8000', grand_total: '43000',
          total_actual_charges: '43000', discount_amount: '0', philhealth_benefit_amount: '18000', amount_after_philhealth: '25000',
          hci_amount_paid_by: '25000', hci_paid_member_patient: 'Yes', hci_paid_hmo: 'No', hci_paid_others: 'No',
          pf_amount_paid_by: '8000', pf_paid_member_patient: 'Yes', pf_paid_hmo: 'No', pf_paid_others: 'No',
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
          // Special Considerations — not applicable to CAP; set all 8 dropdowns to 'No' (Z-Benefit covered separately).
          special_hemodialysis: 'No', special_peritoneal_dialysis: 'No', special_radiotherapy_linac: 'No', special_radiotherapy_cobalt: 'No', special_blood_transfusion: 'No', special_brachytherapy: 'No', special_chemotherapy: 'No', special_simple_debridement: 'No',
          zbenefit_package_code: 'CAP-MR', mcp_dates: '', tbdots_intensive_phase: '', tbdots_maintenance_phase: '',
          animal_bite_arv_day1: '', animal_bite_arv_day2: '', animal_bite_arv_day3: '', animal_bite_rig: '', animal_bite_others: '',
          newborn_essential_care: '', newborn_hearing_screening: '', newborn_screening_test: '', hiv_lab_number: '',
          philhealth_benefit_first_case_rate: 'CAP-MR', philhealth_benefit_second_case_rate: 'Hypertension Stage 2', philhealth_benefit_icd_rvs_code: 'J18.9 / I10',
          hcp1_accreditation_no: 'DR-2024-98765 — DR. ELENA REYES', hcp1_date_signed_month: '03', hcp1_date_signed_day: '28', hcp1_date_signed_year: '2026', hcp1_copay: 'No co-pay on top of PhilHealth Benefit',
          hcp2_accreditation_no: '', hcp2_date_signed_month: '', hcp2_date_signed_day: '', hcp2_date_signed_year: '', hcp2_copay: '',
          hcp3_accreditation_no: '', hcp3_date_signed_month: '', hcp3_date_signed_day: '', hcp3_date_signed_year: '', hcp3_copay: '',
          total_hci_fees: '28000', total_professional_fees: '6000', grand_total: '34000',
          total_actual_charges: '34000', discount_amount: '0', philhealth_benefit_amount: '16000', amount_after_philhealth: '18000',
          hci_amount_paid_by: '18000', hci_paid_member_patient: 'Yes', hci_paid_hmo: 'No', hci_paid_others: 'No',
          pf_amount_paid_by: '6000', pf_paid_member_patient: 'Yes', pf_paid_hmo: 'No', pf_paid_others: 'No',
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
          // Special Considerations — ESRD/HD applies + Blood Transfusion (anemia of CKD); all 8 dropdowns explicitly set.
          // FIX 2026-04-26: previous values '3' and '2' were invalid for the No/Yes dropdown.
          special_hemodialysis: 'Yes', special_peritoneal_dialysis: 'No', special_radiotherapy_linac: 'No', special_radiotherapy_cobalt: 'No', special_blood_transfusion: 'Yes', special_brachytherapy: 'No', special_chemotherapy: 'No', special_simple_debridement: 'No',
          zbenefit_package_code: 'ESRD-HD', mcp_dates: '', tbdots_intensive_phase: '', tbdots_maintenance_phase: '',
          animal_bite_arv_day1: '', animal_bite_arv_day2: '', animal_bite_arv_day3: '', animal_bite_rig: '', animal_bite_others: '',
          newborn_essential_care: '', newborn_hearing_screening: '', newborn_screening_test: '', hiv_lab_number: '',
          philhealth_benefit_first_case_rate: 'ESRD (HD)', philhealth_benefit_second_case_rate: 'Anemia of CKD', philhealth_benefit_icd_rvs_code: 'N18.6 / 90935',
          hcp1_accreditation_no: 'DR-2025-11111 — DR. JOSE MENDOZA (Nephrologist)', hcp1_date_signed_month: '02', hcp1_date_signed_day: '28', hcp1_date_signed_year: '2026', hcp1_copay: 'With co-pay on top of PhilHealth Benefit',
          hcp2_accreditation_no: 'DR-2025-22222 — DR. LINDA TAN (Endocrinologist)', hcp2_date_signed_month: '02', hcp2_date_signed_day: '28', hcp2_date_signed_year: '2026', hcp2_copay: 'With co-pay on top of PhilHealth Benefit',
          hcp3_accreditation_no: 'DR-2025-33333 — DR. ROBERTO CRUZ (Hematologist)', hcp3_date_signed_month: '02', hcp3_date_signed_day: '28', hcp3_date_signed_year: '2026', hcp3_copay: 'With co-pay on top of PhilHealth Benefit',
          total_hci_fees: '95000', total_professional_fees: '18000', grand_total: '113000',
          total_actual_charges: '113000', discount_amount: '5000', philhealth_benefit_amount: '45000', amount_after_philhealth: '63000',
          hci_amount_paid_by: '63000', hci_paid_member_patient: 'Yes', hci_paid_hmo: 'Yes', hci_paid_others: 'Yes',
          pf_amount_paid_by: '18000', pf_paid_member_patient: 'Yes', pf_paid_hmo: 'Yes', pf_paid_others: 'No',
          drug_purchase_none: '', drug_purchase_total_amount: '12500',
          diagnostic_purchase_none: '', diagnostic_purchase_total_amount: '8700',
        },
      ],

      // ── PhilHealth PMRF (Foreign National) ───────────────────────────────
      'philhealth-pmrf-foreign-natl': [
        {
          // ── Sample 1: American expat on work visa (ACR I-card),
          // Married with spouse + 1 child as dependents. SRRV blank
          // because not a retiree (ACR and SRRV are mutually exclusive
          // visa bases — same logic as BIR-1904 foreign vs Filipino). ──
          philhealth_number: '22-0000001234', acr_icard_number: 'A12345678', pra_srrv_number: '',
          last_name: 'SMITH', first_name: 'JOHN WILLIAM', middle_name: 'ANDERSON',
          sex: 'Male', nationality: 'AMERICAN', dob_month: '09', dob_day: '14', dob_year: '1982',
          civil_status: 'Married',
          philippine_address_line1: '88 LEGASPI ST, LEGASPI VILLAGE',
          philippine_address_line2: 'MAKATI CITY, METRO MANILA 1229',
          contact_phone: '+63 917 100 2020', email: 'j.smith@company.com.ph',
          // Step 3: 2 dependents filled (spouse + child) per ZERO-blanks rule.
          dep1_last: 'SMITH', dep1_first: 'EMILY ROSE', dep1_middle: 'JOHNSON',
          dep1_sex: 'F', dep1_relationship: 'Spouse', dep1_dob: '11/22/1985', dep1_nationality: 'AMERICAN',
          dep2_last: 'SMITH', dep2_first: 'NATHAN JAMES', dep2_middle: 'ANDERSON',
          dep2_sex: 'M', dep2_relationship: 'Child', dep2_dob: '05/18/2015', dep2_nationality: 'AMERICAN',
          // dep3_*: blank — only 1 child in this persona.
          dep3_last: '', dep3_first: '', dep3_middle: '',
          dep3_sex: '', dep3_relationship: '', dep3_dob: '', dep3_nationality: '',
          signature_printed_name: 'JOHN WILLIAM ANDERSON SMITH', signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // ── Sample 2: Japanese SRRV retiree, existing PhilHealth member
          // renewing/updating. Married — spouse as sole dependent. middle_name
          // blank because Japanese naming convention has no middle name. ──
          philhealth_number: '22-1122334455',
          acr_icard_number: 'B98765432', pra_srrv_number: 'SRRV-2022-00123',
          last_name: 'TANAKA', first_name: 'HIROSHI', middle_name: '',
          sex: 'Male', nationality: 'JAPANESE', dob_month: '03', dob_day: '22', dob_year: '1975',
          civil_status: 'Married',
          philippine_address_line1: 'UNIT 12F, ONE BONIFACIO HIGH STREET',
          philippine_address_line2: 'BGC, TAGUIG, METRO MANILA 1634',
          contact_phone: '+63 928 111 2233', email: 'h.tanaka@jp-corp.ph',
          // Step 3: 1 dependent (Japanese spouse, no PH-resident children).
          dep1_last: 'TANAKA', dep1_first: 'AYUMI', dep1_middle: '',
          dep1_sex: 'F', dep1_relationship: 'Spouse', dep1_dob: '07/14/1978', dep1_nationality: 'JAPANESE',
          dep2_last: '', dep2_first: '', dep2_middle: '',
          dep2_sex: '', dep2_relationship: '', dep2_dob: '', dep2_nationality: '',
          dep3_last: '', dep3_first: '', dep3_middle: '',
          dep3_sex: '', dep3_relationship: '', dep3_dob: '', dep3_nationality: '',
          signature_printed_name: 'HIROSHI TANAKA', signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // ── Sample 3: FULL — Spanish national, BOTH ACR I-card and SRRV
          // (rare but valid: foreign retiree who also works), Single with all
          // 3 dependent rows filled (parents + sibling) to exercise the full
          // Step 3 dependent grid. ──
          philhealth_number: '22-9999888777', acr_icard_number: 'C11223344', pra_srrv_number: 'SRRV-2023-00456',
          last_name: 'GARCIA', first_name: 'MARIA ELENA', middle_name: 'RODRIGUEZ',
          sex: 'Female', nationality: 'SPANISH', dob_month: '06', dob_day: '15', dob_year: '1988',
          civil_status: 'Single',
          philippine_address_line1: '32 ESCOLTA STREET, BINONDO',
          philippine_address_line2: 'MANILA, METRO MANILA 1006',
          contact_phone: '+63 917 123 4567', email: 'maria.garcia@eu-company.ph',
          // Step 3: 3 dependents filled (parents + sibling) — Single with no
          // spouse/child, so qualified dependents are immediate family per
          // PhilHealth Foreign National rules.
          dep1_last: 'GARCIA', dep1_first: 'CARLOS ANTONIO', dep1_middle: 'MARTINEZ',
          dep1_sex: 'M', dep1_relationship: 'Parent', dep1_dob: '02/10/1955', dep1_nationality: 'SPANISH',
          dep2_last: 'RODRIGUEZ', dep2_first: 'ISABEL CARMEN', dep2_middle: 'LOPEZ',
          dep2_sex: 'F', dep2_relationship: 'Parent', dep2_dob: '08/25/1958', dep2_nationality: 'SPANISH',
          dep3_last: 'GARCIA', dep3_first: 'JAVIER LUIS', dep3_middle: 'RODRIGUEZ',
          dep3_sex: 'M', dep3_relationship: 'Sibling', dep3_dob: '12/03/1990', dep3_nationality: 'SPANISH',
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
          // Patient is the member — "dependent_pin" prints the member's own PIN
          // here so the cell is never blank. (Field is gated as "if applicable"
          // but sits in the always-rendered Patient block.)
          dependent_pin: '123456789012', patient_last_name: 'DELA CRUZ', patient_first_name: 'JUAN ANDRES',
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
          // Self-employed scenario — use member's own DTI-registered single
          // proprietorship in the Employer block so every field is populated.
          employer_pen: '17-987654321-0', employer_contact_no: '0281239876', business_name: 'ANNA M. SANTOS DESIGN STUDIO',
          employer_date_signed_month: '03', employer_date_signed_day: '28', employer_date_signed_year: '2026',
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
      // 3 samples × 38 fields × 5 steps. NOTE: PFF-049 is a "delta /
      // change-of-information" form whose sections are MUTUALLY OPTIONAL by
      // design ("Leave both blank if no category change", etc.). The
      // ZERO-blanks rule does NOT apply at sample-level — filling every
      // section in every sample would misrepresent the persona. Instead we
      // ensure the FIELD UNIVERSE is covered across the 3 samples:
      //   • Sample 1: marital change (Single → Married) + address change.
      //   • Sample 2: marital change (Married → Widowed) + address change.
      //   • Sample 3 (FULL): comprehensive-update persona — name change
      //     (post-marriage), category change, DOB correction, marital
      //     change, address change, AND others update (Place of Birth).
      // Sections deliberately blank in 1/2 are documented in the doc.
      'pagibig-pff-049': [
        {
          mid_no: '1234-5678-9012', housing_account_no: '',
          loyalty_card_holder: 'No', loyalty_partner_bank: '',
          current_last_name: 'DELA CRUZ', current_first_name: 'JUAN ANDRES', current_ext_name: 'Jr.', current_middle_name: 'SANTOS',
          // Category, name, DOB, others changes: not applicable for this persona.
          category_from: '', category_to: '',
          name_from_last: '', name_from_first: '', name_from_ext: '', name_from_middle: '',
          name_to_last: '', name_to_first: '', name_to_ext: '', name_to_middle: '',
          dob_from: '', dob_to: '',
          marital_from: 'Single', marital_to: 'Married',
          spouse_last_name: 'REYES', spouse_first_name: 'MARIA', spouse_ext_name: 'N/A', spouse_middle_name: 'GARCIA',
          new_address_line: '123 RIZAL ST, SAMPALOC', new_barangay: 'BRGY. 101', new_city: 'MANILA', new_province: 'METRO MANILA (NCR)', new_zip: '1008',
          new_cell_phone: '09171234567', new_email: 'juan.delacruz@gmail.com',
          preferred_mailing: 'Present Home Address',
          others_from: '', others_to: '',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          mid_no: '9876-5432-1098', housing_account_no: 'HL-2024-001234',
          loyalty_card_holder: 'Yes', loyalty_partner_bank: 'BDO UNIBANK',
          current_last_name: 'SANTOS', current_first_name: 'ANNA MARIE', current_ext_name: 'N/A', current_middle_name: 'GARCIA',
          category_from: '', category_to: '',
          name_from_last: '', name_from_first: '', name_from_ext: '', name_from_middle: '',
          name_to_last: '', name_to_first: '', name_to_ext: '', name_to_middle: '',
          dob_from: '', dob_to: '',
          marital_from: 'Married', marital_to: 'Widowed',
          // Spouse block intentionally blank — Widowed status (no current spouse to record).
          spouse_last_name: '', spouse_first_name: '', spouse_ext_name: 'N/A', spouse_middle_name: '',
          new_address_line: 'BLK 5 LOT 7, GREENFIELD VILLAGE, MABINI ST', new_barangay: 'BRGY. POBLACION', new_city: 'MAKATI CITY', new_province: 'METRO MANILA (NCR)', new_zip: '1210',
          new_cell_phone: '09281234567', new_email: 'anna.santos@gmail.com',
          preferred_mailing: 'Permanent Home Address',
          others_from: '', others_to: '',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // ── Sample 3: FULL — comprehensive update post-marriage. Member is
          // a married woman submitting a multi-section MCIF that includes:
          //   • Category change (Employed Local → Self-Employed) — opened a
          //     freelance graphic design business.
          //   • Name change (post-marriage: REYES → CRUZ-REYES, retaining
          //     maiden surname per RA 8525 hyphenation pattern).
          //   • DOB correction (NSO/PSA recently issued corrected birth cert
          //     fixing a typo: 1991 → 1990).
          //   • Marital change (Single → Married — this is the trigger event).
          //   • Address change (moved from Cebu to Quezon City after wedding).
          //   • Others update (Place of Birth correction: Cebu → Cebu City).
          // Exercises every Step 1-5 field family.
          mid_no: '5678-9012-3456', housing_account_no: 'HL-2025-009876',
          loyalty_card_holder: 'Yes', loyalty_partner_bank: 'BPI / METROBANK',
          current_last_name: 'REYES', current_first_name: 'CARMELA NICOLE', current_ext_name: 'N/A', current_middle_name: 'BAUTISTA',
          // Category change
          category_from: 'Employed Local', category_to: 'Self-Employed',
          // Name change (post-marriage hyphenation)
          name_from_last: 'REYES', name_from_first: 'CARMELA NICOLE', name_from_ext: 'N/A', name_from_middle: 'BAUTISTA',
          name_to_last: 'CRUZ-REYES', name_to_first: 'CARMELA NICOLE', name_to_ext: 'N/A', name_to_middle: 'BAUTISTA',
          // DOB correction (PSA-issued corrected birth certificate)
          dob_from: '08/14/1991', dob_to: '08/14/1990',
          // Marital change (the triggering event)
          marital_from: 'Single', marital_to: 'Married',
          spouse_last_name: 'CRUZ', spouse_first_name: 'MIGUEL ANGELO', spouse_ext_name: 'III', spouse_middle_name: 'ALCANTARA',
          // Address change (relocated to QC after wedding)
          new_address_line: 'UNIT 12B, ONE EASTWOOD AVENUE TOWER 2, EASTWOOD CITY', new_barangay: 'BRGY. BAGUMBAYAN', new_city: 'QUEZON CITY', new_province: 'METRO MANILA (NCR)', new_zip: '1110',
          new_cell_phone: '09175552020', new_email: 'carmela.cruz@designstudio.ph',
          preferred_mailing: 'Present Home Address',
          // Others update — Place of Birth correction (administrative/PSA)
          others_from: 'Place of Birth: CEBU', others_to: 'Place of Birth: CEBU CITY, CEBU',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── Pag-IBIG SLF-089 (HELPs) ────────────────────────────────────────
      'pagibig-slf-089': [
        {
          // ── Sample 1: Roberto Mendoza · Manila Electric Company senior
          // engineer · educational loan for daughter's college tuition.
          // Married male; permanent regular employee. Has 2 previous employers
          // in his career history. ──
          mid_no: '9876-5432-1098', application_no: '',
          last_name: 'MENDOZA', first_name: 'ROBERTO', ext_name: 'N/A', middle_name: 'LINDO', no_maiden_middle_name: '',
          dob: '07/04/1980', place_of_birth: 'MANILA, METRO MANILA', mothers_maiden_name: 'LINDO, CECILIA SANTOS',
          sex: 'Male', marital_status: 'Married', citizenship: 'FILIPINO', nationality: 'FILIPINO',
          perm_unit: 'Lot 12 Block 3 House No. 789', perm_street: 'TINDALO ST', perm_cell_phone: '09203334444', perm_home_tel: '028234-5678',
          perm_subdivision: 'STA. MESA HEIGHTS', perm_barangay: 'BRGY. STA. MESA', perm_city: 'MANILA', perm_province: 'METRO MANILA (NCR)', perm_zip: '1016',
          perm_email: 'roberto.mendoza@yahoo.com', perm_tin: '456789012000',
          pres_unit: 'Unit 3B', pres_street: 'ORTIGAS AVE', pres_employee_id: 'EMP-2022-001', pres_nature_of_work: 'Senior Electrical Engineer',
          pres_subdivision: 'WACK-WACK VILLAGE', pres_barangay: 'BRGY. WACK-WACK', pres_city: 'MANDALUYONG', pres_province: 'METRO MANILA (NCR)', pres_zip: '1550',
          pres_sss_gsis: '34-5678901-2', pres_business_tel: '026321-9999',
          employer_name: 'MANILA ELECTRIC COMPANY', date_of_employment: '06/01/2015',
          desired_loan_amount: '50000', loan_amount_type: 'Others (specify in Desired Amount)',
          employer_address_line: 'MERALCO BUILDING, ORTIGAS AVE', source_of_fund: 'Provident Fund',
          employer_subdivision: 'WACK-WACK', employer_barangay: 'BRGY. WACK-WACK', employer_city: 'MANDALUYONG', employer_province: 'METRO MANILA (NCR)', employer_zip: '1550',
          loan_purpose: 'Educational Expenses',
          beneficiary_last: 'MENDOZA', beneficiary_first: 'LORNA', beneficiary_ext: 'N/A', beneficiary_middle: 'SANTOS',
          student_id_no: '2024-STU-001234', loan_term: 'Twenty-four (24) Months',
          signature_date: new Date().toISOString().split('T')[0],
          // Step 6 Previous Employment (2 of 3 rows filled per ZERO-blanks rule)
          prev_emp1_name: 'PHILIPPINE LONG DISTANCE TELEPHONE COMPANY',
          prev_emp1_address: 'RAMON COJUANGCO BUILDING, MAKATI AVENUE, MAKATI CITY',
          prev_emp1_from: '06/05', prev_emp1_to: '05/15',
          prev_emp2_name: 'NATIONAL POWER CORPORATION',
          prev_emp2_address: 'NPC COMPLEX, AGHAM ROAD, BRGY. CENTRAL, QUEZON CITY',
          prev_emp2_from: '06/02', prev_emp2_to: '05/05',
          // Row 3 blank — only 2 prior employers in this persona's career history.
          prev_emp3_name: '', prev_emp3_address: '', prev_emp3_from: '', prev_emp3_to: '',
        },
        {
          // ── Sample 2: Patricia Ann Garcia · BDO bank manager · medical loan
          // for her own surgery. Single female. 1 previous employer. ──
          mid_no: '1111-2222-3334', application_no: 'APP-2026-003456',
          last_name: 'GARCIA', first_name: 'PATRICIA ANN', ext_name: 'N/A', middle_name: 'REYES', no_maiden_middle_name: '',
          dob: '03/18/1992', place_of_birth: 'CEBU CITY, CEBU', mothers_maiden_name: 'REYES, LINDA SANTOS',
          sex: 'Female', marital_status: 'Single/Unmarried', citizenship: 'FILIPINO', nationality: 'FILIPINO',
          perm_unit: 'Unit 2A', perm_street: 'AURORA BLVD', perm_cell_phone: '09162223333', perm_home_tel: '028123-4567',
          perm_subdivision: 'CUBAO COMMERCIAL CENTER', perm_barangay: 'BRGY. CUBAO', perm_city: 'QUEZON CITY', perm_province: 'METRO MANILA (NCR)', perm_zip: '1109',
          perm_email: 'p.garcia@work.com', perm_tin: '789012345000',
          pres_unit: '15F BDO Corporate Center', pres_street: 'ORTIGAS CENTER', pres_employee_id: 'BD-2023-9876', pres_nature_of_work: 'Branch Manager — Retail Banking',
          pres_subdivision: 'ORTIGAS BUSINESS DISTRICT', pres_barangay: 'BRGY. SAN ANTONIO', pres_city: 'PASIG', pres_province: 'METRO MANILA (NCR)', pres_zip: '1605',
          pres_sss_gsis: '11-2345678-9', pres_business_tel: '028840-7000',
          employer_name: 'BDO UNIBANK INC.', date_of_employment: '01/15/2019',
          desired_loan_amount: '30000', loan_amount_type: 'Others (specify in Desired Amount)',
          employer_address_line: 'BDO CORPORATE CENTER, ORTIGAS', source_of_fund: 'Provident Fund',
          employer_subdivision: 'ORTIGAS CENTER', employer_barangay: 'BRGY. SAN ANTONIO', employer_city: 'PASIG', employer_province: 'METRO MANILA (NCR)', employer_zip: '1605',
          loan_purpose: 'Medical Expenses',
          beneficiary_last: 'GARCIA', beneficiary_first: 'ELENA', beneficiary_ext: 'N/A', beneficiary_middle: 'REYES',
          // student_id_no blank — Medical loan, not Educational.
          student_id_no: '', loan_term: 'Twelve (12) Months',
          signature_date: new Date().toISOString().split('T')[0],
          // Step 6 Previous Employment (1 of 3 rows filled — early-career job)
          prev_emp1_name: 'METROPOLITAN BANK & TRUST CO.',
          prev_emp1_address: 'METROBANK PLAZA, GIL PUYAT AVE, MAKATI CITY',
          prev_emp1_from: '06/14', prev_emp1_to: '12/18',
          prev_emp2_name: '', prev_emp2_address: '', prev_emp2_from: '', prev_emp2_to: '',
          prev_emp3_name: '', prev_emp3_address: '', prev_emp3_from: '', prev_emp3_to: '',
        },
        {
          // ── Sample 3: FULL — Carlo Miguel Villanueva Jr. · Davao bank
          // executive · HMO loan for spouse + family. Married male with all
          // 3 previous employer rows filled to fully exercise Step 6. ──
          mid_no: '3333-4444-5556', application_no: 'APP-2026-007890',
          last_name: 'VILLANUEVA', first_name: 'CARLO MIGUEL', ext_name: 'Jr.', middle_name: 'NAVARRO', no_maiden_middle_name: '',
          dob: '11/25/1987', place_of_birth: 'DAVAO CITY, DAVAO DEL SUR', mothers_maiden_name: 'NAVARRO, ROSA DELA CRUZ',
          sex: 'Male', marital_status: 'Married', citizenship: 'FILIPINO', nationality: 'FILIPINO',
          perm_unit: 'House 12 Block 4', perm_street: 'SAMPAGUITA ST', perm_cell_phone: '09177778888', perm_home_tel: '0822234567',
          perm_subdivision: 'GREENFIELD SUBDIVISION', perm_barangay: 'BRGY. MINTAL', perm_city: 'DAVAO CITY', perm_province: 'DAVAO DEL SUR', perm_zip: '8023',
          perm_email: 'carlo.villanueva@corp.ph', perm_tin: '321654987000',
          pres_unit: '5F SPB Tower', pres_street: 'TORRES ST', pres_employee_id: 'EMP-CORP-0001', pres_nature_of_work: 'Vice President — Operations',
          pres_subdivision: 'BAJADA COMMERCIAL', pres_barangay: 'BRGY. BAJADA', pres_city: 'DAVAO CITY', pres_province: 'DAVAO DEL SUR', pres_zip: '8000',
          pres_sss_gsis: '34-1122334-5', pres_business_tel: '0822345678',
          employer_name: 'SOUTHERN PHILIPPINE BANK',
          date_of_employment: '03/01/2012',
          desired_loan_amount: '80000', loan_amount_type: 'Maximum Loan Amount',
          employer_address_line: 'SPB TOWER, MAGSAYSAY AVE', source_of_fund: 'Savings',
          employer_subdivision: 'POBLACION DISTRICT', employer_barangay: 'BRGY. POBLACION', employer_city: 'DAVAO CITY', employer_province: 'DAVAO DEL SUR', employer_zip: '8000',
          loan_purpose: 'Healthcare Plan from accredited HMO',
          beneficiary_last: 'VILLANUEVA', beneficiary_first: 'DIANA ROSE', beneficiary_ext: 'N/A', beneficiary_middle: 'NAVARRO',
          student_id_no: '', // HMO loan, not Educational
          loan_term: 'Thirty-six (36) Months',
          signature_date: new Date().toISOString().split('T')[0],
          // Step 6 Previous Employment (ALL 3 rows filled per FULL persona)
          prev_emp1_name: 'BANK OF THE PHILIPPINE ISLANDS',
          prev_emp1_address: 'BPI HEAD OFFICE, AYALA AVENUE, MAKATI CITY',
          prev_emp1_from: '06/09', prev_emp1_to: '02/12',
          prev_emp2_name: 'PHILAM LIFE INSURANCE COMPANY',
          prev_emp2_address: 'PHILAM LIFE BUILDING, UN AVENUE, ERMITA, MANILA',
          prev_emp2_from: '06/06', prev_emp2_to: '05/09',
          prev_emp3_name: 'SAN MIGUEL CORPORATION',
          prev_emp3_address: 'SMC HEAD OFFICE, ORTIGAS AVENUE, MANDALUYONG CITY',
          prev_emp3_from: '06/03', prev_emp3_to: '05/06',
        },
      ],

      // ── Pag-IBIG SLF-065 (Multi-Purpose Loan) ───────────────────────────
      'pagibig-slf-065': [
        {
          // ── Sample A: Patricia Ann R. Garcia · BDO Branch Manager · Single
          // · Health & wellness loan (gym membership + annual exec checkup) ──
          mid_no: '5555-6666-7777', application_no: '',
          last_name: 'GARCIA', first_name: 'PATRICIA ANN', ext_name: 'N/A', middle_name: 'REYES', no_maiden_middle_name: '',
          dob: '03/18/1992', place_of_birth: 'QUEZON CITY, METRO MANILA', mothers_maiden_name: 'REYES, LINDA SANTOS',
          nationality: 'FILIPINO', sex: 'Female', marital_status: 'Single/Unmarried', citizenship: 'FILIPINO',
          email: 'p.garcia@work.com',
          perm_unit: 'Unit 2A', perm_cell_phone: '09162223333', perm_home_tel: '028123-4567',
          perm_street: 'AURORA BLVD', perm_subdivision: 'CUBAO COMMERCIAL CENTER', perm_barangay: 'BRGY. CUBAO', perm_city: 'QUEZON CITY', perm_province: 'METRO MANILA (NCR)', perm_zip: '1109',
          perm_tin: '789012345000', perm_sss_gsis: '11-2345678-9',
          pres_unit: '15F BDO Corporate Center', pres_business_tel: '028840-7000', pres_nature_of_work: 'Branch Manager — Retail Banking',
          pres_street: 'ORTIGAS CENTER', pres_subdivision: 'ORTIGAS BUSINESS DISTRICT', pres_barangay: 'BRGY. SAN ANTONIO', pres_city: 'PASIG', pres_province: 'METRO MANILA (NCR)', pres_zip: '1605',
          loan_term: 'Two (2) Years', desired_loan_amount: '80000',
          employer_name: 'BDO UNIBANK INC.', loan_purpose: 'Health & wellness',
          employer_address_line: 'BDO CORPORATE CENTER, ORTIGAS', employer_subdivision: 'ORTIGAS CENTER', employer_barangay: 'BRGY. SAN ANTONIO', employer_city: 'PASIG', employer_province: 'METRO MANILA (NCR)', employer_zip: '1605',
          employee_id_no: 'BD-2023-9876', date_of_employment: '01/15/2019',
          source_of_fund: 'Salary', payroll_bank_name: 'BDO Unibank — Ortigas Branch',
          signature_date: new Date().toISOString().split('T')[0],
          source_of_referral: 'Employer/Fund Coordinator',
        },
        {
          // ── Sample B: Mario Jose D. Torres · Cebu Pacific First Officer
          // (Pilot) · Married · Vacation/travel loan (family Japan trip) ──
          mid_no: '8888-9999-0001', application_no: 'APP-2026-011234',
          last_name: 'TORRES', first_name: 'MARIO JOSE', ext_name: 'N/A', middle_name: 'DELA VEGA', no_maiden_middle_name: '',
          dob: '09/25/1985', place_of_birth: 'CEBU CITY, CEBU', mothers_maiden_name: 'DELA VEGA, CARLA SANTOS',
          nationality: 'FILIPINO', sex: 'Male', marital_status: 'Married', citizenship: 'FILIPINO',
          email: 'mario.torres@cebu.ph',
          perm_unit: 'House 3 Lot 15', perm_cell_phone: '09221112222', perm_home_tel: '0322345678',
          perm_street: '12 SAMPAGUITA ST', perm_subdivision: 'CEBU VILLAGE', perm_barangay: 'BRGY. CAMPUTHAW', perm_city: 'CEBU CITY', perm_province: 'CEBU', perm_zip: '6000',
          perm_tin: '654321098000', perm_sss_gsis: '34-9876543-2',
          pres_unit: 'Unit 12B Crew Quarters', pres_business_tel: '0322234567', pres_nature_of_work: 'First Officer (Commercial Pilot) — A320 Fleet',
          pres_street: 'JONES AVE', pres_subdivision: 'KAMPUTHAW DISTRICT', pres_barangay: 'BRGY. KAMPUTHAW', pres_city: 'CEBU CITY', pres_province: 'CEBU', pres_zip: '6000',
          loan_term: 'Three (3) Years', desired_loan_amount: '120000',
          employer_name: 'CEBU PACIFIC AIR', loan_purpose: 'Vacation / travel',
          employer_address_line: 'MIA ROAD, PASAY CITY', employer_subdivision: 'NAIA COMPLEX', employer_barangay: 'BRGY. 183', employer_city: 'PASAY', employer_province: 'METRO MANILA (NCR)', employer_zip: '1300',
          employee_id_no: 'CEB-2018-4567', date_of_employment: '06/01/2018',
          source_of_fund: 'Salary', payroll_bank_name: 'BPI — Cebu City Branch',
          signature_date: new Date().toISOString().split('T')[0],
          source_of_referral: 'Pag-IBIG Fund Website',
        },
        {
          // ── Sample C: FULL — Diana Rose E. Navarro · Southern Philippine
          // Bank VP · Married · Tuition/Educational loan for 2 kids in college ──
          mid_no: '1111-2222-3334', application_no: 'APP-2026-099999',
          last_name: 'NAVARRO', first_name: 'DIANA ROSE', ext_name: 'N/A', middle_name: 'ESPIRITU', no_maiden_middle_name: '',
          dob: '04/12/1979', place_of_birth: 'DAVAO CITY, DAVAO DEL SUR', mothers_maiden_name: 'ESPIRITU, NORA SANTOS',
          nationality: 'FILIPINO', sex: 'Female', marital_status: 'Married', citizenship: 'FILIPINO',
          email: 'diana.navarro@southbank.ph',
          perm_unit: 'Unit 4C', perm_cell_phone: '09257778888', perm_home_tel: '0822227777',
          perm_street: '100 SAMPAGUITA AVE', perm_subdivision: 'POBLACION HEIGHTS', perm_barangay: 'BRGY. POBLACION', perm_city: 'DAVAO CITY', perm_province: 'DAVAO DEL SUR', perm_zip: '8000',
          perm_tin: '321654099000', perm_sss_gsis: '34-9876543-9',
          pres_unit: '8F SPB Tower', pres_business_tel: '0822234560', pres_nature_of_work: 'Vice President — Branch Operations',
          pres_street: 'MAGSAYSAY AVE', pres_subdivision: 'POBLACION COMMERCIAL DISTRICT', pres_barangay: 'BRGY. POBLACION', pres_city: 'DAVAO CITY', pres_province: 'DAVAO DEL SUR', pres_zip: '8000',
          // loan_term capped at 3 years for SLF-065 (was '48 months' — invalid, max is Three (3) Years)
          loan_term: 'Three (3) Years', desired_loan_amount: '200000',
          employer_name: 'SOUTHERN PHILIPPINE BANK', loan_purpose: 'Tuition / Educational Expenses',
          employer_address_line: 'SPB TOWER, MAGSAYSAY AVE', employer_subdivision: 'POBLACION COMMERCIAL DISTRICT', employer_barangay: 'BRGY. POBLACION', employer_city: 'DAVAO CITY', employer_province: 'DAVAO DEL SUR', employer_zip: '8000',
          employee_id_no: 'SPB-2005-00123', date_of_employment: '03/01/2005',
          source_of_fund: 'Salary', payroll_bank_name: 'Southern Philippine Bank — Main Branch',
          signature_date: new Date().toISOString().split('T')[0],
          source_of_referral: 'Referral',
        },
      ],

      // ── Pag-IBIG HLF-868 (HEAL Co-Borrower) ─────────────────────────────
      'pagibig-hlf-868': [
        {
          // ── Sample A: Mark Christian Torres · Spouse co-borrower (50%
          // share) · Married civil engineer at family construction firm ──
          mid_no: '3333-4444-5555', housing_account_no: 'HL-2024-000123',
          last_name: 'TORRES', first_name: 'MARK CHRISTIAN', ext_name: 'N/A', middle_name: 'DELA VEGA', maiden_middle_name: '',
          dob: '09/25/1983', citizenship: 'FILIPINO', proportionate_share: '50',
          sex: 'Male', marital_status: 'Married', relationship_to_principal: 'Spouse',
          perm_unit: 'House 4 Block 2', perm_street: '12 SAMPAGUITA ST', perm_subdivision: 'PRIMAVERA RESIDENCES', perm_barangay: 'BRGY. STA. CRUZ', perm_city: 'ANTIPOLO', perm_province: 'RIZAL', perm_zip: '1870',
          perm_country_tel: '63-2', perm_home_tel: '028123-4567',
          pres_unit: 'House 4 Block 2', pres_street: '12 SAMPAGUITA ST', pres_subdivision: 'PRIMAVERA RESIDENCES', pres_barangay: 'BRGY. STA. CRUZ', pres_city: 'ANTIPOLO', pres_province: 'RIZAL', pres_zip: '1870',
          pres_business_tel: '028765-4321', pres_cellphone: '09221112222',
          email_address: 'm.torres@email.com', years_stay_present: '5',
          tin: '789012345000', sss_gsis: '34-9876543-1',
          home_ownership: 'Owned', mailing_preference: 'Permanent Home Address',
          employment_type: 'Self-Employed', industry_category: 'Construction',
          occupation: 'Civil Engineer', employer_name: 'TORRES CONSTRUCTION INC.',
          employer_address_line: 'EDSA COR SHAW BLVD', employer_subdivision: 'WACK-WACK', employer_barangay: 'BRGY. WACK-WACK', employer_city: 'MANDALUYONG', employer_province: 'METRO MANILA (NCR)', employer_zip: '1550',
          employer_business_tel: '026321-1111', employer_email: 'hr@torresconstruction.ph',
          position_dept: 'Senior Engineer / Engineering Dept', preferred_time_contact: '9:00 AM - 5:00 PM',
          place_assignment: 'Mandaluyong Main Office', years_employment: '8', no_dependents: '2',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // ── Sample B: Jose Ramon Flores Jr. · Brother co-borrower (30%
          // share) · Single male IT manager at TechPH ──
          mid_no: '6666-7777-8888', housing_account_no: '',
          last_name: 'FLORES', first_name: 'JOSE RAMON', ext_name: 'Jr.', middle_name: 'ABAD', maiden_middle_name: '',
          dob: '12/01/1980', citizenship: 'FILIPINO', proportionate_share: '30',
          sex: 'Male', marital_status: 'Single/Unmarried', relationship_to_principal: 'Brother/Sister',
          perm_unit: 'Unit 5A', perm_street: 'MAGNOLIA ST', perm_subdivision: 'VALLE VERDE', perm_barangay: 'BRGY. UGONG', perm_city: 'PASIG', perm_province: 'METRO MANILA (NCR)', perm_zip: '1604',
          perm_country_tel: '63-2', perm_home_tel: '027234-5678',
          pres_unit: 'Unit 5A', pres_street: 'MAGNOLIA ST', pres_subdivision: 'VALLE VERDE', pres_barangay: 'BRGY. UGONG', pres_city: 'PASIG', pres_province: 'METRO MANILA (NCR)', pres_zip: '1604',
          pres_business_tel: '027222-3333', pres_cellphone: '09335556666',
          email_address: 'jr.flores@email.ph', years_stay_present: '3',
          tin: '321654099000', sss_gsis: '11-9876543-0',
          home_ownership: 'Owned', mailing_preference: 'Present Home Address',
          employment_type: 'Locally Employed', industry_category: 'Technology',
          occupation: 'IT Manager', employer_name: 'TECHPH SOLUTIONS INC.',
          employer_address_line: 'E. RODRIGUEZ JR. AVE', employer_subdivision: 'BAGUMBAYAN', employer_barangay: 'BRGY. BAGUMBAYAN', employer_city: 'QUEZON CITY', employer_province: 'METRO MANILA (NCR)', employer_zip: '1110',
          employer_business_tel: '028765-9999', employer_email: 'hr@techph.com',
          position_dept: 'IT Manager / Technology Dept', preferred_time_contact: '8:00 AM - 5:00 PM',
          place_assignment: 'Quezon City Head Office', years_employment: '6', no_dependents: '1',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // ── Sample C: FULL — Maria Theresa Reyes · Spouse co-borrower (50%
          // share) · Married female bank branch manager (Globally Employed
          // returnee — kept maiden middle name VILLANUEVA) · all optionals ──
          mid_no: '9999-0000-1112', housing_account_no: 'HL-2025-004567',
          last_name: 'REYES', first_name: 'MARIA THERESA', ext_name: 'N/A', middle_name: 'SANTOS', maiden_middle_name: 'VILLANUEVA',
          dob: '06/15/1988', citizenship: 'FILIPINO', proportionate_share: '50',
          sex: 'Female', marital_status: 'Married', relationship_to_principal: 'Spouse',
          perm_unit: 'Lot 12 Block 5', perm_street: 'ROSAL STREET', perm_subdivision: 'GREENFIELD SUBDIVISION', perm_barangay: 'BRGY. SAN ISIDRO', perm_city: 'ANTIPOLO', perm_province: 'RIZAL', perm_zip: '1870',
          perm_country_tel: '63-2-8123-4567', perm_home_tel: '028123-4567',
          pres_unit: 'Torre de Manila Unit 304', pres_street: 'PABLO OCAMPO AVENUE', pres_subdivision: 'MALATE', pres_barangay: 'BRGY. 708 ZONE 77', pres_city: 'MANILA', pres_province: 'METRO MANILA (NCR)', pres_zip: '1004',
          pres_business_tel: '027234-5678', pres_cellphone: '09171234567',
          email_address: 'mtheresa.reyes@globalbank.ph', years_stay_present: '2',
          tin: '456789012000', sss_gsis: '34-1122334-5',
          home_ownership: 'Rented', mailing_preference: 'Employer/Business Address',
          employment_type: 'Locally Employed', industry_category: 'Financial Services/Intermediation',
          occupation: 'Branch Manager', employer_name: 'GLOBAL BANK PHILIPPINES',
          employer_address_line: 'GT TOWER, AYALA AVENUE', employer_subdivision: 'MAKATI CENTRAL BUSINESS DISTRICT', employer_barangay: 'BRGY. SAN LORENZO', employer_city: 'MAKATI CITY', employer_province: 'METRO MANILA (NCR)', employer_zip: '1223',
          employer_business_tel: '028888-8888', employer_email: 'hr@globalbank.ph',
          position_dept: 'Branch Manager / Retail Banking', preferred_time_contact: '8:00 AM - 6:00 PM',
          place_assignment: 'Makati Main Branch', years_employment: '10', no_dependents: '3',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── Pag-IBIG HLF-858 (HEAL Principal Borrower) ──────────────────────
      'pagibig-hlf-858': [
        {
          // ── Sample A: Carmen A. Flores · Married female senior accountant
          // at Metrobank · 3M HEAL loan for home renovation. Spouse block
          // populated (Married per maiden_middle_name='SANTOS'). ──
          mid_no: '1111-2222-3333', housing_account_no: 'HL-2024-001111',
          desired_loan_amount: '3000000',
          loan_purpose: 'Home Improvement', loan_term: '15', mode_of_payment: 'Salary deduction',
          request_for_reinspection: 'No',
          last_name: 'FLORES', first_name: 'CARMEN', ext_name: 'N/A', middle_name: 'ABAD', maiden_middle_name: 'SANTOS',
          dob: '12/01/1975', citizenship: 'FILIPINO', no_dependents: '2',
          sex: 'Female', marital_status: 'Married',
          perm_unit: 'Unit 7B', perm_street: '56 MAGNOLIA ST', perm_subdivision: 'VALLE VERDE', perm_barangay: 'BRGY. KAPASIGAN', perm_city: 'PASIG', perm_province: 'METRO MANILA (NCR)', perm_zip: '1600',
          perm_country_tel: '63-2', perm_home_tel: '027234-1111', perm_business_tel: '027234-2222',
          pres_unit: 'Unit 7B', pres_street: '56 MAGNOLIA ST', pres_subdivision: 'VALLE VERDE', pres_barangay: 'BRGY. KAPASIGAN', pres_city: 'PASIG', pres_province: 'METRO MANILA (NCR)', pres_zip: '1600',
          pres_cellphone: '09235556666', email_address: 'c.flores@business.ph', years_stay_present: '7',
          home_ownership: 'Owned', mailing_preference: 'Permanent Home Address',
          occupation: 'Senior Accountant', employment_type: 'Locally Employed', industry_category: 'Financial Services/Intermediation',
          tin: '321654987000', sss_gsis: '34-0000001-2',
          employer_business_tel: '028840-1234', employer_name: 'METROBANK',
          employer_address_line: 'METROBANK PLAZA, GIL PUYAT AVE', employer_subdivision: 'BEL-AIR DISTRICT', employer_barangay: 'BRGY. BEL-AIR', employer_city: 'MAKATI CITY', employer_province: 'METRO MANILA (NCR)', employer_zip: '1209',
          employer_email: 'hr@metrobank.com.ph',
          position_dept: 'Senior Accountant / Finance Division', preferred_time_contact: '9:00 AM - 5:00 PM',
          place_assignment: 'Makati Head Office', years_employment: '10',
          signature_date: new Date().toISOString().split('T')[0],
          // Spouse block (Married)
          spouse_last_name: 'FLORES', spouse_first_name: 'ROBERTO', spouse_ext_name: 'N/A', spouse_middle_name: 'NAVARRO',
          spouse_dob: '08/12/1972', spouse_citizenship: 'FILIPINO', spouse_tin: '987654321000',
          spouse_occupation: 'Mechanical Engineer', spouse_employer_name: 'MERALCO',
          spouse_place_assignment: 'Ortigas Substation', spouse_years_employment: '15',
          spouse_employer_address_line: 'MERALCO BUILDING, ORTIGAS AVE',
          spouse_position_dept: 'Senior Engineer / Operations',
          spouse_employer_subdivision: 'WACK-WACK', spouse_employer_barangay: 'BRGY. WACK-WACK', spouse_employer_city: 'MANDALUYONG', spouse_employer_province: 'METRO MANILA (NCR)', spouse_employer_zip: '1550',
          spouse_business_tel: '026321-9999',
        },
        {
          // ── Sample B: Elena Grace C. Aquino · Married female ICU nurse at
          // Cebu Doctor's Hospital · 1.5M HEAL loan for educational expenses
          // (kids' tuition). Spouse block populated. ──
          mid_no: '4444-5555-6667', housing_account_no: '',
          desired_loan_amount: '1500000',
          loan_purpose: 'Educational expenses', loan_term: '10', mode_of_payment: 'Salary deduction',
          request_for_reinspection: 'N/A',
          last_name: 'AQUINO', first_name: 'ELENA GRACE', ext_name: 'N/A', middle_name: 'CRUZ', maiden_middle_name: 'SANTOS',
          dob: '11/30/1987', citizenship: 'FILIPINO', no_dependents: '3',
          sex: 'Female', marital_status: 'Married',
          perm_unit: 'House 22 Block 4', perm_street: '22 COLON ST', perm_subdivision: 'KAMPUTHAW DISTRICT', perm_barangay: 'BRGY. KAMPUTHAW', perm_city: 'CEBU CITY', perm_province: 'CEBU', perm_zip: '6000',
          perm_country_tel: '63-32', perm_home_tel: '0322345678', perm_business_tel: '0322234567',
          pres_unit: 'House 22 Block 4', pres_street: '22 COLON ST', pres_subdivision: 'KAMPUTHAW DISTRICT', pres_barangay: 'BRGY. KAMPUTHAW', pres_city: 'CEBU CITY', pres_province: 'CEBU', pres_zip: '6000',
          pres_cellphone: '09198887777', email_address: 'elena.aquino@cebu.ph', years_stay_present: '4',
          home_ownership: 'Owned', mailing_preference: 'Present Home Address',
          occupation: 'Registered Nurse', employment_type: 'Locally Employed', industry_category: 'Health and Medical Services',
          tin: '456789123000', sss_gsis: '34-8765432-0',
          employer_business_tel: '0322234567', employer_name: "CEBU DOCTOR'S UNIVERSITY HOSPITAL",
          employer_address_line: 'OSMEÑA BLVD', employer_subdivision: 'CAPITOL SITE', employer_barangay: 'BRGY. CAPITOL SITE', employer_city: 'CEBU CITY', employer_province: 'CEBU', employer_zip: '6000',
          employer_email: 'hr@cduhosp.ph',
          position_dept: 'Registered Nurse / ICU Dept', preferred_time_contact: '8:00 AM - 4:00 PM',
          place_assignment: 'Cebu City Main Campus', years_employment: '5',
          signature_date: new Date().toISOString().split('T')[0],
          // Spouse block (Married)
          spouse_last_name: 'AQUINO', spouse_first_name: 'MARK ANTHONY', spouse_ext_name: 'N/A', spouse_middle_name: 'REYES',
          spouse_dob: '04/22/1985', spouse_citizenship: 'FILIPINO', spouse_tin: '111222333000',
          spouse_occupation: 'Software Engineer', spouse_employer_name: 'ACCENTURE PHILIPPINES',
          spouse_place_assignment: 'Cebu IT Park', spouse_years_employment: '8',
          spouse_employer_address_line: 'EBLOC TOWER 1, GEONZON ST',
          spouse_position_dept: 'Senior Software Engineer / Tech Delivery',
          spouse_employer_subdivision: 'CEBU IT PARK', spouse_employer_barangay: 'BRGY. APAS', spouse_employer_city: 'CEBU CITY', spouse_employer_province: 'CEBU', spouse_employer_zip: '6000',
          spouse_business_tel: '0324155555',
        },
        {
          // ── Sample C: FULL — Maria Theresa V.S. Reyes · Married female bank
          // VP · 6M HEAL loan for travel & leisure (annual round-the-world
          // trip). 30-year term, full spouse block, every optional field. ──
          mid_no: '7777-8888-9990', housing_account_no: 'HL-2023-009999',
          desired_loan_amount: '6000000',
          loan_purpose: 'Travel and leisure', loan_term: '30', mode_of_payment: 'Bank',
          request_for_reinspection: 'Yes',
          last_name: 'REYES', first_name: 'MARIA THERESA', ext_name: 'N/A', middle_name: 'SANTOS', maiden_middle_name: 'VILLANUEVA',
          dob: '06/15/1988', citizenship: 'FILIPINO', no_dependents: '2',
          sex: 'Female', marital_status: 'Married',
          perm_unit: 'Lot 12 Block 5', perm_street: 'ROSAL STREET', perm_subdivision: 'GREENFIELD SUBDIVISION', perm_barangay: 'BRGY. SAN ISIDRO', perm_city: 'ANTIPOLO', perm_province: 'RIZAL', perm_zip: '1870',
          perm_country_tel: '63-2-8123-4567', perm_home_tel: '028123-4567', perm_business_tel: '028888-8888',
          pres_unit: 'Torre de Manila Unit 304', pres_street: 'PABLO OCAMPO AVENUE', pres_subdivision: 'MALATE', pres_barangay: 'BRGY. 708 ZONE 77', pres_city: 'MANILA', pres_province: 'METRO MANILA (NCR)', pres_zip: '1004',
          pres_cellphone: '09171234567', email_address: 'mtheresa.reyes@globalbank.ph', years_stay_present: '2',
          home_ownership: 'Rented', mailing_preference: 'Employer/Business Address',
          occupation: 'Branch Manager', employment_type: 'Locally Employed', industry_category: 'Financial Services/Intermediation',
          tin: '456789012000', sss_gsis: '34-1122334-5',
          employer_business_tel: '028888-8888', employer_name: 'GLOBAL BANK PHILIPPINES',
          employer_address_line: 'GT TOWER, AYALA AVENUE', employer_subdivision: 'MAKATI CENTRAL BUSINESS DISTRICT', employer_barangay: 'BRGY. SAN LORENZO', employer_city: 'MAKATI CITY', employer_province: 'METRO MANILA (NCR)', employer_zip: '1223',
          employer_email: 'hr@globalbank.ph',
          position_dept: 'Branch Manager / Retail Banking', preferred_time_contact: '8:00 AM - 6:00 PM',
          place_assignment: 'Makati Main Branch', years_employment: '10',
          signature_date: new Date().toISOString().split('T')[0],
          // Spouse block (Married)
          spouse_last_name: 'REYES', spouse_first_name: 'JOHN PAUL', spouse_ext_name: 'N/A', spouse_middle_name: 'GARCIA',
          spouse_dob: '02/14/1985', spouse_citizenship: 'FILIPINO', spouse_tin: '789456123000',
          spouse_occupation: 'Investment Banker', spouse_employer_name: 'BANK OF THE PHILIPPINE ISLANDS',
          spouse_place_assignment: 'BPI Head Office', spouse_years_employment: '12',
          spouse_employer_address_line: 'BPI HEAD OFFICE, AYALA AVENUE',
          spouse_position_dept: 'Vice President / Investment Banking',
          spouse_employer_subdivision: 'AYALA TRIANGLE', spouse_employer_barangay: 'BRGY. SAN LORENZO', spouse_employer_city: 'MAKATI CITY', spouse_employer_province: 'METRO MANILA (NCR)', spouse_employer_zip: '1226',
          spouse_business_tel: '028991-0000',
        },
      ],

      // ── Pag-IBIG HLF-068 (Housing Loan Application) ─────────────────────
      'pagibig-hlf-068': [
        {
          // ── Sample A: Daniel Jose R. Navarro · Davao bank manager ·
          // 6M loan for purchase of single-detached house & lot. ──
          mid_no: '8888-9999-0000', housing_account_no: '',
          desired_loan_amount: '6000000',
          existing_housing_application: 'No',
          loan_purpose: 'Purchase of a residential house and lot/townhouse',
          loan_term: '20', mode_of_payment: 'Salary deduction',
          property_type: 'Single Detached', property_mortgaged: 'No', offsite_collateral: 'No',
          sex: 'Male', marital_status: 'Married',
          home_ownership: 'Owned', employment_type: 'Employed',
          last_name: 'NAVARRO', first_name: 'DANIEL JOSE', ext_name: 'N/A', middle_name: 'RICO',
          citizenship: 'FILIPINO', dob: '06/20/1979',
          perm_unit: 'House 100', perm_street: 'SAMPAGUITA AVE', perm_subdivision: 'POBLACION HEIGHTS', perm_barangay: 'BRGY. POBLACION', perm_city: 'DAVAO CITY', perm_province: 'DAVAO DEL SUR', perm_zip: '8000',
          pres_unit: 'House 100', pres_street: 'SAMPAGUITA AVE', pres_subdivision: 'POBLACION HEIGHTS', pres_barangay: 'BRGY. POBLACION', pres_city: 'DAVAO CITY', pres_province: 'DAVAO DEL SUR', pres_zip: '8000',
          pres_cellphone: '09257778888', email_address: 'd.navarro@corp.com', years_stay_present: '10',
          sss_gsis: '34-9876543-1', employer_name: 'SOUTHERN PHILIPPINE BANK', tin: '654321098000',
          employer_address_line: 'SPB TOWER, MAGSAYSAY AVE', occupation: 'Bank Manager',
          employer_subdivision: 'POBLACION COMMERCIAL DISTRICT', employer_barangay: 'BRGY. POBLACION', employer_city: 'DAVAO CITY', employer_province: 'DAVAO DEL SUR', employer_zip: '8000',
          position_dept: 'Manager / Branch Banking', years_employment: '15',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // ── Sample B: Pedro Jose S. Reyes Sr. · Makati operations director
          // refinancing his Ayala Alabang condo (mortgaged). 3.5M loan, 15yr ──
          mid_no: '2222-3333-4445', housing_account_no: 'HL-2022-004567',
          desired_loan_amount: '3500000',
          existing_housing_application: 'Yes',
          loan_purpose: 'Refinancing of an existing housing loan',
          loan_term: '15', mode_of_payment: 'Over-the-Counter',
          property_type: 'Condominium', property_mortgaged: 'Yes', offsite_collateral: 'No',
          sex: 'Male', marital_status: 'Married',
          home_ownership: 'Mortgaged', employment_type: 'Employed',
          last_name: 'REYES', first_name: 'PEDRO JOSE', ext_name: 'Sr.', middle_name: 'SANTOS',
          citizenship: 'FILIPINO', dob: '05/10/1976',
          perm_unit: 'Blk 3 Lot 8', perm_street: 'ACACIA AVE', perm_subdivision: 'AYALA ALABANG VILLAGE', perm_barangay: 'BRGY. AYALA ALABANG', perm_city: 'MUNTINLUPA', perm_province: 'METRO MANILA (NCR)', perm_zip: '1780',
          pres_unit: 'Blk 3 Lot 8', pres_street: 'ACACIA AVE', pres_subdivision: 'AYALA ALABANG VILLAGE', pres_barangay: 'BRGY. AYALA ALABANG', pres_city: 'MUNTINLUPA', pres_province: 'METRO MANILA (NCR)', pres_zip: '1780',
          pres_cellphone: '09191234567', email_address: 'p.reyes@mnlcorp.com', years_stay_present: '8',
          sss_gsis: '11-1234567-8', employer_name: 'MANILA CORPORATION', tin: '123456789000',
          employer_address_line: 'AYALA AVE', occupation: 'Operations Director',
          employer_subdivision: 'AYALA TRIANGLE', employer_barangay: 'BRGY. LEGAZPI VILLAGE', employer_city: 'MAKATI CITY', employer_province: 'METRO MANILA (NCR)', employer_zip: '1226',
          position_dept: 'Operations Director / Corporate Affairs', years_employment: '18',
          signature_date: new Date().toISOString().split('T')[0],
        },
        {
          // ── Sample C: FULL — Maria Carla T. Dela Vega · CFO at PhilCorp
          // Global · 8M loan for self-construction of new home in Cainta. ──
          mid_no: '1111-2222-3334', housing_account_no: 'HL-2024-010101',
          desired_loan_amount: '8000000',
          existing_housing_application: 'No',
          loan_purpose: 'Construction or completion of a residential unit',
          loan_term: '25', mode_of_payment: 'Salary deduction',
          property_type: 'Single Detached', property_mortgaged: 'No', offsite_collateral: 'No',
          sex: 'Female', marital_status: 'Married',
          home_ownership: 'Rented', employment_type: 'Employed',
          last_name: 'DELA VEGA', first_name: 'MARIA CARLA', ext_name: 'N/A', middle_name: 'TORRES',
          citizenship: 'FILIPINO', dob: '09/30/1981',
          perm_unit: 'House 5 Block 3', perm_street: 'ILANG-ILANG STREET', perm_subdivision: 'FILINVEST EAST', perm_barangay: 'BRGY. SAN ISIDRO', perm_city: 'CAINTA', perm_province: 'RIZAL', perm_zip: '1900',
          pres_unit: 'Unit 22A', pres_street: 'ANNAPOLIS ST', pres_subdivision: 'GREENHILLS', pres_barangay: 'BRGY. ADDITION HILLS', pres_city: 'SAN JUAN', pres_province: 'METRO MANILA (NCR)', pres_zip: '1500',
          pres_cellphone: '09178889990', email_address: 'carla.delavega@ph-corp.com', years_stay_present: '3',
          sss_gsis: '34-5566778-9', employer_name: 'PHILCORP GLOBAL INC.',
          tin: '654999333000', employer_address_line: 'EMERALD AVE, ORTIGAS CENTER', occupation: 'CFO',
          employer_subdivision: 'ORTIGAS CENTER', employer_barangay: 'BRGY. SAN ANTONIO', employer_city: 'PASIG', employer_province: 'METRO MANILA (NCR)', employer_zip: '1605',
          position_dept: 'Chief Financial Officer / Finance', years_employment: '12',
          signature_date: new Date().toISOString().split('T')[0],
        },
      ],

      // ── BIR 1904 (Application for Registration — One-Time Taxpayer / E.O. 98) ──
      // 3 samples × 53 fields × 7 steps. ZERO-blanks rule: every applicable
      // field is populated. Mutually-exclusive fields (Individual vs Estate/Trust;
      // Filipino vs Foreign National) are left blank ONLY when filling them
      // would produce semantically nonsensical data — these are noted per sample.
      'bir-1904': [
        {
          // ── Sample 1: E.O. 98 — Filipino Citizen, Single (most common path:
          // securing TIN for first-time jobseeker / government transactions) ──
          date_of_registration: '04/26/2026', // BIR-only field (intake placeholder)
          philsys_pcn: '1234567890123456',
          rdo_code: '050', // BIR-only field (intake placeholder, RDO 050 = QC South)
          taxpayer_type: 'E.O. 98 — Filipino Citizen',
          // foreign_tin / country_of_residence: not applicable (Filipino)
          foreign_tin: '',
          country_of_residence: '',
          last_name: 'REYES',
          first_name: 'MARIA CRISTINA',
          middle_name: 'SANTOS',
          name_suffix: '',
          nickname: 'Maricris',
          // registered_name / estate_trust_name: not applicable (Individual)
          registered_name: '',
          estate_trust_name: '',
          date_of_birth: '03/15/1998',
          place_of_birth: 'Quezon City, Metro Manila',
          local_unit: 'Unit 4B',
          local_building: 'Sampaguita Residences',
          local_lot: 'Lot 12 Block 5',
          local_street: 'Holy Spirit Drive',
          local_subdivision: 'Don Antonio Heights',
          local_barangay: 'Brgy. Holy Spirit',
          local_town: 'District 2',
          local_city: 'Quezon City',
          local_province: 'Metro Manila (NCR)',
          local_zip: '1127',
          // foreign_address / date_of_arrival: not applicable (Filipino, not foreign national)
          foreign_address: '',
          municipality_code: '13742', // BIR-only field (PSGC for QC, intake placeholder)
          date_of_arrival: '',
          gender: 'Female',
          civil_status: 'Single',
          contact_number: '0917-123-4567',
          email: 'maricris.reyes@email.com',
          mothers_name: 'ROSA MARIE TORRES SANTOS',
          fathers_name: 'JUAN PABLO DELA CRUZ REYES',
          id_type: 'UMID',
          id_number: 'CRN-0001-2345678-9',
          id_effectivity: '06/01/2023',
          id_expiry: '06/01/2033',
          // Spouse block: not applicable (Single). Left blank intentionally.
          spouse_employment_status: '',
          spouse_name: '',
          spouse_tin: '',
          spouse_employer_name: '',
          spouse_employer_tin: '',
          purpose_of_tin: 'B. Dealings with government offices (e.g. LTO, DFA, NBI)',
          purpose_other_specify: '',
          // Withholding agent block: not applicable (no WA for E.O. 98 first-timer).
          wa_tin: '',
          wa_rdo_code: '',
          wa_name: '',
          wa_address: '',
          wa_zip: '',
          wa_contact: '',
          wa_email: '',
          wa_title: '',
        },
        {
          // ── Sample 2: One-Time Taxpayer — Filipino Citizen, Married,
          // selling capital-asset real property (CGT). Buyer = Withholding Agent. ──
          date_of_registration: '04/26/2026',
          philsys_pcn: '2345678901234567',
          rdo_code: '081', // RDO 081 = Cebu City North
          taxpayer_type: 'One-Time Taxpayer — Filipino Citizen',
          foreign_tin: '',
          country_of_residence: '',
          last_name: 'CRUZ',
          first_name: 'PEDRO LUIS',
          middle_name: 'GARCIA',
          name_suffix: 'Jr.',
          nickname: 'Pete',
          registered_name: '',
          estate_trust_name: '',
          date_of_birth: '08/22/1976',
          place_of_birth: 'Cebu City, Cebu',
          local_unit: '',
          local_building: '',
          local_lot: 'Lot 5 Block 2',
          local_street: 'Mahogany Street',
          local_subdivision: 'Camella Subdivision',
          local_barangay: 'Brgy. San Isidro',
          local_town: '',
          local_city: 'Mandaue City',
          local_province: 'Cebu',
          local_zip: '6014',
          foreign_address: '',
          municipality_code: '07215',
          date_of_arrival: '',
          gender: 'Male',
          civil_status: 'Married',
          contact_number: '0922-888-7777',
          email: 'pedro.cruz@gmail.com',
          mothers_name: 'LOLITA RAMIREZ GARCIA',
          fathers_name: 'MANUEL TORRES CRUZ SR.',
          id_type: 'Passport',
          id_number: 'P0123456A',
          id_effectivity: '04/12/2022',
          id_expiry: '04/12/2032',
          spouse_employment_status: 'Employed in the Philippines',
          spouse_name: 'CRUZ, MARIA ELENA NAVARRO',
          spouse_tin: '234567890000', // 12-digit (last 5 zeros = branch reserved)
          spouse_employer_name: 'METROPOLITAN BANK & TRUST CO.',
          spouse_employer_tin: '000123456789',
          purpose_of_tin: 'E. Real property — capital asset',
          purpose_other_specify: '',
          // Buyer of the property is the Withholding Agent for CGT.
          wa_tin: '567890123000',
          wa_rdo_code: '050',
          wa_name: 'ALPHA REALTY CORPORATION',
          wa_address: '88 Ayala Avenue, Makati City, Metro Manila',
          wa_zip: '1226',
          wa_contact: '02-8876-5432',
          wa_email: 'tax@alpharealty.com.ph',
          wa_title: 'Tax Officer',
        },
        {
          // ── Sample 3: FULL — Foreign National E.O. 98 + Married + Tax Agent.
          // Exercises every field including foreign_tin, country_of_residence,
          // foreign_address, date_of_arrival, full spouse block, full WA block,
          // and Purpose=Other (specify). registered_name/estate_trust_name
          // remain blank because the taxpayer is an Individual, not Estate/Trust. ──
          date_of_registration: '04/26/2026',
          philsys_pcn: '3456789012345678',
          rdo_code: '044', // RDO 044 = Makati City East
          taxpayer_type: 'E.O. 98 — Foreign National',
          foreign_tin: 'JP-1234567890',
          country_of_residence: 'JAPAN',
          last_name: 'TANAKA',
          first_name: 'HIROSHI',
          middle_name: 'WATANABE',
          name_suffix: '',
          nickname: 'Hiro',
          registered_name: '', // Individual taxpayer — not applicable
          estate_trust_name: '', // Not an Estate/Trust — not applicable
          date_of_birth: '11/05/1980',
          place_of_birth: 'Tokyo, Japan',
          local_unit: 'Unit 12B',
          local_building: 'Trump Tower Makati',
          local_lot: 'Lot 8 Block 3',
          local_street: 'Forbes Street',
          local_subdivision: 'Bel-Air Village',
          local_barangay: 'Brgy. Bel-Air',
          local_town: 'District 1',
          local_city: 'Makati City',
          local_province: 'Metro Manila (NCR)',
          local_zip: '1209',
          foreign_address: '2-1-1 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan',
          municipality_code: '13720', // PSGC Makati
          date_of_arrival: '01/15/2025',
          gender: 'Male',
          civil_status: 'Married',
          contact_number: '0918-888-9999',
          email: 'h.tanaka@globalfirm.jp',
          mothers_name: 'YUKI ITO WATANABE',
          fathers_name: 'KENJI SUZUKI TANAKA',
          id_type: 'Passport',
          id_number: 'TZ1234567',
          id_effectivity: '02/20/2023',
          id_expiry: '02/19/2033',
          spouse_employment_status: 'Employed Abroad',
          spouse_name: 'TANAKA, AYUMI YAMADA',
          spouse_tin: '345678901000',
          spouse_employer_name: 'SONY CORPORATION',
          spouse_employer_tin: '000345678999',
          purpose_of_tin: 'J. Other (specify below)',
          purpose_other_specify: 'SEC registration of Philippine branch office',
          // Tax agent retained to facilitate registration.
          wa_tin: '678901234000',
          wa_rdo_code: '044',
          wa_name: 'PUNONGBAYAN & ARAULLO',
          wa_address: '20F Tower 1, The Enterprise Center, 6766 Ayala Avenue, Makati City',
          wa_zip: '1226',
          wa_contact: '02-8988-2288',
          wa_email: 'tax.advisory@punongbayan-araullo.com',
          wa_title: 'Senior Tax Manager',
        },
      ],

      // ── BIR 1902 (Application for Registration — Purely Compensation Income) ──
      // 3 samples × 41 fields × 5 steps. Conditional gates: spouse block populated
      // only when civil_status='Married'; foreign_address blank for Local Employee;
      // other_citizenship blank for Filipino.
      'bir-1902': [
        {
          // Sample 1: Local Employee — Filipino, Single (most common path).
          philsys_pcn: '1234567890123456',
          tin: '123456789012',
          taxpayer_type: 'Local Employee',
          last_name: 'DELA CRUZ', first_name: 'JUAN MIGUEL', middle_name: 'SANTOS', name_suffix: '',
          gender: 'Male', civil_status: 'Single',
          date_of_birth: '03/15/1995', place_of_birth: 'QUEZON CITY, METRO MANILA',
          mothers_maiden_name: 'ROSA MARIE TORRES SANTOS',
          fathers_name: 'PEDRO LUIS GARCIA DELA CRUZ',
          citizenship: 'FILIPINO', other_citizenship: '',
          local_unit: 'Unit 4B', local_building: 'SAMPAGUITA RESIDENCES',
          local_lot: 'LOT 12 BLOCK 5', local_street: 'HOLY SPIRIT DRIVE',
          local_subdivision: 'DON ANTONIO HEIGHTS', local_barangay: 'BRGY. HOLY SPIRIT',
          local_town: 'DISTRICT 2', local_city: 'QUEZON CITY',
          local_province: 'METRO MANILA (NCR)', local_zip: '1127',
          foreign_address: '',
          id_type: 'UMID', id_number: 'CRN-0001-2345678-9',
          id_effectivity: '06/01/2023', id_expiry: '06/01/2033',
          id_issuer: 'SSS', id_place_issue: 'QUEZON CITY',
          preferred_contact_type: 'Mobile',
          contact_landline: '', contact_fax: '',
          contact_mobile: '0917-123-4567', contact_email: 'juan.delacruz@email.com',
          spouse_employment_status: '',
          spouse_last_name: '', spouse_first_name: '', spouse_middle_name: '', spouse_suffix: '',
          spouse_tin: '', spouse_employer_name: '', spouse_employer_tin: '',
        },
        {
          // Sample 2: Local Employee — Filipino, Married (full spouse block populated).
          philsys_pcn: '2345678901234567',
          tin: '234567890123',
          taxpayer_type: 'Local Employee',
          last_name: 'REYES', first_name: 'MARIA CRISTINA', middle_name: 'GARCIA', name_suffix: '',
          gender: 'Female', civil_status: 'Married',
          date_of_birth: '08/22/1988', place_of_birth: 'CEBU CITY, CEBU',
          mothers_maiden_name: 'CARMEN ANGELES VILLANUEVA GARCIA',
          fathers_name: 'JOSE ANTONIO MENDOZA REYES',
          citizenship: 'FILIPINO', other_citizenship: '',
          local_unit: '', local_building: '',
          local_lot: 'LOT 5 BLOCK 2', local_street: 'MABOLO STREET',
          local_subdivision: 'MABOLO VILLAGE', local_barangay: 'BRGY. MABOLO',
          local_town: '', local_city: 'CEBU CITY',
          local_province: 'CEBU', local_zip: '6000',
          foreign_address: '',
          id_type: 'PASSPORT', id_number: 'P1234567A',
          id_effectivity: '01/15/2022', id_expiry: '01/15/2032',
          id_issuer: 'DFA', id_place_issue: 'CEBU CITY',
          preferred_contact_type: 'Email',
          contact_landline: '032-555-1234', contact_fax: '',
          contact_mobile: '0928-987-6543', contact_email: 'maria.reyes@email.com',
          spouse_employment_status: 'Employed in the Philippines',
          spouse_last_name: 'TORRES', spouse_first_name: 'RICARDO',
          spouse_middle_name: 'MENDOZA', spouse_suffix: 'Jr.',
          spouse_tin: '345678901234',
          spouse_employer_name: 'AYALA CORPORATION',
          spouse_employer_tin: '000123456789',
        },
        {
          // Sample 3: Resident Alien — Married, with foreign address + dual citizenship.
          philsys_pcn: '',
          tin: '345678901234',
          taxpayer_type: 'Resident Alien',
          last_name: 'TANAKA', first_name: 'HIROSHI', middle_name: '', name_suffix: '',
          gender: 'Male', civil_status: 'Married',
          date_of_birth: '11/30/1982', place_of_birth: 'TOKYO, JAPAN',
          mothers_maiden_name: 'YUKI SATO TANAKA',
          fathers_name: 'KENJI TANAKA',
          citizenship: 'JAPANESE', other_citizenship: 'FILIPINO',
          local_unit: 'Unit 2502', local_building: 'ONE MCKINLEY PLACE',
          local_lot: '', local_street: '4TH AVENUE',
          local_subdivision: 'BONIFACIO GLOBAL CITY', local_barangay: 'BRGY. FORT BONIFACIO',
          local_town: '', local_city: 'TAGUIG CITY',
          local_province: 'METRO MANILA (NCR)', local_zip: '1634',
          foreign_address: '3-1-1 KASUMIGASEKI, CHIYODA-KU, TOKYO 100-0013 JAPAN',
          id_type: 'ACR I-CARD', id_number: 'E-12345678A',
          id_effectivity: '02/01/2024', id_expiry: '02/01/2027',
          id_issuer: 'BUREAU OF IMMIGRATION', id_place_issue: 'MANILA',
          preferred_contact_type: 'Mobile',
          contact_landline: '', contact_fax: '',
          contact_mobile: '0939-444-5566', contact_email: 'hiroshi.tanaka@globalcorp.com',
          spouse_employment_status: 'Employed Abroad',
          spouse_last_name: 'TANAKA', spouse_first_name: 'AKIKO',
          spouse_middle_name: '', spouse_suffix: '',
          spouse_tin: '',
          spouse_employer_name: 'MITSUBISHI CORPORATION TOKYO',
          spouse_employer_tin: '',
        },
      ],

      // ── BIR 2316 (Certificate of Compensation Payment / Tax Withheld) ──
      // 3 samples × 75 fields × 7 steps. ZERO-blanks rule: every applicable
      // field is populated INCLUDING Previous Employer (Step 3) in all 3 samples.
      // All three personas are now mid-year-change scenarios so the Previous
      // Employer block, `taxable_previous`, and `taxes_withheld_previous` are
      // never blank. Conditional gates per BIR rules:
      //   • MWE-exempt block (basic_salary_mwe / holiday / OT / night / hazard) filled
      //     ONLY when employee is paid statutory minimum wage. None of the current
      //     personas are MWE → these stay at '0' (see §7.6 Q1 in the doc).
      //   • Foreign address (`emp_foreign_address`) filled only for OFW/overseas
      //     residence (Sample C only).
      //   • PERA tax credit filled only for voluntary PERA contributors (Sample C).
      // Numbers reconcile: gross − non-taxable = taxable_present; taxable_present
      // + taxable_previous = gross_taxable; tax_due derived from 2018 TRAIN brackets.
      'bir-2316': [
        {
          // ── Sample 1: Mid-year join. Worked Jan-Mar at Startup Ventures,
          // joined ACME 04/01. Both employers populated; non-MWE; no PERA. ──
          year: '2025',
          period_from: '04/01',
          period_to: '12/31',
          emp_tin_1: '123', emp_tin_2: '456', emp_tin_3: '789', emp_tin_branch: '00000',
          emp_name: 'DELA CRUZ, JUAN ANDRES PONCE',
          emp_rdo: '050',
          emp_reg_address: '123 Holy Spirit Drive, Brgy. Holy Spirit, Quezon City, Metro Manila',
          emp_reg_zip: '1127',
          emp_local_address: '123 Holy Spirit Drive, Brgy. Holy Spirit, Quezon City, Metro Manila',
          emp_local_zip: '1127',
          emp_foreign_address: '', // N/A — Filipino resident
          emp_dob: '06/15/1990',
          emp_contact: '0917-555-1234',
          min_wage_per_day: '0', // Non-MWE
          min_wage_per_month: '0',
          // Step 2: Present Employer (Apr-Dec 2025)
          pres_emp_tin_1: '009', pres_emp_tin_2: '876', pres_emp_tin_3: '543', pres_emp_tin_branch: '00000',
          pres_emp_name: 'ACME CORPORATION PHILIPPINES INC.',
          pres_emp_address: '88 Ayala Avenue, Makati City, Metro Manila',
          pres_emp_zip: '1226',
          // Step 3: Previous Employer (Jan-Mar 2025) — FILLED per ZERO-blanks rule
          prev_emp_tin_1: '005', prev_emp_tin_2: '432', prev_emp_tin_3: '100', prev_emp_tin_branch: '00000',
          prev_emp_name: 'STARTUP VENTURES INC.',
          prev_emp_address: '88 Eastwood Avenue, Brgy. Bagumbayan, Quezon City, Metro Manila',
          prev_emp_zip: '1110',
          // Step 4: Summary (Part IV-A) — reconciled across both employers
          gross_compensation: '600000', // ACME Apr-Dec
          less_non_taxable: '110000', // 13thM 80K + SSS/PHIC/HDMF 30K
          taxable_present: '490000',
          taxable_previous: '150000', // Startup Ventures Jan-Mar
          gross_taxable: '640000',
          // TRAIN: 400-800K bracket → 22,500 + 20%(640K-400K) = 22,500 + 48,000 = 70,500
          tax_due: '70500',
          taxes_withheld_present: '50500',
          taxes_withheld_previous: '20000',
          total_withheld_adjusted: '70500',
          tax_credit_pera: '0',
          total_taxes_withheld: '70500',
          // Step 5: Non-Taxable (Part IV-B A) — non-MWE so MWE rows = 0
          basic_salary_mwe: '0',
          holiday_pay_mwe: '0',
          overtime_pay_mwe: '0',
          night_shift_mwe: '0',
          hazard_pay_mwe: '0',
          thirteenth_month: '80000',
          de_minimis: '0',
          sss_gsis_phic_hdmf: '30000',
          salaries_other: '0',
          total_non_taxable: '110000',
          // Step 6: Taxable & Supplementary (Part IV-B B) — must sum to 490,000
          basic_salary: '480000',
          representation: '0',
          transportation: '0',
          cola: '0',
          fixed_housing: '0',
          others_a_label: '',
          others_a_amount: '0',
          others_b_label: '',
          others_b_amount: '0',
          commission: '10000', // Year-end performance bonus
          profit_sharing: '0',
          fees_director: '0',
          taxable_13th_benefits: '0',
          supp_hazard: '0',
          supp_overtime: '0',
          others_supp_label: '',
          others_51a_label: '',
          others_51a_amount: '0',
          others_51b_label: '',
          others_51b_amount: '0',
          total_taxable_compensation: '490000',
          // Step 7: Signatures & Dates — substituted filing
          present_emp_date_signed: '01/30/2026',
          employee_date_signed: '01/31/2026',
          ctc_no: '12345678',
          ctc_place: 'QUEZON CITY',
          ctc_date_issued: '01/15/2026',
          ctc_amount: '500',
        },
        {
          // ── Sample 2: Mid-year job change (Jul). Both Present + Previous
          // employers populated, taxable_previous and taxes_withheld_previous > 0,
          // exercises the Step 3 conditional block. ──
          year: '2025',
          period_from: '07/01', // Started present employer mid-year
          period_to: '12/31',
          emp_tin_1: '234', emp_tin_2: '567', emp_tin_3: '890', emp_tin_branch: '00000',
          emp_name: 'SANTOS, ANNA MARIE REYES',
          emp_rdo: '044',
          emp_reg_address: '45 Pearl Drive, Brgy. San Antonio, Pasig City, Metro Manila',
          emp_reg_zip: '1605',
          emp_local_address: '45 Pearl Drive, Brgy. San Antonio, Pasig City, Metro Manila',
          emp_local_zip: '1605',
          emp_foreign_address: '',
          emp_dob: '11/22/1988',
          emp_contact: '0922-777-6543',
          min_wage_per_day: '0',
          min_wage_per_month: '0',
          // Step 2: Present Employer (Jul-Dec 2025)
          pres_emp_tin_1: '008', pres_emp_tin_2: '765', pres_emp_tin_3: '432', pres_emp_tin_branch: '00000',
          pres_emp_name: 'GLOBAL TECH SOLUTIONS PHILIPPINES INC.',
          pres_emp_address: 'GT Tower, Ayala Avenue, Makati City, Metro Manila',
          pres_emp_zip: '1226',
          // Step 3: Previous Employer (Jan-Jun 2025) — FILLED
          prev_emp_tin_1: '007', prev_emp_tin_2: '654', prev_emp_tin_3: '321', prev_emp_tin_branch: '00000',
          prev_emp_name: 'METRO BUSINESS CORPORATION',
          prev_emp_address: '50 Ortigas Avenue, Brgy. San Antonio, Pasig City, Metro Manila',
          prev_emp_zip: '1605',
          // Step 4: Summary — present 6 months, previous 6 months
          gross_compensation: '350000', // Present employer Jul-Dec
          less_non_taxable: '75000', // 13thM 50K + SSS 25K
          taxable_present: '275000',
          taxable_previous: '200000', // From previous employer Jan-Jun
          gross_taxable: '475000',
          // TRAIN: 22,500 + 20%(475K-400K) = 22,500 + 15,000 = 37,500
          tax_due: '37500',
          taxes_withheld_present: '21000', // Pro-rated from present
          taxes_withheld_previous: '16500', // Withheld by previous employer
          total_withheld_adjusted: '37500',
          tax_credit_pera: '0',
          total_taxes_withheld: '37500',
          // Step 5: Non-Taxable (present employer)
          basic_salary_mwe: '0',
          holiday_pay_mwe: '0',
          overtime_pay_mwe: '0',
          night_shift_mwe: '0',
          hazard_pay_mwe: '0',
          thirteenth_month: '50000',
          de_minimis: '0',
          sss_gsis_phic_hdmf: '25000',
          salaries_other: '0',
          total_non_taxable: '75000',
          // Step 6: Taxable Supplementary — sums to 275,000
          basic_salary: '270000',
          representation: '0',
          transportation: '0',
          cola: '0',
          fixed_housing: '0',
          others_a_label: '',
          others_a_amount: '0',
          others_b_label: '',
          others_b_amount: '0',
          commission: '5000', // End-of-year sales commission
          profit_sharing: '0',
          fees_director: '0',
          taxable_13th_benefits: '0',
          supp_hazard: '0',
          supp_overtime: '0',
          others_supp_label: '',
          others_51a_label: '',
          others_51a_amount: '0',
          others_51b_label: '',
          others_51b_amount: '0',
          total_taxable_compensation: '275000',
          // Step 7
          present_emp_date_signed: '01/29/2026',
          employee_date_signed: '01/30/2026',
          ctc_no: '23456789',
          ctc_place: 'PASIG CITY',
          ctc_date_issued: '01/10/2026',
          ctc_amount: '500',
        },
        {
          // ── Sample 3: FULL — exercises EVERY field including all MWE rows,
          // every Step 6 supplementary line (including all 4 Others labels +
          // amounts), Foreign Address, PERA tax credit. Persona: high-income
          // executive who was previously a Statutory Minimum Wage Earner (MWE)
          // earlier in career — so MWE block is filled to demonstrate it works,
          // but current year's taxable income is high. (We mark this as
          // semantically odd in the reviewer notes — see §7.6 Q1.) ──
          year: '2025',
          period_from: '03/01',
          period_to: '12/31',
          emp_tin_1: '345', emp_tin_2: '678', emp_tin_3: '901', emp_tin_branch: '00000',
          emp_name: 'REYES, CARLOS MIGUEL VILLANUEVA',
          emp_rdo: '044',
          emp_reg_address: 'Lot 12 Block 5, Forbes Park, Brgy. Bel-Air, Makati City, Metro Manila',
          emp_reg_zip: '1209',
          emp_local_address: 'Unit 4502 Trump Tower, Bonifacio Global City, Brgy. Fort Bonifacio, Taguig City',
          emp_local_zip: '1634',
          emp_foreign_address: '12 Sentosa Cove, Singapore 098297', // Has overseas property
          emp_dob: '08/14/1972',
          emp_contact: '0918-222-9999',
          // Statutory Minimum Wage rates exposed (BIR requires these even for non-MWE)
          min_wage_per_day: '610', // 2025 NCR daily rate
          min_wage_per_month: '15860', // 26-day month equivalent
          // Step 2: Present Employer (Mar-Dec 2025)
          pres_emp_tin_1: '006', pres_emp_tin_2: '543', pres_emp_tin_3: '210', pres_emp_tin_branch: '00000',
          pres_emp_name: 'PHILSTAR INVESTMENT BANKING CORPORATION',
          pres_emp_address: '40F PSE Tower, 28th Street, Bonifacio Global City, Taguig City',
          pres_emp_zip: '1634',
          // Step 3: Previous Employer (Jan-Feb 2025) — FILLED per ZERO-blanks rule
          prev_emp_tin_1: '002', prev_emp_tin_2: '345', prev_emp_tin_3: '678', prev_emp_tin_branch: '00000',
          prev_emp_name: 'ASIAN DEVELOPMENT BANK PHILIPPINES OFFICE',
          prev_emp_address: 'ADB Avenue, Ortigas Center, Brgy. San Antonio, Mandaluyong City',
          prev_emp_zip: '1550',
          // Step 4: Summary — Mar-Dec at PhilStar + Jan-Feb at ADB
          gross_compensation: '1500000',
          less_non_taxable: '175000', // = total of Step 5
          taxable_present: '1325000',
          taxable_previous: '250000', // ADB Jan-Feb
          gross_taxable: '1575000',
          // TRAIN: 800K-2M bracket → 102,500 + 25%(1575K-800K) = 102,500 + 193,750 = 296,250
          tax_due: '296250',
          taxes_withheld_present: '263750',
          taxes_withheld_previous: '32500', // Withheld by ADB
          total_withheld_adjusted: '296250',
          tax_credit_pera: '5000', // PERA contribution credit (RA 9505)
          total_taxes_withheld: '291250', // 296,250 − 5,000 PERA credit
          // Step 5: Non-Taxable — every row exercised (175,000 total)
          basic_salary_mwe: '0', // Not MWE in 2025 — left 0 (see §7.6 Q1)
          holiday_pay_mwe: '0',
          overtime_pay_mwe: '0',
          night_shift_mwe: '0',
          hazard_pay_mwe: '0',
          thirteenth_month: '90000', // Capped at P90K
          de_minimis: '50000',
          sss_gsis_phic_hdmf: '30000',
          salaries_other: '5000',
          total_non_taxable: '175000',
          // Step 6: Taxable Supplementary — every line exercised, sum = 1,325,000
          basic_salary: '1000000',
          representation: '50000',
          transportation: '30000',
          cola: '24000',
          fixed_housing: '60000',
          others_a_label: 'Communication Allowance',
          others_a_amount: '12000',
          others_b_label: 'Books & Tools Allowance',
          others_b_amount: '8000',
          commission: '50000',
          profit_sharing: '30000',
          fees_director: '25000',
          taxable_13th_benefits: '0', // 13thM already in non-taxable cap
          supp_hazard: '0', // Not a hazardous role
          supp_overtime: '21000',
          others_supp_label: 'Performance-linked Variable Pay',
          others_51a_label: 'Sales Incentive Bonus',
          others_51a_amount: '10000',
          others_51b_label: 'Loyalty / Retention Bonus',
          others_51b_amount: '5000',
          total_taxable_compensation: '1325000',
          // Step 7: full CTC info
          present_emp_date_signed: '01/28/2026',
          employee_date_signed: '01/30/2026',
          ctc_no: '34567890',
          ctc_place: 'TAGUIG CITY',
          ctc_date_issued: '01/05/2026',
          ctc_amount: '5000', // Higher CTC for high-income earner
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
      const pdfjsLib = await getPdfjsLib();
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
      const pdfjsLib = await getPdfjsLib();

      const npdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const page = await npdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx as never, viewport }).promise;

      // Apply tiled watermark — only in Demo mode
      if (isDemoMode) {
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
            ctx.font = `bold ${Math.round(fSize * 0.65)}px Arial, sans-serif`;
            ctx.fillText('DEMO', 0, fSize * 0.9);
            ctx.font = `bold ${fSize}px Arial, sans-serif`;
            ctx.restore();
          }
        }
        ctx.restore();
      }

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
      const pdfBytes = await generatePDF(form, values, sourceBytes, isDemoMode);
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
        agency={form.agency}
        onAccessGranted={(isDemo) => setIsDemoMode(isDemo)}
        onClose={() => window.history.back()}
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
          onSaveAndClose={() => { saveDraft(form.slug, values); router.push('/'); }}
          onCloseSession={() => {
            clearDraft(form.slug);
            router.push('/');
          }}
        />
        {showSuccessModal && (
          <SuccessCodeModal
            onDownloadAgain={handleLocalDownload}
            onClose={() => setShowSuccessModal(false)}
            onSaveAndClose={() => { saveDraft(form.slug, values); router.push('/'); }}
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
          <button
            onClick={() => setMode('review')}
            className="flex flex-1 min-w-0 flex-col items-center gap-1"
          >
            <div className="flex-shrink-0 step-dot step-dot-idle">✎</div>
            <span className="text-[10px] font-medium text-gray-400 text-center leading-tight min-h-[2.5em] w-full">Review</span>
          </button>
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

// ─── Date mask helpers ────────────────────────────────────────────────────────
// Site-wide rule: all date inputs use a masked text input "mm / dd / yyyy".
function formatDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
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
  const [acFocused, setAcFocused] = useState(false);
  const acBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Autocomplete suggestions (Rule 1 — site-wide for City / Province / Bank / Country fields)
  const acSource = field.optionsSource as AutocompleteSource | undefined;
  const acOptions = acSource ? AUTOCOMPLETE_SOURCES[acSource] ?? [] : [];
  const acQuery = (value || '').trim().toLowerCase();
  const acSuggestions = acQuery
    ? acOptions.filter((o) => o.toLowerCase().includes(acQuery)).slice(0, 8)
    : acOptions.slice(0, 8);
  const showAcList = field.type === 'autocomplete' && acFocused && acSuggestions.length > 0;

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
      ) : field.type === 'autocomplete' ? (
        // Rule 1 — site-wide: autocomplete (typed text + filtered suggestions).
        // User can also type values not in the list (e.g. small municipalities).
        <div className="relative">
          <input
            type="text"
            {...commonProps}
            placeholder={commonProps.placeholder || `Type to search ${field.label.toLowerCase()}…`}
            list={undefined}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showAcList}
            onFocus={() => {
              if (acBlurTimer.current) clearTimeout(acBlurTimer.current);
              setAcFocused(true);
            }}
            onBlur={() => {
              // Delay so click on a suggestion can fire before list disappears.
              acBlurTimer.current = setTimeout(() => setAcFocused(false), 150);
            }}
          />
          {showAcList && (
            <ul
              className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-600"
              role="listbox"
            >
              {acSuggestions.map((opt) => (
                <li
                  key={opt}
                  role="option"
                  aria-selected={value === opt}
                  className="px-3 py-2 cursor-pointer text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
                  onMouseDown={(e) => {
                    // Use onMouseDown so it fires before the input's blur.
                    e.preventDefault();
                    onChange(field.autoUppercase ? opt.toUpperCase() : opt);
                    setAcFocused(false);
                  }}
                >
                  {opt}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : field.type === 'date' ? (
        // Rule 2 — Clear icon beside the textbox.
        // Rule 3 — site-wide: format = mm / dd / yyyy (masked text, not native picker).
        <div className="relative">
          <input
            type="text"
            id={field.id}
            value={value}
            onChange={(e) => onChange(formatDateMask(e.target.value))}
            placeholder="mm / dd / yyyy"
            className="input-field pr-9"
            inputMode="numeric"
            maxLength={14}
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              aria-label={`Clear ${field.label}`}
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-base leading-none px-1"
              tabIndex={-1}
            >
              ✕
            </button>
          )}
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
  onSaveAndClose,
  onCloseSession,
}: {
  form: FormSchema;
  imageUrl: string;
  isDemoMode: boolean;
  onDownload: () => void;
  onBack: () => void;
  onSaveAndClose: () => void;
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
          {isDemoMode ? '[ Demo Mode ]' : '[ Full Version ]'}
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

          {/* Review reminder */}
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex gap-3 items-start">
            <span className="text-lg leading-none mt-0.5 flex-shrink-0">⚠️</span>
            <div>
              <p className="text-[12px] font-bold text-amber-400 mb-0.5">Review before downloading</p>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Please check that <strong className="text-amber-300">all information is correct</strong> and each field appears in its <strong className="text-amber-300">exact position</strong> on the form. Download only when everything looks right.
              </p>
            </div>
          </div>
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
            <div className="mt-4 text-center">
              <button
                onClick={onSaveAndClose}
                className="text-xs text-gray-400 hover:text-gray-600 underline-offset-4 hover:underline transition-colors"
              >
                Save as draft
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
  const [paymentMode, setPaymentMode]     = useState<'process' | 'upload_only'>('process');
  // Live settings fetched from API (fall back to props)
  const [liveNumber, setLiveNumber] = useState(gcashNumberProp);
  const [liveName, setLiveName]     = useState(gcashNameProp);
  const [liveQrUrl, setLiveQrUrl]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/gcash-settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: { gcash_number?: string; gcash_name?: string; qr_url?: string | null; payment_mode?: string } | null) => {
        if (!d) return;
        if (d.gcash_number) setLiveNumber(d.gcash_number);
        if (d.gcash_name)   setLiveName(d.gcash_name);
        setLiveQrUrl(d.qr_url ?? null);
        if (d.payment_mode === 'upload_only') setPaymentMode('upload_only');
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

    // Upload Only mode — skip OCR, just save screenshot and get access token
    if (paymentMode === 'upload_only') {
      try {
        const res  = await fetch('/api/payment/upload-screenshot', { method: 'POST', body: fd });
        const data = await res.json() as {
          ok: boolean;
          token?: string | null;
          tokenExpiresAt?: number | null;
          refNo?: string | null;
          amount?: number | null;
          error?: string;
        };
        if (data.ok && data.token && data.tokenExpiresAt && data.refNo) {
          setVerifiedMeta({
            token: data.token,
            refNo: data.refNo,
            amount: data.amount ?? 5,
            expiresAt: data.tokenExpiresAt,
          });
          setStep('verified');
        } else {
          setVerifyErrors([data.error ?? 'Upload failed']);
          setFailCount(c => c + 1);
          setStep('failed');
        }
      } catch {
        setVerifyErrors(['Could not reach server. Please try again.']);
        setFailCount(c => c + 1);
        setStep('failed');
      }
      return;
    }

    // Process Payment mode — full OCR verification
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
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
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
                Built to help Filipinos fill out government forms more easily. Your ₱5 or any extra supports maintenance and future updates. Maraming salamat po. 🙏💚
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
  onSaveAndClose,
  onCloseSession,
}: {
  onDownloadAgain: () => void;
  onClose: () => void;
  onSaveAndClose: () => void;
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
          <div className="mt-4 text-center">
            <button
              onClick={onSaveAndClose}
              className="text-xs text-gray-400 hover:text-gray-600 underline-offset-4 hover:underline transition-colors"
            >
              Save as draft
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
