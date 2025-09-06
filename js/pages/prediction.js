import { getPredictionData } from '../dataManager.js';

function renderPrediction(league) {
    const container = document.getElementById('prediction-container');
    if (!container) return;
    
    getPredictionData().then(({ predictionProbabilities, updateDates }) => {
        const leagueProbs = predictionProbabilities[league];
        if (!leagueProbs) {
            container.innerHTML = '<p style="text-align:center;">予測データを生成できませんでした。</p>';
            return;
        }

        let dateHtml = '';
        const updatedTimestamp = updateDates['prediction_probabilities.json'];
        if (updatedTimestamp) {
            const updatedDate = new Date(updatedTimestamp);
            const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            dateHtml = `<p class="update-date-note">更新日時: ${formattedDate}</p>`;
        }

        const teamList = Object.keys(leagueProbs).map(teamName => ({ name: teamName, ...leagueProbs[teamName] }));

        const stableSort = (arr, compareFn) => arr
            .map((item, index) => ({ item, index }))
            .sort((a, b) => {
                const order = compareFn(a.item, b.item);
                if (order !== 0) return order;
                return a.index - b.index;
            })
            .map(({ item }) => item);
        
        // ▼▼▼【ここから変更】データ構造の変更に合わせてソートキーを修正 ▼▼▼
        const predictions = {
            champion: stableSort(teamList, (a, b) => b.champion.prob - a.champion.prob).slice(0, 5).filter(t => t.champion.prob > 0),
            acl: stableSort(teamList, (a, b) => b.acl.prob - a.acl.prob).slice(0, 5).filter(t => t.acl.prob > 0),
            promotion: stableSort(teamList, (a, b) => b.promotion.prob - a.promotion.prob).slice(0, 5).filter(t => t.promotion.prob > 0),
            relegation: stableSort(teamList, (a, b) => b.relegation.prob - a.relegation.prob).slice(0, 5).filter(t => t.relegation.prob > 0),
            full_ranking: stableSort(teamList, (a, b) => b.safe.prob - a.safe.prob).slice(0, 15)
        };
        // ▲▲▲【ここまで変更】▲▲▲

        const categorySettings = {
            champion: { title: '🏆 優勝確率 TOP5', probKey: 'champion', className: 'champion' },
            acl: { title: '🌐 ACL出場圏確率 TOP5', probKey: 'acl', className: 'acl' },
            promotion: { title: '⬆️ 昇格確率 TOP5', probKey: 'promotion', className: 'promotion' },
            relegation: { title: '⚠️ 降格確立 TOP5', probKey: 'relegation', className: 'relegation' },
            full_ranking: { title: '✅ 残留以上確率 TOP15', probKey: 'safe', className: 'safe' }
        };

        let displayOrder;
        if (league === 'J1') {
            categorySettings.relegation.title = '⚠️ J2降格確立 TOP5';
            displayOrder = ['champion', 'relegation', 'full_ranking', 'acl'];
        } else if (league === 'J2') {
            categorySettings.promotion.title = '⬆️ J1昇格確率 TOP5';
            categorySettings.relegation.title = '⚠️ J3降格確立 TOP5';
            displayOrder = ['promotion', 'relegation', 'full_ranking'];
        } else if (league === 'J3') {
            categorySettings.promotion.title = '⬆️ J2昇格確率 TOP5';
            categorySettings.relegation.title = '⚠️ JFL降格確立 TOP5';
            displayOrder = ['promotion', 'relegation', 'full_ranking'];
        } else {
            displayOrder = [];
        }

        let html = '<div class="prediction-grid">';
        displayOrder.forEach(key => {
            const teams = predictions[key];
            if (!teams || teams.length === 0) return;

            const cat = categorySettings[key];
            html += `
            <div class="prediction-card">
                <div class="prediction-card-header ${cat.className}">
                    ${cat.title}
                </div>
                <div class="prediction-card-body">
                    <ul class="prediction-list">
                    ${teams.map((team, index) => {
                        // ▼▼▼【ここから変更】確率と変動情報を取得し、矢印HTMLを生成 ▼▼▼
                        const probData = team[cat.probKey];
                        const probability = probData.prob;
                        const change = probData.change;
                        
                        let changeHtml = '';
                        if (change === 'up') {
                            changeHtml = '<span class="change-arrow up">▲</span>';
                        } else if (change === 'down') {
                            changeHtml = '<span class="change-arrow down">▼</span>';
                        } else {
                            changeHtml = '<span class="change-arrow flat">–</span>';
                        }

                        const probText = (probability !== null && typeof probability !== 'undefined') ? `${(probability * 100).toFixed(1)}%` : '';
                        return `
                        <li>
                            <div class="rank-team">
                                <span class="rank">${index + 1}位</span>
                                <span class="team-name">${team.name}</span>
                            </div>
                            ${probText ? `<span class="probability">${changeHtml}${probText}</span>` : ''}
                        </li>`;
                        // ▲▲▲【ここまで変更】▲▲▲
                    }).join('')}
                    </ul>
                </div>
            </div>
            `;
        });
        html += '</div>';

        container.innerHTML = dateHtml + html;
    });
}

function showPredictionView(league) {
    const tabsContainer = document.getElementById('prediction-league-tabs');
    if (tabsContainer) {
        tabsContainer.querySelectorAll('.rank-tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = tabsContainer.querySelector(`.rank-tab-btn[onclick="showPredictionView('${league}')"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
    renderPrediction(league);
}

// グローバルスコープに公開
window.showPredictionView = showPredictionView;

export default function initPredictionPage() {
    const tabsContainer = document.getElementById('prediction-league-tabs');
    if (tabsContainer && !tabsContainer.dataset.initialized) {
        tabsContainer.innerHTML = `
            <button class="rank-tab-btn" onclick="showPredictionView('J1')">J1</button>
            <button class="rank-tab-btn" onclick="showPredictionView('J2')">J2</button>
            <button class="rank-tab-btn" onclick="showPredictionView('J3')">J3</button>
            <button id="prediction-help-btn" onclick="document.getElementById('prediction-help-pop').style.display='block'">シーズン予測とは？</button>
        `;
        tabsContainer.dataset.initialized = 'true';
    }
    showPredictionView('J1');
}