import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import type { LetterStatus } from '@/types';
import { computeCellStyles } from '@/utils/letterBoxStyles';

const LetterBox = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'status' &&
    prop !== 'isFocused' &&
    prop !== 'disabled' &&
    prop !== 'isPlaceholder',
})<{
  status?: LetterStatus;
  isFocused?: boolean;
  disabled?: boolean;
  isPlaceholder?: boolean;
}>(({ theme, status, isFocused, disabled, isPlaceholder }) =>
  computeCellStyles({ theme, status, isFocused, disabled, isPlaceholder }),
);

export default LetterBox;
