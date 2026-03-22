// ─────────────────────────────────────────────────────────────────────────────
// EMS MedTrack — Navy Blue Dark Theme
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react';

export const T = {
  // Backgrounds
  bg:       '#0d1b2e',   // deep navy — page background
  card:     '#122540',   // card / panel background
  cardAlt:  '#0f2035',   // slightly darker card (nested panels)
  input:    '#0f1e38',   // form control fill
  topBar:   '#080f1e',   // navbar

  // Borders
  border:   'rgba(255,255,255,0.12)',
  borderHi: 'rgba(255,255,255,0.28)',

  // Text
  text:     '#e8f0ff',
  muted:    'rgba(232,240,255,0.52)',

  // Accents
  accent:   '#3b82f6',   // blue
  green:    '#22c55e',
  amber:    '#f59e0b',
  red:      '#ef4444',
  cyan:     '#22d3ee',
  violet:   '#a78bfa',

  // Status map for vial status badges
  statusColors: {
    ordered:      '#6b7280',
    received:     '#0891b2',
    stocked:      '#2563eb',
    'in-use':     '#d97706',
    administered: '#16a34a',
    wasted:       '#374151',
    disposed:     '#4b5563',
    expired:      '#dc2626',
  } as Record<string, string>,
} as const;

// ── Reusable style objects ────────────────────────────────────────────────────

export const cardStyle: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  color: T.text,
};

export const cardHeaderStyle: CSSProperties = {
  background: T.cardAlt,
  borderBottom: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: '14px 14px 0 0',
};

export const inputStyle: CSSProperties = {
  background: T.input,
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 8,
};

export const btnBackStyle: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 8,
};

export const dividerStyle: CSSProperties = {
  borderColor: T.border,
};
