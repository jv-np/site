import type { ReactNode } from 'react';
import { Fragment, Suspense, useEffect, useState } from 'react';
import { links, projects } from './data';
import { articles, findArticle } from './articles';
import { Err, Out, RunChip } from './ui';

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
                <RunChip ctx={ctx} cmd={c.name} title={c.usage ?? c.name}>{c.name}</RunChip>
              </div>
              <div className="v">{c.summary}</div>
            </Fragment>
          ))}
      </div>
      <Out style={{ marginTop: 14 }}>
        <span className="dim">tip:</span> press <span className="hl">tab</span> to complete,
        <span className="hl"> ↑/↓</span> for history,{' '}
        <span className="hl">click any chip</span> below the prompt to run a command.
      </Out>
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
      <Showcase />
    </Panel>
  ),
};

type Project = (typeof projects)[number];

function Showcase() {
  // single source of truth → only one card can be expanded at a time.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = expandedId
    ? projects.find((p) => p.id === expandedId) ?? null
    : null;

  // close on Escape while a modal is open.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <div className={`showcase-frame${expanded ? ' showcase-frame-modal' : ''}`}>
      <div className="grid">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            p={p}
            onExpand={() => setExpandedId(p.id)}
          />
        ))}
      </div>
      {expanded ? (
        <ExpandedCard p={expanded} onClose={() => setExpandedId(null)} />
      ) : null}
    </div>
  );
}

function ProjectCard({ p, onExpand }: { p: Project; onExpand: () => void }) {
  const expandable = Boolean(p.expandable);

  if (!expandable) {
    return (
      <a
        href={p.url}
        target={p.url.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="card"
        draggable={false}
      >
        <CardBody p={p} />
      </a>
    );
  }

  return (
    <div
      className="card card-expandable"
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onExpand();
        }
      }}
    >
      <span className="card-corner card-corner-tl" aria-hidden />
      <span className="card-corner card-corner-tr" aria-hidden />
      <span className="card-corner card-corner-bl" aria-hidden />
      <span className="card-corner card-corner-br" aria-hidden />
      <CardBody p={p} expandable />
    </div>
  );
}

function CardBody({
  p, expandable, inModal,
}: {
  p: Project;
  expandable?: boolean;
  inModal?: boolean;
}) {
  const external = p.url.startsWith('http');
  return (
    <>
      <div className="card-head">
        <span className="card-id mono">PRJ-{p.id} · {p.year}</span>
        {expandable && !inModal ? (
          <a
            className="card-link mono"
            href={p.url}
            target={external ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="open project (skip preview)"
            aria-label="open project"
            draggable={false}
          >↗</a>
        ) : (
          <span className="arrow mono">↗</span>
        )}
      </div>
      <div className="card-title">{p.name}</div>
      <p className="card-desc">{p.description}</p>
      {p.component ? (
        <div
          className="card-embed"
          // capture-phase preventDefault: cancels the wrapping <a>'s
          // navigation before the click reaches it. preventDefault is a
          // no-op for <button>s (they have no default action) so the
          // embed's own controls still receive their clicks.
          // we don't stopPropagation here because that would block
          // child handlers in capture; mii-text's own stopPropagation
          // on bubble already prevents the parent role=button expand.
          onClickCapture={(e) => e.preventDefault()}
          // anchors are natively draggable, which hijacks text selection
          // inside the embed by spawning a link-drag ghost. cancel it.
          onDragStart={(e) => e.preventDefault()}
        >
          <Suspense fallback={<p className="card-desc">loading project...</p>}>
            <p.component />
          </Suspense>
        </div>
      ) : null}
      <ul className="tags">
        {p.tags.map((t) => <li key={t} className="tag">{t}</li>)}
      </ul>
    </>
  );
}

function ExpandedCard({ p, onClose }: { p: Project; onClose: () => void }) {
  const external = p.url.startsWith('http');
  return (
    <>
      <div
        className="card-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <a
        href={p.url}
        target={external ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="card card-expanded card-modal"
        aria-label={`open ${p.name}`}
        draggable={false}
      >
        <div className="card-modal-controls">
          <button
            type="button"
            className="card-close mono"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="close (esc)"
            title="close (esc)"
          >×</button>
        </div>
        <CardBody p={p} expandable inModal />
      </a>
    </>
  );
}

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
          <Out><span className="dim">no posts match</span> <span className="hl">{q}</span></Out>
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
        <Out style={{ marginTop: 12 }}>
          <span className="dim">read with</span> <span className="mono ac">article &lt;slug&gt;</span>
        </Out>
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
      return <Err>article: missing slug. try <span className="mono">articles</span> to list.</Err>;
    }
    const a = findArticle(q);
    if (!a) {
      return <Err>article: no match for <span className="mono">{q}</span></Err>;
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
      <Out style={{ marginBottom: 14 }}>
        inbox is open for <span className="hl">interesting work</span>,{' '}
        <span className="hl">collaborations</span>, or a chat about design tools and devex.
      </Out>
      <div className="contact">
        <a className="contact-link" href={links.email}>
          <span><span className="lbl">email</span><br /><span className="val">mii_nipah@pm.me</span></span>
          <span className="mono">→</span>
        </a>
        <a className="contact-link" href={links.github} target="_blank" rel="noopener noreferrer">
          <span><span className="lbl">github</span><br /><span className="val">@jv-np</span></span>
          <span className="mono">↗</span>
        </a>
        <a className="contact-link" href={links.twitter} target="_blank" rel="noopener noreferrer">
          <span><span className="lbl">twitter</span><br /><span className="val">@_mii_nipah</span></span>
          <span className="mono">↗</span>
        </a>
      </div>
    </Panel>
  ),
};

const whoami: Command = {
  name: 'whoami',
  summary: 'print current user',
  run: () => <Out><span className="ac">guest</span></Out>,
};

const date: Command = {
  name: 'date',
  summary: 'print current date',
  run: () => <Out>{new Date().toString().toLowerCase()}</Out>,
};

const echo: Command = {
  name: 'echo',
  summary: 'print arguments',
  run: (args) => <Out>{args.join(' ')}</Out>,
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
      return <Err>open: unknown target. try <span className="mono">github | twitter | email</span></Err>;
    }
    window.open(url, url.startsWith('mailto:') ? '_self' : '_blank', 'noopener');
    return <Out><span className="dim">→ opening</span> <span className="ac">{target}</span> <span className="dim">…</span></Out>;
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
        <Out>
          <RunChip ctx={ctx} cmd="ls showcase">showcase/</RunChip>{'  '}
          <RunChip ctx={ctx} cmd="ls articles">articles/</RunChip>{'  '}
          <RunChip ctx={ctx} cmd="cat about.md">about.md</RunChip>{'  '}
          <RunChip ctx={ctx} cmd="cat contact.md">contact.md</RunChip>
        </Out>
      );
    }
    if (what === 'showcase' || what === 'projects') return showcase.run([], ctx);
    if (what === 'articles' || what === 'blog') return articlesCmd.run([], ctx);
    // file-like refs route to cat for coherence
    if (what === 'about.md' || what === 'contact.md' || what === 'about' || what === 'contact') {
      return catCmd.run([what], ctx);
    }
    return <Err>ls: no such section <span className="mono">'{raw}'</span> — try <span className="mono">ls</span></Err>;
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
      return <Err>cat: missing file. try <span className="mono">about.md</span> or <span className="mono">contact.md</span></Err>;
    }
    return <Err>cat: <span className="mono">{raw}</span>: no such file</Err>;
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
    <Out>
      <span className="dim">just close the tab — </span>
      <span className="ac">^W</span>
      <span className="dim"> works too.</span>
    </Out>
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
            <Out><span className="dim">no aliases. try </span><span className="mono ac">alias g=showcase</span></Out>
          ) : (
            <div className="help">
              {entries.map(([k, v]) => (
                <Fragment key={k}>
                  <div className="k mono">
                    <RunChip ctx={ctx} cmd={k} title={`= ${v}`}>{k}</RunChip>
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
        ? <Out><span className="mono ac">{joined}</span> <span className="dim">=</span> <span className="mono">{v}</span></Out>
        : <Err>alias: <span className="mono">{joined}</span> not defined</Err>;
    }
    const name = joined.slice(0, eq).trim();
    let value = joined.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!name || !value) {
      return <Err>alias: usage <span className="mono">alias name=value</span></Err>;
    }
    if (registry[name] && !ctx.aliases[name]) {
      return <Err>alias: <span className="mono">{name}</span> shadows a builtin (refuse)</Err>;
    }
    ctx.setAlias(name, value);
    return <Out><span className="dim">+</span> <span className="mono ac">{name}</span> <span className="dim">→</span> <span className="mono">{value}</span></Out>;
  },
};

const unaliasCmd: Command = {
  name: 'unalias',
  summary: 'remove a command alias',
  usage: 'unalias <name>',
  run: (args, ctx) => {
    const name = (args[0] || '').trim();
    if (!name) return <Err>unalias: missing name</Err>;
    if (!ctx.aliases[name]) return <Err>unalias: <span className="mono">{name}</span> not defined</Err>;
    ctx.setAlias(name, null);
    return <Out><span className="dim">−</span> <span className="mono">{name}</span></Out>;
  },
};

export const registry: Record<string, Command> = Object.fromEntries(
  [help, about, showcase, articlesCmd, article, contact, open, ls, catCmd, whoami, date, echo, aliasCmd, unaliasCmd, clear, exitCmd, blog, projectsAlias]
    .map((c) => [c.name, c]),
);

/** primary commands surfaced in the floating completion menu */
export const primaryNames = ['help', 'about', 'showcase', 'articles', 'contact', 'clear'] as const;

export function unknownCommand(name: string): ReactNode {
  return <Err>command not found: <span className="mono">{name}</span> — try <span className="mono">help</span></Err>;
}
