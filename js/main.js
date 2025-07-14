// js/main.js

import { setupEventListeners, handleInitialURL, updateNavActiveState, stopBannerAutoPlay, setupCarousel } from './uiHelpers.js';
import { loadInitialData } from './dataManager.js';
import { initializeBlog } from './pages/blog.js';

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
    'europe-top20': './pages/europe-top20.js',
    'best11': './pages/best11.js',
    'simulation': './pages/simulation.js',
    'barchartrace': './pages/barchartrace.js' // ← ここに barchartrace を追加
};

// 読み込み済みのモジュールをキャッシュ
const loadedModules = {};

// モジュールをプリロードする関数
function preloadModule(pageId) {
    if (pageModules[pageId] && !loadedModules[pageId]) {
        import(pageModules[pageId]);
    }
}

// === ページ表示ロジック ===
async function showPage(id, btn, fromPopState = false) {
    try {
        window.scrollTo(0, 0);

        const pageTitles = {
            'top': 'Jリーグ ビッグクラブ指数',
            'metrics': 'クラブ指標 - Jリーグビッグクラブ分析',
            'history': 'Jリーグ過去データ - Jリーグビッグクラブ分析',
            'introduce': '各クラブ紹介 - Jリーグビッグクラブ分析',
            'rankings': 'Jリーグ 順位表 - Jリーグビッグクラブ分析',
            'prediction': 'Jリーグ シーズン予測 - Jリーグビッグクラブ分析',
            'attendance': 'Jリーグ 平均観客数 - Jリーグビッグクラブ分析',
            'blog': '記事・ブログ - Jリーグビッグクラブ分析',
            'europe': '5大リーグ日本人選手 - Jリーグビッグクラブ分析',
            'europe-top20': '欧州クラブ売上高TOP20 - Jリーグビッグクラブ分析',
            'best11': 'ベスト11メーカー - Jリーグビッグクラブ分析',
            'simulation': 'ビッグクラブシミュレーター - Jリーグビッグクラブ分析',
            'barchartrace': 'Jリーグ バーチャートレース - Jリーグビッグクラブ分析' // ← バーチャートレース用のタイトルを追加
        };
        // 対応するタイトルがあれば文書のタイトルを更新
        const baseId = id.split('/')[0];
        document.title = pageTitles[baseId] || 'Jリーグビッグクラブ分析';

        // UIの更新
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('visible'));
        const targetPage = document.getElementById(id);
        if (targetPage) targetPage.classList.add('visible');

        document.querySelectorAll('.page-title-row').forEach(row => row.style.display = 'none');
        let titleId = (id === 'europe-top20') ? 'europe-top20' : id;
        const pageTitleDiv = document.getElementById('page-title-' + titleId);
        if (pageTitleDiv) pageTitleDiv.style.display = 'flex';

        updateNavActiveState(id, btn);

        const scoreBtn = document.getElementById('score-method-btn');
        const banner = document.querySelector('.carousel-container');

        if (id === 'top') {
            if (scoreBtn) scoreBtn.style.display = 'block';
            if (banner) banner.style.display = 'block';
            setupCarousel('banner-carousel', 4000);
        } else {
            if (scoreBtn) scoreBtn.style.display = 'none';
            if (banner) banner.style.display = 'none';
            stopBannerAutoPlay();
        }

        // 履歴の更新
        if (!fromPopState) {
            const state = { page: id };
            const url = `#${id}`;
            history.pushState(state, '', url);
        }
if (typeof gtag === 'function') {
            const GA_TRACKING_ID = 'G-RZ7LMDQ2KM'; // あなたのトラッキングID
            const pagePath = location.pathname + location.hash;
            
            gtag('config', GA_TRACKING_ID, {
                'page_path': pagePath,
                'page_title': document.title
            });
        }

        // === モジュールの動的読み込みと初期化 ===
        if (pageModules[id]) {
            if (!loadedModules[id]) {
                const module = await import(pageModules[id]);
                loadedModules[id] = module;
                // 初回読み込み時にデフォルトエクスポートされた関数を実行
                if (module.default && typeof module.default === 'function') {
                    await module.default();
                }
            }
        }
        
        // ブログページの特殊処理
        if (id === 'blog') {
            const blogModule = loadedModules['blog'];
            if (blogModule) {
                blogModule.showBlogList();
            }
        } else {
             const blogModule = loadedModules['blog'];
             if(blogModule && blogModule.isShowingArticleDetail()) {
                 blogModule.hideArticleDetail();
             }
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

// === 初期化 ===
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadInitialData();
        await initializeBlog(); 
        
        setupEventListeners(showPage);
        handleInitialURL(showPage);
    } catch (err) {
        console.error("サイトの初期化に失敗しました:", err);
        document.body.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">サイトの読み込みに失敗しました。<br>リロードしてみてください。</div>`;
    }
});


// === グローバルスコープでアクセス可能にする関数群 ===
window.showPage = showPage;
window.preloadModule = preloadModule;

// blog.jsからshowArticleDetailをインポートしてグローバルに公開
import { showArticleDetail } from './pages/blog.js';
window.showArticleDetail = showArticleDetail;