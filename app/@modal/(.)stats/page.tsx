import ResetStatsButton from '@/components/ResetStatsButton';
import StatsContent from '@/components/StatsContent';

const RESET_BUTTON_SX = {
  position: 'absolute',
  left: 8,
  top: 8,
  zIndex: 1,
} as const;

export default function StatsModalPage() {
  return (
    <>
      <ResetStatsButton sx={RESET_BUTTON_SX} />
      <StatsContent />
    </>
  );
}
