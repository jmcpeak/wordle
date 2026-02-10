'use client';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { IconButton, Tooltip } from '@mui/material';
import type React from 'react';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { THEME_MODES } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import { type ThemeMode, useThemeStore } from '@/store/themeStore';

const nextMode: Record<ThemeMode, ThemeMode> = {
  [THEME_MODES.LIGHT]: THEME_MODES.DARK,
  [THEME_MODES.DARK]: THEME_MODES.SYSTEM,
  [THEME_MODES.SYSTEM]: THEME_MODES.LIGHT,
};

const modeIcons: Record<ThemeMode, React.ReactNode> = {
  [THEME_MODES.LIGHT]: <LightModeIcon />,
  [THEME_MODES.DARK]: <DarkModeIcon />,
  [THEME_MODES.SYSTEM]: <SettingsBrightnessIcon />,
};

// Map from ThemeMode to i18n key
const modeTitleKeys: Record<ThemeMode, string> = {
  [THEME_MODES.LIGHT]: 'theme.lightMode',
  [THEME_MODES.DARK]: 'theme.darkMode',
  [THEME_MODES.SYSTEM]: 'theme.systemDefault',
};

const modeSwitchLabelKeys: Record<ThemeMode, string> = {
  [THEME_MODES.LIGHT]: 'theme.switchToDark',
  [THEME_MODES.DARK]: 'theme.switchToSystem',
  [THEME_MODES.SYSTEM]: 'theme.switchToLight',
};

export default function ThemeToggleButton() {
  const { mode, setMode } = useThemeStore(
    useShallow((s) => ({ mode: s.mode, setMode: s.setMode })),
  );
  const { t } = useTranslation();

  const handleToggle = useCallback(() => {
    setMode(nextMode[mode]);
  }, [mode, setMode]);

  return (
    <Tooltip title={t(modeTitleKeys[mode])}>
      <IconButton
        onClick={handleToggle}
        aria-label={t(modeSwitchLabelKeys[mode])}
      >
        {modeIcons[mode]}
      </IconButton>
    </Tooltip>
  );
}
