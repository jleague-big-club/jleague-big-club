// js/pages/metrics.js

import { getClubData } from '../dataManager.js';
import { loadScript } from '../uiHelpers.js';

let metricChart;
const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js';

async function showMetricChart(key) {
    try {
        await loadScript(CHART_JS_URL);

        // ★★★【ここから修正】JFLを除外する ★★★
        const allClubData = getClubData();
        const jLeagueClubs = allClubData.filter(club => club.p !== 'JFL');
        
        const chartData = jLeagueClubs.map(club => club[key]);
        const labels = jLeagueClubs.map(club => club.name);
        // ★★★【ここまで修正】★★★

        if (metricChart) {
            metricChart.destroy();
        }
        const ctx = document.getElementById("metricChart").getContext("2d");
        metricChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: {
                        revenue: "売上高（億円）",
                        audience: "平均観客動員（人数）",
                        titles: "タイトル数"
                    }[key],
                    data: chartData,
                    backgroundColor: labels.map((_, i) => {
                        // ★★★ jLeagueClubs を参照するように修正 ★★★
                        let sum = jLeagueClubs[i].sum;
                        if (sum >= 30) return "#e94444bb";
                        else if (sum >= 20) return "#22bbf0cc";
                        else if (sum >= 5) return "#bbbbbbc8";
                        else return "#232947bb";
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: "#111" }
                    },
                    y: {
                        ticks: {
                            autoSkip: false,
                            color: "#111"
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#111' }
                    },
                    title: { display: false }
                }
            }
        });
    } catch (error) {
        console.error('Chart.jsの読み込みまたはグラフの描画に失敗しました', error);
        // ... (エラー処理は変更なし) ...
    }
}

export default function initMetricsPage() {
    const clubData = getClubData();
    if (clubData.length > 0) {
        showMetricChart(document.getElementById('metric-select').value);

        const metricSelect = document.getElementById('metric-select');
        if (!metricSelect.dataset.initialized) {
            metricSelect.addEventListener('change', (e) => showMetricChart(e.target.value));
            metricSelect.dataset.initialized = 'true';
        }
    }
}