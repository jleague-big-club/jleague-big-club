// === modules/prediction.js ===

async function initPredictionPage() {
    await window.loadPredictionData();
    const tabsContainer = document.getElementById('prediction-league-tabs');
    if (!tabsContainer.dataset.initialized) {
        tabsContainer.innerHTML = `
            <button class="rank-tab-btn" onclick="showPredictionView('J1')">J1</button>
            <button class="rank-tab-btn" onclick="showPredictionView('J2')">J2</button>
            <button class="rank-tab-btn" onclick="showPredictionView('J3')">J3</button>
            <button id="prediction-help-btn" onclick="document.getElementById('prediction-help-pop').style.display='block'">シーズン予測とは？</button>
        `;
        // イベントリスナーを再設定する必要がある
        tabsContainer.querySelectorAll('.rank-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => showPredictionView(btn.textContent));
        });
        tabsContainer.dataset.initialized = 'true';
    }
    showPredictionView('J1');
}

function showPredictionView(league) {
    const tabsContainer = document.getElementById('prediction-league-tabs');
    if (tabsContainer) {
        tabsContainer.querySelectorAll('.rank-tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = Array.from(tabsContainer.querySelectorAll('.rank-tab-btn')).find(btn => btn.textContent === league);
        if (activeBtn) activeBtn.classList.add('active');
    }
    renderPrediction(league);
}

function renderPrediction(league) {
    const container = document.getElementById('prediction-container');
    const leagueProbs = window.predictionProbabilities[league];
    if (!leagueProbs) {
        container.innerHTML = '<p style="text-align:center;">予測データを生成できませんでした。</p>';
        return;
    }
    let dateHtml = '';
    const updatedTimestamp = window.updateDates['prediction_probabilities.json'];
    if (updatedTimestamp) {
        const updatedDate = new Date(updatedTimestamp);
        const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        dateHtml = `<p class="update-date-note">更新日時: ${formattedDate}</p>`;
    }
    const teamList = Object.keys(leagueProbs).map(teamName => ({ name: teamName, ...leagueProbs[teamName] }));
    const stableSort = (arr, compareFn) => arr.map((item, index) => ({ item, index })).sort((a, b) => { const order = compareFn(a.item, b.item); if (order !== 0) return order; return a.index - b.index; }).map(({ item }) => item);
    const predictions = { champion: stableSort(teamList, (a, b) => b.champion - a.champion).slice(0, 5).filter(t => t.champion > 0), acl: stableSort(teamList, (a, b) => b.acl - a.acl).slice(0, 5).filter(t => t.acl > 0), promotion: stableSort(teamList, (a, b) => b.promotion - a.promotion).slice(0, 5).filter(t => t.promotion > 0), relegation: stableSort(teamList, (a, b) => b.relegation - a.relegation).slice(0, 5).filter(t => t.relegation > 0), full_ranking: stableSort(teamList, (a, b) => b.safe - a.safe).slice(0, 15) };
    const categorySettings = { champion: { title: '🏆 優勝確率 TOP5', probKey: 'champion', className: 'champion' }, acl: { title: '🌐 ACL出場圏確率 TOP5', probKey: 'acl', className: 'acl' }, promotion: { title: '⬆️ 昇格確率 TOP5', probKey: 'promotion', className: 'promotion' }, relegation: { title: '⚠️ 降格確立 TOP5', probKey: 'relegation', className: 'relegation' }, full_ranking: { title: '✅ 残留以上確率 TOP15', probKey: 'safe', className: 'safe' } };
    let displayOrder;
    if (league === 'J1') { categorySettings.relegation.title = '⚠️ J2降格確立 TOP5'; displayOrder = ['champion', 'relegation', 'full_ranking', 'acl']; } else if (league === 'J2') { categorySettings.promotion.title = '⬆️ J1昇格確率 TOP5'; categorySettings.relegation.title = '⚠️ J3降格確立 TOP5'; displayOrder = ['promotion', 'relegation', 'full_ranking']; } else if (league === 'J3') { categorySettings.promotion.title = '⬆️ J2昇格確率 TOP5'; categorySettings.relegation.title = '⚠️ JFL降格確立 TOP5'; displayOrder = ['promotion', 'relegation', 'full_ranking']; } else { displayOrder = []; }
    let html = '<div class="prediction-grid">';
    displayOrder.forEach(key => {
        const teams = predictions[key];
        if (!teams || teams.length === 0) return;
        const cat = categorySettings[key];
        html += ` <div class="prediction-card"> <div class="prediction-card-header ${cat.className}"> ${cat.title} </div> <div class="prediction-card-body"> <ul class="prediction-list"> ${teams.map((team, index) => { const probability = team[cat.probKey]; const probText = (probability !== null && typeof probability !== 'undefined') ? `${(probability * 100).toFixed(1)}%` : ''; return ` <li> <div class="rank-team"> <span class="rank">${index + 1}位</span> <span class="team-name">${team.name}</span> </div> ${probText ? `<span class="probability">${probText}</span>` : ''} </li>`; }).join('')} </ul> </div> </div> `;
    });
    html += '</div>';
    container.innerHTML = dateHtml + html;
}

// 初期化処理
initPredictionPage();