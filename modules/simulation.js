// === modules/simulation.js ===

let simInitialized = false;

function getCategoryInfo(score) {
    if (score >= 50) return { text: 'ビッグクラブ', color: '#ffd700' };
    if (score >= 30) return { text: '有望ビッグクラブ', color: '#e94444' };
    if (score >= 20) return { text: '潜在的ビッグクラブ', color: '#41cdf4' };
    if (score >= 5) return { text: '中堅クラブ', color: '#bbb' };
    return { text: 'ローカルクラブ', color: '#999' };
}

function initSimulationPage() {
    const leagueSelect = document.getElementById('sim-league-select');
    if (!leagueSelect) {
        console.error("シミュレーションページの要素が見つかりませんでした。HTMLの構造を確認してください。");
        return;
    }
    if (!simInitialized) {
        const clubSelect = document.getElementById('sim-club-select');
        const inputs = document.querySelectorAll('.sim-input');
        leagueSelect.addEventListener('change', () => {
            populateClubSelect(leagueSelect.value);
        });
        clubSelect.addEventListener('change', () => {
            displayClubData(clubSelect.value);
        });
        inputs.forEach(input => {
            input.addEventListener('input', runSimulation);
        });
        simInitialized = true;
    }
    leagueSelect.innerHTML = '<option value="">まずリーグを選択...</option>';
    ['J1', 'J2', 'J3'].forEach(league => {
        leagueSelect.innerHTML += `<option value="${league}">${league}</option>`;
    });
    populateClubSelect('');
}

function populateClubSelect(league) {
    const clubSelect = document.getElementById('sim-club-select');
    const inputs = document.querySelectorAll('.sim-input');
    clubSelect.innerHTML = '<option value="">クラブを選択...</option>';
    clubSelect.disabled = true;
    inputs.forEach(input => {
        input.value = '';
        input.disabled = true;
    });
    document.getElementById('sim-result-area').innerHTML = '<p>クラブを選択すると、ここにスコアが表示されます。</p>';
    if (!league) return;
    const clubsInLeague = window.clubData.filter(c => c.p === league).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    clubsInLeague.forEach(club => {
        clubSelect.innerHTML += `<option value="${club.name}">${club.name}</option>`;
    });
    clubSelect.disabled = false;
}

function displayClubData(clubName) {
    const inputs = document.querySelectorAll('.sim-input');
    const resultArea = document.getElementById('sim-result-area');
    if (!clubName) {
        inputs.forEach(input => {
            input.value = '';
            input.disabled = true;
        });
        resultArea.innerHTML = '<p>クラブを選択すると、ここにスコアが表示されます。</p>';
        return;
    }
    inputs.forEach(input => input.disabled = false);
    const club = window.clubData.find(c => c.name === clubName);
    if (!club) return;
    document.getElementById('sim-revenue').value = club.revenue || '';
    document.getElementById('sim-audience').value = club.audience || '';
    document.getElementById('sim-titles').value = club.titles || '';
    document.getElementById('sim-avg-rank').value = club.m || '';
    const currentScore = club.sum || 0;
    const currentCategory = getCategoryInfo(currentScore);
    resultArea.innerHTML = ` <div class="sim-current-score"> 現在の区分: <span style="color: ${currentCategory.color}; font-weight: bold;">${currentCategory.text}</span><br> 現在のビッグクラブスコア: <strong>${currentScore.toFixed(2)}</strong> </div> <div class="sim-new-score"> <p style="margin:0; font-size:0.8em; color:#ccc;">数値を変更してください</p> </div> `;
}

function runSimulation() {
    const clubName = document.getElementById('sim-club-select').value;
    if (!clubName) return;
    const club = window.clubData.find(c => c.name === clubName);
    if (!club) return;
    const revenue = parseFloat(document.getElementById('sim-revenue').value) || club.revenue;
    const audience = parseInt(document.getElementById('sim-audience').value) || club.audience;
    const titles = parseInt(document.getElementById('sim-titles').value) || club.titles;
    const avgRank = parseFloat(document.getElementById('sim-avg-rank').value) || parseFloat(club.m);
    const currentScore = club.sum || 0;
    const currentCategory = getCategoryInfo(currentScore);
    const newScore = calculateBigClubScore(revenue, audience, titles, avgRank);
    const newCategory = getCategoryInfo(newScore);
    const resultArea = document.getElementById('sim-result-area');
    resultArea.innerHTML = ` <div class="sim-current-score"> 現在の区分: <span style="color: ${currentCategory.color}; font-weight: bold;">${currentCategory.text}</span><br> 現在のビッグクラブスコア: <strong>${currentScore.toFixed(2)}</strong> </div> <div class="sim-new-score"> 予測区分: <span style="color: ${newCategory.color}; font-weight: bold;">${newCategory.text}</span><br> 予測スコア <span class="arrow">→</span> <span class="score-value">${newScore.toFixed(2)}</span> </div> `;
}

function calculateBigClubScore(revenue, audience, titles, avgRank) {
    if (isNaN(revenue) || isNaN(audience) || isNaN(titles) || isNaN(avgRank) || avgRank > 21) {
        return 0;
    }
    const revenueScore = (revenue / 200) * 100;
    const audienceScore = (audience / 45000) * 100;
    const titleScore = (titles / 98) * 100;
    const rankScore = 21 - avgRank;
    const totalScore = (revenueScore * 0.3) + (audienceScore * 0.15) + (titleScore * 0.25) + (rankScore * 0.3);
    return Math.max(0, totalScore);
}

// 初期化処理
if (window.clubData.length > 0) {
    initSimulationPage();
}