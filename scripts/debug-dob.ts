import { FORMS } from '../src/data/forms';
const form = FORMS.find(f=>f.slug==='philhealth-pmrf')!;
console.log('dob field:', JSON.stringify(form.fields.find(f=>f.id==='dob'),null,2));
console.log('has dob_month?', !!form.fields.find(f=>f.id==='dob_month'));
