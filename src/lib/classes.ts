// Shared class definitions — 1 to 12, with Bengali names
// Used across Roster, ReportCard, MTR, QR, Import, etc.
// Data entry works independently of import: manual entry via ClassRoster modal uses active subjects per class.

export const CLASS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

export const CLASS_NAMES: Record<number, string> = {
  0: '',
  1: 'প্রথম',
  2: 'দ্বিতীয়',
  3: 'তৃতীয়',
  4: 'চতুর্থ',
  5: 'পঞ্চম',
  6: 'ষষ্ঠ',
  7: 'সপ্তম',
  8: 'অষ্টম',
  9: 'নবম',
  10: 'দশম',
  11: 'একাদশ',
  12: 'দ্বাদশ',
}

// English fallback / short label
export const CLASS_SHORT: Record<number, string> = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
  12: '12',
}

export type ClassId = typeof CLASS_LIST[number]

// Helper to get display name
export function className(id: number): string {
  return CLASS_NAMES[id] ?? `ক্লাস ${id}`
}
