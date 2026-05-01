import { useEffect, useRef, useState, Fragment, type MouseEvent } from 'react';
type Sample = { label: string; system: string; prompt: string; reply: string };

const SAMPLES: Sample[] = [
  {
    label: 'pirate',
    system: 'talk like a shady hacker pirate',
    prompt: 'hi',
    reply: 'ahoy... welcome aboard. what can i help ye plunder today?',
  },
  {
    label: 'haiku',
    system: 'reply in a single haiku',
    prompt: 'describe the unix philosophy',
    reply: `Small tools work as one  
Plain streams flow between each task  
Do one thing well`,
  },
  {
    label: 'sysadmin',
    system: 'answer like a tired sysadmin at 3am',
    prompt: 'is the server down?',
    reply: 'Yeah, looks like the server is down right now, and we’re poking it with the usual sticks to get it back up.',
  },
];

const TYPE_MS = 22;

export default function MiiText() {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState('');
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const sample = SAMPLES[idx];
  const command = `echo '${sample.prompt}' | mii-text \\
    --ipc \\
    --quick \\
    --system '${sample.system}'`;
  
  const commandLines = command.split('\n');

  useEffect(() => () => {
    if (timer.current !== null) window.clearInterval(timer.current);
  }, []);

  // mark the enclosing .card as busy while streaming so the showcase
  // hover-collapse timer waits until we're done before shrinking.
  useEffect(() => {
    const card = rootRef.current?.closest<HTMLElement>('.card');
    if (!card) return;
    if (running) card.dataset.busy = 'true';
    else delete card.dataset.busy;
    return () => { delete card.dataset.busy; };
  }, [running]);

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
    <div ref={rootRef} className="mt" onClick={(e) => e.stopPropagation()}>
      <div className="mt-head">
        <span className="mt-dot" />
        <span className="mt-label">mii-text</span>
        <span className="mt-meta">
          <span className="mt-meta-full">sample {idx + 1}/{SAMPLES.length}</span>
          <span className="mt-meta-mini">{sample.label}</span>
        </span>
        <button
          type="button"
          onClick={cycle}
          disabled={running}
          className="mt-ghost"
          title="next sample"
          aria-label="next sample"
        >
          ↻
        </button>
      </div>

      {/* compact preview shown when card is collapsed */}
      <div className="mt-preview">
        <span className="mt-ps1">$</span>
        <code className="mt-preview-cmd">mii-text --system '{sample.system}'</code>
      </div>

      {/* full UI shown only when card is expanded */}
      <div className="mt-full">
        <div className="mt-cmd-row">
          <div className="wmax">
            <div className="mt-cmd-row">
              <span className="mt-ps1">$</span>
              <code className="mt-cmd">{commandLines[0]}</code>
              <button
                type="button"
                onClick={run}
                disabled={running}
                className={running ? 'mt-run mt-run-off' : 'mt-run'}
              >
                {running ? '· running' : '▶ run'}
              </button>
            </div>
            <div>
              {commandLines.slice(1).map((line, i) => (
                <Fragment key={i}>
                  <code className="mt-cmd">&nbsp;&nbsp;&nbsp;&nbsp;{line}</code>
                  <br />
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        <pre className="mt-out">
          {shown || (running ? '' : <span className="mt-hint">press run to stream a reply</span>)}
          {running ? <span className="mt-caret">▎</span> : null}
        </pre>
      </div>
    </div>
  );
}
