import { getAttendanceData } from '../dataManager.js';
import { clubAbbreviations, formatSeasonLabel } from '../config.js';
import { loadScript } from '../uiHelpers.js';

let attendanceChart = null;
let leagueChart = null;
const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js';

// メインの描画関数
export default async function initAttendancePage(container) {
    // 1. HTMLの枠組みとCSS
    const style = `
        <style>
            .attendance-controls {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                justify-content: center;
                margin-bottom: 20px;
                align-items: center;
            }
            .attendance-select {
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid #5a75a7;
                background-color: #232947;
                color: #fff;
                font-weight: bold;
                cursor: pointer;
                font-size: 1em;
            }
            /* 枠線・背景・影なし */
            .attendance-table-container {
                overflow-x: auto;
                background: transparent;
                border: none;
                box-shadow: none;
                padding-bottom: 10px;
                /* PCでは中央寄せ */
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .att-table {
                width: 100%;
                /* PC: 余裕を持たせた幅 */
                max-width: 800px; 
                margin: 0 auto; 
                border-collapse: collapse;
                color: #eaf7fc;
            }
            .update-date {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                text-align: right;
                font-size: 0.9em;
                color: #abc;
                padding: 5px 0;
            }
            .att-table th, .att-table td {
                padding: 12px 8px;
                text-align: left;
                border-bottom: 1px solid #3a486b;
                font-size: 1.0em;
            }
            .att-table th {
                background: linear-gradient(180deg, #2a3758 0%, #232947 100%);
                color: #baf7fa;
                position: sticky;
                top: 0;
                white-space: nowrap;
                z-index: 1;
                font-weight: bold;
                text-align: center;
            }
            .att-table tr:hover {
                background-color: rgba(41, 182, 246, 0.15) !important;
            }
            
            /* グラフエリアのスタイル（PCデフォルト） */
            .chart-wrapper {
                background: #1f253d;
                border: 1px solid #4a5a7f;
                border-radius: 12px;
                padding: 20px 20px 40px 20px;
                margin-bottom: 20px;
                display: none;
                position: relative;
                height: 550px; /* PCでの高さ */
                width: 100%;
                box-sizing: border-box;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }

            canvas#attendanceChart {
                background-color: transparent !important;
            }

            /* リーグ別グラフ（表の上に常時表示） */
            .league-chart-wrapper {
                background: #1f253d;
                border: 1px solid #4a5a7f;
                border-radius: 12px;
                padding: 16px;
                margin: 0 auto 20px;
                width: 100%;
                max-width: 800px;
                box-sizing: border-box;
                box-shadow: 0 10px 30px rgba(0,0,0,0.35);
            }
            /* style.min.css のグローバル canvas 指定
               (height:480px !important / width:100% !important / background:#fff)
               に潰されるため、ID込みの詳細度で上書きする */
            #attendance-league-chart-box canvas {
                height: 100% !important;
                width: 100% !important;
                background: transparent !important;
                margin-bottom: 0;
            }
            @media (max-width: 768px) {
                .league-chart-wrapper {
                    padding: 10px 6px;
                }
            }
            
            .back-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                padding: 6px 14px;
                background: rgba(233, 68, 68, 0.2);
                color: #ff6b6b;
                border: 1px solid #e94444;
                border-radius: 6px;
                cursor: pointer;
                z-index: 10;
                font-size: 0.9em;
                transition: all 0.2s;
            }
            .back-btn:hover {
                background: #e94444;
                color: #fff;
                box-shadow: 0 0 10px rgba(233, 68, 68, 0.5);
            }

            /* スマホ対応 */
            @media (max-width: 768px) {
                .attendance-table-container {
                    display: block;
                    padding: 0;
                    width: 95vw;
                    margin-left: 50%;
                    transform: translateX(-50%);
                }
                .att-table {
                    width: 100%;
                    max-width: none;
                    table-layout: fixed; /* 列幅を固定 */
                }
                .update-date {
                    max-width: none;
                    padding-right: 10px;
                }
                .att-table th, .att-table td { 
                    padding: 10px 1px;
                    font-size: 15px;   
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: center; /* 基本は中央寄せ */
                }
                
                .mobile-hidden {
                    display: table-cell; 
                }

                /* 「試合数」は非表示 */
                .att-table th:nth-child(7), .att-table td:nth-child(7) {
                    display: none;
                }
                
                /* --- 列幅配分 (合計100%) --- */
                .att-table th:nth-child(1), .att-table td:nth-child(1) { width: 10%; }
                .att-table th:nth-child(2), .att-table td:nth-child(2) { width: 10%; }
                .att-table th:nth-child(3), .att-table td:nth-child(3) { width: 20%; text-align: left; padding-left: 4px; }
                .att-table th:nth-child(4), .att-table td:nth-child(4) { width: 20%; }
                .att-table th:nth-child(5), .att-table td:nth-child(5) { width: 20%; }
                .att-table th:nth-child(6), .att-table td:nth-child(6) { width: 20%; }

                .att-table th:nth-child(6), .att-table td:nth-child(6) {
                    padding-right: 8px !important;  /* 右に8pxの隙間を作る */
                }

                /* ★グラフエリアの調整 */
                .chart-wrapper { 
                    /* 高さを少し増やして描画領域を確保 */
                    height: 550px; 
                    /* 上部のパディングを増やして、閉じるボタンとタイトルが重ならないようにする */
                    padding: 50px 10px 10px 10px; 
                }
                /* 閉じるボタンを少し小さくして邪魔にならないように */
                .back-btn {
                    top: 10px;
                    right: 10px;
                    padding: 4px 10px;
                    font-size: 0.85em;
                }
            }
        </style>
    `;

    container.innerHTML = `
        ${style}
        <div class="attendance-page fade-in">
            <!-- コントロールエリア -->
            <div class="attendance-controls">
                <div>
                    <span style="color:#baf7fa; font-weight:bold; margin-right:5px; font-size:1.1em;">年度:</span>
                    <select id="attendance-year-select" class="attendance-select"></select>
                </div>
                <div id="attendance-league-btns" class="tabs">
                    <!-- リーグボタンはJSで生成 -->
                </div>
                <div>
                    <select id="attendance-club-select" class="attendance-select">
                        <option value="all">クラブを選択...</option>
                    </select>
                </div>
            </div>

            <!-- グラフ表示エリア -->
            <div id="attendance-chart-wrap" class="chart-wrapper">
                <button id="chart-back-btn" class="back-btn">× 閉じる</button>
                <div id="attendance-chart-legend" style="text-align:center; padding: 8px 0 0; display:flex; justify-content:center; flex-wrap:wrap;"></div>
                <div style="position:relative; height:100%; width:100%; overflow:hidden;">
                    <canvas id="attendanceChart"></canvas>
                </div>
            </div>

            <!-- リーグ別グラフ（表と連動） -->
            <div id="attendance-league-chart-wrap" class="league-chart-wrapper">
                <div id="attendance-league-chart-box" style="position:relative; width:100%;">
                    <canvas id="attendanceLeagueChart"></canvas>
                </div>
            </div>

            <!-- テーブル表示エリア -->
            <div id="attendance-output-container" class="attendance-table-container">
                <p style="text-align:center; color:#abc; padding:20px;">データを読み込み中...</p>
            </div>
        </div>
    `;

    // 2. データの読み込みと初期化処理
    const attendanceData = await getAttendanceData();
    
    // 年度のセットアップ
    const yearSelect = document.getElementById('attendance-year-select');
    const years = [...new Set(attendanceData.map(d => d.年))].sort((a, b) => b - a);
    yearSelect.innerHTML = '';
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${formatSeasonLabel(year)}</option>`;
    });

    // リーグボタンのセットアップ
    const leagueBtnContainer = document.getElementById('attendance-league-btns');
    const leagues = ['J1', 'J2', 'J3'];
    let leagueBtnsHtml = `<button class="rank-tab-btn active" data-league="all">全て</button>`;
    leagues.forEach(league => {
        leagueBtnsHtml += `<button class="rank-tab-btn" data-league="${league}">${league}</button>`;
    });
    leagueBtnContainer.innerHTML = leagueBtnsHtml;

    // イベントリスナー
    yearSelect.addEventListener('change', updateAttendanceFilters);
    
    leagueBtnContainer.querySelectorAll('.rank-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            leagueBtnContainer.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            showListView();
            document.getElementById('attendance-club-select').value = 'all';

            updateAttendanceFilters();
        });
    });

    document.getElementById('attendance-club-select').addEventListener('change', (e) => {
        if (e.target.value && e.target.value !== 'all') {
            renderAttendanceChart(e.target.value);
        } else {
            showListView();
        }
    });

    document.getElementById('chart-back-btn').addEventListener('click', () => {
        showListView();
        document.getElementById('attendance-club-select').value = 'all';
    });

    updateAttendanceFilters();
}

const LEAGUE_COLORS = { 'J1': '#ff4b4b', 'J2': '#00d2ff', 'J3': '#00ff88', 'JFL': '#ffae00' };

// 一覧表示（リーグ別グラフ＋テーブル）に戻す
function showListView() {
    document.getElementById('attendance-chart-wrap').style.display = 'none';
    document.getElementById('attendance-league-chart-wrap').style.display = '';
    document.getElementById('attendance-output-container').style.display = '';
}

// リーグ平均観客数の推移グラフ（1993年〜）。リーグボタンの選択に連動する
// 「全て」なら J1/J2/J3 の3本、個別リーグなら1本を表示する
async function renderLeagueChart(allData, selectedLeague) {
    const wrap = document.getElementById('attendance-league-chart-wrap');
    const canvas = document.getElementById('attendanceLeagueChart');
    if (!wrap || !canvas) return;

    try {
        await loadScript(CHART_JS_URL);
    } catch (e) {
        wrap.style.display = 'none';
        return;
    }

    const targetLeagues = selectedLeague === 'all' ? ['J1', 'J2', 'J3'] : [selectedLeague];

    // 年ごと・リーグごとに、所属クラブの平均観客数を平均する（表に出ている数値の平均）
    const totals = {};
    allData.forEach(d => {
        if (!targetLeagues.includes(d.リーグ)) return;
        if (!d.平均観客数) return;
        const key = d.リーグ + '_' + d.年;
        if (!totals[key]) totals[key] = { sum: 0, count: 0 };
        totals[key].sum += d.平均観客数;
        totals[key].count += 1;
    });

    const years = [...new Set(allData
        .filter(d => targetLeagues.includes(d.リーグ))
        .map(d => d.年))].sort((a, b) => a - b);

    if (years.length === 0) {
        if (leagueChart) { leagueChart.destroy(); leagueChart = null; }
        wrap.style.display = 'none';
        return;
    }

    const isMobile = window.innerWidth <= 768;
    document.getElementById('attendance-league-chart-box').style.height = (isMobile ? 280 : 400) + 'px';

    const datasets = targetLeagues.map(lg => {
        const color = LEAGUE_COLORS[lg] || '#4a90e2';
        return {
            label: lg,
            // 該当年にそのリーグが存在しない場合は null にして線を繋がない（J3は2014年開始）
            data: years.map(y => {
                const t = totals[lg + '_' + y];
                return t ? Math.round(t.sum / t.count) : null;
            }),
            borderColor: color,
            backgroundColor: color,
            pointBackgroundColor: color,
            borderWidth: 2,
            pointRadius: isMobile ? 0 : 2,
            pointHoverRadius: 5,
            tension: 0.3,
            spanGaps: false
        };
    });

    if (leagueChart) leagueChart.destroy();

    leagueChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels: years.map(y => formatSeasonLabel(y)), datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: targetLeagues.length > 1,
                    labels: { color: '#eaf7fc', boxWidth: 14, font: { size: isMobile ? 11 : 13 } }
                },
                title: {
                    display: true,
                    text: (selectedLeague === 'all' ? 'リーグ別' : selectedLeague) + ' 平均観客数の推移',
                    color: '#eaf7fc',
                    font: { size: isMobile ? 13 : 16, weight: 'bold' },
                    padding: { bottom: 10 }
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 40, 0.9)',
                    callbacks: {
                        label: (ctx) => ctx.raw === null
                            ? null
                            : `${ctx.dataset.label}: ${ctx.raw.toLocaleString()} 人`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    ticks: {
                        color: '#8899bb',
                        font: { size: isMobile ? 9 : 11 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: isMobile ? 6 : 12
                    }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    ticks: {
                        color: '#8899bb',
                        font: { size: isMobile ? 9 : 11 },
                        callback: (v) => v >= 10000 ? (v / 10000) + '万' : v.toLocaleString()
                    },
                    beginAtZero: true
                }
            }
        }
    });

    // クラブ別グラフを開いている最中は一覧側を出さない
    // （ドリルダウン中に年度を変更したときに勝手に復帰してしまうのを防ぐ）
    const clubChartOpen = document.getElementById('attendance-chart-wrap').style.display === 'block';
    if (!clubChartOpen) wrap.style.display = '';
}


// フィルタリングとテーブル更新
function updateAttendanceFilters() {
    getAttendanceData().then(attendanceData => {
        const yearSelect = document.getElementById('attendance-year-select');
        const selectedYear = parseInt(yearSelect.value);
        const activeLeagueBtn = document.querySelector('#attendance-league-btns .rank-tab-btn.active');
        const selectedLeague = activeLeagueBtn ? activeLeagueBtn.dataset.league : 'all';
        
        const clubSelect = document.getElementById('attendance-club-select');
        const clubNames = [...new Set(attendanceData.map(d => d.クラブ))].sort((a, b) => a.localeCompare(b, 'ja'));
        
        const currentClub = clubSelect.value;
        let optionsHtml = '<option value="all">クラブを選択...</option>';
        clubNames.forEach(name => {
            const selected = name === currentClub ? 'selected' : '';
            optionsHtml += `<option value="${name}" ${selected}>${name}</option>`;
        });
        clubSelect.innerHTML = optionsHtml;

        const dataForTable = attendanceData.filter(d => d.年 === selectedYear && (selectedLeague === 'all' || d.リーグ === selectedLeague));
        renderAttendanceTable(dataForTable);
        renderLeagueChart(attendanceData, selectedLeague);
    });
}

// テーブル描画
function renderAttendanceTable(tableData) {
    const outputContainer = document.getElementById('attendance-output-container');
    
    const getLeagueBadge = (league) => {
        let color = '#555';
        if (league === 'J1') color = '#e94444';
        if (league === 'J2') color = '#29b6e6';
        if (league === 'J3') color = '#6cbf6b';
        if (league === 'JFL') color = '#f2a136';
        return `<span style="background:${color}; padding:3px 8px; border-radius:4px; font-size:0.85em; font-weight:bold;">${league}</span>`;
    };

    let html = `<table class="att-table"><thead><tr>
        <th>順位</th>
        <th>リーグ</th>
        <th>クラブ</th>
        <th style="text-align:right;">平均観客数</th>
        <th class="mobile-hidden" style="text-align:right;">年間最高</th>
        <th class="mobile-hidden" style="text-align:right;">年間最低</th>
        <th class="mobile-hidden" style="text-align:center;">試合数</th>
    </tr></thead><tbody>`;

    if (tableData.length === 0) {
        html += `<tr><td colspan="7" style="text-align:center; padding:20px;">データがありません</td></tr>`;
    } else {
        tableData.sort((a, b) => b.平均観客数 - a.平均観客数).forEach((row, index) => {
            const clubDisplayName = clubAbbreviations[row.クラブ] || row.クラブ;
            
            let rankHtml = `<span style="font-weight:bold; color:#8899bb;">${index + 1}</span>`;
            if (index === 0) rankHtml = `<span style="color:gold; font-size:1.2em;">1</span>`;
            if (index === 1) rankHtml = `<span style="color:silver; font-size:1.1em;">2</span>`;
            if (index === 2) rankHtml = `<span style="color:#cd7f32; font-size:1.1em;">3</span>`;

            html += `
                <tr style="cursor: pointer;" onclick="renderAttendanceChart('${row.クラブ}')">
                    <td style="text-align:center;">${rankHtml}</td>
                    <td style="text-align:center;">${getLeagueBadge(row.リーグ)}</td>
                    <td style="font-weight:bold;">${clubDisplayName}</td>
                    <!-- PC表示時は右寄せ、スマホはCSSでcenter上書き -->
                    <td style="text-align:right; font-family:monospace; font-weight:bold; color:#fff;">${Math.round(row.平均観客数).toLocaleString()}</td>
                    <td class="mobile-hidden" style="text-align:right; color:#abc;">${Math.round(row.年間最高観客数).toLocaleString()}</td>
                    <td class="mobile-hidden" style="text-align:right; color:#abc;">${Math.round(row.年間最低観客数).toLocaleString()}</td>
                    <td class="mobile-hidden" style="text-align:center; color:#abc;">${row.ゲーム数}</td>
                </tr>`;
        });
    }
    html += `</tbody></table>`;
    
    getAttendanceData().then(d => {
        if (d.lastModified) {
            const date = new Date(d.lastModified).toLocaleDateString('ja-JP');
            outputContainer.innerHTML = `<div class="update-date">更新日: ${date}</div>` + html;
        } else {
            outputContainer.innerHTML = html;
        }
    });
}

// チャート描画
window.renderAttendanceChart = async function(clubName) {
    const chartWrap = document.getElementById('attendance-chart-wrap');
    const canvas = document.getElementById('attendanceChart');
    
    document.getElementById('attendance-output-container').style.display = 'none';
    document.getElementById('attendance-league-chart-wrap').style.display = 'none';
    chartWrap.style.display = 'block';
    
    const clubSelect = document.getElementById('attendance-club-select');
    if (clubSelect.value !== clubName) clubSelect.value = clubName;

    chartWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
        await loadScript(CHART_JS_URL);
        const allData = await getAttendanceData();
        
        const clubHistory = allData.filter(d => d.クラブ === clubName).sort((a, b) => a.年 - b.年);
        
        if (attendanceChart) attendanceChart.destroy();

        const isMobile = window.innerWidth <= 768;
        const titleFontSize = isMobile ? 14 : 18;

        const ctx = canvas.getContext('2d');
        const colorMap = { 'J1': '#ff4b4b', 'J2': '#00d2ff', 'J3': '#00ff88', 'JFL': '#ffae00' };
        
        const latestLeague = clubHistory.length > 0 ? clubHistory[clubHistory.length - 1].リーグ : 'J1';
        const mainColor = colorMap[latestLeague] || '#4a90e2';

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, mainColor + '40');
        gradient.addColorStop(1, mainColor + '00');

        // 各年のリーグ色
        const pointColors = clubHistory.map(d => colorMap[d.リーグ] || '#4a90e2');

        attendanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: clubHistory.map(d => d.年),
                datasets: [{
                    label: '平均観客数',
                    data: clubHistory.map(d => d.平均観客数),
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: pointColors,
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: pointColors,
                    segment: {
                        borderColor: (ctx) => colorMap[clubHistory[ctx.p0DataIndex]?.リーグ] || mainColor
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 20, right: 20, left: 10, bottom: 0 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20, 25, 40, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#eaf7fc',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => `${clubHistory[ctx.dataIndex].リーグ}: ${Math.round(ctx.raw).toLocaleString()} 人`
                        }
                    },
                    title: {
                        display: true,
                        text: `${clubName} 平均観客数推移`,
                        color: '#eaf7fc',
                        font: { size: titleFontSize, weight: 'bold', family: "sans-serif" },
                        padding: { bottom: 10 }
                    }
                },
                scales: {
                    x: {
                        grid: { 
                            color: 'rgba(255,255,255,0.05)',
                            borderColor: 'transparent'
                        },
                        ticks: { color: '#8899bb', font: { size: 11 } }
                    },
                    y: {
                        grid: { 
                            color: 'rgba(255,255,255,0.05)',
                            borderColor: 'transparent',
                            borderDash: [5, 5]
                        },
                        ticks: { color: '#8899bb', font: { size: 11 } },
                        beginAtZero: true
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
            }
        });

        // リーグ凡例を動的に生成（そのクラブが在籍したリーグのみ）
        const leaguesInHistory = [...new Set(clubHistory.map(d => d.リーグ))];
        const legendOrder = ['J1', 'J2', 'J3', 'JFL'];
        const legendEl = document.getElementById('attendance-chart-legend');
        if (legendEl) {
            legendEl.innerHTML = legendOrder
                .filter(l => leaguesInHistory.includes(l))
                .map(l => `<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:0.85rem;color:#eaf7fc;">
                    <span style="display:inline-block;width:18px;height:4px;border-radius:2px;background:${colorMap[l]};"></span>${l}
                </span>`).join('');
        }

    } catch (e) {
        console.error(e);
        chartWrap.innerHTML = '<p style="color:#eaf7fc; text-align:center; padding-top:20px;">グラフの描画に失敗しました。</p>';
    }
};