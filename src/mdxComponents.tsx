import { Children, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type FootnotesContextValue = {
  notes: Record<string, ReactNode>;
  register: (id: string, content: ReactNode) => void;
};

type LinkPreviewEntry = {
  preview: ReactNode;
  to?: string;
  openLabel?: ReactNode;
};

type LinkPreviewsContextValue = {
  previews: Record<string, LinkPreviewEntry>;
  register: (id: string, entry: LinkPreviewEntry) => void;
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

type LinkProps = {
  children: ReactNode;
  openLabel?: ReactNode;
};

type LinkRefProps = {
  id: string;
  children?: ReactNode;
  label?: ReactNode;
};

type LinkPreviewProps = {
  id: string;
  children: ReactNode;
  openLabel?: ReactNode;
};

type TextProps = {
  children: ReactNode;
};

type PreviewProps = {
  children: ReactNode;
};

type ToProps = {
  src: string;
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
const LinkPreviewsContext = createContext<LinkPreviewsContextValue | null>(null);

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

function useAnchoredPopover<TAnchor extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const anchorRef = useRef<TAnchor>(null);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const popoverStyle = position
    ? ({
        '--inline-popover-left': `${position.left}px`,
        '--inline-popover-top': `${position.top}px`,
        '--inline-popover-arrow-left': `${position.arrowLeft}px`,
      } as CSSProperties)
    : undefined;

  const updatePosition = useCallback(() => {
    const anchorEl = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchorEl || !popover) return;

    const margin = 18;
    const anchor = anchorEl.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth;
    const anchorCenter = anchor.left + anchor.width / 2;
    const minLeft = margin + popoverWidth / 2;
    const maxLeft = window.innerWidth - margin - popoverWidth / 2;
    const left = clamp(anchorCenter, minLeft, Math.max(minLeft, maxLeft));
    const arrowLeft = clamp(anchorCenter - (left - popoverWidth / 2), 12, popoverWidth - 12);

    setPosition({ left, top: anchor.bottom + 8, arrowLeft });
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

  return { open, setOpen, toggleOpen, anchorRef, popoverRef, popoverStyle, ready: Boolean(position) };
}

function findChildProps<TProps>(children: ReactNode, component: (props: TProps) => ReactNode) {
  for (const child of Children.toArray(children)) {
    if (isValidElement<TProps>(child) && child.type === component) return child.props;
  }
  return null;
}

export function MdxContent({ children }: MdxContentProps) {
  const [notes, setNotes] = useState<Record<string, ReactNode>>({});
  const [previews, setPreviews] = useState<Record<string, LinkPreviewEntry>>({});

  const register = useCallback((id: string, content: ReactNode) => {
    const key = normalizeFootnoteId(id);
    setNotes((prev) => (key in prev ? prev : { ...prev, [key]: content }));
  }, []);

  const registerPreview = useCallback((id: string, entry: LinkPreviewEntry) => {
    const key = normalizeFootnoteId(id);
    setPreviews((prev) => (key in prev ? prev : { ...prev, [key]: entry }));
  }, []);

  const value = useMemo(() => ({ notes, register }), [notes, register]);
  const previewValue = useMemo(
    () => ({ previews, register: registerPreview }),
    [previews, registerPreview],
  );

  return (
    <FootnotesContext.Provider value={value}>
      <LinkPreviewsContext.Provider value={previewValue}>
        {children}
      </LinkPreviewsContext.Provider>
    </FootnotesContext.Provider>
  );
}

export function FootnoteRef({ id, label, children }: FootnoteRefProps) {
  const footnotes = useContext(FootnotesContext);
  const {
    open,
    setOpen,
    toggleOpen,
    anchorRef,
    popoverRef,
    popoverStyle,
    ready,
  } = useAnchoredPopover<HTMLButtonElement>();
  const key = normalizeFootnoteId(id);
  const content = label ?? children ?? id;
  const note = footnotes?.notes[key] ?? null;

  return (
    <span className="footnote-ref-wrap">
      <sup id={footnoteRefId(id)} className="footnote-ref">
        <button
          ref={anchorRef}
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
          className={`inline-popover footnote-popover${ready ? ' inline-popover-ready' : ''}`}
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

export function Link({ children, openLabel = 'open full page' }: LinkProps) {
  const {
    open,
    setOpen,
    toggleOpen,
    anchorRef,
    popoverRef,
    popoverStyle,
    ready,
  } = useAnchoredPopover<HTMLButtonElement>();
  const text = findChildProps<TextProps>(children, Text)?.children;
  const preview = findChildProps<PreviewProps>(children, Preview)?.children;
  const to = findChildProps<ToProps>(children, To);
  const trigger = text ?? to?.src ?? 'link';

  return (
    <span className="link-preview-wrap">
      <button
        ref={anchorRef}
        type="button"
        className="link-preview-trigger"
        aria-expanded={open}
        aria-label="toggle link preview"
        onClick={toggleOpen}
      >
        {trigger}
      </button>
      {preview ? (
        <span className="link-preview-index" aria-hidden="true">
          {preview}
        </span>
      ) : null}
      {open ? (
        <span
          ref={popoverRef}
          className={`inline-popover link-popover${ready ? ' inline-popover-ready' : ''}`}
          role="dialog"
          aria-label="link preview"
          style={popoverStyle}
        >
          <span className="footnote-popover-head">
            <span className="footnote-popover-kicker">link preview</span>
            <button
              type="button"
              className="footnote-popover-close"
              aria-label="close link preview"
              onClick={() => setOpen(false)}
            >
              x
            </button>
          </span>
          <span className="link-preview-body">
            {preview ?? <span className="link-preview-title">{trigger}</span>}
            {to ? (
              <a className="link-preview-open" href={to.src} target="_blank" rel="noopener noreferrer">
                {openLabel}
              </a>
            ) : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function LinkRef({ id, children, label }: LinkRefProps) {
  const linkPreviews = useContext(LinkPreviewsContext);
  const {
    open,
    setOpen,
    toggleOpen,
    anchorRef,
    popoverRef,
    popoverStyle,
    ready,
  } = useAnchoredPopover<HTMLButtonElement>();
  const key = normalizeFootnoteId(id);
  const entry = linkPreviews?.previews[key] ?? null;
  const trigger = label ?? children ?? id;

  return (
    <span className="link-preview-wrap">
      <button
        ref={anchorRef}
        type="button"
        className="link-preview-trigger"
        aria-expanded={open}
        aria-label="toggle link preview"
        onClick={toggleOpen}
      >
        {trigger}
      </button>
      {open ? (
        <span
          ref={popoverRef}
          className={`inline-popover link-popover${ready ? ' inline-popover-ready' : ''}`}
          role="dialog"
          aria-label="link preview"
          style={popoverStyle}
        >
          <span className="footnote-popover-head">
            <span className="footnote-popover-kicker">link preview</span>
            <button
              type="button"
              className="footnote-popover-close"
              aria-label="close link preview"
              onClick={() => setOpen(false)}
            >
              x
            </button>
          </span>
          <span className="link-preview-body">
            {entry?.preview ?? <span className="link-preview-title">{trigger}</span>}
            {entry?.to ? (
              <a className="link-preview-open" href={entry.to} target="_blank" rel="noopener noreferrer">
                {entry.openLabel ?? 'open full page'}
              </a>
            ) : null}
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function LinkPreview({ id, children, openLabel }: LinkPreviewProps) {
  const linkPreviews = useContext(LinkPreviewsContext);
  const preview = findChildProps<PreviewProps>(children, Preview)?.children ?? null;
  const to = findChildProps<ToProps>(children, To);

  useEffect(() => {
    linkPreviews?.register(id, {
      preview,
      to: to?.src,
      openLabel,
    });
  }, [id, linkPreviews, openLabel, preview, to?.src]);

  return preview ? (
    <span className="link-preview-index" aria-hidden="true">
      {preview}
    </span>
  ) : null;
}

export function Text({ children }: TextProps) {
  return <>{children}</>;
}

export function Preview({ children }: PreviewProps) {
  return <>{children}</>;
}

export function To({ src }: ToProps) {
  void src;
  return null;
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