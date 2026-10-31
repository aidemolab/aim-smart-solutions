/*
 * AIM demo bar: the one navigation bar for the AIM demo apps.
 * Each app loads this file with:
 *   <script src="https://aimsmartsolutions.tech/assets/aim-demo-bar.js" defer></script>
 * Bar: AIM logo (home) · "← Back to [service]" (that service page's demo section) · All services · Book a call.
 * Every link opens in the same tab. The links live only here.
 */
(function () {
  "use strict";
  if (window.__aimDemoBar) return;
  window.__aimDemoBar = true;

  var SITE = "https://aimsmartsolutions.tech";
  var DEMOS = [
    { id: "aim-pharmaceutical-ai-demo", service: "AI Smart Apps", serviceUrl: SITE + "/services/smart-apps/#demo" },
    { id: "aim-supplier-risk-demo", service: "Data & Dashboards", serviceUrl: SITE + "/services/data-analytics/#demo" },
    { id: "aim-sales-lead-scoring-demo", service: "Data & Dashboards", serviceUrl: SITE + "/services/data-analytics/#demo" },
    { id: "aim-property-investment-demo", service: "Data & Dashboards", serviceUrl: SITE + "/services/data-analytics/#demo" }
  ];
  var ALL_SERVICES = SITE + "/services/";
  var BOOK = SITE + "/book-appointment/";

  var current = DEMOS.filter(function (d) { return location.pathname.indexOf("/" + d.id) === 0; })[0] || null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  var css = [
    ":host{all:initial;position:fixed;top:0;left:0;right:0;z-index:45;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}",
    ".bar{box-sizing:border-box;min-height:48px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:6px 16px;background:#0B1F33;color:#fff;border-bottom:2px solid #F59E0B;font-size:14px;line-height:1.2}",
    "a{font:inherit;color:inherit;text-decoration:none}",
    "a:focus-visible{outline:2px solid #F59E0B;outline-offset:2px;border-radius:6px}",
    ".logo{display:flex;align-items:center;flex:none;height:34px;padding:2px 6px;margin-right:4px;background:#fff;border-radius:6px;box-sizing:border-box}",
    ".logo img{height:30px;width:auto;display:block}",
    ".back,.all{display:flex;align-items:center;gap:6px;min-height:36px;padding:0 10px;border-radius:6px;white-space:nowrap;font-weight:600}",
    ".back:hover,.all:hover{background:rgba(255,255,255,.12)}",
    ".back .arrow{font-size:16px}",
    ".spacer{flex:1}",
    ".book{display:flex;align-items:center;flex:none;min-height:36px;padding:0 14px;border-radius:6px;background:#2563EB;color:#fff;font-weight:700;white-space:nowrap}",
    ".book:hover{background:#1D4ED8}",
    // Phones: logo and Back on the first row, All services and Book a call on the second.
    "@media(max-width:640px){.bar{padding:6px 12px}.back{flex:1;min-width:0;padding:0 8px}.spacer{flex-basis:100%;height:0}.all{padding:0 8px}.book{margin-left:auto}}"
  ].join("");

  var backUrl = current ? current.serviceUrl : SITE + "/";
  var backText = current ? "Back to " + current.service : "Back to AIM Smart Solutions";

  var html =
    '<nav class="bar" aria-label="AIM Smart Solutions">' +
    '<a class="logo" href="' + SITE + '/" aria-label="AIM Smart Solutions home"><img src="' + SITE + '/aim-logo.webp" alt="AIM Smart Solutions" width="46" height="30"></a>' +
    '<a class="back" href="' + esc(backUrl) + '"><span class="arrow" aria-hidden="true">&larr;</span><span>' + esc(backText) + "</span></a>" +
    '<span class="spacer"></span>' +
    '<a class="all" href="' + ALL_SERVICES + '">All services</a>' +
    '<a class="book" href="' + BOOK + '">Book a call</a>' +
    "</nav>";

  var host, pad, shifted = [], barH = 48;

  function shiftTopElements() {
    // Move the app's own sticky/fixed top bars below the demo bar so nothing is covered.
    var els = document.body.querySelectorAll("*");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el === host || el.hasAttribute("data-aim-shifted")) continue;
      var cs = getComputedStyle(el);
      if ((cs.position === "sticky" || cs.position === "fixed") && cs.top === "0px" && cs.bottom !== "0px") {
        el.setAttribute("data-aim-shifted", "");
        shifted.push(el);
      }
    }
    for (var j = 0; j < shifted.length; j++) shifted[j].style.top = barH + "px";
  }

  function layout() {
    // The bar is one row on wide screens and two on phones, so measure it.
    var h = Math.ceil(host.getBoundingClientRect().height) || 48;
    if (h === barH && pad.textContent) return;
    barH = h;
    pad.textContent = "body{padding-top:" + barH + "px !important}html{scroll-padding-top:" + barH + "px}";
    for (var j = 0; j < shifted.length; j++) shifted[j].style.top = barH + "px";
  }

  function mount() {
    if (document.getElementById("aim-demo-bar")) return;
    host = document.createElement("div");
    host.id = "aim-demo-bar";
    var root = host.attachShadow({ mode: "open" });
    root.innerHTML = "<style>" + css + "</style>" + html;
    document.body.insertBefore(host, document.body.firstChild);

    pad = document.createElement("style");
    document.head.appendChild(pad);
    layout();
    window.addEventListener("resize", layout);

    shiftTopElements();
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; shiftTopElements(); }, 200);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
