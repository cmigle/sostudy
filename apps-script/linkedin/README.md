# LinkedIn feed (Google Apps Script)

Shows the newest SOStudy LinkedIn posts on the About page without any manual work. Set up once by either founder.

1. Go to <https://script.google.com> → **New project**, name it `SOStudy LinkedIn`.
2. Paste `Code.gs` into the editor.
3. Select `setup` → **Run** → allow access. The log shows the posts found. This also schedules a refresh every 6 hours.
4. **Deploy → New deployment → Web app**: *Execute as: Me*, *Who has access: Anyone* → Deploy.
5. Copy the URL ending in `/exec` into `linkedinFeed` in `assets/js/config.js`.

Notes
- New company posts appear on the site within 6 hours.
- To also show a post from a founder's own profile, paste its link into `EXTRA_POSTS` and run `refresh`.
- LinkedIn has no free official API for this, so the script reads the public company page. If LinkedIn blocks a refresh, the posts already found stay on the site.
- If the feed is not set up or not reachable, the site shows the copy saved in `assets/data/linkedin.json`.
