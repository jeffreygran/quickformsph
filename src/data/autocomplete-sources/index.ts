// Registry mapping `optionsSource` keys -> data arrays.
// Used by FieldInput to populate autocomplete suggestions.
import { PH_CITIES } from './ph_cities';
import { PH_PROVINCES } from './ph_provinces';
import { PH_BANKS } from './ph_banks';
import { COUNTRIES } from './countries';

export type AutocompleteSource =
  | 'ph_cities'
  | 'ph_provinces'
  | 'ph_banks'
  | 'countries';

export const AUTOCOMPLETE_SOURCES: Record<AutocompleteSource, string[]> = {
  ph_cities: PH_CITIES,
  ph_provinces: PH_PROVINCES,
  ph_banks: PH_BANKS,
  countries: COUNTRIES,
};
