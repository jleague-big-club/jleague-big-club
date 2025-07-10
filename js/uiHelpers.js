let bannerAutoPlayInterval;

export function toHalfWidth(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[Ａ-Ｚａ-ｚ０-９．・－（）]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/　/g, ' ');
}

export function updateNavActiveState(id, btn) {
    document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));

    let targetBtn = btn;
    if (!targetBtn) {
        const pageToBtnMap = {
            'top': '#nav-analysis-btn',
            'metrics': 'button[onclick*="showPage(\'metrics\'"]',
            'attendance': 'button[onclick*="showPage(\'attendance\'"]',
            'history': 'button[onclick*="showPage(\'history\'"]',
            'introduce': 'button[onclick*="showPage(\'introduce\'"]',
            'rankings': '#nav-rankings-btn',
            'prediction': 'button[onclick*="showPage(\'prediction\'"]',
            'simulation': '#nav-simulation-btn',
            'best11': 'button[onclick*="showPage(\'best11\'"]',
            'europe': '#nav-europe-btn',
            'europe-top20': 'button[onclick*="showPage(\'europe-top20\'"]',
            'blog': 'button[onclick*="showPage(\'blog\'"]',
        };
        if (pageToBtnMap[id]) {
            targetBtn = document.querySelector(pageToBtnMap[id]);
        }
    }

    if (targetBtn) {
        targetBtn.classList.add('active');
        const parentDropdown = targetBtn.closest('.nav-dropdown');
        if (parentDropdown) {
            parentDropdown.querySelector('button').classList.add('active');
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
    if (bannerAutoPlayInterval) return; // すでにセットアップ済みの場合は何もしない
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
    
    // ポップアップの表示/非表示ロジック
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
        if (scorePop && scorePop.classList.contains('popup-visible') && !scorePop.contains(e.target)) {
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
    
    // フッターボタンの表示制御
    setupFooterButtonObserver();
    
    // ウィンドウリサイズ時の処理
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
    
    // popstateイベント（ブラウザの戻る/進む）
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const { page, slug, title } = event.state;
            if (page === 'blog' && slug) {
                // blog.js内の関数を呼び出す
                import('./pages/blog.js').then(module => {
                    module.showArticleDetail(slug, title, true);
                });
            } else {
                showPage(page, null, true);
            }
        } else {
            showPage('top', null, true);
        }
    });
}


export function handleInitialURL(showPage) {
    const hash = location.hash.substring(1);
    if (hash) {
        if (hash.startsWith('blog/')) {
            const slug = hash.replace('blog/', '');
            import('./dataManager.js').then(dataManager => {
                dataManager.getBlogPosts().then(posts => {
                    const post = posts.find(p => p.slug === slug);
                    if (post) {
                        import('./pages/blog.js').then(blogModule => {
                            blogModule.showArticleDetail(post.slug, post.title);
                        });
                    } else {
                        showPage('top');
                    }
                });
            });
        } else {
            const element = document.getElementById(hash);
            if (element && element.classList.contains('page-section')) {
                showPage(hash);
            } else {
                showPage('top');
            }
        }
    } else {
        showPage('top');
        history.replaceState({ page: 'top' }, '', '#top');
    }
}

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