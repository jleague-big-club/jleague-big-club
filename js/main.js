import { setupEventListeners, handleInitialURL, updateNavActiveState, stopBannerAutoPlay, setupCarousel } from './uiHelpers.js';
import { loadInitialData, getClubData } from './dataManager.js';
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
};

// 読み込み済みのモジュールをキャッシュ
const loadedModules = {};

// === ページ表示ロジック ===
async function showPage(id, btn, fromPopState = false) {
    try {
        window.scrollTo(0, 0);

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

        // === モジュールの動的読み込みと初期化 ===
        if (pageModules[id]) {
            if (!loadedModules[id]) {
                const module = await import(pageModules[id]);
                loadedModules[id] = module;
            }
            if (loadedModules[id] && typeof loadedModules[id].default === 'function') {
                await loadedModules[id].default();
            }
        }
        
        // ブログページの特殊処理
        if (id === 'blog') {
            const blogModule = loadedModules['blog'];
            if(blogModule && !blogModule.isShowingArticleDetail()){
                blogModule.showBlogList();
            }
        } else {
             const blogModule = loadedModules['blog'];
             if(blogModule) {
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
        await initializeBlog(); // ブログ記事リストは最初に読み込んでおく
        
        setupEventListeners(showPage); // イベントリスナーにshowPage関数を渡す
        handleInitialURL(showPage);
    } catch (err) {
        console.error("サイトの初期化に失敗しました:", err);
        document.body.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">サイトの読み込みに失敗しました。<br>リロードしてみてください。</div>`;
    }
});

// グローバルスコープでshowPageをアクセス可能にする
window.showPage = showPage;