#!/usr/bin/env python3
"""Static blog builder for brezgis.com — "Ledger" layout, single-page.

The blog lives as a section of the homepage. Reads posts/*.md (frontmatter +
Markdown) and produces:
  - blog/<slug>.html   one styled page per post
  - index.html         injects the full post list into the Blog section

Each post page links back to the in-page Blog section. There is no separate
blog index page — the homepage section is the blog.

No external services, no build chain — just python-markdown.
Run from the repo root:  python3 build_blog.py
"""
import os
import re
import html
from datetime import datetime

import markdown

ROOT = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(ROOT, "posts")
BLOG_DIR = os.path.join(ROOT, "blog")
INDEX = os.path.join(ROOT, "index.html")
SITE_URL = "https://brezgis.com"  # for canonical + Open Graph absolute URLs

EXCERPT_WORDS = 20  # how many leading words of each post show in the list
DESC_CHARS = 200    # how many leading characters feed the <meta>/OG description

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:'
         'ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;'
         '1,8..60,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">')

POST_TMPL = """<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-GKLF5RCLQJ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());

    gtag('config', 'G-GKLF5RCLQJ');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Anna Brežġis</title>
  <meta name="description" content="{summary}">
{social}
  <link rel="icon" type="image/png" href="../assets/icons/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  {fonts}
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/blog.css">{extra_css}
</head>
<body>

  <nav class="navbar" id="navbar">
    <ul>
      <li><a href="../index.html#home" class="nav-link">Home</a></li>
      <li><a href="../index.html#research" class="nav-link">Research</a></li>
      <li><a href="../index.html#blog" class="nav-link active">Blog</a></li>
      <li><a href="../index.html#sharabara" class="nav-link">Шара-бара</a></li>
    </ul>
  </nav>

  <article class="post">
    <div class="container post-container">
      <a class="post-back" href="../index.html#blog">← All posts</a>
      <header class="post-header">
        <p class="post-date">{date_display}{draft_badge}</p>
        <h1 class="post-title">{title}</h1>
      </header>
      <div class="post-body">
{body}
      </div>
    </div>
  </article>

  {footer}

{script}

</body>
</html>
"""

# Inline email handler for post pages — same obfuscated-display / copy-on-click
# behavior as the homepage.
EMAIL_SCRIPT = """  <script>
    (function () {
    // --- Email: shown obfuscated, assembled only on click and copied to the
    // clipboard (never written into the HTML source). ---
    function copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
      }
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return Promise.resolve(ok);
      } catch (_) { return Promise.resolve(false); }
    }
    function copyEmail(e) {
      e.preventDefault();
      const addr = ['anna', 'brezgis.com'].join('@');
      const clicked = e.currentTarget;
      const label = clicked.querySelector('#email-text');
      copyToClipboard(addr).then((ok) => {
        if (label) {
          const shown = label.textContent;
          label.textContent = ok ? 'Copied \u2713' : addr;
          window.setTimeout(() => { label.textContent = shown; }, 1200);
        } else {
          clicked.title = ok ? 'Copied!' : addr;
          window.setTimeout(() => { clicked.title = 'Click to copy email'; }, 1200);
        }
      });
    }
    window.copyEmail = copyEmail;
    })();
  </script>"""

# Click any post photo to open it large; close with the ×, the backdrop, or Esc.
LIGHTBOX_SCRIPT = """  <script>
    (function () {
      var imgs = document.querySelectorAll('.post-body figure img, .post-body .fig-pair-imgs img');
      if (!imgs.length) return;
      var box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close">&times;</button><img alt="">';
      document.body.appendChild(box);
      var boxImg = box.querySelector('img');
      function open(im) { boxImg.src = im.currentSrc || im.src; boxImg.alt = im.alt || ''; box.classList.add('open'); document.body.style.overflow = 'hidden'; }
      function close() { box.classList.remove('open'); document.body.style.overflow = ''; boxImg.removeAttribute('src'); }
      imgs.forEach(function (im) { im.addEventListener('click', function () { open(im); }); });
      box.querySelector('.lightbox-close').addEventListener('click', close);
      box.addEventListener('click', function (e) { if (e.target === box) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
    })();
  </script>"""

ROW_TMPL = """        <li><a class="postlist-row" href="{href}">
          <span class="postlist-date">{date_short}</span>
          <span class="postlist-main"><span class="postlist-title">{title}{draft_tag}</span><span class="postlist-sum">{summary}</span></span>
        </a></li>"""


def parse_frontmatter(text):
    meta, body = {}, text
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            for line in text[3:end].strip().splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip().strip('"').strip("'")
            body = text[end + 4:].lstrip("\n")
    return meta, body


def make_excerpt(body, n=EXCERPT_WORDS):
    """First ~n words of the leading prose, for the post list."""
    words = []
    for line in body.splitlines():
        s = line.strip()
        if not s:
            continue
        if s[0] in "<#|":          # skip HTML blocks, headings, tables
            if words:
                break              # stop once we've passed the opening prose
            continue
        s = re.sub(r"<[^>]+>", "", s)                     # inline HTML tags
        s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)        # images
        s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)    # links -> text
        s = re.sub(r"[*_`>#]", "", s)                     # inline marks
        words.extend(s.split())
        if len(words) >= n:
            break
    text = " ".join(words[:n]).rstrip(",;:—- ")
    if len(words) > n:
        text += "…"
    return text


def make_char_excerpt(body, n=DESC_CHARS):
    """First ~n characters of the leading prose, cut at a sentence boundary
    when possible (else a word boundary). Used as the <meta>/Open Graph
    description when a post carries no hand-written summary."""
    chunks = []
    for line in body.splitlines():
        s = line.strip()
        if not s:
            if chunks:
                break              # stop at the end of the opening paragraph
            continue
        if s[0] in "<#|":          # skip HTML blocks, headings, tables
            if chunks:
                break
            continue
        s = re.sub(r"<[^>]+>", "", s)                     # inline HTML tags
        s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)        # images
        s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)    # links -> text
        s = re.sub(r"[*_`>#]", "", s)                     # inline marks
        chunks.append(s)
    text = " ".join(chunks).strip()
    if len(text) <= n:
        return text
    # keep whole sentences up to the n-char mark (always at least the first);
    # if even the first sentence overshoots, trim to a word boundary + ellipsis
    ends = [mm.start() + 1 for mm in re.finditer(r"[.!?](?=\s|$)", text)]
    chosen = 0
    for e in ends:
        if e <= n:
            chosen = e
        else:
            break
    if not chosen and ends and ends[0] <= n + 40:
        chosen = ends[0]          # first sentence ends just past n — keep it whole
    if chosen:
        return text[:chosen].strip()
    cut = text[:n]
    if " " in cut:
        cut = cut[:cut.rfind(" ")]
    return cut.rstrip(",;:—- ") + "…"


def load_posts():
    posts = []
    for fn in os.listdir(POSTS_DIR):
        if not fn.endswith(".md"):
            continue
        with open(os.path.join(POSTS_DIR, fn), encoding="utf-8") as f:
            meta, body = parse_frontmatter(f.read())
        meta["slug"] = meta.get("slug") or os.path.splitext(fn)[0]
        meta["title"] = meta.get("title", meta["slug"])
        meta["summary"] = meta.get("summary", "")
        meta["draft"] = str(meta.get("draft", "")).lower() in ("1", "true", "yes")
        dt = datetime.strptime(meta["date"], "%Y-%m-%d")
        meta["_dt"] = dt
        meta["date_display"] = meta.get("display_date") or dt.strftime("%B %Y")
        meta["date_short"] = dt.strftime("%b %Y")
        meta["_body"] = body
        meta["excerpt"] = make_excerpt(body)          # ~20 words, for the post list
        meta["excerpt_long"] = make_char_excerpt(body)  # ~200 chars, for descriptions
        # The <meta>/OG description is the opening of the post itself unless a
        # post sets an explicit `summary:` override in its frontmatter.
        if not meta["summary"]:
            meta["summary"] = meta["excerpt_long"]
        posts.append(meta)
    posts.sort(key=lambda m: m["_dt"], reverse=True)
    return posts


def social_meta(m):
    """Open Graph + Twitter-card tags so posts preview nicely when shared.

    Uses a dedicated 1200x630 card at assets/img/blog/og-<slug>.jpg when one
    exists; otherwise falls back to the post's first inline image, then to the
    site portrait. og:image:width/height are only emitted for the known-size
    dedicated card.
    """
    slug = m["slug"]
    canonical = "{}/blog/{}.html".format(SITE_URL, slug)
    card_rel = "assets/img/blog/og-{}.jpg".format(slug)
    if os.path.exists(os.path.join(ROOT, card_rel)):
        img = "{}/{}".format(SITE_URL, card_rel)
        dims = ('\n  <meta property="og:image:width" content="1200">'
                '\n  <meta property="og:image:height" content="630">')
    else:
        mm = re.search(r'src="\.\./(assets/[^"]+\.(?:jpg|jpeg|png|webp))"', m["_body"])
        rel = mm.group(1) if mm else "assets/img/photo.png"
        img = "{}/{}".format(SITE_URL, rel)
        dims = ""
    t = html.escape(m["title"])
    d = html.escape(m["summary"])
    return (
        '  <link rel="canonical" href="{canon}">\n'
        '  <link rel="alternate" type="application/atom+xml" title="Anna Brežģis" href="../feed.xml">\n'
        '  <meta property="og:type" content="article">\n'
        '  <meta property="og:site_name" content="Anna Brežġis">\n'
        '  <meta property="og:title" content="{t}">\n'
        '  <meta property="og:description" content="{d}">\n'
        '  <meta property="og:url" content="{canon}">\n'
        '  <meta property="og:image" content="{img}">{dims}\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <meta name="twitter:site" content="@annabrezgis">\n'
        '  <meta name="twitter:title" content="{t}">\n'
        '  <meta name="twitter:description" content="{d}">\n'
        '  <meta name="twitter:image" content="{img}">'
    ).format(canon=canonical, t=t, d=d, img=img, dims=dims)


def get_footer():
    """Reuse the homepage footer verbatim so post pages stay in sync."""
    with open(INDEX, encoding="utf-8") as f:
        s = f.read()
    m = re.search(r'<footer class="footer".*?</footer>', s, re.S)
    return m.group(0) if m else ""


def render_posts(posts):
    os.makedirs(BLOG_DIR, exist_ok=True)
    footer = get_footer()
    md = markdown.Markdown(extensions=["extra", "smarty", "sane_lists"])
    for m in posts:
        md.reset()
        body_html = md.convert(m["_body"])
        # optional frontmatter `css: path.css, other.css` -> extra head links
        extra_css = "".join(
            '\n  <link rel="stylesheet" href="{}">'.format(html.escape(u.strip()))
            for u in m.get("css", "").split(",") if u.strip()
        )
        out = POST_TMPL.format(
            title=html.escape(m["title"]),
            summary=html.escape(m["summary"]),
            social=social_meta(m),
            extra_css=extra_css,
            fonts=FONTS,
            date_display=html.escape(m["date_display"]),
            draft_badge=' <span class="post-draft-badge">draft</span>' if m["draft"] else "",
            body=body_html,
            footer=footer,
            script=EMAIL_SCRIPT + "\n" + LIGHTBOX_SCRIPT,
        )
        with open(os.path.join(BLOG_DIR, m["slug"] + ".html"), "w", encoding="utf-8") as f:
            f.write(out)


def row(m):
    return ROW_TMPL.format(
        href="blog/" + m["slug"] + ".html",
        date_short=html.escape(m["date_short"]),
        title=html.escape(m["title"]),
        draft_tag=' <span class="draft-tag">draft</span>' if m["draft"] else "",
        summary=html.escape(m["excerpt"]),
    )


def ensure_scaffold(s):
    if "css/blog.css" not in s:
        s = s.replace(
            '<link rel="stylesheet" href="css/style.css">',
            '<link rel="stylesheet" href="css/style.css">\n'
            '  <link rel="stylesheet" href="css/blog.css">',
        )
    s = s.replace("and the things in between. Coming soon.",
                  "and the things in between.")
    if "BLOG:CARDS:START" not in s:
        s = re.sub(
            r'<div class="blog-preview">.*?</div>\s*</div>',
            '<div class="blog-preview">\n'
            '        <!-- BLOG:CARDS:START -->\n'
            '        <!-- BLOG:CARDS:END -->\n'
            '      </div>',
            s, count=1, flags=re.S,
        )
    return s


def update_index(posts):
    # The in-page Blog section IS the full blog — every post, no teaser,
    # no separate /blog/ page.
    rows = "\n".join(row(m) for m in posts)
    block = '\n        <ul class="postlist">\n' + rows + '\n        </ul>\n        '
    with open(INDEX, encoding="utf-8") as f:
        s = f.read()
    s = ensure_scaffold(s)
    s = re.sub(
        r"(<!-- BLOG:CARDS:START -->).*?(<!-- BLOG:CARDS:END -->)",
        lambda mm: mm.group(1) + block + mm.group(2),
        s, flags=re.S,
    )
    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(s)


SITEMAP = os.path.join(ROOT, "sitemap.xml")


def write_sitemap(posts):
    """sitemap.xml: the homepage plus every published (non-draft) post.
    Post lastmod is the post date; the homepage takes the newest post's date."""
    published = [m for m in posts if not m["draft"]]
    newest = max((m["_dt"] for m in published), default=datetime.now())
    urls = [(SITE_URL + "/", newest, "weekly", "1.0")]
    urls += [("{}/blog/{}.html".format(SITE_URL, m["slug"]), m["_dt"], "yearly", "0.7") for m in published]
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, dt, freq, pri in urls:
        lines += ["  <url>",
                  "    <loc>{}</loc>".format(html.escape(loc)),
                  "    <lastmod>{}</lastmod>".format(dt.strftime("%Y-%m-%d")),
                  "    <changefreq>{}</changefreq>".format(freq),
                  "    <priority>{}</priority>".format(pri),
                  "  </url>"]
    lines.append("</urlset>")
    with open(SITEMAP, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return len(urls)


FEED = os.path.join(ROOT, "feed.xml")


def write_feed(posts):
    """feed.xml: an Atom feed of every published (non-draft) post, newest first,
    with the post summary as content and the canonical URL as the entry id."""
    published = [m for m in posts if not m["draft"]]
    updated = max((m["_dt"] for m in published), default=datetime.now())
    iso = lambda dt: dt.strftime("%Y-%m-%dT00:00:00Z")
    out = ['<?xml version="1.0" encoding="utf-8"?>',
           '<feed xmlns="http://www.w3.org/2005/Atom">',
           '  <title>Anna Brežģis</title>',
           '  <subtitle>Blog: updates, essays, and stray thoughts.</subtitle>',
           '  <link href="{}/"/>'.format(SITE_URL),
           '  <link href="{}/feed.xml" rel="self"/>'.format(SITE_URL),
           '  <id>{}/</id>'.format(SITE_URL),
           '  <updated>{}</updated>'.format(iso(updated)),
           '  <author><name>Anna Brežģis</name></author>']
    for m in published:
        url = "{}/blog/{}.html".format(SITE_URL, m["slug"])
        out += ['  <entry>',
                '    <title>{}</title>'.format(html.escape(m["title"])),
                '    <link href="{}"/>'.format(url),
                '    <id>{}</id>'.format(url),
                '    <published>{}</published>'.format(iso(m["_dt"])),
                '    <updated>{}</updated>'.format(iso(m["_dt"])),
                '    <summary>{}</summary>'.format(html.escape(m["summary"])),
                '  </entry>']
    out.append('</feed>')
    with open(FEED, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    return len(published)


def main():
    posts = load_posts()
    render_posts(posts)
    update_index(posts)
    n_urls = write_sitemap(posts)
    n_feed = write_feed(posts)
    print("Wrote feed.xml ({} entries)".format(n_feed))
    print("Wrote sitemap.xml ({} URLs)".format(n_urls))
    print("Built {} post(s) + in-page blog section:".format(len(posts)))
    for m in posts:
        flag = " [draft]" if m["draft"] else ""
        print("  - {:<20} {}{}".format(m["slug"], m["date_short"], flag))


if __name__ == "__main__":
    main()
