import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type FootnotesContextValue = {
  notes: Record<string, ReactNode>;
  register: (id: string, content: ReactNode) => void;
};

type FootnoteRefProps = {
  id: string;
  label?: ReactNode;
  children?: ReactNode;
};

type FootnoteProps = {
  id: string;
  children: ReactNode;
};

type FootnotesProps = {
  children: ReactNode;
};

type MdxContentProps = {
  children: ReactNode;
};

type PopoverPosition = {
  left: number;
  top: number;
  arrowLeft: number;
};

const FootnotesContext = createContext<FootnotesContextValue | null>(null);

function normalizeFootnoteId(id: string) {
  return id.trim().toLowerCase().replace(/\s+/g, '-');
}

function footnoteId(id: string) {
  return `fn-${normalizeFootnoteId(id)}`;
}

function footnoteRefId(id: string) {
  return `fnref-${normalizeFootnoteId(id)}`;
}

function footnotePopoverId(id: string) {
  return `fnpop-${normalizeFootnoteId(id)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function MdxContent({ children }: MdxContentProps) {
  const [notes, setNotes] = useState<Record<string, ReactNode>>({});

  const register = useCallback((id: string, content: ReactNode) => {
    const key = normalizeFootnoteId(id);
    setNotes((prev) => (key in prev ? prev : { ...prev, [key]: content }));
  }, []);

  const value = useMemo(() => ({ notes, register }), [notes, register]);

  return (
    <FootnotesContext.Provider value={value}>
      {children}
    </FootnotesContext.Provider>
  );
}

export function FootnoteRef({ id, label, children }: FootnoteRefProps) {
  const footnotes = useContext(FootnotesContext);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const key = normalizeFootnoteId(id);
  const content = label ?? children ?? id;
  const note = footnotes?.notes[key] ?? null;
  const popoverStyle = position
    ? ({
        '--footnote-popover-left': `${position.left}px`,
        '--footnote-popover-top': `${position.top}px`,
        '--footnote-popover-arrow-left': `${position.arrowLeft}px`,
      } as CSSProperties)
    : undefined;

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return;

    const margin = 18;
    const anchor = button.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth;
    const anchorCenter = anchor.left + anchor.width / 2;
    const minLeft = margin + popoverWidth / 2;
    const maxLeft = window.innerWidth - margin - popoverWidth / 2;
    const left = clamp(anchorCenter, minLeft, Math.max(minLeft, maxLeft));
    const arrowLeft = clamp(anchorCenter - (left - popoverWidth / 2), 12, popoverWidth - 12);

    setPosition({
      left,
      top: anchor.bottom + 8,
      arrowLeft,
    });
  }, []);

  const toggleOpen = useCallback(() => {
    if (!open) setPosition(null);
    setOpen((current) => !current);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const frameId = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <span className="footnote-ref-wrap">
      <sup id={footnoteRefId(id)} className="footnote-ref">
        <button
          ref={buttonRef}
          type="button"
          className="footnote-ref-button"
          aria-expanded={open}
          aria-controls={footnotePopoverId(id)}
          aria-label={`toggle footnote ${String(content)}`}
          onClick={toggleOpen}
        >
          {content}
        </button>
      </sup>
      {open ? (
        <span
          ref={popoverRef}
          id={footnotePopoverId(id)}
          className={`footnote-popover${position ? ' footnote-popover-ready' : ''}`}
          role="note"
          style={popoverStyle}
        >
          <span className="footnote-popover-head">
            <span className="footnote-popover-kicker">footnote {content}</span>
            <button
              type="button"
              className="footnote-popover-close"
              aria-label={`close footnote ${String(content)}`}
              onClick={() => setOpen(false)}
            >
              x
            </button>
          </span>
          <span className="footnote-popover-body">
            {note ?? <a href={`#${footnoteId(id)}`}>open footnote</a>}
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function Footnotes({ children }: FootnotesProps) {
  return (
    <section className="footnotes" aria-label="footnotes">
      <hr />
      <ol>{children}</ol>
    </section>
  );
}

export function Footnote({ id, children }: FootnoteProps) {
  const footnotes = useContext(FootnotesContext);

  useEffect(() => {
    footnotes?.register(id, children);
  }, [children, footnotes, id]);

  return (
    <li id={footnoteId(id)}>
      {children}{' '}
      <a className="footnote-backref" href={`#${footnoteRefId(id)}`} aria-label={`back to footnote ${id} reference`}>
        ^
      </a>
    </li>
  );
}