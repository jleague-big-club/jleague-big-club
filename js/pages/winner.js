// js/pages/winner.js

let winnerData = null;
let archiveList = null;

// --- 共通で使う関数 ---
async function loadArchiveList() {
    if (archiveList) return;
    try {
        const response = await fetch('./predictions-archive/archive-manifest.json');
        archiveList = response.ok ? await response.json() : [];
    } catch (error) {
        console.warn("過去の予測リストの読み込みに失敗:", error);
        archiveList = [];
    }
}

async function loadWinnerData(filePath = './data/winner-predictions.json') {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("WINNER予測データの読み込みに失敗しました:", error);
        const container = document.querySelector('#winner .winner-cards-container');
        if(container) container.innerHTML = `<p style="color: #ff9999;">予測データの読み込みに失敗しました。</p>`;
        return null;
    }
}

// =======================================================
// === 予測ページ ( #winner ) 用のロジック ===
// =======================================================

function createWinnerCardHTML(match) {
    const predictionsHTML = match.predictions.map(pred => `<div class="prediction-row ${pred.class}"><span class="prediction-type ${pred.class}">${pred.type}</span><span class="prediction-score">${pred.score}</span><span class="prediction-odds">${pred.odds}</span></div>`).join('');
    return `<div class="winner-card"><div class="match-info"><div class="kickoff">${match.kickoff}</div><div class="teams"><span class="home-team">${match.home}</span><span class="vs">vs</span><span class="away-team">${match.away}</span></div></div><div class="prediction-title">▼ データ分析によるスコア予測</div><div class="prediction-list">${predictionsHTML}</div></div>`;
}

function renderWinnerCards(league, data) {
    const container = document.querySelector('#winner .winner-cards-container');
    if (!container) return;
    if (!data || !data[league] || data[league].length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#fff; padding: 50px 0;">現在、この日の${league}のWINNER対象試合の予測はありません。</p>`;
    } else {
        container.innerHTML = data[league].map(createWinnerCardHTML).join('');
    }
}

async function handleTabClick(event) {
    const pageContainer = document.getElementById('winner');
    const tabs = pageContainer.querySelectorAll('.winner-tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
    renderWinnerCards(event.currentTarget.dataset.league, winnerData);
}

async function handleArchiveChange(event) {
    const pageContainer = document.getElementById('winner');
    const filePath = event.target.value === 'current' ? './data/winner-predictions.json' : `./predictions-archive/${event.target.value}`;
    winnerData = await loadWinnerData(filePath);
    const activeLeague = pageContainer.querySelector('.winner-tab-btn.active').dataset.league;
    renderWinnerCards(activeLeague, winnerData);
}

export async function initializeWinnerPage(pageContainer) {
    if (!pageContainer || pageContainer.childElementCount > 0) return;

    await loadArchiveList();
    
    const dateOptions = archiveList ? archiveList.map(file => {
        const parts = file.split(/[\\/]/);
        const version = parts.length > 1 ? parts[0] : 'ver.1';
        const fileNameOnly = parts[parts.length - 1];
        const dateStr = fileNameOnly.replace('winner-predictions_', '').replace('.json', '');
        return `<option value="${file}">(${version}) ${dateStr} の予測</option>`;
    }).join('') : '';

    pageContainer.innerHTML = `
        <a href="#winner/results" class="editors-pick-banner">
            <span class="editors-pick-text">最新の結果はこちら</span>
        </a>
        <div class="winner-controls-row">
            <div class="winner-archive-selector">
                <label for="archive-select">過去の予測を見る:</label>
                <select id="archive-select">
                    <option value="current">最新の予測</option>
                    ${dateOptions}
                </select>
            </div>
            <div class="winner-league-tabs">
                <button class="winner-tab-btn active" data-league="J1">J1</button>
                <button class="winner-tab-btn" data-league="J2">J2</button>
                <button class="winner-tab-btn" data-league="J3">J3</button>
            </div>
        </div>
        <div class="winner-cards-container"><p>予測データを読み込んでいます...</p></div>
        <div class="winner-disclaimer">
            <h4>【ご注意】</h4>
            <p>
                当サイトのWINNER予測は、過去のデータや独自の統計モデルに基づいていますが、的中を保証するものではありません。<br>
                提示されるスコアやオッズはあくまで参考情報です。<br>
                スポーツくじの購入は、ご自身の判断と責任において、20歳以上の方が行ってください。
            </p>
        </div>
    `;

    const tabs = pageContainer.querySelectorAll('.winner-tab-btn');
    tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
    pageContainer.querySelector('#archive-select').addEventListener('change', handleArchiveChange);

    winnerData = await loadWinnerData(); 
    renderWinnerCards('J1', winnerData);
}


// =======================================================
// === 結果検証ページ ( #winner-results ) 用のロジック ===
// =======================================================

function createResultCardHTML(match, resultScore) {
    const predictionsHTML = match.predictions.map(pred => {
        let hitClass = resultScore ? (pred.score === resultScore ? 'hit' : 'miss') : '';
        return `<div class="prediction-row ${pred.class} ${hitClass}"><span class="prediction-type ${pred.class}">${pred.type}</span><span class="prediction-score">${pred.score}</span><span class="prediction-odds">${pred.odds}</span></div>`;
    }).join('');

    const resultDisplayHTML = resultScore 
        ? `<div class="match-result-display"><span>試合結果</span><span class="score">${resultScore}</span></div>` 
        : '';

    return `
        <div class="winner-card result-card">
            ${resultDisplayHTML}
            <div class="match-info">
                <div class="kickoff">${match.kickoff}</div>
                <div class="teams">
                    <span class="home-team">${match.home}</span>
                    <span class="vs">vs</span>
                    <span class="away-team">${match.away}</span>
                </div>
            </div>
            <div class="prediction-title">▼ 予測一覧</div>
            <div class="prediction-list">${predictionsHTML}</div>
        </div>
    `;
}

function parseSchedule(scheduleText) {
    const scheduleMap = new Map();
    scheduleText.trim().split('\n').slice(1).forEach(row => {
        const cols = row.split(',');
        if (cols.length > 7 && cols[0] && cols[4] && cols[7] && cols[5] && cols[6] && !isNaN(parseInt(cols[5])) && !isNaN(parseInt(cols[6]))) {
            const year = cols[0].trim();
            const home = cols[4].trim();
            const away = cols[7].trim();
            const score = `${parseInt(cols[5])}-${parseInt(cols[6])}`;
            scheduleMap.set(`${year}-${home}-${away}`, score);
        }
    });
    return scheduleMap;
}

async function calculateAndRenderAccuracy(selectedVersion, versionFiles, scheduleMap, container) {
    let total = 0, hits = { honmei: 0, taiko: 0, ooana: 0 };

    for (const file of versionFiles) {
        try {
            const data = await (await fetch(`./predictions-archive/${file}`)).json();
            const yearFromFilename = file.split('_')[1]?.substring(0, 4);

            if (!yearFromFilename) continue;

            ['J1', 'J2', 'J3'].forEach(league => {
                if (data[league]) {
                    data[league].forEach(match => {
                        const resultKey = `${yearFromFilename}-${match.home}-${match.away}`;
                        const resultScore = scheduleMap.get(resultKey);
                        if (resultScore) {
                            total++;
                            if (match.predictions[0]?.score === resultScore) hits.honmei++;
                            if (match.predictions[1]?.score === resultScore) hits.taiko++;
                            if (match.predictions[2]?.score === resultScore) hits.ooana++;
                        }
                    });
                }
            });
        } catch (e) { console.warn(`集計エラー: ${file}`, e); }
    }
    
    if (total > 0) {
        container.innerHTML = `<h3>${selectedVersion} モデル精度 (集計試合数: ${total})</h3><div class="accuracy-grid"><div>本命 的中率: <strong>${(hits.honmei/total*100).toFixed(1)}%</strong> <span>(${hits.honmei}件)</span></div><div>対抗 的中率: <strong>${(hits.taiko/total*100).toFixed(1)}%</strong> <span>(${hits.taiko}件)</span></div><div>大穴 的中率: <strong>${(hits.ooana/total*100).toFixed(1)}%</strong> <span>(${hits.ooana}件)</span></div></div>`;
    } else {
        container.innerHTML = `<p>${selectedVersion} の集計データはまだありません。</p>`;
    }
}

async function loadAndRenderResults(version, dateFile, league, manifest, scheduleMap) {
    const pageContainer = document.getElementById('winner-results');
    const container = pageContainer.querySelector('#result-cards-container');
    const accuracyContainer = pageContainer.querySelector('#prediction-accuracy-display');
    container.innerHTML = `<p>結果を読み込み中...</p>`;
    accuracyContainer.innerHTML = '';
    
    const versionFiles = manifest.filter(f => f.startsWith(version + '/'));
    if (versionFiles.length === 0) {
        container.innerHTML = `<p>このバージョンの結果データがありません。</p>`;
        return;
    }
    
    let predictionFilePath;
    if (dateFile === 'latest') {
        predictionFilePath = versionFiles.length > 0 ? `./predictions-archive/${versionFiles[0]}` : null;
    } else {
        predictionFilePath = `./predictions-archive/${dateFile}`;
    }
    
    if (!predictionFilePath) {
        container.innerHTML = `<p>表示する予測データがありません。</p>`;
        return;
    }
    
    const predictionData = await loadWinnerData(predictionFilePath);
    if (!predictionData) {
        container.innerHTML = `<p style="color: red;">予測データの読み込みに失敗しました。</p>`;
        return;
    }

    const yearFromFilename = predictionFilePath.split('_')[1]?.substring(0, 4);

    const matches = predictionData[league];
    if (!matches || matches.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#fff; padding: 50px 0;">この日の${league}の試合はありませんでした。</p>`;
    } else {
        container.innerHTML = matches.map(match => {
            const resultKey = `${yearFromFilename}-${match.home}-${match.away}`;
            const resultScore = scheduleMap.get(resultKey);
            return createResultCardHTML(match, resultScore);
        }).join('');
    }
    await calculateAndRenderAccuracy(version, versionFiles, scheduleMap, accuracyContainer);
}

function updateDateOptions(selectedVersion, dateSelect, manifest) {
    const filteredDates = manifest.filter(file => file.startsWith(selectedVersion + '/'));
    const currentSelected = dateSelect.value;
    dateSelect.innerHTML = `<option value="latest">最新の結果</option>${filteredDates.map(file => {
        return `<option value="${file}">${file.split('_')[1].replace('.json','')} の結果</option>`;
    }).join('')}`;
    if (filteredDates.some(f => f === currentSelected)) {
        dateSelect.value = currentSelected;
    }
}

export async function showPredictionResults() {
    const pageContainer = document.getElementById('winner-results');
    if (!pageContainer || pageContainer.childElementCount > 0) return;

    await loadArchiveList();
    const scheduleText = await fetch('./data/schedule.csv').then(res => res.text());
    const scheduleMap = parseSchedule(scheduleText);

    const versions = [...new Set(archiveList.map(file => file.split('/')[0]))].sort().reverse();
    const versionOptions = versions.map(v => `<option value="${v}">${v}</option>`).join('');

    // ★★★【ここを修正】★★★
    // CSSで追加した .result-controls-wrapper に合わせてHTML構造を変更
    pageContainer.innerHTML = `
        <a href="#winner" onclick="window.location.hash='#winner'; return false;" class="back-to-list-btn">← 予測ページに戻る</a>
        
        <div class="result-controls-wrapper">
            <div class="result-controls">
                <div class="control-group"><label for="result-version-select">バージョン:</label><select id="result-version-select">${versionOptions}</select></div>
                <div class="control-group"><label for="result-date-select">過去の結果:</label><select id="result-date-select"></select></div>
            </div>
            <div id="prediction-accuracy-display" class="accuracy-display"></div>
        </div>

        <div class="winner-league-tabs" id="result-league-tabs">
            <button class="winner-tab-btn active" data-league="J1">J1</button> <button class="winner-tab-btn" data-league="J2">J2</button> <button class="winner-tab-btn" data-league="J3">J3</button>
        </div>
        <div id="result-cards-container" class="winner-cards-container"></div>
    `;

    const versionSelect = pageContainer.querySelector('#result-version-select');
    const dateSelect = pageContainer.querySelector('#result-date-select');
    const leagueTabs = pageContainer.querySelector('#result-league-tabs').querySelectorAll('.winner-tab-btn');

    const render = () => {
        const selectedVersion = versionSelect.value;
        updateDateOptions(selectedVersion, dateSelect, archiveList);
        const selectedDateFile = dateSelect.value;
        const activeLeague = pageContainer.querySelector('#result-league-tabs .winner-tab-btn.active').dataset.league;
        loadAndRenderResults(selectedVersion, selectedDateFile, activeLeague, archiveList, scheduleMap);
    };

    versionSelect.addEventListener('change', render);
    dateSelect.addEventListener('change', render);
    leagueTabs.forEach(tab => tab.addEventListener('click', e => {
        leagueTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        render();
    }));

    render();
}

// winner.jsがデフォルトでエクスポートする関数
export default initializeWinnerPage;