import { getClubData } from '../dataManager.js';
import { toHalfWidth } from '../uiHelpers.js';
import { clubAbbreviations } from '../config.js';

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
        if (isMobile) {
            const normalizedClubName = toHalfWidth(club.name);
            for (const key in clubAbbreviations) {
                if (toHalfWidth(key) === normalizedClubName) {
                    clubDisplayName = clubAbbreviations[key];
                    break;
                }
            }
        }
        [clubDisplayName, club.l, club.m, club.o].forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
    });
    historyDiv.appendChild(hisTable);
}


export default function initHistoryPage() {
    const clubData = getClubData();
    if (clubData.length > 0) {
        renderHistory(clubData);
    }
}