/*
 * AIM demo bar: one shared navigation bar for the AIM demo apps.
 * Each app loads this file with:
 *   <script src="https://aimsmartsolutions.tech/assets/aim-demo-bar.js" defer></script>
 * The demo list and every link live only here.
 */
(function () {
  "use strict";
  if (window.__aimDemoBar) return;
  window.__aimDemoBar = true;

  var SITE = "https://aimsmartsolutions.tech";
  var BAR_H = 48;
  var DEMOS = [
    { id: "aim-pharmaceutical-ai-demo", name: "Pharmaceutical market intelligence", url: "https://aidemolab.github.io/aim-pharmaceutical-ai-demo/", service: "AI Smart Apps", serviceUrl: SITE + "/services/smart-apps/" },
    { id: "aim-supplier-risk-demo", name: "Supplier risk scoring", url: "https://aidemolab.github.io/aim-supplier-risk-demo/", service: "Data & Dashboards", serviceUrl: SITE + "/services/data-analytics/" },
    { id: "aim-sales-lead-scoring-demo", name: "Sales lead scoring", url: "https://aidemolab.github.io/aim-sales-lead-scoring-demo/", service: "AI Sales & Marketing", serviceUrl: SITE + "/services/sales-marketing/" },
    { id: "aim-property-investment-demo", name: "Property investment analysis", url: "https://aidemolab.github.io/aim-property-investment-demo/", service: "AI Smart Apps", serviceUrl: SITE + "/services/smart-apps/" }
  ];
  var ALL_DEMOS = SITE + "/live-demos/";
  var BOOK = SITE + "/book-appointment/";

  var current = DEMOS.filter(function (d) { return location.pathname.indexOf("/" + d.id) === 0; })[0] || null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  var css = [
    ":host{all:initial;position:fixed;top:0;left:0;right:0;height:" + BAR_H + "px;z-index:45;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}",
    ".bar{box-sizing:border-box;height:" + BAR_H + "px;display:flex;align-items:center;gap:12px;padding:0 16px;background:#0B1F33;color:#fff;border-bottom:2px solid #F59E0B;font-size:14px;line-height:1}",
    "a,button{font:inherit;color:inherit;text-decoration:none}",
    "a:focus-visible,button:focus-visible{outline:2px solid #F59E0B;outline-offset:2px;border-radius:6px}",
    ".logo{display:flex;align-items:center;flex:none;height:34px;padding:2px 6px;background:#fff;border-radius:6px}",
    ".logo img{height:30px;width:auto;display:block}",
    ".back{display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
    ".back:hover,.menu-btn:hover{background:rgba(255,255,255,.1)}",
    ".back .arrow{font-size:16px}",
    ".spacer{flex:1}",
    ".menu{position:relative;flex:none}",
    ".menu-btn{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid rgba(255,255,255,.3);border-radius:6px;background:transparent;cursor:pointer;white-space:nowrap}",
    ".panel{position:absolute;right:0;top:calc(100% + 8px);width:280px;max-width:calc(100vw - 32px);background:#fff;color:#1E293B;border-radius:10px;box-shadow:0 18px 40px rgba(11,31,51,.25);padding:8px;box-sizing:border-box}",
    ".panel[hidden]{display:none}",
    ".panel a{display:block;padding:10px 12px;border-radius:6px;font-size:14px;line-height:1.3}",
    ".panel a:hover,.panel a:focus-visible{background:#EFF6FF;color:#1D4ED8}",
    ".panel a[aria-current=page]{font-weight:700;color:#2563EB}",
    ".panel .all{border-top:1px solid #E2E8F0;margin-top:4px;padding-top:12px;font-weight:700;color:#2563EB}",
    ".panel .book-m{display:none;background:#2563EB;color:#fff;text-align:center;font-weight:700;margin-top:6px}",
    ".book{flex:none;padding:9px 14px;border-radius:6px;background:#2563EB;color:#fff;font-weight:700;white-space:nowrap}",
    ".book:hover{background:#1D4ED8}",
    ".label-short{display:none}",
    "@media(max-width:640px){.bar{gap:8px;padding:0 12px}.back .text,.book,.label-long{display:none}.label-short{display:inline}.back{padding:8px 12px}.panel .book-m{display:block}}"
  ].join("");

  var back = current
    ? '<a class="back" href="' + esc(current.serviceUrl) + '" aria-label="Back to ' + esc(current.service) + '"><span class="arrow" aria-hidden="true">&larr;</span><span class="text">Back to ' + esc(current.service) + "</span></a>"
    : '<a class="back" href="' + ALL_DEMOS + '" aria-label="Back to all demos"><span class="arrow" aria-hidden="true">&larr;</span><span class="text">Back to all demos</span></a>';

  var items = DEMOS.map(function (d) {
    return '<a href="' + esc(d.url) + '"' + (current && d.id === current.id ? ' aria-current="page"' : "") + ">" + esc(d.name) + "</a>";
  }).join("");

  var html =
    '<nav class="bar" aria-label="AIM demos">' +
    '<a class="logo" href="' + SITE + '/" aria-label="AIM Smart Solutions home"><img src="' + SITE + '/aim-logo.webp" alt="AIM Smart Solutions" width="46" height="30"></a>' +
    back +
    '<span class="spacer"></span>' +
    '<div class="menu"><button class="menu-btn" type="button" aria-expanded="false" aria-controls="aim-demos-panel">' +
    '<span class="label-long">Other demos</span><span class="label-short">Demos</span><span aria-hidden="true">&#9662;</span></button>' +
    '<div class="panel" id="aim-demos-panel" hidden>' + items +
    '<a class="all" href="' + ALL_DEMOS + '">All demos &rarr;</a>' +
    '<a class="book-m" href="' + BOOK + '">Book a call</a></div></div>' +
    '<a class="book" href="' + BOOK + '">Book a call</a>' +
    "</nav>";

  function shiftTopElements() {
    // Move the app's own sticky/fixed top bars below the demo bar so nothing is covered.
    var els = document.body.querySelectorAll("*");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.id === "aim-demo-bar" || el.hasAttribute("data-aim-shifted")) continue;
      var cs = getComputedStyle(el);
      if ((cs.position === "sticky" || cs.position === "fixed") && cs.top === "0px" && cs.bottom !== "0px") {
        el.style.top = BAR_H + "px";
        el.setAttribute("data-aim-shifted", "");
      }
    }
  }

  function mount() {
    if (document.getElementById("aim-demo-bar")) return;
    var host = document.createElement("div");
    host.id = "aim-demo-bar";
    var root = host.attachShadow({ mode: "open" });
    root.innerHTML = "<style>" + css + "</style>" + html;
    document.body.insertBefore(host, document.body.firstChild);

    var pad = document.createElement("style");
    pad.textContent = "body{padding-top:" + BAR_H + "px !important}html{scroll-padding-top:" + BAR_H + "px}";
    document.head.appendChild(pad);

    var btn = root.querySelector(".menu-btn");
    var panel = root.querySelector(".panel");
    function setOpen(open) {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(panel.hidden);
    });
    document.addEventListener("click", function (e) {
      if (e.target !== host) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

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
