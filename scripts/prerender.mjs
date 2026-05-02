/**
 * Build-time prerender for SEO.
 *
 * For each .mdx article in content/articles/, emit
 *   dist/articles/<slug>/index.html
 * containing the rendered article HTML, proper <title>/<meta>/<link rel=canonical>,
 * OpenGraph + Twitter tags, and Article JSON-LD. Also emit:
 *   dist/articles/index.html   — list of articles
 *   dist/sitemap.xml
 *   dist/robots.txt
 *
 * The prerendered HTML is placed inside the existing <div id="root">. When
 * the SPA mounts, main.tsx clears #root and React takes over, with the URL
 * triggering the deep-link logic in App.tsx so the same article is shown
 * inside the terminal.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkFrontmatter from 'remark-frontmatter';
 import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import rehypePrettyCode from 'rehype-pretty-code';
import { projects, links } from '../src/data.ts';

// Production domain. Baked into canonical URLs, OpenGraph, sitemap, JSON-LD.
const SITE_URL = 'https://mii-nipah.com';
const SITE_TITLE = 'mii-nipah · website & notes';
const SITE_DESC = 'mii-nipah — jv.n — engineer & thinker. website and writing.';
const AUTHOR = 'jv.n';
const TWITTER = '@_mii_nipah';
// Optional social card image. If `public/og.png` exists it's served at /og.png
// and used as the default og:image for every page.
const OG_IMAGE_PATH = '/og.png';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
// The Cloudflare vite plugin emits the static client into dist/client/.
const DIST = path.join(ROOT, 'dist/client');
const ARTICLES_DIR = path.join(ROOT, 'content/articles');

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

function slugFromFile(file) {
  return file.replace(/\.mdx$/, '');
}

async function compileArticle(file) {
  const source = await fs.readFile(path.join(ARTICLES_DIR, file), 'utf8');
  const mod = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    rehypePlugins: [
      [
        rehypePrettyCode,
        { theme: 'github-dark-default', keepBackground: false, defaultLang: { block: 'text', inline: 'text' } },
      ],
    ],
  });
  const fm = mod.frontmatter ?? {};
  const html = renderToStaticMarkup(React.createElement(mod.default));
  return {
    slug: slugFromFile(file),
    title: String(fm.title ?? slugFromFile(file)),
    date: String(fm.date ?? '1970-01-01').slice(0, 10),
    readingMin: Number(fm.readingMin ?? 1),
    tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
    html,
  };
}

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00Z')
    .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' })
    .toLowerCase();
}

/** Inject per-page meta + body content into the built shell HTML. */
function renderPage({ shell, title, description, path: urlPath, ogType = 'website', bodyHtml, jsonLd, ogImage }) {
  const url = SITE_URL + urlPath;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);

  let out = shell;

  // <title>
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`);
  // description
  out = out.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${safeDesc}">`,
  );
  // canonical
  out = out.replace(
    /<link\s+rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
  );
  // OG
  out = out
    .replace(/<meta\s+property="og:type"[^>]*>/, `<meta property="og:type" content="${ogType}">`)
    .replace(/<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${safeTitle}">`)
    .replace(/<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${safeDesc}">`)
    .replace(/<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${escapeHtml(url)}">`)
    .replace(/<meta\s+name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${safeTitle}">`)
    .replace(/<meta\s+name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${safeDesc}">`);

  // og:image + twitter card upgrade (summary_large_image looks much nicer when there's an image)
  if (ogImage) {
    const absImg = escapeHtml(SITE_URL + ogImage);
    const imgTags =
      `<meta property="og:image" content="${absImg}">` +
      `<meta name="twitter:image" content="${absImg}">`;
    out = out
      .replace(/<meta\s+name="twitter:card"[^>]*>/, '<meta name="twitter:card" content="summary_large_image">')
      .replace('</head>', `${imgTags}</head>`);
  }

  // optional JSON-LD before </head>
  if (jsonLd) {
    out = out.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>`);
  }

  // SEO body — replaces empty <div id="root"></div>. React will clear it on mount.
  if (bodyHtml) {
    out = out.replace(
      /<div id="root"><\/div>/,
      `<div id="root">${bodyHtml}</div>`,
    );
  }
  return out;
}

const SEO_STYLE = `
<style>
  .seo{max-width:720px;margin:0 auto;padding:32px 20px 64px;color:#e8e8e8;font-family:Inter,system-ui,sans-serif;line-height:1.6}
  .seo a{color:#7dd3fc;text-decoration:none}
  .seo a:hover{text-decoration:underline}
  .seo .nav{font-size:13px;color:#888;margin-bottom:24px}
  .seo h1{font-size:1.8rem;line-height:1.2;margin:0 0 8px}
  .seo .meta{color:#888;font-size:13px;margin:0 0 24px}
  .seo h2,.seo h3{margin-top:1.6em}
  .seo pre{overflow-x:auto;padding:12px;background:#111;border:1px solid #222;border-radius:6px;font-size:13px}
  .seo code{font-family:'JetBrains Mono',ui-monospace,monospace}
  .seo ul,.seo ol{padding-left:1.4em}
  .seo hr{border:0;border-top:1px solid #222;margin:24px 0}
  .seo .list{display:flex;flex-direction:column;gap:14px;margin-top:20px}
  .seo .list a{display:block;padding:10px 0;border-bottom:1px dashed #222;color:#e8e8e8}
  .seo .list .d{color:#888;font-size:12px;font-family:'JetBrains Mono',monospace;margin-right:10px}
  .seo .list .t{color:#888;font-size:12px;float:right;font-family:'JetBrains Mono',monospace}
</style>`;

function articleSeoBody(a) {
  return `${SEO_STYLE}<main class="seo"><div class="nav"><a href="/">← jv.n terminal</a> · <a href="/articles">all articles</a></div><article><h1>${escapeHtml(a.title)}</h1><p class="meta">${escapeHtml(fmtDate(a.date))} · ${a.readingMin}m · ${a.tags.map(escapeHtml).join(', ')}</p>${a.html}</article><p class="meta" style="margin-top:32px"><a href="/articles">← more articles</a></p></main>`;
}

function articlesSeoBody(list) {
  const items = list
    .map(
      (a) =>
        `<a href="/articles/${escapeHtml(a.slug)}"><span class="d">${escapeHtml(fmtDate(a.date))}</span>${escapeHtml(a.title)}<span class="t">${a.readingMin}m</span></a>`,
    )
    .join('');
  return `${SEO_STYLE}<main class="seo"><div class="nav"><a href="/">← jv.n terminal</a></div><h1>articles</h1><div class="list">${items}</div></main>`;
}

function homeSeoBody(list) {
  const items = list
    .slice(0, 5)
    .map(
      (a) =>
        `<a href="/articles/${escapeHtml(a.slug)}"><span class="d">${escapeHtml(fmtDate(a.date))}</span>${escapeHtml(a.title)}<span class="t">${a.readingMin}m</span></a>`,
    )
    .join('');
  return `${SEO_STYLE}<main class="seo"><h1>jv.n</h1><p class="meta">${escapeHtml(SITE_DESC)}</p><p>this site is a terminal. type <code>help</code> once it loads, or jump straight in:</p><div class="list">${items}</div><p style="margin-top:24px"><a href="/articles">all articles →</a> · <a href="/showcase">showcase</a> · <a href="/about">about</a> · <a href="/contact">contact</a></p></main>`;
}

// About / contact prose mirrors the hand-written copy in src/commands.tsx.
// Kept in sync manually — they rarely change.
function aboutSeoBody() {
  return `${SEO_STYLE}<main class="seo"><div class="nav"><a href="/">← jv.n terminal</a></div><h1>about</h1><p><strong>jv.n</strong> — engineer, thinker, occasional writer. i like building cool stuff.</p><p>currently focused on developer experience, small and focused tooling, and useful reusable libraries.</p><h2>stack</h2><ul><li><strong>languages</strong> — csharp, kotlin, swift, rust, typescript</li><li><strong>frontend</strong> — react, angular, solidjs</li><li><strong>backend</strong> — asp.net core, sql server, postgresql</li><li><strong>anything</strong> — i'll simply learn and try everything</li></ul><p style="margin-top:24px"><a href="/showcase">see what i've built →</a></p></main>`;
}

function contactSeoBody() {
  return `${SEO_STYLE}<main class="seo"><div class="nav"><a href="/">← jv.n terminal</a></div><h1>contact</h1><p>inbox is open for interesting work, collaborations, or a chat about design tools and devex.</p><ul><li><strong>email</strong> — <a href="${escapeHtml(links.email)}">mii_nipah@pm.me</a></li><li><strong>github</strong> — <a href="${escapeHtml(links.github)}" rel="noopener">@jv-np</a></li><li><strong>twitter / x</strong> — <a href="${escapeHtml(links.twitter)}" rel="noopener">${escapeHtml(TWITTER)}</a></li></ul></main>`;
}

function showcaseSeoBody() {
  const items = projects
    .map((p) => {
      const external = p.url.startsWith('http');
      return `<li><a href="${escapeHtml(p.url)}"${external ? ' rel="noopener"' : ''}><strong>${escapeHtml(p.name)}</strong></a> <span class="d">PRJ-${escapeHtml(p.id)} · ${escapeHtml(p.year)}</span><br><span style="color:#bbb">${escapeHtml(p.description)}</span><br><span class="d">${p.tags.map(escapeHtml).join(' · ')}</span></li>`;
    })
    .join('');
  return `${SEO_STYLE}<main class="seo"><div class="nav"><a href="/">← jv.n terminal</a></div><h1>showcase</h1><p class="meta">${projects.length} projects</p><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:18px">${items}</ul></main>`;
}

function articleJsonLd(a) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    datePublished: a.date,
    dateModified: a.date,
    author: { '@type': 'Person', name: AUTHOR },
    keywords: a.tags.join(', '),
    mainEntityOfPage: `${SITE_URL}/articles/${a.slug}`,
    url: `${SITE_URL}/articles/${a.slug}`,
  };
}

async function writeFile(rel, content) {
  const full = path.join(DIST, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
}

async function main() {
  const shell = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');

  // Detect optional social card image.
  let ogImage = null;
  try {
    await fs.access(path.join(DIST, OG_IMAGE_PATH));
    ogImage = OG_IMAGE_PATH;
    console.log(`prerender: og:image → ${ogImage}`);
  } catch {
    console.log('prerender: no public/og.png — social cards will be text-only');
  }

  const files = (await fs.readdir(ARTICLES_DIR)).filter((f) => f.endsWith('.mdx'));
  const articles = (await Promise.all(files.map(compileArticle))).sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  // per-article pages
  for (const a of articles) {
    const desc = `${a.title} — ${a.readingMin}m read by ${AUTHOR}.`;
    const out = renderPage({
      shell,
      title: `${a.title} · jv.n`,
      description: desc,
      path: `/articles/${a.slug}`,
      ogType: 'article',
      bodyHtml: articleSeoBody(a),
      jsonLd: articleJsonLd(a),
      ogImage,
    });
    await writeFile(path.join('articles', a.slug, 'index.html'), out);
    console.log(`prerender: /articles/${a.slug}`);
  }

  // articles list
  const listPage = renderPage({
    shell,
    title: 'articles · jv.n',
    description: `writing — ${articles.length} posts.`,
    path: '/articles',
    bodyHtml: articlesSeoBody(articles),
    ogImage,
  });
  await writeFile(path.join('articles', 'index.html'), listPage);
  console.log('prerender: /articles');

  // section pages — prerendered so curl/crawlers get real content,
  // SPA still hijacks them on hydration via the deep-link bridge.
  const sections = [
    { slug: 'about', title: 'about · jv.n', desc: SITE_DESC, body: aboutSeoBody() },
    { slug: 'showcase', title: 'showcase · jv.n', desc: `projects by ${AUTHOR} — ${projects.length} listed.`, body: showcaseSeoBody() },
    { slug: 'contact', title: 'contact · jv.n', desc: `how to reach ${AUTHOR}.`, body: contactSeoBody() },
  ];
  for (const s of sections) {
    const out = renderPage({
      shell,
      title: s.title,
      description: s.desc,
      path: `/${s.slug}`,
      bodyHtml: s.body,
      ogImage,
    });
    await writeFile(path.join(s.slug, 'index.html'), out);
    console.log(`prerender: /${s.slug}`);
  }

  // homepage — lightweight SEO body so crawlers find articles without the sitemap
  const rootPage = renderPage({
    shell,
    title: SITE_TITLE,
    description: SITE_DESC,
    path: '/',
    bodyHtml: homeSeoBody(articles),
    ogImage,
  })
    .replace(/<meta\s+name="twitter:site"[^>]*>\s*/, '')
    .replace('</head>', `<meta name="twitter:site" content="${TWITTER}"></head>`);
  await writeFile('index.html', rootPage);

  // sitemap — every URL with real prerendered HTML.
  const sitemapEntries = [
    { loc: `${SITE_URL}/`, lastmod: articles[0]?.date },
    { loc: `${SITE_URL}/about` },
    { loc: `${SITE_URL}/showcase` },
    { loc: `${SITE_URL}/contact` },
    { loc: `${SITE_URL}/articles`, lastmod: articles[0]?.date },
    ...articles.map((a) => ({ loc: `${SITE_URL}/articles/${a.slug}`, lastmod: a.date })),
  ];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries.map(
      (e) =>
        `<url><loc>${escapeHtml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  await writeFile('sitemap.xml', sitemap);
  console.log('prerender: /sitemap.xml');

  // robots
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  await writeFile('robots.txt', robots);
  console.log('prerender: /robots.txt');
}

main().catch((err) => {
  console.error('prerender failed:', err);
  process.exit(1);
});
