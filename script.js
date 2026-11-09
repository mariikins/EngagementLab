// ===== Casey Trees × GW · Build-a-Tree Event =====
//
// 1. Follow README.md to make your Google Sheet + Apps Script.
// 2. Paste the Web App URL between the quotes below.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw6B38rUO2mgNLkMSbYXnH6e3152I7EWGAMljlv6hkFfc9dI8Ie7spFhlSlCW2f95nz7Q/exec";

/* ---------------- content ---------------- */

const CATS = [
  { key: "where", label: "Where",        color: "var(--c-where)",
    cards: ["Farmers market", "Library", "Block party", "Community center", "School pickup", "Online"] },
  { key: "when",  label: "When",         color: "var(--c-when)",
    cards: ["Weekday evening", "Saturday morning", "Sunday afternoon", "Lunch break", "During a festival", "After school"] },
  { key: "what",  label: "What happens", color: "var(--c-what)",
    cards: ["Free snacks", "Kids' activity", "Planting demo", "Free tree giveaway", "Music & games", "Ask an arborist"] },
  { key: "who",   label: "Who's there",  color: "var(--c-who)",
    cards: ["Casey Trees staff", "A neighbor I know", "City / DDOT rep", "Local leader / ANC", "Student volunteers", "Other families"] },
  { key: "how",   label: "How I'd hear", color: "var(--c-how)",
    cards: ["Instagram", "Flyer at a store", "Text from a friend", "Email", "Door knock", "Nextdoor / Facebook"] },
];

const NAME_A = ["Shade", "Leafy", "Root", "Canopy", "Branch Out", "Sprout", "Grove", "Acorn", "Tree-mendous", "Good Shade"];
const NAME_B = ["Saturday", "Social", "Fest", "Block Party", "Jam", "Hangout", "Day", "Swap", "Picnic", "Market"];

/* ---------------- state ---------------- */

const picked = {};   // { where: ["Library", ...], ... }
const custom = {};   // cards people wrote themselves
CATS.forEach(c => { picked[c.key] = []; custom[c.key] = []; });

let step = 0;
const LAST = 4;
let activeCat = "where";

/* ---------------- elements ---------------- */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const form     = $("#tree-form");
const screens  = $$(".screen");
const nextBtn  = $("#next");
const backBtn  = $("#back");
const tabsEl   = $("#tabs");
const deckEl   = $("#deck");
const preview  = $("#preview");
const ghost    = $("#drag-ghost");
const done     = $("#done");
const catOf    = key => CATS.find(c => c.key === key);

/* ---------------- steps ---------------- */

function go(n) {
  step = Math.max(0, Math.min(LAST, n));
  screens.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === step));
  backBtn.hidden = step === 0;
  nextBtn.textContent = step === 0 ? "Let's go" : step === LAST ? "Submit our event" : "Next";
  const pct = (step / LAST) * 100;
  $("#progress-fill").style.width = pct + "%";
  const sprout = $("#sprout");
  sprout.style.left = pct + "%";
  sprout.style.transform = `translateX(-50%) scale(${0.6 + step * 0.18})`;
  clearStatus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearStatus() { $$("[data-status]").forEach(s => (s.textContent = "")); }
function setStatus(msg) {
  const s = $(".screen.active [data-status]");
  if (s) s.textContent = msg;
}

nextBtn.addEventListener("click", () => {
  if (step === 0 && !form.names.value.trim()) {
    setStatus("Add your name(s) first!");
    form.names.focus();
    return;
  }
  if (step === LAST) return submit();
  go(step + 1);
});
backBtn.addEventListener("click", () => go(step - 1));

// Enter key moves forward instead of submitting the whole form
form.addEventListener("submit", e => e.preventDefault());
form.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.tagName === "INPUT" && !e.target.closest(".card")) {
    e.preventDefault();
    nextBtn.click();
  }
});

/* ---------------- tray: tabs + deck ---------------- */

function renderTabs() {
  tabsEl.innerHTML = "";
  CATS.forEach(c => {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "tab";
    t.role = "tab";
    t.textContent = c.label;
    t.style.setProperty("--c", c.color);
    t.setAttribute("aria-selected", c.key === activeCat);
    t.addEventListener("click", () => setCat(c.key));
    tabsEl.appendChild(t);
  });
}

function setCat(key) {
  activeCat = key;
  renderTabs();
  renderDeck();
  $$(".slot").forEach(s => s.classList.toggle("current", s.dataset.cat === key));
}

function renderDeck() {
  const cat = catOf(activeCat);
  deckEl.innerHTML = "";
  [...cat.cards, ...custom[cat.key]].forEach(value => deckEl.appendChild(makeCard(cat, value)));

  // "write your own" card
  const add = document.createElement("div");
  add.className = "card add";
  add.style.setProperty("--c", cat.color);
  add.innerHTML = `<span>+ Write your own</span>`;
  add.addEventListener("click", () => {
    if (add.querySelector("input")) return;
    add.innerHTML = `<input type="text" placeholder="Type & press Enter" maxlength="40">`;
    const inp = add.querySelector("input");
    inp.focus();
    const commit = () => {
      const v = inp.value.trim();
      if (v && !cat.cards.includes(v) && !custom[cat.key].includes(v)) {
        custom[cat.key].push(v);
        place(cat.key, v);
      }
      renderDeck();
    };
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); commit(); } });
    inp.addEventListener("blur", commit);
  });
  deckEl.appendChild(add);
}

function makeCard(cat, value) {
  const el = document.createElement("div");
  el.className = "card";
  el.textContent = value;
  el.tabIndex = 0;
  el.dataset.cat = cat.key;
  el.dataset.value = value;
  el.style.setProperty("--c", cat.color);
  if (picked[cat.key].includes(value)) el.classList.add("used");
  el.addEventListener("pointerdown", startDrag);
  el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(cat.key, value); }
  });
  return el;
}

/* ---------------- board ---------------- */

function place(cat, value) {
  if (!picked[cat].includes(value)) picked[cat].push(value);
  renderSlot(cat, true);
  renderDeck();
  updatePreview();
}

function unplace(cat, value) {
  picked[cat] = picked[cat].filter(v => v !== value);
  renderSlot(cat);
  renderDeck();
  updatePreview();
}

function toggle(cat, value) {
  picked[cat].includes(value) ? unplace(cat, value) : place(cat, value);
}

function renderSlot(cat, popIt = false) {
  const slot = $(`.slot[data-cat="${cat}"]`);
  const body = $(".slot-body", slot);
  body.innerHTML = "";
  if (!picked[cat].length) {
    body.innerHTML = `<span class="hint">drop here</span>`;
  } else {
    picked[cat].forEach(v => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = v;
      chip.title = "Tap to remove";
      chip.addEventListener("click", e => { e.stopPropagation(); unplace(cat, v); });
      body.appendChild(chip);
    });
  }
  if (popIt) {
    slot.classList.remove("pop"); void slot.offsetWidth; slot.classList.add("pop");
  }
}

$$(".slot").forEach(s => {
  s.style.setProperty("--c", catOf(s.dataset.cat).color);
  s.addEventListener("click", () => setCat(s.dataset.cat));
});

/* ---------------- live preview sentence ---------------- */

const list = (arr, joiner = "or") =>
  arr.length <= 1 ? (arr[0] || "") : arr.slice(0, -1).join(", ") + ` ${joiner} ` + arr[arr.length - 1];
const b = s => `<b>${escapeHTML(s)}</b>`;
const lower = s => s.charAt(0).toLowerCase() + s.slice(1);

function sentence() {
  const p = picked, parts = [];
  if (p.where.length) parts.push(b(list(p.where)));
  if (p.when.length)  parts.push(b(list(p.when)));
  if (p.what.length)  parts.push("featuring " + b(list(p.what.map(lower), "&")));
  if (p.who.length)   parts.push("with " + b(list(p.who.map(w => w.startsWith("A ") ? lower(w) : w), "&")));
  if (p.how.length)   parts.push("heard about via " + b(list(p.how)));
  return parts.join(" · ");
}

function updatePreview() {
  const s = sentence();
  preview.classList.toggle("empty", !s);
  preview.innerHTML = s || "Your event will show up here as you build it…";
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------------- drag & drop (mouse + touch) ---------------- */

let drag = null;

function startDrag(e) {
  if (e.button && e.button !== 0) return;
  const card = e.currentTarget;
  drag = { card, x0: e.clientX, y0: e.clientY, moving: false };
  card.setPointerCapture(e.pointerId);
  card.addEventListener("pointermove", moveDrag);
  card.addEventListener("pointerup", endDrag);
  card.addEventListener("pointercancel", cancelDrag);
}

function moveDrag(e) {
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moving && Math.hypot(dx, dy) > 6) {
    drag.moving = true;
    drag.card.classList.add("dragging");
    ghost.textContent = drag.card.dataset.value;
    ghost.style.setProperty("--c", catOf(drag.card.dataset.cat).color);
    ghost.hidden = false;
  }
  if (drag.moving) {
    ghost.style.left = e.clientX - 66 + "px";
    ghost.style.top  = e.clientY - 30 + "px";
    const slot = slotAt(e.clientX, e.clientY);
    $$(".slot").forEach(s => s.classList.toggle("over", s === slot));
    // auto-scroll when dragging near the top/bottom edge (handy on phones)
    const edge = 90;
    if (e.clientY < edge) window.scrollBy(0, -12);
    else if (e.clientY > innerHeight - edge) window.scrollBy(0, 12);
  }
}

function endDrag(e) {
  if (!drag) return;
  const { card, moving } = drag;
  const cat = card.dataset.cat, value = card.dataset.value;
  if (!moving) {
    toggle(cat, value);                       // simple tap
  } else {
    const slot = slotAt(e.clientX, e.clientY);
    if (slot && slot.dataset.cat === cat) {
      place(cat, value);
    } else if (slot) {
      slot.classList.remove("wrong"); void slot.offsetWidth; slot.classList.add("wrong");
      preview.innerHTML = `Oops, <b>${escapeHTML(value)}</b> goes in the <b>${catOf(cat).label}</b> slot.`;
      setTimeout(updatePreview, 1800);
    }
  }
  cleanupDrag();
}

function cancelDrag() { cleanupDrag(); }

function cleanupDrag() {
  if (!drag) return;
  const { card } = drag;
  card.classList.remove("dragging");
  card.removeEventListener("pointermove", moveDrag);
  card.removeEventListener("pointerup", endDrag);
  card.removeEventListener("pointercancel", cancelDrag);
  ghost.hidden = true;
  $$(".slot").forEach(s => s.classList.remove("over"));
  drag = null;
}

function slotAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return el ? el.closest(".slot") : null;
}

/* ---------------- name dice ---------------- */

$("#dice").addEventListener("click", e => {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let name;
  do { name = `${pick(NAME_A)} ${pick(NAME_B)}`; } while (name.split(" ")[0] === name.split(" ").pop());
  form.event_name.value = name;
  const btn = e.currentTarget;
  btn.classList.remove("roll"); void btn.offsetWidth; btn.classList.add("roll");
});

/* ---------------- submit ---------------- */

function collect() {
  const data = new URLSearchParams();
  data.append("website", form.website.value);
  data.append("names", form.names.value.trim());
  CATS.forEach(c => {
    data.append(c.key, picked[c.key].filter(v => !custom[c.key].includes(v)).join(", "));
    data.append(c.key + "_other", picked[c.key].filter(v => custom[c.key].includes(v)).join(", "));
  });
  data.append("drives", $$('input[name="drives"]:checked').map(i => i.value).join(", "));
  ["drives_other", "event_name", "q_why", "q_signup", "q_walkaway"]
    .forEach(k => data.append(k, form[k].value.trim()));
  return data;
}

async function submit() {
  if (SCRIPT_URL.startsWith("PASTE")) {
    setStatus("This form isn't connected yet. See README.md, step 3.");
    console.warn("Set SCRIPT_URL in script.js to your Apps Script Web App URL.");
    return;
  }
  nextBtn.disabled = true;
  nextBtn.textContent = "Sending…";
  try {
    // Apps Script doesn't send CORS headers; the row still saves.
    await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: collect() });
    showDone();
  } catch (err) {
    console.error(err);
    setStatus("Hmm, that didn't send. Check your connection and try again.");
  } finally {
    nextBtn.disabled = false;
    nextBtn.textContent = "Submit our event";
  }
}

/* ---------------- done + poster ---------------- */

function showDone() {
  const name = form.event_name.value.trim() || "Our Tree Event";
  const drives = $$('input[name="drives"]:checked').map(i => i.value);
  const s = sentence();
  $("#poster").innerHTML = `
    <div class="stripe">${CATS.map(c => `<span style="background:${c.color}"></span>`).join("")}</div>
    <div class="p-in">
      <div class="p-kicker">Casey Trees × GW presents</div>
      <div class="p-name">${escapeHTML(name)}</div>
      ${s ? `<p class="p-line">${s}.</p>` : ""}
      ${drives.length ? `<p class="p-line">What pulls people in: ${b(list(drives.map(lower), "and"))}.</p>` : ""}
      <div class="p-by">Dreamed up by ${escapeHTML(form.names.value.trim())}</div>
    </div>`;
  form.hidden = true;
  $(".topbar .progress").style.visibility = "hidden";
  done.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  leafConfetti();
}

function leafConfetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = $("#confetti");
  const colors = ["#6DBB5E", "#94D1AA", "#387E46", "#E8C760", "#D06647", "#5C9A74"];
  for (let i = 0; i < 46; i++) {
    const c = colors[i % colors.length];
    const leaf = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    leaf.setAttribute("viewBox", "0 0 24 24");
    leaf.innerHTML = `<path d="M4.5 19.5C4 12 8.5 5 19.5 4.5 20 13 14.5 19.5 4.5 19.5Z" fill="${c}"/><path d="M4.5 19.5 14 10" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>`;
    leaf.style.left = Math.random() * 100 + "vw";
    leaf.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
    leaf.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
    leaf.style.animationDuration = 2.4 + Math.random() * 2 + "s";
    leaf.style.animationDelay = Math.random() * 0.6 + "s";
    const size = 14 + Math.random() * 16;
    leaf.style.width = leaf.style.height = size + "px";
    box.appendChild(leaf);
  }
  setTimeout(() => (box.innerHTML = ""), 5500);
}

$("#again").addEventListener("click", () => {
  form.reset();
  CATS.forEach(c => { picked[c.key] = []; custom[c.key] = []; renderSlot(c.key); });
  updatePreview();
  setCat("where");
  done.hidden = true;
  form.hidden = false;
  $(".topbar .progress").style.visibility = "";
  go(0);
});

/* ---------------- start ---------------- */

setCat("where");
updatePreview();
go(0);
