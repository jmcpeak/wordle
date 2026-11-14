'use client';

import { Box, Divider, Skeleton, Stack } from '@mui/material';
import BuildVersionFooter from '@/components/BuildVersionFooter';

const SUMMARY_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 1,
  mb: 2,
} as const;

const TITLE_SX = {
  fontSize: '1.25rem',
  mx: 'auto',
  mb: 2,
  width: '55%',
} as const;

const ITEM_SX = { minWidth: 0 } as const;
const CENTERED_SX = { mx: 'auto' } as const;
const DIVIDER_SX = { my: 2 } as const;

const DISTRIBUTION_TITLE_SX = {
  fontSize: '1.25rem',
  mx: 'auto',
  mb: 2,
  width: '75%',
} as const;

const DISTRIBUTION_ROW_SX = { alignItems: 'center', mb: 1 } as const;
const BAR_SX = { flexGrow: 1, borderRadius: 1 } as const;

export default function StatsSkeleton() {
  return (
    <>
      <Skeleton variant="text" sx={TITLE_SX} />
      <Box sx={SUMMARY_GRID_SX}>
        {[1, 2, 3, 4].map((item) => (
          <Box key={item} sx={ITEM_SX}>
            <Skeleton variant="text" width={48} height={42} sx={CENTERED_SX} />
            <Skeleton variant="text" width={56} height={20} sx={CENTERED_SX} />
          </Box>
        ))}
      </Box>
      <Divider sx={DIVIDER_SX} />
      <Skeleton variant="text" sx={DISTRIBUTION_TITLE_SX} />
      {[1, 2, 3, 4, 5, 6].map((row) => (
        <Stack key={row} direction="row" spacing={1} sx={DISTRIBUTION_ROW_SX}>
          <Skeleton width="10%" height={24} />
          <Skeleton variant="rounded" height={20} sx={BAR_SX} />
          <Skeleton width="10%" height={24} />
        </Stack>
      ))}
      <BuildVersionFooter />
    </>
  );
}
