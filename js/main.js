// ローディング
$(window).on('load', function () {
    setTimeout(function () {
        $('body').addClass('appear');
        setTimeout(function () {
            $("#splash").hide();
        }, 1000);
    }, 3000);

    initScrollPositions(); // ロード完了後に位置を計算
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

// ===== 1スクロール = 1セクション移動 =====

let currentIdx = 0;
let isScrolling = false;
let scrollPositions = [];

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

// ── スムーズスクロール（window.scrollTo を使用）─────────────
function smoothScrollTo(targetTop, duration) {
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
            isScrolling = false;
        }
    }

    requestAnimationFrame(step);
}

// ── 各セクションのスクロール位置をキャッシュ ────────────────
function initScrollPositions() {
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

    scrollPositions = [
        0,                      // 0: .topview
        wrapperTop,             // 1: .fixed01
        wrapperTop + vh,        // 2: .fixed02
        wrapperTop + vh * 2,    // 3: .fixed03
        wrapperTop + vh * 3,    // 4: .fixed04
        wrapperTop + vh * 4,    // 5: .fixed05
        movieTop                // 6: .movie
    ];
}

// ── セクション移動 ──────────────────────────────────────────
function goToSection(idx) {
    if (idx < 0 || idx >= scrollPositions.length || isScrolling) return;
    isScrolling = true;
    currentIdx = idx;
    smoothScrollTo(scrollPositions[idx], 800);
}

// ── ホイール操作 ────────────────────────────────────────────
window.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (isScrolling) return;
    goToSection(currentIdx + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

// ── タッチ操作（スマホ対応） ────────────────────────────────
let touchStartY = 0;
window.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', function (e) {
    if (isScrolling) return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 40) {
        goToSection(currentIdx + (diff > 0 ? 1 : -1));
    }
}, { passive: true });


// ロード完了後に位置を計算
$(window).on('load', function () {
    setTimeout(function () {
        $('body').addClass('appear');
        setTimeout(function () {
            $("#splash").hide();
        }, 1000);
    }, 3000);

    initScrollPositions();

    window.addEventListener('resize', initScrollPositions);
});
