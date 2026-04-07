import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import type { CellAnimation, LetterStatus } from '@/types';
import { computeCellStyles } from '@/utils/letterBoxStyles';

const LetterBox = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'status' &&
    prop !== 'isFocused' &&
    prop !== 'disabled' &&
    prop !== 'animation' &&
    prop !== 'isPlaceholder',
})<{
  status?: LetterStatus;
  isFocused?: boolean;
  disabled?: boolean;
  animation: CellAnimation;
  isPlaceholder?: boolean;
}>(({ theme, status, isFocused, disabled, animation, isPlaceholder }) =>
  computeCellStyles({
    theme,
    status,
    isFocused,
    disabled,
    animation,
    isPlaceholder,
  }),
);

export default LetterBox;
