import type { ReactNode } from 'react';
import { Suspense, useEffect, useState } from 'react';
import { projects } from './data';
import { Out, RunChip } from './ui';
import type { CommandCtx } from './commandTypes';

type Project = (typeof projects)[number];

export function Panel(props: { title: string; meta?: string; children: ReactNode }) {
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

export function Showcase() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = expandedId
    ? projects.find((project) => project.id === expandedId) ?? null
    : null;

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <div className={`showcase-frame${expanded ? ' showcase-frame-modal' : ''}`}>
      <div className="grid">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onExpand={() => setExpandedId(project.id)}
          />
        ))}
      </div>
      {expanded ? (
        <ExpandedCard project={expanded} onClose={() => setExpandedId(null)} />
      ) : null}
    </div>
  );
}

function ProjectCard({ project, onExpand }: { project: Project; onExpand: () => void }) {
  const expandable = Boolean(project.expandable);

  if (!expandable) {
    return (
      <a
        href={project.url}
        target={project.url.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="card"
        draggable={false}
      >
        <CardBody project={project} />
      </a>
    );
  }

  return (
    <div
      className="card card-expandable"
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onExpand();
        }
      }}
    >
      <CardCorners />
      <CardBody project={project} expandable />
    </div>
  );
}

function CardCorners() {
  const corners = ['tl', 'tr', 'bl', 'br'] as const;

  return (
    <>
      {corners.map((corner) => (
        <span key={corner} className={`card-corner card-corner-${corner}`} aria-hidden />
      ))}
    </>
  );
}

function CardBody({
  project,
  expandable,
  inModal,
}: {
  project: Project;
  expandable?: boolean;
  inModal?: boolean;
}) {
  const external = project.url.startsWith('http');
  return (
    <>
      <div className="card-head">
        <span className="card-id mono">PRJ-{project.id} · {project.year}</span>
        {expandable && !inModal ? (
          <a
            className="card-link mono"
            href={project.url}
            target={external ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            title="open project (skip preview)"
            aria-label="open project"
            draggable={false}
          >↗</a>
        ) : (
          <span className="arrow mono">↗</span>
        )}
      </div>
      <div className="card-title">{project.name}</div>
      <p className="card-desc">{project.description}</p>
      {project.component ? (
        <div
          className="card-embed"
          onClickCapture={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
        >
          <Suspense fallback={<p className="card-desc">loading project...</p>}>
            <project.component />
          </Suspense>
        </div>
      ) : null}
      <ul className="tags">
        {project.tags.map((tag) => <li key={tag} className="tag">{tag}</li>)}
      </ul>
    </>
  );
}

function ExpandedCard({ project, onClose }: { project: Project; onClose: () => void }) {
  const external = project.url.startsWith('http');
  return (
    <>
      <div
        className="card-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <a
        href={project.url}
        target={external ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="card card-expanded card-modal"
        aria-label={`open ${project.name}`}
        draggable={false}
      >
        <div className="card-modal-controls">
          <button
            type="button"
            className="card-close mono"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }}
            aria-label="close (esc)"
            title="close (esc)"
          >×</button>
        </div>
        <CardBody project={project} expandable inModal />
      </a>
    </>
  );
}

const TIPS: Array<(ctx: CommandCtx) => ReactNode> = [
  () => <>press <span className="hl">tab</span> to autocomplete · <span className="hl">↑/↓</span> walks history.</>,
  (ctx) => <>try <RunChip ctx={ctx} cmd="ls">ls</RunChip> to see sections, or <RunChip ctx={ctx} cmd="ls all">ls all</RunChip> for everything.</>,
  () => <>define your own shortcut: <span className="mono ac">alias g=showcase</span> — it persists across reloads.</>,
  () => <>every clickable <span className="mono">chip</span> below the prompt just types-and-runs a command. nothing magic.</>,
  (ctx) => <>articles support fuzzy match: <RunChip ctx={ctx} cmd="article macro">article macro</RunChip> opens by fragment.</>,
  () => <>good code reads like prose. if a function needs a comment to explain <em>what</em>, rename it.</>,
  () => <>premature abstraction costs more than duplication. wait for the third occurrence.</>,
  () => <>the best dx is the one you don't notice — until you try a worse one.</>,
  (ctx) => <>filter writing by tag: <RunChip ctx={ctx} cmd="articles devex">articles devex</RunChip>.</>,
  () => <>small, focused tools beat one giant framework. compose, don't inherit.</>,
  () => <>if you can't explain it on a napkin, the design isn't done yet.</>,
  (ctx) => <>this whole site is a terminal. <RunChip ctx={ctx} cmd="help">help</RunChip> lists everything.</>,
  () => <>read the source before the docs. the source can't lie.</>,
  () => <>your future self is the most underestimated user of your code.</>,
  (ctx) => <>bored? <RunChip ctx={ctx} cmd="showcase">showcase</RunChip> has a few things worth poking at.</>,
];

export function TipBody({ ctx }: { ctx: CommandCtx }) {
  const [pick] = useState(() => {
    const last = Number(sessionStorage.getItem('tips:last') ?? '-1');
    let index = Math.floor(Math.random() * TIPS.length);
    if (TIPS.length > 1 && index === last) index = (index + 1) % TIPS.length;
    sessionStorage.setItem('tips:last', String(index));
    return index;
  });
  const tip = TIPS[pick];
  return (
    <Panel title="tip" meta={`#${String(pick + 1).padStart(2, '0')}/${String(TIPS.length).padStart(2, '0')}`}>
      <Out>
        <span className="ac mono">»</span> {tip(ctx)}
      </Out>
      <Out style={{ marginTop: 8 }}>
        <span className="dim">run </span><RunChip ctx={ctx} cmd="tips">tips</RunChip><span className="dim"> again for another.</span>
      </Out>
    </Panel>
  );
}