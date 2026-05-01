import type { ReactNode } from 'react';
import type { CommandCtx } from './commandTypes';

/** standard error line used by every command that reports failure */
export function Err({ children }: { children: ReactNode }) {
  return (
    <p className="err">
      <span className="glyph">✗</span>
      <span>{children}</span>
    </p>
  );
}

/** standard plain output line */
export function Out({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <p className="text-out" style={style}>{children}</p>;
}

/** clickable monospace token that types-and-runs a command on click */
export function RunChip({
  ctx, cmd, children, title,
}: {
  ctx: CommandCtx;
  cmd: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="path"
      onClick={() => ctx.type(cmd)}
      title={title ?? cmd}
    >
      {children}
    </button>
  );
}
