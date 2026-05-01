import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { primaryNames, registry, unknownCommand } from './commands';
import './App.css';

type Entry = {
  id: number;
  cmd: string;        // command line as typed (or '' for boot/welcome)
  output: ReactNode;
};

let nextId = 1;

const PROMPT_USER = 'guest';
const PROMPT_HOST = 'jv';
const PROMPT_CWD  = '~';

function Ps1() {
  return (
    <span className="ps1 mono">
      <span className="arrow">›</span>
      <span className="user">{PROMPT_USER}</span>
      <span className="at">@</span>
      <span className="host">{PROMPT_HOST}</span>
      <span className="sep">:</span>
      <span className="cwd">{PROMPT_CWD}</span>
      <span className="gt">$</span>
    </span>
  );
}

/* ── highlight matching prefix inside a name ─────────────────────────── */
function HiName({ name, q }: { name: string; q: string }) {
  if (!q) return <span className="name">{name}</span>;
  const lower = name.toLowerCase();
  const i = lower.indexOf(q.toLowerCase());
  if (i === -1) return <span className="name">{name}</span>;
  return (
    <span className="name">
      {name.slice(0, i)}
      <span className="match">{name.slice(i, i + q.length)}</span>
      {name.slice(i + q.length)}
    </span>
  );
}

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [menuIdx, setMenuIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef(false);

  /* ── execution ─────────────────────────────────────────────────────── */
  const ctx = useMemo(
    () => ({
      clear: () => setEntries([]),
      run: (cmd: string) => execute(cmd),
    }),
    [],
  );

  const execute = useCallback((raw: string) => {
    const line = raw.trim();
    if (!line) {
      setEntries((prev) => [...prev, { id: nextId++, cmd: '', output: null }]);
      return;
    }
    const [name, ...args] = line.split(/\s+/);
    const cmd = registry[name.toLowerCase()];
    const output: ReactNode = cmd ? cmd.run(args, ctx) : unknownCommand(name);

    if (cmd && cmd.name === 'clear') {
      setHistory((h) => (h[h.length - 1] === line ? h : [...h, line]));
      return;
    }
    setEntries((prev) => [...prev, { id: nextId++, cmd: line, output }]);
    setHistory((h) => (h[h.length - 1] === line ? h : [...h, line]));
  }, [ctx]);

  /* ── boot ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const boot: ReactNode = (
      <div className="boot">
        <div className="row"><span className="ok">[ok]</span><span className="what">mounted <span className="hl">tty/jv</span></span></div>
        <div className="row"><span className="ok">[ok]</span><span className="what">loaded <span className="hl">~/projects</span> · <span className="hl">~/articles</span></span></div>
        <div className="row"><span className="ok">[ok]</span><span className="what">network <span className="hl">online</span> · uplink stable</span></div>
        <pre className="ascii">{`   _ __   __
  (_)\\ \\ / /     jv shell
  | | \\ V /      v1.0.0 · 2026
  | |  \\_/       a portfolio that thinks it's a terminal
 _/ |
|__/`}</pre>
        <p className="welcome">
          welcome. <span className="dim">type a command, press </span><span className="ac">tab</span><span className="dim"> to complete, or click anything in the menu below.</span>
        </p>
      </div>
    );
    setEntries([{ id: nextId++, cmd: '', output: boot }]);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  /* ── auto-scroll ───────────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [entries, input, menuOpen]);

  /* ── keep focus when clicking the terminal ─────────────────────────── */
  const refocus = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    const tgt = e.target as HTMLElement | null;
    if (tgt && tgt.closest('a, button, input, .menu')) return;
    inputRef.current?.focus();
  };

  /* ── completions ───────────────────────────────────────────────────── */
  const completions = useMemo(() => {
    const q = input.trim().toLowerCase();
    const all = Object.values(registry).filter((c) => !c.hidden);
    if (!q) {
      // empty: show primary commands in a curated order
      const order = new Map(primaryNames.map((n, i) => [n, i]));
      return all
        .filter((c) => order.has(c.name as typeof primaryNames[number]))
        .sort((a, b) => (order.get(a.name as typeof primaryNames[number])! - order.get(b.name as typeof primaryNames[number])!));
    }
    return all
      .filter((c) => c.name.includes(q) || c.summary.toLowerCase().includes(q))
      .sort((a, b) => {
        const ai = a.name.startsWith(q) ? 0 : 1;
        const bi = b.name.startsWith(q) ? 0 : 1;
        return ai - bi || a.name.localeCompare(b.name);
      });
  }, [input]);

  // clamp menu cursor when filter changes
  useEffect(() => {
    if (menuIdx >= completions.length) setMenuIdx(0);
  }, [completions, menuIdx]);

  // ghost suggestion: completion of the first matching command sharing the prefix
  const ghost = useMemo(() => {
    const q = input;
    if (!q) return '';
    const m = completions.find((c) => c.name.startsWith(q.toLowerCase()));
    if (!m) return '';
    return m.name.slice(q.length);
  }, [input, completions]);

  /* ── click chip → type out + run ───────────────────────────────────── */
  const typeAndRun = useCallback((cmd: string) => {
    if (typingRef.current) return;
    typingRef.current = true;
    inputRef.current?.focus();
    setMenuOpen(false);
    setInput('');
    let i = 0;
    const step = () => {
      i++;
      setInput(cmd.slice(0, i));
      if (i < cmd.length) {
        setTimeout(step, 26 + Math.random() * 30);
      } else {
        setTimeout(() => {
          execute(cmd);
          setInput('');
          setHistIdx(null);
          setMenuOpen(true);
          typingRef.current = false;
        }, 130);
      }
    };
    setTimeout(step, 50);
  }, [execute]);

  /* ── input handling ────────────────────────────────────────────────── */
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typingRef.current) { e.preventDefault(); return; }

    // menu navigation
    if (menuOpen && completions.length > 0) {
      if (e.key === 'ArrowDown' || (e.ctrlKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setMenuIdx((i) => (i + 1) % completions.length);
        return;
      }
      if (e.key === 'ArrowUp' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setMenuIdx((i) => (i - 1 + completions.length) % completions.length);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // accept ghost first; otherwise pick highlighted menu item
      if (ghost) setInput(input + ghost);
      else if (completions[menuIdx]) setInput(completions[menuIdx].name);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      execute(input);
      setInput('');
      setHistIdx(null);
      setMenuOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (menuOpen) setMenuOpen(false);
      else if (input) setInput('');
      return;
    }

    // bash-style history (without menu interference: ↑/↓ already taken)
    if (!menuOpen || completions.length === 0) {
      if (e.key === 'ArrowUp') {
        if (history.length === 0) return;
        e.preventDefault();
        const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(idx);
        setInput(history[idx]);
        return;
      }
      if (e.key === 'ArrowDown') {
        if (histIdx === null) return;
        e.preventDefault();
        const idx = histIdx + 1;
        if (idx >= history.length) { setHistIdx(null); setInput(''); }
        else { setHistIdx(idx); setInput(history[idx]); }
        return;
      }
    }

    // alt-history fallback: Ctrl-↑/↓ always traverses history
    if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (e.key === 'ArrowUp' && history.length) {
        const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(idx); setInput(history[idx]);
      } else if (e.key === 'ArrowDown' && histIdx !== null) {
        const idx = histIdx + 1;
        if (idx >= history.length) { setHistIdx(null); setInput(''); }
        else { setHistIdx(idx); setInput(history[idx]); }
      }
      return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setEntries([]);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      setEntries((prev) => [
        ...prev,
        { id: nextId++, cmd: input + ' ^C', output: null },
      ]);
      setInput('');
      setHistIdx(null);
      setMenuOpen(true);
      return;
    }
  };

  return (
    <div className="term" onMouseUp={refocus}>
      {/* status strip */}
      <div className="statusbar mono">
        <div className="left">
          <span className="live">online</span>
          <span className="sep">·</span>
          <span><span className="key">tty</span> jv/0</span>
          <span className="sep">·</span>
          <span><span className="key">cwd</span> ~</span>
        </div>
        <div className="right">
          <span><span className="key">tab</span> <span className="ac">complete</span></span>
          <span className="sep">·</span>
          <span><span className="key">↑↓</span> <span className="ac">menu</span></span>
          <span className="sep">·</span>
          <span><span className="key">^l</span> <span className="ac">clear</span></span>
        </div>
      </div>

      <div className="term-inner">
        {entries.map((e) => (
          <div key={e.id} className="entry">
            {e.cmd !== '' && (
              <div className="line">
                <Ps1 />
                <span className="cmd-text">{e.cmd}</span>
              </div>
            )}
            {e.output}
          </div>
        ))}

        {/* active prompt */}
        <div className="active-line">
          <Ps1 />
          <div className="active-input-wrap menu-anchor">
            <div className="active-input-row">
              <span className="typed">{input}</span>
              {ghost && <span className="ghost">{ghost}</span>}
              <span className="caret" aria-hidden />
            </div>
            <input
              ref={inputRef}
              className="real-input mono"
              value={input}
              onChange={(e) => { setInput(e.target.value); setMenuOpen(true); setHistIdx(null); }}
              onKeyDown={onKey}
              onFocus={() => setMenuOpen(true)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              aria-label="terminal input"
            />

            {menuOpen && completions.length > 0 && (
              <div className="menu" role="listbox" aria-label="completions">
                <div className="menu-head">
                  <span><span className="ac">▸</span> completions {input && <>· filter: <span className="ac">{input}</span></>}</span>
                  <span>{menuIdx + 1}/{completions.length}</span>
                </div>
                <ul className="menu-list">
                  {completions.map((c, i) => (
                    <li
                      key={c.name}
                      className={`menu-item${i === menuIdx ? ' active' : ''}`}
                      onMouseEnter={() => setMenuIdx(i)}
                      onMouseDown={(e) => { e.preventDefault(); typeAndRun(c.name); }}
                      role="option"
                      aria-selected={i === menuIdx}
                    >
                      <span className="glyph">›</span>
                      <HiName name={c.name} q={input} />
                      <span className="desc">{c.summary}</span>
                      <span className="hint">{c.usage ?? ''}</span>
                    </li>
                  ))}
                </ul>
                <div className="menu-foot">
                  <span><kbd>↵</kbd> run · <kbd>tab</kbd> accept · <kbd>esc</kbd> hide</span>
                  <span><kbd>^↑</kbd><kbd>^↓</kbd> history</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default App;
