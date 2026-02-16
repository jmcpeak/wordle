import { Suspense } from 'react';
import ResetStatsButton from '@/components/ResetStatsButton';
import StatsContent from '@/components/StatsContent';

const sx = { position: 'absolute', left: 8, top: 8 };

export default function StatsModalPage() {
  return (
    <>
      <Suspense>
        <ResetStatsButton sx={sx} />
      </Suspense>
      <StatsContent />
    </>
  );
}
