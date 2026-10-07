/* =====================================================================
   3d.js — دنیای سه‌بعدی «کد» برای سایت دانیال مرادی (danyalcode.ir)
   - یک دنیای Three.js ثابت پشت همه‌ی صفحه‌ها؛ با اسکرول، دوربین در یک تونل
     از پنجره‌های کدِ شبیه VS Code، علامت‌های سه‌بعدی </> { } => ، مکعب‌های کد
     و بارانِ کد حرکت می‌کند.
   - اول سایت (صفحه‌ی اصلی): عکس دانیال داخل یک پنجره‌ی سه‌بعدی VS Code
     قرار دارد و با ماوس کج می‌شود.
   - کارت‌های شیشه‌ای با ماوس کج می‌شوند (tilt سه‌بعدی).
   - بدون تغییر در HTML و script.js؛ فقط همین فایل + Three.js (r128).
   - اگر WebGL نباشد یا کاربر «کاهش حرکت» را روشن کرده باشد، به‌صورت امن عمل می‌کند.
   ===================================================================== */
(function () {
  "use strict";
  if (window.__dm3d) return;
  window.__dm3d = true;

  var PHOTO_URL = "assets/images/hero-bg.webp";

  var css = [
    "#dm3d{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;transition:opacity .6s}",
    "main,.site-footer,.free-cta{position:relative;z-index:1}",
    /* وقتی عکس داخل دنیای سه‌بعدی نشان داده می‌شود، عکس CSS و کارت DM کنار هم نمایش داده نشوند */
    ".dm3d-photo .hero__bg{background:none!important}",
    ".dm3d-photo .hero__bg::after{background:linear-gradient(to left,rgba(5,6,10,.62) 0%,rgba(5,6,10,.18) 55%,transparent 100%)!important}",
    ".dm3d-photo .id-card{visibility:hidden}",
    "@media(max-width:1080px){.dm3d-photo .hero__bg::after{background:linear-gradient(to bottom,rgba(5,6,10,.55),rgba(5,6,10,.2) 70%,transparent)!important}}",
    ".dm3d-tilt{will-change:rotate}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var MONO = 'Consolas, "SF Mono", Menlo, "DejaVu Sans Mono", "Courier New", monospace';

  /* ------------------------------------------------------------------
     رنگ‌بندی هایلایت (الهام‌گرفته از VS Code Dark+)
     ------------------------------------------------------------------ */
  var C = {
    kw: "#c586c0", fn: "#dcdcaa", str: "#ce9178", num: "#b5cea8", cmt: "#6a9955",
    cst: "#569cd6", cls: "#4ec9b0", id: "#9cdcfe", pun: "#d4d4d4", tag: "#569cd6", green: "#4ade80"
  };
  var KW = /^(import|from|export|const|let|var|function|async|await|return|if|else|for|while|new|def|class|in|of|as|try|catch|throw|print)$/;
  var CST = /^(true|false|null|undefined|Infinity|None|True|False|this|self)$/;
  var RE_GEN = /(\/\/.*)|("[^"]*"|'[^']*'|`[^`]*`)|(<\/?[A-Za-z!][\w-]*|\/?>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;
  var RE_PY = /(#.*)|("[^"]*"|'[^']*')|(<\/?[A-Za-z!][\w-]*|\/?>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;

  function tokenize(line, lang) {
    var out = [], re = lang === "py" ? RE_PY : RE_GEN, m;
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      var s = m[0], col;
      if (m[1]) col = C.cmt;
      else if (m[2]) col = C.str;
      else if (m[3]) col = C.tag;
      else if (m[4]) col = C.num;
      else if (m[5]) {
        var nx = line.charAt(re.lastIndex);
        if (KW.test(s)) col = C.kw;
        else if (CST.test(s)) col = C.cst;
        else if (nx === "(") col = C.fn;
        else if (/^[A-Z]/.test(s)) col = C.cls;
        else col = C.id;
      } else col = C.pun;
      out.push([s, col]);
      if (s.length === 0) re.lastIndex++;
    }
    return out;
  }

  function rr(x, px, py, w, h, r) {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  }

  function trafficLights(x, y) {
    ["#ff5f56", "#ffbd2e", "#27c93f"].forEach(function (c, i) {
      x.fillStyle = c; x.beginPath(); x.arc(30 + i * 24, y, 7, 0, 6.2832); x.fill();
    });
  }

  /* ------------------------------------------------------------------
     نمونه‌کدها برای پنجره‌ها
     ------------------------------------------------------------------ */
  var SNIPS = [
    { file: "app.js", lang: "js", edge: "#7c5cfc", hl: 5, code:
      'import { build } from "danyalcode";\n\nconst idea = await ask("What do you want?");\n\nasync function makeIt(idea) {\n  const plan = think(idea);\n  const site = await build(plan);\n  notify(user, "Done!");\n  return site;\n}\n\nmakeIt(idea); // ship it' },
    { file: "main.py", lang: "py", edge: "#4c8dff", hl: 3, code:
      'from ai import Danyal\n\ndef build(idea: str):\n    code = Danyal().write(idea)\n    for step in code.steps:\n        print("building", step)\n    return code.deploy()\n\n# idea -> reality\nbuild("my dream site")' },
    { file: "index.html", lang: "js", edge: "#d4af6a", hl: 6, code:
      '<!DOCTYPE html>\n<html lang="fa" dir="rtl">\n  <head>\n    <title>Danyal Code</title>\n  </head>\n  <body>\n    <h1 class="hero">Hello</h1>\n    <script src="3d.js"></script>\n  </body>\n</html>' },
    { file: "style.css", lang: "js", edge: "#7c5cfc", hl: 3, code:
      '.hero {\n  display: grid;\n  color: #7c5cfc;\n  transform: rotateY(12deg);\n  animation: float 6s infinite;\n}\n\n.card:hover {\n  transform: scale(1.05);\n}' },
    { file: "terminal", lang: "sh", edge: "#4ade80", hl: -1, code:
      '$ git add .\n$ git commit -m "ship it"\n$ git push origin main\n> Deploying to danyalcode.ir\n> 458 projects live\n> Build passed' },
    { file: "package.json", lang: "js", edge: "#4c8dff", hl: 2, code:
      '{\n  "name": "danyalcode",\n  "version": "3.0.0",\n  "projects": 458,\n  "ai": true,\n  "coffee": Infinity\n}' }
  ];
  var SNIP_DEV = { file: "me.js", lang: "js", edge: "#7c5cfc", hl: 1, code:
    'const dev = {\n  name: "Danial Moradi",\n  stack: ["JS", "Python", "AI"],\n  coffee: Infinity,\n};' };
  var SNIP_SHIP = { file: "terminal", lang: "sh", edge: "#4ade80", hl: -1, code:
    '$ npm run build\n> compiled successfully\n$ deploy --prod\n> live on danyalcode.ir' };

  var GLYPHS = [
    ["</>", "#7c5cfc"], ["{ }", "#d4af6a"], ["( )", "#4c8dff"], ["[ ]", "#4ade80"], ["=>", "#c586c0"],
    ["#", "#4c8dff"], ["//", "#6a9955"], ["&&", "#d4af6a"], ["0 1", "#4ade80"], [";", "#c586c0"],
    ["</", "#7c5cfc"], ["/>", "#4c8dff"], ["++", "#d4af6a"]
  ];

  /* ------------------------------------------------------------------
     بخش اول: دنیای سه‌بعدی
     ------------------------------------------------------------------ */
  function initWorld() {
    if (!window.THREE) return;
    var T = window.THREE;
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var coarse = matchMedia("(pointer: coarse)").matches;
    var file = location.pathname.split("/").pop() || "index.html";
    var calm = /^(blog-|learn-|results|search)/.test(file); // صفحه‌های خواندنی: ملایم‌تر

    var canvas = document.createElement("canvas");
    canvas.id = "dm3d";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);

    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !coarse, alpha: true, powerPreference: "high-performance" });
    } catch (e) { canvas.remove(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));

    var PURPLE = 0x7c5cfc, BLUE = 0x4c8dff, GOLD = 0xd4af6a;
    var L = 58; // طول مسیر دوربین
    var scene = new T.Scene();
    scene.fog = new T.FogExp2(0x05060a, 0.022);
    var camera = new T.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.z = 6;

    var maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1);
    var mipOK = !!renderer.capabilities.isWebGL2;
    function tex(cv) {
      var t = new T.CanvasTexture(cv);
      if (!mipOK) { t.minFilter = T.LinearFilter; t.generateMipmaps = false; }
      t.anisotropy = maxAniso;
      return t;
    }
    function basic(map, opacity, extra) {
      var o = { map: map, transparent: true, opacity: opacity == null ? 1 : opacity, side: T.DoubleSide };
      if (extra) for (var k in extra) o[k] = extra[k];
      var m = new T.MeshBasicMaterial(o);
      m.userData.base = m.opacity;
      return m;
    }

    /* ---------- بافت پنجره‌ی کد (شبیه VS Code) ---------- */
    function makePanel(sn) {
      var lines = sn.code.split("\n"), W = 760, LH = 30, top = 92;
      var H = top + lines.length * LH + 34;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var x = cv.getContext("2d");
      rr(x, 2, 2, W - 4, H - 4, 18); x.fillStyle = "#1e1e1e"; x.fill();
      x.save(); rr(x, 2, 2, W - 4, H - 4, 18); x.clip();
      x.fillStyle = "#323233"; x.fillRect(0, 0, W, 46);
      trafficLights(x, 23);
      x.fillStyle = "#9da0a6"; x.font = "18px " + MONO; x.textAlign = "center";
      x.fillText(sn.file + " — danyalcode", W / 2, 29);
      x.fillStyle = "#252526"; x.fillRect(0, 46, W, 40);
      x.fillStyle = "#1e1e1e"; x.fillRect(14, 46, 210, 40);
      x.fillStyle = sn.edge; x.fillRect(14, 46, 210, 2);
      x.beginPath(); x.arc(36, 67, 6, 0, 6.2832); x.fill();
      x.fillStyle = "#e6e6e6"; x.textAlign = "left"; x.font = "18px " + MONO;
      x.fillText(sn.file, 52, 73);
      x.font = "20px " + MONO;
      lines.forEach(function (ln, i) {
        var y = top + i * LH + 22;
        if (i === sn.hl) { x.fillStyle = "#2a2d2e"; x.fillRect(0, y - 22, W, LH); }
        x.fillStyle = i === sn.hl ? "#c6c6c6" : "#6e7681"; x.textAlign = "right";
        x.fillText(String(i + 1), 40, y);
        x.textAlign = "left";
        var px = 62;
        if (sn.lang === "sh") {
          if (ln.charAt(0) === "$") {
            x.fillStyle = C.green; x.fillText("$", px, y); px += x.measureText("$ ").width;
            x.fillStyle = "#e6e6e6"; x.fillText(ln.slice(2), px, y);
          } else {
            x.fillStyle = "#7ee0a1"; x.fillText(ln, px, y);
          }
        } else {
          tokenize(ln, sn.lang).forEach(function (tk) {
            x.fillStyle = tk[1]; x.fillText(tk[0], px, y); px += x.measureText(tk[0]).width;
          });
        }
      });
      x.restore();
      rr(x, 3, 3, W - 6, H - 6, 18); x.lineWidth = 3; x.strokeStyle = sn.edge; x.globalAlpha = 0.85; x.stroke();
      return { tex: tex(cv), w: W, h: H };
    }

    /* ---------- علامت‌های سه‌بعدی (</> { } => ...) با لایه‌های روی هم ---------- */
    function glyphCanvas(text, color, dim) {
      var cv = document.createElement("canvas"); cv.width = 256; cv.height = 256;
      var x = cv.getContext("2d");
      var size = text.length <= 1 ? 200 : text.length === 2 ? 150 : 108;
      x.font = "bold " + size + "px " + MONO; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = color;
      x.fillText(text, 128, 132);
      if (dim < 1) {
        x.globalCompositeOperation = "source-atop";
        x.fillStyle = "rgba(0,0,0," + (1 - dim) + ")";
        x.fillRect(0, 0, 256, 256);
      }
      return cv;
    }
    var glyphKits = [];
    GLYPHS.forEach(function (gl) {
      glyphKits.push({ face: tex(glyphCanvas(gl[0], gl[1], 1)), back: tex(glyphCanvas(gl[0], gl[1], 0.3)) });
    });
    var glyphGeo = new T.PlaneGeometry(1.2, 1.2);
    function makeGlyph(kitIndex, collect) {
      var g = new T.Group(), kit = glyphKits[kitIndex % glyphKits.length], LAY = 6, step = 0.045, i;
      for (i = 0; i < LAY; i++) {
        var m = basic(i === LAY - 1 ? kit.face : kit.back, 1, { alphaTest: 0.3 });
        var mesh = new T.Mesh(glyphGeo, m);
        mesh.position.z = (i - (LAY - 1) / 2) * step;
        g.add(mesh);
        if (collect) collect.push(m);
      }
      return g;
    }

    /* ---------- مکعب کد ---------- */
    function cubeFace(kind, color) {
      var cv = document.createElement("canvas"); cv.width = 512; cv.height = 512;
      var x = cv.getContext("2d");
      x.fillStyle = "#1e1e1e"; x.fillRect(0, 0, 512, 512);
      x.lineWidth = 10; x.strokeStyle = color; x.strokeRect(5, 5, 502, 502);
      if (kind === 0) {
        x.fillStyle = color; x.font = "bold 190px " + MONO; x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText("</>", 256, 262);
      } else {
        var sn = SNIPS[kind % SNIPS.length], lines = sn.code.split("\n").slice(0, 11);
        x.font = "26px " + MONO; x.textBaseline = "alphabetic";
        lines.forEach(function (ln, i) {
          var px = 30, y = 56 + i * 40;
          x.textAlign = "left";
          tokenize(ln.slice(0, 26), sn.lang === "sh" ? "js" : sn.lang).forEach(function (tk) {
            x.fillStyle = tk[1]; x.fillText(tk[0], px, y); px += x.measureText(tk[0]).width;
          });
        });
      }
      return new T.CanvasTexture(cv);
    }
    var cubeEdgeCols = ["#7c5cfc", "#4c8dff", "#d4af6a", "#4ade80", "#c586c0", "#7c5cfc"];
    var cubeMatSet = [];
    for (var ci = 0; ci < 6; ci++) cubeMatSet.push(new T.MeshBasicMaterial({ map: cubeFace(ci, cubeEdgeCols[ci]) }));
    function makeCube(size) {
      var g = new T.Group();
      g.add(new T.Mesh(new T.BoxGeometry(size, size, size), cubeMatSet));
      var edges = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(size * 1.04, size * 1.04, size * 1.04)),
        new T.LineBasicMaterial({ color: PURPLE, transparent: true, opacity: 0.85 }));
      g.add(edges);
      return g;
    }

    /* ---------- بارانِ کد ---------- */
    var rainChars = "01{}<>/;=()[]$#&|!?+-*".split("");
    function rainTex(color, seed) {
      var rn = rng(seed), cv = document.createElement("canvas"); cv.width = 64; cv.height = 512;
      var x = cv.getContext("2d");
      x.font = "bold 20px " + MONO; x.textAlign = "center";
      for (var i = 0; i < 16; i++) {
        x.globalAlpha = 0.15 + (i / 16) * 0.85;
        x.fillStyle = color;
        x.fillText(rainChars[Math.floor(rn() * rainChars.length)], 32, 22 + i * 30);
      }
      var t = new T.CanvasTexture(cv);
      t.wrapT = T.RepeatWrapping; t.anisotropy = 1;
      return t;
    }

    /* ---------- قهرمان صفحه: عکس داخل پنجره‌ی VS Code ---------- */
    var WIN_W = 5, WIN_H = 3.5, CW = 1000, CH = 700;
    var PH = { x: 58, y: 102, w: 864, h: 540 }; // محل عکس داخل بوم پنجره
    var heroEl = document.querySelector(".hero .id-card");
    var wantPhoto = !!heroEl && location.protocol !== "file:";
    var hero = null, heroMats = [], heroOpacity = 1, scan = null, photoMesh = null;
    var rootEl = document.documentElement;
    var wide = true, HZ = -1;

    function windowChrome() {
      var cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
      var x = cv.getContext("2d"), rn = rng(11), i;
      rr(x, 3, 3, CW - 6, CH - 6, 24); x.fillStyle = "#1e1e1e"; x.fill();
      x.save(); rr(x, 3, 3, CW - 6, CH - 6, 24); x.clip();
      x.fillStyle = "#323233"; x.fillRect(0, 0, CW, 48);
      trafficLights(x, 24);
      x.fillStyle = "#9da0a6"; x.font = "19px " + MONO; x.textAlign = "center";
      x.fillText("danyal.jsx — danyalcode.ir", CW / 2, 31);
      x.fillStyle = "#333333"; x.fillRect(0, 48, 44, CH - 48 - 36);
      for (i = 0; i < 5; i++) {
        x.strokeStyle = i === 0 ? "#ffffff" : "#858585"; x.lineWidth = 2.5;
        rr(x, 12, 70 + i * 52, 20, 20, 4); x.stroke();
      }
      x.fillStyle = "#ffffff"; x.fillRect(0, 62, 3, 36);
      x.fillStyle = "#252526"; x.fillRect(44, 48, CW - 44, 42);
      x.fillStyle = "#1e1e1e"; x.fillRect(44, 48, 190, 42);
      x.fillStyle = "#7c5cfc"; x.fillRect(44, 48, 190, 2);
      x.font = "17px " + MONO; x.textAlign = "left";
      x.fillStyle = "#4c8dff"; x.fillText("JS", 58, 76);
      x.fillStyle = "#e6e6e6"; x.fillText("danyal.jsx", 88, 76);
      x.fillStyle = "#858585"; x.fillText("about.md", 254, 76);
      x.fillStyle = "#1e1e1e"; x.fillRect(44, 90, CW - 44, CH - 90 - 36);
      // مینی‌مپ
      for (i = 0; i < 38; i++) {
        var lw = 10 + rn() * 38, lx = 938 + (rn() < 0.3 ? 8 : 0);
        x.globalAlpha = 0.4;
        x.fillStyle = [C.kw, C.id, C.str, C.fn, C.cst][Math.floor(rn() * 5)];
        x.fillRect(lx, 110 + i * 13, lw, 5);
      }
      x.globalAlpha = 1;
      x.strokeStyle = "#3c3c3c"; x.lineWidth = 2;
      x.strokeRect(PH.x - 3, PH.y - 3, PH.w + 6, PH.h + 6);
      var sg2 = x.createLinearGradient(0, 0, CW, 0);
      sg2.addColorStop(0, "#7c5cfc"); sg2.addColorStop(1, "#4c8dff");
      x.fillStyle = sg2; x.fillRect(0, CH - 36, CW, 36);
      x.fillStyle = "#ffffff"; x.font = "16px " + MONO;
      x.fillText("main*   0 errors   Ln 1, Col 1", 18, CH - 12);
      x.textAlign = "right"; x.fillText("UTF-8   JavaScript   Prettier", CW - 18, CH - 12);
      x.restore();
      rr(x, 4, 4, CW - 8, CH - 8, 24); x.lineWidth = 4;
      var eg = x.createLinearGradient(0, 0, CW, CH);
      eg.addColorStop(0, "#7c5cfc"); eg.addColorStop(0.5, "#4c8dff"); eg.addColorStop(1, "#d4af6a");
      x.strokeStyle = eg; x.stroke();
      return tex(cv);
    }

    function placeHero() {
      if (!hero) return;
      var w = window.innerWidth, h = window.innerHeight;
      var dist = 6 - HZ, halfH = Math.tan(25 * Math.PI / 180) * dist, halfW = halfH * camera.aspect;
      var rect = heroEl.getBoundingClientRect(), cx, cy, ww;
      if (wide && rect.width > 80) {
        cx = rect.left + rect.width / 2; cy = rect.top + window.scrollY + rect.height / 2;
        ww = rect.width * 1.04; heroOpacity = 1;
      } else {
        cx = w / 2; cy = h * 0.3; ww = w * 0.92; heroOpacity = 0.4;
      }
      var worldW = ww / w * 2 * halfW;
      worldW = Math.min(worldW, (h * 0.78) / h * 2 * halfH / (WIN_H / WIN_W));
      hero.scale.setScalar(worldW / WIN_W);
      hero.userData.bx = (cx / w - 0.5) * 2 * halfW;
      hero.userData.by = -(cy / h - 0.5) * 2 * halfH;
      hero.position.set(hero.userData.bx, hero.userData.by, HZ);
    }

    function buildHero(photoTex) {
      hero = new T.Group();
      var win = new T.Mesh(new T.PlaneGeometry(WIN_W, WIN_H), basic(windowChrome(), 1));
      hero.add(win); heroMats.push(win.material);

      // درخشش پشت پنجره
      var gc = document.createElement("canvas"); gc.width = gc.height = 256;
      var gx = gc.getContext("2d"), gg = gx.createRadialGradient(128, 128, 10, 128, 128, 128);
      gg.addColorStop(0, "rgba(124,92,252,.75)"); gg.addColorStop(0.55, "rgba(76,141,255,.25)"); gg.addColorStop(1, "rgba(76,141,255,0)");
      gx.fillStyle = gg; gx.fillRect(0, 0, 256, 256);
      var glow = new T.Mesh(new T.PlaneGeometry(WIN_W * 1.7, WIN_H * 1.9),
        basic(new T.CanvasTexture(gc), 0.55, { blending: T.AdditiveBlending, depthWrite: false }));
      glow.position.z = -0.25; hero.add(glow); heroMats.push(glow.material);

      // عکس
      var pw = PH.w / CW * WIN_W, ph = PH.h / CH * WIN_H;
      var px = ((PH.x + PH.w / 2) / CW - 0.5) * WIN_W, py = -((PH.y + PH.h / 2) / CH - 0.5) * WIN_H;
      photoMesh = new T.Mesh(new T.PlaneGeometry(pw, ph), basic(photoTex, 1));
      photoMesh.position.set(px, py, 0.02); hero.add(photoMesh); heroMats.push(photoMesh.material);

      // خط اسکن
      var sc = document.createElement("canvas"); sc.width = 8; sc.height = 64;
      var sx = sc.getContext("2d"), sgr = sx.createLinearGradient(0, 0, 0, 64);
      sgr.addColorStop(0, "rgba(76,141,255,0)"); sgr.addColorStop(0.5, "rgba(124,180,255,.9)"); sgr.addColorStop(1, "rgba(76,141,255,0)");
      sx.fillStyle = sgr; sx.fillRect(0, 0, 8, 64);
      scan = new T.Mesh(new T.PlaneGeometry(pw, 0.35), basic(new T.CanvasTexture(sc), 0.28, { blending: T.AdditiveBlending, depthWrite: false }));
      scan.position.set(px, py, 0.03); scan.userData = { py: py, ph: ph };
      hero.add(scan); heroMats.push(scan.material);

      // کارت‌های کد جلوتر از عکس (عمق = پارالاکس)
      var a = makePanel(SNIP_DEV), b = makePanel(SNIP_SHIP);
      var ma = basic(a.tex, 1), mb = basic(b.tex, 1);
      var wa = 2.3, wb = 2.0;
      var pa = new T.Mesh(new T.PlaneGeometry(wa, wa * a.h / a.w), ma);
      pa.position.set(WIN_W * 0.34, -WIN_H * 0.36, 0.75); pa.rotation.y = -0.12;
      var pb = new T.Mesh(new T.PlaneGeometry(wb, wb * b.h / b.w), mb);
      pb.position.set(-WIN_W * 0.38, WIN_H * 0.38, 0.5); pb.rotation.y = 0.14;
      hero.add(pa); hero.add(pb); heroMats.push(ma, mb);

      // علامت‌های سه‌بعدی دور پنجره
      var g1 = makeGlyph(0, heroMats), g2 = makeGlyph(1, heroMats), g3 = makeGlyph(4, heroMats);
      g1.position.set(WIN_W * 0.5, WIN_H * 0.5, 1.0); g1.scale.setScalar(1.15);
      g2.position.set(-WIN_W * 0.52, -WIN_H * 0.42, 0.9); g2.scale.setScalar(0.9);
      g3.position.set(WIN_W * 0.12, WIN_H * 0.56, 0.6); g3.scale.setScalar(0.6);
      hero.add(g1); hero.add(g2); hero.add(g3);
      hero.userData = { glyphs: [g1, g2, g3], bx: 0, by: 0 };
      hero.rotation.order = "YXZ";
      scene.add(hero);
      placeHero();
    }

    /* ---------- مکعب و علامت پایانی (کنار فوتر) ---------- */
    var endCube = makeCube(2.7);
    endCube.position.set(0, 0, 6 - L - 7);
    scene.add(endCube);
    var endGlyph = makeGlyph(0);
    endGlyph.scale.setScalar(2.3); endGlyph.position.set(0, 0, 6 - L - 11);
    scene.add(endGlyph);

    /* ---------- بارانِ کد ---------- */
    var rains = [], rainCols = ["#4ade80", "#7c5cfc", "#4c8dff"];
    var rainTexs = rainCols.map(function (c, i) { return rainTex(c, 31 + i * 7); });
    var r = rng(7), i;
    var RAIN = coarse ? 12 : 26;
    for (i = 0; i < RAIN; i++) {
      var rt = rainTexs[i % 3].clone(); rt.needsUpdate = true;
      var rm = new T.Mesh(new T.PlaneGeometry(0.5, 12),
        new T.MeshBasicMaterial({ map: rt, transparent: true, opacity: 0.38, depthWrite: false, blending: T.AdditiveBlending }));
      rm.userData = { side: i % 2 ? 1 : -1, ax: 5.5 + r() * 9, y: (r() - 0.5) * 8, sp: 0.15 + r() * 0.35 };
      rm.position.z = -4 - (i / RAIN) * (L + 8) - r() * 4;
      rt.offset.y = r();
      scene.add(rm); rains.push(rm);
    }

    /* ---------- اشکال شناور: پنجره‌های کد، علامت‌های سه‌بعدی، مکعب‌های کد ---------- */
    var floaters = [];
    var panelPool = SNIPS.map(makePanel);
    var COUNT = coarse ? 20 : 34;
    var panelsMade = 0, glyphsMade = 0;
    for (i = 0; i < COUNT; i++) {
      var kind = i % 5 === 0 ? "panel" : i % 5 === 3 ? "cube" : i % 7 === 0 ? "panel" : "glyph";
      var side = i % 2 ? 1 : -1, obj;
      if (kind === "panel") {
        var pp = panelPool[panelsMade++ % panelPool.length];
        var pw2 = 2.6 + r() * 1.0;
        obj = new T.Mesh(new T.PlaneGeometry(pw2, pw2 * pp.h / pp.w), basic(pp.tex, 0.92));
      } else if (kind === "cube") {
        obj = makeCube(0.9 + r() * 0.5);
      } else {
        obj = makeGlyph(glyphsMade++ + Math.floor(r() * 3));
        obj.scale.setScalar(0.8 + r() * 0.9);
      }
      obj.userData = { kind: kind, side: side, ax: 3.4 + r() * 5.2, y: (r() - 0.5) * 8.5,
        z: -6 - (i / COUNT) * (L + 6) - r() * 3, rs: (r() - 0.5) * 0.8, ph: r() * 6.28 };
      scene.add(obj); floaters.push(obj);
    }

    // --- ستاره‌ها (رنگی مثل سینتکس)
    var N = coarse ? 800 : 1500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    var palette = [new T.Color(0xdfe6ff), new T.Color(PURPLE), new T.Color(BLUE), new T.Color(GOLD)];
    for (i = 0; i < N; i++) {
      pos[i * 3] = (r() - 0.5) * 70;
      pos[i * 3 + 1] = (r() - 0.5) * 44;
      pos[i * 3 + 2] = 18 - r() * (L + 70);
      var pc = palette[r() < 0.55 ? 0 : 1 + Math.floor(r() * 3)];
      col[i * 3] = pc.r; col[i * 3 + 1] = pc.g; col[i * 3 + 2] = pc.b;
    }
    var sg = new T.BufferGeometry();
    sg.setAttribute("position", new T.BufferAttribute(pos, 3));
    sg.setAttribute("color", new T.BufferAttribute(col, 3));
    var stars = new T.Points(sg, new T.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
    scene.add(stars);

    // --- تم روشن/تیره
    function light() { return document.documentElement.getAttribute("data-theme") === "light"; }
    function applyTheme() {
      var l = light();
      var bg = l ? getComputedStyle(document.body).backgroundColor : "#05060a";
      scene.fog.color.set(bg);
      stars.material.opacity = l ? 0.5 : 0.85;
      canvas.style.opacity = String((calm ? 0.55 : 1) * (l ? 0.75 : 1));
    }
    applyTheme();
    new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // --- چیدمان بر اساس اندازه‌ی صفحه
    function layout() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      wide = camera.aspect > 1.1;
      camera.updateProjectionMatrix();
      placeHero();
    }
    window.addEventListener("resize", layout);
    layout();

    // عکس را بارگذاری کن؛ بعد از آماده‌شدن، جای عکس CSS می‌نشیند
    if (wantPhoto) {
      new T.TextureLoader().load(PHOTO_URL, function (t) {
        t.minFilter = T.LinearFilter; t.generateMipmaps = false; t.anisotropy = maxAniso;
        buildHero(t);
        rootEl.classList.add("dm3d-photo");
        placeHero();
        setTimeout(placeHero, 1800); // بعد از پایان انیمیشن ورودی
        window.addEventListener("load", placeHero);
      }, undefined, function () { /* اگر عکس لود نشد، همان عکس CSS می‌ماند */ });
    }

    // --- ورودی‌ها
    var mx = 0, my = 0, tx = 0, ty = 0, p = 0, maxScroll = 1;
    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    function measure() { maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }
    measure();
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);

    var clock = new T.Clock(), vel = 0;
    function render() {
      var t = clock.getElapsedTime();
      var target = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      var prev = p;
      p = reduce ? target : p + (target - p) * 0.07;
      vel = reduce ? 0 : (p - prev);
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;

      var cz = 6 - p * L;
      camera.position.set(mx * 0.7, -my * 0.45, cz);
      camera.lookAt(mx * 0.4, -my * 0.25, cz - 10);
      var fov = 50 + Math.min(16, Math.abs(vel) * 1400);
      if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }

      // پنجره‌ی عکس: کج‌شدن با ماوس + محو شدن وقتی دوربین نزدیک می‌شود
      if (hero) {
        var fade = Math.min(1, Math.max(0, (cz - (HZ + 1.2)) / 3));
        hero.visible = fade > 0.01;
        if (hero.visible) {
          hero.rotation.y = -mx * 0.28; hero.rotation.x = -my * 0.14;
          hero.position.y = hero.userData.by + Math.sin(t * 0.8) * 0.08;
          for (var q = 0; q < heroMats.length; q++) heroMats[q].opacity = heroMats[q].userData.base * fade * heroOpacity;
          scan.position.y = scan.userData.py + Math.sin(t * 0.9) * scan.userData.ph * 0.5;
          var gl = hero.userData.glyphs;
          gl[0].rotation.y = t * 0.7; gl[0].rotation.x = Math.sin(t * 0.5) * 0.3;
          gl[1].rotation.y = -t * 0.6; gl[1].rotation.z = Math.sin(t * 0.4) * 0.2;
          gl[2].rotation.y = t * 0.9;
        }
      }

      endCube.rotation.set(t * 0.2, t * 0.3, 0);
      endGlyph.rotation.y = t * 0.5;

      var k, ws = wide ? 1 : 0.55;
      for (k = 0; k < rains.length; k++) {
        var rm2 = rains[k], ru = rm2.userData;
        rm2.material.map.offset.y -= ru.sp * 0.01;
        rm2.position.x = ru.side * ru.ax * ws;
        rm2.position.y = ru.y;
      }
      for (k = 0; k < floaters.length; k++) {
        var f = floaters[k], u = f.userData;
        f.position.set(u.side * u.ax * ws, u.y + Math.sin(t * 0.6 + u.ph) * 0.5, u.z);
        if (u.kind === "panel") {
          f.rotation.y = -u.side * 0.38 + Math.sin(t * 0.4 + u.ph) * 0.09;
          f.rotation.x = Math.sin(t * 0.3 + u.ph) * 0.05;
        } else if (u.kind === "cube") {
          f.rotation.x += 0.004 * u.rs * 6; f.rotation.y += 0.006 * u.rs * 6;
        } else {
          f.rotation.y += 0.012 * (u.rs > 0 ? 1 : -1) * (0.6 + Math.abs(u.rs));
          f.rotation.x = Math.sin(t * 0.5 + u.ph) * 0.25;
        }
      }
      stars.rotation.z = t * 0.004 + mx * 0.02;

      renderer.render(scene, camera);
    }

    if (reduce) {
      var queued = false;
      var once = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; render(); }); };
      window.addEventListener("scroll", once, { passive: true });
      window.addEventListener("resize", once);
      render();
      setTimeout(render, 600);
    } else {
      (function loop() { requestAnimationFrame(loop); if (!document.hidden) render(); })();
    }
  }

  /* ------------------------------------------------------------------
     بخش دوم: کج‌شدن سه‌بعدی کارت‌ها
     از ویژگی مستقل CSS `rotate` استفاده می‌شود تا با transformِ GSAP تداخل نکند.
     ------------------------------------------------------------------ */
  function initTilt() {
    if (matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!CSS.supports || !CSS.supports("rotate", "1 0 0 10deg")) return;
    var MAX = 9;
    var cards = document.querySelectorAll(".glass-card:not(details):not(.id-card):not(.free-cta__box):not(.faq__item), .skill-card, .stat-card");
    cards.forEach(function (el) {
      if (el.closest("form")) return;
      if (el.parentElement) el.parentElement.style.perspective = "1100px";
      el.classList.add("dm3d-tilt");
      var anim = null;
      el.addEventListener("pointermove", function (e) {
        var b = el.getBoundingClientRect();
        var nx = (e.clientX - b.left) / b.width - 0.5, ny = (e.clientY - b.top) / b.height - 0.5;
        var ang = Math.hypot(nx, ny) * 2 * MAX;
        if (anim) { anim.cancel(); anim = null; }
        el.style.rotate = ang < 0.05 ? "0 0 1 0deg" : (-ny).toFixed(3) + " " + nx.toFixed(3) + " 0 " + ang.toFixed(2) + "deg";
      });
      el.addEventListener("pointerleave", function () {
        var from = el.style.rotate || "0 0 1 0deg";
        el.style.rotate = "0 0 1 0deg";
        try {
          anim = el.animate([{ rotate: from }, { rotate: "0 0 1 0deg" }], { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" });
        } catch (e) { /* ignore */ }
      });
    });
  }

  function start() { initWorld(); initTilt(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
