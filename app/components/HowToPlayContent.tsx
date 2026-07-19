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

function ExampleTile({ letter, status }: ExampleLetter) {
  return <Box sx={getExampleTileSx(status)}>{letter}</Box>;
}

function ExampleRow({ letters }: { letters: ExampleLetter[] }) {
  return (
    <Stack direction="row" sx={EXAMPLE_ROW_SX}>
      {letters.map((entry) => (
        <ExampleTile key={entry.letter} {...entry} />
      ))}
    </Stack>
  );
}

export default function HowToPlayContent() {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h6" component="h2" sx={SECTION_TITLE_SX}>
        {t('howToPlay.title')}
      </Typography>

      <Typography sx={INSTRUCTION_SX}>{t('howToPlay.instruction')}</Typography>

      <Typography variant="body2" sx={SUB_INSTRUCTION_SX}>
        {t('howToPlay.subInstruction')}
      </Typography>

      <Stack spacing={0.5} sx={EXAMPLES_STACK_SX}>
        {EXAMPLES.map((row) => (
          <ExampleRow key={row.map((l) => l.letter).join('')} letters={row} />
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
