// js/pages/top.js

import { getClubData } from '../dataManager.js';

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
        let category, colorClass;
        if (club.sum >= 30) {
            category = "有望ビッグクラブ";
            colorClass = "top-club";
        } else if (club.sum >= 20) {
            category = "潜在的ビッグクラブ";
            colorClass = "potential-big";
        } else if (club.sum >= 5) {
            category = "中堅クラブ";
            colorClass = "middle";
        } else {
            category = "ローカルクラブ";
            colorClass = "local";
        }
        const tr = tbody.insertRow();
        tr.className = colorClass;
        [idx + 6, club.name, club.sum.toFixed(1), category].forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
    });
    tableDiv.appendChild(table);
}

export default function initTopPage() {
    const allClubData = getClubData();
    if (allClubData.length > 0) {
        // ★★★【ここから修正】JFLを除外する ★★★
        const jLeagueClubs = allClubData.filter(club => club.p !== 'JFL');
        renderBig5(jLeagueClubs);
        renderOthers(jLeagueClubs);
        // ★★★【ここまで修正】★★★
    }
}