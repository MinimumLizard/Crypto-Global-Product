// Small enhancements for the markets terminal, in plain JavaScript so they work on the live site and in the static
// previews alike. Every page is complete without this file: the server renders every row, link and label (hidden
// where needed); this only sorts, filters, shows and hides, and does arithmetic. Personal data (watchlist,
// portfolio, the visitor's starting point) stays in this browser's storage and is never sent anywhere.
(function () {
  "use strict";
  var store = {
    get: function (key, fallback) {
      try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: keep going */ }
    },
  };
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var usd = function (v, dp) {
    if (typeof v !== "number" || !isFinite(v)) return "—";
    var d = dp != null ? dp : v >= 1 ? 2 : v >= 0.01 ? 4 : 6;
    return "$" + v.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  var signedPct = function (f) {
    if (typeof f !== "number" || !isFinite(f)) return "—";
    var s = (Math.abs(f) * 100).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (f > 0 ? "+" : f < 0 ? "−" : "") + s + "%";
  };
  var tone = function (el, v) {
    el.classList.remove("up", "down", "flat");
    el.classList.add(v > 0 ? "up" : v < 0 ? "down" : "flat");
  };

  // --- Watchlist: stars on coin rows and coin pages ------------------------------------------------------------
  var WATCH = "ct.watchlist";
  function watched() { return store.get(WATCH, []); }
  function paintStars() {
    var w = watched();
    all("[data-star]").forEach(function (b) {
      var on = w.indexOf(b.getAttribute("data-star")) >= 0;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "★" : "☆";
      b.title = b.getAttribute(on ? "data-label-on" : "data-label-off") || "";
    });
    all("[data-watch-row]").forEach(function (row) {
      row.hidden = w.indexOf(row.getAttribute("data-watch-row")) < 0;
    });
    all("[data-watch-empty]").forEach(function (el) { el.hidden = w.length > 0; });
    filterTables();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-star]");
    if (!b) return;
    e.preventDefault();
    var slug = b.getAttribute("data-star");
    var w = watched();
    var i = w.indexOf(slug);
    if (i >= 0) w.splice(i, 1); else w.push(slug);
    store.set(WATCH, w);
    paintStars();
  });

  // --- Coin tables: sort by a column, search, watchlist only ---------------------------------------------------
  function filterTables() {
    var w = watched();
    all("table[data-coins]").forEach(function (table) {
      var id = table.id;
      var q = (document.querySelector('[data-filter="' + id + '"]') || {}).value || "";
      q = q.toLowerCase().replace(/^\s+|\s+$/g, "");
      var only = document.querySelector('[data-watch-only="' + id + '"]');
      var onlyOn = only && only.checked;
      all("tbody tr", table).forEach(function (tr) {
        var text = tr.getAttribute("data-search") || "";
        var slug = tr.getAttribute("data-slug");
        tr.hidden = (q && text.indexOf(q) < 0) || (onlyOn && w.indexOf(slug) < 0);
      });
    });
  }
  // Listeners sit on the document (not on the elements), so they keep working if the page's own code redraws part
  // of it.
  document.addEventListener("input", function (e) { if (e.target.matches && e.target.matches("[data-filter]")) filterTables(); });
  document.addEventListener("change", function (e) { if (e.target.matches && e.target.matches("[data-watch-only]")) filterTables(); });
  function sortBy(th) {
    var table = th.closest("table");
    var col = Number(th.getAttribute("data-col"));
    var dir = th.getAttribute("aria-sort") === "descending" ? 1 : -1;
    all("th[data-col]", table).forEach(function (h) { h.removeAttribute("aria-sort"); });
    th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
    var body = table.tBodies[0];
    var rows = all("tr", body);
    rows.sort(function (a, b) {
      var va = parseFloat(a.cells[col].getAttribute("data-v"));
      var vb = parseFloat(b.cells[col].getAttribute("data-v"));
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return dir * (va - vb);
    });
    rows.forEach(function (r) { body.appendChild(r); });
  }
  var sortHeader = function (e) { return e.target.closest && e.target.closest("table[data-coins] th[data-col]"); };
  document.addEventListener("click", function (e) { var th = sortHeader(e); if (th) sortBy(th); });
  document.addEventListener("keydown", function (e) {
    var th = sortHeader(e);
    if (th && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); sortBy(th); }
  });

  // --- Portfolio: amounts and prices paid, kept in this browser -------------------------------------------------
  var PORT = "ct.portfolio";
  function renderPortfolio() {
    var box = portBox();
    if (!box) return;
    var p = store.get(PORT, {});
    var total = 0, cost = 0, costKnown = true, any = false;
    all("[data-port-row]", box).forEach(function (row) {
      var slug = row.getAttribute("data-port-row");
      var entry = p[slug];
      row.hidden = !entry;
      if (!entry) return;
      any = true;
      var price = parseFloat(row.getAttribute("data-price"));
      var value = entry.amount * price;
      total += value;
      if (entry.paid > 0) cost += entry.amount * entry.paid; else costKnown = false;
      row.querySelector("[data-amount]").value = entry.amount;
      row.querySelector("[data-paid]").value = entry.paid > 0 ? entry.paid : "";
      row.querySelector("[data-value]").textContent = usd(value, 2);
      var change = row.querySelector("[data-change]");
      if (entry.paid > 0) { var g = price / entry.paid - 1; change.textContent = signedPct(g); tone(change, g); }
      else { change.textContent = "—"; change.className = "num"; }
    });
    all("[data-port-row]", box).forEach(function (row) {
      var entry = p[row.getAttribute("data-port-row")];
      if (!entry) return;
      var value = entry.amount * parseFloat(row.getAttribute("data-price"));
      row.querySelector("[data-share]").textContent = total > 0 ? (value / total * 100).toFixed(1) + "%" : "—";
    });
    box.querySelector("[data-port-empty]").hidden = any;
    box.querySelector("[data-port-table]").hidden = !any;
    box.querySelector("[data-total]").textContent = usd(total, 2);
    var tc = box.querySelector("[data-total-change]");
    if (any && costKnown && cost > 0) { var gt = total / cost - 1; tc.textContent = signedPct(gt); tone(tc, gt); }
    else { tc.textContent = "—"; tc.classList.remove("up", "down", "flat"); }
    all("option[data-coin]", box).forEach(function (o) { o.disabled = !!p[o.value]; });
  }
  function portBox() { return document.querySelector("[data-portfolio]"); }
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.matches || !f.matches("[data-port-add]")) return;
    e.preventDefault();
    var slug = f.elements.coin.value;
    var amount = parseFloat(f.elements.amount.value);
    var paid = parseFloat(f.elements.paid.value);
    if (!slug || !(amount > 0)) return;
    var p = store.get(PORT, {});
    p[slug] = { amount: amount, paid: paid > 0 ? paid : 0 };
    store.set(PORT, p);
    f.reset();
    renderPortfolio();
  });
  document.addEventListener("change", function (e) {
    var row = e.target.closest && e.target.closest("[data-port-row]");
    if (!row) return;
    var p = store.get(PORT, {});
    var slug = row.getAttribute("data-port-row");
    var amount = parseFloat(row.querySelector("[data-amount]").value);
    var paid = parseFloat(row.querySelector("[data-paid]").value);
    if (!(amount > 0)) delete p[slug]; else p[slug] = { amount: amount, paid: paid > 0 ? paid : 0 };
    store.set(PORT, p);
    renderPortfolio();
  });
  document.addEventListener("click", function (e) {
    var rm = e.target.closest && e.target.closest("[data-port-remove]");
    var clear = e.target.closest && e.target.closest("[data-port-clear]");
    if (!rm && !clear) return;
    var p = clear ? {} : store.get(PORT, {});
    if (rm) delete p[rm.getAttribute("data-port-remove")];
    store.set(PORT, p);
    renderPortfolio();
  });

  // --- Search: filter the server-rendered list of coins, charts and lessons -------------------------------------
  function searchList(input) { return document.getElementById(input.getAttribute("data-search-input")); }
  function runSearch(input) {
    var list = searchList(input);
    if (!list) return;
    var q = input.value.toLowerCase().replace(/^\s+|\s+$/g, "");
    var shown = 0;
    all("li", list).forEach(function (li) {
      var hit = q.length > 0 && (li.getAttribute("data-text") || "").indexOf(q) >= 0 && shown < 8;
      li.hidden = !hit;
      if (hit) shown++;
    });
    list.hidden = shown === 0;
  }
  document.addEventListener("input", function (e) { if (e.target.matches && e.target.matches("[data-search-input]")) runSearch(e.target); });
  document.addEventListener("keydown", function (e) {
    var input = e.target;
    if (!input.matches || !input.matches("[data-search-input]")) return;
    if (e.key === "Enter") {
      var list = searchList(input);
      var first = list && all("li", list).filter(function (li) { return !li.hidden; })[0];
      if (first) { e.preventDefault(); first.querySelector("a").click(); }
    }
    if (e.key === "Escape") { input.value = ""; runSearch(input); }
  });
  document.addEventListener("click", function (e) {
    all("[data-search-input]").forEach(function (input) {
      var list = searchList(input);
      if (list && !input.parentNode.contains(e.target)) list.hidden = true;
    });
  });

  // --- The visitor's starting point: remembered on /start pages, offered again on the front page ---------------
  var remember = document.querySelector("[data-remember-path]");
  if (remember) store.set("ct.path", remember.getAttribute("data-remember-path"));
  function showContinue() {
    var cont = document.querySelector("[data-continue]");
    if (!cont) return;
    var path = store.get("ct.path", null);
    var link = path && cont.querySelector('[data-continue-path="' + path + '"]');
    if (link) { link.hidden = false; cont.hidden = false; }
  }

  // Show the controls that need this script and paint the visitor's own state. Done once now and again shortly
  // after, so the page still shows them if its own code redraws part of it once it has loaded.
  function paint() {
    all("[data-needs-js]").forEach(function (el) { el.hidden = false; });
    showContinue();
    renderPortfolio();
    paintStars();
  }
  paint();
  window.addEventListener("load", function () { setTimeout(paint, 300); });
})();
