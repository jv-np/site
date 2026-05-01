export type Project = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  year: string;
};

export type Article = {
  id: string;
  title: string;
  date: string;       // ISO yyyy-mm-dd
  readingMin: number;
  url: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    id: '01',
    name: 'jv-n',
    description: 'this site. terminal-flavored portfolio + writing space.',
    tags: ['react', 'vite', 'cloudflare'],
    url: 'https://github.com/',
    year: '2026',
  },
  {
    id: '02',
    name: 'mii-style',
    description: 'a personal design language and component kit, distilled from years of UI work.',
    tags: ['design', 'css', 'tokens'],
    url: '#',
    year: '2025',
  },
  {
    id: '03',
    name: 'macro-code',
    description: 'an opinionated paradigm for working with AI agents on real codebases.',
    tags: ['ai', 'tooling', 'docs'],
    url: '#',
    year: '2025',
  },
  {
    id: '04',
    name: 'mii-http',
    description: 'a tiny spec language for writing HTTP APIs that humans and machines both read.',
    tags: ['dsl', 'http', 'spec'],
    url: '#',
    year: '2024',
  },
];

export const articles: Article[] = [
  {
    id: 'a01',
    title: 'why your dashboard is too padded',
    date: '2026-04-12',
    readingMin: 6,
    url: '#',
    tags: ['design', 'ui'],
  },
  {
    id: 'a02',
    title: 'macro coding: a paradigm for AI-driven development',
    date: '2026-03-02',
    readingMin: 12,
    url: '#',
    tags: ['ai', 'workflow'],
  },
  {
    id: 'a03',
    title: 'one accent color, used sparingly',
    date: '2026-01-28',
    readingMin: 4,
    url: '#',
    tags: ['design'],
  },
  {
    id: 'a04',
    title: 'the case for monospace everywhere',
    date: '2025-11-10',
    readingMin: 5,
    url: '#',
    tags: ['typography', 'design'],
  },
  {
    id: 'a05',
    title: 'shipping a portfolio in a single afternoon',
    date: '2025-09-04',
    readingMin: 7,
    url: '#',
    tags: ['meta', 'web'],
  },
];

export const links = {
  github: 'https://github.com/',
  twitter: 'https://twitter.com/',
  email: 'mailto:hi@example.com',
};
