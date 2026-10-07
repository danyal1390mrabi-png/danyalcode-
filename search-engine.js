/* =====================================================================
   موتور جستجوی داخلی دانیال کد
   نکته: منبع نتایج، فایل search-data.js (آرایه SITE_INDEX) هست.
   برای اضافه/ویرایش سایت‌ها فقط همون فایل رو باز کن؛ نیازی به تغییر
   این فایل نیست.
   ===================================================================== */
(function () {
  "use strict";

  // یکدست‌سازی حروف عربی/فارسی و حذف فاصله‌های اضافه برای جستجوی دقیق‌تر
  function normalize(str) {
    return (str || "")
      .toString()
      .toLowerCase()
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/[\u064B-\u065F\u0670]/g, "") // اعراب
      .replace(/[‌\s]+/g, " ")
      .trim();
  }

  /* -----------------------------------------------------------------
     امتیازدهی به هر سایت برای یک عبارت جستجو مشخص.
     برخلاف روش قبلی (که هر کلمه رو مستقل و در کل متن ترکیبی جستجو
     می‌کرد)، این نسخه عبارت رو به‌صورت یک «جمله کامل» توی هر فیلد
     جدا (عنوان، توضیح، آدرس، کلمات کلیدی) می‌گرده. این‌طوری اگر
     توضیحات یک سایت چند موضوع مختلف رو کنار هم اسم برده باشه، فقط
     وقتی نتیجه میاد که خودِ عبارتِ جستجوشده واقعاً همون‌جا نوشته شده،
     نه اینکه کلمات پراکنده‌اش هرجایی از متن پیدا بشن.
     امتیاز صفر یعنی «هیچ ارتباطی نداره» و از نتایج حذف می‌شه.
     ----------------------------------------------------------------- */
  function scoreEntry(entry, query, words) {
    const title = normalize(entry.title);
    const desc = normalize(entry.description);
    const url = normalize(entry.url);
    const keywords = (Array.isArray(entry.keywords) ? entry.keywords : []).map(normalize);

    let score = 0;

    // ۱) تطابق دقیق یک کلمه‌کلیدی با عبارت جستجو — بالاترین اولویت
    if (keywords.includes(query)) score += 100;
    // تطابق جزئی کلمه‌کلیدی (یکی زیرمجموعه دیگری باشه)
    else if (keywords.some((k) => k.includes(query) || query.includes(k))) score += 70;

    // ۲) وجود کل عبارت جستجو (به همین ترتیب) داخل عنوان
    if (title.includes(query)) score += 90;

    // ۳) وجود کل عبارت جستجو داخل توضیحات
    if (desc.includes(query)) score += 40;

    // ۴) وجود عبارت جستجو داخل آدرس سایت
    if (url.includes(query)) score += 15;

    // ۵) اگر عبارت جستجو چند کلمه‌ای بود و هنوز تطابقی پیدا نشد،
    //    فقط در همون یک فیلد (عنوان یا مجموع کلمات‌کلیدی) دنبال
    //    همه‌ی کلمات می‌گرده — نه در کل متن قاطی‌شده.
    if (score === 0 && words.length > 1) {
      if (words.every((w) => title.includes(w))) score += 55;
      else if (words.every((w) => keywords.some((k) => k.includes(w)))) score += 50;
    }

    return score;
  }

  function runSearch(rawQuery) {
    const query = normalize(rawQuery);
    if (!query) return { query: rawQuery.trim(), results: [] };

    const words = query.split(" ").filter(Boolean);
    const index = (window.SITE_INDEX || []);

    const results = index
      .map((entry) => ({ entry, score: scoreEntry(entry, query, words) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.entry);

    return { query: rawQuery.trim(), results };
  }

  function escapeHTML(str) {
    return (str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function renderResults(container, metaEl, query, results, tookMs) {
    metaEl.innerHTML = "";
    container.innerHTML = "";

    if (!query) {
      metaEl.textContent = "";
      container.innerHTML = `
        <div class="search-empty glass-card">
          <svg class="search-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <h3>هنوز چیزی جستجو نکرده‌اید</h3>
          <p>عبارتی مثل «هوش مصنوعی»، «طراحی وب» یا «موسیقی» را در کادر بالا وارد کنید تا سایت‌های مرتبط دانیال کد نمایش داده شود.</p>
        </div>`;
      return;
    }

    if (results.length === 0) {
      metaEl.textContent = `برای «${query}» نتیجه‌ای یافت نشد.`;
      container.innerHTML = `
        <div class="search-empty glass-card">
          <svg class="search-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m21 21-4.3-4.3"></path>
            <path d="M9.5 9.5c.5-1 1.7-1.5 2.8-1.2"></path>
          </svg>
          <h3>متأسفانه دانیال کد هنوز چنین سایتی نساخته!</h3>
          <p>ولی خبر خوب اینه که قراره بسازه. اگر پیشنهادی برای یک پروژه یا سایت جدید داری، از بخش
             <a href="index.html#contact" style="color: var(--color-purple-soft);">تماس</a> با دانیال در میون بذار.</p>
        </div>`;
      return;
    }

    metaEl.textContent = `حدود ${results.length.toLocaleString("fa-IR")} نتیجه (${tookMs} ثانیه)`;

    results.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "search-result";
      item.innerHTML = `
        <span class="search-result__url">${escapeHTML(entry.url)}</span>
        <a class="search-result__title" href="${escapeHTML(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(entry.title)}</a>
        <p class="search-result__desc">${escapeHTML(entry.description || "")}</p>
      `;
      container.appendChild(item);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search-form");
    const input = document.getElementById("search-input");
    const resultsEl = document.getElementById("search-results");
    const metaEl = document.getElementById("search-meta");
    if (!form || !input || !resultsEl || !metaEl) return;

    function doSearch(q) {
      const start = performance.now();
      const { query, results } = runSearch(q);
      const took = ((performance.now() - start) / 1000 + 0.03).toFixed(2);
      renderResults(resultsEl, metaEl, query, results, took);

      const url = new URL(window.location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      window.history.replaceState({}, "", url);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      doSearch(input.value);
    });

    document.querySelectorAll(".search-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        input.value = chip.dataset.query || chip.textContent.trim();
        doSearch(input.value);
        input.focus();
      });
    });

    // خواندن عبارت جستجو از پارامتر ?q= در آدرس و اجرای جستجو (یا نمایش پیام خالی)
    const initialQuery = new URL(window.location.href).searchParams.get("q") || "";
    input.value = initialQuery;
    doSearch(initialQuery);
  });
})();
