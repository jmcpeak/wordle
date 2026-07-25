/** Permanent mid-seam on letter tiles (Solari boards always show the split). */
export const LETTER_CELL_SEAM_LINE = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '50%',
  height: '2px',
  marginTop: '-1px',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  boxShadow: '0 1px 0 rgba(255, 255, 255, 0.12)',
  pointerEvents: 'none',
  zIndex: 5,
} as const;

/** `::after` variant for styled LetterBox cells. */
export const LETTER_CELL_SEAM_PSEUDO = {
  content: '""',
  ...LETTER_CELL_SEAM_LINE,
} as const;
