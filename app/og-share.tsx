import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';
export const OG_ALT = 'Wordle — guess the hidden 5-letter word in six tries';

const CORRECT = '#6aaa64';
const PRESENT = '#b59f3b';
const ABSENT = '#ffffff';
const BG = '#121212';
const GAP = 14;

const ROOT_STYLE = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: BG,
  backgroundImage:
    'radial-gradient(ellipse 80% 70% at 20% 50%, #1e2a1e 0%, #121212 55%)',
} as const;

const CONTENT_STYLE = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 72,
  padding: '0 80px',
} as const;

const GRID_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: GAP,
  padding: 20,
  borderRadius: 36,
  backgroundColor: '#000000',
  border: '4px solid #2a2a2a',
} as const;

const ROW_STYLE = {
  display: 'flex',
  flexDirection: 'row',
  gap: GAP,
} as const;

const COPY_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  maxWidth: 520,
} as const;

const TITLE_STYLE = {
  color: '#ffffff',
  fontSize: 96,
  fontWeight: 700,
  letterSpacing: '0.18em',
  lineHeight: 1.05,
  marginLeft: '0.18em',
} as const;

const TAGLINE_STYLE = {
  color: '#b0b0b0',
  fontSize: 34,
  fontWeight: 500,
  lineHeight: 1.35,
  marginTop: 28,
  maxWidth: 480,
} as const;

function tileStyle(color: string) {
  return {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: color,
  } as const;
}

export function createShareImage() {
  return new ImageResponse(
    <div style={ROOT_STYLE}>
      <div style={CONTENT_STYLE}>
        <div style={GRID_STYLE}>
          <div style={ROW_STYLE}>
            <div style={tileStyle(ABSENT)} />
            <div style={tileStyle(ABSENT)} />
            <div style={tileStyle(ABSENT)} />
          </div>
          <div style={ROW_STYLE}>
            <div style={tileStyle(ABSENT)} />
            <div style={tileStyle(PRESENT)} />
            <div style={tileStyle(CORRECT)} />
          </div>
          <div style={ROW_STYLE}>
            <div style={tileStyle(CORRECT)} />
            <div style={tileStyle(CORRECT)} />
            <div style={tileStyle(CORRECT)} />
          </div>
        </div>
        <div style={COPY_STYLE}>
          <div style={TITLE_STYLE}>WORDLE</div>
          <div style={TAGLINE_STYLE}>
            Guess the hidden 5-letter word in six tries.
          </div>
        </div>
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
