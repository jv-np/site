export type Project = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  year: string;
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
] as const;

export const links = {
  github: 'https://github.com/',
  twitter: 'https://twitter.com/',
  email: 'mailto:hi@example.com',
} as const;
