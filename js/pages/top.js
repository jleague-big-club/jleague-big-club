// js/pages/top.js

import { getClubData } from '../dataManager.js';

/**
 * クラブのステータスポップアップを表示する
 * @param {Event} event - クリックイベントオブジェクト
 * @param {string} teamId - 表示するクラブのID
 * @param {number} currentRank - 今年の順位
 */
function showClubStatus(event, teamId, currentRank) {
    if (event) event.stopPropagation();

    const allClubData = getClubData();
    // ▼▼▼【タイプミスを修正】▼▼▼
    const jLeagueClubs = allClubData.filter(club => club.p !== 'JFL').sort((a, b) => b.sum - a.sum);
    // ▲▲▲【ここまで修正】▲▲▲
    const club = jLeagueClubs.find(c => c.teamId === teamId);
    if (!club) return;
    
    // ...以降のコードは変更なし...
    const jLeagueClubsPrev = allClubData
        .filter(c => c.p !== 'JFL' && c.sum_prev !== null && !isNaN(c.sum_prev))
        .sort((a, b) => b.sum_prev - a.sum_prev);
    const prevRank = jLeagueClubsPrev.findIndex(c => c.teamId === teamId) + 1;

    const board = document.getElementById("club-status-board");
    if (!board) return;

    const formatValue = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return '-';
        return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
    };

    const getChangeHtml = (current, prev) => {
        if (prev === null || isNaN(prev)) return '<span class="change-info flat">→ 前年 -</span>';
        const diff = current - prev;
        let arrowClass = 'flat';
        let arrowSymbol = '→';
        if (diff > 0.01) { arrowClass = 'up'; arrowSymbol = '▲'; } 
        else if (diff < -0.01) { arrowClass = 'down'; arrowSymbol = '▼'; }
        return `<span class="change-info ${arrowClass}">${arrowSymbol} 前年 ${formatValue(prev)}</span>`;
    };

    let rankChangeHtml = '<span class="rank-change-arrow flat">→</span>';
    if (prevRank > 0 && currentRank > 0) {
        if (currentRank < prevRank) { rankChangeHtml = '<span class="rank-change-arrow up">▲</span>'; }
        else if (currentRank > prevRank) { rankChangeHtml = '<span class="rank-change-arrow down">▼</span>'; }
    }
    
    board.innerHTML = `
        <button onclick="this.parentElement.style.display='none'" class="close-btn">&times;</button>
        <div class="club-title-rank-row">
             <div class="rank-display prev-rank"><span class="rank-label">前年</span>${prevRank > 0 ? prevRank + '位' : '圏外'}</div>
             ${rankChangeHtml}
             <div class="rank-display current-rank">${currentRank}位</div>
        </div>
        <h3 class="club-title">${club.name}</h3>
        <div class="club-status-grid">
            <div class="status-item">
                <span class="status-label">ビッグクラブスコア</span>
                <span class="status-value score">${formatValue(club.sum)}</span>
                ${getChangeHtml(club.sum, club.sum_prev)}
            </div>
            <div class="status-item">
                <span class="status-label">売上高 (億円)</span>
                <span class="status-value">${club.revenue.toFixed(2)}</span>
                ${getChangeHtml(club.revenue, club.revenue_prev)}
            </div>
            <div class="status-item">
                <span class="status-label">平均観客数 (人)</span>
                <span class="status-value">${formatValue(club.audience)}</span>
                ${getChangeHtml(club.audience, club.audience_prev)}
            </div>
            <div class="status-item">
                <span class="status-label">タイトル数</span>
                <span class="status-value">${formatValue(club.titles)}</span>
                ${getChangeHtml(club.titles, club.titles_prev)}
            </div>
            <div class="status-item">
                <span class="status-label">平均順位スコア</span>
                <span class="status-value">${formatValue(parseFloat(club.o))}</span>
                ${getChangeHtml(parseFloat(club.o), club.rankScore_prev)}
            </div>
            <a href="#/introduce/${club.teamId}" class="status-item link-item">
                <span class="link-item-text">各クラブのデータを見る</span>
                <span class="link-item-arrow">→</span>
            </a>
        </div>
    `;
    board.style.display = 'block';
}

window.showClubStatus = showClubStatus;

function renderBig5(clubs) {
    const big5 = clubs.slice(0, 5);
    const big5Div = document.getElementById("big5-cards");
    if (!big5Div) return;
    big5Div.innerHTML = "";
    const row1 = document.createElement("div");
    row1.className = "big5-row";
    const row2 = document.createElement("div");
    row2.className = "big5-row";
    big5.forEach((club, i) => {
        let colorClass = "local";
        if (club.sum >= 30) colorClass = "top-club";
        else if (club.sum >= 20) colorClass = "potential-big";
        else if (club.sum >= 5) colorClass = "middle";
        const isLong = club.name.length >= 10;
        const card = document.createElement("div");
        card.className = `club-card ${colorClass} rank-${i + 1}` + (isLong ? " long-title" : "");
        card.innerHTML = `<h3 class="club-title">${club.name}</h3><div class="score-val">スコア：${club.sum.toFixed(1)}</div>`;
        const currentRank = i + 1;
        card.setAttribute('onclick', `showClubStatus(event, '${club.teamId}', ${currentRank})`);
        card.style.cursor = 'pointer';
        if (i < 3) row1.appendChild(card);
        else row2.appendChild(card);
    });
    big5Div.appendChild(row1);
    big5Div.appendChild(row2);
}

function renderOthers(clubs) {
    const others = clubs.slice(5);
    const tableDiv = document.getElementById("club-categories");
    if (!tableDiv) return;
    tableDiv.innerHTML = "";
    const table = document.createElement("table");
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ["順位", "クラブ名", "合算スコア", "区分"].forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
    });
    const tbody = table.createTBody();
    others.forEach((club, idx) => {
        const currentRank = idx + 6;
        let category, colorClass;
        if (club.sum >= 30) { category = "有望ビッグクラブ"; colorClass = "top-club"; } 
        else if (club.sum >= 20) { category = "潜在的ビッグクラブ"; colorClass = "potential-big"; } 
        else if (club.sum >= 5) { category = "中堅クラブ"; colorClass = "middle"; } 
        else { category = "ローカルクラブ"; colorClass = "local"; }
        const tr = tbody.insertRow();
        tr.className = colorClass;
        [currentRank, club.name, club.sum.toFixed(1), category].forEach(val => {
            tr.insertCell().textContent = val;
        });
        tr.setAttribute('onclick', `showClubStatus(event, '${club.teamId}', ${currentRank})`);
        tr.style.cursor = 'pointer';
    });
    tableDiv.appendChild(table);
}

export default function initTopPage() {
    const allClubData = getClubData();
    if (allClubData.length > 0) {
        // 常にこのモジュール内でソートを実行して順位を確定させる
        const jLeagueClubs = allClubData.filter(club => club.p !== 'JFL').sort((a, b) => b.sum - a.sum);
        renderBig5(jLeagueClubs);
        renderOthers(jLeagueClubs);
    }
}