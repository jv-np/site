import type { ReactNode } from 'react';

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
  run: (args: string[], ctx: CommandCtx) => ReactNode | null;
};