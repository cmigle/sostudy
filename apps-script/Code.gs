/**
 * SOStudy availability. Returns only free windows, never event details:
 *   { "free": [[startMs, endMs], ...], "generated": ms }
 * A window = working hours minus busy time across ALL of your own calendars.
 */
const CONFIG = {
  days: 7,            // how far ahead to look
  minMinutes: 15,     // ignore free gaps shorter than this
  cacheSeconds: 120,  // calendars are re-read at most every 2 min
  // When you are willing to help, per weekday (0 = Sunday). null = day off.
  hours: {
    0: null,
    1: ['15:00', '21:00'],
    2: ['15:00', '21:00'],
    3: ['15:00', '21:00'],
    4: ['15:00', '21:00'],
    5: ['15:00', '20:00'],
    6: ['10:00', '14:00']
  },
  // Extra calendars to include that you do not own (IDs from calendar settings).
  extraCalendarIds: []
};

function doGet() {
  const cache = CacheService.getScriptCache();
  let json = cache.get('free');
  if (!json) {
    json = JSON.stringify({ free: freeWindows_(), generated: Date.now() });
    cache.put('free', json, CONFIG.cacheSeconds);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function freeWindows_() {
  const now = new Date();
  const until = new Date(now.getTime() + CONFIG.days * 864e5);

  const ids = CalendarApp.getAllOwnedCalendars().map(c => c.getId()).concat(CONFIG.extraCalendarIds);
  const res = Calendar.Freebusy.query({
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    items: ids.map(id => ({ id: id }))
  });
  let busy = [];
  Object.keys(res.calendars).forEach(id => {
    (res.calendars[id].busy || []).forEach(b => busy.push([Date.parse(b.start), Date.parse(b.end)]));
  });
  busy = merge_(busy);

  const free = [];
  const min = CONFIG.minMinutes * 6e4;
  for (let d = 0; d <= CONFIG.days; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const h = CONFIG.hours[day.getDay()];
    if (!h) continue;
    let start = at_(day, h[0]), end = at_(day, h[1]);
    start = Math.max(start, now.getTime());
    if (end - start < min) continue;
    // subtract busy blocks
    let cursor = start;
    busy.forEach(b => {
      if (b[1] <= cursor || b[0] >= end) return;
      if (b[0] - cursor >= min) free.push([cursor, b[0]]);
      cursor = Math.max(cursor, b[1]);
    });
    if (end - cursor >= min) free.push([cursor, end]);
  }
  return free;
}

function at_(day, hhmm) {
  const p = hhmm.split(':');
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), +p[0], +p[1]).getTime();
}

function merge_(list) {
  list.sort((a, b) => a[0] - b[0]);
  const out = [];
  list.forEach(i => {
    const last = out[out.length - 1];
    if (last && i[0] <= last[1]) last[1] = Math.max(last[1], i[1]);
    else out.push(i.slice());
  });
  return out;
}

/** Run once from the editor to check the output and grant permissions. */
function test() {
  Logger.log(JSON.stringify(freeWindows_().map(w => [new Date(w[0]).toString(), new Date(w[1]).toString()]), null, 1));
}
