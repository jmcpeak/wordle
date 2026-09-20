import { Box } from '@mui/material';
import DismissToGameButton from '@/components/DismissToGameButton';
import HowToPlayContent from '@/components/HowToPlayContent';

const MAIN_SX = {
  position: 'relative',
  px: 2,
  pb: 4,
  pt: 'max(96px, calc(env(safe-area-inset-top, 0px) + 40px))',
} as const;

export default function HowToPlayPage() {
  return (
    <Box component="main" sx={MAIN_SX}>
      <DismissToGameButton />
      <HowToPlayContent headingComponent="h1" />
    </Box>
  );
}
