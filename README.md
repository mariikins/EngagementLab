# Engagement Lab · Build-a-Tree Event

An interactive, drag-and-drop version of the Build-a-Tree Event worksheet for the Casey Trees × GW community workshop.
Participants drag cards onto an event board (or tap them), pick what draws them to a table, roll for an event name, answer three questions, and get a mini event poster to pitch to the room.
Responses are saved privately to a Google Sheet. People who fill out the form can't see anyone else's answers.

## Files

```
index.html            the page
style.css             styles (Casey Trees palette, Sofia Pro / Outfit)
script.js             sends responses to Google Sheets
apps-script/Code.gs   paste into Google Apps Script (not used by the website itself)
assets/               put the logo files here
```

## 1. Add the logos

Put these two files in `assets/` (ask your Casey Trees contact for the official logo, and get the GW logo from GW's brand site):

- `assets/casey-trees-logo.png`
- `assets/gw-logo.png`

Transparent PNGs or SVGs work best. If you use SVG, change the file names in `index.html` to match. Until the files are added, the logo spots just stay empty.

## 2. Make the Google Sheet

1. Create a new Google Sheet, e.g. "Build-a-Tree Event Responses".
2. Go to **Extensions → Apps Script**.
3. Delete what's there and paste everything from `apps-script/Code.gs`. Save.
4. Click **Deploy → New deployment**, choose type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, allow the permissions, and copy the **Web app URL**.

"Anyone" only means anyone can *send* a response. The Sheet stays private to you and whoever you share it with.

## 3. Connect the form

Open `script.js` and paste the URL:

```js
const SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";
```

## 4. Put it online (GitHub Pages)

1. Commit and push all the files to this repo.
2. On GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. The site will be live at `https://mariikins.github.io/EngagementLab/`.

## Tips

- Test it once yourself and check that a new row shows up in the Sheet.
- If you change `Code.gs` later, go to **Deploy → Manage deployments → Edit → New version** or the changes won't apply.
- Never save responses in this repo. It's public.
