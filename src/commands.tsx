import type { ReactNode } from 'react';
import { articles, links, projects } from './data';

export type CommandCtx = {
  clear: () => void;
  run: (cmd: string) => void;
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
  run: () => (
    <Panel title="help" meta={`${Object.keys(registry).length} commands`}>
      <div className="help">
        {Object.values(registry)
          .filter((c) => !c.hidden)
          .map((c) => (
            <RowFragment key={c.name} k={c.name} v={c.summary} />
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

function RowFragment({ k, v }: { k: string; v: string }) {
  return (
    <>
      <div className="k mono">{k}</div>
      <div className="v">{v}</div>
    </>
  );
}

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
  summary: 'list writing (alias: blog)',
  run: () => (
    <Panel title="articles" meta={`${articles.length} posts`}>
      <div className="articles">
        {articles.map((a) => (
          <a key={a.id} href={a.url} className="article-row">
            <span className="article-date mono">{fmtDate(a.date)}</span>
            <span className="article-title">{a.title}</span>
            <span className="article-meta mono">
              {a.tags.join(' · ')} &nbsp; {a.readingMin}m
            </span>
          </a>
        ))}
      </div>
    </Panel>
  ),
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
    const what = args[0] ?? 'all';
    if (what === 'projects') return showcase.run([], ctx);
    if (what === 'articles' || what === 'blog') return articlesCmd.run([], ctx);
    if (what === 'all') return (
      <p className="text-out">
        <span className="ac">showcase/</span>  <span className="ac">articles/</span>  <span className="ac">about.md</span>  <span className="ac">contact.md</span>
      </p>
    );
    return (
      <p className="err"><span className="glyph">✗</span>
        <span>ls: no such section <span className="mono">'{what}'</span></span>
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

export const registry: Record<string, Command> = Object.fromEntries(
  [help, about, showcase, articlesCmd, contact, open, ls, whoami, date, echo, clear, exitCmd, blog, projectsAlias]
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
