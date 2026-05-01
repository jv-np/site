import { useEffect, useState } from 'react';
import {
  bundledLanguages,
  getSingletonHighlighter,
  type BundledLanguage,
  type Highlighter,
} from 'shiki';

const THEME_ID = 'github-dark-default';

let highlighterPromise: Promise<Highlighter> | null = null;
const loadedLangs = new Set<string>(['text']);

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = getSingletonHighlighter({
      themes: [THEME_ID],
      langs: [],
    });
  }
  return highlighterPromise;
}

async function ensureLang(hl: Highlighter, lang: string): Promise<string> {
  if (loadedLangs.has(lang)) return lang;
  if (!(lang in bundledLanguages)) return 'text';
  try {
    await hl.loadLanguage(lang as BundledLanguage);
    loadedLangs.add(lang);
    return lang;
  } catch {
    return 'text';
  }
}

export type CodeProps = {
  /** code source. children take precedence over `code` if both supplied. */
  children?: string;
  code?: string;
  /** shiki language id; defaults to `text` */
  lang?: BundledLanguage | (string & {});
  /** render inline (no <pre>) instead of as a block */
  inline?: boolean;
  className?: string;
};

/**
 * runtime syntax-highlighted code. drop in anywhere:
 *
 *   <Code lang="ts">{`const x = 1;`}</Code>
 *   <Code inline lang="bash">bun run dev</Code>
 */
export function Code({ children, code, lang = 'text', inline, className }: CodeProps) {
  const source = (children ?? code ?? '').toString();
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hl = await getHighlighter();
      const resolved = await ensureLang(hl, lang);
      const out = hl.codeToHtml(source, { lang: resolved, theme: THEME_ID });
      if (!cancelled) setHtml(out);
    })();
    return () => { cancelled = true; };
  }, [source, lang]);

  if (!html) {
    return inline ? (
      <code className={`code-inline ${className ?? ''}`} data-lang={lang}>{source}</code>
    ) : (
      <pre className={`code-block ${className ?? ''}`} data-lang={lang}><code>{source}</code></pre>
    );
  }

  const finalHtml = inline ? html.replace(/^<pre[^>]*>|<\/pre>$/g, '') : html;
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      className={`${inline ? 'code-inline-wrap' : 'code-block-wrap'} ${className ?? ''}`}
      data-lang={lang}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}
