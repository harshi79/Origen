import {
  createIcons,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CircleAlert,
  CircleSlash,
  ClipboardPaste,
  CopyX,
  FileText,
  FileUp,
  ListFilter,
  ListRestart,
  Rows3,
  SortAsc,
  SortDesc,
  TextCursorInput,
  Wand2,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  CreditCard,
  Download,
  Fingerprint,
  FlaskConical,
  Github,
  Info,
  Layers,
  LoaderCircle,
  LockKeyhole,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  X,
  Zap,
} from "lucide";
import {
  compatibleNetworks,
  displayNumber,
  formatRecords,
  generateCards,
  NETWORKS,
  validateOptions,
  type CardRecord,
  type GeneratorOptions,
  type OutputFormat,
} from "./generator";
import "./style.css";
import { prepareGeneratorOptions, type GeneratorInput } from './generator-input';
import { downloadFixtures, type ExportType } from './exports';
import { tabsMarkup, extraPanelsMarkup, mountWorkspace } from './workspace';
const icons = {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CircleAlert,
  CircleSlash,
  ClipboardPaste,
  CopyX,
  FileText,
  FileUp,
  ListFilter,
  ListRestart,
  Rows3,
  SortAsc,
  SortDesc,
  TextCursorInput,
  Wand2,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  CreditCard,
  Download,
  Fingerprint,
  FlaskConical,
  Github,
  Info,
  Layers,
  LoaderCircle,
  LockKeyhole,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  X,
  Zap,
};
const icon = (name: string, cls = "") =>
  `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const TELEGRAM_CHANNEL = "https://t.me/+y8EekRvqpnQzNjZl";
/** Telegram paper-plane mark, drawn with currentColor so it adapts to the theme. */
const telegramIcon = `<svg class="telegram-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.566 8.166c.09-.002.29.02.418.126a.456.456 0 0 1 .154.292c.014.084.032.276.018.425-.163 1.71-.866 5.857-1.224 7.771-.151.81-.449 1.082-.738 1.108-.627.058-1.103-.414-1.71-.812-.951-.624-1.488-1.012-2.411-1.62-1.067-.703-.375-1.09.232-1.72.16-.166 2.923-2.68 2.977-2.909.006-.028.012-.135-.05-.19-.063-.056-.157-.037-.225-.022-.095.022-1.613 1.026-4.554 3.01-.432.297-.822.442-1.172.434-.385-.008-1.126-.218-1.677-.397-.677-.22-1.214-.337-1.167-.71.024-.195.292-.394.803-.597 3.148-1.372 5.247-2.276 6.298-2.712 2.998-1.248 3.621-1.465 4.028-1.472Z"/></svg>`;
const refreshIcons = () => createIcons({ icons });
const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
let records: CardRecord[] = [];
let generationMs = 0;
let view: "table" | "code" = "table";
let busy = false;
let timer: ReturnType<typeof setTimeout>;
const year = new Date().getFullYear();
let savedTheme = "dark";
try {
  savedTheme = localStorage.getItem("origen-theme") ?? "dark";
} catch {
  /* Storage is optional. */
}
document.documentElement.dataset.theme =
  savedTheme === "light" ? "light" : "dark";
$("#app").innerHTML = `
<header class="site-header"><div class="header-inner">
  <a class="brand" href="./" aria-label="ORIGEN home"><span class="brand-icon">${icon("braces")}</span>ORIGEN<span class="brand-dot">.</span></a>
  <span class="header-divider"></span><span class="workspace-label">DEVELOPER TOOLS</span>
  <nav aria-label="Main navigation"><a class="nav-active" id="generator-link" href="#generator" aria-label="Generator" aria-current="page">${icon("credit-card")} <span class="nav-text">Generator</span></a><button type="button" class="nav-link" id="guide" aria-label="Quick guide">${icon("code-2")} <span class="nav-text">Quick guide</span> ${icon("arrow-up-right")}</button></nav>
  <div class="header-right"><span class="version">v1.2</span><a class="telegram-button" href="${TELEGRAM_CHANNEL}" target="_blank" rel="noopener noreferrer" aria-label="Join Channel on Telegram (opens in a new tab)">${telegramIcon}<span class="telegram-label">Join Channel</span></a><button type="button" class="icon-button" id="theme" aria-label="Switch to light theme">${icon("sun")}</button></div>
</div></header>
<main>
  <section class="intro"><div><div class="eyebrow"><span></span> THE PAYMENT TESTING TOOLKIT</div><h1>Payment card generator<span>.</span></h1><p>Realistic fixtures. Zero real-world stakes. Build better payment experiences.</p></div><div class="local-badge">${icon("shield-check")}<div><strong>Generation stays local</strong><span>Optional BIN metadata. No card verification.</span></div></div></section>
  ${tabsMarkup}
  <section id="panel-generator" role="tabpanel" aria-labelledby="tab-generator" tabindex="0">
  <div class="workspace" id="generator">
  <section class="panel config-panel" aria-labelledby="config-title"><div class="panel-heading"><div>${icon("sliders-horizontal")}<h2 id="config-title">Configuration</h2></div><span class="step-tag">01</span></div>
    <form id="config" novalidate>
      <div class="field"><div class="label-row"><label for="prefix">BIN / IIN prefix</label><span class="optional">Optional</span></div><div class="input-with-icon">${icon("fingerprint")}<input id="prefix" name="prefix" type="text" inputmode="numeric" placeholder="e.g. 424242" autocomplete="off" aria-describedby="prefix-hint"/><span class="input-end">6–8 digits</span></div><p class="hint" id="prefix-hint">Leave blank to use a network-compatible prefix.</p></div>
      <div class="field"><label for="network">Card network</label><div class="select-wrap">${icon("credit-card")}<select id="network" name="network"><option>Auto</option>${NETWORKS.map((n) => `<option value="${n}">${n === "American Express" ? "Amex" : n}</option>`).join("")}<option>Random</option></select>${icon("chevron-down")}</div><p class="hint">Auto detects the prefix, or picks a network if blank. Random also respects your prefix.</p></div>
      <div class="field"><div class="label-row"><label for="quantity">Number of records</label><span class="optional">Max. 100</span></div><div class="quantity-row"><input id="quantity" name="quantity" type="number" min="1" max="100" value="10" step="1"/><div class="presets" aria-label="Quantity presets">${[10, 25, 50, 100].map((n) => `<button type="button" data-quantity="${n}" class="${n === 10 ? "selected" : ""}">${n}</button>`).join("")}</div></div></div>
      <div class="form-divider"><span>TEST CARD DETAILS</span></div>
      <div class="field"><label for="expiryMode">Expiration date</label><div class="select-wrap no-icon"><select id="expiryMode" name="expiryMode"><option value="random">Random future expiry</option><option value="month">Select month</option><option value="year">Select year</option><option value="fixed">Fixed expiry</option></select>${icon("chevron-down")}</div><div class="expiry-fields" id="expiry-fields" hidden><div id="month-field"><label for="month">Month</label><div class="select-wrap no-icon"><select id="month" name="month">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${String(i + 1).padStart(2, "0")}</option>`).join("")}</select>${icon("chevron-down")}</div></div><div id="year-field"><label for="year">Year</label><div class="select-wrap no-icon"><select id="year" name="year">${Array.from({ length: 11 }, (_, i) => `<option ${i === 1 ? "selected" : ""}>${year + i}</option>`).join("")}</select>${icon("chevron-down")}</div></div></div></div>
      <div class="field"><div class="label-row"><label for="cvv">CVV format</label><span class="tiny-badge">SYNTHETIC</span></div><div class="select-wrap no-icon"><select id="cvv" name="cvv"><option value="auto">Automatic · matches network</option><option value="3">3 digits · Visa, Mastercard, Discover</option><option value="4">4 digits · American Express</option></select>${icon("chevron-down")}</div><p class="hint">3 digits for most networks. 4 for Amex.</p></div>
      <div id="error" class="error" role="alert" hidden></div>
      <button class="generate-button" id="generate" type="submit">${icon("zap")} Generate test data ${icon("arrow-right")}</button><div class="shortcut">Ready when you are <kbd>⌘ / Ctrl</kbd><kbd>↵</kbd></div>
    </form>
    <div class="config-footnote">${icon("lock-keyhole")} No API keys. No accounts. No network calls.</div>
  </section>
  <section class="panel results-panel" aria-labelledby="results-title"><div class="panel-heading"><div>${icon("layers")}<h2 id="results-title">Generated data</h2><span class="count-badge" id="count">0</span></div><div class="view-toggle" aria-label="Results view"><button type="button" id="table-view" class="active" aria-label="Table view" aria-pressed="true">${icon("layers")}</button><button type="button" id="code-view" aria-label="Code view" aria-pressed="false">${icon("code-2")}</button></div></div>
    <div class="test-banner">${icon("shield-check")}<span>TEST DATA ONLY — NOT REAL PAYMENT CARDS</span><span class="banner-dot"></span></div>
    <div class="results-toolbar"><div class="format-selector"><label for="format">Format</label><div class="select-wrap no-icon"><select id="format"><option value="pipe">Pipe separated</option><option value="csv">Comma separated</option><option value="json">JSON</option></select>${icon("chevron-down")}</div></div><div class="result-actions"><button type="button" class="subtle-button" id="clear" aria-label="Clear" disabled>${icon("trash-2")}<span>Clear</span></button><button type="button" class="secondary-button" id="copy-all" disabled>${icon("copy")} Copy all</button></div></div>
    <div id="results-content" class="results-content"></div>
    <div class="results-bottom"><div class="stats"><span><span class="status-dot"></span><strong id="stat-records">0</strong> records</span><span>${icon("zap")}<strong id="stat-time">—</strong></span><span class="luhn-stat">${icon("check")} Luhn compatible</span></div><div class="export-actions"><button type="button" id="copy-text" disabled>Copy text</button><span>·</span><button type="button" id="copy-json" disabled>Copy JSON ${icon("braces")}</button></div></div>
    <div class="download-toolbar"><span>${icon("download")} Download synthetic fixtures</span><div>${(['txt', 'csv', 'json'] as const).map(type => `<button type="button" class="secondary-button" data-export="${type}" aria-label="Export ${type.toUpperCase()}" disabled>${type.toUpperCase()}</button>`).join('')}</div></div>
  </section>
  </div>
  <section class="benefits" aria-label="How it works"><article><div class="benefit-icon">${icon("terminal")}</div><div><h3>Made for your sandbox</h3><p>Fixtures for forms, QA flows, and UI validation.</p></div><span>01</span></article><article><div class="benefit-icon">${icon("shield-check")}</div><div><h3>Format-valid. Never verified.</h3><p>Luhn-compatible numbers. No account lookups.</p></div><span>02</span></article><article><div class="benefit-icon">${icon("braces")}</div><div><h3>Generate. Copy. Build.</h3><p>Clean output that fits right into your workflow.</p></div><span>03</span></article></section>
  </section>
  ${extraPanelsMarkup}
  <div class="safety-note">${icon("info")}<p>Synthetic data is for development only. Numbers are not issued test accounts and may coincide with real card numbers. Use your payment provider’s official fixtures for gateway sandbox flows.</p></div>
  <footer><span><span class="footer-brand">ORIGEN.</span> Small tools. Better builds.</span><span>${icon("lock-keyhole")} Client-side only <span class="footer-dot">/</span> Built for developers</span></footer>
</main>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<dialog id="guide-dialog"><div class="dialog-heading"><span class="eyebrow">ORIGEN / DOCS</span><button type="button" id="close-guide" class="icon-button" aria-label="Close quick guide">${icon("x")}</button></div><h2>A small tool for better tests.</h2><p>Generate fictional, format-compatible payment-card fixtures without leaving your browser.</p><ol><li><strong>Set your parameters.</strong> Enter 6–8 prefix digits or leave blank. Random selects only networks compatible with your prefix.</li><li><strong>Generate up to 100 fixtures.</strong> Visa, Mastercard and Discover use 16 digits; Amex uses 15. All include a calculated Luhn check digit.</li><li><strong>Copy into your test suite.</strong> Use pipe-separated lines, CSV-style lines or JSON. JSON explicitly includes <code>synthetic: true</code>.</li></ol><div class="dialog-warning">A valid checksum does not mean an active account. These numbers are not guaranteed reserved test numbers. Never submit them to live payment systems. For gateway sandboxes, use that provider’s official test fixtures.</div><p class="hint">No payment processing, authorization, balance checking, account verification, or saved card data. BIN Lookup sends only a 6–8 digit prefix to Guison for range metadata. History is page-memory only. The theme is the only persisted setting.</p><button type="button" class="generate-button" id="guide-done">Got it. Let’s build. ${icon("arrow-right")}</button></dialog>
`;
function options(): GeneratorInput {
  return {
    prefix: $<HTMLInputElement>("#prefix").value,
    network: $<HTMLSelectElement>("#network")
      .value as GeneratorInput["network"],
    quantity: Number($<HTMLInputElement>("#quantity").value),
    expiryMode: $<HTMLSelectElement>("#expiryMode")
      .value as GeneratorOptions["expiryMode"],
    month: Number($<HTMLSelectElement>("#month").value),
    year: Number($<HTMLSelectElement>("#year").value),
    cvv: $<HTMLSelectElement>("#cvv").value as GeneratorOptions["cvv"],
  };
}
function format(): OutputFormat {
  return $<HTMLSelectElement>("#format").value as OutputFormat;
}
function render() {
  $("#count").textContent = String(records.length);
  $("#stat-records").textContent = String(records.length);
  $("#stat-time").textContent = records.length
    ? `${generationMs < 1 ? "< 1" : Math.round(generationMs)} ms`
    : "—";
  for (const id of ["clear", "copy-all", "copy-text", "copy-json"])
    $<HTMLButtonElement>(`#${id}`).disabled = !records.length || busy;
  document.querySelectorAll<HTMLButtonElement>('[data-export]').forEach(button => { button.disabled = !records.length || busy; });
  $("#results-content").classList.toggle("has-records", !!records.length);
  if (!records.length) {
    $("#results-content").innerHTML =
      `<div class="empty-state"><div class="card-illustration"><div class="ghost-card"></div><div class="mock-card"><div class="mock-top"><span class="chip">${icon("braces")}</span>${icon("sparkles")}</div><div class="mock-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;••••</div><div class="mock-bottom"><span>SYNTHETIC / TEST ONLY</span><span>MM/YY</span></div></div><span class="card-plus">${icon("plus")}</span></div><span class="empty-eyebrow">A CLEAN SLATE</span><h3>Your next test starts here.</h3><p>Configure your fixtures and hit generate. We’ll handle the digits. You handle the build.</p><div class="empty-code"><span>$</span> origen.generate() <span class="cursor">▌</span></div></div>`;
    refreshIcons();
  } else if (view === "code") {
    $("#results-content").innerHTML =
      '<div class="code-label">// SYNTHETIC TEST FIXTURES · NOT REAL PAYMENT CARDS</div><pre id="code-output" tabindex="0" aria-label="Generated test fixtures"></pre>';
    $("#code-output").textContent = formatRecords(records, format());
  } else {
    $("#results-content").innerHTML =
      `<table><caption class="sr-only">Synthetic payment-card test fixtures. Not real payment cards.</caption><thead><tr><th class="row-num">#</th><th>Card number</th><th>Expiry</th><th>CVV</th><th>Network</th><th><span class="sr-only">Copy record</span></th></tr></thead><tbody>${records.map((r, i) => `<tr><td class="row-num">${String(i + 1).padStart(2, "0")}</td><td class="card-number">${displayNumber(r)}</td><td class="mono">${r.month}/${r.year}</td><td class="mono cvv-cell">${r.cvv}</td><td><span class="network-badge ${r.network.toLowerCase().replaceAll(" ", "-")}"><span></span>${r.network === "American Express" ? "Amex" : r.network}</span></td><td><button type="button" class="row-copy icon-button" data-copy="${i}" aria-label="Copy test record ${i + 1}">${icon("copy")}</button></td></tr>`).join("")}</tbody></table>`;
    refreshIcons();
  }
}
$("#results-content").addEventListener("click", (event) => {
  const btn = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-copy]");
  if (!btn) return;
  const row = records[Number(btn.dataset.copy)];
  if (row) void copy(formatRecords([row], format()), "Test record copied");
});
function toast(message: string, kind: "ok" | "error" = "ok") {
  clearTimeout(timer);
  $("#toast").innerHTML = `${icon(kind === "error" ? "circle-alert" : "check")}<span></span>`;
  $("#toast span").textContent = message;
  $("#toast").classList.toggle("toast-error", kind === "error");
  $("#toast").hidden = false;
  refreshIcons();
  timer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 3200);
}
async function copy(text: string, message: string) {
  try {
    if (navigator.clipboard?.writeText)
      await navigator.clipboard.writeText(text);
    else {
      const previous = document.activeElement as HTMLElement | null;
      const area = document.createElement("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(area);
      area.select();
      const success = document.execCommand("copy");
      area.remove();
      previous?.focus();
      if (!success) throw new Error("Clipboard unavailable");
    }
    toast(message);
  } catch {
    toast(
      "Clipboard unavailable. Select text in code view or the full metadata response to copy manually.",
    );
  }
}
$("#config").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  $("#error").hidden = true;
  let settings: GeneratorOptions;
  try {
    settings = prepareGeneratorOptions(options());
    validateOptions(settings);
  } catch (error) {
    $("#error").textContent = (error as Error).message;
    $("#error").hidden = false;
    return;
  }
  busy = true;
  const button = $<HTMLButtonElement>("#generate");
  button.disabled = true;
  button.innerHTML = `${icon("loader-circle", "spin")} Generating fixtures…`;
  $("#results-content").setAttribute("aria-busy", "true");
  refreshIcons();
  await new Promise((resolve) => setTimeout(resolve, 220));
  try {
    const start = performance.now();
    records = generateCards(settings);
    generationMs = performance.now() - start;
    toast(`${records.length} synthetic test records generated`);
  } catch (error) {
    $("#error").textContent = (error as Error).message;
    $("#error").hidden = false;
  } finally {
    busy = false;
    button.disabled = false;
    button.innerHTML = `${icon("zap")} Generate test data ${icon("arrow-right")}`;
    $("#results-content").removeAttribute("aria-busy");
    render();
  }
});
$("#prefix").addEventListener("input", () => {
  const prefix = $<HTMLInputElement>("#prefix").value;
  const matches = compatibleNetworks(prefix);
  $("#prefix-hint").textContent = !prefix
    ? "Leave blank to use a network-compatible prefix."
    : !/^\d{6,8}$/.test(prefix)
      ? "Use digits only, between 6 and 8 characters. Never enter a full card number."
      : matches.length
        ? `Compatible with ${matches.join(", ")}.`
        : "No supported network matches this prefix.";
});
$("#config").addEventListener("input", () => {
  $("#error").hidden = true;
});
function syncQuantity() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-quantity]")
    .forEach((btn) => {
      const selected =
        btn.dataset.quantity === $<HTMLInputElement>("#quantity").value;
      btn.classList.toggle("selected", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });
}
document.querySelectorAll<HTMLButtonElement>("[data-quantity]").forEach((btn) =>
  btn.addEventListener("click", () => {
    $<HTMLInputElement>("#quantity").value = btn.dataset.quantity!;
    $("#error").hidden = true;
    syncQuantity();
  }),
);
$("#quantity").addEventListener("input", syncQuantity);
$("#expiryMode").addEventListener("change", () => {
  const mode = options().expiryMode;
  $("#expiry-fields").hidden = mode === "random";
  $("#month-field").hidden = mode === "year";
  $("#year-field").hidden = mode === "month";
});
$("#format").addEventListener("change", () => {
  if (view === "code" && records.length) {
    const code = document.querySelector<HTMLElement>("#code-output");
    if (code) code.textContent = formatRecords(records, format());
  }
});
for (const mode of ["table", "code"] as const)
  $(`#${mode}-view`).addEventListener("click", () => {
    view = mode;
    for (const m of ["table", "code"]) {
      $(`#${m}-view`).classList.toggle("active", m === mode);
      $(`#${m}-view`).setAttribute("aria-pressed", String(m === mode));
    }
    render();
  });
$("#copy-all").addEventListener("click", () =>
  copy(
    formatRecords(records, format()),
    `${records.length} test records copied`,
  ),
);
$("#copy-text").addEventListener("click", () =>
  copy(
    formatRecords(records, format() === "csv" ? "csv" : "pipe"),
    "Test records copied as plain text",
  ),
);
$("#copy-json").addEventListener("click", () =>
  copy(formatRecords(records, "json"), "Test records copied as JSON"),
);
$("#clear").addEventListener("click", () => {
  records = [];
  generationMs = 0;
  render();
  toast("Test records cleared");
});
function syncTheme() {
  const light = document.documentElement.dataset.theme === "light";
  $("#theme").innerHTML = icon(light ? "moon" : "sun");
  $("#theme").setAttribute(
    "aria-label",
    `Switch to ${light ? "dark" : "light"} theme`,
  );
  $<HTMLSelectElement>('#settings-theme').value = light ? 'light' : 'dark';
  refreshIcons();
}
function setTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('origen-theme', theme); } catch { /* Storage is optional. */ }
  syncTheme();
}
$("#theme").addEventListener("click", () => {
  const theme =
    document.documentElement.dataset.theme === "light" ? "dark" : "light";
  setTheme(theme);
});
const dialog = $<HTMLDialogElement>("#guide-dialog");
$("#guide").addEventListener("click", () => dialog.showModal());
$("#close-guide").addEventListener("click", () => dialog.close());
$("#guide-done").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  }
});
document.addEventListener("keydown", (event) => {
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key === "Enter" &&
    !dialog.open && workspace.activeTab() === "generator"
  ) {
    event.preventDefault();
    $<HTMLFormElement>("#config").requestSubmit();
  }
});
const workspace = mountWorkspace({ icon, refreshIcons, toast, copy, setTheme });
document.querySelectorAll<HTMLButtonElement>('[data-export]').forEach(button => button.addEventListener('click', () => {
  if (!records.length) return;
  try { downloadFixtures(records, button.dataset.export as ExportType); toast('Synthetic test fixtures exported'); }
  catch { toast('Export unavailable. You can still copy the test fixtures.'); }
}));
render();
syncTheme();
syncQuantity();
