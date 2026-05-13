export interface ColorScheme {
  id: string;
  name: string;
  headerBg: string;
  headerText: string;
  accentColor: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'navy', name: '深藍經典', headerBg: '#1B3A6B', headerText: '#FFFFFF', accentColor: '#2563EB' },
  { id: 'slate', name: '石板灰', headerBg: '#334155', headerText: '#FFFFFF', accentColor: '#64748B' },
  { id: 'warm', name: '暖棕', headerBg: '#78350F', headerText: '#FFFFFF', accentColor: '#D97706' },
  { id: 'forest', name: '森林綠', headerBg: '#14532D', headerText: '#FFFFFF', accentColor: '#16A34A' },
  { id: 'white', name: '純白簡約', headerBg: '#FFFFFF', headerText: '#1E293B', accentColor: '#3B82F6' },
  { id: 'burgundy', name: '酒紅', headerBg: '#7F1D1D', headerText: '#FFFFFF', accentColor: '#DC2626' },
];

export const COLOR_SCHEME_IDS = new Set(COLOR_SCHEMES.map((scheme) => scheme.id));

export function getColorSchemeById(id: string): ColorScheme {
  return COLOR_SCHEMES.find((scheme) => scheme.id === id) ?? COLOR_SCHEMES[0];
}
