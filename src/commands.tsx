import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { links, projects } from './data';
import { articles, findArticle } from './articles';

export type CommandCtx = {
  clear: () => void;
  run: (cmd: string) => void;
  type: (cmd: string) => void;
  aliases: Record<string, string>;
  setAlias: (name: string, value: string | null) => void;
};

export type Command = {
  name: string;
  summary: string;
  usage?: string;
  hidden?: boolean;
  /** returns the panel/output node, OR null if the command handles output itself (e.g. clear) */
  run: (args: string[], ctx: CommandCtx) => ReactNode | null;
};

/* ─── output building blocks ─────────────────────────────────────────── */

function Panel(props: { title: string; meta?: string; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="name">
          <span className="ac">▎</span> {props.title}
        </span>
        {props.meta && <span className="meta">· {props.meta}</span>}
        <span className="rule" />
      </div>
      {props.children}
    </div>
  );
}

/* ─── command implementations ────────────────────────────────────────── */

const help: Command = {
  name: 'help',
  summary: 'list available commands',
  run: (_a, ctx) => (
    <Panel title="help" meta={`${Object.keys(registry).length} commands`}>
      <div className="help">
        {Object.values(registry)
          .filter((c) => !c.hidden)
          .map((c) => (
            <Fragment key={c.name}>
              <div className="k mono">
                <button
                  type="button"
                  className="path"
                  onClick={() => ctx.type(c.name)}
                  title={c.usage ?? c.name}
                >
                  {c.name}
                </button>
              </div>
              <div className="v">{c.summary}</div>
            </Fragment>
          ))}
      </div>
      <p className="text-out" style={{ marginTop: 14 }}>
        <span className="dim">tip:</span> press <span className="hl">tab</span> to complete,
        <span className="hl"> ↑/↓</span> for history,{' '}
        <span className="hl">click any chip</span> below the prompt to run a command.
      </p>
    </Panel>
  ),
};

const about: Command = {
  name: 'about',
  summary: 'who i am, what i do',
  run: () => (
    <Panel title="about" meta="~/about.md">
      <div className="about">
        <div>
          <h3>identity</h3>
          <p>
            <span className="hl">jv</span> — engineer, designer, occasional writer.
            i build small, sharp tools and write about how.
          </p>
          <p>
            currently focused on <span className="ac">developer experience</span>,{' '}
            <span className="ac">design systems</span>, and{' '}
            <span className="ac">AI-assisted workflows</span>.
          </p>
        </div>
        <div>
          <h3>stack</h3>
          <ul>
            <li><strong>languages</strong> — typescript, rust, python, go</li>
            <li><strong>frontend</strong> — react, vite, css the hard way</li>
            <li><strong>backend</strong> — node, cloudflare workers, postgres</li>
            <li><strong>design</strong> — figma, mii-style, restraint</li>
          </ul>
        </div>
      </div>
    </Panel>
  ),
};

const showcase: Command = {
  name: 'showcase',
  summary: 'list projects (alias: ls projects)',
  run: () => (
    <Panel title="showcase" meta={`${projects.length} projects`}>
      <div className="grid">
        {projects.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target={p.url.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="card"
          >
            <div className="card-head">
              <span className="card-id mono">PRJ-{p.id} · {p.year}</span>
              <span className="arrow mono">↗</span>
            </div>
            <div className="card-title">{p.name}</div>
            <p className="card-desc">{p.description}</p>
            <ul className="tags">
              {p.tags.map((t) => <li key={t} className="tag">{t}</li>)}
            </ul>
          </a>
        ))}
      </div>
    </Panel>
  ),
};

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00Z')
    .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' })
    .toLowerCase();

const articlesCmd: Command = {
  name: 'articles',
  summary: 'list writing (alias: blog) — articles <query> to filter',
  usage: 'articles [query]',
  run: (args, ctx) => {
    const q = (args.join(' ') || '').trim().toLowerCase();
    const list = q
      ? articles.filter((a) =>
          a.title.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.slug.toLowerCase().includes(q),
        )
      : articles;
    return (
      <Panel title="articles" meta={q ? `${list.length}/${articles.length} · “${q}”` : `${articles.length} posts`}>
        {list.length === 0 ? (
          <p className="text-out"><span className="dim">no posts match</span> <span className="hl">{q}</span></p>
        ) : (
          <div className="articles">
            {list.map((a) => (
              <button
                key={a.slug}
                type="button"
                className="article-row"
                onClick={() => ctx.type(`article ${a.slug}`)}
              >
                <span className="article-date mono">{fmtDate(a.date)}</span>
                <span className="article-title">{a.title}</span>
                <span className="article-meta mono">
                  {a.tags.join(' · ')} &nbsp; {a.readingMin}m
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="text-out" style={{ marginTop: 12 }}>
          <span className="dim">read with</span> <span className="mono ac">article &lt;slug&gt;</span>
        </p>
      </Panel>
    );
  },
};

const article: Command = {
  name: 'article',
  summary: 'open an article by slug or title fragment',
  usage: 'article <slug>',
  run: (args) => {
    const q = args.join(' ').trim();
    if (!q) {
      return (
        <p className="err"><span className="glyph">✗</span>
          <span>article: missing slug. try <span className="mono">articles</span> to list.</span>
        </p>
      );
    }
    const a = findArticle(q);
    if (!a) {
      return (
        <p className="err"><span className="glyph">✗</span>
          <span>article: no match for <span className="mono">{q}</span></span>
        </p>
      );
    }
    const Body = a.Component;
    return (
      <Panel title={a.title} meta={`${fmtDate(a.date)} · ${a.readingMin}m · ${a.tags.join(', ')}`}>
        <div className="prose">
          <Body />
        </div>
      </Panel>
    );
  },
};

const contact: Command = {
  name: 'contact',
  summary: 'how to reach me',
  run: () => (
    <Panel title="contact" meta="open inbox">
      <p className="text-out" style={{ marginBottom: 14 }}>
        inbox is open for <span className="hl">interesting work</span>,{' '}
        <span className="hl">collaborations</span>, or a chat about design tools and devex.
      </p>
      <div className="contact">
        <a className="contact-link" href={links.email}>
          <span><span className="lbl">email</span><br /><span className="val">hi@example.com</span></span>
          <span className="mono">→</span>
        </a>
        <a className="contact-link" href={links.github} target="_blank" rel="noopener noreferrer">
          <span><span className="lbl">github</span><br /><span className="val">@jv</span></span>
          <span className="mono">↗</span>
        </a>
        <a className="contact-link" href={links.twitter} target="_blank" rel="noopener noreferrer">
          <span><span className="lbl">twitter</span><br /><span className="val">@jv</span></span>
          <span className="mono">↗</span>
        </a>
      </div>
    </Panel>
  ),
};

const whoami: Command = {
  name: 'whoami',
  summary: 'print current user',
  run: () => <p className="text-out"><span className="ac">guest</span></p>,
};

const date: Command = {
  name: 'date',
  summary: 'print current date',
  run: () => <p className="text-out">{new Date().toString().toLowerCase()}</p>,
};

const echo: Command = {
  name: 'echo',
  summary: 'print arguments',
  run: (args) => <p className="text-out">{args.join(' ')}</p>,
};

const open: Command = {
  name: 'open',
  summary: 'open a link (github | twitter | email)',
  usage: 'open <github|twitter|email>',
  run: (args) => {
    const target = args[0];
    const url =
      target === 'github' ? links.github :
      target === 'twitter' ? links.twitter :
      target === 'email' ? links.email : null;
    if (!url) {
      return (
        <p className="err"><span className="glyph">✗</span>
          <span>open: unknown target. try <span className="mono">github | twitter | email</span></span>
        </p>
      );
    }
    window.open(url, url.startsWith('mailto:') ? '_self' : '_blank', 'noopener');
    return <p className="text-out"><span className="dim">→ opening</span> <span className="ac">{target}</span> <span className="dim">…</span></p>;
  },
};

const ls: Command = {
  name: 'ls',
  summary: 'list a section (projects | articles | all)',
  usage: 'ls <projects|articles|all>',
  run: (args, ctx) => {
    const raw = (args[0] ?? 'all').trim();
    const what = raw.replace(/\/+$/, '').toLowerCase(); // tolerate trailing slash
    if (what === '' || what === 'all' || what === '.' || what === '~') {
      return (
        <p className="text-out">
          <button type="button" className="path" onClick={() => ctx.type('ls showcase')}>showcase/</button>
          {'  '}
          <button type="button" className="path" onClick={() => ctx.type('ls articles')}>articles/</button>
          {'  '}
          <button type="button" className="path" onClick={() => ctx.type('cat about.md')}>about.md</button>
          {'  '}
          <button type="button" className="path" onClick={() => ctx.type('cat contact.md')}>contact.md</button>
        </p>
      );
    }
    if (what === 'showcase' || what === 'projects') return showcase.run([], ctx);
    if (what === 'articles' || what === 'blog') return articlesCmd.run([], ctx);
    // file-like refs route to cat for coherence
    if (what === 'about.md' || what === 'contact.md' || what === 'about' || what === 'contact') {
      return catCmd.run([what], ctx);
    }
    return (
      <p className="err"><span className="glyph">✗</span>
        <span>ls: no such section <span className="mono">'{raw}'</span> — try <span className="mono">ls</span></span>
      </p>
    );
  },
};

const catCmd: Command = {
  name: 'cat',
  summary: 'show a file (about.md | contact.md)',
  usage: 'cat <about.md|contact.md>',
  run: (args, ctx) => {
    const raw = (args[0] ?? '').trim().toLowerCase();
    const target = raw.replace(/\.md$/, '');
    if (target === 'about') return about.run([], ctx);
    if (target === 'contact') return contact.run([], ctx);
    if (!raw) {
      return (
        <p className="err"><span className="glyph">✗</span>
          <span>cat: missing file. try <span className="mono">about.md</span> or <span className="mono">contact.md</span></span>
        </p>
      );
    }
    return (
      <p className="err"><span className="glyph">✗</span>
        <span>cat: <span className="mono">{raw}</span>: no such file</span>
      </p>
    );
  },
};

const clear: Command = {
  name: 'clear',
  summary: 'clear the scrollback',
  run: (_a, ctx) => { ctx.clear(); return null; },
};

const blog: Command = { ...articlesCmd, name: 'blog', summary: 'alias for articles', hidden: true };
const projectsAlias: Command = { ...showcase, name: 'projects', summary: 'alias for showcase', hidden: true };
const exitCmd: Command = {
  name: 'exit',
  summary: 'fine, leave',
  run: () => (
    <p className="text-out">
      <span className="dim">just close the tab — </span>
      <span className="ac">^W</span>
      <span className="dim"> works too.</span>
    </p>
  ),
};

const aliasCmd: Command = {
  name: 'alias',
  summary: 'list or define a command alias (persisted)',
  usage: 'alias [name[=value]]',
  run: (args, ctx) => {
    const joined = args.join(' ').trim();
    if (!joined) {
      const entries = Object.entries(ctx.aliases);
      return (
        <Panel title="alias" meta={`${entries.length} defined`}>
          {entries.length === 0 ? (
            <p className="text-out"><span className="dim">no aliases. try </span><span className="mono ac">alias g=showcase</span></p>
          ) : (
            <div className="help">
              {entries.map(([k, v]) => (
                <Fragment key={k}>
                  <div className="k mono">
                    <button
                      type="button"
                      className="path"
                      onClick={() => ctx.type(k)}
                      title={`= ${v}`}
                    >
                      {k}
                    </button>
                  </div>
                  <div className="v mono"><span className="dim">= </span>{v}</div>
                </Fragment>
              ))}
            </div>
          )}
        </Panel>
      );
    }
    const eq = joined.indexOf('=');
    if (eq === -1) {
      const v = ctx.aliases[joined];
      return v
        ? <p className="text-out"><span className="mono ac">{joined}</span> <span className="dim">=</span> <span className="mono">{v}</span></p>
        : <p className="err"><span className="glyph">✗</span><span>alias: <span className="mono">{joined}</span> not defined</span></p>;
    }
    const name = joined.slice(0, eq).trim();
    let value = joined.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!name || !value) {
      return <p className="err"><span className="glyph">✗</span><span>alias: usage <span className="mono">alias name=value</span></span></p>;
    }
    if (registry[name] && !ctx.aliases[name]) {
      return <p className="err"><span className="glyph">✗</span><span>alias: <span className="mono">{name}</span> shadows a builtin (refuse)</span></p>;
    }
    ctx.setAlias(name, value);
    return <p className="text-out"><span className="dim">+</span> <span className="mono ac">{name}</span> <span className="dim">→</span> <span className="mono">{value}</span></p>;
  },
};

const unaliasCmd: Command = {
  name: 'unalias',
  summary: 'remove a command alias',
  usage: 'unalias <name>',
  run: (args, ctx) => {
    const name = (args[0] || '').trim();
    if (!name) return <p className="err"><span className="glyph">✗</span><span>unalias: missing name</span></p>;
    if (!ctx.aliases[name]) return <p className="err"><span className="glyph">✗</span><span>unalias: <span className="mono">{name}</span> not defined</span></p>;
    ctx.setAlias(name, null);
    return <p className="text-out"><span className="dim">−</span> <span className="mono">{name}</span></p>;
  },
};

export const registry: Record<string, Command> = Object.fromEntries(
  [help, about, showcase, articlesCmd, article, contact, open, ls, catCmd, whoami, date, echo, aliasCmd, unaliasCmd, clear, exitCmd, blog, projectsAlias]
    .map((c) => [c.name, c]),
);

/** primary commands surfaced in the floating completion menu */
export const primaryNames = ['help', 'about', 'showcase', 'articles', 'contact', 'clear'] as const;

export function unknownCommand(name: string): ReactNode {
  return (
    <p className="err"><span className="glyph">✗</span>
      <span>command not found: <span className="mono">{name}</span> — try <span className="mono">help</span></span>
    </p>
  );
}
