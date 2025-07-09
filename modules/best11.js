// === modules/best11.js (確定版) ===

// このファイル内で使う変数
let best11Formation = "343";
let best11Selected = {};
let nowSelectedPosKey = null;
let best11Initialized = false; // 初期化済みかの目印

// このページで使う固定データ
const best11Positions = { "343": [{ key: "GK", label: "GK" }, { key: "CB1", label: "CB1" }, { key: "CB2", label: "CB2" }, { key: "CB3", label: "CB3" }, { key: "MF1", label: "MF1" }, { key: "MF2", label: "MF2" }, { key: "MF3", label: "MF3" }, { key: "MF4", label: "MF4" }, { key: "MF5", label: "MF5" }, { key: "MF6", label: "MF6" }, { key: "FW", label: "FW" }], "433": [{ key: "GK", label: "GK" }, { key: "CB1", label: "CB1" }, { key: "CB2", label: "CB2" }, { key: "CB3", label: "CB3" }, { key: "CB4", label: "CB4" }, { key: "MF1", label: "MF1" }, { key: "MF2", label: "MF2" }, { key: "MF3", label: "MF3" }, { key: "MF4", label: "MF4" }, { key: "MF5", label: "MF5" }, { key: "FW", label: "FW" }] };
const best11PosCoords = { "343": { GK: { top: 290, left: 140 }, CB1: { top: 225, left: 50 }, CB2: { top: 235, left: 140 }, CB3: { top: 225, left: 230 }, MF1: { top: 165, left: 90 }, MF2: { top: 165, left: 190 }, MF3: { top: 120, left: 40 }, MF4: { top: 120, left: 240 }, MF5: { top: 60, left: 70 }, FW: { top: 25, left: 140 }, MF6: { top: 60, left: 210 } }, "433": { GK: { top: 290, left: 140 }, CB1: { top: 200, left: 38 }, CB2: { top: 235, left: 100 }, CB3: { top: 235, left: 190 }, CB4: { top: 200, left: 240 }, MF1: { top: 155, left: 140 }, MF2: { top: 130, left: 55 }, MF3: { top: 130, left: 225 }, MF4: { top: 70, left: 70 }, FW: { top: 25, left: 140 }, MF5: { top: 70, left: 210 } } };

// ----------------------------------------------------
// ▼ 関数定義 (ここから) ▼
// ----------------------------------------------------

function renderBest11Filters() {
    const filtersDiv = document.getElementById('best11-filters');
    if (!filtersDiv || !window.playerData || window.playerData.length === 0) return;
    const leagues = ["J1", "J2", "J3"];
    const clubsWithLeague = [...new Map(window.playerData.map(p => [p['所属クラブ'], p['リーグ']])).entries()];
    let html = `<button class="filter-btn active" onclick="setBest11Filter('all', null, this)">すべて</button> <button class="filter-btn" onclick="setBest11Filter('5-da-league', null, this)">5大リーグ</button>`;
    leagues.forEach(league => {
        html += `<button class="filter-btn" onclick="setBest11Filter('league', '${league}', this)">${league}</button>`;
    });
    html += `<select id="club-filter-select" onchange="setBest11Filter('club', this.value, this)"> <option value="all">クラブで絞り込み</option>`;
    clubsWithLeague.sort().forEach(([club, league]) => {
        if (club) html += `<option value="${club}" data-league="${league}">${club}</option>`;
    });
    html += `</select>`;
    filtersDiv.innerHTML = html;
}

function setBest11Filter(type, value, element) {
    window.best11Filter = { type, value };
    document.querySelectorAll('#best11-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (element.tagName === 'BUTTON') {
        element.classList.add('active');
        const clubSelect = document.getElementById('club-filter-select');
        if (clubSelect) clubSelect.value = 'all';
    } else if (element.tagName === 'SELECT' && value === 'all') {
        const allButton = document.querySelector('#best11-filters .filter-btn[onclick*="\'all\'"]');
        if (allButton) allButton.classList.add('active');
        window.best11Filter = { type: 'all', value: null };
    }
    const clubSelect = document.getElementById('club-filter-select');
    if (!clubSelect) return;
    const originalOptions = [...new Map(window.playerData.map(p => [p['所属クラブ'], p['リーグ']])).entries()].filter(([club]) => club).sort();
    let clubsToShow;
    if (window.best11Filter.type === 'league') {
        clubsToShow = originalOptions.filter(([club, league]) => league === window.best11Filter.value);
    } else if (window.best11Filter.type === '5-da-league') {
        clubsToShow = originalOptions.filter(([club, league]) => window.majorLeagues.includes(league));
    } else {
        clubsToShow = originalOptions;
    }
    let optionsHtml = `<option value="all">クラブで絞り込み</option>`;
    clubsToShow.forEach(([club, league]) => {
        optionsHtml += `<option value="${club}" data-league="${league}">${club}</option>`;
    });
    clubSelect.innerHTML = optionsHtml;
    if (window.best11Filter.type === 'club') {
        clubSelect.value = window.best11Filter.value;
    }
    if (nowSelectedPosKey) {
        const currentPosBtn = document.querySelector(`.position-btn[data-pos="${nowSelectedPosKey}"]`);
        selectPosition(nowSelectedPosKey, currentPosBtn);
    }
}

function initBest11Page() {
    renderPositionTabs();
    renderBest11Table();
    renderCourtPlayers();
}

function setFormation(form, btn) {
    best11Formation = form;
    const formationTitle = document.getElementById("formation-title");
    if (formationTitle) formationTitle.textContent = "フォーメーション：" + btn.textContent;
    document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    best11Selected = {};
    window.best11Filter = { type: 'all', value: null };
    initBest11Page();
    document.querySelectorAll('#best11-filters .filter-btn').forEach(b => b.classList.remove('active'));
    const allButton = document.querySelector('#best11-filters .filter-btn');
    if(allButton) allButton.classList.add('active');
    const clubSelect = document.getElementById('club-filter-select');
    if (clubSelect) clubSelect.value = 'all';
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
    const firstBtn = posBtnContainer.querySelector('.position-btn');
    if (firstBtn) {
        setTimeout(() => selectPosition(positions[0].key, firstBtn), 10);
    }
}

function selectPosition(posKey, btn) {
    nowSelectedPosKey = posKey;
    document.querySelectorAll('#position-tabs .position-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    let listDiv = document.getElementById('player-choice-list');
    if (!listDiv) return;
    let sourceData;
    switch (window.best11Filter.type) {
        case 'league': sourceData = window.playerData.filter(p => p['リーグ'] === window.best11Filter.value); break;
        case 'club': sourceData = window.playerData.filter(p => p['所属クラブ'] === window.best11Filter.value); break;
        case '5-da-league': sourceData = window.playerData.filter(p => window.majorLeagues.includes(p['リーグ'])); break;
        default: sourceData = window.playerData;
    }
    const searchKey = posKey.replace(/[0-9]/g, '').toUpperCase();
    let players = sourceData.filter(p => {
        const playerPos = (p['ポジション'] || "").toUpperCase();
        if (playerPos === searchKey) return true;
        if (searchKey === 'CB' && playerPos === 'DF') return true;
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
        listDiv.innerHTML = ` <div class="custom-select-container"> <button class="custom-select-trigger">${selectedPlayerName}</button> <div class="custom-options">${optionsHTML}</div> </div>`;
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
    }
    renderCourtPlayers();
}

function renderBest11Table() {
    const tableDiv = document.getElementById("best11-table");
    if(!tableDiv) return;
    const positions = best11Positions[best11Formation];
    const posOrder = [...positions].sort((a, b) => (a.key.startsWith('FW') ? -1 : 1) - (b.key.startsWith('FW') ? -1 : 1) || (b.key.startsWith('MF') ? 1 : -1) - (a.key.startsWith('MF') ? 1 : -1) || (b.key.startsWith('CB') ? 1 : -1) - (a.key.startsWith('CB') ? 1 : -1) || (a.key === 'GK' ? 1 : -1));
    let html = '<table><thead><tr><th>ポジション</th><th>選手</th><th>クラブ</th><th>リーグ</th></tr></thead><tbody>';
    posOrder.forEach(pos => {
        let name = best11Selected[pos.key] || '';
        let club = '', league = '';
        if (name) {
            const player = window.playerData.find(p => p['選手名'] === name);
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

function choosePlayer(posKey, name) {
    if (name) {
        best11Selected[posKey] = name;
    } else {
        delete best11Selected[posKey];
    }
    renderBest11Table();
    renderCourtPlayers();
}

function downloadImage(canvas, filename, msgSpan) {
    try {
        const a = document.createElement('a');
        const url = canvas.toDataURL('image/png');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if(msgSpan) {
            if (isIOS) { msgSpan.textContent = ''; } else { msgSpan.textContent = ''; }
            setTimeout(() => msgSpan.textContent = '', 5000);
        }
    } catch (e) {
        console.error("画像のダウンロードに失敗:", e);
        if(msgSpan) msgSpan.textContent = 'エラー: 画像のダウンロードに失敗';
    }
}

// ----------------------------------------------------
// ▼ 関数定義 (ここまで) ▲
// ----------------------------------------------------


// ★★★ この initialize 関数が、このモジュールの心臓部です ★★★
// common.js の showPage -> loadModule を経て、この関数が呼び出されます。
export function initialize() {

    // 1. HTMLのonclick属性から呼び出せるように、関数をwindowオブジェクトに登録します。
    //    これをしないと、ボタンを押した時に「そんな関数はない」とエラーになります。
    window.setBest11Filter = setBest11Filter;
    window.selectPosition = selectPosition;
    window.choosePlayer = choosePlayer;
    window.setFormation = setFormation;

    // 2. ページに必要な選手データ(playerData)が読み込まれていなければ、処理を中断します。
    if (!window.playerData || window.playerData.length === 0) {
        console.error("ベスト11の表示に必要な選手データがありません。");
        return;
    }

    // 3. ページ全体の描画を開始します。
    renderBest11Filters();
    initBest11Page();

    // 4. イベントリスナー（ボタンのクリック処理）を設定します。
    //    この処理は、ページを開くたびに何度も実行されないよう、
    //    best11Initialized という「目印」を使って、初回のみ実行します。
    if (!best11Initialized) {
        const postBtn = document.getElementById("post-to-x-btn");
        if (postBtn) {
            postBtn.onclick = function () {
                const text = "私のベストイレブンはこちら！\n#あなたのベストイレブン";
                const url = "https://jleague-big-club.com";
                const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                window.open(tweetUrl, '_blank');
            };
        }

        const copyBtn = document.getElementById("copy-best11-img-btn");
        if (copyBtn) {
            copyBtn.onclick = function () {
                const captureElem = document.getElementById('best11-capture-area');
                if(!captureElem) return;

                const msgSpan = document.getElementById('copy-best11-img-msg');
                const buttonsContainer = document.getElementById('capture-buttons');
                const selectedLabel = captureElem.querySelector('.best11-player-label.selected');
                
                if (selectedLabel) selectedLabel.classList.remove('selected');
                copyBtn.disabled = true;
                if(postBtn) postBtn.disabled = true;
                if(buttonsContainer) buttonsContainer.style.visibility = 'hidden';
                if(msgSpan) msgSpan.style.visibility = 'hidden';

                html2canvas(captureElem, { backgroundColor: null, scale: 2, useCORS: true }).then(canvas => {
                    if (selectedLabel) selectedLabel.classList.add('selected');
                    canvas.toBlob(blob => {
                        if (!blob) { if(msgSpan) msgSpan.textContent = 'エラー'; return; }
                        if (navigator.clipboard && navigator.clipboard.write) {
                            navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                                .then(() => { if(msgSpan) msgSpan.textContent = 'コピーしました！'; setTimeout(() => {if(msgSpan) msgSpan.textContent = ''}, 3000); })
                                .catch(err => { downloadImage(canvas, "best11.png", msgSpan); });
                        } else {
                            downloadImage(canvas, "best11.png", msgSpan);
                        }
                    }, 'image/png');
                }).catch(err => {
                    if(msgSpan) msgSpan.textContent = 'キャプチャエラー';
                }).finally(() => {
                    copyBtn.disabled = false;
                    if(postBtn) postBtn.disabled = false;
                    if(buttonsContainer) buttonsContainer.style.visibility = 'visible';
                    if(msgSpan) msgSpan.style.visibility = 'visible';
                });
            };
        }
        
        // 目印を立てて、次からはこのリスナー設定処理を通らないようにします。
        best11Initialized = true;
    }
}