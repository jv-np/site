import React from 'react';

export type Project = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  year: string;
  component?: React.LazyExoticComponent<React.ComponentType>;
  /** when true, the card grows horizontally on hover to give the
   *  embedded component room (long command lines, etc.) */
  expandable?: boolean;
};

export const projects: Project[] = [
  {
    id: '01',
    name: 'jv-n',
    description: 'this site. terminal-flavored portfolio + writing space.',
    tags: ['react', 'vite', 'cloudflare'],
    url: 'https://github.com/jv-np/site',
    year: '2026',
  },
  {
    id: '02',
    name: 'mii-style',
    description: '"universal file system" for csharp, a nice utility for having an unified API to talk with multiple abstracted file systems (real file system, in-memory or even minIO).',
    tags: ['csharp', 'filesystem', 'library'],
    url: 'https://github.com/jv-np/ufs-csharp',
    year: '2025',
  },
  {
    id: '03',
    name: 'macro-code',
    description: 'an opinionated paradigm for working with AI agents on real codebases.',
    tags: ['ai', 'tooling', 'skill'],
    url: 'https://github.com/mii-nipah/macro-coding',
    year: '2026',
  },
  {
    id: '04',
    name: 'mii-http',
    description: 'a tiny spec language and tool for writing HTTP APIs for shell commands.',
    tags: ['dsl', 'http', 'spec', 'tooling'],
    url: 'https://github.com/mii-nipah/mii-http',
    year: '2026',
  },
  {
    id: '05',
    name: 'mii-sound',
    description: 'a unix-like tool to produce sounds, with a custom TTS inference engine and easy commands to interact with it.',
    tags: ['audio', 'tooling', 'ai'],
    url: 'https://github.com/mii-nipah/mii-sound',
    year: '2026',
    component: React.lazy(() => import('./showcase/mii-sound')),
  },
  {
    id: '06',
    name: 'mii-text',
    description: 'a unix-like tool to produce text using LLMs and a convenient interface.',
    tags: ['text', 'tooling', 'ai'],
    url: 'https://github.com/mii-nipah/mii-text',
    year: '2026',
    component: React.lazy(() => import('./showcase/mii-text')),
    expandable: true,
  },
  {
    id: '07',
    name: 'sourcity',
    description: 'a Gource alternative that shows the history of a git repository as a city, where each file is a building.',
    tags: ['simulation', 'city', 'gource-alternative'],
    url: 'https://github.com/mii-nipah/sourcity',
    year: '2026',
    component: React.lazy(() => import('./showcase/sourcity')),
    expandable: true,
  },
  {
    id: '08',
    name: 'hbfs',
    description: 'an interesting algorithm for fast flood-filling on large graphs, with applications in floating island detection.',
    tags: ['algorithm', 'flood-fill', 'graph'],
    url: 'https://github.com/mii-nipah/hbfs',
    year: '2026',
  },
  {
    id: '09',
    name: 'voxcpm-rs',
    description: 'a rust implementation for the VoxCPM2 text-to-speech model, with a convenient API that powers mii-sound.',
    tags: ['rust', 'text-to-speech', 'library'],
    url: 'https://github.com/mii-nipah/voxcpm-rs',
    year: '2026',
    component: React.lazy(() => import('./showcase/voxcpm-rs')),
    expandable: true,
  }
] as const;

export const links = {
  github: 'https://github.com/jv-np',
  org: 'https://github.com/mii-nipah',
  twitter: 'https://x.com/_mii_nipah',
  email: 'mailto:mii_nipah@pm.me',
} as const;
