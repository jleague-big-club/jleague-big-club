// js/pages/best11.js

import { getPlayerData } from '../dataManager.js';
import { majorLeagues } from '../config.js';
import { loadScript } from '../uiHelpers.js';

let best11Formation = "343";
let best11Selected = {};
let best11Filter = { type: 'all', value: null };
let nowSelectedPosKey = null;
const HTML2CANVAS_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

const best11Positions = {
    "343": [{ key: "GK", label: "GK" }, { key: "CB1", label: "CB" }, { key: "CB2", label: "CB" }, { key: "CB3", label: "CB" }, { key: "MF1", label: "CMF" }, { key: "MF2", label: "CMF" }, { key: "MF3", label: "LMF" }, { key: "MF4", label: "RMF" }, { key: "MF5", label: "LWG" }, { key: "FW", label: "CF" }, { key: "MF6", label: "RWG" }],
    "433": [{ key: "GK", label: "GK" }, { key: "CB1", label: "LB" }, { key: "CB2", label: "CB" }, { key: "CB3", label: "CB" }, { key: "CB4", label: "RB" }, { key: "MF1", label: "DMF" }, { key: "MF2", label: "CMF" }, { key: "MF3", label: "CMF" }, { key: "MF4", label: "LWG" }, { key: "FW", label: "CF" }, { key: "MF5", label: "RWG" }]
};
const best11PosCoords = {
    "343": { GK: { top: 290, left: 140 }, CB1: { top: 225, left: 50 }, CB2: { top: 235, left: 140 }, CB3: { top: 225, left: 230 }, MF1: { top: 165, left: 90 }, MF2: { top: 165, left: 190 }, MF3: { top: 120, left: 40 }, MF4: { top: 120, left: 240 }, MF5: { top: 60, left: 70 }, FW: { top: 25, left: 140 }, MF6: { top: 60, left: 210 } },
    "433": { GK: { top: 290, left: 140 }, CB1: { top: 200, left: 38 }, CB2: { top: 235, left: 100 }, CB3: { top: 235, left: 190 }, CB4: { top: 200, left: 240 }, MF1: { top: 155, left: 140 }, MF2: { top: 130, left: 55 }, MF3: { top: 130, left: 225 }, MF4: { top: 70, left: 70 }, FW: { top: 25, left: 140 }, MF5: { top: 70, left: 210 } }
};


// --- Event Handling and Utility Functions ---

function downloadImage(canvas, filename, msgSpan) {
    try {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (msgSpan) {
            msgSpan.textContent = 'ダウンロードしました！';
            setTimeout(() => msgSpan.textContent = '', 5000);
        }
    } catch (e) {
        console.error("画像のダウンロードに失敗しました:", e);
        if(msgSpan) msgSpan.textContent = 'エラー: 画像のダウンロードに失敗しました';
    }
}

async function handleBest11ImageCapture(copyBtn) {
    if (!copyBtn) return;
    
    copyBtn.disabled = true;
    const postBtn = document.getElementById('post-to-x-btn');
    if (postBtn) postBtn.disabled = true;

    const msgSpan = document.getElementById('copy-best11-img-msg');
    const buttonsContainer = document.getElementById('capture-buttons');

    if (msgSpan) msgSpan.textContent = '画像生成準備中...';

    try {
        await loadScript(HTML2CANVAS_URL);

        const captureElem = document.getElementById('best11-capture-area');
        const selectedLabel = captureElem.querySelector('.best11-player-label.selected');
        
        if (selectedLabel) selectedLabel.classList.remove('selected');
        if (buttonsContainer) buttonsContainer.style.visibility = 'hidden';
        if (msgSpan) msgSpan.textContent = '';
        
        const canvas = await html2canvas(captureElem, { backgroundColor: null, scale: 2, useCORS: true });
        
        if (selectedLabel) selectedLabel.classList.add('selected');

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            downloadImage(canvas, "best11.png", msgSpan);
        } else {
            canvas.toBlob(blob => {
                if (!blob) {
                    if (msgSpan) msgSpan.textContent = 'エラー: 画像データの生成に失敗しました';
                    return;
                }
                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                        .then(() => {
                            if (msgSpan) {
                                msgSpan.textContent = 'コピーしました！';
                                setTimeout(() => msgSpan.textContent = '', 3000);
                            }
                        })
                        .catch(err => {
                            console.warn("クリップボードへのコピーに失敗しました:", err);
                            downloadImage(canvas, "best11.png", msgSpan);
                        });
                } else {
                    downloadImage(canvas, "best11.png", msgSpan);
                }
            }, 'image/png');
        }
    } catch (error) {
        console.error('画像生成または保存中にエラー:', error);
        if (msgSpan) msgSpan.textContent = 'エラーが発生しました';
    } finally {
        if (buttonsContainer) buttonsContainer.style.visibility = 'visible';
        copyBtn.disabled = false;
        if (postBtn) postBtn.disabled = false;
    }
}

function handlePostToX() {
    const text = "私のベストイレブンはこちら！\n#あなたのベストイレブン";
    const url = "https://jleague-big-club.com";
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank');
}


// --- UI Rendering Functions ---

function renderBest11Filters() {
    const playerData = getPlayerData();
    const filtersDiv = document.getElementById('best11-filters');
    if (!filtersDiv || playerData.length === 0) return;

    const leagues = ["J1", "J2", "J3"];
    const clubsWithLeague = [...new Map(playerData.map(p => [p['所属クラブ'], p['リーグ']])).entries()];
    
    let html = `
        <button class="filter-btn active" onclick="setBest11Filter('all', null, this)">すべて</button>
        <button class="filter-btn" onclick="setBest11Filter('5-da-league', null, this)">5大リーグ</button>
    `;
    leagues.forEach(league => {
        html += `<button class="filter-btn" onclick="setBest11Filter('league', '${league}', this)">${league}</button>`;
    });

    html += `<select id="club-filter-select" onchange="setBest11Filter('club', this.value, this)">
                <option value="all">クラブで絞り込み</option>`;
    clubsWithLeague.sort().forEach(([club, league]) => {
        if (club) html += `<option value="${club}" data-league="${league}">${club}</option>`;
    });
    html += `</select>`;

    filtersDiv.innerHTML = html;
}

function renderPositionTabs() {
    const posBtnContainer = document.getElementById("position-btn-container");
    if (!posBtnContainer) return;

    const positions = best11Positions[best11Formation];
    let html = '';
    positions.forEach((pos, i) => {
        html += `<button class="position-btn${i === 0 ? ' active' : ''}" data-pos="${pos.key}" onclick="selectPosition('${pos.key}', this)">${pos.label}</button>`;
    });
    posBtnContainer.innerHTML = html;
    setTimeout(() => selectPosition(positions[0].key, posBtnContainer.querySelector('.position-btn')), 10);
}

function renderBest11Table() {
    const tableDiv = document.getElementById("best11-table");
    const positions = best11Positions[best11Formation];
    const playerData = getPlayerData();

    const posOrder = [...positions].sort((a, b) =>
        (a.key.startsWith('FW') ? -1 : 1) - (b.key.startsWith('FW') ? -1 : 1) ||
        (b.key.startsWith('MF') ? 1 : -1) - (a.key.startsWith('MF') ? 1 : -1) ||
        (b.key.startsWith('CB') ? 1 : -1) - (a.key.startsWith('CB') ? 1 : -1) ||
        (a.key === 'GK' ? 1 : -1)
    );

    let html = '<table><thead><tr><th>ポジション</th><th>選手</th><th>クラブ</th><th>リーグ</th></tr></thead><tbody>';
    posOrder.forEach(pos => {
        let name = best11Selected[pos.key] || '';
        let club = '', league = '';
        if (name) {
            const player = playerData.find(p => p['選手名'] === name);
            if (player) {
                club = player['所属クラブ'] || '';
                league = player['リーグ'] || '';
            }
        }
        html += `<tr><td style="font-weight:bold;">${pos.label}</td><td${name ? '' : ' class="unselected"'}>${name || '未選択'}</td><td>${club || '-'}</td><td>${league || '-'}</td></tr>`;
    });
    html += "</tbody></table>";
    tableDiv.innerHTML = html;
}

function renderCourtPlayers() {
    const area = document.getElementById('court-area');
    if (!area) return;
    area.innerHTML = '';
    
    best11Positions[best11Formation].forEach(pos => {
        const c = best11PosCoords[best11Formation][pos.key];
        if (!c) return;

        const label = document.createElement('div');
        label.className = 'best11-player-label' + (best11Selected[pos.key] ? '' : ' unselected') + (pos.key === nowSelectedPosKey ? ' selected' : '');
        label.style.top = `${c.top}px`;
        label.style.left = `${c.left}px`;

        let name = best11Selected[pos.key] ? best11Selected[pos.key] : pos.label;
        let fontSize = name.length >= 7 ? '0.80em' : (name.length >= 6 ? '0.89em' : '1em');
        label.innerHTML = `<span style="font-size:${fontSize};">${name}</span>`;
        label.onclick = () => selectPosition(pos.key, document.querySelector(`.position-btn[data-pos="${pos.key}"]`));
        label.style.cursor = "pointer";
        area.appendChild(label);
    });
}

// --- Core Logic Functions ---

window.setBest11Filter = (type, value, element) => {
    best11Filter = { type, value };
    document.querySelectorAll('#best11-filters .filter-btn').forEach(btn => btn.classList.remove('active'));

    if (element.tagName === 'BUTTON') {
        element.classList.add('active');
        document.getElementById('club-filter-select').value = 'all';
    } else if (element.tagName === 'SELECT' && value === 'all') {
        document.querySelector('#best11-filters .filter-btn[onclick*="\'all\'"]').classList.add('active');
        best11Filter = { type: 'all', value: null };
    }
    
    const clubSelect = document.getElementById('club-filter-select');
    const playerData = getPlayerData();
    const originalOptions = [...new Map(playerData.map(p => [p['所属クラブ'], p['リーグ']])).entries()].filter(([club]) => club).sort();
    
    let clubsToShow;
    if (best11Filter.type === 'league') {
        clubsToShow = originalOptions.filter(([, league]) => league === best11Filter.value);
    } else if (best11Filter.type === '5-da-league') {
        clubsToShow = originalOptions.filter(([, league]) => majorLeagues.includes(league));
    } else {
        clubsToShow = originalOptions;
    }
    
    let optionsHtml = `<option value="all">クラブで絞り込み</option>`;
    clubsToShow.forEach(([club, league]) => {
        optionsHtml += `<option value="${club}" data-league="${league}">${club}</option>`;
    });
    clubSelect.innerHTML = optionsHtml;
    
    if (best11Filter.type === 'club') {
        clubSelect.value = best11Filter.value;
    }
    
    if (nowSelectedPosKey) {
        const currentPosBtn = document.querySelector(`.position-btn[data-pos="${nowSelectedPosKey}"]`);
        selectPosition(nowSelectedPosKey, currentPosBtn);
    }
};

window.selectPosition = (posKey, btn) => {
    nowSelectedPosKey = posKey;
    document.querySelectorAll('#position-tabs .position-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    let listDiv = document.getElementById('player-choice-list');
    if (!listDiv) return;

    const playerData = getPlayerData();
    let sourceData;

    switch (best11Filter.type) {
        case 'league':
            sourceData = playerData.filter(p => p['リーグ'] === best11Filter.value);
            break;
        case 'club':
            sourceData = playerData.filter(p => p['所属クラブ'] === best11Filter.value);
            break;
        case '5-da-league':
            sourceData = playerData.filter(p => majorLeagues.includes(p['リーグ']));
            break;
        default:
            sourceData = playerData;
    }

    const searchKey = posKey.replace(/[0-9]/g, '').toUpperCase();
    let players = sourceData.filter(p => {
        const playerPos = (p['ポジション'] || "").toUpperCase();
        if (playerPos === searchKey) return true;
        if (searchKey === 'CB' && playerPos === 'DF') return true;
        if ((searchKey === 'MF' || searchKey === 'LMF' || searchKey === 'RMF' || searchKey === 'CMF' || searchKey === 'DMF') && playerPos === 'MF') return true;
        if ((searchKey === 'FW' || searchKey === 'LWG' || searchKey === 'RWG' || searchKey === 'CF') && playerPos === 'FW') return true;
        return false;
    });

    if (players.length === 0) {
        listDiv.innerHTML = `<div style="color:white; padding: 10px;">この条件の選手がいません。</div>`;
    } else {
        const selectedPlayerName = best11Selected[posKey] || '選手を選択...';
        let optionsHTML = `<div class="custom-option" data-value="">選手を選択...</div>`;
        players.forEach(p => {
            const playerName = p['選手名'];
            optionsHTML += `<div class="custom-option" data-value="${playerName}">${playerName}</div>`;
        });

        listDiv.innerHTML = `
            <div class="custom-select-container">
                <button class="custom-select-trigger">${selectedPlayerName}</button>
                <div class="custom-options">${optionsHTML}</div>
            </div>`;

        const container = listDiv.querySelector('.custom-select-container');
        const trigger = container.querySelector('.custom-select-trigger');
        const options = container.querySelectorAll('.custom-option');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', function () {
                const value = this.getAttribute('data-value');
                choosePlayer(posKey, value);
                trigger.textContent = value || '選手を選択...';
                container.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (container && container.classList.contains('open') && !container.contains(e.target)) {
                container.classList.remove('open');
            }
        });
    }
    renderCourtPlayers();
};

window.choosePlayer = (posKey, name) => {
    if (name) {
        best11Selected[posKey] = name;
    } else {
        delete best11Selected[posKey];
    }
    renderBest11Table();
    renderCourtPlayers();
};

window.setFormation = (form, btn) => {
    best11Formation = form;
    document.getElementById("formation-title").textContent = "フォーメーション：" + btn.textContent;
    document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    best11Selected = {};
    best11Filter = { type: 'all', value: null };
    
    initBest11Page(); 

    document.querySelectorAll('#best11-filters .filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#best11-filters .filter-btn').classList.add('active');
    const clubSelect = document.getElementById('club-filter-select');
    if (clubSelect) clubSelect.value = 'all';
};


// --- Initialization ---

function setupBest11EventListeners() {
    const captureButtonsContainer = document.getElementById('capture-buttons');
    if (!captureButtonsContainer) return;

    // To prevent multiple listeners, we replace the element with its clone, which removes all old listeners
    const newContainer = captureButtonsContainer.cloneNode(true);
    captureButtonsContainer.parentNode.replaceChild(newContainer, captureButtonsContainer);

    newContainer.addEventListener('click', async (event) => {
        const target = event.target;
        
        const copyBtn = target.closest('#copy-best11-img-btn');
        const postBtn = target.closest('#post-to-x-btn');

        if (copyBtn) {
            await handleBest11ImageCapture(copyBtn);
        } else if (postBtn) {
            handlePostToX();
        }
    });
}

export default function initBest11Page() {
    renderBest11Filters();
    renderPositionTabs();
    renderBest11Table();
    renderCourtPlayers();
    
    const copyButton = document.getElementById('copy-best11-img-btn');
    if (copyButton) {
        if (window.innerWidth <= 768) {
            copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>ダウンロード</span>';
        } else {
            copyButton.innerHTML = '画像をコピー';
        }
    }

    setupBest11EventListeners();
}