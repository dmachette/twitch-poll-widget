# Twitch Poll Widget 🎯

A **universal Twitch poll overlay** for streamers.  
Works on **OBS, Media Stream Studio Plus, StreamElements, and any browser source**.  
Connects to Twitch chat anonymously or with your account for sending/receiving messages.

---

## Features

- ✅ Connects to Twitch chat via **TMI.js** (local copy included)  
- ✅ Status indicator with **red/green dot**  
- ✅ Shows connected channel or anonymous mode  
- ✅ Poll commands via chat (e.g., `!poll Your Question?`)  
- ✅ Fully static HTML/CSS/JS — no server required  
- ✅ Works across all streaming software  

---

## Folder Structure
```
twitch-poll-widget/
│
├── public/
│   ├── tmi.min.js               # local TMI.js library
│   ├── style.css                # widget styles
│   ├── widget.html              # the actual overlay file
│   └── poll.js                  # your main poll widget logic
│
├── .env                         # (NOT committed to GitHub)
├── .gitignore
├── package.json
├── vercel.json
└── README.md

```

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/dmachette/twitch-poll-widget.git
cd twitch-poll-widge

```

2. Add your Twitch credentials (optional)
Create a .env file locally (do not commit this file):

```ini
TWITCH_USERNAME=your_twitch_username
TWITCH_OAUTH_TOKEN=oauth:your_secret_token_here
TWITCH_CHANNEL=your_channel_name
```
If no token is provided, the widget connects anonymously.

---

3. Vercel Deployment (Recommended)

1.Go to https://vercel.com/ and log in with GitHub

2.Import this repo → select your project

3.Under Settings → Environment Variables, add the same .env variables

4.Click Deploy

5.Use the generated URL in your streaming software:

```arduino
https://your-vercel-url/public/widget.html

```
---

4. Local Testing
If you want to test locally:

```bash
npm install -g vercel   # optional, if you don’t have vercel CLI
vercel dev
```
Open the URL provided by Vercel CLI in your browser.

Usage
Poll Commands in Chat
*Start a poll:

```csharp

!poll What is your favorite color?
```
*Votes will be tallied (future versions can include live bars).

Status Indicator
*  🔴 Red = Disconnected

*  🟢 Green = Connected

*  Shows username if logged in or anonymous if no token provided

Notes
* Keep your OAuth token secure — never commit .env to GitHub

* The widget is fully static, so it works anywhere a browser overlay is supported

* Designed to be modular — add features like live vote bars, countdown timers, or multiple polls easily

MIT License © 2025

