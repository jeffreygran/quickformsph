// Registry mapping `optionsSource` keys -> data arrays.
// Used by FieldInput to populate autocomplete suggestions.
import { PH_CITIES } from './ph_cities';
import { PH_PROVINCES } from './ph_provinces';
import { PH_BANKS } from './ph_banks';
import { COUNTRIES } from './countries';
import { PH_PAGIBIG_BRANCHES } from './ph_pagibig_branches';
import { PH_LOAN_PURPOSES_MPL } from './ph_loan_purposes_mpl';
import { PH_EMPLOYMENT_SOURCES } from './ph_employment_sources';
import { PH_KONSULTA_PROVIDERS } from './philhealth_konsulta';
import { NATIONALITIES } from './nationalities';

export type AutocompleteSource =
  | 'ph_cities'
  | 'ph_provinces'
  | 'ph_banks'
  | 'countries'
  | 'ph_pagibig_branches'
  | 'ph_loan_purposes_mpl'
  | 'ph_employment_sources'
  | 'philhealth_konsulta'
  | 'nationalities';

export const AUTOCOMPLETE_SOURCES: Record<AutocompleteSource, string[]> = {
  ph_cities: PH_CITIES,
  ph_provinces: PH_PROVINCES,
  ph_banks: PH_BANKS,
  countries: COUNTRIES,
  ph_pagibig_branches: PH_PAGIBIG_BRANCHES,
  ph_loan_purposes_mpl: PH_LOAN_PURPOSES_MPL,
  ph_employment_sources: PH_EMPLOYMENT_SOURCES,
  philhealth_konsulta: PH_KONSULTA_PROVIDERS,
  nationalities: NATIONALITIES,
};
