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
    const listContainer = document.getElementById('blog-list-container');
    const paginationContainer = document.getElementById('pagination');
    
    if (contentDiv) contentDiv.style.display = 'none';
    if (listContainer) listContainer.style.display = 'flex';
    if (paginationContainer) paginationContainer.style.display = 'block';
    
    _isShowingArticleDetail = false;
}

export async function showArticleDetail(slug, title, fromPopState = false) {
    _isShowingArticleDetail = true;
    const listContainer = document.getElementById('blog-list-container');
    const paginationContainer = document.getElementById('pagination');
    const contentDiv = document.getElementById('blog-content');

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
            const homeButton = `<a href="#top" onclick="event.preventDefault(); window.showPage('top', null);" style="color:#aaa; font-weight:bold; text-decoration:none; border:1px solid #aaa; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> « ホームに戻る </a>`;

            let secondaryButton;
            const introMapping = {
                'prediction-intro': { page: 'prediction', name: 'シーズン予測' },
                'best11-intro': { page: 'best11', name: 'ベスト11メーカー' },
                'simulation-intro': { page: 'simulation', name: 'シミュレーター' },
                'attendance-intro': { page: 'attendance', name: '平均観客数' },
                'europe-intro': { page: 'europe', name: '5大リーグ' },
                'bigclub-challenge': { page: 'top', name: 'ビッグクラブ指数' }
            };

            if (introMapping[slug]) {
                const { page, name } = introMapping[slug];
                secondaryButton = `<a href="#${page}" onclick="event.preventDefault(); window.showPage('${page}', null);" style="color:#299ad3; font-weight:bold; text-decoration:none; border:1px solid #299ad3; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> ${name}に戻る » </a>`;
            } else {
                secondaryButton = `<a href="#blog" onclick="event.preventDefault(); window.showPage('blog', null);" style="color:#299ad3; font-weight:bold; text-decoration:none; border:1px solid #299ad3; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> 記事一覧に戻る » </a>`;
            }

            const buttonsHtml = ` <div style="text-align:center; margin-top:3em; display:flex; justify-content:center; gap:20px;"> ${homeButton} ${secondaryButton} </div> `;

            contentDiv.innerHTML = `${html}${buttonsHtml}`;
            contentDiv.style.display = "block";
            
            window.showPage('blog', null, true); 
            const pageTitle = document.querySelector('#page-title-blog h1');
            if (pageTitle) pageTitle.textContent = title;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (!fromPopState) {
                const state = { page: 'blog', slug: slug, title: title };
                const url = `#blog/${slug}`;
                history.pushState(state, title, url);
            }
        }
    } catch (err) {
        console.error("記事詳細の読み込みエラー:", err);
        if (contentDiv) contentDiv.innerHTML = `<p style="color: red;">記事の読み込みに失敗しました。</p>`;
        _isShowingArticleDetail = false;
    }
}
window.showArticleDetail = showArticleDetail;

function renderPagination() {
    getBlogPosts().then(blogPosts => {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(blogPosts.length / articlesPerPage);
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.style.cssText = `margin:0 5px; padding:6px 14px; border:none; border-radius:5px; cursor:pointer; background:${i === currentPage ? '#299ad3' : '#eee'}; color:${i === currentPage ? '#fff' : '#333'};`;
            btn.onclick = () => {
                renderArticleList(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
            };
            paginationContainer.appendChild(btn);
        }
    });
}

function renderArticleList(page) {
    currentPage = page;
    getBlogPosts().then(blogPosts => {
        const listContainer = document.getElementById('blog-list-container');
        const paginationContainer = document.getElementById('pagination');

        if (listContainer) listContainer.innerHTML = "";
        if (paginationContainer) paginationContainer.style.display = 'block';

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
            card.onclick = () => showArticleDetail(post.slug, post.title);
            if (listContainer) listContainer.appendChild(card);
        });
        renderPagination();
    });
}

export function showBlogList() {
    _isShowingArticleDetail = false;
    const listContainer = document.getElementById('blog-list-container');
    const paginationContainer = document.getElementById('pagination');
    const contentDiv = document.getElementById('blog-content');
    const pageTitle = document.querySelector('#page-title-blog h1');

    if (pageTitle) pageTitle.textContent = '記事・ブログ';
    if (listContainer) listContainer.style.display = 'flex';
    if (paginationContainer) paginationContainer.style.display = 'block';
    if (contentDiv) contentDiv.style.display = 'none';
    
    renderArticleList(currentPage);
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