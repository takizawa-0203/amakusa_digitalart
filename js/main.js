 // ローディング
$(window).on('load', function () {
    setTimeout(function () {
        $('body').addClass('appear');
        setTimeout(function () {
            $("#splash").hide();
        }, 1000);
    }, 3000);

    initScrollPositions();
    document.fonts.ready.then(function() {
        initScrollPositions();
    });
    window.addEventListener('resize', initScrollPositions);
});

// ハンバーガーメニュー
$(function () {
    $(".openbtn").on("click", function () {
        $(this).toggleClass("active");
        $("#js_nav").toggleClass("panelactive");
    });
    $("#g-navi a").on("click", function () {
        $(".openbtn").removeClass("active");
        $("#js_nav").removeClass("panelactive");
    });
});

// タイトル押し上げ（windowのscrollを監視）
window.addEventListener('scroll', function () {
    const titleEl = document.querySelector('.about_title');
    const fixed05El = document.querySelector('.fixed05');
    if (titleEl && fixed05El) {
        const fixed05Top = fixed05El.getBoundingClientRect().top;
        const titleBottom = 120;
        if (fixed05Top <= titleBottom) {
            titleEl.style.transform = `translateY(${fixed05Top - titleBottom}px)`;
        } else {
            titleEl.style.transform = 'translateY(0)';
        }
    }
});

// ===== Aboutセクション(.fixed)のみ 1スクロール = 1セクション移動 =====

let isScrolling = false;

// ── スクロール位置を取得（クロスブラウザ対応）──────────────
function getScrollTop() {
    return window.pageYOffset 
        || document.documentElement.scrollTop 
        || document.body.scrollTop 
        || 0;
}

// ── イージング ──────────────────────────────────────────────
function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── スムーズスクロール ─────────────
function smoothScrollTo(targetTop, duration) {
    isScrolling = true;
    const startTop = getScrollTop();
    const distance = targetTop - startTop;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startTop + distance * easeInOutCubic(progress));

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            window.scrollTo(0, targetTop); // 誤差補正
            setTimeout(() => { isScrolling = false; }, 50); 
        }
    }
    requestAnimationFrame(step);
}

// ── 各セクションのスクロール位置を動的に計算 ────────────────
function getScrollPositions() {
    const vh = window.innerHeight;
    const fixedWrapper = document.querySelector('.fixed_wrapper');
    const movie = document.querySelector('.movie');
    const currentScroll = getScrollTop();

    const wrapperTop = fixedWrapper
        ? fixedWrapper.getBoundingClientRect().top + currentScroll
        : vh;

    const movieTop = movie
        ? movie.getBoundingClientRect().top + currentScroll
        : wrapperTop + 5 * vh;

    return [
        0,                   // 0: .topview
        wrapperTop,          // 1: .fixed01
        wrapperTop + vh,     // 2: .fixed02
        wrapperTop + vh * 2, // 3: .fixed03
        wrapperTop + vh * 3, // 4: .fixed04
        wrapperTop + vh * 4, // 5: .fixed05
        movieTop             // 6: .movie
    ];
}

// ── ホイール操作 (PC) ────────────────────────────────────────────
window.addEventListener('wheel', function (e) {
    if (isScrolling) {
        e.preventDefault();
        return;
    }

    const positions = getScrollPositions();
    const currentScroll = getScrollTop();
    const direction = e.deltaY > 0 ? 1 : -1;

    const aboutStart = positions[1]; // fixed01
    const aboutEnd = positions[5];   // fixed05
    const movieTop = positions[6];   // movie

    // ▼ 1. トップ画面から下へスクロールした瞬間、一気に aboutStart(fixed01) へ吸着
    if (direction === 1 && currentScroll < aboutStart) {
        e.preventDefault();
        smoothScrollTo(aboutStart, 800);
        return;
    }

    // ▼ 2. movieセクションの上部から上へスクロールして、.aboutの下端が見えそうなら aboutEnd(fixed05) へ吸着
    if (direction === -1 && currentScroll > aboutEnd && currentScroll <= movieTop + 50) {
        e.preventDefault();
        smoothScrollTo(aboutEnd, 800);
        return;
    }

    // ▼ 3. Aboutセクション内にいる場合の判定 (誤差±5pxを許容)
    const isInAbout = (currentScroll >= aboutStart - 5) && (currentScroll <= aboutEnd + 5);

    if (isInAbout) {
        e.preventDefault(); // About内ではデフォルトスクロールを停止

        let currentIndex = 1;
        let minDiff = Infinity;
        for (let i = 1; i <= 6; i++) {
            const diff = Math.abs(currentScroll - positions[i]);
            if (diff < minDiff) {
                minDiff = diff;
                currentIndex = i;
            }
        }

        const nextIndex = currentIndex + direction;

        if (nextIndex >= 1 && nextIndex <= 6) {
            smoothScrollTo(positions[nextIndex], 800);
        } else if (nextIndex < 1) {
            smoothScrollTo(0, 800); // Topへ戻る
        }
    } 
}, { passive: false });


// ── タッチ操作（スマホ対応） ────────────────────────────────
let touchStartY = 0;

window.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', function (e) {
    if (isScrolling) return;

    const diff = touchStartY - e.changedTouches[0].clientY;
    
    // スワイプ距離が短い場合はタップとみなして無視
    if (Math.abs(diff) < 40) return;

    const positions = getScrollPositions();
    const currentScroll = getScrollTop();
    const direction = diff > 0 ? 1 : -1;

    const aboutStart = positions[1];
    const aboutEnd = positions[5];
    const movieTop = positions[6];

    // ▼ 1. トップ画面から下へスワイプした瞬間、一気に aboutStart(fixed01) へ吸着
    if (direction === 1 && currentScroll < aboutStart) {
        smoothScrollTo(aboutStart, 500);
        return;
    }

    // ▼ 2. movieセクションから上へスワイプして .about の下端が見えそうなら aboutEnd(fixed05) へ吸着
    if (direction === -1 && currentScroll > aboutEnd && currentScroll <= movieTop + 50) {
        smoothScrollTo(aboutEnd, 500);
        return;
    }

    // ▼ 3. Aboutセクション内にいる場合
    if (currentScroll >= aboutStart - 5 && currentScroll <= aboutEnd + 5) {
        let currentIndex = 1;
        let minDiff = Infinity;
        for (let i = 1; i <= 6; i++) {
            const diffAbs = Math.abs(currentScroll - positions[i]);
            if (diffAbs < minDiff) {
                minDiff = diffAbs;
                currentIndex = i;
            }
        }

        const nextIndex = currentIndex + direction;

        if (nextIndex >= 1 && nextIndex <= 6) {
            smoothScrollTo(positions[nextIndex], 500); // スマホは少し早めに設定
        } else if (nextIndex < 1) {
            smoothScrollTo(0, 500);
        }
    }
}, { passive: true });


// ---- カルーセル機能 ----
let carouselIndex = 1; // 中央に表示するインデックス

function initCarousel() {
    const sliderItems = document.querySelectorAll('.slider-item');
    const total = sliderItems.length;

    sliderItems.forEach((item, idx) => {
        if (idx === carouselIndex) {
            item.classList.add('active');
            item.classList.remove('prev', 'next');
        } else if (idx < carouselIndex) {
            item.classList.add('prev');
            item.classList.remove('active', 'next');
        } else {
            item.classList.add('next');
            item.classList.remove('active', 'prev');
        }
    });
}

function moveCarousel(direction) {
    const sliderItems = document.querySelectorAll('.slider-item');
    const total = sliderItems.length;

    carouselIndex += direction;

    // ループ処理
    if (carouselIndex >= total) {
        carouselIndex = 0;
    } else if (carouselIndex < 0) {
        carouselIndex = total - 1;
    }

    initCarousel();
}

// 矢印クリック時の処理
document.addEventListener('DOMContentLoaded', function () {
    initCarousel();

    const prevBtn = document.querySelector('.carousel-arrow-prev');
    const nextBtn = document.querySelector('.carousel-arrow-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => moveCarousel(-1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => moveCarousel(1));
    }

    // キーボード操作（オプション）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') moveCarousel(-1);
        if (e.key === 'ArrowRight') moveCarousel(1);
    });
});                                                                                                                                                                                                                                                                                                                                                                       