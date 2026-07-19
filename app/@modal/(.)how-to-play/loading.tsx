'use client';

import { Skeleton, Stack } from '@mui/material';

const TITLE_SKELETON_SX = {
  fontSize: '1.25rem',
  mx: 'auto',
  mb: 2,
  width: '70%',
} as const;

const SUBTITLE_SKELETON_SX = { mx: 'auto', mb: 1, width: '90%' } as const;

const SUBTITLE_2_SKELETON_SX = { mx: 'auto', mb: 3, width: '85%' } as const;

const EXAMPLES_STACK_SX = { mb: 3 } as const;

const EXAMPLE_ROW_SX = { justifyContent: 'center' } as const;

const TILE_SKELETON_SX = { m: 0.25, borderRadius: 0.5 } as const;

const LEGEND_STACK_SX = { textAlign: 'center' } as const;

const LEGEND_LINE_SKELETON_SX = { mx: 'auto', width: '95%' } as const;

export default function HowToPlayModalLoading() {
  return (
    <>
      <Skeleton variant="text" sx={TITLE_SKELETON_SX} />
      <Skeleton variant="text" sx={SUBTITLE_SKELETON_SX} />
      <Skeleton variant="text" sx={SUBTITLE_2_SKELETON_SX} />
      <Stack spacing={0.5} sx={EXAMPLES_STACK_SX}>
        {[1, 2, 3].map((row) => (
          <Stack key={row} direction="row" sx={EXAMPLE_ROW_SX}>
            {[1, 2, 3, 4, 5].map((cell) => (
              <Skeleton
                key={cell}
                variant="rounded"
                width={48}
                height={48}
                sx={TILE_SKELETON_SX}
              />
            ))}
          </Stack>
        ))}
      </Stack>
      <Stack spacing={0.5} sx={LEGEND_STACK_SX}>
        <Skeleton variant="text" sx={LEGEND_LINE_SKELETON_SX} />
        <Skeleton variant="text" sx={LEGEND_LINE_SKELETON_SX} />
        <Skeleton variant="text" sx={LEGEND_LINE_SKELETON_SX} />
      </Stack>
    </>
  );
}
