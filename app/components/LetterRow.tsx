import Box from '@mui/material/Box';
import { keyframes, styled } from '@mui/material/styles';
import { SHAKE_DURATION_MS } from '@/constants';

function makeShakeAnimation(cycle: number) {
  return keyframes`
  0% { transform: translateX(0); --shake-cycle: ${cycle}; }
  10% { transform: translateX(-5px); }
  20% { transform: translateX(5px); }
  30% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  50% { transform: translateX(-5px); }
  60% { transform: translateX(5px); }
  70% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
  90% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;
}

/**
 * The unused custom-property marker gives Emotion different hashes/names.
 * Identical keyframe bodies hash to one name and would not restart.
 */
const shakeEven = makeShakeAnimation(0);
const shakeOdd = makeShakeAnimation(1);

const LetterRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'shakeToken',
})<{ shakeToken?: number }>(({ shakeToken = 0 }) => ({
  display: 'flex',
  animation: shakeToken
    ? `${shakeToken % 2 === 0 ? shakeEven : shakeOdd} ${SHAKE_DURATION_MS}ms`
    : 'none',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}));

export default LetterRow;
