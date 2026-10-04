# SOStudy

Static site for [sostudy.lt](https://sostudy.lt). Plain HTML, CSS and JS with no build step. Upload the folder contents to Hostinger's `public_html`.

## Structure

```
index.html              Home
apie-mus/               About: story, team, articles, LinkedIn
reikia-pagalbos/        Help request form + live availability
kontaktai/              Contacts
privatumo-politika/     Privacy policy
naudojimosi-taisykles/  Terms of service
send.php                Mail handler (photo attached, nothing stored)
assets/js/config.js     Endpoints and links (edit this first)
apps-script/            Google Calendar availability service
apps-script/linkedin/   LinkedIn feed service
assets/data/            Saved copy of LinkedIn posts (fallback)
```

## Setup

1. **Form:** set the founders' emails in `send.php` (`$TO`). To use Formspree instead, set `formEndpoint` in `assets/js/config.js` to the Formspree URL.
2. **Availability:** follow `apps-script/README.md`, then put the `/exec` URLs into `assets/js/config.local.js` (copy `config.local.example.js`). That file is ignored by git, so upload it to Hostinger by hand once.
3. **LinkedIn posts:** follow `apps-script/linkedin/README.md` and paste the `/exec` URL into `linkedinFeed` in `assets/js/config.js`. New posts then appear automatically.
4. **Legal pages:** fill in the highlighted placeholders (company details, video platform, email provider, retention period).

Fonts and scripts are self-hosted, so the only third-party requests are the Google availability check, the LinkedIn feed and LinkedIn post images.

## Upload to Hostinger

Needs a Hostinger **web hosting** plan (not Website Builder) with sostudy.lt attached.

1. hPanel → **Security → SSL**: make sure SSL is active for sostudy.lt (the site redirects to https).
2. hPanel → **Files → File Manager** → open `public_html` and delete the old files there.
3. Upload these files and folders (or one zip of them, then right-click → Extract):
   `.htaccess`, `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `send.php`, `assets/` (including `assets/js/config.local.js`), `apie-mus/`, `kontaktai/`, `reikia-pagalbos/`, `privatumo-politika/`, `naudojimosi-taisykles/`.
   Do not upload `README.md`, `apps-script/` or anything starting with a dot other than `.htaccess`.
4. Send a test message with a photo from both forms. If `send.php` cannot send, the forms fall back to FormSubmit automatically.
5. Google Search Console → add sostudy.lt → submit `https://sostudy.lt/sitemap.xml`.

## Local preview

```
npx serve .
```
