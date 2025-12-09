import { getTeamStyleData, getRankingData } from '../dataManager.js';

let mergedData = null;
let scatterChart = null;
let radarChart = null;
let currentLeague = 'J1';

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

// 全角英数記号を半角に変換するヘルパー関数
function toHalfWidth(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[Ａ-Ｚａ-ｚ０-９．・]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, " ");
}

async function processData() {
    if (mergedData) return mergedData;
    
    // データ取得
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
                if (!shortName) {
                    shortName = originalName.replace(/FC|ＦＣ|SC|ＳＣ/g, '').trim();
                }

                dataByLeague[league].push({
                    'チーム名': originalName,
                    '省略名': shortName,
                    'リーグ': league,
                    'シュート': parseFloat((parseInt(teamStyle.シュート総数, 10) / matches).toFixed(2)),
                    'ファウル': parseFloat((parseInt(teamStyle.ファウル総数, 10) / matches).toFixed(2)),
                    '警告': parseFloat((parseInt(teamStyle.警告数, 10) / matches).toFixed(2)),
                    'クロス': parseFloat((parseInt(teamStyle.クロス総数, 10) / matches).toFixed(2)),
                    '得点': parseFloat((parseInt(teamRankData.得点, 10) / matches).toFixed(2)),
                    '失点': parseFloat((parseInt(teamRankData.失点, 10) / matches).toFixed(2)),
                });
            }
        }
    }
    mergedData = dataByLeague;
    return mergedData;
}

function renderScatterChart() {
    const data = mergedData[currentLeague];
    if (!data || data.length === 0) return;
    
    // 軸の定義
    const xAxisKey = 'シュート';
    const yAxisKey = '失点';

    const xValues = data.map(d => d[xAxisKey]);
    const yValues = data.map(d => d[yAxisKey]);
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // パディング計算
    const xPadding = (xMax - xMin) * 0.15;
    const yPadding = (yMax - yMin) * 0.15;
    
    const chartMinX = Math.floor((xMin - xPadding) * 10) / 10;
    const chartMaxX = Math.ceil((xMax + xPadding) * 10) / 10;
    const chartMinY = Math.floor((yMin - yPadding) * 10) / 10;
    const chartMaxY = Math.ceil((yMax + yPadding) * 10) / 10;

    const avgX = xValues.reduce((a, b) => a + b, 0) / xValues.length;
    const avgY = yValues.reduce((a, b) => a + b, 0) / yValues.length;

    const chartData = data.map(team => ({
        x: team[xAxisKey],
        y: team[yAxisKey],
        r: 6 + (team['得点'] * 4),
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
                backgroundColor: 'rgba(41, 154, 211, 0.7)',
                borderColor: '#fff',
                borderWidth: 1.5,
                hoverBackgroundColor: 'rgba(255, 215, 0, 0.9)',
                hoverBorderColor: '#fff',
                hoverRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 10 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(35, 41, 71, 0.9)',
                    titleColor: '#baf7fa',
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const d = context.raw;
                            return [
                                `${d.label}`,
                                `平均シュート: ${d.x}本`,
                                `平均失点: ${d.y}点`,
                                `平均得点: ${d.raw['得点']}点`
                            ];
                        }
                    }
                },
                datalabels: {
                    color: '#232947',
                    align: 'top',
                    offset: 2,
                    font: { weight: 'bold', size: 11 },
                    formatter: (value, context) => context.dataset.data[context.dataIndex].shortLabel,
                    textStrokeColor: 'white',
                    textStrokeWidth: 3
                },
                annotation: {
                    annotations: {
                        quadrant1: { 
                            type: 'box', xMin: avgX, xMax: chartMaxX, yMin: chartMinY, yMax: avgY,
                            backgroundColor: 'rgba(169, 209, 142, 0.15)', borderWidth: 0
                        },
                        quadrant2: { 
                            type: 'box', xMin: chartMinX, xMax: avgX, yMin: chartMinY, yMax: avgY,
                            backgroundColor: 'rgba(255, 230, 153, 0.15)', borderWidth: 0
                        },
                        quadrant3: { 
                            type: 'box', xMin: chartMinX, xMax: avgX, yMin: avgY, yMax: chartMaxY,
                            backgroundColor: 'rgba(230, 230, 230, 0.2)', borderWidth: 0
                        },
                        quadrant4: { 
                            type: 'box', xMin: avgX, xMax: chartMaxX, yMin: avgY, yMax: chartMaxY,
                            backgroundColor: 'rgba(244, 177, 131, 0.15)', borderWidth: 0
                        },
                        lineX: {
                            type: 'line', xMin: avgX, xMax: avgX, yMin: chartMinY, yMax: chartMaxY,
                            borderColor: 'rgba(100, 100, 100, 0.4)', borderWidth: 2, borderDash: [4, 4]
                        },
                        lineY: {
                            type: 'line', yMin: avgY, yMax: avgY, xMin: chartMinX, xMax: chartMaxX,
                            borderColor: 'rgba(100, 100, 100, 0.4)', borderWidth: 2, borderDash: [4, 4]
                        },
                        labelQ1: {
                            type: 'label', content: ['攻守兼備', '王道スタイル'],
                            xValue: (avgX + chartMaxX) / 2, yValue: (avgY + chartMinY) / 2,
                            color: 'rgba(100, 140, 80, 0.5)', font: { size: 16, weight: 'bold' }
                        },
                        labelQ2: {
                            type: 'label', content: ['堅守速攻', '現実的'],
                            xValue: (chartMinX + avgX) / 2, yValue: (avgY + chartMinY) / 2,
                            color: 'rgba(180, 160, 50, 0.5)', font: { size: 16, weight: 'bold' }
                        },
                        labelQ3: {
                            type: 'label', content: ['守勢・苦戦', '耐える時間'],
                            xValue: (chartMinX + avgX) / 2, yValue: (chartMaxY + avgY) / 2,
                            color: 'rgba(150, 150, 150, 0.5)', font: { size: 16, weight: 'bold' }
                        },
                        labelQ4: {
                            type: 'label', content: ['打ち合い上等', '攻撃特化'],
                            xValue: (avgX + chartMaxX) / 2, yValue: (chartMaxY + avgY) / 2,
                            color: 'rgba(180, 100, 60, 0.5)', font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            },
            scales: {
                x: { 
                    min: chartMinX, max: chartMaxX,
                    title: { display: true, text: '平均シュート数 (攻撃頻度) →', font: { size: 12, weight: 'bold' }, color: '#666' },
                    grid: { display: false }
                },
                y: { 
                    min: chartMinY, max: chartMaxY,
                    reverse: true, 
                    title: { display: true, text: '平均失点 (守備強度) ※上が失点少', font: { size: 12, weight: 'bold' }, color: '#666' },
                    grid: { display: false }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const clickedIndex = elements[0].index;
                    const selectedTeam = data[clickedIndex];
                    renderRadarChart(selectedTeam, data);
                    document.getElementById('team-style-radar-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });
}

function renderRadarChart(selectedTeam, allTeamData) {
    const radarContainer = document.getElementById('team-style-radar-container');
    const title = document.getElementById('radar-chart-title');
    title.textContent = `${selectedTeam.チーム名} の詳細スタッツ`;
    radarContainer.style.display = 'block';

    const metrics = ['シュート', 'クロス', '得点', '失点', 'ファウル', '警告'];
    const maxValues = {}, minValues = {};
    
    metrics.forEach(metric => {
        const values = allTeamData.map(d => d[metric]);
        maxValues[metric] = Math.max(...values);
        minValues[metric] = Math.min(...values);
    });

    // ▼▼▼ 修正ポイント: 最低保証点(30点)を設けてグラフが潰れるのを防ぐ ▼▼▼
    const normalize = (value, metric, invert = false) => {
        const max = maxValues[metric];
        const min = minValues[metric];
        if (max === min) return 50;
        
        // 0.0 ~ 1.0 の比率を計算
        let ratio = (value - min) / (max - min);
        if (invert) ratio = 1.0 - ratio;
        
        // 30 ~ 100 の範囲にマッピング (最低でも30点はあげる)
        return 30 + (ratio * 70);
    };

    const teamData = [
        normalize(selectedTeam['シュート'], 'シュート'),
        normalize(selectedTeam['得点'], '得点'),
        normalize(selectedTeam['クロス'], 'クロス'),
        normalize(selectedTeam['失点'], '失点', true),
        normalize(selectedTeam['ファウル'], 'ファウル', true),
        normalize(selectedTeam['警告'], '警告', true)
    ];

    const radarLabels = [
        `攻撃頻度\n(${selectedTeam['シュート']})`, 
        `得点力\n(${selectedTeam['得点']})`, 
        `サイド攻撃\n(${selectedTeam['クロス']})`, 
        `守備堅固さ\n(${selectedTeam['失点']})`, 
        `クリーンさ\n(${selectedTeam['ファウル']})`, 
        `規律\n(${selectedTeam['警告']})`
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
                    beginAtZero: true, 
                    max: 100, 
                    min: 0, // 中心を0に固定
                    ticks: { display: false, stepSize: 20 },
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
        'チーム名': 'クラブ', 'シュート': 'シュート', '得点': '得点', '失点': '失点',
        'クロス': 'クロス', 'ファウル': 'ファウル', '警告': '警告' 
    };
    const sortedData = [...data].sort((a,b) => b['シュート'] - a['シュート']);
    
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