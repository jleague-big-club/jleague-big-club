import { getClubData } from '../dataManager.js';

function renderClubLeagueTable(league) {
    const clubLeagueList = getClubData();
    const tableDiv = document.getElementById("club-league-table");
    if (!tableDiv) return;

    const rows = clubLeagueList.filter(club => club.p === league);
    if (!rows.length) {
        tableDiv.innerHTML = `<div style="padding:16px; color:white;">このリーグのクラブデータはありません</div>`;
        return;
    }
    let html = `<table><thead><tr><th>クラブ名</th></tr></thead><tbody> ${rows.map(club => `<tr><td style="cursor:pointer; color:#3cf;" onclick="showClubStatus('${club.name}')">${club.name}</td></tr>`).join("")} </tbody></table>`;
    tableDiv.innerHTML = html;
}

function showClubStatus(clubName) {
    const clubData = getClubData();
    const club = clubData.find(c => c.name === clubName);
    if (!club) return;
    const rank = clubData.findIndex(c => c.name === clubName) + 1;
    const html = `
        <div style="font-size:1.2rem; font-weight:bold; color:#97d7ff; letter-spacing:0.06em;">${clubName}</div>
        <div class="club-status-grid">
            <div class="status-item">
                <span class="status-label">👑 ビッグクラブスコア</span>
                <span class="status-value score">${club.sum ? club.sum.toFixed(1) : '-'} (${rank}位)</span>
            </div>
            <div class="status-item">
                <span class="status-label">🏅 所属リーグ</span>
                <span class="status-value">${club.p || '-'}</span>
            </div>
            <div class="status-item">
                <span class="status-label">💰 売上高</span>
                <span class="status-value">${club.revenue || '-'} 億円</span>
            </div>
            <div class="status-item">
                <span class="status-label">👥 平均観客数</span>
                <span class="status-value">${(club.audience || '-').toLocaleString()} 人</span>
            </div>
            <div class="status-item">
                <span class="status-label">🏆 タイトル獲得数</span>
                <span class="status-value">${club.titles || '-'}</span>
            </div>
            <div class="status-item">
                <span class="status-label">📊 J1過去10年平均順位</span>
                <span class="status-value">${club.m || '-'} 位</span>
            </div>
        </div>
        <button onclick="document.getElementById('club-status-board').style.display='none';" style="position:absolute;top:13px;right:14px; background:#29b6e6; border:none; border-radius:7px; color:#fff; padding:5px 13px; font-size:1.01em; cursor:pointer;">閉じる</button>
    `;
    const board = document.getElementById("club-status-board");
    board.innerHTML = html;
    board.style.display = "block";
}
// グローバルスコープに公開
window.showClubStatus = showClubStatus;


export default function initIntroducePage() {
    const clubData = getClubData();
    if (clubData.length > 0) {
        renderClubLeagueTable("J1");

        const leagueTabs = document.getElementById('club-league-tabs');
        if (leagueTabs && !leagueTabs.dataset.initialized) {
            document.querySelectorAll(".league-tab-btn").forEach(btn => {
                btn.addEventListener("click", function () {
                    document.querySelectorAll(".league-tab-btn").forEach(b => b.classList.remove("active"));
                    this.classList.add("active");
                    renderClubLeagueTable(this.dataset.league);
                });
            });
            leagueTabs.dataset.initialized = 'true';
        }
    }
}