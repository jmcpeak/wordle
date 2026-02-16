'use client';

import { Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

const OFFLINE_PAGE_TITLE = 'Connection issue';
const OFFLINE_MESSAGE =
  "We couldn't load the game in time or you're offline. Check your connection and try again.";
const TRY_AGAIN_LABEL = 'Try again';

export default function OfflinePage() {
  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <Typography component="h1" variant="h5">
        {OFFLINE_PAGE_TITLE}
      </Typography>
      <Typography color="text.secondary">{OFFLINE_MESSAGE}</Typography>
      <Button component={Link} href="/" variant="contained" size="large">
        {TRY_AGAIN_LABEL}
      </Button>
    </Container>
  );
}
