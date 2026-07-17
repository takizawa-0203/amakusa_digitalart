// ===== 実際の表示領域の高さを --vh にセット =====
// (dvh/svhがブラウザによって正確に効かない場合があるため、JSで実測して補完する)
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', function () {
    setTimeout(setViewportHeight, 100);
});
// iOSでアドレスバーの表示状態が確定した後に再計算（読み込み直後のズレ対策）
window.addEventListener('load', function () {
    setTimeout(setViewportHeight, 300);
});

// ===== ローディング文字を1文字ずつに分割（ウェーブ演出用） =====
$(function () {
    const $text = $('.loading-text');
    if (!$text.length) return;

    const label = $text.text();
    $text.attr('aria-label', label).empty();

    label.split('').forEach(function (char, i) {
        $('<span aria-hidden="true"></span>')
            .text(char === ' ' ? '\u00A0' : char)
            .css('animation-delay', (i * 0.08) + 's')
            .appendTo($text);
    });
});

// ===== ローディング（初回のみ表示） =====
$(function () {
    if (!sessionStorage.getItem('visited')) {
        setTimeout(function () {
            $('body').addClass('appear');
            setTimeout(function () {
                $("#splash").hide();
            }, 5000);
        }, 5000);        
        sessionStorage.setItem('visited', 'true');
    } else {
        $("#splash").hide();
        $('body').addClass('appear');
    }
});

// ハンバーガーメニュー
$(function () {
    $(".openbtn").on("click", function () {
        $(this).toggleClass("active");
        $("#js_nav").toggleClass("panelactive active");
        $("body").toggleClass("no-scroll");
    });
    $("#g-navi a").on("click", function () {
        $(".openbtn").removeClass("active");
        $("#js_nav").removeClass("panelactive active");
        $("body").removeClass("no-scroll");
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
    const fixedWrapper = document.querySelector('.fixed_wrapper');
    const fixedItems = document.querySelectorAll('.fixed');
    const movie = document.querySelector('.movie');
    const currentScroll = getScrollTop();

    const wrapperTop = fixedWrapper
        ? fixedWrapper.getBoundingClientRect().top + currentScroll
        : window.innerHeight;

    // 実際の .fixed の高さを取得
    const fixedHeight = fixedItems.length
        ? fixedItems[0].offsetHeight
        : window.innerHeight;

    const movieTop = movie
        ? movie.getBoundingClientRect().top + currentScroll
        : wrapperTop + fixedHeight * 5;

    return [
        0,                         // 0: .topview
        wrapperTop,                // 1: .fixed01
        wrapperTop + fixedHeight,  // 2: .fixed02
        wrapperTop + fixedHeight * 2,
        wrapperTop + fixedHeight * 3,
        wrapperTop + fixedHeight * 4,
        movieTop                   // 6: .movie
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

    const aboutStart = positions[1];
    const aboutEnd = positions[5];
    const movieTop = positions[6];

    // topviewから下にスクロールしたら fixed01 へ
    if (direction === 1 && currentScroll < aboutStart - 5) {
        e.preventDefault();
        smoothScrollTo(aboutStart, 800);
        return;
    }

    // movieの先頭付近から上に戻る時だけ fixed05 へ戻す
    if (
        direction === -1 &&
        currentScroll >= movieTop - 5 &&
        currentScroll <= movieTop + 80
    ) {
        e.preventDefault();
        smoothScrollTo(aboutEnd, 800);
        return;
    }

    // About内だけスナップスクロール
    const isInAbout = currentScroll >= aboutStart - 5 && currentScroll < movieTop - 5;

    if (isInAbout) {
        e.preventDefault();

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
            smoothScrollTo(0, 800);
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

    // スワイプ距離が短い場合は無視
    if (Math.abs(diff) < 40) return;

    const positions = getScrollPositions();
    const currentScroll = getScrollTop();
    const direction = diff > 0 ? 1 : -1;

    const aboutStart = positions[1];
    const aboutEnd = positions[5];
    const movieTop = positions[6];

    // topviewから下へスワイプしたら fixed01 へ
    if (direction === 1 && currentScroll < aboutStart - 5) {
        smoothScrollTo(aboutStart, 600);
        return;
    }

    // movie先頭付近から上へ戻る時だけ fixed05 へ
    if (
        direction === -1 &&
        currentScroll >= movieTop - 5 &&
        currentScroll <= movieTop + 80
    ) {
        smoothScrollTo(aboutEnd, 600);
        return;
    }

    // About内だけ1スワイプ = 1セクション
    const isInAbout = currentScroll >= aboutStart - 5 && currentScroll < movieTop - 5;

    if (isInAbout) {
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
            smoothScrollTo(positions[nextIndex], 600);
        } else if (nextIndex < 1) {
            smoothScrollTo(0, 600);
        }
    }
}, { passive: true });



// ===== スクロールで要素がふわっと出現する演出 =====
(function () {
    // フェードインさせたい要素をまとめて指定
    // (id指定ではなくクラスなので、増減してもここに追加するだけでOK)
    const targets = [
        '.top_logo',
        '.about_title',
        '.fixed_title',
        '.fixed_img',
        '.fixed_body-text',
        '.movie_title_en',
        '.movie_title_jp',
        '.movie_area1',
        '.movie_area2',
        '.data_title_en',
        '.data_title_jp',
        '.data_sec',
        '.initiative_title',
        '.initiative_heading',
        '.initiative_text',
        '.initiative_supplement',
        '.initiative_ul > li',
        '.initiative_ul_02 > li',
        '.support_ul > li',
        '.supplement_sec',
        '.voice_chat',
    ];

    const elements = document.querySelectorAll(targets.join(','));

    if (!elements.length) return;

    // 同じ親要素内で並ぶ要素は、少しずつ時間差をつけて出現させる（最大6件まで）
    const delayCounters = new WeakMap();

    elements.forEach(function (el) {
        el.classList.add('js-reveal');

        const parent = el.parentElement;
        const count = delayCounters.get(parent) || 0;
        if (count < 6) {
            el.style.transitionDelay = (count * 0.32) + 's';
        }
        delayCounters.set(parent, count + 1);
    });

    // 「視差効果を減らす」設定がオンの場合はアニメーションなしで即表示
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elements.forEach(function (el) { el.classList.add('is-inview'); });
        return;
    }

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-inview');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
    });

    elements.forEach(function (el) {
        revealObserver.observe(el);
    });
})();

// ---- カルーセル機能 ----
let carouselIndex = 1; // 中央に表示するインデックス

function initCarousel() {
    const sliderItems = document.querySelectorAll('.slider-item');
    const total = sliderItems.length;

    sliderItems.forEach((item, idx) => {
        // 現在のactiveから見た円環距離（ループを考慮した相対位置）を求める
        const diff = (idx - carouselIndex + total) % total;

        item.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next');

        if (diff === 0) {
            item.classList.add('active');
        } else if (diff === 1) {
            item.classList.add('next');
        } else if (diff === total - 1) {
            item.classList.add('prev');
        } else if (diff <= total / 2) {
            item.classList.add('far-next');
        } else {
            item.classList.add('far-prev');
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