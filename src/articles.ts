import type { ComponentType } from 'react';

export type ArticleFrontmatter = {
  title: string;
  date: string;       // ISO yyyy-mm-dd
  readingMin: number;
  tags: string[];
};

export type Article = ArticleFrontmatter & {
  slug: string;
  Component: ComponentType;
};

type MDXModule = {
  default: ComponentType;
  frontmatter: Partial<ArticleFrontmatter>;
};

const modules = import.meta.glob<MDXModule>(
  '../content/articles/*.mdx',
  { eager: true },
);

function slugFromPath(path: string): string {
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.mdx$/, '');
}

export const articles: Article[] = Object.entries(modules)
  .map(([path, mod]) => {
    const fm = mod.frontmatter ?? {};
    return {
      slug: slugFromPath(path),
      title: String(fm.title ?? slugFromPath(path)),
      date: String(fm.date ?? '1970-01-01'),
      readingMin: Number(fm.readingMin ?? 1),
      tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
      Component: mod.default,
    } satisfies Article;
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function findArticle(slugOrTitle: string): Article | undefined {
  const q = slugOrTitle.toLowerCase().trim();
  return (
    articles.find((a) => a.slug.toLowerCase() === q) ??
    articles.find((a) => a.slug.toLowerCase().includes(q)) ??
    articles.find((a) => a.title.toLowerCase().includes(q))
  );
}
