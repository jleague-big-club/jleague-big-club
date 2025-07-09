// === modules/metrics.js (確定版) ===

let metricChart;

function showMetricChart(key) {
    if (!window.clubData || window.clubData.length === 0) {
        console.error("クラブ指標の表示に必要なデータがありません。");
        return;
    }
    const chartData = window.clubData.map(club => club[key]);
    const labels = window.clubData.map(club => club.name);
    
    const canvas = document.getElementById("metricChart");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");

    if (metricChart) {
        metricChart.destroy();
    }
    
    metricChart = new Chart(ctx, { type: "bar", data: { labels: labels, datasets: [{ label: { revenue: "売上高（億円）", audience: "平均観客動員（人数）", titles: "タイトル数" }[key], data: chartData, backgroundColor: labels.map((_, i) => { let sum = window.clubData[i].sum; if (sum >= 30) return "#e94444bb"; else if (sum >= 20) return "#22bbf0cc"; else if (sum >= 5) return "#bbbbbbc8"; else return "#232947bb"; }), borderWidth: 1 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true, ticks: { color: "#111" } }, y: { ticks: { autoSkip: false, color: "#111" } } }, plugins: { legend: { labels: { color: '#111' } }, title: { display: false } } } });
}

export function initialize() {
    // HTMLの onchange="showMetricChart(...)" から呼び出されるので、関数をグローバルに登録
    window.showMetricChart = showMetricChart;

    // 初回表示
    const metricSelect = document.getElementById('metric-select');
    if (metricSelect) {
        showMetricChart(metricSelect.value);
    }
}