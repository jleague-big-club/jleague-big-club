// js/uiHelpers.js

let bannerAutoPlayInterval;

export function toHalfWidth(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[Ａ-Ｚａ-ｚ０-９．・－（）]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/　/g, ' ');
}

export function updateNavActiveState(id, btn) {
    document.querySelectorAll('.nav-links a, .nav-links button').forEach(el => el.classList.remove('active'));

    let targetEl;
    if (btn) {
        targetEl = btn;
    } else {
        const pageToSelectorMap = {
            'top': '#nav-analysis-btn',
            'metrics': 'a[href="#metrics"]',
            'attendance': 'a[href="#attendance"]',
            'history': 'a[href="#history"]',
            'introduce': 'a[href="#introduce"]',
            'rankings': '#nav-rankings-btn',
            'prediction': 'a[href="#prediction"]',
            'simulation': '#nav-simulation-btn',
            'best11': 'a[href="#best11"]',
            'europe': '#nav-europe-btn',
            'europe-top20': 'a[href="#europe-top20"]',
            'blog': 'a[href="#blog"]',
        };
        // blog/slug のような形式にも対応
        const baseId = id.split('/')[0];
        if (pageToSelectorMap[baseId]) {
            targetEl = document.querySelector(pageToSelectorMap[baseId]);
        }
    }

    if (targetEl) {
        targetEl.classList.add('active');
        const parentDropdown = targetEl.closest('.nav-dropdown');
        if (parentDropdown) {
            const parentTrigger = parentDropdown.querySelector('a');
            if(parentTrigger) parentTrigger.classList.add('active');
        }
    }
}


export function stopBannerAutoPlay() {
    clearInterval(bannerAutoPlayInterval);
    bannerAutoPlayInterval = null;
}

export function startBannerAutoPlay(interval, nextFunc) {
    stopBannerAutoPlay();
    bannerAutoPlayInterval = setInterval(nextFunc, interval);
}

export function setupCarousel(carouselId, interval) {
    if (bannerAutoPlayInterval) return;
    let carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const newCarousel = carousel.cloneNode(true);
    carousel.parentNode.replaceChild(newCarousel, carousel);
    carousel = newCarousel;

    const track = carousel.querySelector('.carousel-track');
    const items = Array.from(track.children);
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');
    const itemsPerScreen = window.innerWidth > 768 ? 2 : 1;

    if (items.length <= itemsPerScreen) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }

    const originalItemCount = items.length;
    for (let i = 0; i < itemsPerScreen; i++) {
        track.appendChild(items[i].cloneNode(true));
    }

    let currentIndex = 0;
    let isAnimating = false;
    const animationTime = 400;
    const cooldownTime = 500;

    function updateTrackPosition() {
        const movePercentage = 100 / itemsPerScreen;
        track.style.transform = `translateX(-${currentIndex * movePercentage}%)`;
    }

    track.addEventListener('transitionend', () => {
        if (currentIndex >= originalItemCount) {
            track.style.transition = 'none';
            currentIndex = 0;
            updateTrackPosition();
            setTimeout(() => {
                track.style.transition = `transform ${animationTime}ms ease-in-out`;
            }, 20);
        }
    });

    function moveToNext() {
        if (isAnimating) return;
        isAnimating = true;
        track.style.transition = `transform ${animationTime}ms ease-in-out`;
        currentIndex++;
        updateTrackPosition();
        setTimeout(() => { isAnimating = false; }, cooldownTime);
    }

    function moveToPrev() {
        if (isAnimating) return;
        isAnimating = true;
        if (currentIndex <= 0) {
            track.style.transition = 'none';
            currentIndex = originalItemCount;
            updateTrackPosition();
            setTimeout(() => {
                track.style.transition = `transform ${animationTime}ms ease-in-out`;
                currentIndex--;
                updateTrackPosition();
            }, 20);
        } else {
            track.style.transition = `transform ${animationTime}ms ease-in-out`;
            currentIndex--;
            updateTrackPosition();
        }
        setTimeout(() => { isAnimating = false; }, cooldownTime);
    }
    
    // カルーセル内のすべてのリンクに対して、クリックイベントを強制的に再設定する
    const links = track.querySelectorAll('a');
    links.forEach(link => {
        link.removeAttribute('onclick'); // 既存のonclick属性を削除
        
        link.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            const href = this.getAttribute('href');
            if (href) {
                window.location.hash = href;
            }
        }, true); // イベントを先にキャッチする
    });

    nextBtn.addEventListener('click', () => {
        stopBannerAutoPlay();
        moveToNext();
        startBannerAutoPlay(interval, moveToNext);
    });
    prevBtn.addEventListener('click', () => {
        stopBannerAutoPlay();
        moveToPrev();
        startBannerAutoPlay(interval, moveToNext);
    });

    carousel.addEventListener('mouseenter', stopBannerAutoPlay);
    carousel.addEventListener('mouseleave', () => startBannerAutoPlay(interval, moveToNext));

    startBannerAutoPlay(interval, moveToNext);
}


export function setupEventListeners(showPage) {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    const menuOverlay = document.getElementById('menu-overlay');

    if (hamburgerBtn && navLinks && menuOverlay) {
        const toggleMenu = () => {
            const isOpen = navLinks.classList.toggle('open');
            menuOverlay.classList.toggle('open');
            if (!isOpen) {
                document.querySelectorAll('.nav-dropdown.menu-open').forEach(menu => {
                    menu.classList.remove('menu-open');
                });
            }
        };
        hamburgerBtn.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', toggleMenu);
    }

    // ナビゲーションリンクのクリックイベントを一元管理
    document.querySelectorAll('#nav-links a, #mobile-header a').forEach(link => {
        // toggleSubMenuを呼び出すリンクは除外
        if (!link.hasAttribute('onmouseover') && link.getAttribute('onclick') !== "event.preventDefault(); toggleSubMenu(this, event);") {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const href = link.getAttribute('href');
                if(href) {
                    window.location.hash = href;
                }

                // スマホメニューが開いていれば閉じる
                if (navLinks && navLinks.classList.contains('open')) {
                    navLinks.classList.remove('open');
                    menuOverlay.classList.remove('open');
                }
            });
        }
    });


    const scoreBtn = document.getElementById("score-method-btn");
    const scorePop = document.getElementById("score-method-pop");
    const detailLink = document.getElementById("score-detail-link");
    const detailPop = document.getElementById("score-detail-pop");

    if (scoreBtn) {
        scoreBtn.onclick = (e) => {
            e.stopPropagation();
            scorePop.classList.toggle('popup-visible');
            detailPop.classList.remove('popup-visible');
        };
    }
    if (detailLink) {
        detailLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            detailPop.classList.add('popup-visible');
        };
    }

    document.addEventListener("click", (e) => {
        const board = document.getElementById("club-status-board");
        if (board && board.style.display === "block" && !board.contains(e.target) && !e.target.matches("td[onclick^='showClubStatus']")) {
            board.style.display = "none";
        }
        if (scorePop && scorePop.classList.contains('popup-visible') && !scorePop.contains(e.target) && !scoreBtn.contains(e.target)) {
            scorePop.classList.remove('popup-visible');
        }
        if (detailPop && detailPop.classList.contains('popup-visible') && !detailPop.contains(e.target) && !detailLink.contains(e.target)) {
            detailPop.classList.remove('popup-visible');
        }
        const helpPop = document.getElementById('prediction-help-pop');
        const helpBtn = document.getElementById('prediction-help-btn');
        if (helpPop && helpPop.style.display === 'block' && (!helpBtn || !helpBtn.contains(e.target)) && !helpPop.contains(e.target)) {
            helpPop.style.display = 'none';
        }
        const scoreCalcPop = document.querySelector('.score-calc-pop');
        const scoreCalcBtn = document.querySelector('.score-calc-btn');
        if (scoreCalcPop && scoreCalcBtn) {
            if (scoreCalcPop.style.display === 'block' && !scoreCalcBtn.contains(e.target)) {
                scoreCalcPop.style.display = 'none';
            }
        }
    });

    const scoreCalcBtn = document.querySelector('.score-calc-btn');
    if (scoreCalcBtn) {
        const scoreCalcPop = scoreCalcBtn.querySelector('.score-calc-pop');
        if (scoreCalcPop) {
            scoreCalcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = scoreCalcPop.style.display === 'block';
                scoreCalcPop.style.display = isVisible ? 'none' : 'block';
            });
        }
    }
    
    setupFooterButtonObserver();
    
    window.addEventListener('resize', () => {
        const best11CopyBtn = document.getElementById('copy-best11-img-btn');
        if (best11CopyBtn) {
            if (window.innerWidth <= 768) {
                best11CopyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>ダウンロード</span>';
            } else {
                best11CopyBtn.innerHTML = '画像をコピー';
            }
        }
    });
}


// ▼▼▼【ここから修正】▼▼▼
export function handleInitialURL(showPage) {
    const hash = location.hash;

    if (hash.startsWith('#blog/')) {
        const slug = hash.substring('#blog/'.length);
        
        // 1. 先に 'blog' ページを表示状態にする
        showPage('blog', null, true);

        // 2. slugに基づいて記事詳細の表示を試みる
        //    setTimeoutを使い、showPageの描画処理と競合しないようにする
        setTimeout(() => {
            import('./dataManager.js').then(dataManager => {
                dataManager.getBlogPosts().then(posts => {
                    const post = posts.find(p => p.slug === slug);
                    // index.jsonに記事があればそのタイトルを、なければslugから仮のタイトルを生成
                    const title = post ? post.title : slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    // 履歴を重複させないため fromPopState=true を渡す
                    window.showArticleDetail(slug, title, true);
                });
            });
        }, 0);

    } else {
        const pageId = hash.substring(1) || 'top';
        showPage(pageId, null, true);
    }
}
// ▲▲▲【ここまで修正】▲▲▲

function setupFooterButtonObserver() {
    const scoreBtn = document.getElementById('score-method-btn');
    const footer = document.querySelector('.site-footer');

    if (window.innerWidth <= 768) {
        if (scoreBtn) {
            scoreBtn.classList.add('fixed-to-viewport');
        }
        return;
    }

    if (!scoreBtn || !footer) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    scoreBtn.classList.remove('fixed-to-viewport');
                } else {
                    scoreBtn.classList.add('fixed-to-viewport');
                }
            });
        },
        { root: null, rootMargin: '0px', threshold: 0 }
    );
    observer.observe(footer);
}

export function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            if (window[src.split('/').pop().split('.')[0]]) { // e.g. window['marked']
                resolve();
                return;
            }
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script load error for ${src}`));
        document.head.appendChild(script);
    });
}

function toggleSubMenu(btn, event) {
    event.preventDefault();
    event.stopPropagation();
    const parentDropdown = btn.parentElement;
    document.querySelectorAll('.nav-links .nav-dropdown.menu-open').forEach(openMenu => {
        if (openMenu !== parentDropdown) {
            openMenu.classList.remove('menu-open');
        }
    });
    parentDropdown.classList.toggle('menu-open');
}

window.toggleSubMenu = toggleSubMenu;

window.addEventListener('hashchange', () => {
    handleInitialURL(window.showPage);
});