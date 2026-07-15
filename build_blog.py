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

EXCERPT_WORDS = 20  # how many leading words of each post show in the list

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:'
         'ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;'
         '1,8..60,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">')

POST_TMPL = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Anna Brežġis</title>
  <meta name="description" content="{summary}">
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

# Inline email handler for post pages — same copy-to-clipboard behavior as the
# homepage, without pulling in the homepage's section-nav logic (which would
# hijack the post pages' real nav links).
EMAIL_SCRIPT = """  <script>
    (function () {
      function copy(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; });
        }
        try {
          var ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          var ok = document.execCommand('copy');
          document.body.removeChild(ta);
          return Promise.resolve(ok);
        } catch (err) { return Promise.resolve(false); }
      }
      window.revealEmail = function (e) {
        e.preventDefault();
        var addr = 'anna' + '@' + 'brezgis.com';
        var clicked = e.currentTarget;
        var label = clicked.querySelector('#email-text') || clicked;
        copy(addr).then(function (ok) {
          clicked.style.cursor = 'text';
          label.textContent = ok ? 'Copied \\u2713' : addr;
          if (ok) window.setTimeout(function () { label.textContent = addr; }, 1100);
        });
      };
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
        meta["excerpt"] = make_excerpt(body)
        # posts don't carry hand-written summaries; the preview everywhere is
        # the opening words of the text itself (summary: stays as an override
        # for the <meta name=description> tag only)
        if not meta["summary"]:
            meta["summary"] = meta["excerpt"]
        posts.append(meta)
    posts.sort(key=lambda m: m["_dt"], reverse=True)
    return posts


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


def main():
    posts = load_posts()
    render_posts(posts)
    update_index(posts)
    print("Built {} post(s) + in-page blog section:".format(len(posts)))
    for m in posts:
        flag = " [draft]" if m["draft"] else ""
        print("  - {:<20} {}{}".format(m["slug"], m["date_short"], flag))


if __name__ == "__main__":
    main()
