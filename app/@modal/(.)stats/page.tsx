import ResetStatsButton from '@/components/ResetStatsButton';
import StatsContent from '@/components/StatsContent';

export default function StatsModalPage() {
  return (
    <>
      <ResetStatsButton sx={{ position: 'absolute', left: 8, top: 8 }} />
      <StatsContent />
    </>
  );
}
