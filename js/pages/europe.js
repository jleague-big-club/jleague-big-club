import { getPlayerData } from '../dataManager.js';
import { majorLeagues } from '../config.js';

function showPlayerTable(country) {
    const div = document.getElementById("player-table-wrap");
    const playerData = getPlayerData();
    let displayPlayers = playerData.filter(p => majorLeagues.some(league => (p['リーグ'] || '').includes(league)));

    let leagueName = '';
    const countryToLeagueMap = {
        'イングランド': 'プレミアリーグ',
        'スペイン': 'ラ・リーガ',
        'ドイツ': 'ブンデスリーガ',
        'イタリア': 'セリエA',
        'フランス': 'リーグ・アン'
    };

    if (country) {
        displayPlayers = displayPlayers.filter(p => p['国'] === country);
        leagueName = countryToLeagueMap[country] || country;
    } else {
        leagueName = '5大リーグ';
    }

    displayPlayers.sort((a, b) => (parseInt(a['年齢']) || 99) - (parseInt(b['年齢']) || 99));

    if (displayPlayers.length === 0) {
        div.innerHTML = `<div style="color:#ffe;padding:16px; text-align:center;">該当する選手がいません。</div>`;
        return;
    }

    const titleHtml = `<h3 style="text-align:center;color:#ffd700;">${leagueName}の日本人選手</h3>`;
    const headers = ['No.', '国', '所属クラブ', '選手名', '年齢', 'ポジション', '詳細'];

    let html = titleHtml + `<table style="font-size: 0.88rem;"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
    displayPlayers.forEach((player, i) => {
        html += `<tr>`;
        html += `<td>${i + 1}</td>`;
        headers.slice(1).forEach(h => {
            html += `<td>${player[h] || ''}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table>`;
    div.innerHTML = html;
}

function initEuropeMobilePage() {
    const leagueSelector = document.getElementById('europe-league-selector');
    const playerList = document.getElementById('europe-player-list');

    let buttonsHTML = '<h3>リーグを選択してください</h3>';
    majorLeagues.forEach(league => {
        buttonsHTML += `<button class="rank-tab-btn" style="width:100%; margin: 6px 0; padding: 14px;" onclick="renderEuropePlayerList('${league}')">${league}</button>`;
    });
    leagueSelector.innerHTML = buttonsHTML;
    playerList.innerHTML = '';
    leagueSelector.style.display = 'block';
    playerList.style.display = 'none';
}
window.initEuropeMobilePage = initEuropeMobilePage;

function renderEuropePlayerList(leagueName) {
    const playerData = getPlayerData();
    const leagueSelector = document.getElementById('europe-league-selector');
    const playerList = document.getElementById('europe-player-list');
    
    // データ内でのリーグ名と表示名のマッピング
    const leagueDataNameMap = {
        "ラ・リーガ": "ラリーガ",
        "リーグ・アン": "リーグアン"
    };
    const leagueDataName = leagueDataNameMap[leagueName] || leagueName;
    
    const playersInLeague = playerData.filter(p => p['リーグ'] === leagueDataName).sort((a, b) => (parseInt(a['年齢']) || 99) - (parseInt(b['年齢']) || 99));

    let listHTML = `<button class="rank-tab-btn" style="width:100%; margin: 6px 0 20px 0; padding: 10px; background: #6c757d;" onclick="initEuropeMobilePage()">‹ リーグ選択に戻る</button>`;
    listHTML += `<h3 class="page-subtitle">${leagueName} の日本人選手</h3>`;

    if (playersInLeague.length === 0) {
        listHTML += `<p>このリーグに所属する日本人選手の情報はありません。</p>`;
    } else {
        playersInLeague.forEach(p => {
            listHTML += `
            <div class="player-card-mobile">
                <div class="player-info">
                    <h3>${p['選手名']}</h3>
                    <p><strong>所属クラブ:</strong> <span>${p['所属クラブ']}</span></p>
                    <p><strong>年齢:</strong> <span>${p['年齢']}</span></p>
                    <p><strong>ポジション:</strong> <span>${p['ポジション']}</span></p>
                </div>
                <div class="player-image">
                    <img src="img/player.png" alt="選手アイコン">
                </div>
            </div>`;
        });
    }
    playerList.innerHTML = listHTML;
    leagueSelector.style.display = 'none';
    playerList.style.display = 'block';
    window.scrollTo(0, 0);
}
window.renderEuropePlayerList = renderEuropePlayerList;


export default function initEuropePage() {
    const playerData = getPlayerData();
    if (playerData.length > 0) {
        if (window.innerWidth > 768) {
            showPlayerTable();
            const countryButtons = document.querySelectorAll(".country-btn");
            if(countryButtons.length > 0 && !countryButtons[0].dataset.initialized){
                 countryButtons.forEach(btn => {
                    btn.addEventListener("click", () => {
                        document.querySelectorAll(".country-btn").forEach(b => b.classList.remove("active"));
                        btn.classList.add("active");
                        showPlayerTable(btn.dataset.country);
                    });
                    btn.dataset.initialized = 'true';
                });
            }
        } else {
            initEuropeMobilePage();
        }
    }
}