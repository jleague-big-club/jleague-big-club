// js/main.js

import { setupEventListeners, updateNavActiveState, stopBannerAutoPlay, setupCarousel } from './uiHelpers.js';
import { loadInitialData, getClubData } from './dataManager.js';
import { initializeBlog, showBlogList, showArticleDetail as originalShowArticleDetail, hideArticleDetail, isShowingArticleDetail, getBlogPosts, showPredictionResults } from './pages/blog.js';

// 各ページに対応するモジュールをマッピング
const pageModules = {
    'top': './pages/top.js',
    'metrics': './pages/metrics.js',
    'history': './pages/history.js',
    'introduce': './pages/introduce.js',
    'rankings': './pages/rankings.js',
    'prediction': './pages/prediction.js',
    'attendance': './pages/attendance.js',
    'blog': './pages/blog.js',
    'europe': './pages/europe.js',
    'europe-rankings': './pages/europe-rankings.js',
    'europe-top20': './pages/europe-top20.js',
    'best11': './pages/best11.js',
    'simulation': './pages/simulation.js',
    'barchartrace': './pages/barchartrace.js',
    'winner': './pages/winner.js',
    'elo-ratings': './pages/elo-ratings.js',
    'find-my-club': './pages/findMyClub.js'
};

// 読み込み済みのモジュールをキャッシュ
const loadedModules = {};

// モジュールをプリロードする関数
function preloadModule(pageId) {
    const baseId = pageId.split('/')[0];
    if (pageModules[baseId] && !loadedModules[baseId]) {
        import(pageModules[baseId]);
    }
}

// === OGP情報を更新するヘルパー関数 ===
const updateOgp = (title, description, image, url) => {
    document.title = `${title} | Big Club Japan`;

    const metaTags = {
        'og:title': title,
        'og:description': description,
        'og:image': image,
        'og:url': url,
        'twitter:card': 'summary_large_image',
    };

    for (const property in metaTags) {
        let element = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
        if (element) {
            element.setAttribute('content', metaTags[property]);
        }
    }
};


// 記事ページに広告を挿入する showArticleDetail 関数をここで定義
async function showArticleDetail(slug, title, fromPopState = false) {
    // 元の関数を呼び出して記事を表示
    await originalShowArticleDetail(slug, title, fromPopState);

    const blogContent = document.getElementById('blog-content');
    if (!blogContent || blogContent.style.display === 'none') return;

    // 既存の広告を削除して重複を防ぐ
    blogContent.querySelectorAll('.ad-in-article').forEach(ad => ad.remove());

    // 広告ユニットのHTMLを作成する関数
    const createAdUnit = (slotId) => {
        const adWrapper = document.createElement('div');
        adWrapper.className = 'ad-in-article';
        adWrapper.style.margin = '30px auto';
        adWrapper.style.textAlign = 'center';

        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', 'ca-pub-1470345215148439');
        ins.setAttribute('data-ad-slot', slotId);
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
        
        adWrapper.appendChild(ins);
        
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
        return adWrapper;
    };

    const firstH2 = blogContent.querySelector('h2');
    if (firstH2) {
        const adUnitTop = createAdUnit('8733170368'); 
        firstH2.parentNode.insertBefore(adUnitTop, firstH2);
    }
    
    if (blogContent.children.length > 5) {
        const adUnitBottom = createAdUnit('9802709455');
        blogContent.appendChild(adUnitBottom);
    }
}


// === ページ表示ロジック ===
async function showPage(id, btn, fromPopState = false, initialOptions = {}) {
    try {
        window.scrollTo(0, 0);

        // 汎用的な #/introduce URLを、デフォルトクラブID付きのURLにリダイレクトする
        if (id === 'introduce') {
            const allClubData = getClubData();
            const defaultClub = allClubData.length > 0 ? allClubData.find(c => c.p === 'J1') || allClubData[0] : null;
            if (defaultClub && defaultClub.teamId) {
                const newId = `introduce/${defaultClub.teamId}`;
                history.replaceState({ page: newId }, '', `#/${newId}`);
                return showPage(newId, btn, true, initialOptions);
            }
        }

        let baseId = id.split('/')[0];
        let options = { ...initialOptions };
        if (baseId === 'introduce' && id.includes('/')) {
            const clubId = id.split('/')[1];
            if (clubId) {
                options.detailClubId = clubId;
            }
        }

        const pageTitles = {
            'top': 'Jリーグ ビッグクラブ指数ランキング',
            'metrics': '【2024年】Jリーグ クラブ別 売上高・観客動員数ランキング',
            'history': 'Jリーグ 過去10年のJ1平均順位データ',
            'introduce': 'Jリーグ全クラブ紹介 データ分析',
            'rankings': '【最新】J1・J2・J3・JFL 順位表',
            'prediction': '【AI予測】Jリーグ 2024シーズン順位予測',
            'attendance': 'Jリーグ年度別 平均観客数データ推移',
            'blog': '記事・コラム',
            'europe': '【25-26】5大リーグ所属の日本人選手一覧',
            'europe-rankings': '【25-26】欧州5大リーグ 順位表',
            'europe-top20': '欧州サッカークラブ 売上高ランキングTOP20',
            'best11': 'Jリーグ ベストイレブンメーカー',
            'simulation': 'ビッグクラブ シミュレーター',
            'barchartrace': '【動画】Jリーグ順位変動 バーチャートレース',
            'winner': '【AI予測】Jリーグ WINNER予測',
            'elo-ratings': 'Jリーグ Eloレーティング 最新版',
            'find-my-club': '推しクラブマッチング'
        };

        const siteUrl = 'https://bigclub-japan.com/';
        const defaultDescription = 'Jリーグの「ビッグクラブ」をデータで徹底分析！独自のビッグクラブ指数で、そのポテンシャルを可視化します。';
        const defaultImage = `${siteUrl}img/ogp_image.webp`;

       const pageDescriptions = {
            'top': '独自のビッグクラブ指数でJリーグ全クラブをランキング。浦和レッズ、鹿島アントラーズなど、あなたの応援するクラブの真の実力をデータで分析します。',
            'metrics': 'Jリーグクラブの最新の売上高、平均観客動員数、タイトル数をランキング形式で比較。クラブの経営規模や人気が一目でわかります。',
            'history': '過去10年間のJ1平均順位と在籍年数をデータ化。鹿島や川崎Fなど、安定して強さを誇るクラブはどこか？',
            'introduce': 'J1からJFLまで、Jリーグ全クラブの基本データと紹介文を掲載。レーダーチャートで各クラブの特徴を可視化します。',
            'rankings': 'J1, J2, J3, JFLの最新順位表を掲載。昇格・降格圏内のチームをリアルタイムでチェック。',
            'prediction': '独自のAIがJリーグの2025シーズン最終順位をシミュレーション。優勝確率や降格確率を毎節更新します。',
            'attendance': 'Jリーグの年度別・クラブ別の平均観客数データをグラフで比較。スタジアムの熱気をデータで振り返ります。',
            'winner': 'AIがサッカーくじWINNERの試合結果を予測。データに基づいた本命・対抗・大穴予想で、あなたのWINNERライフをサポート。',
            'elo-ratings': '最新の試合結果を反映したJリーグクラブの強さの指標「Eloレーティング」を公開。今の本当の力関係がわかります。'
        };

        if (id.startsWith('blog/')) {
            const slug = id.substring(5);
            try {
                const allPosts = await getBlogPosts();
                const post = allPosts.find(p => p.slug === slug);
                if (post) {
                    const postDescription = `データ分析サイト「Big Club Japan」の記事：${post.title}`;
                    const postImage = `${siteUrl}${post.thumbnail.startsWith('/') ? post.thumbnail.substring(1) : post.thumbnail}`;
                    updateOgp(post.title, postDescription, postImage, `${siteUrl}#/${id}`);
                } else {
                     updateOgp('記事が見つかりません', defaultDescription, defaultImage, `${siteUrl}#/${id}`);
                }
            } catch (e) {
                updateOgp('記事・ブログ', defaultDescription, defaultImage, `${siteUrl}#/blog`);
            }
        } else if (pageTitles[baseId]) {
            const description = pageDescriptions[baseId] || defaultDescription;
            updateOgp(pageTitles[baseId], description, defaultImage, `${siteUrl}#/${id}`);
        } else {
            updateOgp('Jリーグビッグクラブ分析', defaultDescription, defaultImage, siteUrl);
        }
        
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('visible'));
        const targetPageId = id === 'winner/results' ? 'winner-results' : (id.startsWith('blog/') ? 'blog' : baseId);
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) targetPage.classList.add('visible');

        document.querySelectorAll('.page-title-row').forEach(row => row.style.display = 'none');
        let titleId;
        if (id === 'winner/results') {
            let titleDiv = document.getElementById('page-title-winner-results');
            if (!titleDiv) {
                titleDiv = document.createElement('div');
                titleDiv.id = 'page-title-winner-results';
                titleDiv.className = 'page-title-row';
                titleDiv.innerHTML = '<h1>WINNER予測 結果検証</h1>';
                document.querySelector('main').prepend(titleDiv);
            }
            titleDiv.style.display = 'flex';
        } else {
            titleId = ['europe-top20', 'winner', 'elo-ratings', 'europe-rankings'].includes(baseId) ? baseId : id.split('/')[0];
            const pageTitleDiv = document.getElementById('page-title-' + titleId);
            if (pageTitleDiv) pageTitleDiv.style.display = 'flex';
        }

        updateNavActiveState(id, btn);

        const zundamonGuide = document.getElementById('zundamon-guide');
        if (zundamonGuide) {
            if (baseId === 'find-my-club') {
                zundamonGuide.style.display = 'flex';
            } else {
                zundamonGuide.style.display = 'none';
                if (typeof window.stopCurrentAudio === 'function') {
                    window.stopCurrentAudio();
                }
            }
        }

        const adContainer = document.getElementById('ad-top-banner');
        const scoreBtn = document.getElementById('score-method-btn');
        const banner = document.querySelector('.carousel-container');
        if (baseId === 'top') {
            if (scoreBtn) scoreBtn.style.display = 'block';
            if (banner) banner.style.display = 'block';
            if (adContainer) adContainer.style.display = 'block';
            if (!fromPopState) setupCarousel('banner-carousel', 4000);
        } else {
            if (scoreBtn) scoreBtn.style.display = 'none';
            if (banner) banner.style.display = 'none';
            if (adContainer) adContainer.style.display = 'none';
            stopBannerAutoPlay();
        }

        if (!fromPopState) {
            const newHash = id ? `#/${id}` : '#';
            if(window.location.hash !== newHash) {
                history.pushState({ page: id }, '', newHash);
            }
        }

        const moduleId = baseId;
        if (pageModules[moduleId] && !loadedModules[moduleId]) {
            const module = await import(pageModules[moduleId]);
            loadedModules[moduleId] = module;
        }

        if (moduleId === 'winner' && loadedModules.winner) {
            if (id === 'winner/results') {
                await loadedModules.winner.showPredictionResults();
            } else {
                await loadedModules.winner.initializeWinnerPage(document.getElementById('winner'));
            }
        } else if (moduleId === 'blog' && loadedModules.blog) {
             if (id.startsWith('blog/')) {
                const slug = id.substring(5);
                await showArticleDetail(slug, null, fromPopState);
            } else {
                showBlogList();
            }
        } else {
            if (loadedModules.blog && isShowingArticleDetail()) {
                hideArticleDetail();
            }
            if (loadedModules[moduleId]?.default) {
                 await loadedModules[moduleId].default(document.getElementById(moduleId), options);
            }
        }

        if (typeof gtag === 'function') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname + window.location.hash
            });
        }

    } finally {
        const navLinks = document.getElementById('nav-links');
        if (navLinks && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            document.getElementById('menu-overlay').classList.remove('open');
            document.querySelectorAll('.nav-dropdown.menu-open').forEach(menu => menu.classList.remove('menu-open'));
        }
    }
}

function handleInitialURL() {
    let hash = location.hash.substring(1); 
    if(hash.startsWith('/')) {
        hash = hash.substring(1);
    }
    const pageId = hash || 'top';
    showPage(pageId, null, true);
}

// === 初期化 ===
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadInitialData();
        await initializeBlog(); 
        setupEventListeners(showPage);
        handleInitialURL();
    } catch (err) {
        console.error("サイトの初期化に失敗しました:", err);
        document.body.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">サイトの読み込みに失敗しました。<br>リロードしてみてください。</div>`;
    }
});

// === グローバルスコープでアクセス可能にする関数群 ===
window.showPage = showPage;
window.preloadModule = preloadModule;
window.showArticleDetail = showArticleDetail;

window.addEventListener('hashchange', () => {
    handleInitialURL();
});