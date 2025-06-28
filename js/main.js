document.addEventListener("DOMContentLoaded", () => {
  fetch("data/data.csv")
    .then(response => response.text())
    .then(text => {
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",");
      const dataRows = lines.slice(1).map(line => line.split(","));

      // 表の作成
      const table = document.createElement("table");
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
      });
      const tbody = table.createTBody();
      dataRows.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach(cell => {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
      });
      document.getElementById("club-table").appendChild(table);

      // クラブデータをオブジェクトに変換
      const clubs = dataRows.map(row => ({
        name: row[0],
        revenue: parseFloat(row[1]),
        audience: parseInt(row[2]),
        titles: parseInt(row[5])
      }));

      // グラフ描画
      drawHorizontalBar("revenueChart", "売上高（億円）", clubs, "revenue");
      drawHorizontalBar("audienceChart", "平均観客動員数", clubs, "audience");
      drawHorizontalBar("titleChart", "タイトル計", clubs, "titles");
    })
    .catch(err => {
      console.error("CSV読み込みエラー:", err);
    });

  function drawHorizontalBar(canvasId, label, clubData, key) {
    const sorted = [...clubData].sort((a, b) => b[key] - a[key]);
    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map(c => c.name),
        datasets: [{
          label,
          data: sorted.map(c => c[key]),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { autoSkip: false } }
        },
        plugins: {
          legend: { labels: { color: '#f0f0f0' } }
        }
      }
    });
  }
});
function showPage(id) {
  document.querySelectorAll('.page-section').forEach(div => {
    div.classList.remove('visible');
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('visible');
  }
}
