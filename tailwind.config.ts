import type { Config } from 'tailwindcss';
import openIndustrialTailwindPreset from '@o-industrial/common/tailwind/preset';

const config = {
  content: ['./**/*.tsx'],
  presets: [openIndustrialTailwindPreset],
} satisfies Config;

export default config;
