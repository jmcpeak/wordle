'use client';

import { Box, Stack, Typography } from '@mui/material';
import BuildVersionFooter from '@/components/BuildVersionFooter';
import { useTranslation } from '@/store/i18nStore';

type LetterStatus = 'correct' | 'present' | 'absent';

type ExampleLetter = {
  letter: string;
  status: LetterStatus;
};

const EXAMPLES: ExampleLetter[][] = [
  [
    { letter: 'C', status: 'absent' },
    { letter: 'R', status: 'present' },
    { letter: 'I', status: 'correct' },
    { letter: 'S', status: 'absent' },
    { letter: 'P', status: 'absent' },
  ],
  [
    { letter: 'S', status: 'absent' },
    { letter: 'H', status: 'present' },
    { letter: 'I', status: 'correct' },
    { letter: 'R', status: 'correct' },
    { letter: 'T', status: 'absent' },
  ],
  [
    { letter: 'H', status: 'correct' },
    { letter: 'A', status: 'correct' },
    { letter: 'I', status: 'correct' },
    { letter: 'R', status: 'correct' },
    { letter: 'S', status: 'absent' },
  ],
];
const STATUS_COLORS: Record<LetterStatus, string> = {
  correct: 'game.correct',
  present: 'game.present',
  absent: 'game.absent',
};

const STATUS_BORDER_STYLES: Record<LetterStatus, string> = {
  correct: 'solid',
  present: 'dashed',
  absent: 'double',
};

function getExampleTileSx(status: LetterStatus) {
  return {
    width: 48,
    height: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: STATUS_COLORS[status],
    color: 'common.white',
    fontWeight: 700,
    fontSize: '1.25rem',
    textTransform: 'uppercase',
    borderRadius: 0.5,
    border: '2px',
    borderColor: 'common.white',
    borderStyle: STATUS_BORDER_STYLES[status],
    boxSizing: 'border-box',
    m: 0.25,
  };
}

const EXAMPLE_ROW_SX = { justifyContent: 'center' } as const;

const SECTION_TITLE_SX = {
  textAlign: 'center',
  mb: 2,
  fontWeight: 'bold',
} as const;

const INSTRUCTION_SX = {
  textAlign: 'center',
  mb: 1,
  fontWeight: 'bold',
} as const;

const SUB_INSTRUCTION_SX = {
  textAlign: 'center',
  mb: 3,
  fontWeight: 'bold',
} as const;

const EXAMPLES_STACK_SX = { mb: 3 } as const;

const LEGEND_STACK_SX = { textAlign: 'center' } as const;

const LEGEND_ITEM_SX = { fontWeight: 'bold' } as const;

type StatusLabels = Record<LetterStatus, string>;

function ExampleTile({
  letter,
  status,
  statusLabel,
}: ExampleLetter & { statusLabel: string }) {
  return (
    <Box
      aria-label={`${letter}, ${statusLabel}`}
      role="img"
      sx={getExampleTileSx(status)}
    >
      {letter}
    </Box>
  );
}

function ExampleRow({
  letters,
  statusLabels,
}: {
  letters: ExampleLetter[];
  statusLabels: StatusLabels;
}) {
  return (
    <Stack direction="row" sx={EXAMPLE_ROW_SX}>
      {letters.map((entry) => (
        <ExampleTile
          key={entry.letter}
          {...entry}
          statusLabel={statusLabels[entry.status]}
        />
      ))}
    </Stack>
  );
}

type HowToPlayContentProps = {
  headingComponent?: 'h1' | 'h2';
};

export default function HowToPlayContent({
  headingComponent = 'h2',
}: HowToPlayContentProps) {
  const { t } = useTranslation();
  const statusLabels: StatusLabels = {
    correct: t('game.status.correct'),
    present: t('game.status.present'),
    absent: t('game.status.absent'),
  };

  return (
    <>
      <Typography
        variant="h6"
        component={headingComponent}
        sx={SECTION_TITLE_SX}
      >
        {t('howToPlay.title')}
      </Typography>

      <Typography sx={INSTRUCTION_SX}>{t('howToPlay.instruction')}</Typography>

      <Typography variant="body2" sx={SUB_INSTRUCTION_SX}>
        {t('howToPlay.subInstruction')}
      </Typography>

      <Stack spacing={0.5} sx={EXAMPLES_STACK_SX}>
        {EXAMPLES.map((row) => (
          <ExampleRow
            key={row.map((l) => l.letter).join('')}
            letters={row}
            statusLabels={statusLabels}
          />
        ))}
      </Stack>

      <Stack spacing={0.5} sx={LEGEND_STACK_SX}>
        <Typography variant="body2" sx={LEGEND_ITEM_SX}>
          {t('howToPlay.legendAbsent')}
        </Typography>
        <Typography variant="body2" sx={LEGEND_ITEM_SX}>
          {t('howToPlay.legendPresent')}
        </Typography>
        <Typography variant="body2" sx={LEGEND_ITEM_SX}>
          {t('howToPlay.legendCorrect')}
        </Typography>
      </Stack>

      <BuildVersionFooter />
    </>
  );
}
