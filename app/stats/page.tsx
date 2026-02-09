import { Container, Paper } from '@mui/material';
import StatsContent from '@/components/StatsContent';

export default function StatsPage() {
  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <StatsContent />
      </Paper>
    </Container>
  );
}
