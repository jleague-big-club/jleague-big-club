// === page-top.js ===
// トップページ専用の初期化・描画コード

// グローバル変数（common.jsで定義済み）
// let clubData; (アクセス可能)
// let bannerAutoPlayInterval; (アクセス可能)


// トップページの初期化関数
function initializeTopPage() {
    // clubDataがcommon.jsで読み込み済みか確認
    if (window.clubData && window.clubData.length > 0) {
        renderBig5(window.clubData);
        renderOthers(window.clubData);
    }
    // バナーがまだ設定されていなければ設定
    if (!window.bannerAutoPlayInterval) {
        setupCarousel('banner-carousel', 4000);
    }
}

// ビッグ5カードを描画
function renderBig5(clubs) {
    const big5 = clubs.slice(0, 5);
    const big5Div = document.getElementById("big5-cards");
    if (!big5Div) return;
    big5Div.innerHTML = "";
    const row1 = document.createElement("div");
    row1.className = "big5-row";
    const row2 = document.createElement("div");
    row2.className = "big5-row";
    big5.forEach((club, i) => {
        let colorClass = "local";
        if (club.sum >= 30) colorClass = "top-club";
        else if (club.sum >= 20) colorClass = "potential-big";
        else if (club.sum >= 5) colorClass = "middle";
        const isLong = club.name.length >= 10;
        const card = document.createElement("div");
        card.className = `club-card ${colorClass} rank-${i + 1}` + (isLong ? " long-title" : "");
        card.innerHTML = `<h3 class="club-title">${club.name}</h3><div class="score-val">スコア：${club.sum.toFixed(1)}</div>`;
        if (i < 3) row1.appendChild(card);
        else row2.appendChild(card);
    });
    big5Div.appendChild(row1);
    big5Div.appendChild(row2);
}

// 6位以下のテーブルを描画
function renderOthers(clubs) {
    const others = clubs.slice(5);
    const tableDiv = document.getElementById("club-categories");
    if (!tableDiv) return;
    tableDiv.innerHTML = "";
    const table = document.createElement("table");
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ["順位", "クラブ名", "合算スコア", "区分"].forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
    });
    const tbody = table.createTBody();
    others.forEach((club, idx) => {
        let category, colorClass;
        if (club.sum >= 30) { category = "トップクラブ"; colorClass = "top-club"; }
        else if (club.sum >= 20) { category = "潜在的ビッグクラブ"; colorClass = "potential-big"; }
        else if (club.sum >= 5) { category = "中堅クラブ"; colorClass = "middle"; }
        else { category = "ローカルクラブ"; colorClass = "local"; }
        const tr = tbody.insertRow();
        tr.className = colorClass;
        [idx + 6, club.name, club.sum.toFixed(1), category].forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
    });
    tableDiv.appendChild(table);
}

// バナーカルーセルの設定
function setupCarousel(carouselId, interval) {
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

function startBannerAutoPlay(interval, nextFunc) {
    stopBannerAutoPlay();
    window.bannerAutoPlayInterval = setInterval(nextFunc, interval);
}

function stopBannerAutoPlay() {
    clearInterval(window.bannerAutoPlayInterval);
}

// このファイルが読み込まれたら、トップページの初期化を実行
initializeTopPage();