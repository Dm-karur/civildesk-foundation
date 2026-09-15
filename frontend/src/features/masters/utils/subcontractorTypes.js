export const DEFAULT_SUBCONTRACTOR_TYPES = [
  { id: 1, type_code: 'SUB-MAIS', type_name: 'Maistry', description: 'General labor contractor', is_active: 1 },
  { id: 2, type_code: 'SUB-CARP', type_name: 'Carpenter', description: 'Woodwork and formwork', is_active: 1 },
  { id: 3, type_code: 'SUB-CENT', type_name: 'Centering', description: 'Centering and scaffolding', is_active: 1 },
  { id: 4, type_code: 'SUB-BAR', type_name: 'Bar Bender', description: 'Steel reinforcement', is_active: 1 },
];

export function getSubcontractorTypes() {
  try {
    const saved = localStorage.getItem('mock_subcontractor_types');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read mock_subcontractor_types:', e);
  }
  try {
    localStorage.setItem('mock_subcontractor_types', JSON.stringify(DEFAULT_SUBCONTRACTOR_TYPES));
  } catch (e) {
    console.error('Failed to initialize mock_subcontractor_types:', e);
  }
  return DEFAULT_SUBCONTRACTOR_TYPES;
}

export function saveSubcontractorTypes(types) {
  try {
    localStorage.setItem('mock_subcontractor_types', JSON.stringify(types));
  } catch (e) {
    console.error('Failed to save mock_subcontractor_types:', e);
  }
}
