import { describe, expect, it } from 'vitest';
import { darkTheme } from '@/themes';
import {
  getDrumStepFaces,
  getSplitFlapAnimations,
} from '@/utils/splitFlapStyles';

describe('getDrumStepFaces', () => {
  it('keeps evaluated blank-start faces opaque', () => {
    const faces = getDrumStepFaces(darkTheme, 'correct', '', 'A');

    expect(faces.startBackground).toBe(darkTheme.palette.game.correct);
    expect(faces.endBackground).toBe(darkTheme.palette.game.correct);
    expect(faces.startText).toBe(darkTheme.palette.common.white);
    expect(faces.endText).toBe(darkTheme.palette.common.white);
    expect(faces.fromBlank).toBe(false);
  });

  it('keeps unevaluated blank-start faces transparent', () => {
    const faces = getDrumStepFaces(darkTheme, 'empty', '', 'A');

    expect(faces.startBackground).toBe('transparent');
    expect(faces.startText).toBe('transparent');
    expect(faces.endBackground).toBe('transparent');
    expect(faces.endText).toBe(darkTheme.palette.text.primary);
    expect(faces.fromBlank).toBe(true);
  });

  it('clears evaluated tiles to transparent when landing on blank', () => {
    const faces = getDrumStepFaces(darkTheme, 'correct', 'P', '');

    expect(faces.startBackground).toBe(darkTheme.palette.game.correct);
    expect(faces.endBackground).toBe('transparent');
    expect(faces.endText).toBe('transparent');
  });
});

describe('getSplitFlapAnimations', () => {
  it('reuses a stable new-top animation name across face colors', () => {
    const green = getDrumStepFaces(darkTheme, 'correct', 'C', 'C');
    const typed = getDrumStepFaces(darkTheme, 'empty', '', 'C', 0, {
      solidUnevaluated: true,
    });
    const colorChangeFaces = {
      ...green,
      startBackground: typed.startBackground,
      colorChange: true,
    };

    const first = getSplitFlapAnimations(colorChangeFaces, 320);
    const second = getSplitFlapAnimations(
      { ...colorChangeFaces, endBackground: darkTheme.palette.game.present },
      320,
    );

    expect(first.newTopAnimation).not.toBe('none');
    expect(first.newTopAnimation).toBe(second.newTopAnimation);
  });
});
