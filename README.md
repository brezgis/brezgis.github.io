# brezgis.com

My corner of the internet — personal site, academic homepage, blog, and cabinet of curiosities, all in one page.

![Screenshot of brezgis.com — homepage with photo, name in Latin and Cyrillic, and links](docs/screenshot.png)

Live at **[brezgis.com](https://brezgis.com)**, served by GitHub Pages straight from this repository.

## What's here

The site is a single page with four faces, switched by the nav:

- **Home** — who I am: Computational Linguistics MS student at Brandeis, summer research intern at MIT Lincoln Laboratory, interested in geometric and topological approaches to representation analysis.
- **Research** — what I actually think about: linguistic relativity, interpretability, and persistent homology, plus a ledger-style feed for current work.
- **Blog** — updates, essays, and stray thoughts, from conference retrospectives to a rigorous Triscuit taste test.
- **Шара-бара** — /ʃa.ra.ˈba.ra/, dialectal for "odds and ends." A hub of small side projects (a honeypot dashboard, a snow globe TV, a digital twin of a Latvian tavern...), each living in its own repo and subdomain.

## How it's built

Hand-authored HTML, CSS, and vanilla JavaScript. No framework, no bundler, no build chain — with one deliberate exception:

### The blog builder

`build_blog.py` is the site's single moving part. Posts are Markdown files in `posts/` with a small frontmatter block:

```markdown
---
title: The Triscuit Taste Test
date: 2026-03-16
---

I love college student shenanigans...
```

Running the builder (requires the [`markdown`](https://pypi.org/project/Markdown/) package):

```bash
python3 build_blog.py
```

does two things:

1. renders each `posts/*.md` into a styled standalone page at `blog/<slug>.html`, complete with canonical URL, Open Graph / Twitter-card tags (using a dedicated `assets/img/blog/og-<slug>.jpg` card when one exists, else the post's first image), a copy-to-clipboard email link, and a photo lightbox;
2. rewrites the Blog section of `index.html` in place, injecting the full post list between the `BLOG:CARDS:START` / `BLOG:CARDS:END` markers — the homepage section *is* the blog index.

Frontmatter niceties: `summary:` overrides the auto-derived meta description, `draft: true` adds a draft badge, `display_date:` overrides the shown date, and `css:` pulls in extra stylesheets (used by the interactive persistent-homology widgets). Renaming a post to `*.md.hold` parks it — the builder skips it entirely.

The generated `blog/*.html` files are committed, so GitHub Pages just serves static files and the site needs no CI.

### Everything else

- `css/style.css` — design tokens and the main layout; `blog.css`, `research.css`, and `ph-widgets.css` extend it per section.
- `js/main.js` — nav switching, the email reveal, and other small behaviors.
- `js/ph/` — canvas widgets for the persistent-homology explainer.
- `dev-buttons.html` — a little style-variant sketchbook, not linked from the site.

## Running locally

It's a static site, so any file server works:

```bash
python3 -m http.server 8000
```

then open <http://localhost:8000>. (Opening `index.html` directly from disk mostly works too, but a server keeps relative paths and fonts happy.)

## License

Code is MIT licensed — see [LICENSE](LICENSE). The words and photographs are mine; please ask before reusing those.
