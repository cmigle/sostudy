# Availability service (Google Apps Script)

Each founder sets this up once in **their own** Google account. It reads every calendar they own (all sub-calendars) and publishes only free time windows. Event titles and details never leave Google.

1. Go to <https://script.google.com> → **New project**, name it `SOStudy availability`.
2. Paste `Code.gs` into the editor.
3. **Project settings** (gear) → tick *Show "appsscript.json"* → paste `appsscript.json` into it.
4. Edit `CONFIG.hours` in `Code.gs` to the hours you are willing to help.
5. Select `test` → **Run** → allow access. The log shows your free windows.
6. **Deploy → New deployment → Web app**: *Execute as: Me*, *Who has access: Anyone* → Deploy.
7. Copy the URL ending in `/exec` and add it to `calendarEndpoints` in `assets/js/config.js`:

```js
calendarEndpoints: [
  "https://script.google.com/macros/s/AKfy...evelina.../exec",
  "https://script.google.com/macros/s/AKfy...aiste.../exec"
],
```

Notes
- Events marked **Free** ("Show as: Available") don't block time. Use that for reminders.
- After editing `Code.gs`, choose **Deploy → Manage deployments → Edit → New version** so the URL keeps working.
- To include a calendar you don't own (e.g. a shared university timetable), add its ID to `extraCalendarIds`.
- Preview the widget without setup: `/reikia-pagalbos/?demo` or `?demo=busy`.
