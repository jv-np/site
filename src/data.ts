import React from 'react';

export type Project = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  year: string;
  component?: React.LazyExoticComponent<React.ComponentType>;
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
  }
] as const;

export const links = {
  github: 'https://github.com/jv-np',
  org: 'https://github.com/mii-nipah',
  twitter: 'https://x.com/_mii_nipah',
  email: 'mailto:mii_nipah@pm.me',
} as const;
