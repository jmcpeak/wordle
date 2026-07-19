'use client';

import { Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

const OFFLINE_PAGE_TITLE = 'Connection issue';
const OFFLINE_MESSAGE =
  "We couldn't load the game in time or you're offline. Check your connection and try again.";
const TRY_AGAIN_LABEL = 'Try again';

const CONTAINER_SX = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  gap: 2,
  textAlign: 'center',
} as const;

const MESSAGE_SX = { color: 'text.secondary' } as const;

export default function OfflinePage() {
  return (
    <Container maxWidth="sm" sx={CONTAINER_SX}>
      <Typography component="h1" variant="h5">
        {OFFLINE_PAGE_TITLE}
      </Typography>
      <Typography sx={MESSAGE_SX}>{OFFLINE_MESSAGE}</Typography>
      <Button component={Link} href="/" variant="contained" size="large">
        {TRY_AGAIN_LABEL}
      </Button>
    </Container>
  );
}
