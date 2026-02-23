// again — design tokens
// This is the ONLY source of UI truth. No ad hoc styling ever.

export const colors = {
  background: '#0a0a0a',
  surface: '#111111',
  surface2: '#171717',
  border: '#1e1e1e',
  border2: '#2a2a2a',
  textPrimary: '#f0f0f0',
  textSecondary: '#888888',
  textMuted: '#444444',
  accent: '#2563eb',       // electric blue — CTAs and links only
  accentDim: '#1d4ed8',
  danger: '#dc2626',       // red — overdue tasks only
  dangerDim: '#7f1d1d',
  success: '#16a34a',      // green — done state only
} as const;

export const typography = {
  fontMono: "'DM Mono', monospace",
  fontSans: "'DM Sans', sans-serif",
  sizeXs: '12px',
  sizeSm: '14px',
  sizeBase: '16px',
  sizeLg: '20px',
  sizeXl: '32px',
  sizeHero: '52px',
  weightLight: 300,
  weightNormal: 400,
  weightMedium: 500,
} as const;

export const spacing = {
  space1: '4px',
  space2: '8px',
  space3: '12px',
  space4: '16px',
  space6: '24px',
  space8: '32px',
  space12: '48px',
  space16: '64px',
  space24: '96px',
} as const;

export const borders = {
  radiusSm: '4px',
  radiusNone: '0px',
  divider: `1px solid ${colors.border}`,
} as const;

// CSS custom properties string for injection into global styles
export const cssVariables = `
  :root {
    --bg: ${colors.background};
    --surface: ${colors.surface};
    --surface-2: ${colors.surface2};
    --border: ${colors.border};
    --border-2: ${colors.border2};
    --text-1: ${colors.textPrimary};
    --text-2: ${colors.textSecondary};
    --text-3: ${colors.textMuted};
    --accent: ${colors.accent};
    --accent-dim: ${colors.accentDim};
    --danger: ${colors.danger};
    --danger-dim: ${colors.dangerDim};
    --success: ${colors.success};
    --mono: ${typography.fontMono};
    --sans: ${typography.fontSans};
  }
`;
