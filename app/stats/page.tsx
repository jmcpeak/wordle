import { Container, Paper } from '@mui/material';
import StatsContent from '@/components/StatsContent';

const CONTAINER_SX = { py: 4 } as const;

const PAPER_SX = { p: 3 } as const;

export default function StatsPage() {
  return (
    <Container maxWidth="xs" sx={CONTAINER_SX}>
      <Paper sx={PAPER_SX}>
        <StatsContent />
      </Paper>
    </Container>
  );
}
