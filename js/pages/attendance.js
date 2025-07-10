import { getAttendanceData } from '../dataManager.js';
import { clubAbbreviations } from '../config.js';

let attendanceChart = null;

function renderAttendanceTable(dataToRender) {
    document.getElementById('attendance-chart-wrap').style.display = 'none';
    const outputContainer = document.getElementById('attendance-output-container');
    outputContainer.style.display = 'block';

    const tableData = dataToRender || [];
    const headers = ['順位', 'リーグ', 'クラブ', '平均観客数', '年間最高観客数', '年間最低観客数', 'ゲーム数'];
    const leagueColorMap = {
        'J1': '#e94444', 'J2': '#29b6e6', 'J3': '#6cbf6b', 'JFL': '#f2a136', 'default': '#ffffff'
    };

    let dateHtml = '';
    getAttendanceData().then(attendanceData => {
        if (attendanceData.lastModified) {
            const updatedDate = new Date(attendanceData.lastModified);
            const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            dateHtml = `<div style="text-align: right; font-size: 0.85em; color: #aabbcc; margin-bottom: 8px;"> 更新日時: ${formattedDate} </div>`;
        }

        let tableHtml = `<table style="background: #f9fcff; color: #21304c;">
                        <thead><tr>${headers.map(h => `<th style="background: linear-gradient(90deg, #27aee7 65%, #b0e7fa 100%); color: #fff;">${h}</th>`).join('')}</tr></thead>
                        <tbody>`;

        tableData.sort((a, b) => b.平均観客数 - a.平均観客数).forEach((row, index) => {
            const leagueColor = leagueColorMap[row.リーグ] || leagueColorMap['default'];
            const isMobile = window.innerWidth <= 768;
            const clubDisplayName = isMobile ? (clubAbbreviations[row.クラブ] || row.クラブ) : row.クラブ;
            const avgAttendance = isMobile ? Math.round(row.平均観客数) : row.平均観客数;
            const maxAttendance = isMobile ? Math.round(row.年間最高観客数) : row.年間最高観客数;
            const minAttendance = isMobile ? Math.round(row.年間最低観客数) : row.年間最低観客数;
            tableHtml += `
                <tr style="cursor: pointer; background: ${index % 2 === 0 ? '#f2f6fa' : '#ffffff'};" onclick="renderAttendanceChart('${row.クラブ}')" onmouseover="this.style.backgroundColor='#e0f7ff';" onmouseout="this.style.backgroundColor='${index % 2 === 0 ? '#f2f6fa' : '#ffffff'}';">
                    <td>${index + 1}</td>
                    <td style="background-color: ${leagueColor}; color: #fff; font-weight: bold;">${row.リーグ}</td>
                    <td>${clubDisplayName}</td>
                    <td>${avgAttendance.toLocaleString()}</td>
                    <td>${maxAttendance.toLocaleString()}</td>
                    <td>${minAttendance.toLocaleString()}</td>
                    <td>${row.ゲーム数}</td>
                </tr>`;
        });
        tableHtml += `</tbody></table>`;
        outputContainer.innerHTML = dateHtml + tableHtml;
    });
}

function renderAttendanceChart(clubName) {
    document.getElementById('attendance-output-container').style.display = 'none';
    const chartWrap = document.getElementById('attendance-chart-wrap');
    const canvas = document.getElementById('attendanceChart');
    chartWrap.style.display = 'block';

    getAttendanceData().then(attendanceData => {
        const clubHistory = attendanceData.filter(d => d.クラブ === clubName).sort((a, b) => a.年 - b.年);
        const labels = clubHistory.map(d => d.年);
        const colorMap = { 'J1': '#e94444', 'J2': '#29b6e6', 'J3': '#6cbf6b', 'JFL': '#f2a136', 'default': '#aaaaaa' };

        if (attendanceChart) {
            attendanceChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        attendanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${clubName} の平均観客数推移`,
                    segment: {
                        borderColor: ctx => colorMap[ctx.p1.raw.league] || colorMap['default'],
                    },
                    data: clubHistory.map(d => ({ x: d.年, y: d.平均観客数, league: d.リーグ })),
                    spanGaps: true,
                    tension: 0.1,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: (ctx) => colorMap[clubHistory[ctx.dataIndex]?.リーグ] || colorMap['default'],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHitRadius: 20,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', title: { display: true, text: '年', color: '#333' }, ticks: { stepSize: 1, callback: function (value) { if (Number.isInteger(value)) return value; } } },
                    y: { beginAtZero: true, title: { display: true, text: '平均観客数（人）', color: '#333' } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => ` ${context.raw.league}: ${context.raw.y.toLocaleString()} 人`, title: (context) => `${context[0].raw.x}年` } }
                }
            }
        });

        const footerContainer = document.getElementById('attendance-chart-footer');
        footerContainer.innerHTML = '';
        const bottomFlexContainer = document.createElement('div');
        bottomFlexContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
        const customLegend = document.createElement('div');
        customLegend.style.cssText = 'display: flex; gap: 15px;';
        const usedLeagues = [...new Set(clubHistory.map(d => d.リーグ))];
        usedLeagues.forEach(league => {
            const color = colorMap[league] || colorMap['default'];
            const legendItem = document.createElement('div');
            legendItem.style.cssText = 'display: flex; align-items: center; font-size: 0.9em; color: #333;';
            legendItem.innerHTML = `<span style="display: inline-block; width: 20px; height: 4px; background-color: ${color}; margin-right: 5px;"></span> ${league}`;
            customLegend.appendChild(legendItem);
        });
        const backBtn = document.createElement('button');
        backBtn.innerHTML = '‹ 表に戻る';
        backBtn.style.cssText = 'padding: 5px 12px; font-size: 0.85em; font-weight: bold; cursor: pointer; border: 1px solid #ccc; background: #f0f0f0; border-radius: 5px;';
        backBtn.onclick = () => {
            document.getElementById('attendance-chart-wrap').style.display = 'none';
            document.getElementById('attendance-output-container').style.display = 'block';
        };
        bottomFlexContainer.appendChild(customLegend);
        bottomFlexContainer.appendChild(backBtn);
        footerContainer.appendChild(bottomFlexContainer);
    });
}
window.renderAttendanceChart = renderAttendanceChart;


function updateAttendanceFilters() {
    getAttendanceData().then(attendanceData => {
        const selectedYear = parseInt(document.getElementById('attendance-year-select').value);
        const activeLeagueBtn = document.querySelector('#attendance-league-btns .rank-tab-btn.active');
        const selectedLeague = activeLeagueBtn ? activeLeagueBtn.dataset.league : 'all';
        const clubSelect = document.getElementById('attendance-club-select');

        const clubsForDropdown = attendanceData.filter(d => d.年 === selectedYear && (selectedLeague === 'all' || d.リーグ === selectedLeague));
        const clubNames = [...new Set(clubsForDropdown.map(d => d.クラブ))].sort((a, b) => a.localeCompare(b, 'ja'));
        let optionsHtml = '<option value="all">クラブを選択...</option>';
        clubNames.forEach(name => {
            optionsHtml += `<option value="${name}">${name}</option>`;
        });
        clubSelect.innerHTML = optionsHtml;

        const dataForTable = attendanceData.filter(d => d.年 === selectedYear && (selectedLeague === 'all' || d.リーグ === selectedLeague));
        renderAttendanceTable(dataForTable);
    });
}


export default function initAttendancePage() {
    const yearSelect = document.getElementById('attendance-year-select');
    if (yearSelect && !yearSelect.dataset.initialized) {
        getAttendanceData().then(attendanceData => {
            const years = [...new Set(attendanceData.map(d => d.年))].sort((a, b) => b - a);
            yearSelect.innerHTML = '';
            years.forEach(year => {
                yearSelect.innerHTML += `<option value="${year}">${year}年</option>`;
            });
            yearSelect.addEventListener('change', updateAttendanceFilters);

            const leagueBtnContainer = document.getElementById('attendance-league-btns');
            let leagueBtnsHtml = `<button class="rank-tab-btn active" data-league="all">全て</button>`;
            const leagues = [...new Set(attendanceData.map(d => d.リーグ))].filter(Boolean).sort();
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

            document.getElementById('attendance-club-select').addEventListener('change', (e) => {
                if (e.target.value && e.target.value !== 'all') {
                    renderAttendanceChart(e.target.value);
                } else {
                    updateAttendanceFilters();
                }
            });

            updateAttendanceFilters();
            yearSelect.dataset.initialized = 'true';
        });
    }
}