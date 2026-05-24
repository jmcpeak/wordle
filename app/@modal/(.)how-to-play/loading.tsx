'use client';

import { Skeleton, Stack } from '@mui/material';

export default function HowToPlayModalLoading() {
  return (
    <>
      <Skeleton
        variant="text"
        sx={{ fontSize: '1.25rem', mx: 'auto', mb: 2, width: '70%' }}
      />
      <Skeleton variant="text" sx={{ mx: 'auto', mb: 1, width: '90%' }} />
      <Skeleton variant="text" sx={{ mx: 'auto', mb: 3, width: '85%' }} />
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        {[1, 2, 3].map((row) => (
          <Stack key={row} direction="row" sx={{ justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((cell) => (
              <Skeleton
                key={cell}
                variant="rounded"
                width={48}
                height={48}
                sx={{ m: 0.25, borderRadius: 0.5 }}
              />
            ))}
          </Stack>
        ))}
      </Stack>
      <Stack spacing={0.5} sx={{ textAlign: 'center' }}>
        <Skeleton variant="text" sx={{ mx: 'auto', width: '95%' }} />
        <Skeleton variant="text" sx={{ mx: 'auto', width: '95%' }} />
        <Skeleton variant="text" sx={{ mx: 'auto', width: '95%' }} />
      </Stack>
    </>
  );
}
