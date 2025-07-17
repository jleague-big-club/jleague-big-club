// js/main.js

import { setupEventListeners, handleInitialURL, updateNavActiveState, stopBannerAutoPlay, setupCarousel } from './uiHelpers.js';
import { loadInitialData } from './dataManager.js';
import { initializeBlog, showBlogList, showArticleDetail, hideArticleDetail, isShowingArticleDetail, getBlogPosts } from './pages/blog.js';

const pageModules = {
    'top': './pages/top.js', 'metrics': './pages/metrics.js', 'history': './pages/history.js', 'introduce': './pages/introduce.js',
    'rankings': './pages/rankings.js', 'prediction': './pages/prediction.js', 'attendance': './pages/attendance.js',
    'blog': './pages/blog.js', 'europe': './pages/europe.js', 'europe-top20': './pages/europe-top20.js', 'best11': './pages/best11.js',
    'simulation': './pages/simulation.js', 'barchartrace': './pages/barchartrace.js', 'winner': './pages/winner.js'
};

const loadedModules = {};

function preloadModule(pageId) {
    const baseId = pageId.split('/')[0];
    if (pageModules[baseId] && !loadedModules[baseId]) {
        import(pageModules[baseId]);
    }
}

async function showPage(id, btn, fromPopState = false) {
    try {
        window.scrollTo(0, 0);

        const baseId = id.split('/')[0];
        const pageTitles = {
            'top': 'Jリーグ ビッグクラブ指数', 'metrics': 'クラブ指標', 'history': 'Jリーグ過去データ',
            'introduce': '各クラブ紹介', 'rankings': 'Jリーグ 順位表', 'prediction': 'Jリーグ シーズン予測',
            'attendance': 'Jリーグ 平均観客数', 'blog': '記事・ブログ', 'europe': '5大リーグ日本人選手',
            'europe-top20': '欧州クラブ売上高TOP20', 'best11': 'ベスト11メーカー', 'simulation': 'ビッグクラブシミュレーター',
            'barchartrace': 'Jリーグ バーチャートレース', 'winner': 'Jリーグ WINNER予測'
        };
        // ★★★【修正】結果ページ用のタイトルを追加
        if (id === 'winner/results') {
            document.title = 'WINNER予測 結果検証 - Jリーグビッグクラブ分析';
        } else {
            document.title = pageTitles[baseId] ? `${pageTitles[baseId]} - Jリーグビッグクラブ分析` : 'Jリーグビッグクラブ分析';
        }

        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('visible'));
        // ★★★【修正】#winner/results の場合は winner-results を表示
        const targetPageId = id === 'winner/results' ? 'winner-results' : baseId;
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) targetPage.classList.add('visible');

        document.querySelectorAll('.page-title-row').forEach(row => row.style.display = 'none');
        // ★★★【修正】結果ページ用のタイトル表示
        let titleId = id === 'winner/results' ? 'winner-results' : (id === 'europe-top20' ? 'europe-top20' : baseId);
        if (id === 'winner/results') {
             // 結果ページ専用のタイトルdivを動的に作るか、HTMLに用意する
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
            const pageTitleDiv = document.getElementById('page-title-' + titleId);
            if (pageTitleDiv) pageTitleDiv.style.display = 'flex';
        }


        updateNavActiveState(id, btn);

        const scoreBtn = document.getElementById('score-method-btn');
        const banner = document.querySelector('.carousel-container');
        if (baseId === 'top') {
            if (scoreBtn) scoreBtn.style.display = 'block';
            if (banner) banner.style.display = 'block';
            if(!fromPopState) setupCarousel('banner-carousel', 4000);
        } else {
            if (scoreBtn) scoreBtn.style.display = 'none';
            if (banner) banner.style.display = 'none';
            stopBannerAutoPlay();
        }

        if (!fromPopState) {
            history.pushState({ page: id }, '', `#${id}`);
        }

        const moduleId = baseId;
        if (pageModules[moduleId] && !loadedModules[moduleId]) {
            const module = await import(pageModules[moduleId]);
            loadedModules[moduleId] = module;
        }

        // ★★★【ここから大幅に簡略化】★★★
        if (moduleId === 'winner' && loadedModules.winner) {
            if (id === 'winner/results') {
                await loadedModules.winner.showPredictionResults();
            } else {
                await loadedModules.winner.initializeWinnerPage(document.getElementById('winner'));
            }
        } else if (moduleId === 'blog' && loadedModules.blog) {
             if (id.startsWith('blog/')) {
                const slug = id.substring(5);
                const allPosts = await getBlogPosts();
                const postData = allPosts.find(p => p.slug === slug);
                await showArticleDetail(slug, postData?.title, fromPopState);
            } else {
                showBlogList();
            }
        } else {
            // 他のページに移動したら、ブログ詳細を隠す
            if (loadedModules.blog && isShowingArticleDetail()) {
                hideArticleDetail();
            }
            // 他のページの初期化処理があればここに書く
            if (loadedModules[moduleId]?.default) {
                 await loadedModules[moduleId].default(document.getElementById(moduleId));
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

window.showPage = showPage;
window.preloadModule = preloadModule;
window.showArticleDetail = showArticleDetail;