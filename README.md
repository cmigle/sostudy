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
```

## Setup

1. **Form:** set the founders' emails in `send.php` (`$TO`). To use Formspree instead, set `formEndpoint` in `assets/js/config.js` to the Formspree URL.
2. **Availability:** follow `apps-script/README.md`, then paste the `/exec` URLs into `calendarEndpoints` in `assets/js/config.js`.
3. **Social:** check the LinkedIn and Instagram URLs in `assets/js/config.js` and add LinkedIn post URNs to show posts on the About page.
4. **Legal pages:** fill in the highlighted placeholders (company details, video platform, email provider, retention period).

Fonts and scripts are self-hosted, so the only third-party requests are the Google availability check and LinkedIn posts (loaded on click).

## Local preview

```
npx serve .
```
