import { getClubData, getHistoricalData } from '../dataManager.js';
import { clubAbbreviations } from '../config.js'; // ★追加: 省略名辞書の読み込み

export async function render(content) {
    const [clubData, historyData] = await Promise.all([
        getClubData(),
        getHistoricalData()
    ]);

    // 前年比（成長スコア）の計算
    const growthData = clubData.map(club => {
        const current = club.sum;
        const prev = club.sum_prev || 0;
        const diff = current - prev;
        return {
            name: club.name,
            current,
            prev,
            diff,
            color: club.color
        };
    }).filter(d => d.prev > 0);

    growthData.sort((a, b) => b.diff - a.diff);
    const topGrowth = growthData.slice(0, 10);

    const styleOverride = `
        <style>
            .trends-page canvas {
                background-color: transparent !important;
            }
            .trends-chart-wrapper {
                max-width: 1000px;
                margin: 0 auto 40px;
                padding: 20px;
                background-color: #232947;
                border-radius: 16px;
                border: 1px solid #4a5a7f;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            .trends-chart-wrapper h3 {
                color: #baf7fa;
                margin-top: 0;
                border-bottom: 1px solid #4a5a7f;
                padding-bottom: 15px;
                margin-bottom: 20px;
                font-size: 1.3rem;
            }
            .trends-chart-wrapper p {
                color: #abc;
                font-size: 0.95rem;
                margin-bottom: 20px;
            }
            .trends-canvas-container {
                position: relative; 
                width: 100%;
                /* デフォルト高さ */
                height: 450px; 
            }
        </style>
    `;

    content.innerHTML = `
        ${styleOverride}
        <div class="trends-page fade-in">
                過去の指数推移や、最新の分析データをグラフで可視化します。<br>
                成長率や売上高との相関から、クラブのポテンシャルを探ります。※2025年シーズンまでのデータ
            </p>

            <!-- 1. 推移グラフ -->
            <div class="trends-chart-wrapper">
                <h3>📉 指数推移（前年比）</h3>
                <p>主要クラブのビッグクラブ指数の変遷です。</p>
                <div class="trends-canvas-container" style="height: 450px;">
                    <canvas id="trendLineChart"></canvas>
                </div>
            </div>

            <!-- 2. 成長率ランキング -->
            <div class="trends-chart-wrapper">
                <h3>📈 急成長クラブ Top 10 (前年比)</h3>
                <p>前年からBC指数を大きく伸ばしたクラブのランキングです。</p>
                <!-- ★★★ 修正箇所：高さを 550px -> 650px に拡張 ★★★ -->
                <div class="trends-canvas-container" style="height: 500px;">
                    <canvas id="growthChart"></canvas>
                </div>
            </div>

            <!-- 3. 相関図 -->
            <div class="trends-chart-wrapper">
                <h3>📊 売上規模とBC指数の相関</h3>
                <p>縦軸：BC指数、横軸：売上高(億円)。<br>右上に位置するほど、売上が高く総合力も高い「理想的な経営」ができているクラブです。</p>
                <div class="trends-canvas-container" style="height: 500px;">
                    <canvas id="correlationChart"></canvas>
                </div>
            </div>
            
             <div class="analysis-note" style="background:#2a3758; padding:20px; border-radius:12px; border-left:5px solid #299ad3; max-width: 1000px; margin: 0 auto;">
                <h4 style="margin-top:0; color:#fff;">💡 分析サマリー</h4>
                <ul style="color:#eaf7fc; line-height:1.6; padding-left:20px;">
                    <li>2025シーズンで最も指数を伸ばしたのは <strong>${topGrowth[0]?.name || '---'}</strong> です (+${topGrowth[0]?.diff.toFixed(1) || 0}ポイント)。</li>
                    <li>V・ファーレン長崎は新スタジアム効果や親会社のジャパネットホールディングスの投資により飛躍が期待されます</li>
                    <li>浦和レッズは売上・総合指数ともにJリーグを牽引する存在ですが、前年より指数を下げています</li>
                    <li>売上高と指数は強い相関関係にありますが、いくつかのクラブは限られた予算で高い指数（人気・実力）を維持しています。</li>
                </ul>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (historyData && historyData.length > 0) {
            renderTrendChart(historyData, clubData);
        } else {
            const chartEl = document.getElementById('trendLineChart');
            if (chartEl) chartEl.parentNode.innerHTML = '<p class="no-data" style="color:#abc; text-align:center; padding:20px;">推移データが十分にありません。</p>';
        }
        renderGrowthChart(topGrowth);
        renderCorrelationChart(clubData);
    }, 0);
}

function renderTrendChart(historyData, clubData) {
    const ctx = document.getElementById('trendLineChart').getContext('2d');
    const clubHistory = {};
    historyData.forEach(d => {
        if (!clubHistory[d.club]) clubHistory[d.club] = [];
        clubHistory[d.club].push(d);
    });

    const years = [...new Set(historyData.map(d => d.year))].sort((a, b) => a - b);
    const topClubs = clubData.sort((a, b) => b.sum - a.sum).slice(0, 7).map(c => c.name);

    const datasets = topClubs.map(clubName => {
        const clubInfo = clubData.find(c => c.name === clubName);
        const color = clubInfo ? clubInfo.color : '#999';
        if (!clubHistory[clubName]) return null;
        const data = years.map(y => {
            const entry = clubHistory[clubName].find(h => h.year === y);
            return entry ? entry.score : null;
        });
        return {
            label: clubName,
            data: data,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 3,
            tension: 0.3,
            pointBackgroundColor: '#fff',
            pointBorderColor: color,
            pointRadius: 5,
            pointHoverRadius: 8
        };
    }).filter(ds => ds !== null);

    new Chart(ctx, {
        type: 'line',
        data: { labels: years, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { right: 20, bottom: 20, left: 10, top: 10 } },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#eaf7fc',
                        font: { family: "'Segoe UI', 'Meiryo', sans-serif", size: 12 },
                        usePointStyle: true, padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 40, 65, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#4a5a7f',
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'BC指数', color: '#8899bb' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#abc', font: { family: "'Segoe UI', sans-serif" } }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#abc', font: { family: "'Segoe UI', sans-serif" } }
                }
            }
        }
    });
}

function renderGrowthChart(data) {
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;

    // ★修正箇所: スマホの場合は config.js の省略名を使用するロジックを追加
    const isMobile = window.innerWidth <= 768;
    const labels = data.map(d => {
        if (isMobile && clubAbbreviations[d.name]) {
            return clubAbbreviations[d.name];
        }
        return d.name;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // ★修正箇所: 省略対応したラベルを使用
            datasets: [{
                label: 'スコア上昇ポイント',
                data: data.map(d => d.diff),
                backgroundColor: data.map(d => d.color),
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 20, bottom: 20, left: 20, right: 40 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 40, 65, 0.95)',
                    titleColor: '#fff',
                    titleFont: { size: 14, family: "'Segoe UI', 'Meiryo', sans-serif" },
                    bodyFont: { size: 14, family: "'Segoe UI', 'Meiryo', sans-serif" },
                    padding: 12,
                    callbacks: {
                        // ★修正箇所: ツールチップでは常に正式名称を表示
                        title: (tooltipItems) => data[tooltipItems[0].dataIndex].name,
                        label: (ctx) => ` +${Number(ctx.raw).toFixed(2)} ポイント`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#abc', font: { size: 12, family: "'Segoe UI', sans-serif" } },
                    title: { display: true, text: 'ポイント上昇量', color: '#8899bb', font: { size: 12 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { 
                        color: '#eaf7fc', 
                        font: { 
                            size: 14, 
                            family: "'Segoe UI', 'Helvetica Neue', 'Hiragino Kaku Gothic ProN', 'Meiryo', 'Arial', sans-serif"
                        }, 
                        padding: 15, 
                        autoSkip: false
                    }
                }
            }
        }
    });
}

function renderCorrelationChart(data) {
    const ctx = document.getElementById('correlationChart')?.getContext('2d');
    if (!ctx) return;

    const validData = data.filter(c => c.revenue > 0 && c.sum > 0);

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'クラブ分布',
                data: validData.map(c => ({ x: c.revenue, y: c.sum })),
                backgroundColor: validData.map(c => c.color),
                borderColor: '#fff',
                borderWidth: 1,
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 10, right: 20, bottom: 20, left: 10 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 40, 65, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#eaf7fc',
                    borderColor: '#4a5a7f',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const club = validData[index];
                            return `${club.name} (売上:${club.revenue}億 / 指数:${club.sum})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: '売上高 (億円)', color: '#8899bb', font: {size:12, weight:'bold'} },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#abc', font: { family: "'Segoe UI', sans-serif" } }
                },
                y: {
                    title: { display: true, text: 'BC指数 (総合スコア)', color: '#8899bb', font: {size:12, weight:'bold'} },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#abc', font: { family: "'Segoe UI', sans-serif" } }
                }
            }
        }
    });
}

export default async function (container) {
    await render(container);
}