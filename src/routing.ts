/**
 * URL <-> command bridge.
 *
 * The site is a single-page terminal, but a few "well-known" commands map
 * cleanly onto pretty URLs so articles and sections are linkable, shareable
 * and crawlable. Everything else stays in the terminal at "/".
 */

import { articles, findArticle } from './articles';

export type RoutedCommand = { name: string; args: string[] };

const SECTION_COMMANDS = new Set(['about', 'showcase', 'contact']);

/** Parse a path like "/articles/foo" → { name: 'article', args: ['foo'] }. */
export function pathToCommand(rawPath: string): RoutedCommand | null {
  const path = (rawPath || '/').replace(/\/+$/, '') || '/';
  if (path === '/') return null;
  const parts = path.slice(1).split('/').map(decodeURIComponent);

  if (parts.length === 1) {
    if (SECTION_COMMANDS.has(parts[0])) return { name: parts[0], args: [] };
    if (parts[0] === 'articles' || parts[0] === 'blog') return { name: 'articles', args: [] };
  }
  if (parts.length === 2 && (parts[0] === 'articles' || parts[0] === 'article')) {
    return { name: 'article', args: [parts[1]] };
  }
  return null;
}

/**
 * Normalize a command invocation to its canonical URL, or return null when
 * the command shouldn't change the URL (help, echo, alias, etc.).
 */
export function commandToPath(name: string, args: string[]): string | null {
  switch (name) {
    case 'about':
    case 'showcase':
    case 'contact':
      return `/${name}`;
    case 'projects':
      return '/showcase';
    case 'articles':
    case 'blog':
      return args.length === 0 ? '/articles' : null; // filtered list isn't a canonical page
    case 'article': {
      if (args.length === 0) return null;
      const a = findArticle(args.join(' '));
      return a ? `/articles/${a.slug}` : null;
    }
    case 'clear':
      return '/';
    default:
      return null;
  }
}

export type RouteMeta = { title: string; description?: string };

const SITE_TITLE = 'mii-nipah — jv.n · website & notes';
const SITE_DESC = 'mii-nipah — jv.n — engineer & thinker. website and writing.';

export function metaForPath(path: string): RouteMeta {
  const cmd = pathToCommand(path);
  if (!cmd) return { title: SITE_TITLE, description: SITE_DESC };
  if (cmd.name === 'article') {
    const a = findArticle(cmd.args[0] ?? '');
    if (a) return { title: `${a.title} · jv.n`, description: undefined };
  }
  if (cmd.name === 'articles') return { title: 'articles · jv.n', description: `writing — ${articles.length} posts.` };
  if (cmd.name === 'about') return { title: 'about · jv.n', description: SITE_DESC };
  if (cmd.name === 'showcase') return { title: 'showcase · jv.n', description: 'projects by jv.n.' };
  if (cmd.name === 'contact') return { title: 'contact · jv.n', description: 'how to reach jv.n.' };
  return { title: SITE_TITLE, description: SITE_DESC };
}

/** Push or replace history with the canonical URL for a command, if any. */
export function syncUrl(name: string, args: string[], mode: 'push' | 'replace' = 'push'): void {
  const target = commandToPath(name, args);
  if (target == null) return;
  const current = window.location.pathname.replace(/\/+$/, '') || '/';
  const normalized = target.replace(/\/+$/, '') || '/';
  if (current === normalized) return;
  if (mode === 'replace') window.history.replaceState({}, '', target);
  else window.history.pushState({}, '', target);
  applyMeta(target);
}

export function applyMeta(path: string): void {
  const { title, description } = metaForPath(path);
  if (typeof document === 'undefined') return;
  document.title = title;
  if (description) {
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'description');
      document.head.appendChild(el);
    }
    el.setAttribute('content', description);
  }
}
