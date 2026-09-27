/**
 * SOStudy LinkedIn feed. Reads the public company page every few hours and
 * publishes the posts as JSON for the website:
 *   { "posts": [{ id, url, date, author, text, image }], "updated": ms }
 * Posts already found are kept, so the site keeps working if LinkedIn
 * temporarily blocks a refresh.
 */
const COMPANY = 'https://www.linkedin.com/company/sostudy-lt';
const MAX_POSTS = 12;
// Optional: links to posts that should always be shown (e.g. a founder's post).
const EXTRA_POSTS = [];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function doGet() {
  const json = PropertiesService.getScriptProperties().getProperty('feed') || refresh();
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor: fetches posts and schedules a refresh every 6 hours. */
function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('refresh').timeBased().everyHours(6).create();
  Logger.log(refresh());
}

function refresh() {
  const props = PropertiesService.getScriptProperties();
  const old = JSON.parse(props.getProperty('feed') || '{"posts":[]}').posts;
  const known = {};
  old.forEach(p => { known[p.id] = p; });

  let urns = [];
  try {
    urns = (get_(COMPANY).match(/urn:li:(?:share|ugcPost):\d+/g) || []);
  } catch (e) {
    Logger.log('Company page failed: ' + e);
  }
  EXTRA_POSTS.forEach(link => {
    const m = String(link).match(/(activity|share|ugcPost)[:-](\d{15,})/);
    if (m) urns.push('urn:li:' + m[1] + ':' + m[2]);
  });

  urns.filter((u, i) => urns.indexOf(u) === i && !known[u]).forEach(urn => {
    try {
      const post = parse_(urn, get_('https://www.linkedin.com/embed/feed/update/' + urn));
      if (post.text) known[urn] = post;
    } catch (e) {
      Logger.log(urn + ' failed: ' + e);
    }
  });

  const posts = Object.keys(known).map(k => known[k]).sort((a, b) => b.date - a.date).slice(0, MAX_POSTS);
  const json = JSON.stringify({ posts: posts, updated: Date.now() });
  props.setProperty('feed', json);
  return json;
}

function get_(url) {
  const res = UrlFetchApp.fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'lt,en;q=0.8' }, muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) throw new Error('HTTP ' + res.getResponseCode());
  return res.getContentText();
}

function parse_(urn, html) {
  const meta = name => {
    const m = html.match(new RegExp('<meta[^>]+(?:property|name)="' + name + '"[^>]+content="([^"]*)"'));
    return m ? decode_(m[1]) : '';
  };
  const title = meta('og:title');
  const text = meta('og:description') || meta('description');
  return {
    id: urn,
    url: meta('og:url') || 'https://www.linkedin.com/feed/update/' + urn,
    date: Number(BigInt(urn.split(':').pop()) >> 22n),
    author: title.indexOf('|') > -1 ? title.split('|').pop().trim() : '',
    text: text.length > 260 ? text.slice(0, 257).replace(/\s+\S*$/, '') + '…' : text,
    image: meta('og:image')
  };
}

function decode_(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
