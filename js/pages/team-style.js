import { getTeamStyleData, getRankingData } from '../dataManager.js';

let mergedData = null;
let scatterChart = null;
let radarChart = null;
let currentLeague = 'J1';
let selectedTeamName = null;

// クラブ名略称マップ
const clubAbbreviations = {
    // J1
    "北海道コンサドーレ札幌": "札幌", "鹿島アントラーズ": "鹿島", "浦和レッズ": "浦和", 
    "柏レイソル": "柏", "ＦＣ東京": "FC東京", "FC東京": "FC東京", "東京ヴェルディ": "東京V", 
    "ＦＣ町田ゼルビア": "町田", "FC町田ゼルビア": "町田", "川崎フロンターレ": "川崎F", 
    "横浜Ｆ・マリノス": "横浜FM", "横浜F・マリノス": "横浜FM", "湘南ベルマーレ": "湘南", 
    "アルビレックス新潟": "新潟", "ジュビロ磐田": "磐田", "名古屋グランパス": "名古屋", 
    "京都サンガF.C.": "京都", "ガンバ大阪": "G大阪", "セレッソ大阪": "C大阪", 
    "ヴィッセル神戸": "神戸", "サンフレッチェ広島": "広島", "アビスパ福岡": "福岡", "サガン鳥栖": "鳥栖",
    // J2
    "ベガルタ仙台": "仙台", "ブラウブリッツ秋田": "秋田", "モンテディオ山形": "山形", 
    "いわきＦＣ": "いわき", "いわきFC": "いわき", "水戸ホーリーホック": "水戸", 
    "栃木ＳＣ": "栃木", "栃木SC": "栃木", "ザスパ群馬": "群馬", "ザスパクサツ群馬": "群馬",
    "ジェフユナイテッド千葉": "千葉", "横浜ＦＣ": "横浜FC", "横浜FC": "横浜FC", 
    "ヴァンフォーレ甲府": "甲府", "清水エスパルス": "清水", "藤枝ＭＹＦＣ": "藤枝", "藤枝MYFC": "藤枝",
    "ファジアーノ岡山": "岡山", "レノファ山口ＦＣ": "山口", "レノファ山口FC": "山口",
    "徳島ヴォルティス": "徳島", "愛媛ＦＣ": "愛媛", "愛媛FC": "愛媛", 
    "Ｖ・ファーレン長崎": "長崎", "V・ファーレン長崎": "長崎", "ロアッソ熊本": "熊本", 
    "大分トリニータ": "大分", "鹿児島ユナイテッドＦＣ": "鹿児島", "鹿児島ユナイテッドFC": "鹿児島",
    // J3
    "ヴァンラーレ八戸": "八戸", "福島ユナイテッドＦＣ": "福島", "福島ユナイテッドFC": "福島", 
    "大宮アルディージャ": "大宮", "ＲＢ大宮アルディージャ": "大宮",
    "Ｙ．Ｓ．Ｃ．Ｃ．横浜": "YS横浜", "Y.S.C.C.横浜": "YS横浜", "ＳＣ相模原": "相模原", "SC相模原": "相模原",
    "松本山雅ＦＣ": "松本", "松本山雅FC": "松本", "ＡＣ長野パルセイロ": "長野", "AC長野パルセイロ": "長野",
    "カターレ富山": "富山", "ツエーゲン金沢": "金沢", "アスルクラロ沼津": "沼津", 
    "ＦＣ岐阜": "岐阜", "FC岐阜": "岐阜", "ＦＣ大阪": "FC大阪", "FC大阪": "FC大阪", 
    "奈良クラブ": "奈良", "ガイナーレ鳥取": "鳥取", "カマタマーレ讃岐": "讃岐", 
    "ＦＣ今治": "今治", "FC今治": "今治", "ギラヴァンツ北九州": "北九州", 
    "テゲバジャーロ宮崎": "宮崎", "ＦＣ琉球": "琉球", "FC琉球": "琉球",
    "高知ユナイテッドＳＣ": "高知", "高知ユナイテッドSC": "高知", "栃木シティ": "栃木C"
};

function toHalfWidth(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[Ａ-Ｚａ-ｚ０-９．・]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, " ");
}

function calculateDeviation(value, values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
    if (stdDev === 0) return 50;
    return 50 + ((value - mean) / stdDev) * 10;
}

async function processData() {
    if (mergedData) return mergedData;
    
    const [styleData, rankingData] = await Promise.all([getTeamStyleData(), getRankingData()]);
    if (!styleData || !rankingData) return [];

    const dataByLeague = { J1: [], J2: [], J3: [] };

    for (const teamStyle of styleData) {
        const league = teamStyle.リーグ;
        if (!dataByLeague[league]) continue;
        
        let teamRankData = null;
        if (rankingData[league] && rankingData[league].data) {
             teamRankData = rankingData[league].data.find(d => 
                d.チーム名 === teamStyle.チーム名 || 
                toHalfWidth(d.チーム名) === toHalfWidth(teamStyle.チーム名)
            );
        }

        if (teamRankData) {
            const matches = parseInt(teamRankData.試合数, 10);
            if (matches > 0) {
                const originalName = teamStyle.チーム名;
                let shortName = clubAbbreviations[originalName] || clubAbbreviations[toHalfWidth(originalName)];
                if (!shortName) shortName = originalName.replace(/FC|ＦＣ|SC|ＳＣ/g, '').trim();

                dataByLeague[league].push({
                    'チーム名': originalName,
                    '省略名': shortName,
                    'リーグ': league,
                    'avgShoot': parseFloat((parseInt(teamStyle.シュート総数, 10) / matches).toFixed(2)),
                    'avgGoal': parseFloat((parseInt(teamRankData.得点, 10) / matches).toFixed(2)),
                    'avgConceded': parseFloat((parseInt(teamRankData.失点, 10) / matches).toFixed(2)),
                    'avgCross': parseFloat((parseInt(teamStyle.クロス総数, 10) / matches).toFixed(2)),
                    'avgFoul': parseFloat((parseInt(teamStyle.ファウル総数, 10) / matches).toFixed(2)),
                    'avgCard': parseFloat((parseInt(teamStyle.警告数, 10) / matches).toFixed(2)),
                });
            }
        }
    }

    for (const league of Object.keys(dataByLeague)) {
        const teams = dataByLeague[league];
        if (teams.length === 0) continue;

        const shoots = teams.map(t => t.avgShoot);
        const goals = teams.map(t => t.avgGoal);
        const conceded = teams.map(t => t.avgConceded);
        const crosses = teams.map(t => t.avgCross);
        const fouls = teams.map(t => t.avgFoul);
        const cards = teams.map(t => t.avgCard);

        teams.forEach(team => {
            const shootDev = calculateDeviation(team.avgShoot, shoots);
            const goalDev = calculateDeviation(team.avgGoal, goals);
            const concededDev = calculateDeviation(team.avgConceded, conceded);
            const crossDev = calculateDeviation(team.avgCross, crosses);
            const foulDev = calculateDeviation(team.avgFoul, fouls);
            const cardDev = calculateDeviation(team.avgCard, cards);

            team.xScore = (goalDev * 0.8) + (shootDev * 0.2);
            const defenseQuality = 100 - concededDev; 
            const intensity = (foulDev + cardDev) / 2;
            team.yScore = (defenseQuality * 0.8) + (intensity * 0.2);
            team.colorScore = crossDev; 
            
            team.deviations = {
                shoot: shootDev, goal: goalDev, cross: crossDev,
                conceded: concededDev, foul: foulDev, card: cardDev
            };
        });
    }

    mergedData = dataByLeague;
    return mergedData;
}

function renderTeamSelector() {
    const existingContainer = document.getElementById('team-selector-container');
    if (existingContainer) existingContainer.remove();

    const container = document.createElement('div');
    container.id = 'team-selector-container';
    container.style.cssText = 'display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:15px; flex-wrap:wrap;';

    const select = document.createElement('select');
    select.id = 'team-drilldown-select';
    select.style.cssText = 'padding:6px 12px; border-radius:8px; background:#232947; color:#fff; border:1px solid #4a5a7f; font-weight:bold; cursor:pointer;';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '全クラブ表示';
    select.appendChild(defaultOption);

    const data = mergedData[currentLeague];
    if (data) {
        const sortedTeams = [...data].sort((a, b) => a['チーム名'].localeCompare(b['チーム名'], 'ja'));
        sortedTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team['チーム名'];
            option.textContent = team['チーム名'];
            if (selectedTeamName === team['チーム名']) option.selected = true;
            select.appendChild(option);
        });
    }

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'リセット';
    resetBtn.style.cssText = 'padding:6px 12px; border-radius:8px; background:#4a5a7f; color:#fff; border:none; cursor:pointer; font-weight:bold;';
    resetBtn.addEventListener('click', () => {
        selectedTeamName = null;
        select.value = '';
        renderScatterChart();
        document.getElementById('team-style-radar-container').style.display = 'none';
    });

    select.addEventListener('change', (e) => {
        selectedTeamName = e.target.value || null;
        renderScatterChart();
        
        if (selectedTeamName) {
            const teamData = data.find(t => t['チーム名'] === selectedTeamName);
            if (teamData) {
                renderRadarChart(teamData, data);
                // レーダーチャートまでスクロール
                document.getElementById('team-style-radar-container').style.display = 'block';
                document.getElementById('team-style-radar-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            document.getElementById('team-style-radar-container').style.display = 'none';
        }
    });

    container.appendChild(select);
    container.appendChild(resetBtn);

    const controlsDiv = document.getElementById('team-style-controls');
    controlsDiv.parentNode.insertBefore(container, controlsDiv.nextSibling);
}

function renderScatterChart() {
    const data = mergedData[currentLeague];
    if (!data || data.length === 0) return;
    
    const xValues = data.map(d => d.xScore);
    const yValues = data.map(d => d.yScore);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const padding = 4;
    const chartMinX = Math.floor(xMin - padding);
    const chartMaxX = Math.ceil(xMax + padding);
    const chartMinY = Math.floor(yMin - padding);
    const chartMaxY = Math.ceil(yMax + padding);

    // ★★★ 修正点: データフィルタリング時に「該当なし」を防ぐ ★★★
    let displayData = data;
    if (selectedTeamName) {
        // 現在のリーグに、選択中のチームが存在するか確認
        const exists = data.some(t => t['チーム名'] === selectedTeamName);
        if (exists) {
            displayData = data.filter(t => t['チーム名'] === selectedTeamName);
        } else {
            // 存在しない場合（リーグ切り替え時など）はリセットして全件表示
            selectedTeamName = null;
            const select = document.getElementById('team-drilldown-select');
            if(select) select.value = '';
            document.getElementById('team-style-radar-container').style.display = 'none';
        }
    }

    const chartData = displayData.map(team => ({
        x: team.xScore,
        y: team.yScore,
        r: 10,
        label: team['チーム名'],
        shortLabel: team['省略名'],
        raw: team
    }));
    
    const ctx = document.getElementById('team-style-scatter-chart').getContext('2d');
    if (scatterChart) scatterChart.destroy();

    scatterChart = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                data: chartData,
                backgroundColor: (context) => {
                    const raw = context.raw?.raw; // エラー防止
                    if (!raw) return 'rgba(0,0,0,0)';
                    const val = raw.colorScore;
                    const ratio = Math.max(0, Math.min(1, (val - 30) / 40));
                    const r = Math.round(54 + (201 * ratio));
                    const g = Math.round(162 - (63 * ratio));
                    const b = Math.round(235 - (103 * ratio));
                    return `rgba(${r}, ${g}, ${b}, 0.8)`;
                },
                borderColor: '#fff',
                borderWidth: 1.5,
                hoverBackgroundColor: '#ffd700',
                hoverBorderColor: '#fff',
                hoverRadius: 11
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 10 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(35, 41, 71, 0.95)',
                    titleColor: '#baf7fa',
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const d = context.raw;
                            const crossVal = d.raw.colorScore;
                            let styleText = "バランス型";
                            if (crossVal >= 55) styleText = "サイド攻撃主体";
                            if (crossVal <= 45) styleText = "中央突破主体";

                            return [
                                `${d.label}`,
                                `攻撃力スコア: ${d.x.toFixed(1)}`,
                                `守備力スコア: ${d.y.toFixed(1)}`,
                                `スタイル: ${styleText}`
                            ];
                        },
                        afterBody: function() {
                            return "※数値は偏差値による総合評価です";
                        }
                    }
                },
                datalabels: {
                    color: '#232947',
                    align: 'top',
                    offset: 2,
                    font: { weight: 'bold', size: 10 },
                    formatter: (value, context) => context.dataset.data[context.dataIndex].shortLabel,
                    textStrokeColor: 'white',
                    textStrokeWidth: 2
                },
                annotation: {
                    annotations: {
                        quadrant1: { 
                            type: 'box', xMin: 50, xMax: chartMaxX, yMin: 50, yMax: chartMaxY,
                            backgroundColor: 'rgba(169, 209, 142, 0.15)', borderWidth: 0
                        },
                        quadrant2: { 
                            type: 'box', xMin: chartMinX, xMax: 50, yMin: 50, yMax: chartMaxY,
                            backgroundColor: 'rgba(255, 230, 153, 0.15)', borderWidth: 0
                        },
                        quadrant3: { 
                            type: 'box', xMin: chartMinX, xMax: 50, yMin: chartMinY, yMax: 50,
                            backgroundColor: 'rgba(230, 230, 230, 0.2)', borderWidth: 0
                        },
                        quadrant4: { 
                            type: 'box', xMin: 50, xMax: chartMaxX, yMin: chartMinY, yMax: 50,
                            backgroundColor: 'rgba(244, 177, 131, 0.15)', borderWidth: 0
                        },
                        lineX: {
                            type: 'line', xMin: 50, xMax: 50, yMin: chartMinY, yMax: chartMaxY,
                            borderColor: 'rgba(100, 100, 100, 0.4)', borderWidth: 2, borderDash: [4, 4]
                        },
                        lineY: {
                            type: 'line', yMin: 50, yMax: 50, xMin: chartMinX, xMax: chartMaxX,
                            borderColor: 'rgba(100, 100, 100, 0.4)', borderWidth: 2, borderDash: [4, 4]
                        },
                        labelQ1: {
                            type: 'label', content: ['攻守圧倒', '王者'],
                            xValue: (50 + chartMaxX) / 2, yValue: (50 + chartMaxY) / 2,
                            color: 'rgba(100, 140, 80, 0.5)', font: { size: 16, weight: 'bold' }
                        },
                        labelQ2: {
                            type: 'label', content: ['堅守速攻', '現実的'],
                            xValue: (chartMinX + 50) / 2, yValue: (50 + chartMaxY) / 2,
                            color: 'rgba(180, 160, 50, 0.5)', font: { size: 16, weight: 'bold' }
                        },
                        labelQ3: {
                            type: 'label', content: ['不調・我慢'],
                            xValue: (chartMinX + 50) / 2, yValue: (chartMinY + 50) / 2,
                            color: 'rgba(150, 150, 150, 0.5)', font: { size: 16, weight: 'bold' }
                        },
                        labelQ4: {
                            type: 'label', content: ['攻撃偏重', '打ち合い'],
                            xValue: (50 + chartMaxX) / 2, yValue: (chartMinY + 50) / 2,
                            color: 'rgba(180, 100, 60, 0.5)', font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            },
            scales: {
                x: { 
                    min: chartMinX, max: chartMaxX,
                    title: { display: true, text: '攻撃力 (得点力重視) →', font: { size: 12, weight: 'bold' }, color: '#666' },
                    grid: { display: false }
                },
                y: { 
                    min: chartMinY, max: chartMaxY,
                    reverse: false, 
                    title: { display: true, text: '守備力 (失点少重視) ↑', font: { size: 12, weight: 'bold' }, color: '#666' },
                    grid: { display: false }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const clickedIndex = elements[0].index;
                    const selectedTeam = chartData[clickedIndex].raw; 
                    renderRadarChart(selectedTeam, data);
                    
                    selectedTeamName = selectedTeam['チーム名'];
                    const select = document.getElementById('team-drilldown-select');
                    if(select) select.value = selectedTeamName;

                    renderScatterChart(); 
                    // クリック時もレーダーチャートへスクロール
                    document.getElementById('team-style-radar-container').style.display = 'block';
                    document.getElementById('team-style-radar-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });
}

function renderRadarChart(selectedTeam, allTeamData) {
    const radarContainer = document.getElementById('team-style-radar-container');
    const title = document.getElementById('radar-chart-title');
    title.textContent = `${selectedTeam.チーム名} の詳細偏差値`;
    radarContainer.style.display = 'block';

    const dev = selectedTeam.deviations;
    const reverseConceded = 50 + (50 - dev.conceded);

    const teamData = [
        dev.shoot,      
        dev.goal,       
        dev.cross,      
        reverseConceded,
        dev.foul,       
        dev.card        
    ];

    const radarLabels = [
        `攻撃頻度\n(シュート)`, `決定力\n(得点)`, `サイド攻撃\n(クロス)`,
        `守備堅固\n(失点少)`, `激しさ\n(ファウル)`, `警告数`
    ];

    const ctx = document.getElementById('team-style-radar-chart').getContext('2d');
    if (radarChart) radarChart.destroy();
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: radarLabels,
            datasets: [{
                label: selectedTeam.チーム名,
                data: teamData,
                backgroundColor: 'rgba(39, 174, 231, 0.4)',
                borderColor: '#299ad3',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#299ad3',
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 10 },
            scales: {
                r: {
                    min: 20, max: 80,
                    ticks: { display: false, stepSize: 10 },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { font: { size: 12, weight: 'bold' }, color: '#333' }
                }
            },
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });
}

function renderTable() {
    const container = document.getElementById('team-style-table-container');
    if (!container || !mergedData || !mergedData[currentLeague]) {
        container.innerHTML = ''; return;
    };
    const data = mergedData[currentLeague];
    const headers = { 
        'チーム名': 'クラブ', 'avgShoot': 'シュート', 'avgGoal': '得点', 'avgConceded': '失点',
        'avgCross': 'クロス', 'avgFoul': 'ファウル', 'avgCard': '警告' 
    };
    const sortedData = [...data].sort((a,b) => b.xScore - a.xScore);
    
    const tableHTML = `
        <h3 style="text-align: center; color: #baf7fa; font-size: 1.3em; margin-bottom: 10px;">リーグデータ一覧 (1試合平均)</h3>
        <div class="table-scroll-wrapper" style="overflow-x: auto;">
            <table class="rankings-table" style="background-color: #293352; color: #eaf7fc; min-width: 600px; width: 100%;">
                <thead>
                    <tr style="background: linear-gradient(90deg, #27aee7, #299ad3); color: #fff;">
                        ${Object.values(headers).map(label => `<th style="padding:10px; white-space:nowrap;">${label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${sortedData.map((row, index) => `
                        <tr style="background-color: ${index % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent'}; border-bottom: 1px solid #4a5a7f;">
                            ${Object.keys(headers).map(key => `<td style="padding:10px; text-align:center;">${row[key]}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    container.innerHTML = tableHTML;
}

async function updatePage() {
    await processData();
    
    // ★★★ 修正点: リーグ切り替え時は必ず選択状態をリセット ★★★
    selectedTeamName = null;
    const select = document.getElementById('team-drilldown-select');
    if(select) select.value = '';
    
    renderTeamSelector(); // ドロップダウン再生成
    renderScatterChart();
    renderTable();
    document.getElementById('team-style-radar-container').style.display = 'none';
}

export default function initTeamStylePage(container) {
    if (!container.dataset.initialized) {
        container.querySelectorAll('#team-style-controls .rank-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentLeague = btn.dataset.league;
                container.querySelectorAll('#team-style-controls .rank-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updatePage();
            });
        });
        container.dataset.initialized = true;
    }
    updatePage();
}