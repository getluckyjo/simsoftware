#!/usr/bin/env node
/**
 * Renders the Markdown in docs/ to branded PDFs and standalone web pages.
 * The Markdown is the source of truth — regenerate after any edit:
 *
 *   npm install && npm run docs
 *
 * Brand: Get Lucky V2 app look (getluckyapp/src/app/globals.css) — forest green,
 * lime accent, gold only for prize figures on green, Poster Gothic + Inter + Space Mono.
 *
 * Markdown conventions
 *   ---            front matter: title, kicker, subtitle, verdict, date, author, footer, layout
 *   ```stats       one tile per line: `value | label`
 *   > text         a callout (lime rule)
 *   > **Risk** …   a callout; a leading bold word becomes its label
 *
 * layout: onepager  → exactly one A4 page (the build fails if it overflows)
 * layout: report    → cover, contents, running page numbers
 */
import fs from 'node:fs'
import path from 'node:path'
import { Marked } from 'marked'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const DOCS = [
  { src: 'docs/master-strategy.md', out: 'docs/Get-Lucky-Master-Strategy' },
  { src: 'docs/feasibility-onepager.md', out: 'docs/Get-Lucky-Sim-Feasibility-Onepager' },
  { src: 'docs/research-report.md', out: 'docs/Get-Lucky-Sim-Research-Report' },
  { src: 'docs/deal-strategy.md', out: 'docs/Get-Lucky-Deal-Sequence' },
]
const WEB_DIR = path.join(ROOT, 'docs/web')

const b64 = f => fs.readFileSync(path.join(ROOT, f)).toString('base64')
const FONT = b64('brand/PosterGothicRoundATF-Heavy.woff2')
const LOCKUP = b64('brand/logo-lockup.svg')

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function parse(md) {
  const meta = {}
  const m = md.match(/^---\n([\s\S]*?)\n---\n/)
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (kv) meta[kv[1]] = kv[2].trim()
    }
    md = md.slice(m[0].length)
  }
  return { meta, body: md }
}

function render(body) {
  const toc = []
  const marked = new Marked({ gfm: true })
  marked.use({
    renderer: {
      code({ text, lang }) {
        if (lang === 'stats') {
          const tiles = text.trim().split('\n').map(l => {
            const [v, ...rest] = l.split('|')
            return `<div class="stat"><div class="stat-v">${marked.parseInline(v.trim())}</div><div class="stat-l">${marked.parseInline(rest.join('|').trim())}</div></div>`
          }).join('')
          return `<div class="stats">${tiles}</div>`
        }
        return `<pre><code>${esc(text)}</code></pre>`
      },
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const id = slug(html)
        if (depth === 2) toc.push({ id, html })
        return `<h${depth} id="${id}">${html}</h${depth}>`
      },
      blockquote({ tokens }) {
        let html = this.parser.parse(tokens)
        let label = ''
        html = html.replace(/^<p><strong>([^<]{1,28})<\/strong>\s*/, (_, l) => { label = l.replace(/[.:]$/, ''); return '<p>' })
        return `<aside class="callout">${label ? `<div class="callout-l">${label}</div>` : ''}${html}</aside>`
      },
      table(token) {
        const head = token.header.map(c => `<th${c.align ? ` style="text-align:${c.align}"` : ''}>${this.parser.parseInline(c.tokens)}</th>`).join('')
        const rows = token.rows.map(r => `<tr>${r.map(c => `<td${c.align ? ` style="text-align:${c.align}"` : ''}>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('')
        return `<div class="tbl"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
      },
      link({ href, tokens }) {
        return `<a href="${esc(href)}" target="_blank" rel="noopener">${this.parser.parseInline(tokens)}</a>`
      },
    },
  })
  return { html: marked.parse(body), toc }
}

/* ---------- styles ---------- */

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap">
<style>@font-face{font-family:'Poster Gothic';src:url(data:font/woff2;base64,${FONT}) format('woff2');font-weight:800;font-display:block}</style>`

// Tokens mirror getluckyapp/src/app/globals.css (V2).
const TOKENS = `
:root{
  --green:#345231; --green-dark:#1e3120; --green-mid:#4a7a3d; --app-black:#0d160f;
  --lime:#d6fb4b; --lime-dark:#c2e83a; --gold:#c9a94e; --gold-light:#e8d48b;
  --logo-cream:#f5eede; --red:#e40014;
  --bg:#ebedea; --card:#ffffff; --line:#d3d8d0; --ink:#1a1a1a; --ink-2:#4a5048; --head:#1e3120;
  --tbl-head:#345231; --tbl-head-ink:#ffffff; --zebra:#f5f6f3; --callout:#f4fbe0; --code:#e2e6df;
  --display:'Poster Gothic',Impact,'Arial Black',sans-serif;
  --body:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;
  --mono:'Space Mono',ui-monospace,Menlo,monospace;
}`
const DARK = `
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;
  --bg:#0d160f; --card:#16261a; --line:#2c4230; --ink:#e6eae3; --ink-2:#a9b5a6; --head:#ebedea;
  --tbl-head:#1e3120; --tbl-head-ink:#d6fb4b; --zebra:#132117; --callout:#1c2c14; --code:#1e3120}}
:root[data-theme="dark"]{color-scheme:dark;
  --bg:#0d160f; --card:#16261a; --line:#2c4230; --ink:#e6eae3; --ink-2:#a9b5a6; --head:#ebedea;
  --tbl-head:#1e3120; --tbl-head-ink:#d6fb4b; --zebra:#132117; --callout:#1c2c14; --code:#1e3120}`

const BASE = `
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);line-height:1.55;
  -webkit-font-smoothing:antialiased;font-feature-settings:'cv11','ss01'}
h1,h2,h3{font-family:var(--display);font-weight:800;text-transform:uppercase;color:var(--head);
  letter-spacing:-.01em;line-height:.98;text-wrap:balance;margin:0}
h3{font-family:var(--body);text-transform:none;font-weight:700;letter-spacing:0;line-height:1.3}
p{margin:0 0 .7em}
strong{font-weight:650;color:var(--head)}
a{color:inherit;text-decoration-color:var(--green-mid);text-underline-offset:2px}
ul,ol{margin:0 0 .8em;padding-left:1.25em}
li{margin:.18em 0}
li::marker{color:var(--green-mid)}
code{font-family:var(--mono);font-size:.86em;background:var(--code);padding:.05em .35em;border-radius:4px}
pre{background:var(--code);padding:12px 14px;border-radius:10px;overflow-x:auto;font-size:.82em}
pre code{background:none;padding:0}
.tbl{overflow-x:auto;margin:.4em 0 1.1em;border-radius:12px;border:1px solid var(--line);background:var(--card)}
table{border-collapse:collapse;width:100%;font-size:.86em;font-variant-numeric:tabular-nums}
th{background:var(--tbl-head);color:var(--tbl-head-ink);text-align:left;font-weight:600;padding:8px 11px;
  font-size:.86em;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
td{padding:7px 11px;border-top:1px solid var(--line);vertical-align:top}
tbody tr:nth-child(even) td{background:var(--zebra)}
td strong{color:inherit}
.callout{background:var(--callout);border-left:4px solid var(--lime-dark);border-radius:0 12px 12px 0;
  padding:11px 15px 4px;margin:.3em 0 1.1em}
.callout-l{font-family:var(--display);font-size:.95em;text-transform:uppercase;color:var(--green);margin-bottom:2px;letter-spacing:.02em}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:.3em 0 1.2em}
.stat{background:var(--green-dark);border-radius:12px;padding:12px 14px 11px;color:#ebedea}
.stat-v{font-family:var(--display);font-size:1.75em;line-height:1;color:var(--gold);font-variant-numeric:tabular-nums}
.stat-v strong{color:var(--lime);font-weight:inherit}
.stat-l{font-size:.74em;line-height:1.35;margin-top:6px;color:#cfd6cb}
.stat-l strong{color:#fff}
.chip{display:inline-block;background:var(--lime);color:var(--green);font-family:var(--display);text-transform:uppercase;
  padding:6px 12px 5px;border-radius:6px;box-shadow:3px 4px 0 var(--app-black);letter-spacing:.02em;line-height:1}
.eyebrow{font-size:.72em;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--lime)}
`

/* ---------- one-pager ---------- */

function onepagerHTML({ meta, html }, { web }) {
  const css = `
${TOKENS}${web ? DARK : ''}${BASE}
${web ? '' : '@page{size:A4;margin:0} html,body{width:210mm}'}
.sheet{${web ? 'max-width:60rem;margin:0 auto;padding-block:28px 40px;padding-inline:16px' : 'width:210mm;height:297mm;overflow:hidden;display:flex;flex-direction:column'};font-size:${web ? '15px' : '8.35pt'}}
.hero{background:var(--green-dark);color:#ebedea;display:grid;grid-template-columns:${web ? 'auto 1fr' : '92px 1fr'};gap:${web ? '22px' : '16px'};align-items:center;
  padding:${web ? '26px' : '10mm 13mm 7mm'};${web ? 'border-radius:18px' : 'flex:none'};position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;
  border:28px solid rgba(214,251,75,.07)}
.hero img{width:${web ? '120px' : '92px'};display:block}
.hero h1{color:#fff;font-size:${web ? 'clamp(28px,5vw,44px)' : '25pt'};margin:5px 0 6px}
.hero .sub{color:#cfd6cb;font-size:1.08em;max-width:52ch;margin:0}
.verdict{display:flex;gap:12px;align-items:center;margin-top:${web ? '14px' : '9px'};flex-wrap:wrap}
.verdict span:last-child{color:#ebedea;font-weight:500;font-size:.98em}
.content{${web ? 'margin-top:20px' : 'padding:6mm 13mm 0;flex:1;min-height:0;overflow:hidden'}}
.content .stats{grid-template-columns:repeat(${web ? 'auto-fit,minmax(150px,1fr)' : '5,1fr'});margin-bottom:${web ? '18px' : '4.5mm'}}
.content .stat-v{font-size:${web ? '1.9em' : '1.7em'};white-space:nowrap}
.content .stat{padding:${web ? '12px 14px 11px' : '9px 11px 8px'}}
.cols{${web ? 'columns:2 22rem;column-gap:28px' : 'columns:2;column-gap:7mm'}}
.cols h2{font-size:${web ? '1.35em' : '1.42em'};margin:0 0 4px;padding-top:2px;break-after:avoid;display:flex;gap:7px;align-items:center}
.cols h2::before{content:'';width:10px;height:10px;background:var(--lime);box-shadow:2px 2px 0 var(--green);border-radius:2px;flex:none}
.cols section{break-inside:avoid;margin-bottom:${web ? '18px' : '2.6mm'}}
.cols p,.cols li{color:var(--ink)}
.cols ul{margin-bottom:.3em}
.cols .tbl{margin:.2em 0 .4em}
.cols table{font-size:.93em}
.cols th{padding:4px 7px}.cols td{padding:3px 7px}
.foot{${web ? 'margin-top:12px;border-radius:14px' : 'margin:0 13mm 8mm'};background:var(--green);color:#ebedea;padding:${web ? '14px 18px' : '8px 12px'};
  display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:.9em;flex-wrap:wrap;${web ? '' : 'border-radius:10px;flex:none'}}
.foot b{color:var(--lime);font-weight:600}
@media (max-width:560px){.hero{grid-template-columns:1fr}.hero img{width:96px}}
`
  // Group each h2 + following nodes into a <section> so columns never split them.
  const grouped = html.replace(/(<h2[\s\S]*?)(?=<h2|$)/g, '<section>$1</section>')
  let stats = '', rest = grouped
  const si = grouped.indexOf('<div class="stats">')
  if (si !== -1 && si < grouped.indexOf('<section>')) {
    const end = grouped.indexOf('<section>')
    stats = grouped.slice(si, end); rest = grouped.slice(0, si) + grouped.slice(end)
  }
  return page(meta, css, `
<main class="sheet">
  <header class="hero">
    <img src="data:image/svg+xml;base64,${LOCKUP}" alt="Get Lucky Hole-in-One Challenge">
    <div>
      <div class="eyebrow">${esc(meta.kicker || '')}</div>
      <h1>${esc(meta.title)}</h1>
      <p class="sub">${meta.subtitle || ''}</p>
      ${meta.verdict ? `<div class="verdict"><span class="chip">${esc(meta.verdictLabel || 'Verdict: Go')}</span><span>${meta.verdict}</span></div>` : ''}
    </div>
  </header>
  <div class="content">
    ${stats}
    <div class="cols">${rest}</div>
  </div>
  <footer class="foot"><span>${meta.footer || ''}</span><span><b>${esc(meta.date || '')}</b></span></footer>
</main>`, web)
}

/* ---------- report ---------- */

function reportHTML({ meta, html, toc }, { web }) {
  const css = `
${TOKENS}${web ? DARK : ''}${BASE}
${web ? '' : '@page{size:A4;margin:16mm 16mm 18mm} @page:first{margin:0} html{font-size:9.6pt}'}
body{${web ? 'font-size:16px' : ''}}
.cover{background:var(--green-dark);color:#ebedea;position:relative;overflow:hidden;
  ${web ? 'border-radius:0 0 22px 22px;padding:40px 16px 44px' : 'height:297mm;width:210mm;padding:22mm 18mm;display:flex;flex-direction:column;break-after:page'}}
.cover-in{${web ? 'max-width:52rem;margin:0 auto' : 'display:flex;flex-direction:column;height:100%'}}
.cover::before{content:'';position:absolute;right:-120px;bottom:-120px;width:520px;height:520px;border-radius:50%;
  border:60px solid rgba(214,251,75,.06)}
.cover::after{content:'';position:absolute;right:40px;bottom:40px;width:190px;height:190px;border-radius:50%;
  border:18px solid rgba(214,251,75,.08)}
.cover img{width:${web ? '130px' : '150px'};display:block;margin-bottom:${web ? '26px' : '26mm'}}
.cover h1{color:#fff;font-size:${web ? 'clamp(34px,7vw,64px)' : '46pt'};line-height:.92;margin:10px 0 16px;max-width:14ch}
.cover .sub{font-size:${web ? '1.12em' : '13pt'};color:#cfd6cb;max-width:44ch;line-height:1.45}
.cover .chip{margin-top:18px;font-size:${web ? '1em' : '12pt'}}
.meta{${web ? 'margin-top:30px' : 'margin-top:auto'};display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;
  border-top:1px solid rgba(235,237,234,.18);padding-top:14px;font-size:.86em;position:relative;z-index:1}
.meta div span{display:block;font-size:.78em;letter-spacing:.14em;text-transform:uppercase;color:var(--lime);font-weight:700;margin-bottom:2px}
.wrap{${web ? 'max-width:52rem;margin:0 auto;padding-inline:16px;padding-block:28px 60px' : ''}}
.toc{${web ? 'background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin-bottom:34px' : 'break-after:page'}}
.toc h2{font-size:${web ? '1.5em' : '22pt'};margin-bottom:12px}
.toc ol{list-style:none;padding:0;margin:0;columns:${web ? '2 18rem' : '1'};column-gap:30px;counter-reset:t}
.toc li{counter-increment:t;display:flex;gap:10px;padding:${web ? '5px' : '7px'} 0;border-bottom:1px solid var(--line);break-inside:avoid;margin:0}
.toc li::before{content:counter(t,decimal-leading-zero);font-family:var(--mono);color:var(--green-mid);font-size:.9em;min-width:1.6em}
.toc a{text-decoration:none;font-weight:500}
article h2{font-size:${web ? '1.9em' : '19pt'};margin:${web ? '46px' : '11mm'} 0 12px;
  display:flex;gap:10px;align-items:center;break-after:avoid}
article h2::before{content:'';width:14px;height:14px;background:var(--lime);box-shadow:3px 3px 0 var(--green);border-radius:3px;flex:none}
article h2:first-child{margin-top:0}
article h3{font-size:1.08em;margin:1.3em 0 .4em;color:var(--green);break-after:avoid}
${web ? '' : 'body{background:#fff} .wrap .tbl{background:#fff;overflow:visible} .wrap th{white-space:normal} .wrap table:has(th:nth-child(5)){font-size:.78em} .wrap table:has(th:nth-child(5)) td,.wrap table:has(th:nth-child(5)) th{padding:6px 7px} .stats{grid-template-columns:repeat(5,1fr);gap:8px} .stat-v{font-size:1.45em;white-space:nowrap} .stat{padding:10px 11px 9px}'}
article p,article li{max-width:${web ? '70ch' : 'none'}}
article .tbl,article .callout,article .stats{break-inside:avoid}
article tr{break-inside:avoid}
.sources ol,.sources ul{font-size:.82em;word-break:break-word}
@media (max-width:560px){.cover h1{max-width:none}}
`
  const tocHTML = `<nav class="toc"><h2>Contents</h2><ol>${toc.map(t => `<li><a href="#${t.id}">${t.html}</a></li>`).join('')}</ol></nav>`
  const metaHTML = (meta.metaRows || '').split(';').filter(Boolean).map(r => {
    const [k, v] = r.split('=')
    return `<div><span>${esc(k.trim())}</span>${esc(v.trim())}</div>`
  }).join('')
  return page(meta, css, `
<header class="cover"><div class="cover-in">
  <img src="data:image/svg+xml;base64,${LOCKUP}" alt="Get Lucky Hole-in-One Challenge">
  <div class="eyebrow">${esc(meta.kicker || '')}</div>
  <h1>${esc(meta.title)}</h1>
  <p class="sub">${meta.subtitle || ''}</p>
  ${meta.verdictLabel ? `<div><span class="chip">${esc(meta.verdictLabel)}</span></div>` : ''}
  <div class="meta">${metaHTML}</div>
</div></header>
<div class="wrap">
  ${tocHTML}
  <article>${html}</article>
</div>`, web)
}

function page(meta, css, body, web) {
  const head = `<title>${esc(meta.webTitle || meta.title)}</title>\n${FONTS}\n<style>${css}</style>`
  if (web) return `${head}\n${body}\n` // artifact skeleton supplies html/head/body
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`
}

/* ---------- build ---------- */

fs.mkdirSync(WEB_DIR, { recursive: true })
const browser = await chromium.launch()
for (const d of DOCS) {
  const { meta, body } = parse(fs.readFileSync(path.join(ROOT, d.src), 'utf8'))
  const { html, toc } = render(body)
  const doc = { meta, html, toc }
  const build = meta.layout === 'onepager' ? onepagerHTML : reportHTML

  const printHTML = build(doc, { web: false })
  const webHTML = build(doc, { web: true })
  const webPath = path.join(WEB_DIR, path.basename(d.out) + '.html')
  fs.writeFileSync(webPath, webHTML)

  const tmp = path.join(ROOT, d.out + '.print.html')
  fs.writeFileSync(tmp, printHTML)
  const p = await browser.newPage()
  await p.goto('file://' + tmp, { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)

  if (meta.layout === 'onepager') {
    const over = await p.evaluate(() => {
      const s = document.querySelector('.content')
      return s.scrollHeight - s.clientHeight
    })
    if (over > 0) { await browser.close(); if (!process.env.KEEP_PRINT_HTML) fs.unlinkSync(tmp); throw new Error(`${d.src}: one-pager overflows A4 by ${over}px — cut copy`) }
    await p.pdf({ path: path.join(ROOT, d.out + '.pdf'), format: 'A4', printBackground: true, pageRanges: '1' })
  } else {
    await p.pdf({
      path: path.join(ROOT, d.out + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;font:600 7pt Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4a7a3d;padding:0 16mm;display:flex;justify-content:space-between"><span>Get Lucky · Hole-in-One Sim</span><span>${esc(meta.short || meta.title)}</span></div>`,
      footerTemplate: `<div style="width:100%;font:500 7pt Inter,Arial,sans-serif;color:#6b7368;padding:0 16mm;display:flex;justify-content:space-between"><span>Confidential · ${esc(meta.date || '')}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    })
  }
  await p.close()
  if (!process.env.KEEP_PRINT_HTML) fs.unlinkSync(tmp)
  console.log(`✓ ${d.out}.pdf  +  docs/web/${path.basename(webPath)}`)
}
await browser.close()
