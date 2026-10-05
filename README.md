# SOStudy

Static site for [sostudy.lt](https://sostudy.lt). Plain HTML, CSS and JS with no build step. Upload the folder contents to Hostinger's `public_html`.

## Structure

```
index.html              Home
apie-mus/               About: story, team, articles, LinkedIn
reikia-pagalbos/        Help request form + live availability
kontaktai/              Contacts
send.php                Mail handler (photo attached, nothing stored)
assets/js/config.js     Endpoints and links (edit this first)
apps-script/            Google Calendar availability service
```

## Setup

1. **Form:** set the founders' emails in `send.php` (`$TO`). To use Formspree instead, set `formEndpoint` in `assets/js/config.js` to the Formspree URL.
2. **Availability:** follow `apps-script/README.md`, then paste the `/exec` URLs into `calendarEndpoints` in `assets/js/config.js`.
3. **LinkedIn:** add the company page URL and post URNs to `assets/js/config.js`.

## Local preview

```
npx serve .
```
