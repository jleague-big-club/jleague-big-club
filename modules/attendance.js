// === modules/attendance.js (最終確定版) ===

let attendanceInitialized = false;
let attendanceChart = null;

// ★★★★★ initialize を async 関数にする ★★★★★
export async function initialize() {
    // 最初に必要なデータを非同期で読み込み、完了を待つ
    await window.loadAttendanceData();

    if (!window.attendanceData || window.attendanceData.length === 0) {
        console.error("平均観客数の表示に必要なデータがありません。");
        const container = document.getElementById('attendance-output-container');
        if(container) container.innerHTML = '<p style="text-align:center;">データを取得できませんでした。</p>';
        return;
    }
    
    // onclick属性から呼び出せるようにグローバルに登録
    window.renderAttendanceChart = renderAttendanceChart;

    // イベントリスナーのセットアップ（初回のみ）
    if (!attendanceInitialized) {
        setupAttendanceEventListeners();
        attendanceInitialized = true;
    }

    // 初回表示または更新
    updateAttendanceFilters();
    // アクティブボタンを「全て」に設定
    const leagueBtnContainer = document.getElementById('attendance-league-btns');
    if (leagueBtnContainer) {
        leagueBtnContainer.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active'));
        const allBtn = leagueBtnContainer.querySelector('.rank-tab-btn[data-league="all"]');
        if(allBtn) allBtn.classList.add('active');
    }
}

function setupAttendanceEventListeners() {
    const yearSelect = document.getElementById('attendance-year-select');
    if (yearSelect) {
        const years = [...new Set(window.attendanceData.map(d => d.年))].sort((a, b) => b - a);
        yearSelect.innerHTML = '';
        years.forEach(year => {
            yearSelect.innerHTML += `<option value="${year}">${year}年</option>`;
        });
        yearSelect.addEventListener('change', updateAttendanceFilters);
    }

    const leagueBtnContainer = document.getElementById('attendance-league-btns');
    if (leagueBtnContainer) {
        let leagueBtnsHtml = `<button class="rank-tab-btn active" data-league="all">全て</button>`;
        const leagues = [...new Set(window.attendanceData.map(d => d.リーグ))].filter(Boolean).sort();
        leagues.forEach(league => {
            leagueBtnsHtml += `<button class="rank-tab-btn" data-league="${league}">${league}</button>`;
        });
        leagueBtnContainer.innerHTML = leagueBtnsHtml;

        leagueBtnContainer.querySelectorAll('.rank-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                leagueBtnContainer.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateAttendanceFilters();
            });
        });
    }
    
    const clubSelect = document.getElementById('attendance-club-select');
    if (clubSelect) {
        clubSelect.addEventListener('change', (e) => {
            if (e.target.value && e.target.value !== 'all') {
                renderAttendanceChart(e.target.value);
            } else {
                updateAttendanceFilters();
            }
        });
    }
}

// ... (updateAttendanceFilters, renderAttendanceTable, renderAttendanceChart 関数は変更なし) ...
function updateAttendanceFilters() {
    const selectedYear = parseInt(document.getElementById('attendance-year-select').value);
    const activeLeagueBtn = document.querySelector('#attendance-league-btns .rank-tab-btn.active');
    const selectedLeague = activeLeagueBtn ? activeLeagueBtn.dataset.league : 'all';
    const clubSelect = document.getElementById('attendance-club-select');
    const clubsForDropdown = window.attendanceData.filter(d => d.年 === selectedYear && (selectedLeague === 'all' || d.リーグ === selectedLeague));
    const clubNames = [...new Set(clubsForDropdown.map(d => d.クラブ))].sort((a, b) => a.localeCompare(b, 'ja'));
    let optionsHtml = '<option value="all">クラブを選択...</option>';
    clubNames.forEach(name => {
        optionsHtml += `<option value="${name}">${name}</option>`;
    });
    clubSelect.innerHTML = optionsHtml;
    const dataForTable = window.attendanceData.filter(d => d.年 === selectedYear && (selectedLeague === 'all' || d.リーグ === selectedLeague));
    renderAttendanceTable(dataForTable);
}
// (renderAttendanceTable と renderAttendanceChart のコードは前の回答と同じなので省略)