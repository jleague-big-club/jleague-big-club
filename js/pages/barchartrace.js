import { getScheduleData } from '../dataManager.js';
import { clubAbbreviations } from '../config.js';

// === 初期設定 ===
const YEAR_TO_SHOW = 2025;
let currentLeague = 'J1';
let animationInterval;
let isPlaying = false;
let weeklyData = [];
let chart;
let maxPoints = 0;

// === 表記揺れ吸収ヘルパー ===
function getNormalizedKey(name) { if (!name) return ''; return name.replace(/[\s・．.]/g, '').replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).toUpperCase(); }
const teamNameMap = new Map();
for (const officialName of Object.keys(clubAbbreviations)) { teamNameMap.set(getNormalizedKey(officialName), officialName); }
function normalizeTeamNameToOfficial(name) { return teamNameMap.get(getNormalizedKey(name)) || name; }

// === データ処理ロジック ===
async function processData() {
    const csvData = await getScheduleData();
    const lines = csvData.trim().split('\n').slice(1);
    
    const allMatches = lines
        .map(line => {
            const parts = line.split(',').map(v => v.trim());
            if (parts[4]) parts[4] = normalizeTeamNameToOfficial(parts[4]);
            if (parts[7]) parts[7] = normalizeTeamNameToOfficial(parts[7]);
            return parts;
        })
        .filter(([year, league]) => 
            parseInt(year) === YEAR_TO_SHOW && 
            league === currentLeague 
        );

    const teams = new Set();
    allMatches.forEach(([, , , , home, , , away]) => {
        if(home) teams.add(home);
        if(away) teams.add(away);
    });

    const lastCompletedSection = Math.max(0, ...allMatches
        .filter(line => line[5].trim() !== '' && !isNaN(parseInt(line[5])))
        .map(line => parseInt(line[2].replace('第', '').replace('節', '')))
    );

    if (teams.size === 0 || lastCompletedSection === 0) {
        throw new Error(`指定された年(${YEAR_TO_SHOW})の${currentLeague}の試合結果データが見つかりませんでした。`);
    }

    for (let section = 1; section <= lastCompletedSection; section++) {
        const clubStats = {};
        teams.forEach(team => {
            clubStats[team] = { name: team, points: 0, gd: 0, gf: 0, ga: 0, win: 0, draw: 0, lose: 0, played: 0 };
        });

        const matchesUpToSection = allMatches.filter(line => {
            const s = parseInt(line[2].replace('第', '').replace('節', ''));
            const homeScore = line[5];
            return s <= section && homeScore.trim() !== '' && !isNaN(parseInt(homeScore));
        });

        matchesUpToSection.forEach(line => {
            const [, , , , home, homeScore, awayScore, away] = line;
            if (!clubStats[home] || !clubStats[away]) return;

            const hs = parseInt(homeScore);
            const as = parseInt(awayScore);

            if (isNaN(hs) || isNaN(as)) return;

            clubStats[home].gf += hs; clubStats[home].ga += as;
            clubStats[away].gf += as; clubStats[away].ga += hs;

            if (hs > as) {
                clubStats[home].points += 3; clubStats[home].win++; clubStats[away].lose++;
            } else if (hs < as) {
                clubStats[away].points += 3; clubStats[away].win++; clubStats[home].lose++;
            } else {
                clubStats[home].points += 1; clubStats[away].points += 1;
                clubStats[home].draw++; clubStats[away].draw++;
            }
        });
        
        teams.forEach(team => {
            clubStats[team].gd = clubStats[team].gf - clubStats[team].ga;
            clubStats[team].played = clubStats[team].win + clubStats[team].draw + clubStats[team].lose;
        });

        const sortedTeams = Object.values(clubStats)
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.gd !== a.gd) return b.gd - a.gd;
                if (b.gf !== a.gf) return b.gf - a.gf;
                return a.name.localeCompare(b.name, 'ja');
            });
        
        if (section > 1) {
            const previousRanks = new Map();
            weeklyData[section - 2].teams.forEach((team, index) => {
                previousRanks.set(team.name, index + 1);
            });
            sortedTeams.forEach((team, index) => {
                const previousRank = previousRanks.get(team.name);
                const currentRank = index + 1;
                if(previousRank){
                    if (currentRank < previousRank) team.rankChange = 'up';
                    else if (currentRank > previousRank) team.rankChange = 'down';
                    else team.rankChange = 'same';
                } else {
                    team.rankChange = 'same';
                }
            });
        } else {
            sortedTeams.forEach(team => { team.rankChange = 'same'; });
        }
        
        const currentMaxPoints = sortedTeams.length > 0 ? sortedTeams[0].points : 0;
        if (currentMaxPoints > maxPoints) maxPoints = currentMaxPoints;

        weeklyData.push({ section, teams: sortedTeams, sectionLabel: `第${section}節` });
    }
    
    document.getElementById('bcr-slider').max = lastCompletedSection;
    document.getElementById('bcr-total-section').textContent = `/ 第${lastCompletedSection}節`;
}

// === グラフ描画ロジック ===
function renderChart(sectionIndex) {
    if (!weeklyData || weeklyData.length === 0 || !weeklyData[sectionIndex]) return;
    const data = weeklyData[sectionIndex];
    const labels = [], tickColors = [];
    const upColor = '#e60012', downColor = '#007bff', sameColor = 'white';
    data.teams.forEach((t, index) => {
        const rank = index + 1;
        let symbol, color;
        switch (t.rankChange) {
            case 'up': symbol = '▲ '; color = upColor; break;
            case 'down': symbol = '▼ '; color = downColor; break;
            default: symbol = '- '; color = sameColor; break;
        }
        labels.push(`${rank} ${symbol}${clubAbbreviations[t.name] || t.name}`);
        tickColors.push(color);
    });
    const points = data.teams.map(t => t.points);
    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = points;
        chart.options.scales.y.ticks.color = tickColors;
        chart.options.scales.x.max = maxPoints > 0 ? maxPoints + 15 : 5;
        chart.update();
    } else {
        const ctx = document.getElementById('bcr-chart').getContext('2d');
        Chart.register(ChartDataLabels);
        chart = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [{ label: '勝点', data: points, backgroundColor: '#299ad3',
 }] },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                animation: { duration: 800, easing: 'linear' },
                plugins: {
                    legend: { display: false }, tooltip: { enabled: false },
                    datalabels: { anchor: 'end', align: 'right', formatter: (value) => value, color: 'white', font: { weight: 'bold', size: 12 } }
                },
                scales: {
                    x: { beginAtZero: true, max: maxPoints > 0 ? maxPoints + 15 : 5, ticks: { color: 'white' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    y: { afterFit: (axis) => { axis.width = 150; }, ticks: { color: tickColors, font: { size: 14, weight: 'bold' } }, grid: { display: false } }
                }
            }
        });
    }
    document.getElementById('bcr-current-section').textContent = data.sectionLabel;
    document.getElementById('bcr-slider').value = data.section;
document.getElementById('bcr-race-section-display').textContent = data.sectionLabel;
}

// === 操作パネルロジック ===
function setupControls() {
    const playPauseBtn = document.getElementById('bcr-play-pause-btn');
    const slider = document.getElementById('bcr-slider');
    const resetBtn = document.getElementById('bcr-reset-btn');
    const leagueButtons = document.querySelectorAll('.bcr-league-btn');
    const helpBtn = document.getElementById('bcr-help-btn');
    const helpModal = document.getElementById('bcr-help-modal');
    const closeBtn = helpModal.querySelector('.bcr-close-btn');

    playPauseBtn.addEventListener('click', () => { isPlaying ? pauseAnimation() : playAnimation(); });
    slider.addEventListener('input', (e) => {
        pauseAnimation();
        renderChart(parseInt(e.target.value) - 1);
    });
    resetBtn.addEventListener('click', () => {
        pauseAnimation();
        if (weeklyData.length > 0) { slider.value = 1; renderChart(0); }
    });
    leagueButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedLeague = button.dataset.league;
            if (selectedLeague === currentLeague) return;
            leagueButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            initialize(selectedLeague);
        });
    });

    helpBtn.addEventListener('click', () => { helpModal.style.display = "block"; });
    closeBtn.addEventListener('click', () => { helpModal.style.display = "none"; });
    window.addEventListener('click', (event) => {
        if (event.target == helpModal) {
            helpModal.style.display = "none";
        }
    });
}

function playAnimation() {
    if (isPlaying || weeklyData.length === 0) return;
    isPlaying = true;
    document.getElementById('bcr-play-pause-btn').textContent = '一時停止';
    let currentSection = parseInt(document.getElementById('bcr-slider').value);
    if (currentSection >= weeklyData.length) currentSection = 1;
    animationInterval = setInterval(() => {
        renderChart(currentSection - 1); 
        currentSection++;
        if (currentSection > weeklyData.length) pauseAnimation();
    }, 1200);
}
function pauseAnimation() {
    if (!isPlaying) return;
    isPlaying = false;
    document.getElementById('bcr-play-pause-btn').textContent = '再生';
    clearInterval(animationInterval);
}

// === 全体の初期化関数 ===
async function initialize(league) {
    pauseAnimation();
    if (chart) { chart.destroy(); chart = null; }
    weeklyData = []; maxPoints = 0; currentLeague = league;
    const chartWrapper = document.querySelector('.bcr-chart-wrapper');
    const slider = document.getElementById('bcr-slider');
    chartWrapper.innerHTML = '<canvas id="bcr-chart"></canvas><span id="bcr-race-section-display"></span>';
    slider.value = 1; slider.max = 1;
    document.getElementById('page-title-barchartrace').querySelector('h1').textContent = `${currentLeague} 2025 バーチャートレース`;
    document.getElementById('bcr-current-section').textContent = ``;
    document.getElementById('bcr-total-section').textContent = `/`;
    try {
        await processData();
        renderChart(0);
    } catch (e) {
        console.error(`${currentLeague}の初期化に失敗:`, e);
        chartWrapper.innerHTML = `<p style="color:red;">${e.message}</p>`;
    }
}

// === このページが呼ばれた時に実行されるメイン関数 ===
export default function initializePage() {
    // SPAでのページ遷移時にコンテナの描画が完了するのを待つため、
    // 処理をほんの少しだけ遅延させて実行する
    setTimeout(() => {
        setupControls();
        initialize('J1');
    }, 0); // 0ミリ秒の遅延でOK
}