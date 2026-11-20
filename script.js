(() => {
  "use strict";
  const book = document.getElementById("book");
  const pageEls = Array.from(book.querySelectorAll(".page"));
  const total = pageEls.length;
  const titles = [
    ["الفهرس", 1],
    ["مقدمة عن الدراسة التمهيدية", 2],
    ["التعريف بالمؤسسة", 3],
    ["الموقع الجغرافي والمقر الإداري", 4],
    ["نبذة تاريخية وتاريخ الإنشاء", 5],
    ["الهيكل التنظيمي للمؤسسة", 6],
    ["المصالح الإدارية ومهامها", 7],
    ["بقية المصالح ومهامها", 8],
    ["دراسة المبنى والمناصب", 9],
    ["دراسة الوثائق والسجلات", 10],
    ["الإجراءات الإدارية", 11],
    ["معالجة المراسلات الواردة", 12],
    ["مخطط تدفق المعلومات", 13],
    ["نقد الموجود", 14],
    ["الحلول المقترحة", 15],
    ["الجانب التقني", 16],
    ["الخلاصة", 17],
    ["المراجع والمصادر", 18],
  ];

  const tocHTML = titles
    .map(
      ([title, page], i) =>
        `<button type="button" class="toc-entry" data-page="${page}"><span>${String(i + 1).padStart(2, "0")}</span><b>${title}</b></button>`,
    )
    .join("");
  document.getElementById("tocList").innerHTML = tocHTML;
  document.getElementById("drawerToc").innerHTML = tocHTML;

  const indicator = document.getElementById("pageIndicator");
  const progress = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const prev = document.getElementById("prevPage");
  const next = document.getElementById("nextPage");
  let current = 0;
  let pageFlip = null;
  let usingFallback = false;

  function paintProgress(index) {
    current = Math.max(0, Math.min(total - 1, index));
    const percent = Math.round(((current + 1) / total) * 100);
    indicator.textContent =
      current === 0
        ? "الغلاف"
        : current === total - 1
          ? "الغلاف الخلفي"
          : `صفحة ${current} من ${total - 1}`;
    progress.style.width = percent + "%";
    progressText.textContent = percent + "%";
    prev.disabled = current === 0;
    next.disabled = current === total - 1;
  }

  function fallbackShow(index) {
    usingFallback = true;
    pageEls.forEach((page, i) => {
      page.style.display = i === index ? "block" : "none";
      page.style.position = "absolute";
      page.style.inset = "0";
      page.style.width = "100%";
      page.style.height = "100%";
      page.style.animation = i === index ? "bookPageIn .38s ease both" : "none";
    });
    book.classList.add("fallback-book");
    paintProgress(index);
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(total - 1, Number(index) || 0));
    if (pageFlip && !usingFallback) {
      pageFlip.turnToPage(target);
    } else {
      fallbackShow(target);
    }
  }

  // Initialize the 3D page-flip library when its CDN is available.
  try {
    if (window.St && typeof window.St.PageFlip === "function") {
      pageFlip = new window.St.PageFlip(book, {
        width: 410,
        height: 570,
        size: "stretch",
        minWidth: 280,
        maxWidth: 820,
        minHeight: 390,
        maxHeight: 650,
        maxShadowOpacity: 0.34,
        showCover: true,
        mobileScrollSupport: false,
        flippingTime: 900,
        usePortrait: true,
        startPage: 0,
        drawShadow: true,
        autoSize: true,
      });
      pageFlip.loadFromHTML(pageEls);
      pageFlip.on("flip", (e) =>
        paintProgress(
          typeof e.data === "number" ? e.data : pageFlip.getCurrentPageIndex(),
        ),
      );
      pageFlip.on("init", () => paintProgress(pageFlip.getCurrentPageIndex()));
      paintProgress(pageFlip.getCurrentPageIndex());
    } else {
      fallbackShow(0);
    }
  } catch (err) {
    console.warn(
      "PageFlip library unavailable; using built-in page navigation.",
      err,
    );
    pageFlip = null;
    fallbackShow(0);
  }

  prev.type = "button";
  next.type = "button";
  prev.addEventListener("click", () => {
    if (current <= 0) return;
    if (pageFlip && !usingFallback && typeof pageFlip.flipPrev === "function")
      pageFlip.flipPrev();
    else goTo(current - 1);
  });
  next.addEventListener("click", () => {
    if (current >= total - 1) return;
    if (pageFlip && !usingFallback && typeof pageFlip.flipNext === "function")
      pageFlip.flipNext();
    else goTo(current + 1);
  });

  // Swipe navigation works in both the 3D reader and the built-in fallback.
  let touchStartX = null;
  book.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );
  book.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null || !e.changedTouches.length) return;
      if (!usingFallback) {
        touchStartX = null;
        return;
      }
      const delta = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(delta) < 45) return;
      // In RTL reading, a left swipe advances and a right swipe goes back.
      if (delta < 0) next.click();
      else prev.click();
    },
    { passive: true },
  );

  function openOverlay(id) {
    document.getElementById(id).classList.add("show");
  }
  function closeOverlays() {
    document
      .querySelectorAll(".overlay")
      .forEach((x) => x.classList.remove("show"));
  }
  document
    .getElementById("tocOpen")
    .addEventListener("click", () => openOverlay("tocOverlay"));
  document.getElementById("searchOpen").addEventListener("click", () => {
    openOverlay("searchOverlay");
    setTimeout(() => document.getElementById("searchInput").focus(), 100);
  });
  document.querySelectorAll("[data-close]").forEach((button) =>
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.close).classList.remove("show");
    }),
  );
  document.querySelectorAll(".overlay").forEach((overlay) =>
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("show");
    }),
  );
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-page]");
    if (button) {
      goTo(button.dataset.page);
      closeOverlays();
    }
  });
  document.getElementById("fullscreen").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      toast("تعذر تفعيل ملء الشاشة في هذا المتصفح");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    if (e.key === "ArrowLeft") next.click();
    if (e.key === "ArrowRight") prev.click();
    if (e.key === "Escape") closeOverlays();
  });

  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      searchResults.textContent = "اكتب كلمة للبحث داخل عناوين ومحتوى الكتاب.";
      return;
    }
    const found = [];
    pageEls.forEach((page, i) => {
      const plain = page.innerText || page.textContent || "";
      const idx = plain.toLowerCase().indexOf(q);
      if (idx >= 0)
        found.push({
          i,
          title:
            titles.find((t) => t[1] === i)?.[0] ||
            (i === 0 ? "الغلاف" : "صفحة " + i),
          excerpt: plain
            .slice(Math.max(0, idx - 38), Math.min(plain.length, idx + 90))
            .replace(/\s+/g, " "),
        });
    });
    searchResults.innerHTML = found.length
      ? found
          .map(
            (r) =>
              `<div class="result-item" data-page="${r.i}"><b>${r.title}</b><small>${r.excerpt}</small></div>`,
          )
          .join("")
      : "لا توجد نتائج مطابقة داخل الكتاب.";
  });

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2300);
  }
  const stars = document.getElementById("stars");
  for (let i = 0; i < 32; i++) {
    const s = document.createElement("i");
    s.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${Math.random() * 2 + 1}px;height:${Math.random() * 2 + 1}px;border-radius:50%;background:#f1d99d;opacity:${Math.random() * 0.45 + 0.08};animation:twinkle ${Math.random() * 4 + 2}s ease-in-out ${Math.random() * 4}s infinite alternate`;
    stars.appendChild(s);
  }
  const style = document.createElement("style");
  style.textContent =
    "@keyframes twinkle{to{opacity:.08;transform:scale(.4)}} @keyframes bookPageIn{from{opacity:.45;transform:translateX(18px) rotateY(-3deg)}to{opacity:1;transform:none}} .fallback-book{overflow:hidden;perspective:1200px} .fallback-book>.page{backface-visibility:hidden}";
  document.head.appendChild(style);
})();


document.addEventListener("DOMContentLoaded", () => {
    const visual = document.querySelector(".study-visual");

    if (!visual) return;

    visual.style.opacity = "0";
    visual.style.transform = "translateY(20px)";

    requestAnimationFrame(() => {
        visual.style.transition =
            "opacity 1s ease, transform 1s ease";

        visual.style.opacity = "1";
        visual.style.transform = "translateY(0)";
    });
});

