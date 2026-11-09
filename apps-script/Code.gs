// ===== Casey Trees × GW · saves form responses to this Google Sheet =====
// Paste this whole file into Extensions → Apps Script in your Google Sheet.
// Only people you share the Sheet with can see responses.

const SHEET_NAME = "Responses";

const COLUMNS = [
  "timestamp",
  "names",
  "where", "where_other",
  "when", "when_other",
  "what", "what_other",
  "who", "who_other",
  "how", "how_other",
  "drives", "drives_other",
  "event_name",
  "q_why", "q_signup", "q_walkaway",
];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // spam trap: the hidden "website" field should always be empty
  if (p.website) return ContentService.createTextOutput("ok");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    }

    const row = COLUMNS.map((col) =>
      col === "timestamp" ? new Date() : String(p[col] || "").slice(0, 2000)
    );
    sheet.appendRow(row);

    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the Web App URL in a browser to check it's live.
function doGet() {
  return ContentService.createTextOutput("Build-a-Tree Event form endpoint is running.");
}
