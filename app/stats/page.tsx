import { Container, Paper } from '@mui/material';
import DismissToGameButton from '@/components/DismissToGameButton';
import StatsContent from '@/components/StatsContent';

const CONTAINER_SX = {
  position: 'relative',
  py: 4,
  pt: 'max(96px, calc(env(safe-area-inset-top, 0px) + 40px))',
} as const;

const PAPER_SX = { p: 3 } as const;

export default function StatsPage() {
  return (
    <Container component="main" maxWidth="xs" sx={CONTAINER_SX}>
      <DismissToGameButton />
      <Paper sx={PAPER_SX}>
        <StatsContent headingComponent="h1" />
      </Paper>
    </Container>
  );
}
