import { Box } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import { useCallback, useState } from 'react';

const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
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

export const LetterRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'shake',
})<{ shake?: boolean }>(({ shake }) => ({
  display: 'flex',
  animation: shake ? `${shakeAnimation} 0.5s` : 'none',
}));

export const useShake = () => {
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  return { shake, triggerShake };
};
