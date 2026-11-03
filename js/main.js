// jQuery を使わないバニラJS版
(function () {
    'use strict';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }
    function safeStorage(method, key, value) {
        try { return sessionStorage[method](key, value); } catch (e) { return null; }
    }

    // ===== 実際の表示領域の高さを --vh にセット =====
    // アドレスバーの開閉による resize では更新しない（高さが動くのを防ぐ）
    var lastWidth = window.innerWidth;
    function setViewportHeight() {
        document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    }
    setViewportHeight();
    window.addEventListener('resize', function () {
        if (window.innerWidth !== lastWidth) {
            lastWidth = window.innerWidth;
            setViewportHeight();
        }
    });
    window.addEventListener('orientationchange', function () { setTimeout(setViewportHeight, 100); });
    window.addEventListener('load', function () { setTimeout(setViewportHeight, 300); });

    ready(function () {

        // ===== ローディング文字を1文字ずつに分割 =====
        var loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            var label = loadingText.textContent;
            loadingText.textContent = '';
            loadingText.setAttribute('aria-label', label);
            label.split('').forEach(function (ch, i) {
                var span = document.createElement('span');
                span.setAttribute('aria-hidden', 'true');
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                span.style.animationDelay = (i * 0.08) + 's';
                loadingText.appendChild(span);
            });
        }

        // ===== ローディング（初回のみ。最短1.5秒 かつ 読み込み完了まで） =====
        var splash = document.getElementById('splash');
        var body = document.body;
        if (safeStorage('getItem', 'visited')) {
            if (splash) splash.style.display = 'none';
            body.classList.add('appear');
        } else {
            safeStorage('setItem', 'visited', 'true');
            var minWait = new Promise(function (r) { setTimeout(r, 1500); });
            var loaded = new Promise(function (r) {
                if (document.readyState === 'complete') r();
                else window.addEventListener('load', r);
            });
            Promise.all([minWait, loaded]).then(function () {
                body.classList.add('appear');
                setTimeout(function () { if (splash) splash.style.display = 'none'; }, 1200);
            });
            // 念のための上限（画像の読み込みが遅くても5秒で開く）
            setTimeout(function () {
                if (!body.classList.contains('appear')) {
                    body.classList.add('appear');
                    setTimeout(function () { if (splash) splash.style.display = 'none'; }, 1200);
                }
            }, 5000);
        }

        // ===== ハンバーガーメニュー =====
        var openBtn = document.querySelector('.openbtn');
        var nav = document.getElementById('js_nav');
        function setMenu(open) {
            openBtn.classList.toggle('active', open);
            nav.classList.toggle('panelactive', open);
            nav.classList.toggle('active', open);
            body.classList.toggle('no-scroll', open);
            openBtn.setAttribute('aria-expanded', String(open));
            openBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
        }
        if (openBtn && nav) {
            openBtn.addEventListener('click', function () {
                setMenu(!openBtn.classList.contains('active'));
            });
            nav.querySelectorAll('#g-navi a').forEach(function (a) {
                a.addEventListener('click', function () { setMenu(false); });
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && openBtn.classList.contains('active')) {
                    setMenu(false);
                    openBtn.focus();
                }
            });
        }

        // ===== 別タブで開くリンクの注記を追加 =====
        document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
            var aria = a.getAttribute('aria-label');
            if (aria) {
                if (aria.indexOf('新しいタブ') === -1) a.setAttribute('aria-label', aria + '（新しいタブで開きます）');
            } else {
                var note = document.createElement('span');
                note.className = 'sr-only';
                note.textContent = '（新しいタブで開きます）';
                a.appendChild(note);
            }
        });

        // ===== About：タイトル押し上げ（rAFで間引き） =====
        var titleEl = document.querySelector('.about_title');
        var fixedEls = document.querySelectorAll('.fixed');
        var lastFixedEl = fixedEls[fixedEls.length - 1];
        var ticking = false;
        function updateTitle() {
            ticking = false;
            if (!titleEl || !lastFixedEl) return;
            var titleBottom = 120;
            var top = lastFixedEl.getBoundingClientRect().top;
            titleEl.style.transform = top <= titleBottom ? 'translateY(' + (top - titleBottom) + 'px)' : 'translateY(0)';
        }

        // ===== About：1ホイール = 1セクション =====
        var isScrolling = false;
        var positions = [];

        function getScrollTop() {
            return window.pageYOffset || document.documentElement.scrollTop || 0;
        }
        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        function jumpTo(y) {
            // html:focus-within の scroll-behavior:smooth と干渉しないよう即時移動
            try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
            catch (e) { window.scrollTo(0, y); }
        }
        function smoothScrollTo(target, duration) {
            isScrolling = true;
            var start = getScrollTop(), dist = target - start, t0 = performance.now();
            function step(now) {
                var p = Math.min((now - t0) / duration, 1);
                jumpTo(start + dist * easeInOutCubic(p));
                if (p < 1) requestAnimationFrame(step);
                else {
                    jumpTo(target);
                    setTimeout(function () { isScrolling = false; }, 50);
                }
            }
            requestAnimationFrame(step);
        }
        function computePositions() {
            var wrapper = document.querySelector('.fixed_wrapper');
            var movie = document.querySelector('.movie');
            var cur = getScrollTop();
            var wrapperTop = wrapper ? wrapper.getBoundingClientRect().top + cur : window.innerHeight;
            var h = fixedEls.length ? fixedEls[0].offsetHeight : window.innerHeight;
            var count = fixedEls.length || 6;
            var movieTop = movie ? movie.getBoundingClientRect().top + cur : wrapperTop + h * count;
            positions = [0];
            for (var i = 0; i < count; i++) positions.push(wrapperTop + h * i);
            positions.push(movieTop);
        }
        computePositions();
        window.addEventListener('resize', computePositions);
        window.addEventListener('load', computePositions);

        // 方向(1:下 / -1:上)に対する移動先を返す
        //   数値 : そこへスクロール / -1 : 何もせず通常スクロールも止める / null : 通常スクロール
        function resolveTarget(direction) {
            computePositions();
            var cur = getScrollTop();
            var count = positions.length - 2;
            var aboutStart = positions[1], aboutEnd = positions[count], movieTop = positions[count + 1];

            if (direction === 1 && cur < aboutStart - 5) return aboutStart;
            if (direction === -1 && cur >= movieTop - 5 && cur <= movieTop + 80) return aboutEnd;
            if (cur >= aboutStart - 5 && cur < movieTop - 5) {
                var idx = 1, min = Infinity;
                for (var i = 1; i <= count + 1; i++) {
                    var d = Math.abs(cur - positions[i]);
                    if (d < min) { min = d; idx = i; }
                }
                var next = idx + direction;
                if (next >= 1 && next <= count + 1) return positions[next];
                if (next < 1) return 0;
                return -1;
            }
            return null;
        }

        function stepsDisabled() {
            return reduceMotion || body.classList.contains('no-scroll');
        }

        // ----- PC：ホイール -----
        window.addEventListener('wheel', function (e) {
            // ズーム(Ctrl+ホイール)・横スクロール・メニュー表示中・動きを減らす設定のときは通常動作
            if (e.ctrlKey || e.metaKey || stepsDisabled()) return;
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.deltaY === 0) return;

            if (isScrolling) { e.preventDefault(); return; }

            var target = resolveTarget(e.deltaY > 0 ? 1 : -1);
            if (target === null) return;
            e.preventDefault();
            if (target >= 0) smoothScrollTo(target, 800);
        }, { passive: false });

        // ----- SP・タブレット：スワイプ（1スワイプ = 1セクション） -----
        // ネイティブスクロール（慣性）を止め、指を離したときに1枚だけ移動する
        var touch = { active: false, axis: null, startX: 0, startY: 0, startT: 0, lastY: 0 };
        var touching = false;
        var settleTimer = null;
        var SWIPE_MIN = 40;      // px：これ以上動かせばめくる
        var FLICK_MIN = 0.45;    // px/ms：素早いフリックなら短い距離でもめくる

        function inCarousel(el) {
            return !!(el && el.closest && el.closest('#carousel3d'));
        }

        document.addEventListener('touchstart', function (e) {
            touching = true;
            clearTimeout(settleTimer);
            touch.active = false;
            touch.axis = null;
            if (e.touches.length !== 1 || stepsDisabled() || inCarousel(e.target)) return;
            touch.active = true;
            touch.startX = e.touches[0].clientX;
            touch.startY = touch.lastY = e.touches[0].clientY;
            touch.startT = e.timeStamp;
        }, { passive: true });

        document.addEventListener('touchmove', function (e) {
            if (!touch.active) return;
            var t = e.touches[0];
            touch.lastY = t.clientY;

            if (isScrolling) { if (e.cancelable) e.preventDefault(); return; }

            if (touch.axis === null) {
                var dx0 = t.clientX - touch.startX, dy0 = t.clientY - touch.startY;
                if (Math.max(Math.abs(dx0), Math.abs(dy0)) < 2) return;
                if (Math.abs(dx0) > Math.abs(dy0)) { touch.axis = 'x'; touch.active = false; return; }
                touch.axis = 'y';
                // 指を上へ動かす(dy<0) = 下へ進む
                touch.blocked = resolveTarget(dy0 < 0 ? 1 : -1) !== null;
            }
            if (touch.blocked && e.cancelable) e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', function (e) {
            touching = false;
            var wasActive = touch.active && touch.axis === 'y' && touch.blocked;
            touch.active = false;
            if (!wasActive || isScrolling) { scheduleSettle(); return; }

            var dy = touch.startY - touch.lastY;          // 正：下へ進む
            var dt = Math.max(e.timeStamp - touch.startT, 1);
            var fast = Math.abs(dy) > 15 && Math.abs(dy) / dt > FLICK_MIN;
            if (Math.abs(dy) < SWIPE_MIN && !fast) return;

            var target = resolveTarget(dy > 0 ? 1 : -1);
            if (target !== null && target >= 0) smoothScrollTo(target, 650);
        }, { passive: true });

        document.addEventListener('touchcancel', function () {
            touching = false;
            touch.active = false;
        }, { passive: true });

        // ----- 保険：タッチ端末で慣性などによりセクション途中で止まったら、最寄りの1枚に吸着 -----
        var usedTouch = false;
        window.addEventListener('touchstart', function () { usedTouch = true; }, { passive: true, once: true });

        function settleToNearest() {
            if (!usedTouch || touching || isScrolling || stepsDisabled()) return;
            computePositions();
            var cur = getScrollTop();
            var count = positions.length - 2;
            if (!(cur > positions[1] + 3 && cur < positions[count + 1] - 5)) return;
            var idx = 1, min = Infinity;
            for (var i = 1; i <= count + 1; i++) {
                var d = Math.abs(cur - positions[i]);
                if (d < min) { min = d; idx = i; }
            }
            if (min > 3) smoothScrollTo(positions[idx], 400);
        }
        function scheduleSettle() {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(settleToNearest, 160);
        }

        // ===== スクロールで要素がふわっと出現 =====
        var targets = [
            '.top_logo', '.about_title', '.fixed_title_word', '.fixed_img img', '.fixed_body-text',
            '.movie_title_en', '.movie_title_jp', '.movie_area1', '.movie_area2',
            '.data_title_en', '.data_title_jp', '.data_sec',
            '.initiative_title', '.initiative_heading', '.initiative_text', '.initiative_supplement',
            '.initiative_ul > li', '.initiative_ul_02 > li', '.support_ul > li', '.supplement_sec',
            '.voice_chat', '.initiative_namber', '.initiative_slide_title', '.initiative_comment_title',
            '.initiative_ul_03', '.dhw_box', '.support_other_box', '.data_more_btn'
        ];
        var elements = document.querySelectorAll(targets.join(','));
        var delayCounters = new WeakMap();

        elements.forEach(function (el) {
            el.classList.add('js-reveal');
            var parent = el.parentElement;
            var count = delayCounters.get(parent) || 0;
            var isMoney = el.matches('.initiative_ul_02 > li');
            var step = isMoney ? 0.12 : 0.22;
            if (isMoney) el.style.transitionDuration = '0.55s';
            if (count < 6) el.style.transitionDelay = (count * step) + 's';
            delayCounters.set(parent, count + 1);
        });

        if (reduceMotion) {
            elements.forEach(function (el) { el.classList.add('is-inview'); });
        } else {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) { en.target.classList.add('is-inview'); io.unobserve(en.target); }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

            elements.forEach(function (el) {
                if (el.matches('.initiative_ul_02 > li, .fixed_title_word, .initiative_ul_03')) return;
                io.observe(el);
            });

            var marqueeWrap = document.querySelector('.marquee_wrap');
            var marqueeTrack = document.querySelector('.initiative_ul_03');
            if (marqueeWrap && marqueeTrack) {
                var mo = new IntersectionObserver(function (entries) {
                    if (!entries.some(function (e) { return e.isIntersecting; })) return;
                    marqueeTrack.classList.add('is-inview');
                    mo.disconnect();
                }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
                mo.observe(marqueeWrap);
            }

            var moneyItems = document.querySelectorAll('.initiative_ul_02 > li');
            if (moneyItems.length) {
                var moneyIO = new IntersectionObserver(function (entries) {
                    if (!entries.some(function (e) { return e.isIntersecting; })) return;
                    moneyItems.forEach(function (li) { li.classList.add('is-inview'); });
                    moneyIO.disconnect();
                }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
                Array.prototype.slice.call(moneyItems, 0, 2).forEach(function (li) { moneyIO.observe(li); });
            }
        }

        // ボタンは出現後に reveal 用クラスを外してホバー演出を正常化
        document.querySelectorAll('.data_more_btn').forEach(function (el) {
            el.addEventListener('transitionend', function handler(e) {
                if (e.target !== el || e.propertyName !== 'opacity') return;
                el.classList.remove('js-reveal', 'is-inview');
                el.style.transitionDelay = '';
                el.style.transitionDuration = '';
                el.removeEventListener('transitionend', handler);
            });
        });

        // About タイトル（ページが定位置に収まってから表示）
        function revealSettledTitles() {
            fixedEls.forEach(function (section) {
                var words = section.querySelectorAll('.fixed_title_word:not(.is-inview)');
                if (!words.length) return;
                var r = section.getBoundingClientRect();
                if (r.top <= window.innerHeight * 0.1 && r.bottom > window.innerHeight * 0.5) {
                    words.forEach(function (w) { w.classList.add('is-inview'); });
                }
            });
        }

        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () { updateTitle(); revealSettledTitles(); });
        }
        window.addEventListener('scroll', function () { scheduleSettle(); }, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', revealSettledTitles);
        revealSettledTitles();

        // ===== 進出企業マーキー：複製は JS で生成（読み上げ・Tab対象外） =====
        var track = document.getElementById('marquee_track');
        if (track) {
            Array.prototype.slice.call(track.children).forEach(function (li) {
                var clone = li.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                clone.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
                clone.querySelectorAll('img').forEach(function (img) { img.setAttribute('alt', ''); });
                track.appendChild(clone);
            });
        }

        // ===== 動画カルーセル =====
        var carousel = document.getElementById('carousel3d');
        var items = document.querySelectorAll('.slider-item');
        var index = 1;

        function renderCarousel() {
            var total = items.length;
            items.forEach(function (item, idx) {
                var diff = (idx - index + total) % total;
                item.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next');
                if (diff === 0) item.classList.add('active');
                else if (diff === 1) item.classList.add('next');
                else if (diff === total - 1) item.classList.add('prev');
                else if (diff <= total / 2) item.classList.add('far-next');
                else item.classList.add('far-prev');
                // 中央以外の動画は Tab 移動・読み上げの対象外
                if (diff === 0) item.removeAttribute('inert'); else item.setAttribute('inert', '');
            });
        }
        function moveCarousel(dir) {
            index = (index + dir + items.length) % items.length;
            renderCarousel();
        }
        if (carousel && items.length) {
            renderCarousel();
            var prev = carousel.querySelector('.carousel-arrow-prev');
            var next = carousel.querySelector('.carousel-arrow-next');
            if (prev) prev.addEventListener('click', function () { moveCarousel(-1); });
            if (next) next.addEventListener('click', function () { moveCarousel(1); });
            // 矢印キーはカルーセルにフォーカスがあるときだけ反応
            carousel.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowLeft') moveCarousel(-1);
                if (e.key === 'ArrowRight') moveCarousel(1);
            });
            // スワイプ対応
            var sx = null;
            carousel.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
            carousel.addEventListener('touchend', function (e) {
                if (sx === null) return;
                var dx = e.changedTouches[0].clientX - sx;
                sx = null;
                if (Math.abs(dx) > 50) moveCarousel(dx < 0 ? 1 : -1);
            }, { passive: true });
        }
    });
})();