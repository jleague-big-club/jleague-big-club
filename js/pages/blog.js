// js/pages/blog.js

import { getBlogPosts } from '../dataManager.js';
import { loadScript } from '../uiHelpers.js';

const articlesPerPage = 9;
let currentPage = 1;
let _isShowingArticleDetail = false;
const MARKED_JS_URL = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';

// ★★★【追加】getBlogPosts をエクスポートして main.js から使えるようにする
export { getBlogPosts };

export function isShowingArticleDetail() {
    return _isShowingArticleDetail;
}

export function hideArticleDetail() {
    const contentDiv = document.getElementById('blog-content');
    const listContainer = document.getElementById('blog-list-container');
    const paginationContainer = document.getElementById('pagination');

    if (contentDiv) {
        contentDiv.style.display = 'none';
        contentDiv.innerHTML = '';
    }
    // ブログリストを再表示する
    if (listContainer) listContainer.style.display = 'flex';
    if (paginationContainer) paginationContainer.style.display = 'block';

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
    } else {
        return;
    }

    try {
        await loadScript(MARKED_JS_URL);
        
        const res = await fetch(`/posts/${slug}.md`);
        if (!res.ok) throw new Error(`Markdownファイルが見つかりません: ${slug}.md`);
        const md = await res.text();
        const bodyContent = md.replace(/^---[\s\S]*?---/, '').trim();
        const html = marked.parse(bodyContent);

        let homeButton, secondaryButton;
        const introMapping = {
            'prediction-intro': { page: 'prediction', name: 'シーズン予測' },
            'best11-intro': { page: 'best11', name: 'ベスト11メーカー' },
            'simulation-intro': { page: 'simulation', name: 'シミュレーター' },
            'attendance-intro': { page: 'attendance', name: '平均観客数' },
            'europe-intro': { page: 'europe', name: '5大リーグ' },
            'bigclub-challenge': { page: 'top', name: 'ビッグクラブ指数' }
        };

        if (slug === 'prediction-logic-explainer') {
            homeButton = `<a href="#prediction" onclick="event.preventDefault(); window.location.hash='#prediction';" class="back-to-list-btn"> « シーズン予測に戻る </a>`;
            secondaryButton = `<a href="#blog" onclick="event.preventDefault(); window.location.hash='#blog';" class="to-page-btn"> 記事一覧へ » </a>`;
        } else if (introMapping[slug]) {
            const { page, name } = introMapping[slug];
            homeButton = `<a href="#top" onclick="event.preventDefault(); window.location.hash='#top';" class="back-to-list-btn"> « ホームに戻る </a>`;
            secondaryButton = `<a href="#${page}" onclick="event.preventDefault(); window.location.hash='#${page}';" class="to-page-btn"> ${name}へ » </a>`;
        } else {
            homeButton = `<a href="#top" onclick="event.preventDefault(); window.location.hash='#top';" class="back-to-list-btn"> « ホームに戻る </a>`;
            secondaryButton = `<a href="#blog" onclick="event.preventDefault(); window.location.hash='#blog';" class="to-page-btn"> 記事一覧に戻る » </a>`;
        }

        const buttonsHtml = ` <div style="text-align:center; margin-top:3em; display:flex; justify-content:center; gap:20px;"> ${homeButton} ${secondaryButton} </div> `;
        
        contentDiv.innerHTML = `${html}${buttonsHtml}`;
        
        const pageTitle = document.querySelector('#page-title-blog h1');
        if (pageTitle && title) pageTitle.textContent = title;

    } catch (err) {
        console.error("記事詳細の読み込みエラー:", err);
        if (contentDiv) contentDiv.innerHTML = `<p style="color: red;">記事の読み込みに失敗しました。</p>`;
        _isShowingArticleDetail = false;
    }
}

function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = 'pagination-btn';
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.onclick = () => renderArticleList(i);
        paginationContainer.appendChild(pageButton);
    }
}

function renderArticleList(page) {
    currentPage = page;
    getBlogPosts().then(blogPosts => {
        const listContainer = document.getElementById('blog-list-container');
        if (!listContainer) return;
        listContainer.innerHTML = "";

        const totalPages = Math.ceil(blogPosts.length / articlesPerPage);
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
            card.onclick = () => {
                window.location.hash = `#blog/${post.slug}`;
            };
            listContainer.appendChild(card);
        });
        renderPagination(totalPages);
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

// ★★★【ここからが結果検証ページのコード】★★★

export async function showPredictionResults() {
    _isShowingArticleDetail = true; // 詳細表示中フラグを立てる
    const contentContainer = document.getElementById('blog-content');
    const listContainer = document.getElementById('blog-list-container');
    const paginationContainer = document.getElementById('pagination');

    if (listContainer) listContainer.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';
    if (contentContainer) {
        contentContainer.style.display = 'block';
        contentContainer.innerHTML = `<p>結果データを読み込み中...</p>`;
    } else {
        return;
    }

    let manifest = [];
    try {
        const manifestResponse = await fetch('./predictions-archive/archive-manifest.json');
        if (manifestResponse.ok) manifest = await manifestResponse.json();
    } catch (e) { console.warn('アーカイブマニフェストの読み込みに失敗', e); }

    const versions = [...new Set(manifest.map(file => file.split('/')[0]))].sort().reverse();
    const versionOptions = versions.map(v => `<option value="${v}">${v}</option>`).join('');

    contentContainer.innerHTML = `
        <button onclick="window.location.hash='#winner';" class="back-to-list-btn">← 予測ページに戻る</button>
        <h1>WINNER予測 結果検証</h1>
        <div class="result-controls">
            <div class="control-group">
                <label for="result-version-select">バージョン:</label>
                <select id="result-version-select">${versionOptions}</select>
            </div>
            <div class="control-group">
                <label for="result-date-select">過去の結果:</label>
                <select id="result-date-select"></select>
            </div>
        </div>
        <div id="prediction-accuracy-display" class="accuracy-display"></div>
        <div class="winner-league-tabs" id="result-league-tabs">
            <button class="winner-tab-btn active" data-league="J1">J1</button>
            <button class="winner-tab-btn" data-league="J2">J2</button>
            <button class="winner-tab-btn" data-league="J3">J3</button>
        </div>
        <div id="result-cards-container" class="winner-cards-container"></div>
    `;

    const versionSelect = document.getElementById('result-version-select');
    const dateSelect = document.getElementById('result-date-select');
    const leagueTabs = document.getElementById('result-league-tabs').querySelectorAll('.winner-tab-btn');

    const render = () => {
        const selectedVersion = versionSelect.value;
        updateDateOptions(selectedVersion, dateSelect, manifest);
        
        const selectedDateFile = dateSelect.value;
        const activeLeague = document.querySelector('#result-league-tabs .winner-tab-btn.active').dataset.league;
        
        loadAndRenderResults(selectedVersion, selectedDateFile, activeLeague, manifest);
    };

    versionSelect.addEventListener('change', render);
    dateSelect.addEventListener('change', render);
    leagueTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            leagueTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            render();
        });
    });

    render();
}

function updateDateOptions(selectedVersion, dateSelect, manifest) {
    const filteredDates = manifest.filter(file => file.startsWith(selectedVersion + '/'));
    const currentSelected = dateSelect.value;

    dateSelect.innerHTML = `
        <option value="latest">最新の結果</option>
        ${filteredDates.map(file => {
            const dateStr = file.split('_')[1].replace('.json', '');
            return `<option value="${file}">${dateStr} の結果</option>`;
        }).join('')}
    `;
    if (filteredDates.includes(currentSelected)) {
        dateSelect.value = currentSelected;
    }
}

async function loadAndRenderResults(version, dateFile, league, manifest) {
    const container = document.getElementById('result-cards-container');
    const accuracyContainer = document.getElementById('prediction-accuracy-display');
    container.innerHTML = `<p>結果を読み込み中...</p>`;
    accuracyContainer.innerHTML = '';

    const versionFiles = manifest.filter(f => f.startsWith(version + '/'));
    if (versionFiles.length === 0) {
        container.innerHTML = `<p>このバージョンの結果データがありません。</p>`;
        return;
    }

    const predictionFilePath = (dateFile === 'latest') 
        ? `./predictions-archive/${versionFiles[0]}`
        : `./predictions-archive/${dateFile}`;
    
    try {
        const [predictionRes, scheduleText] = await Promise.all([
            fetch(predictionFilePath),
            fetch('./data/schedule.csv').then(res => res.text())
        ]);

        if (!predictionRes.ok) throw new Error('予測データの読み込みに失敗');
        
        const predictionData = await predictionRes.json();
        const scheduleMap = parseSchedule(scheduleText);
        
        const matches = predictionData[league];
        if (!matches || matches.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#fff; padding: 50px 0;">この日の${league}の試合はありませんでした。</p>`;
        } else {
            container.innerHTML = matches.map(match => {
                const resultScore = scheduleMap.get(`${match.home}-${match.away}`);
                return createResultCardHTML(match, resultScore);
            }).join('');
        }

        await calculateAndRenderAccuracy(version, versionFiles, scheduleMap, accuracyContainer);
    } catch (error) {
        console.error("結果表示エラー:", error);
        container.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

function parseSchedule(scheduleText) {
    const scheduleMap = new Map();
    const rows = scheduleText.trim().split('\n').slice(1);
    rows.forEach(row => {
        const cols = row.split(',');
        if (cols.length > 7 && cols[4] && cols[7] && cols[5] && cols[6]) {
            const home = cols[4].trim();
            const away = cols[7].trim();
            const homeScore = parseInt(cols[5], 10);
            const awayScore = parseInt(cols[6], 10);
            if (!isNaN(homeScore) && !isNaN(awayScore)) {
                scheduleMap.set(`${home}-${away}`, `${homeScore}-${awayScore}`);
            }
        }
    });
    return scheduleMap;
}

function createResultCardHTML(match, resultScore) {
    const predictionsHTML = match.predictions.map(pred => {
        let hitClass = '';
        if (resultScore) {
            if (pred.score === resultScore) hitClass = 'hit';
            else hitClass = 'miss';
        }
        return `<div class="prediction-row ${pred.class} ${hitClass}"><span class="prediction-type ${pred.class}">${pred.type}</span><span class="prediction-score">${pred.score}</span><span class="prediction-odds">${pred.odds}</span></div>`;
    }).join('');

    return `
        <div class="winner-card result-card">
            <div class="match-info">
                <div class="kickoff">${match.kickoff}</div>
                <div class="teams">
                    <span class="home-team">${match.home}</span><span class="vs">vs</span><span class="away-team">${match.away}</span>
                </div>
                <div class="result-score ${resultScore ? '' : 'pending'}">${resultScore || '結果待'}</div>
            </div>
            <div class="prediction-title">▼ 予測と結果</div>
            <div class="prediction-list">${predictionsHTML}</div>
        </div>
    `;
}

async function calculateAndRenderAccuracy(selectedVersion, versionFiles, scheduleMap, container) {
    let totalPredictions = 0, honmeiHits = 0, taikoHits = 0, ooanaHits = 0;

    for (const file of versionFiles) {
        try {
            const res = await fetch(`./predictions-archive/${file}`);
            if (!res.ok) continue;
            const data = await res.json();

            for (const league of ['J1', 'J2', 'J3']) {
                if (data[league]) {
                    for (const match of data[league]) {
                        const resultScore = scheduleMap.get(`${match.home}-${match.away}`);
                        if (resultScore) {
                            totalPredictions++;
                            if (match.predictions[0]?.score === resultScore) honmeiHits++;
                            if (match.predictions[1]?.score === resultScore) taikoHits++;
                            if (match.predictions[2]?.score === resultScore) ooanaHits++;
                        }
                    }
                }
            }
        } catch (e) { console.warn(`集計エラー: ${file}`, e); }
    }

    if (totalPredictions > 0) {
        const honmeiRate = (honmeiHits / totalPredictions * 100).toFixed(1);
        const taikoRate = (taikoHits / totalPredictions * 100).toFixed(1);
        const ooanaRate = (ooanaHits / totalPredictions * 100).toFixed(1);
        
        container.innerHTML = `
            <h3>${selectedVersion} モデル精度 (集計試合数: ${totalPredictions})</h3>
            <div class="accuracy-grid">
                <div>本命 的中率: <strong>${honmeiRate}%</strong> <span>(${honmeiHits}件)</span></div>
                <div>対抗 的中率: <strong>${taikoRate}%</strong> <span>(${taikoHits}件)</span></div>
                <div>大穴 的中率: <strong>${ooanaRate}%</strong> <span>(${ooanaHits}件)</span></div>
            </div>
        `;
    } else {
        container.innerHTML = `<p>${selectedVersion} の集計データはまだありません。</p>`;
    }
}


let blogInitialized = false;
export function initializeBlog() {
    if (blogInitialized) return Promise.resolve();
    return getBlogPosts().then(() => {
        blogInitialized = true;
    });
}

export default function initBlogPage(pageContainer) {
    if (!pageContainer) return;
    
    if (!isShowingArticleDetail()) {
        showBlogList();
    }
}