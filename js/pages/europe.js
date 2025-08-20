import { getPlayerData } from '../dataManager.js';
import { clubAbbreviations } from '../config.js';

const majorLeagues = ["プレミアリーグ", "ラ・リーガ", "ブンデスリーガ", "セリエA", "リーグ・アン"];

function calculateAge(birthDateString) {
    if (!birthDateString || !birthDateString.includes('/')) {
        return '';
    }
    const cleanBirthDate = birthDateString.split(' ')[0];
    const birthDateParts = cleanBirthDate.split('/');
    if (birthDateParts.length < 3) return '';

    const birthDate = new Date(parseInt(birthDateParts[0]), parseInt(birthDateParts[1]) - 1, parseInt(birthDateParts[2]));
    if (isNaN(birthDate.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function showPlayerTable(leagueFilter) {
    const div = document.getElementById("player-table-wrap");
    const playerData = getPlayerData();
    
    let displayPlayers = playerData.filter(p => majorLeagues.includes(p['リーグ']));

    if (leagueFilter) {
        displayPlayers = displayPlayers.filter(p => p['リーグ'] === leagueFilter);
    }
    
    displayPlayers.sort((a, b) => {
        const ageA = calculateAge(a['生年月日']) || 99;
        const ageB = calculateAge(b['生年月日']) || 99;
        return ageA - ageB;
    });

    if (displayPlayers.length === 0) {
        div.innerHTML = `<div style="color:#ffe;padding:16px; text-align:center;">該当する選手がいません。</div>`;
        return;
    }

    const title = leagueFilter ? `${leagueFilter} の日本人選手` : '5大リーグの日本人選手';
    const titleHtml = `<h3 class="page-subtitle" style="text-align:left;">${title}</h3>`;
    
    const headers = ['No.', '国', '所属クラブ', '選手名', '年齢', 'ポジション'];

    let html = titleHtml + `<table class="player-list-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
    displayPlayers.forEach((player, i) => {
        const clubName = clubAbbreviations[player['所属クラブ']] || player['所属クラブ'];
        const age = calculateAge(player['生年月日']);

        html += `<tr>`;
        html += `<td>${i + 1}</td>`;
        html += `<td>${player['国'] || ''}</td>`;
        html += `<td>${clubName}</td>`;
        html += `<td>${player['選手名'] || ''}</td>`;
        html += `<td>${age}</td>`;
        html += `<td>${player['ポジション'] || ''}</td>`;
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

// ★★★【修正】この関数を修正 ★★★
function renderEuropePlayerList(leagueName) {
    const playerData = getPlayerData();
    const leagueSelector = document.getElementById('europe-league-selector');
    const playerList = document.getElementById('europe-player-list');
    
    const playersInLeague = playerData.filter(p => p['リーグ'] === leagueName)
        .sort((a, b) => (calculateAge(a['生年月日']) || 99) - (calculateAge(b['生年月日']) || 99));

    let listHTML = `<button class="rank-tab-btn" style="width:100%; margin: 6px 0 20px 0; padding: 10px; background: #6c757d;" onclick="initEuropeMobilePage()">‹ リーグ選択に戻る</button>`;
    listHTML += `<h3 class="page-subtitle">${leagueName} の日本人選手</h3>`;

    if (playersInLeague.length === 0) {
        listHTML += `<p>このリーグに所属する日本人選手の情報はありません。</p>`;
    } else {
        playersInLeague.forEach(p => {
            const clubName = clubAbbreviations[p['所属クラブ']] || p['所属クラブ'];
            const age = calculateAge(p['生年月日']);
            
            // 身長・体重に単位を追加
            const height = p['身長'] ? `<p><strong>身長:</strong> <span>${p['身長']}cm</span></p>` : '';
            const weight = p['体重'] ? `<p><strong>体重:</strong> <span>${p['体重']}kg</span></p>` : '';

            listHTML += `
            <div class="player-card-mobile">
                <div class="player-info">
                    <h3>${p['選手名']}</h3>
                    <p><strong>所属クラブ:</strong> <span>${clubName}</span></p>
                    <p><strong>年齢:</strong> <span>${age}</span></p>
                    <p><strong>ポジション:</strong> <span>${p['ポジション']}</span></p>
                    ${height}
                    ${weight}
                </div>
                <div class="player-image">
                    <img src="img/player.webp" alt="選手アイコン">
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
    if (playerData.length === 0) return;

    if (window.innerWidth > 768) {
        showPlayerTable();
        
        const countryButtons = document.querySelectorAll(".country-btn");
        
        countryButtons.forEach(btn => {
            if (btn.dataset.initialized !== 'true') {
                 btn.addEventListener("click", () => {
                    const league = btn.dataset.league;
                    document.querySelectorAll(".country-btn").forEach(b => {
                        if (b.dataset.league === league) {
                            b.classList.add("active");
                        } else {
                            b.classList.remove("active");
                        }
                    });
                    showPlayerTable(league === 'all' ? null : league);
                });
                btn.dataset.initialized = 'true';
            }
        });
    } else {
        initEuropeMobilePage();
    }
}