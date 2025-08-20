// js/pages/introduce.js

import { getClubData, getIntroductionsData } from '/js/dataManager.js';

let allClubData = [];
let introductions = {};
let radarChart = null;
let maxScores = null;

function calculateMaxScores() {
    if (allClubData.length === 0) return;
    const urawa = allClubData.find(c => c.name === '浦和レッズ');
    const kawasaki = allClubData.find(c => c.name === '川崎フロンターレ');
    const kashima = allClubData.find(c => c.name === '鹿島アントラーズ');
    if (urawa && kawasaki && kashima) {
        maxScores = {
            revenue: urawa.revenueScore,
            audience: urawa.audienceScore,
            title: kashima.titleScore,
            stability: parseFloat(kawasaki.o)
        };
    }
}

function renderRadarChart(club) {
    const ctx = document.getElementById('club-radar-chart');
    if (!ctx) return;

    if (radarChart) {
        radarChart.destroy();
        radarChart = null;
    }
    
    const hasScoreData = club.sum > 0;
    const chartContainer = document.querySelector('.radar-chart-container');
    const chartTitle = document.querySelector('.chart-title');

    if (!hasScoreData || !maxScores) {
        if (chartTitle) chartTitle.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'none';
        return;
    }
    
    if (chartTitle) chartTitle.style.display = 'block';
    if (chartContainer) chartContainer.style.display = 'block';

    const normalizedData = [
        (club.revenueScore / maxScores.revenue) * 100,
        (club.audienceScore / maxScores.audience) * 100,
        (club.titleScore / maxScores.title) * 100,
        (parseFloat(club.o) / maxScores.stability) * 100
    ].map(score => isNaN(score) ? 0 : score);

    const labels = ['売上', '観客', '実績', '安定度'];
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: club.name,
                data: normalizedData,
                backgroundColor: `${club.color}40`,
                borderColor: club.color,
                borderWidth: 2,
                pointBackgroundColor: club.color,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, layout: { padding: 10 },
            scales: { 
                r: { 
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' }, 
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }, 
                    pointLabels: { color: '#556677', font: { size: 12, weight: 'bold' } }, 
                    ticks: { display: false, stepSize: 20 }, 
                    min: 0, 
                    max: 100 
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateMapMarker(club) {
    const marker = document.getElementById('map-marker');
    if (!marker) return;

    const hasCoords = club.lat && club.lon;
    const mapContainer = document.querySelector('.map-container');
    
    if (!hasCoords) {
        if (mapContainer) mapContainer.style.display = 'none';
        marker.style.display = 'none';
        return;
    }

    if (mapContainer) mapContainer.style.display = 'block';
    
    const mapBounds = { top: 46.0, bottom: 30.0, left: 128.0, right: 146.0 };
    const topPercent = 100 - ((club.lat - mapBounds.bottom) / (mapBounds.top - mapBounds.bottom)) * 100;
    const leftPercent = ((club.lon - mapBounds.left) / (mapBounds.right - mapBounds.left)) * 100;
    
    marker.style.top = `${topPercent}%`;
    marker.style.left = `${leftPercent}%`;
    marker.style.backgroundColor = club.color;
    marker.style.display = 'block';
    marker.title = club.name;
}

function showClubDetails(clubName) {
    const detailView = document.getElementById("club-detail-view");
    if (!detailView) return;

    document.querySelectorAll('.club-list-item').forEach(item => {
        item.classList.toggle('active', item.textContent === clubName);
    });

    const club = allClubData.find(c => c.name === clubName);
    if (!club) {
        detailView.innerHTML = '<div class="detail-placeholder">クラブを選択してください</div>';
        return;
    }

    // URLを更新して状態を永続化
    const newHash = `#/introduce/${club.teamId}`;
    if (window.location.hash !== newHash) {
        // ページ内遷移では履歴スタックを増やさないreplaceStateを使用
        history.replaceState({ page: `introduce/${club.teamId}` }, '', newHash);
    }

    const introText = introductions[club.name] || 'このクラブの紹介文は準備中です。';
    
    const rankIndex = allClubData.findIndex(c => c.name === club.name);
    const rankDisplay = rankIndex !== -1 ? `${rankIndex + 1}位` : '-';
    
    detailView.innerHTML = `
        <div class="detail-header">
             <h2>${club.name}</h2>
        </div>
        <div class="detail-content">
            <div class="detail-main-info">
                <div class="introduction-area">
                    <p class="introduction-text">${introText}</p>
                     <div class="detail-data-list">
                        <div class="data-item">
                            <span class="data-label"><span class="icon">👑</span>ビッグクラブスコア</span>
                            <span class="data-value score">${club.sum ? club.sum.toFixed(1) : '-'} (${rankDisplay})</span>
                        </div>
                        <div class="data-item">
                            <span class="data-label"><span class="icon">📊</span>所属リーグ</span>
                            <span class="data-value">${club.p || '-'}</span>
                        </div>
                        <div class="data-item">
                            <span class="data-label"><span class="icon">💰</span>売上高</span>
                            <span class="data-value">${club.revenue ? club.revenue + ' 億円' : '-'}</span>
                        </div>
                        <div class="data-item">
                            <span class="data-label"><span class="icon">👥</span>平均観客数</span>
                            <span class="data-value">${club.audience ? club.audience.toLocaleString() + ' 人' : '-'}</span>
                        </div>
                        <div class="data-item">
                            <span class="data-label"><span class="icon">🏆</span>タイトル獲得数</span>
                            <span class="data-value">${club.titles ?? '-'}</span>
                        </div>
                        <div class="data-item">
                            <span class="data-label"><span class="icon">📈</span>J1過去10年平均順位</span>
                            <span class="data-value">${club.m !== 'N/A' ? club.m + ' 位' : '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="visual-data-area">
                    <div class="chart-title">スコアのレーダーチャート</div>
                    <div class="radar-chart-container">
                        <canvas id="club-radar-chart"></canvas>
                    </div>
                    <div class="map-container">
                        <img src="/img/japan-map.svg" alt="日本地図">
                        <div id="map-marker"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderRadarChart(club);
    updateMapMarker(club);
}

function renderClubList(league, clubNameToSelect = null) {
    const listContainer = document.getElementById("club-list-view");
    if (!listContainer) return;

    const clubsToShow = allClubData.filter(club => club.p === league);
    
    if (clubsToShow.length === 0) {
        listContainer.innerHTML = `<div class="no-data-message">データがありません</div>`;
        const detailView = document.getElementById("club-detail-view");
        if (detailView) detailView.innerHTML = '<div class="detail-placeholder">このリーグのクラブデータはありません</div>';
        return;
    }

    const listHtml = clubsToShow.map(club => `<div class="club-list-item">${club.name}</div>`).join("");
    listContainer.innerHTML = listHtml;
    
    listContainer.querySelectorAll('.club-list-item').forEach(item => {
        item.addEventListener('click', () => showClubDetails(item.textContent));
    });
    
    const targetClubName = clubNameToSelect && clubsToShow.some(c => c.name === clubNameToSelect)
        ? clubNameToSelect
        : clubsToShow[0]?.name;

    if (targetClubName) {
        showClubDetails(targetClubName);
    }
}

// ページが非表示になるときにチャートを破棄するリスナー
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.attributeName === 'class' && !mutation.target.classList.contains('visible')) {
            if (radarChart) {
                radarChart.destroy();
                radarChart = null;
            }
        }
    });
});

export default async function initIntroducePage(container, options = {}) {
    if (!container) return;

    allClubData = getClubData(); 
    introductions = await getIntroductionsData();
    calculateMaxScores();
    
    if (!container.dataset.initialized) {
        container.innerHTML = `
            <div id="club-league-tabs" class="league-tabs">
                <button class="league-tab-btn active" data-league="J1">J1</button>
                <button class="league-tab-btn" data-league="J2">J2</button>
                <button class="league-tab-btn" data-league="J3">J3</button>
                <button class="league-tab-btn" data-league="JFL">JFL</button>
            </div>
            <div id="introduce-layout">
                <div id="club-list-view"></div>
                <div id="club-detail-view">
                    <div class="detail-placeholder">クラブを選択してください</div>
                </div>
            </div>
        `;
        container.dataset.initialized = 'true';

        container.querySelector('#club-league-tabs').querySelectorAll(".league-tab-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                container.querySelector('#club-league-tabs').querySelectorAll(".league-tab-btn").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                renderClubList(this.dataset.league);
            });
        });
        
        observer.observe(container, { attributes: true });
    }
    
    let initialLeague = 'J1';
    let initialClubName = null;

    if (options.detailClubId) {
        const targetClub = allClubData.find(c => c.teamId == options.detailClubId);
        if (targetClub) {
            initialLeague = targetClub.p;
            initialClubName = targetClub.name;
        }
    }
    
    container.querySelector('#club-league-tabs').querySelectorAll(".league-tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.league === initialLeague);
    });

    renderClubList(initialLeague, initialClubName);
}