import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';

type Sample = { system: string; prompt: string; reply: string };

const SAMPLES: Sample[] = [
  {
    system: 'talk like a shady hacker pirate',
    prompt: 'hi',
    reply: 'ahoy... welcome aboard. what can i help ye plunder today?',
  },
  {
    system: 'reply in a single haiku',
    prompt: 'describe the unix philosophy',
    reply: 'small tools, sharp edges —\npipes carry quiet intent\ndo one thing, do well',
  },
  {
    system: 'answer like a tired sysadmin at 3am',
    prompt: 'is the server down?',
    reply: 'it is now. it was not. it will be again. coffee?',
  },
];

const TYPE_MS = 22;

export default function MiiText() {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  const sample = SAMPLES[idx];
  const command = `echo '${sample.prompt}' | mii-text --ipc --quick --system '${sample.system}'`;

  useEffect(() => () => {
    if (timer.current !== null) window.clearInterval(timer.current);
  }, []);

  function run(e: MouseEvent) {
    // showcase card wraps us in an <a>; don't navigate.
    e.preventDefault();
    e.stopPropagation();
    if (running) return;

    setShown('');
    setRunning(true);

    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1;
      setShown(sample.reply.slice(0, i));
      if (i >= sample.reply.length) {
        if (timer.current !== null) window.clearInterval(timer.current);
        timer.current = null;
        setRunning(false);
      }
    }, TYPE_MS);
  }

  function cycle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (running) return;
    setShown('');
    setIdx((n) => (n + 1) % SAMPLES.length);
  }

  return (
    <div style={frame} onClick={(e) => e.stopPropagation()}>
      <div style={head}>
        <span style={dot} />
        <span style={headLabel}>mii-text</span>
        <span style={headMeta}>sample {idx + 1}/{SAMPLES.length}</span>
        <button
          type="button"
          onClick={cycle}
          disabled={running}
          style={ghostBtn}
          title="next sample"
          aria-label="next sample"
        >
          ↻
        </button>
      </div>

      <div style={cmdRow}>
        <span style={ps1}>$</span>
        <code style={cmd}>{command}</code>
        <button
          type="button"
          onClick={run}
          disabled={running}
          style={running ? runBtnDisabled : runBtn}
        >
          {running ? '· running' : '▶ run'}
        </button>
      </div>

      <pre style={out}>
        {shown || (running ? '' : <span style={hint}>press run to stream a reply</span>)}
        {running ? <span style={caret}>▎</span> : null}
      </pre>
    </div>
  );
}

/* ─── styles (scoped, token-based) ─────────────────────────────────── */

const frame: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 12,
  background: 'var(--bg-deep)',
  border: '1px solid var(--border)',
  borderLeft: '2px solid var(--accent)',
  borderRadius: 3,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  lineHeight: 1.55,
};

const head: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 10,
  color: 'var(--fg-faint)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const dot: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--accent)',
  boxShadow: '0 0 8px var(--accent-dim)',
};

const headLabel: CSSProperties = { color: 'var(--fg-dim)' };
const headMeta: CSSProperties = { marginLeft: 'auto', color: 'var(--fg-faint)' };

const ghostBtn: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-hi)',
  color: 'var(--fg-dim)',
  padding: '1px 6px',
  borderRadius: 2,
  font: 'inherit',
  cursor: 'pointer',
  lineHeight: 1,
};

const cmdRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
};

const ps1: CSSProperties = {
  color: 'var(--accent)',
  textShadow: '0 0 6px var(--accent-dim)',
  userSelect: 'none',
  flexShrink: 0,
};

const cmd: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  color: 'var(--fg)',
  scrollbarWidth: 'none',
};

const runBtn: CSSProperties = {
  flexShrink: 0,
  background: 'transparent',
  border: '1px solid var(--accent)',
  color: 'var(--accent)',
  padding: '3px 10px',
  borderRadius: 2,
  font: 'inherit',
  letterSpacing: '0.04em',
  cursor: 'pointer',
};

const runBtnDisabled: CSSProperties = {
  ...runBtn,
  borderColor: 'var(--border-hi)',
  color: 'var(--fg-faint)',
  cursor: 'default',
};

const out: CSSProperties = {
  margin: 0,
  minHeight: '3.1em',
  padding: '8px 10px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  color: 'var(--fg)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  font: 'inherit',
};

const hint: CSSProperties = { color: 'var(--fg-faint)', fontStyle: 'normal' };

const caret: CSSProperties = {
  display: 'inline-block',
  marginLeft: 1,
  color: 'var(--accent)',
  textShadow: '0 0 4px var(--accent-dim)',
  animation: 'blink 1.05s steps(2, end) infinite',
};
