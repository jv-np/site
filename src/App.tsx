import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { primaryNames, registry, unknownCommand } from './commands';
import { MAX_HISTORY_ENTRIES, normalizeAliases, normalizeHistory, resolveAlias } from './terminal';
import { usePersistentState } from './usePersistentState';
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
const TEXT_ENTRY_SELECTOR = 'input, textarea, select, [contenteditable="true"]';
const POINTER_ACTION_SELECTOR = 'a[href], button, [role="button"], [role="link"], summary, video[controls], audio[controls]';

const BOOT_ASCII = String.raw`   _                
  (_)__   __  _ __            jv.n shell
  | |\ \ / / | '_ \           v1.0.0 · 2026
  | | \ V /_ | | | |          a portfolio that thinks it's a terminal
 _/ |  \_/(_)|_| |_|
|__/                
`.trimEnd();

function closestElement(target: EventTarget | null, selector: string) {
  return target instanceof Element ? target.closest(selector) : null;
}

function isTextEntryTarget(target: EventTarget | null) {
  return Boolean(closestElement(target, TEXT_ENTRY_SELECTOR));
}

function shouldReturnPromptFocus(target: EventTarget | null) {
  return !isTextEntryTarget(target) && Boolean(closestElement(target, POINTER_ACTION_SELECTOR));
}

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

function BootOutput() {
  return (
    <div className="boot">
      <div className="row"><span className="ok">[ok]</span><span className="what">mounted <span className="hl">tty/jv.n</span></span></div>
      <div className="row"><span className="ok">[ok]</span><span className="what">loaded <span className="hl">~/projects</span> · <span className="hl">~/articles</span></span></div>
      <div className="row"><span className="ok">[ok]</span><span className="what">network <span className="hl">online</span> · uplink stable</span></div>
      <pre className="ascii">{BOOT_ASCII}</pre>
      <p className="welcome">
        welcome. <span className="dim">type a command, press </span><span className="ac">tab</span><span className="dim"> to complete, or click anything in the menu below.</span>
      </p>
    </div>
  );
}

function bootEntry(): Entry {
  return { id: nextId++, cmd: '', output: <BootOutput /> };
}

function App() {
  const [entries, setEntries] = useState<Entry[]>(() => [bootEntry()]);
  const [input, setInput] = useState('');
  const [caretPos, setCaretPos] = useState(0);
  const [history, setHistory] = usePersistentState<string[]>(
    'jv:history',
    [],
    normalizeHistory,
  );
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [menuIdx, setMenuIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(true);

  // persisted aliases: name -> command line
  const [aliases, setAliases] = usePersistentState<Record<string, string>>(
    'jv:aliases',
    {},
    normalizeAliases,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef(false);
  const pointerActionRef = useRef(false);
  const aliasesRef = useRef(aliases);
  useEffect(() => { aliasesRef.current = aliases; }, [aliases]);
  const typeAndRunRef = useRef<(cmd: string) => void>(() => {});

  /* ── execution ─────────────────────────────────────────────────────── */
  const ctx = useMemo(
    () => ({
      clear: () => setEntries([]),
      run: (cmd: string) => execute(cmd),
      type: (cmd: string) => typeAndRunRef.current(cmd),
      get aliases() { return aliasesRef.current; },
      setAlias: (name: string, value: string | null) => {
        setAliases((prev) => {
          if (value === null) {
            const next = { ...prev };
            delete next[name];
            return next;
          }
          return { ...prev, [name]: value };
        });
      },
    }),
    // execute is recreated when ctx changes; we capture via closure-stable pattern
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const execute = useCallback((raw: string) => {
    const line = raw.trim();
    if (!line) {
      setEntries((prev) => [...prev, { id: nextId++, cmd: '', output: null }]);
      return;
    }
    // resolve alias on first token (with cycle protection)
    const resolved = resolveAlias(line, aliasesRef.current);
    const [name, ...args] = resolved.split(/\s+/);
    const cmd = registry[name.toLowerCase()];
    const output: ReactNode = cmd ? cmd.run(args, ctx) : unknownCommand(name);

    setHistory((historyEntries) => (
      historyEntries[historyEntries.length - 1] === line
        ? historyEntries
        : [...historyEntries, line].slice(-MAX_HISTORY_ENTRIES)
    ));
    if (cmd && cmd.name === 'clear') return; // clear handled its own output
    setEntries((prev) => [...prev, { id: nextId++, cmd: line, output }]);
  }, [ctx, setHistory]);

  /* ── boot ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const timerId = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timerId);
  }, []);

  /* ── auto-scroll ───────────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [entries, input, menuOpen]);

  /* ── keep caret in sync with hidden input (covers programmatic setInput) */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? input.length;
    setCaretPos((prev) => (prev === pos && prev <= input.length ? prev : Math.min(pos, input.length)));
  }, [input]);

  /* ── keep focus when clicking the terminal ─────────────────────────── */
  const refocus = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    const tgt = e.target as HTMLElement | null;
    if (tgt && tgt.closest(`${POINTER_ACTION_SELECTOR}, ${TEXT_ENTRY_SELECTOR}, .strip`)) return;
    inputRef.current?.focus();
  };

  const trackPointerAction = (e: React.PointerEvent) => {
    pointerActionRef.current = shouldReturnPromptFocus(e.target);
  };

  const refocusAfterPointerAction = () => {
    if (!pointerActionRef.current) return;
    pointerActionRef.current = false;
    window.requestAnimationFrame(() => {
      if (isTextEntryTarget(document.activeElement)) return;
      inputRef.current?.focus();
    });
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

  const activeMenuIdx = completions.length === 0
    ? 0
    : Math.min(menuIdx, completions.length - 1);

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
  useEffect(() => { typeAndRunRef.current = typeAndRun; }, [typeAndRun]);

  /* ── input handling ────────────────────────────────────────────────── */
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typingRef.current) { e.preventDefault(); return; }

    // menu navigation (Ctrl-N/P only — ↑/↓ reserved for history)
    if (menuOpen && completions.length > 0) {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setMenuIdx((index) => (Math.min(index, completions.length - 1) + 1) % completions.length);
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setMenuIdx((index) => (Math.min(index, completions.length - 1) - 1 + completions.length) % completions.length);
        return;
      }
    }

    const atEnd = inputRef.current ? inputRef.current.selectionStart === input.length : true;

    if (e.key === 'Tab' || (e.key === 'ArrowRight' && atEnd && (ghost || completions[activeMenuIdx]))) {
      e.preventDefault();
      // accept ghost first; otherwise pick highlighted menu item
      if (ghost) setInput(input + ghost);
      else if (completions[activeMenuIdx]) setInput(completions[activeMenuIdx].name);
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

    // shell history — ↑/↓ always (terminal-correct), Ctrl-↑/↓ as fallback
    const isUp = e.key === 'ArrowUp';
    const isDown = e.key === 'ArrowDown';
    if (isUp || isDown) {
      if (isUp && history.length === 0) return;
      if (isDown && histIdx === null) return;
      e.preventDefault();
      if (isUp) {
        const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(idx);
        setInput(history[idx]);
      } else {
        const idx = histIdx! + 1;
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
    <div
      className="term"
      onPointerDownCapture={trackPointerAction}
      onClickCapture={refocusAfterPointerAction}
      onMouseUp={refocus}
    >
      {/* status strip */}
      <div className="statusbar mono">
        <div className="left">
          <span className="live">online</span>
          <span className="sep">·</span>
          <span><span className="key">tty</span> jv.n/0</span>
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
            {e.cmd === '' && e.output == null ? (
              <div className="line"><Ps1 /></div>
            ) : e.cmd !== '' ? (
              <div className="line">
                <Ps1 />
                <span className="cmd-text">{e.cmd}</span>
              </div>
            ) : null}
            {e.output}
          </div>
        ))}

        {/* active prompt — single baseline-aligned inline flow */}
        <div className="active-line">
          <Ps1 />
          <span> </span>
          <span className="active-input-wrap">
            <span className="typed">{input.slice(0, caretPos)}</span>
            <span className="caret" aria-hidden>█</span>
            <span className="typed">{input.slice(caretPos)}</span>
            {ghost && caretPos === input.length && <span className="ghost">{ghost}</span>}
            <input
              ref={inputRef}
              className="real-input mono"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setCaretPos(e.target.selectionStart ?? e.target.value.length);
                setMenuOpen(true);
                setHistIdx(null);
              }}
              onKeyDown={onKey}
              onKeyUp={(e) => setCaretPos(e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
              onSelect={(e) => setCaretPos(e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
              onClick={(e) => setCaretPos(e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
              onFocus={() => setMenuOpen(true)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              aria-label="terminal input"
            />
          </span>

          {menuOpen && completions.length > 0 && (
            <div className="strip" role="listbox" aria-label="completions">
              <span className="lead mono">
                <span className="ac">↳</span> {input ? <>match</> : <>try</>} ·
              </span>
              {completions.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className={`strip-item${i === activeMenuIdx ? ' active' : ''}`}
                  onMouseEnter={() => setMenuIdx(i)}
                  onMouseDown={(e) => { e.preventDefault(); typeAndRun(c.name); }}
                  role="option"
                  aria-selected={i === activeMenuIdx}
                  title={c.summary}
                >
                  <HiName name={c.name} q={input} />
                  {i < completions.length - 1 && <span className="sep">·</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default App;
