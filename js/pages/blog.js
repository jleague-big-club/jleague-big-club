// js/pages/blog.js

import { getBlogPosts } from '../dataManager.js';
import { loadScript } from '../uiHelpers.js';

const articlesPerPage = 18;
let currentPage = 1;
let _isShowingArticleDetail = false;
const MARKED_JS_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';

export function isShowingArticleDetail() {
    return _isShowingArticleDetail;
}

export function hideArticleDetail() {
    const contentDiv = document.getElementById('blog-content');
    if (contentDiv) {
        contentDiv.style.display = 'none';
        contentDiv.innerHTML = '';
    }
    _isShowingArticleDetail = false;
}

export async function showArticleDetail(slug, title, fromPopState = false) {
    _isShowingArticleDetail = true;
    const contentDiv = document.getElementById('blog-content');
    const listContainer = document.getElementById('blog-list-container');
    const paginationContainer = document.getElementById('pagination');

    if (listContainer) listContainer.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';

    if(contentDiv) {
        contentDiv.innerHTML = '<p>記事を読み込んでいます...</p>';
        contentDiv.style.display = 'block';
    }

    try {
        await loadScript(MARKED_JS_URL);
        
        const res = await fetch(`/posts/${slug}.md`);
        if (!res.ok) throw new Error(`Markdownファイルが見つかりません: ${slug}.md`);
        const md = await res.text();
        const bodyContent = md.replace(/^---[\s\S]*?---/, '').trim();
        const html = marked.parse(bodyContent);

        if (contentDiv) {
            let homeButton, secondaryButton;
            const introMapping = {
                'prediction-intro': { page: 'prediction', name: 'シーズン予測' },
                'best11-intro': { page: 'best11', name: 'ベスト11メーカー' },
                'simulation-intro': { page: 'simulation', name: 'シミュレーター' },
                'attendance-intro': { page: 'attendance', name: '平均観客数' },
                'europe-intro': { page: 'europe', name: '5大リーグ' },
                'bigclub-challenge': { page: 'top', name: 'ビッグクラブ指数' }
            };

            // ★★★ onclickをwindow.location.hashの変更に統一 ★★★
            if (slug === 'prediction-logic-explainer') {
                homeButton = `<a href="#prediction" onclick="event.preventDefault(); window.location.hash='#prediction';" style="color:#aaa; font-weight:bold; text-decoration:none; border:1px solid #aaa; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> « シーズン予測に戻る </a>`;
                secondaryButton = `<a href="#blog" onclick="event.preventDefault(); window.location.hash='#blog';" style="color:#299ad3; font-weight:bold; text-decoration:none; border:1px solid #299ad3; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> 記事一覧へ » </a>`;
            } else if (introMapping[slug]) {
                const { page, name } = introMapping[slug];
                homeButton = `<a href="#top" onclick="event.preventDefault(); window.location.hash='#top';" style="color:#aaa; font-weight:bold; text-decoration:none; border:1px solid #aaa; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> « ホームに戻る </a>`;
                secondaryButton = `<a href="#${page}" onclick="event.preventDefault(); window.location.hash='#${page}';" style="color:#299ad3; font-weight:bold; text-decoration:none; border:1px solid #299ad3; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> ${name}へ » </a>`;
            } else {
                homeButton = `<a href="#top" onclick="event.preventDefault(); window.location.hash='#top';" style="color:#aaa; font-weight:bold; text-decoration:none; border:1px solid #aaa; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> « ホームに戻る </a>`;
                secondaryButton = `<a href="#blog" onclick="event.preventDefault(); window.location.hash='#blog';" style="color:#299ad3; font-weight:bold; text-decoration:none; border:1px solid #299ad3; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> 記事一覧に戻る » </a>`;
            }

            const buttonsHtml = ` <div style="text-align:center; margin-top:3em; display:flex; justify-content:center; gap:20px;"> ${homeButton} ${secondaryButton} </div> `;
            
            contentDiv.innerHTML = `${html}${buttonsHtml}`;
            
            const pageTitle = document.querySelector('#page-title-blog h1');
            if (pageTitle) pageTitle.textContent = title;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // ★★★ 履歴管理の修正 ★★★
            if (!fromPopState) {
                // stateのpageプロパティを 'blog/slug' 形式ではなく、'blog' に統一
                const state = { page: 'blog', slug: slug, title: title }; 
                const url = `#blog/${slug}`;
                // history.pushStateを呼び出すのはshowPage側に任せるので、ここでは呼ばない
                // ただし、直接URLを更新する必要がある場合は残す
                if (window.location.hash !== url) {
                   history.pushState(state, title, url);
                }
            }
        }
    } catch (err) {
        console.error("記事詳細の読み込みエラー:", err);
        if (contentDiv) contentDiv.innerHTML = `<p style="color: red;">記事の読み込みに失敗しました。</p>`;
        _isShowingArticleDetail = false;
    }
}

function renderPagination() {
    // ... (この関数は変更なし) ...
}

function renderArticleList(page) {
    currentPage = page;
    getBlogPosts().then(blogPosts => {
        const listContainer = document.getElementById('blog-list-container');
        if (!listContainer) return;
        listContainer.innerHTML = "";

        const start = (page - 1) * articlesPerPage;
        const currentPosts = blogPosts.slice(start, start + articlesPerPage);

        currentPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'blog-card';
             card.innerHTML = `
                <img src="/${post.thumbnail}" alt="${post.title}" loading="lazy" decoding="async" width="300" height="160">
                <div class="blog-card-content">
                    <div class="blog-card-title">${post.title}</div>
                    <div class="blog-card-date">${post.date}</div>
                </div>
            `;
            // ★★★ onclickの挙動をURLハッシュの変更に統一 ★★★
            card.onclick = () => {
                window.location.hash = `#blog/${post.slug}`;
            };
            listContainer.appendChild(card);
        });
        renderPagination();
    });
}

export function showBlogList() {
    hideArticleDetail();

    const listContainer = document.getElementById('blog-list-container');
    const paginationContainer = document.getElementById('pagination');
    const pageTitle = document.querySelector('#page-title-blog h1');

    if (pageTitle) pageTitle.textContent = '記事・ブログ';
    if (listContainer) listContainer.style.display = 'flex';
    if (paginationContainer) paginationContainer.style.display = 'block';

    if (!listContainer.hasChildNodes() || listContainer.children.length === 0) {
        renderArticleList(1);
    }
}

let blogInitialized = false;
export function initializeBlog() {
    if (blogInitialized) return Promise.resolve();
    return getBlogPosts().then(() => {
        blogInitialized = true;
    });
}

export default function initBlogPage() {
    if (!isShowingArticleDetail()) {
        showBlogList();
    }
}