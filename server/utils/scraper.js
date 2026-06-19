const articleCache = {};

const bezDiakritiky = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

async function stiahni(url, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 CestaPodnikatela' } });
    const t = await r.text();
    clearTimeout(to);
    return t;
  } catch (e) { clearTimeout(to); return ''; }
}

function vsetkyClankove(html) {
  const re = /href="(\/[a-z0-9-]+\/[a-z0-9-]+)"/g;
  const seen = new Set(); const out = []; let m;
  while ((m = re.exec(html))) {
    const p = m[1];
    if (seen.has(p)) continue;
    seen.add(p);
    if (/^\/(o-nas|kontakt|reklama|registracia|prihlasenie|cookies|ochrana-osobnych|vyhladavanie|autori|temy|kategorie|sekcie|spravy|newsletter)\b/.test(p)) continue;
    out.push(p);
  }
  return out;
}

function htmlNaText(html) {
  const am = html.match(/<article[\s\S]*?<\/article>/i);
  let t = (am ? am[0] : html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return t.replace(/\s+/g, ' ').trim();
}

function titulZHtml(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/\s*\|\s*Podnikajte\.sk.*/i, '').trim() : 'Článok – podnikajte.sk';
}

async function najdiRealnyClanok(moment) {
  if (articleCache[moment.id]) return articleCache[moment.id];
  const dopyt = moment.article.title;
  const searchUrl = `https://www.podnikajte.sk/vyhladavanie?q=${encodeURIComponent(dopyt)}`;
  const kws = bezDiakritiky(dopyt.toLowerCase()).split(/[^a-z0-9]+/).filter(w => w.length >= 5).map(w => w.slice(0, 6));
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4500);
    const r = await fetch(searchUrl, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 CestaPodnikatela' } });
    clearTimeout(to);
    const html = await r.text();
    const re = /href="(\/[a-z0-9-]+\/[a-z0-9-]+)"/g;
    let m, prveDvojsegment = null, najlepsi = null;
    const videne = new Set();
    while ((m = re.exec(html))) {
      const p = m[1];
      if (videne.has(p)) continue;
      videne.add(p);
      if (/^\/(o-nas|kontakt|reklama|registracia|prihlasenie|cookies|ochrana-osobnych|vyhladavanie|autori|temy|kategorie)\b/.test(p)) continue;
      if (!prveDvojsegment) prveDvojsegment = p;
      if (kws.some(k => p.includes(k))) { najlepsi = p; break; }
    }
    const cesta = najlepsi || prveDvojsegment;
    const finalUrl = cesta ? 'https://www.podnikajte.sk' + cesta : searchUrl;
    articleCache[moment.id] = finalUrl;
    return finalUrl;
  } catch (e) {
    return searchUrl;
  }
}

async function hladajNaPodnikajte(dopyt) {
  const searchUrl = `https://www.podnikajte.sk/vyhladavanie?q=${encodeURIComponent(dopyt)}`;
  const shtml = await stiahni(searchUrl, 5000);
  const kws = bezDiakritiky(dopyt.toLowerCase()).split(/[^a-z0-9]+/).filter(w => w.length >= 5).map(w => w.slice(0, 6));
  const vsetky = vsetkyClankove(shtml);
  const skore = p => kws.reduce((n, k) => n + (p.includes(k) ? 1 : 0), 0);
  const zoradene = vsetky.map(p => ({ p, s: skore(p) })).sort((a, b) => b.s - a.s);
  let cesty = zoradene.filter(x => x.s > 0).slice(0, 3).map(x => x.p);
  if (!cesty.length) cesty = vsetky.slice(0, 3);
  if (!cesty.length) return { context: '', sources: [], searchUrl };
  const stranky = await Promise.all(cesty.map(p => stiahni('https://www.podnikajte.sk' + p, 5000)));
  const sources = []; let context = '';
  stranky.forEach((ahtml, i) => {
    if (!ahtml) return;
    const url = 'https://www.podnikajte.sk' + cesty[i];
    const title = titulZHtml(ahtml);
    const text = htmlNaText(ahtml).slice(0, 1600);
    if (text.length < 120) return;
    sources.push({ title, url });
    context += `\n=== Zdroj ${sources.length}: ${title} (${url}) ===\n${text}\n`;
  });
  return { context, sources, searchUrl };
}

module.exports = {
  bezDiakritiky,
  stiahni,
  najdiRealnyClanok,
  hladajNaPodnikajte
};
