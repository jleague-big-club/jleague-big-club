// === modules/history.js (確定版) ===

function renderHistory(clubs) {
    const historyDiv = document.getElementById("jleague-history");
    if (!historyDiv) return;
    historyDiv.innerHTML = "";
    const hisTable = document.createElement("table");
    const hisThead = hisTable.createTHead();
    const hisHeader = hisThead.insertRow();
    ["クラブ名", "J1過去10年在籍年数", "J1過去10年平均順位", "J1過去10年在籍スコア"].forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        hisHeader.appendChild(th);
    });
    const hisTbody = hisTable.createTBody();
    const isMobile = window.innerWidth <= 768;
    clubs.forEach(club => {
        const tr = hisTbody.insertRow();
        let clubDisplayName = club.name;
        if (isMobile && window.clubAbbreviations[club.name]) {
            clubDisplayName = window.clubAbbreviations[club.name];
        }
        [clubDisplayName, club.l, club.m, club.o].forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
    });
    historyDiv.appendChild(hisTable);
}

// ★★★ この initialize 関数が重要 ★★★
export function initialize() {
    if (window.clubData && window.clubData.length > 0) {
        renderHistory(window.clubData);
    }
}