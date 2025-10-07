# MACHETTE SQUAD Twitch Poll Widget (v5.6.1)

Deploy to Vercel. Files in repo:

- api/get-twitch-channel.js
- api/get-twitch-token.js
- api/get-build.js
- api/update-build.js
- public/widget.html
- public/style.css
- public/poll.js
- public/loader-tmi.js
- (optional) public/tmi.min.js

## Vercel Environment Variables
- TWITCH_CHANNEL= TWITCH NAME 
- TWITCH_OAUTH_TOKEN=oauth:...
- TWITCH_CLIENT_ID=...

## Usage
- Deploy to Vercel (push to GitHub and import project).
- Overlay URL: `https://<your-vercel-domain>/public/widget.html` (or `/widget.html` depending on Vercel root)
- Start poll in chat (must be mod/broadcaster): `!startpoll cats dogs birds`
- Vote: `!vote 1`, `!vote 2`, etc.
- End: `!endpoll`
- Results: `!results`

## Notes
- loader-tmi.js will use `public/tmi.min.js` if present; otherwise it loads the CDN.
- All secrets are read from Vercel environment variables.
