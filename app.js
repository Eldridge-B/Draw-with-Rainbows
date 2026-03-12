(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var canvas = $("#canvas"), ctx = canvas.getContext("2d");
  var isDrawing = false, tool = "brush", color = "#000000";
  var size = 12, shape = "round", hue = 0, undoStack = [];
  var lastX = 0, lastY = 0, sDist = 0;
  function resize() {
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var r = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * r; canvas.height = rect.height * r;
    canvas.style.width = rect.width + "px"; canvas.style.height = rect.height + "px";
    ctx.scale(r, r); ctx.putImageData(data, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  }
  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function sColor() {
    if (color === "rainbow") { hue = (hue + 3) % 360; return "hsl(" + hue + ",90%,55%)"; }
    return color;
  }
  function pushUndo() {
    if (undoStack.length >= 15) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
  function drawStar(x, y, s) {
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = (i * 72 - 90) * Math.PI / 180, b = (i * 72 + 36 - 90) * Math.PI / 180;
      ctx[i ? "lineTo" : "moveTo"](x + Math.cos(a) * s, y + Math.sin(a) * s);
      ctx.lineTo(x + Math.cos(b) * s * 0.4, y + Math.sin(b) * s * 0.4);
    }
    ctx.closePath(); ctx.fill();
  }
  function drawHeart(x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y - s * 0.5, x - s, y - s * 0.5, x - s, y + s * 0.1);
    ctx.bezierCurveTo(x - s, y + s * 0.6, x, y + s, x, y + s);
    ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.6, x + s, y + s * 0.1);
    ctx.bezierCurveTo(x + s, y - s * 0.5, x, y - s * 0.5, x, y + s * 0.3);
    ctx.fill();
  }
  function drawFlower(x, y, s) {
    for (var i = 0; i < 5; i++) {
      var a = (i * 72 - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.45, s * 0.25, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, s * 0.25, 0, Math.PI * 2); ctx.fill();
  }
  function stamp(x, y) {
    ctx.fillStyle = sColor(); var s = size * 0.8;
    if (shape === "star") drawStar(x, y, s);
    else if (shape === "heart") drawHeart(x, y, s);
    else if (shape === "flower") drawFlower(x, y, s);
  }
  function hslToRgb(h) {
    var c = document.createElement("canvas").getContext("2d");
    c.fillStyle = "hsl(" + h + ",90%,55%)"; c.fillRect(0, 0, 1, 1);
    return c.getImageData(0, 0, 1, 1).data;
  }
  function floodFill(sx, sy) {
    var w = canvas.width, h = canvas.height, id = ctx.getImageData(0, 0, w, h), d = id.data;
    var r = window.devicePixelRatio || 1;
    var px = Math.round(sx * r), py = Math.round(sy * r);
    if (px < 0 || py < 0 || px >= w || py >= h) return;
    var ti = (py * w + px) * 4;
    var tr = d[ti], tg = d[ti + 1], tb = d[ti + 2], ta = d[ti + 3];
    var fr, fg, fb;
    if (color === "rainbow") {
      hue = (hue + 30) % 360; var p = hslToRgb(hue); fr = p[0]; fg = p[1]; fb = p[2];
    } else {
      var n = parseInt(color.slice(1), 16); fr = n >> 16; fg = (n >> 8) & 255; fb = n & 255;
    }
    if (tr === fr && tg === fg && tb === fb && ta === 255) return;
    var match = function (i) { return Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) + Math.abs(d[i + 3] - ta) <= 30; };
    var st = [px, py];
    while (st.length) {
      var cy = st.pop(), cx = st.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h || !match((cy * w + cx) * 4)) continue;
      var lx = cx, rx = cx;
      while (lx > 0 && match((cy * w + lx - 1) * 4)) lx--;
      while (rx < w - 1 && match((cy * w + rx + 1) * 4)) rx++;
      for (var i = lx; i <= rx; i++) {
        var j = (cy * w + i) * 4;
        d[j] = fr; d[j + 1] = fg; d[j + 2] = fb; d[j + 3] = 255;
        if (cy > 0) st.push(i, cy - 1);
        if (cy < h - 1) st.push(i, cy + 1);
      }
    }
    ctx.putImageData(id, 0, 0);
  }
  function onDown(e) {
    e.preventDefault(); var p = pos(e);
    if (tool === "fill") { pushUndo(); floodFill(p.x, p.y); save(); return; }
    pushUndo(); isDrawing = true; lastX = p.x; lastY = p.y; sDist = 0;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    if (shape === "round") {
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.strokeStyle = sColor(); ctx.lineWidth = size;
    } else { stamp(p.x, p.y); }
  }
  function onMove(e) {
    if (!isDrawing) return;
    e.preventDefault(); var p = pos(e);
    if (shape === "round") {
      ctx.strokeStyle = sColor(); ctx.lineWidth = size;
      ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    } else {
      var dx = p.x - lastX, dy = p.y - lastY;
      sDist += Math.sqrt(dx * dx + dy * dy);
      if (sDist >= size * 1.2) { stamp(p.x, p.y); sDist = 0; }
    }
    lastX = p.x; lastY = p.y;
  }
  function onUp() {
    if (!isDrawing) return;
    isDrawing = false; ctx.globalCompositeOperation = "source-over"; save();
  }
  function save() { try { localStorage.setItem("dwr", canvas.toDataURL()); } catch (e) {} }
  function restore() {
    try {
      var d = localStorage.getItem("dwr"); if (!d) return;
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
      img.src = d;
    } catch (e) {}
  }
  function setActive(group, el, attr) {
    group.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); b.setAttribute(attr, "false"); });
    el.classList.add("active"); el.setAttribute(attr, "true");
  }
  function wireGroup(sel, cls, key, attr, fn) {
    $(sel).addEventListener("click", function (e) {
      var btn = e.target.closest(cls); if (!btn) return;
      fn(btn); setActive($(sel), btn, attr);
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    resize(); restore();
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    $(".tools").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tool]");
      if (!btn) {
        var act = e.target.closest("[data-action]");
        if (!act) return;
        if (act.dataset.action === "undo" && undoStack.length) { ctx.putImageData(undoStack.pop(), 0, 0); save(); }
        if (act.dataset.action === "clear") $("#clear-confirm").hidden = false;
        return;
      }
      tool = btn.dataset.tool; setActive($(".tools"), btn, "aria-pressed");
    });
    wireGroup(".colors", ".color-btn", "color", "aria-selected", function (b) { color = b.dataset.color; });
    wireGroup(".sizes", ".size-btn", "size", "aria-selected", function (b) { size = parseInt(b.dataset.size, 10); });
    wireGroup(".shapes", ".shape-btn", "shape", "aria-selected", function (b) { shape = b.dataset.shape; });
    $("#clear-yes").addEventListener("click", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height); undoStack = [];
      try { localStorage.removeItem("dwr"); } catch (e) {} $("#clear-confirm").hidden = true;
    });
    $("#clear-no").addEventListener("click", function () { $("#clear-confirm").hidden = true; });
    window.addEventListener("resize", resize);
  });
})();
