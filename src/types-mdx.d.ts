declare module '*.mdx' {
  import type { ComponentType } from 'react';
  export const frontmatter: {
    title?: string;
    date?: string;
    readingMin?: number;
    tags?: string[];
    [key: string]: unknown;
  };
  const Component: ComponentType<Record<string, unknown>>;
  export default Component;
}
