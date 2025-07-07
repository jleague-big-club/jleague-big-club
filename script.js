// === グローバル変数 ===
let clubData = [];
let clubLeagueList = [];
let playerData = [];
let attendanceData = [];
let europeTopClubs = [];
let metricChart;
let best11Filter = { type: 'all', value: null };
let rankingData = {};
let scheduleData = [];
let isShowingArticleDetail = false;
let bannerAutoPlayInterval;
let predictionProbabilities = {};
let predictionDataUpdated = null;

function toHalfWidth(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[Ａ-Ｚａ-ｚ０-９．・－（）]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  }).replace(/　/g, ' '); // 全角スペースを半角スペースに
}

const majorLeagues = ["プレミアリーグ", "ラ・リーガ", "ブンデスリーガ", "セリエA", "リーグ・アン"];
const clubAbbreviations = {
    // J1
    "北海道コンサドーレ札幌": "札幌", "鹿島アントラーズ": "鹿島", "浦和レッズ": "浦和",
    "柏レイソル": "柏", "ＦＣ東京": "FC東京", "東京ヴェルディ": "東京V",
    "ＦＣ町田ゼルビア": "町田", "川崎フロンターレ": "川崎F", "横浜Ｆ・マリノス": "横浜FM",
    "湘南ベルマーレ": "湘南", "アルビレックス新潟": "新潟", "ジュビロ磐田": "磐田",
    "名古屋グランパス": "名古屋", "京都サンガF.C.": "京都", "ガンバ大阪": "G大阪",
    "セレッソ大阪": "C大阪", "ヴィッセル神戸": "神戸", "サンフレッチェ広島": "広島",
    "アビスパ福岡": "福岡", "サガン鳥栖": "鳥栖",

    // J2
    "ベガルタ仙台": "仙台", "ブラウブリッツ秋田": "秋田", "モンテディオ山形": "山形",
    "いわきＦＣ": "いわき", "水戸ホーリーホック": "水戸", "栃木ＳＣ": "栃木SC",
    "ザスパ群馬": "群馬", "ジェフユナイテッド千葉": "千葉", "横浜ＦＣ": "横浜FC",
    "ヴァンフォーレ甲府": "甲府", "清水エスパルス": "清水", "藤枝ＭＹＦＣ": "藤枝",
    "ファジアーノ岡山": "岡山", "レノファ山口ＦＣ": "山口", "徳島ヴォルティス": "徳島",
    "愛媛ＦＣ": "愛媛", "Ｖ・ファーレン長崎": "長崎", "ロアッソ熊本": "熊本",
    "大分トリニータ": "大分", "鹿児島ユナイテッドＦＣ": "鹿児島", "ＦＣ今治":"今治",

    // J3
    "ヴァンラーレ八戸": "八戸", "いわてグルージャ盛岡": "岩手", "福島ユナイテッドＦＣ": "福島",
    "ＲＢ大宮アルディージャ": "大宮", "Ｙ．Ｓ．Ｃ．Ｃ．横浜": "YS横浜", "ＳＣ相模原": "相模原",
    "松本山雅ＦＣ": "松本", "ＡＣ長野パルセイロ": "長野", "カターレ富山": "富山",
    "ツエーゲン金沢": "金沢", "アスルクラロ沼津": "沼津", "ＦＣ岐阜": "岐阜",
    "ＦＣ大阪": "FC大阪", "奈良クラブ": "奈良", "ガイナーレ鳥取": "鳥取",
    "カマタマーレ讃岐": "讃岐", "ギラヴァンツ北九州": "北九州", "テゲバジャーロ宮崎": "宮崎",
    "ＦＣ琉球": "琉球", "栃木シティ": "栃木C", "高知ユナイテッドSC": "高知",
};
const europeClubAbbreviations = {
    "レアル・マドリード": "Rマドリード",
    "マンチェスター・シティ": "マンC",
    "パリ・サンジェルマン": "PSG",
    "バイエルン・ミュンヘン": "バイエルン",
    "マンチェスター・ユナイテッド": "マンU",
    "トッテナム・ホットスパー": "トッテナム",
    "リヴァプール": "リヴァプール",
    "チェルシー": "チェルシー",
    "アーセナル": "アーセナル",
    "ユヴェントス": "ユヴェントス",
    "ボルシア・ドルトムント": "ドルトムント",
    "アトレティコ・マドリード": "Aマドリード",
    "インテル・ミラノ": "インテル",
    "ACミラン": "ミラン",
    "ウェストハム・ユナイテッド": "ウェストハム",
    "アストン・ヴィラ": "アストンヴィラ",
    "ニューカッスル・ユナイテッド": "ニューカッスル",
    "オリンピック・マルセイユ": "マルセイユ",
    "オリンピック・リヨン": "リヨン",
};
function showPage(id, btn) {
    try {
        // --- 1. 基本的なページ表示切り替え ---
        window.scrollTo(0, 0);
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('visible'));
        const targetPage = document.getElementById(id);
        if (targetPage) targetPage.classList.add('visible');

        // --- 2. ページタイトルの表示切り替え ---
        document.querySelectorAll('.page-title-row').forEach(row => row.style.display = 'none');
        let titleId = (id === 'europe-top20') ? 'europe-top20' : id;
        const pageTitleDiv = document.getElementById('page-title-' + titleId);
        if (pageTitleDiv) pageTitleDiv.style.display = 'flex';

        // --- 3. ナビゲーションボタンのアクティブ状態を管理 ---
        document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
        if (btn) {
            btn.classList.add('active');
            const parentDropdown = btn.closest('.nav-dropdown');
            if (parentDropdown) {
                parentDropdown.querySelector('button').classList.add('active');
            }
        }

        // --- 4. トップページ用の要素の表示/非表示 ---
        const scoreBtn = document.getElementById('score-method-btn');
        const banner = document.querySelector('.carousel-container');
        if (id === 'top') {
            if (scoreBtn) {
                scoreBtn.style.display = 'block';
                const footer = document.querySelector('.site-footer');
                if (footer) {
                    if (window.innerWidth > 768) {
                        const isFooterVisible = footer.getBoundingClientRect().top < window.innerHeight;
                        scoreBtn.classList.toggle('fixed-to-viewport', !isFooterVisible);
                    } else {
                        scoreBtn.classList.add('fixed-to-viewport');
                    }
                }
            }
            if (banner) {
                banner.style.display = 'block';
                const track = banner.querySelector('.carousel-track');
                if (track && track.children.length > 6) {
                    const originalItems = Array.from(track.querySelectorAll('.carousel-item')).slice(0, 6);
                    track.innerHTML = '';
                    originalItems.forEach(item => track.appendChild(item));
                }
                if (track) {
                    track.style.transition = 'none';
                    track.style.transform = 'translateX(0)';
                }
                setTimeout(() => setupCarousel('banner-carousel', 4000), 0);
            }
        } else {
            if (scoreBtn) {
                scoreBtn.style.display = 'none';
                document.getElementById('score-method-pop').classList.remove('popup-visible');
                document.getElementById('score-detail-pop').classList.remove('popup-visible');
            }
            if (banner) {
                banner.style.display = 'none';
                stopBannerAutoPlay();
            }
        }

        // --- 5. 各ページの初期化処理を呼び出す ---
        if (id === 'metrics') {
            setTimeout(() => {
                const select = document.getElementById('metric-select');
                if (select) showMetricChart(select.value);
            }, 0);
        }
        if (id === 'blog' && !isShowingArticleDetail) {
            const pageTitle = document.querySelector('#page-title-blog h1');
            if (pageTitle) pageTitle.textContent = '記事・ブログ';
            renderArticleList(currentPage);
        }
        if (id === 'europe' && playerData.length > 0) {
            if (window.innerWidth > 768) {
                document.querySelectorAll(".country-btn").forEach(b => b.classList.remove("active"));
                showPlayerTable();
            } else {
                initEuropeMobilePage();
            }
        }
        if (id === 'introduce' && clubData.length > 0) {
            document.querySelectorAll('.league-tab-btn').forEach(b => b.classList.remove('active'));
            const j1Tab = document.querySelector('.league-tab-btn[data-league="J1"]');
            if (j1Tab) j1Tab.classList.add('active');
            renderClubLeagueTable("J1");
        }
        if (id === 'best11' && playerData.length > 0) initBest11Page();
        if (id === 'rankings' && rankingData['J1']) showRankingTable('J1');
        if (id === 'prediction') initPredictionPage();
        if (id === 'simulation') initSimulationPage();
        if (id === 'attendance' && attendanceData.length > 0) initAttendancePage();

    } finally {
        // --- 6. スマホ用メニューを閉じる処理（finallyで必ず実行） ---
        const navLinks = document.getElementById('nav-links');
        if (navLinks && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            document.getElementById('menu-overlay').classList.remove('open');
            document.querySelectorAll('.nav-dropdown.menu-open').forEach(menu => menu.classList.remove('menu-open'));
        }
    }
}
function toggleSubMenu(btn, event) {
    event.preventDefault();
    event.stopPropagation();

    const parentDropdown = btn.parentElement;

    document.querySelectorAll('.nav-links .nav-dropdown.menu-open').forEach(openMenu => {
        if (openMenu !== parentDropdown) {
            openMenu.classList.remove('menu-open');
        }
    });

    parentDropdown.classList.toggle('menu-open');
}
function updateCopyButtonText() {
    const copyButton = document.getElementById('copy-best11-img-btn');
    if (copyButton) {
        if (window.innerWidth <= 768) {
            copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>ダウンロード</span>';
        } else {
            copyButton.innerHTML = '画像をコピー';
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const fetchWithMeta = (url) => fetch(url).then(res => {
        if (!res.ok) return Promise.reject(`${url}: ${res.status}`);
        const lastModified = res.headers.get('Last-Modified');
        return res.text().then(text => ({ text, lastModified }));
    });

    const parseCsvLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    Promise.all([
        fetch("data/data.csv").then(res => res.ok ? res.text() : Promise.reject(`data.csv: ${res.status}`)),
        fetch("data/playerdata.csv").then(res => res.ok ? res.text() : Promise.reject(`playerdata.csv: ${res.status}`)),
        fetchWithMeta("data/attendancefigure.csv"),
        fetchWithMeta("data/j1rank.csv"),
        fetchWithMeta("data/j2rank.csv"),
        fetchWithMeta("data/j3rank.csv"),
        fetch("data/europebigclub.csv").then(res => res.ok ? res.text() : Promise.reject(`europebigclub.csv: ${res.status}`)),
        fetch("data/schedule.csv").then(res => res.ok ? res.text() : Promise.reject(`schedule.csv: ${res.status}`)),
        fetchWithMeta("data/prediction_probabilities.json")
    ])
    .then(([clubCsvText, playerCsvText, attendanceResponse, j1Response, j2Response, j3Response, europeCsvText, scheduleCsvText, predictionResponse]) => {

        const predictionJson = JSON.parse(predictionResponse.text);
        predictionProbabilities = predictionJson; 
        predictionDataUpdated = predictionJson.updated;

        let lines, headers;

        lines = clubCsvText.trim().split("\n"); headers = lines[0].split(",").map(h => h.trim()); clubData = lines.slice(1).map(line => { const values = line.split(","); const obj = {}; headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : ''); obj.name = obj["クラブ名"] || 'N/A'; obj.revenue = parseFloat(obj["売上高（億円）"]) || 0; obj.audience = parseInt(obj["平均観客動員数"]) || 0; obj.titles = parseInt(obj["タイトル計"]) || 0; obj.sum = parseFloat(obj["総合的ビッグクラブスコア"]) || 0; obj.l = obj["過去10年J1在籍年数"] || '0'; obj.m = obj["J1在籍10年平均順位"] || 'N/A'; obj.o = obj["J1在籍10年平均順位スコア"] || 'N/A'; obj.p = obj["所属リーグ"] || 'N/A'; return obj; }); clubData.sort((a, b) => b.sum - a.sum); clubLeagueList = clubData;

        lines = playerCsvText.trim().split("\n"); headers = lines[0].split(",").map(h => h.trim()); playerData = lines.slice(1).map(line => { const vals = line.split(","); const obj = {}; headers.forEach((h, i) => obj[h] = vals[i] ? vals[i].trim() : ''); return obj; });

        let attendanceLines = attendanceResponse.text.trim().split("\n"); let attendanceHeaders = attendanceLines[0].split(",").map(h => h.trim()); attendanceData = attendanceLines.slice(1).map(line => { const values = line.split(","); const obj = {}; attendanceHeaders.forEach((h, i) => { const val = values[i] ? values[i].trim() : ''; if (['年', '年間最高観客数', '年間最低観客数', 'ゲーム数'].includes(h)) { obj[h] = parseInt(val) || 0; } else if (h === '平均観客数') { obj[h] = parseFloat(val) || 0; } else { obj[h] = val; } }); return obj; }); attendanceData.lastModified = attendanceResponse.lastModified;

        const parseRankingCsv = (csvText) => { if (!csvText || csvText.trim() === '') return []; const lines = csvText.trim().split("\n"); const headers = lines[0].split(",").map(h => h.trim()); const data = lines.slice(1).map(line => { const values = line.split(","); const rowObj = {}; headers.forEach((h, i) => { rowObj[h] = values[i] ? values[i].trim() : ''; }); return rowObj; }); return data; };
        rankingData['J1'] = { data: parseRankingCsv(j1Response.text) };
        rankingData['J2'] = { data: parseRankingCsv(j2Response.text) };
        rankingData['J3'] = { data: parseRankingCsv(j3Response.text) };

        let europeLines = europeCsvText.trim().split("\n");
        europeTopClubs = europeLines.slice(1).map(line => parseCsvLine(line));

        const scheduleLines = scheduleCsvText.trim().split("\n");
        const scheduleHeaders = scheduleLines[0].split(",").map(h => h.trim());
        scheduleData = scheduleLines.slice(1).map(line => {
            const values = line.split(",");
            const rowObj = {};
            scheduleHeaders.forEach((h, i) => {
                rowObj[h] = values[i] ? values[i].trim() : '';
            });
            return rowObj;
        });

        renderBig5(clubData);
        renderOthers(clubData);
        renderHistory(clubData);
        renderClubLeagueTable("J1");
        renderBest11Filters();
        renderEuropeTop20Table();

        showPage('top', document.querySelector('nav button'));

    }).catch(err => {
        console.error("データの読み込みまたは処理中にエラーが発生しました:", err);
        document.body.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">データの読み込みに失敗しました。<br>ファイル名や内容を確認してください。</div>`;
    });

    setupEventListeners();
    setupCarousel('banner-carousel', 2000);
    updateCopyButtonText();
    window.addEventListener('resize', updateCopyButtonText);
    setupFooterButtonObserver();
});

function renderEuropeTop20Table() {
    const container = document.getElementById('europe-top20');
    if (!container || europeTopClubs.length === 0) return;

    const isMobile = window.innerWidth <= 768;

    const headers = ["順位", "国", "リーグ", "クラブ名", "売上高 (億円)", "平均観客数"];
    let tableHTML = `<div class="data-source-note">※データソース: Deloitte, Transfermarkt (1ユーロ=165円で計算)</div>`;
    tableHTML += `<table><thead><tr>`;
    headers.forEach(h => tableHTML += `<th>${h}</th>`);
    tableHTML += `</tr></thead><tbody>`;

    europeTopClubs.forEach((club, index) => {
        tableHTML += `<tr>`;
        tableHTML += `<td>${index + 1}</td>`;
        tableHTML += `<td>${club[0] || '-'}</td>`;
        tableHTML += `<td>${club[1] || '-'}</td>`;
        let clubName = club[2] || '-';
        if (isMobile && europeClubAbbreviations[clubName]) {
            clubName = europeClubAbbreviations[clubName];
        }
        tableHTML += `<td>${clubName}</td>`;
        let revenueText = '-';
        if (club[4]) {
            const revenueValue = parseFloat(club[4]);
            if (isMobile) {
                revenueText = Math.round(revenueValue).toLocaleString();
            } else {
                revenueText = revenueValue.toLocaleString();
            }
        }
        tableHTML += `<td>${revenueText}</td>`;
        tableHTML += `<td>${club[5] ? parseInt(club[5]).toLocaleString() : '-'}</td>`;
        tableHTML += `</tr>`;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

function renderBig5(clubs) { const big5 = clubs.slice(0, 5); const big5Div = document.getElementById("big5-cards"); big5Div.innerHTML = ""; const row1 = document.createElement("div"); row1.className = "big5-row"; const row2 = document.createElement("div"); row2.className = "big5-row"; big5.forEach((club, i) => { let colorClass = "local"; if (club.sum >= 30) colorClass = "top-club"; else if (club.sum >= 20) colorClass = "potential-big"; else if (club.sum >= 5) colorClass = "middle"; const isLong = club.name.length >= 10; const card = document.createElement("div"); card.className = `club-card ${colorClass} rank-${i+1}` + (isLong ? " long-title" : ""); card.innerHTML = `<h3 class="club-title">${club.name}</h3><div class="score-val">スコア：${club.sum.toFixed(1)}</div>`; if (i < 3) row1.appendChild(card); else row2.appendChild(card); }); big5Div.appendChild(row1); big5Div.appendChild(row2); }
function renderOthers(clubs) { const others = clubs.slice(5); const tableDiv = document.getElementById("club-categories"); tableDiv.innerHTML = ""; const table = document.createElement("table"); const thead = table.createTHead(); const headerRow = thead.insertRow(); ["順位", "クラブ名", "合算スコア", "区分"].forEach(h => { const th = document.createElement("th"); th.textContent = h; headerRow.appendChild(th); }); const tbody = table.createTBody(); others.forEach((club, idx) => { let category, colorClass; if (club.sum >= 30) { category = "トップクラブ"; colorClass = "top-club"; } else if (club.sum >= 20) { category = "潜在的ビッグクラブ"; colorClass = "potential-big"; } else if (club.sum >= 5) { category = "中堅クラブ"; colorClass = "middle"; } else { category = "ローカルクラブ"; colorClass = "local"; } const tr = tbody.insertRow(); tr.className = colorClass; [idx + 6, club.name, club.sum.toFixed(1), category].forEach(val => { const td = document.createElement("td"); td.textContent = val; tr.appendChild(td); }); }); tableDiv.appendChild(table); }
function showMetricChart(key) {
    const chartData = clubData.map(club => club[key]);
    const labels = clubData.map(club => club.name);
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
                    let sum = clubData[i].sum;
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
                x: { beginAtZero: true, ticks: { color: "#111" } },
                y: { ticks: { autoSkip: false, color: "#111" } }
            },
            plugins: {
                legend: { labels: { color: '#111' } },
                title: { display: false }
            }
        }
    });
}

function renderHistory(clubs) {
    const historyDiv = document.getElementById("jleague-history");
    historyDiv.innerHTML = "";
    const hisTable = document.createElement("table");
    const hisThead = hisTable.createTHead();
    const hisHeader = hisThead.insertRow();
    ["クラブ名", "J1過去10年在籍年数", "J1過去10年平均順位", "J1過去10年在籍スコア"].forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        hisHeader.appendChild(th);
    });
    const hisTbody = hisTable.createTBody();
    const isMobile = window.innerWidth <= 768;

    clubs.forEach(club => {
        const tr = hisTbody.insertRow();

        // ▼▼▼ ここからが変更箇所 ▼▼▼
        let clubDisplayName = club.name; // デフォルトは元の名前

        if (isMobile) {
            // 元のクラブ名を半角に変換
            const normalizedClubName = toHalfWidth(club.name);
            
            // 省略名リストのキーも半角に変換して比較
            for (const key in clubAbbreviations) {
                if (toHalfWidth(key) === normalizedClubName) {
                    clubDisplayName = clubAbbreviations[key];
                    break;
                }
            }
        }
        // ▲▲▲ ここまで ▲▲▲

        [clubDisplayName, club.l, club.m, club.o].forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
    });
    historyDiv.appendChild(hisTable);
}
function renderClubLeagueTable(league) { if (clubLeagueList.length === 0) return; const tableDiv = document.getElementById("club-league-table"); const rows = clubLeagueList.filter(club => club.p === league); if (!rows.length) { tableDiv.innerHTML = `<div style="padding:16px; color:white;">このリーグのクラブデータはありません</div>`; return; } let html = `<table><thead><tr><th>クラブ名</th></tr></thead><tbody> ${rows.map(club => `<tr><td style="cursor:pointer; color:#3cf;" onclick="showClubStatus('${club.name}')">${club.name}</td></tr>`).join("")} </tbody></table>`; tableDiv.innerHTML = html; }
function showClubStatus(clubName) {
    const club = clubData.find(c => c.name === clubName);
    if (!club) return;
    const rank = clubData.findIndex(c => c.name === clubName) + 1;

    const html = `
            <div style="font-size:1.2rem; font-weight:bold; color:#97d7ff; letter-spacing:0.06em;">${clubName}</div>
            
            <div class="club-status-grid">
                <div class="status-item">
                    <span class="status-label">👑 ビッグクラブスコア</span>
                    <span class="status-value score">${club.sum ? club.sum.toFixed(1) : '-'} (${rank}位)</span>
                </div>
                <div class="status-item">
                    <span class="status-label">🏅 所属リーグ</span>
                    <span class="status-value">${club.p || '-'}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">💰 売上高</span>
                    <span class="status-value">${club.revenue || '-'} 億円</span>
                </div>
                <div class="status-item">
                    <span class="status-label">👥 平均観客数</span>
                    <span class="status-value">${(club.audience || '-').toLocaleString()} 人</span>
                </div>
                <div class="status-item">
                    <span class="status-label">🏆 タイトル獲得数</span>
                    <span class="status-value">${club.titles || '-'}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">📊 J1過去10年平均順位</span>
                    <span class="status-value">${club.m || '-'} 位</span>
                </div>
            </div>

            <button onclick="document.getElementById('club-status-board').style.display='none';" style="position:absolute;top:13px;right:14px; background:#29b6e6; border:none; border-radius:7px; color:#fff; padding:5px 13px; font-size:1.01em; cursor:pointer;">閉じる</button>
        `;

    const board = document.getElementById("club-status-board");
    board.innerHTML = html;
    board.style.display = "block";
}

function showPlayerTable(country) {
    const div = document.getElementById("player-table-wrap");
    const majorLeagues = ["プレミアリーグ", "ブンデスリーガ", "セリエA", "ラリーガ", "リーグアン"];
    let displayPlayers = playerData.filter(p => majorLeagues.includes(p['リーグ']));

    let leagueName = '';
    const countryToLeagueMap = {
        'イングランド': 'プレミアリーグ',
        'スペイン': 'ラ・リーガ',
        'ドイツ': 'ブンデスリーガ',
        'イタリア': 'セリエA',
        'フランス': 'リーグ・アン'
    };

    if (country) {
        displayPlayers = displayPlayers.filter(p => p['国'] === country);
        leagueName = countryToLeagueMap[country] || country;
    } else {
        leagueName = '5大リーグ';
    }

    displayPlayers.sort((a, b) => (parseInt(a['年齢']) || 99) - (parseInt(b['年齢']) || 99));

    if (displayPlayers.length === 0) {
        div.innerHTML = `<div style="color:#ffe;padding:16px; text-align:center;">該当する選手がいません。</div>`;
        return;
    }

    const titleHtml = `<h3 style="text-align:center;color:#ffd700;">${leagueName}の日本人選手</h3>`;
    const headers = ['No.', '国', '所属クラブ', '選手名', '年齢', 'ポジション', '詳細'];

    let html = titleHtml + `<table style="font-size: 0.88rem;"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;

    displayPlayers.forEach((player, i) => {
        html += `<tr>`;
        html += `<td>${i + 1}</td>`;
        headers.slice(1).forEach(h => {
            html += `<td>${player[h] || ''}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    div.innerHTML = html;
}

window.nowSelectedPosKey = null; let best11Formation = "343"; let best11Selected = {}; const best11Positions = { "343": [{ key: "GK", label: "GK" }, { key: "CB1", label: "CB1" }, { key: "CB2", label: "CB2" }, { key: "CB3", label: "CB3" }, { key: "MF1", label: "MF1" }, { key: "MF2", label: "MF2" }, { key: "MF3", label: "MF3" }, { key: "MF4", label: "MF4" }, { key: "MF5", label: "MF5" }, { key: "MF6", label: "MF6" }, { key: "FW", label: "FW" }], "433": [{ key: "GK", label: "GK" }, { key: "CB1", label: "CB1" }, { key: "CB2", label: "CB2" }, { key: "CB3", label: "CB3" }, { key: "CB4", label: "CB4" }, { key: "MF1", label: "MF1" }, { key: "MF2", label: "MF2" }, { key: "MF3", label: "MF3" }, { key: "MF4", label: "MF4" }, { key: "MF5", label: "MF5" }, { key: "FW", label: "FW" }] }; const best11PosCoords = { "343": { GK: { top: 290, left: 140 }, CB1: { top: 225, left: 50 }, CB2: { top: 235, left: 140 }, CB3: { top: 225, left: 230 }, MF1: { top: 165, left: 90 }, MF2: { top: 165, left: 190 }, MF3: { top: 120, left: 40 }, MF4: { top: 120, left: 240 }, MF5: { top: 60, left: 70 }, FW: { top: 25, left: 140 }, MF6: { top: 60, left: 210 } }, "433": { GK: { top: 290, left: 140 }, CB1: { top: 200, left: 38 }, CB2: { top: 235, left: 100 }, CB3: { top: 235, left: 190 }, CB4: { top: 200, left: 240 }, MF1: { top: 155, left: 140 }, MF2: { top: 130, left: 55 }, MF3: { top: 130, left: 225 }, MF4: { top: 70, left: 70 }, FW: { top: 25, left: 140 }, MF5: { top: 70, left: 210 } } };
function renderBest11Filters() { const filtersDiv = document.getElementById('best11-filters'); if (!filtersDiv || playerData.length === 0) return; const leagues = ["J1", "J2", "J3"]; const clubsWithLeague = [...new Map(playerData.map(p => [p['所属クラブ'], p['リーグ']])).entries()]; let html = `<button class="filter-btn active" onclick="setBest11Filter('all', null, this)">すべて</button> <button class="filter-btn" onclick="setBest11Filter('5-da-league', null, this)">5大リーグ</button>`; leagues.forEach(league => { html += `<button class="filter-btn" onclick="setBest11Filter('league', '${league}', this)">${league}</button>`; }); html += `<select id="club-filter-select" onchange="setBest11Filter('club', this.value, this)"> <option value="all">クラブで絞り込み</option>`; clubsWithLeague.sort().forEach(([club, league]) => { if (club) html += `<option value="${club}" data-league="${league}">${club}</option>`; }); html += `</select>`; filtersDiv.innerHTML = html; }
function setBest11Filter(type, value, element) { best11Filter = { type, value }; document.querySelectorAll('#best11-filters .filter-btn').forEach(btn => btn.classList.remove('active')); if (element.tagName === 'BUTTON') { element.classList.add('active'); document.getElementById('club-filter-select').value = 'all'; } else if (element.tagName === 'SELECT' && value === 'all') { document.querySelector('#best11-filters .filter-btn[onclick*="\'all\'"]').classList.add('active'); best11Filter = { type: 'all', value: null }; } const clubSelect = document.getElementById('club-filter-select'); const originalOptions = [...new Map(playerData.map(p => [p['所属クラブ'], p['リーグ']])).entries()].filter(([club]) => club).sort(); const majorLeagues = ["プレミアリーグ", "ブンデスリーガ", "セリエA", "ラリーガ", "リーグアン"]; let clubsToShow; if (best11Filter.type === 'league') { clubsToShow = originalOptions.filter(([club, league]) => league === best11Filter.value); } else if (best11Filter.type === '5-da-league') { clubsToShow = originalOptions.filter(([club, league]) => majorLeagues.includes(league)); } else { clubsToShow = originalOptions; } let optionsHtml = `<option value="all">クラブで絞り込み</option>`; clubsToShow.forEach(([club, league]) => { optionsHtml += `<option value="${club}" data-league="${league}">${club}</option>`; }); clubSelect.innerHTML = optionsHtml; if (best11Filter.type === 'club') { clubSelect.value = best11Filter.value; } if (window.nowSelectedPosKey) { const currentPosBtn = document.querySelector(`.position-btn[data-pos="${window.nowSelectedPosKey}"]`); selectPosition(window.nowSelectedPosKey, currentPosBtn); } }
function initBest11Page() { renderPositionTabs(); renderBest11Table(); renderCourtPlayers(); }
window.setFormation = function (form, btn) { best11Formation = form; document.getElementById("formation-title").textContent = "フォーメーション：" + btn.textContent; document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); best11Selected = {}; best11Filter = { type: 'all', value: null }; initBest11Page(); document.querySelectorAll('#best11-filters .filter-btn').forEach(b => b.classList.remove('active')); document.querySelector('#best11-filters .filter-btn').classList.add('active'); const clubSelect = document.getElementById('club-filter-select'); if (clubSelect) clubSelect.value = 'all'; }
function renderPositionTabs() { const posBtnContainer = document.getElementById("position-btn-container"); if (!posBtnContainer) return; const positions = best11Positions[best11Formation]; let html = ''; positions.forEach((pos, i) => { html += `<button class="position-btn${i === 0 ? ' active' : ''}" data-pos="${pos.key}" onclick="selectPosition('${pos.key}', this)">${pos.label}</button>`; }); posBtnContainer.innerHTML = html; setTimeout(() => selectPosition(positions[0].key, posBtnContainer.querySelector('.position-btn')), 10); }
window.selectPosition = function (posKey, btn) {
    window.nowSelectedPosKey = posKey;
    document.querySelectorAll('#position-tabs .position-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    let listDiv = document.getElementById('player-choice-list');
    if (!listDiv) return;

    let sourceData;
    const majorLeagues = ["プレミアリーグ", "ブンデスリーガ", "セリエA", "ラリーガ", "リーグアン"];
    switch (best11Filter.type) {
        case 'league': sourceData = playerData.filter(p => p['リーグ'] === best11Filter.value); break;
        case 'club': sourceData = playerData.filter(p => p['所属クラブ'] === best11Filter.value); break;
        case '5-da-league': sourceData = playerData.filter(p => majorLeagues.includes(p['リーグ'])); break;
        default: sourceData = playerData;
    }
    const searchKey = posKey.replace(/[0-9]/g, '').toUpperCase();
    let players = sourceData.filter(p => {
        const playerPos = (p['ポジション'] || "").toUpperCase();
        if (playerPos === searchKey) return true;
        if (searchKey === 'CB' && playerPos === 'DF') return true;
        return false;
    });

    if (players.length === 0) {
        listDiv.innerHTML = `<div style="color:white; padding: 10px;">この条件の選手がいません。</div>`;
    } else {
        const selectedPlayerName = best11Selected[posKey] || '選手を選択...';
        let optionsHTML = `<div class="custom-option" data-value="">選手を選択...</div>`;
        players.forEach(p => {
            const playerName = p['選手名'];
            optionsHTML += `<div class="custom-option" data-value="${playerName}">${playerName}</div>`;
        });

        listDiv.innerHTML = `
                <div class="custom-select-container">
                    <button class="custom-select-trigger">${selectedPlayerName}</button>
                    <div class="custom-options">${optionsHTML}</div>
                </div>`;

        const container = listDiv.querySelector('.custom-select-container');
        const trigger = container.querySelector('.custom-select-trigger');
        const options = container.querySelectorAll('.custom-option');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', function () {
                const value = this.getAttribute('data-value');
                choosePlayer(posKey, value);
                trigger.textContent = value || '選手を選択...';
                container.classList.remove('open');
            });
        });
    }
    renderCourtPlayers();
}

function renderBest11Table() { const tableDiv = document.getElementById("best11-table"); const positions = best11Positions[best11Formation]; const posOrder = [...positions].sort((a, b) => (a.key.startsWith('FW') ? -1 : 1) - (b.key.startsWith('FW') ? -1 : 1) || (b.key.startsWith('MF') ? 1 : -1) - (a.key.startsWith('MF') ? 1 : -1) || (b.key.startsWith('CB') ? 1 : -1) - (a.key.startsWith('CB') ? 1 : -1) || (a.key === 'GK' ? 1 : -1)); let html = '<table><thead><tr><th>ポジション</th><th>選手</th><th>クラブ</th><th>リーグ</th></tr></thead><tbody>'; posOrder.forEach(pos => { let name = best11Selected[pos.key] || ''; let club = '', league = ''; if (name) { const player = playerData.find(p => p['選手名'] === name); if (player) { club = player['所属クラブ'] || ''; league = player['リーグ'] || ''; } } html += `<tr><td style="font-weight:bold;">${pos.label}</td><td${name ? '' : ' class="unselected"'}>${name || '未選択'}</td><td>${club || '-'}</td><td>${league || '-'}</td></tr>`; }); html += "</tbody></table>"; tableDiv.innerHTML = html; }
function renderCourtPlayers() { const area = document.getElementById('court-area'); if (!area) return; area.innerHTML = ''; best11Positions[best11Formation].forEach(pos => { const c = best11PosCoords[best11Formation][pos.key]; if (!c) return; const label = document.createElement('div'); label.className = 'best11-player-label' + (best11Selected[pos.key] ? '' : ' unselected') + (pos.key === window.nowSelectedPosKey ? ' selected' : ''); label.style.top = `${c.top}px`; label.style.left = `${c.left}px`; let name = best11Selected[pos.key] ? best11Selected[pos.key] : pos.label; let fontSize = name.length >= 7 ? '0.80em' : (name.length >= 6 ? '0.89em' : '1em'); label.innerHTML = `<span style="font-size:${fontSize};">${name}</span>`; label.onclick = () => selectPosition(pos.key, document.querySelector(`.position-btn[data-pos="${pos.key}"]`)); label.style.cursor = "pointer"; area.appendChild(label); }); }
window.choosePlayer = function (posKey, name) { if (name) { best11Selected[posKey] = name; } else { delete best11Selected[posKey]; } renderBest11Table(); renderCourtPlayers(); }

function setupEventListeners() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    const menuOverlay = document.getElementById('menu-overlay');

    if (hamburgerBtn && navLinks && menuOverlay) {
        const toggleMenu = () => {
            const isOpen = navLinks.classList.toggle('open');
            menuOverlay.classList.toggle('open');

            if (!isOpen) {
                document.querySelectorAll('.nav-dropdown.menu-open').forEach(menu => {
                    menu.classList.remove('menu-open');
                });
            }
        };
        hamburgerBtn.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', toggleMenu);
    }

    document.querySelectorAll(".country-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".country-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            showPlayerTable(btn.dataset.country);
        });
    });

    document.querySelectorAll(".league-tab-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".league-tab-btn").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            renderClubLeagueTable(this.dataset.league);
        });
    });

    document.getElementById("post-to-x-btn").onclick = function () {
        const text = "私のベストイレブンはこちら！\n#あなたのベストイレブン";
        const url = "https://jleague-big-club.com";
        const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(tweetUrl, '_blank');

        const msgSpan = document.getElementById('copy-best11-img-msg');
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        if (isIOS) {
            msgSpan.textContent = '';
        } else {
            msgSpan.textContent = '';
        }

        setTimeout(() => msgSpan.textContent = '', 5000);
    };

    document.getElementById("copy-best11-img-btn").onclick = function () {
        const copyBtn = this;
        const postBtn = document.getElementById('post-to-x-btn');
        const captureElem = document.getElementById('best11-capture-area');
        const buttonsContainer = document.getElementById('capture-buttons');
        const msgSpan = document.getElementById('copy-best11-img-msg');
        const selectedLabel = captureElem.querySelector('.best11-player-label.selected');

        if (selectedLabel) selectedLabel.classList.remove('selected');
        copyBtn.disabled = true;
        postBtn.disabled = true;
        buttonsContainer.style.visibility = 'hidden';
        msgSpan.style.visibility = 'hidden';
        msgSpan.textContent = '';

        html2canvas(captureElem, { backgroundColor: null, scale: 2, useCORS: true }).then(canvas => {
            if (selectedLabel) selectedLabel.classList.add('selected');

            canvas.toBlob(blob => {
                if (!blob) {
                    msgSpan.textContent = 'エラー: 画像データの生成に失敗しました';
                    return;
                }

                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                        .then(() => {
                            msgSpan.textContent = '';
                            setTimeout(() => msgSpan.textContent = '', 3000);
                        })
                        .catch(err => {
                            console.warn("クリップボードへのコピーに失敗しました (iOSの制限など):", err);
                            downloadImage(canvas, "best11.png", msgSpan);
                        });
                } else {
                    console.warn("Clipboard APIがサポートされていません。画像をダウンロードします。");
                    downloadImage(canvas, "best11.png", msgSpan);
                }
            }, 'image/png');
        }).catch(err => {
            console.error("画像キャプチャ中にエラーが発生しました:", err);
            msgSpan.textContent = 'エラー: 画像のキャプチャに失敗しました';
        }).finally(() => {
            copyBtn.disabled = false;
            postBtn.disabled = false;
            buttonsContainer.style.visibility = 'visible';
            msgSpan.style.visibility = 'visible';
        });
    };

    function downloadImage(canvas, filename, msgSpan) {
        try {
            const a = document.createElement('a');
            const url = canvas.toDataURL('image/png');
            a.href = url;
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                msgSpan.textContent = '';
            } else {
                msgSpan.textContent = '';
            }

            setTimeout(() => msgSpan.textContent = '', 5000);
        } catch (e) {
            console.error("画像のダウンロードに失敗しました:", e);
            msgSpan.textContent = 'エラー: 画像のダウンロードに失敗しました';
        }
    }

    const scoreBtn = document.getElementById("score-method-btn");
    const scorePop = document.getElementById("score-method-pop");
    const detailLink = document.getElementById("score-detail-link");
    const detailPop = document.getElementById("score-detail-pop");

    if (scoreBtn) {
        scoreBtn.onclick = (e) => {
            e.stopPropagation();
            scorePop.classList.toggle('popup-visible');
            detailPop.classList.remove('popup-visible');
        };
    }

    if (detailLink) {
        detailLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            detailPop.classList.add('popup-visible');
        };
    }

    document.addEventListener("click", (e) => {
        const board = document.getElementById("club-status-board");
        if (board && board.style.display === "block" && !board.contains(e.target) && !e.target.matches("td[onclick^='showClubStatus']")) {
            board.style.display = "none";
        }

        if (scorePop && scorePop.classList.contains('popup-visible') && !scorePop.contains(e.target)) {
            scorePop.classList.remove('popup-visible');
        }
        if (detailPop && detailPop.classList.contains('popup-visible') && !detailPop.contains(e.target) && !detailLink.contains(e.target)) {
            detailPop.classList.remove('popup-visible');
        }
    });
    const scoreCalcBtn = document.querySelector('.score-calc-btn');
    if (scoreCalcBtn) {
        const scoreCalcPop = scoreCalcBtn.querySelector('.score-calc-pop');
        if (scoreCalcPop) {
            scoreCalcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = scoreCalcPop.style.display === 'block';
                scoreCalcPop.style.display = isVisible ? 'none' : 'block';
            });
        }
    }

    document.addEventListener("click", (e) => {
        const board = document.getElementById("club-status-board");
        if (board && board.style.display === "block" && !board.contains(e.target) && !e.target.matches("td[onclick^='showClubStatus']")) {
            board.style.display = "none";
        }

        const scorePop = document.getElementById("score-method-pop");
        if (scorePop && scorePop.classList.contains('popup-visible') && !scorePop.contains(e.target)) {
            scorePop.classList.remove('popup-visible');
        }

        const detailPop = document.getElementById("score-detail-pop");
        if (detailPop && detailPop.classList.contains('popup-visible') && !detailPop.contains(e.target) && !document.getElementById("score-detail-link").contains(e.target)) {
            detailPop.classList.remove('popup-visible');
        }
        const helpPop = document.getElementById('prediction-help-pop');
        const helpBtn = document.getElementById('prediction-help-btn');
        if (helpPop && helpPop.style.display === 'block' && !helpPop.contains(e.target) && !helpBtn.contains(e.target)) {
            helpPop.style.display = 'none';
        }

        const scoreCalcPop = document.querySelector('.score-calc-pop');
        const scoreCalcBtn = document.querySelector('.score-calc-btn');
        if (scoreCalcPop && scoreCalcBtn) {
            if (scoreCalcPop.style.display === 'block' && !scoreCalcBtn.contains(e.target)) {
                scoreCalcPop.style.display = 'none';
            }
        }

        const openSelect = document.querySelector('.custom-select-container.open');
        if (openSelect && !openSelect.contains(e.target)) {
            openSelect.classList.remove('open');
        }
    });
}

let blogPosts = []; let blogInitialized = false; const listContainer = document.getElementById('blog-list-container'); const paginationContainer = document.getElementById('pagination'); const contentDiv = document.getElementById('blog-content'); const blogPageSection = document.getElementById('blog');
if (listContainer && paginationContainer && contentDiv && blogPageSection) { const observer = new MutationObserver((mutationsList) => { for (const mutation of mutationsList) { if (mutation.type === 'attributes' && mutation.attributeName === 'class' && blogPageSection.classList.contains('visible')) { if (isShowingArticleDetail) { continue; } if (!blogInitialized) { initializeAndRenderBlog(); } } } }); observer.observe(blogPageSection, { attributes: true }); } else { console.error("ブログ機能に必要なHTML要素が見つかりません。"); }
function initializeAndRenderBlog() { if (blogInitialized) return; fetch("/posts/index.json").then(res => { if (!res.ok) throw new Error(`index.jsonの読み込みに失敗しました。ステータス: ${res.status}`); return res.json(); }).then(data => { if (!Array.isArray(data)) throw new Error("JSONデータが配列形式ではありません。"); blogPosts = data.sort((a, b) => new Date(b.date) - new Date(a.date)); blogInitialized = true; renderArticleList(1); }).catch(err => { console.error("ブログ機能の初期化中にエラー:", err); const errorMessage = `<div style="background:#332222; border:2px solid red; color:white; padding:20px; margin: 20px; text-align:left; font-family:monospace; white-space:pre-wrap; border-radius: 8px;"><h3 style="margin-top:0; color:red;">エラーが発生しました</h3><p style="margin-bottom: 5px;"><strong>エラーの種類:</strong></p><p style="background: #553333; padding: 5px;">${err.name || '不明'}</p><p style="margin-bottom: 5px;"><strong>エラーメッセージ:</strong></p><p style="background: #553333; padding: 5px;">${err.message || '詳細不明'}</p><hr><p>このメッセージをコピーして、開発者に伝えてください。</p></div>`; if (listContainer) listContainer.innerHTML = errorMessage; }); }
const articlesPerPage = 18; let currentPage = 1; function renderArticleList(page) { currentPage = page; if (listContainer) listContainer.innerHTML = ""; if (listContainer) listContainer.style.display = 'flex'; if (contentDiv) contentDiv.style.display = 'none'; if (paginationContainer) paginationContainer.style.display = 'block'; const start = (page - 1) * articlesPerPage; const currentPosts = blogPosts.slice(start, start + articlesPerPage); currentPosts.forEach(post => { const card = document.createElement('div'); card.className = 'blog-card'; card.innerHTML = `<img src="/${post.thumbnail}" alt="${post.title}"><div class="blog-card-content"><div class="blog-card-title">${post.title}</div><div class="blog-card-date">${post.date}</div></div>`; card.onclick = () => showArticleDetail(post.slug, post.title); if (listContainer) listContainer.appendChild(card); }); renderPagination(); }
function renderPagination() { if (!paginationContainer) return; paginationContainer.innerHTML = ""; const totalPages = Math.ceil(blogPosts.length / articlesPerPage); if (totalPages <= 1) return; for (let i = 1; i <= totalPages; i++) { const btn = document.createElement('button'); btn.textContent = i; btn.style.cssText = `margin:0 5px; padding:6px 14px; border:none; border-radius:5px; cursor:pointer; background:${i === currentPage ? '#299ad3' : '#eee'}; color:${i === currentPage ? '#fff' : '#333'};`; btn.onclick = () => { renderArticleList(i); window.scrollTo({ top: 0, behavior: "smooth" }); }; paginationContainer.appendChild(btn); } }
function showArticleDetail(slug, title) { isShowingArticleDetail = true; if (listContainer) listContainer.style.display = 'none'; if (paginationContainer) paginationContainer.style.display = 'none'; fetch(`/posts/${slug}.md`).then(res => { if (!res.ok) throw new Error(`Markdownファイルが見つかりません: ${slug}.md`); return res.text(); }).then(md => { const bodyContent = md.replace(/^---[\s\S]*?---/, '').trim(); const html = marked.parse(bodyContent); if (contentDiv) { const buttonsHtml = ` <div style="text-align:center; margin-top:3em; display:flex; justify-content:center; gap:20px;"> <a href="#" onclick="event.preventDefault(); showPage('top', document.querySelector('#nav-analysis-btn'));" style="color:#aaa; font-weight:bold; text-decoration:none; border:1px solid #aaa; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> « ホームに戻る </a> <a href="#" onclick="event.preventDefault(); window.showBlogList();" style="color:#299ad3; font-weight:bold; text-decoration:none; border:1px solid #299ad3; padding: 8px 20px; border-radius:8px; transition: all 0.2s;"> 記事一覧に戻る » </a> </div> `; contentDiv.innerHTML = `${html}${buttonsHtml}`; contentDiv.style.display = "block"; showPage('blog', Array.from(document.querySelectorAll('.nav-links button')).find(b => b.textContent === '記事')); const pageTitle = document.querySelector('#page-title-blog h1'); if (pageTitle) pageTitle.textContent = title; window.scrollTo({ top: 0, behavior: 'smooth' }); } }).catch(err => { console.error("記事詳細の読み込みエラー:", err); if (contentDiv) { contentDiv.innerHTML = `記事の読み込みに失敗しました。<br><br><a href="#" onclick="event.preventDefault(); window.showBlogList();">一覧に戻る</a>`; contentDiv.style.display = 'block'; showPage('blog', Array.from(document.querySelectorAll('.nav-links button')).find(b => b.textContent === '記事')); } }).finally(() => { isShowingArticleDetail = false; }); }
window.showBlogList = function () { document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('visible')); const blogPage = document.getElementById('blog'); if (blogPage) { blogPage.classList.add('visible'); } document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active')); const blogNavBtn = Array.from(document.querySelectorAll('.nav-links button')).find(b => b.textContent === '記事'); if (blogNavBtn) { blogNavBtn.classList.add('active'); } const pageTitle = document.querySelector('#page-title-blog h1'); if (pageTitle) pageTitle.textContent = '記事・ブログ'; renderArticleList(currentPage); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showRankingTable(league) {
    document.querySelectorAll('#rank-buttons .rank-tab-btn').forEach(btn => btn.classList.remove('active'));
    // ...
    const container = document.getElementById('ranking-table-container');
    if (!container) return;

    // ▼▼▼ ここから変更 ▼▼▼
    const { data } = rankingData[league]; // updatedは取得しない
    if (!data || data.length === 0) {
        // ...
        return;
    }

    const isMobile = window.innerWidth <= 768;

    let dateHtml = '';
    if (predictionDataUpdated) { // グローバル変数のpredictionDataUpdatedを参照する
        const updatedDate = new Date(predictionDataUpdated);
        const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        dateHtml = `<p class="update-date-note">更新日時: ${formattedDate}</p>`;
    }

    const headers = Object.keys(data[0]);
    const displayHeaders = isMobile ? headers.filter(h => h !== '勝点') : headers;

    let tableHTML = `<table><thead><tr>`;
    displayHeaders.forEach(h => {
        tableHTML += `<th>${h}</th>`;
    });
    tableHTML += `</tr></thead><tbody>`;

    data.forEach(row => {
        tableHTML += `<tr>`;
        displayHeaders.forEach(h => {
            let cellValue = row[h] || '';
            // ▼▼▼ ここからが変更箇所 ▼▼▼
            if (h === 'チーム名' && isMobile) {
                const normalizedTeamName = toHalfWidth(cellValue);
                let abbreviatedName = cellValue; // デフォルトは元の名前
                for (const key in clubAbbreviations) {
                    if (toHalfWidth(key) === normalizedTeamName) {
                        abbreviatedName = clubAbbreviations[key];
                        break;
                    }
                }
                cellValue = abbreviatedName;
            }
            // ▲▲▲ ここまで ▲▲▲
            tableHTML += `<td>${cellValue}</td>`;
        });
        tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = dateHtml + tableHTML;
}let simInitialized = false;
function getCategoryInfo(score) { if (score >= 50) return { text: 'ビッグクラブ', color: '#ffd700' }; if (score >= 30) return { text: '有望ビッグクラブ', color: '#e94444' }; if (score >= 20) return { text: '潜在的ビッグクラブ', color: '#41cdf4' }; if (score >= 5) return { text: '中堅クラブ', color: '#bbb' }; return { text: 'ローカルクラブ', color: '#999' }; }

function initSimulationPage() {
    const leagueSelect = document.getElementById('sim-league-select');
    if (!leagueSelect) {
        console.error("シミュレーションページの要素が見つかりませんでした。HTMLの構造を確認してください。");
        return;
    }

    if (!simInitialized) {
        const clubSelect = document.getElementById('sim-club-select');
        const inputs = document.querySelectorAll('.sim-input');

        leagueSelect.addEventListener('change', () => {
            populateClubSelect(leagueSelect.value);
        });
        clubSelect.addEventListener('change', () => {
            displayClubData(clubSelect.value);
        });
        inputs.forEach(input => {
            input.addEventListener('input', runSimulation);
        });
        simInitialized = true;
    }

    leagueSelect.innerHTML = '<option value="">まずリーグを選択...</option>';
    ['J1', 'J2', 'J3'].forEach(league => {
        leagueSelect.innerHTML += `<option value="${league}">${league}</option>`;
    });
    populateClubSelect('');
}
function populateClubSelect(league) { const clubSelect = document.getElementById('sim-club-select'); const inputs = document.querySelectorAll('.sim-input'); clubSelect.innerHTML = '<option value="">クラブを選択...</option>'; clubSelect.disabled = true; inputs.forEach(input => { input.value = ''; input.disabled = true; }); document.getElementById('sim-result-area').innerHTML = '<p>クラブを選択すると、ここにスコアが表示されます。</p>'; if (!league) return; const clubsInLeague = clubData.filter(c => c.p === league).sort((a, b) => a.name.localeCompare(b.name, 'ja')); clubsInLeague.forEach(club => { clubSelect.innerHTML += `<option value="${club.name}">${club.name}</option>`; }); clubSelect.disabled = false; }
function displayClubData(clubName) { const inputs = document.querySelectorAll('.sim-input'); const resultArea = document.getElementById('sim-result-area'); if (!clubName) { inputs.forEach(input => { input.value = ''; input.disabled = true; }); resultArea.innerHTML = '<p>クラブを選択すると、ここにスコアが表示されます。</p>'; return; } inputs.forEach(input => input.disabled = false); const club = clubData.find(c => c.name === clubName); if (!club) return; document.getElementById('sim-revenue').value = club.revenue || ''; document.getElementById('sim-audience').value = club.audience || ''; document.getElementById('sim-titles').value = club.titles || ''; document.getElementById('sim-avg-rank').value = club.m || ''; const currentScore = club.sum || 0; const currentCategory = getCategoryInfo(currentScore); resultArea.innerHTML = ` <div class="sim-current-score"> 現在の区分: <span style="color: ${currentCategory.color}; font-weight: bold;">${currentCategory.text}</span><br> 現在のビッグクラブスコア: <strong>${currentScore.toFixed(2)}</strong> </div> <div class="sim-new-score"> <p style="margin:0; font-size:0.8em; color:#ccc;">数値を変更してください</p> </div> `; }
function runSimulation() {
    const clubName = document.getElementById('sim-club-select').value;
    if (!clubName) return;
    const club = clubData.find(c => c.name === clubName);
    if (!club) return;
    const revenue = parseFloat(document.getElementById('sim-revenue').value) || club.revenue;
    const audience = parseInt(document.getElementById('sim-audience').value) || club.audience;
    const titles = parseInt(document.getElementById('sim-titles').value) || club.titles;
    const avgRank = parseFloat(document.getElementById('sim-avg-rank').value) || parseFloat(club.m);
    const currentScore = club.sum || 0;
    const currentCategory = getCategoryInfo(currentScore);
    const newScore = calculateBigClubScore(revenue, audience, titles, avgRank);
    const newCategory = getCategoryInfo(newScore);
    const resultArea = document.getElementById('sim-result-area');

    resultArea.innerHTML = ` <div class="sim-current-score"> 現在の区分: <span style="color: ${currentCategory.color}; font-weight: bold;">${currentCategory.text}</span><br> 現在のビッグクラブスコア: <strong>${currentScore.toFixed(2)}</strong> </div> <div class="sim-new-score"> 予測区分: <span style="color: ${newCategory.color}; font-weight: bold;">${newCategory.text}</span><br> 予測スコア <span class="arrow">→</span> <span class="score-value">${newScore.toFixed(2)}</span> </div> `;
}
function calculateBigClubScore(revenue, audience, titles, avgRank) { if (isNaN(revenue) || isNaN(audience) || isNaN(titles) || isNaN(avgRank) || avgRank > 21) { return 0; } const revenueScore = (revenue / 200) * 100; const audienceScore = (audience / 45000) * 100; const titleScore = (titles / 98) * 100; const rankScore = 21 - avgRank; const totalScore = (revenueScore * 0.3) + (audienceScore * 0.15) + (titleScore * 0.25) + (rankScore * 0.3); return Math.max(0, totalScore); }

function startBannerAutoPlay(interval, nextFunc) {
    stopBannerAutoPlay();
    bannerAutoPlayInterval = setInterval(nextFunc, interval);
}
function stopBannerAutoPlay() {
    clearInterval(bannerAutoPlayInterval);
}

function setupCarousel(carouselId, interval) {
    let carousel = document.getElementById(carouselId); // constからletに変更
    if (!carousel) return;

    // --- ▼▼▼ ここから追加 ▼▼▼ ---
    // イベントリスナーの多重登録を防ぐため、要素ごと再生成して古いリスナーを全てクリアする
    const newCarousel = carousel.cloneNode(true);
    carousel.parentNode.replaceChild(newCarousel, carousel);
    carousel = newCarousel;
    // --- ▲▲▲ ここまで追加 ▲▲▲ ---

    const track = carousel.querySelector('.carousel-track');
    const items = Array.from(track.children);
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');

    const itemsPerScreen = window.innerWidth > 768 ? 2 : 1;

    if (items.length <= itemsPerScreen) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }

    const originalItemCount = items.length;
    for (let i = 0; i < itemsPerScreen; i++) {
        track.appendChild(items[i].cloneNode(true));
    }

    let currentIndex = 0;
    let isAnimating = false;
    const animationTime = 400;
    const cooldownTime = 500;

    function updateTrackPosition() {
        const movePercentage = 100 / itemsPerScreen;
        track.style.transform = `translateX(-${currentIndex * movePercentage}%)`;
    }

    track.addEventListener('transitionend', () => {
        if (currentIndex >= originalItemCount) {
            track.style.transition = 'none';
            currentIndex = 0;
            updateTrackPosition();
            setTimeout(() => {
                track.style.transition = `transform ${animationTime}ms ease-in-out`;
            }, 20);
        }
    });

    function moveToNext() {
        if (isAnimating) return;
        isAnimating = true;
        track.style.transition = `transform ${animationTime}ms ease-in-out`;
        currentIndex++;
        updateTrackPosition();

        setTimeout(() => {
            isAnimating = false;
        }, cooldownTime);
    }

    function moveToPrev() {
        if (isAnimating) return;
        isAnimating = true;

        if (currentIndex <= 0) {
            track.style.transition = 'none';
            currentIndex = originalItemCount;
            updateTrackPosition();

            setTimeout(() => {
                track.style.transition = `transform ${animationTime}ms ease-in-out`;
                currentIndex--;
                updateTrackPosition();
            }, 20);
        } else {
            track.style.transition = `transform ${animationTime}ms ease-in-out`;
            currentIndex--;
            updateTrackPosition();
        }

        setTimeout(() => {
            isAnimating = false;
        }, cooldownTime);
    }

    nextBtn.addEventListener('click', () => {
        stopBannerAutoPlay();
        moveToNext();
        startBannerAutoPlay(interval, moveToNext);
    });
    prevBtn.addEventListener('click', () => {
        stopBannerAutoPlay();
        moveToPrev();
        startBannerAutoPlay(interval, moveToNext);
    });

    carousel.addEventListener('mouseenter', stopBannerAutoPlay);
    carousel.addEventListener('mouseleave', () => startBannerAutoPlay(interval, moveToNext));

    startBannerAutoPlay(interval, moveToNext);
}let attendanceInitialized = false; let attendanceChart = null; function initAttendancePage() { if (attendanceInitialized) return; const yearSelect = document.getElementById('attendance-year-select'); const years = [...new Set(attendanceData.map(d => d.年))].sort((a, b) => b - a); yearSelect.innerHTML = ''; years.forEach(year => { yearSelect.innerHTML += `<option value="${year}">${year}年</option>`; }); yearSelect.addEventListener('change', updateAttendanceFilters); const leagueBtnContainer = document.getElementById('attendance-league-btns'); let leagueBtnsHtml = `<button class="rank-tab-btn active" data-league="all">全て</button>`; const leagues = [...new Set(attendanceData.map(d => d.リーグ))].filter(Boolean).sort(); leagues.forEach(league => { leagueBtnsHtml += `<button class="rank-tab-btn" data-league="${league}">${league}</button>`; }); leagueBtnContainer.innerHTML = leagueBtnsHtml; leagueBtnContainer.querySelectorAll('.rank-tab-btn').forEach(btn => { btn.addEventListener('click', () => { leagueBtnContainer.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); updateAttendanceFilters(); }); }); document.getElementById('attendance-club-select').addEventListener('change', (e) => { if (e.target.value && e.target.value !== 'all') { renderAttendanceChart(e.target.value); } else { updateAttendanceFilters(); } }); updateAttendanceFilters(); attendanceInitialized = true; }
function updateAttendanceFilters() { const selectedYear = parseInt(document.getElementById('attendance-year-select').value); const activeLeagueBtn = document.querySelector('#attendance-league-btns .rank-tab-btn.active'); const selectedLeague = activeLeagueBtn ? activeLeagueBtn.dataset.league : 'all'; const clubSelect = document.getElementById('attendance-club-select'); const clubsForDropdown = attendanceData.filter(d => d.年 === selectedYear && (selectedLeague === 'all' || d.リーグ === selectedLeague)); const clubNames = [...new Set(clubsForDropdown.map(d => d.クラブ))].sort((a, b) => a.localeCompare(b, 'ja')); let optionsHtml = '<option value="all">クラブを選択...</option>'; clubNames.forEach(name => { optionsHtml += `<option value="${name}">${name}</option>`; }); clubSelect.innerHTML = optionsHtml; const dataForTable = attendanceData.filter(d => d.年 === selectedYear && (selectedLeague === 'all' || d.リーグ === selectedLeague)); renderAttendanceTable(dataForTable); }
function renderAttendanceTable(dataToRender) {
    document.getElementById('attendance-chart-wrap').style.display = 'none';
    const outputContainer = document.getElementById('attendance-output-container');
    outputContainer.style.display = 'block';
    const tableData = dataToRender || [];
    const headers = ['順位', 'リーグ', 'クラブ', '平均観客数', '年間最高観客数', '年間最低観客数', 'ゲーム数'];
    const leagueColorMap = { 'J1': '#e94444', 'J2': '#29b6e6', 'J3': '#6cbf6b', 'JFL': '#f2a136', 'default': '#ffffff' };

    let dateHtml = '';
    if (attendanceData.lastModified) {
        const updatedDate = new Date(attendanceData.lastModified);
        const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        dateHtml = `<div style="text-align: right; font-size: 0.85em; color: #aabbcc; margin-bottom: 8px;"> 更新日時: ${formattedDate} </div>`;
    }

    let tableHtml = `<table style="background: #f9fcff; color: #21304c;"> <thead><tr>`;
    headers.forEach(h => tableHtml += `<th style="background: linear-gradient(90deg, #27aee7 65%, #b0e7fa 100%); color: #fff;">${h}</th>`);
    tableHtml += `</tr></thead> <tbody>`;

    tableData.sort((a, b) => b.平均観客数 - a.平均観客数).forEach((row, index) => {
        const leagueColor = leagueColorMap[row.リーグ] || leagueColorMap['default'];
        const isMobile = window.innerWidth <= 768;
        const clubDisplayName = isMobile ? (clubAbbreviations[row.クラブ] || row.クラブ) : row.クラブ;

        const avgAttendance = isMobile ? Math.round(row.平均観客数) : row.平均観客数;
        const maxAttendance = isMobile ? Math.round(row.年間最高観客数) : row.年間最高観客数;
        const minAttendance = isMobile ? Math.round(row.年間最低観客数) : row.年間最低観客数;

        tableHtml += `<tr style="cursor: pointer; background: ${index % 2 === 0 ? '#f2f6fa' : '#ffffff'};" onclick="renderAttendanceChart('${row.クラブ}')" onmouseover="this.style.backgroundColor='#e0f7ff';" onmouseout="this.style.backgroundColor='${index % 2 === 0 ? '#f2f6fa' : '#ffffff'}';">`;
        tableHtml += `<td>${index + 1}</td>`;
        tableHtml += `<td style="background-color: ${leagueColor}; color: #fff; font-weight: bold;">${row.リーグ}</td>`;
        tableHtml += `<td>${clubDisplayName}</td>`;
        tableHtml += `<td>${avgAttendance.toLocaleString()}</td>`;
        tableHtml += `<td>${maxAttendance.toLocaleString()}</td>`;
        tableHtml += `<td>${minAttendance.toLocaleString()}</td>`;
        tableHtml += `<td>${row.ゲーム数}</td></tr>`;
    });

    tableHtml += `</tbody></table>`;
    outputContainer.innerHTML = dateHtml + tableHtml;
}
function renderAttendanceChart(clubName) {
    document.getElementById('attendance-output-container').style.display = 'none';
    const chartWrap = document.getElementById('attendance-chart-wrap');
    const canvas = document.getElementById('attendanceChart');
    chartWrap.style.display = 'block';

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
                x: {
                    type: 'linear',
                    title: { display: true, text: '年', color: '#333' },
                    ticks: {
                        stepSize: 1,
                        callback: function (value) { if (Number.isInteger(value)) return value; }
                    }
                },
                y: { beginAtZero: true, title: { display: true, text: '平均観客数（人）', color: '#333' } }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.raw.league}: ${context.raw.y.toLocaleString()} 人`,
                        title: (context) => `${context[0].raw.x}年`
                    }
                }
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
}
function initEuropeMobilePage() {
    const leagueSelector = document.getElementById('europe-league-selector');
    const playerList = document.getElementById('europe-player-list');

    let buttonsHTML = '<h3>リーグを選択してください</h3>';
    majorLeagues.forEach(league => {
        buttonsHTML += `<button class="rank-tab-btn" style="width:100%; margin: 6px 0; padding: 14px;" onclick="renderEuropePlayerList('${league}')">${league}</button>`;
    });

    leagueSelector.innerHTML = buttonsHTML;
    playerList.innerHTML = '';
    leagueSelector.style.display = 'block';
    playerList.style.display = 'none';
}

function renderEuropePlayerList(leagueName) {
    const leagueSelector = document.getElementById('europe-league-selector');
    const playerList = document.getElementById('europe-player-list');

    const leagueDataName = leagueName === 'ラ・リーガ' ? 'ラリーガ' : (leagueName === 'リーグ・アン' ? 'リーグアン' : leagueName);
    const playersInLeague = playerData.filter(p => p['リーグ'] === leagueDataName).sort((a, b) => (parseInt(a['年齢']) || 99) - (parseInt(b['年齢']) || 99));

    let listHTML = `<button class="rank-tab-btn" style="width:100%; margin: 6px 0 20px 0; padding: 10px; background: #6c757d;" onclick="initEuropeMobilePage()">‹ リーグ選択に戻る</button>`;
    listHTML += `<h3 class="page-subtitle">${leagueName} の日本人選手</h3>`;

    if (playersInLeague.length === 0) {
        listHTML += `<p>このリーグに所属する日本人選手の情報はありません。</p>`;
    } else {
        playersInLeague.forEach(p => {
            listHTML += `
                <div class="player-card-mobile">
                    <div class="player-info">
                        <h3>${p['選手名']}</h3>
                        <p><strong>所属クラブ:</strong> <span>${p['所属クラブ']}</span></p>
                        <p><strong>年齢:</strong> <span>${p['年齢']}</span></p>
                        <p><strong>ポジション:</strong> <span>${p['ポジション']}</span></p>
                    </div>
                    <div class="player-image">
                        <img src="img/player.png" alt="選手アイコン">
                    </div>
                </div>`;
        });
    }

    playerList.innerHTML = listHTML;
    leagueSelector.style.display = 'none';
    playerList.style.display = 'block';
    window.scrollTo(0, 0);
}
function setupFooterButtonObserver() {
    const scoreBtn = document.getElementById('score-method-btn');
    const footer = document.querySelector('.site-footer');

    if (window.innerWidth <= 768) {
        if (scoreBtn) {
            scoreBtn.classList.add('fixed-to-viewport');
        }
        return;
    }

    if (!scoreBtn || !footer) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    scoreBtn.classList.remove('fixed-to-viewport');
                } else {
                    scoreBtn.classList.add('fixed-to-viewport');
                }
            });
        },
        {
            root: null,
            rootMargin: '0px',
            threshold: 0
        }
    );
    observer.observe(footer);
}

function initPredictionPage() {
    const tabsContainer = document.getElementById('prediction-league-tabs');
    if (!tabsContainer) return;

    let tabsHTML = `
        <button class="rank-tab-btn" onclick="showPredictionView('J1')">J1</button>
        <button class="rank-tab-btn" onclick="showPredictionView('J2')">J2</button>
        <button class="rank-tab-btn" onclick="showPredictionView('J3')">J3</button>
        <button id="prediction-help-btn" onclick="document.getElementById('prediction-help-pop').style.display='block'">シーズン予測とは？</button>
    `;
    tabsContainer.innerHTML = tabsHTML;

    showPredictionView('J1');
}

function showPredictionView(league) {
    const tabsContainer = document.getElementById('prediction-league-tabs');
    if (tabsContainer) {
        tabsContainer.querySelectorAll('.rank-tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = tabsContainer.querySelector(`.rank-tab-btn[onclick="showPredictionView('${league}')"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    renderPrediction(league);
}

function renderPrediction(league) {
    const container = document.getElementById('prediction-container');
    const leagueProbs = predictionProbabilities[league];

    if (!leagueProbs) {
        container.innerHTML = '<p style="text-align:center;">予測データを生成できませんでした。</p>';
        return;
    }

    let dateHtml = '';
    if (predictionDataUpdated) {
        const updatedDate = new Date(predictionDataUpdated);
        const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        dateHtml = `<p class="update-date-note">更新日時: ${formattedDate}</p>`;
    }

    const teamList = Object.keys(leagueProbs).map(teamName => ({
        name: teamName,
        ...leagueProbs[teamName]
    }));

    const stableSort = (arr, compareFn) => arr
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
            const order = compareFn(a.item, b.item);
            if (order !== 0) return order;
            return a.index - b.index;
        })
        .map(({ item }) => item);

    const predictions = {
        champion: stableSort(teamList, (a, b) => b.champion - a.champion).slice(0, 5).filter(t => t.champion > 0),
        acl: stableSort(teamList, (a, b) => b.acl - a.acl).slice(0, 5).filter(t => t.acl > 0),
        promotion: stableSort(teamList, (a, b) => b.promotion - a.promotion).slice(0, 5).filter(t => t.promotion > 0),
        relegation: stableSort(teamList, (a, b) => b.relegation - a.relegation).slice(0, 5).filter(t => t.relegation > 0),
        full_ranking: stableSort(teamList, (a, b) => b.safe - a.safe).slice(0, 15)
    };

    const categorySettings = {
        champion: { title: '🏆 優勝確率 TOP5', probKey: 'champion', className: 'champion' },
        acl: { title: '🌐 ACL出場圏確率 TOP5', probKey: 'acl', className: 'acl' },
        promotion: { title: '⬆️ 昇格確率 TOP5', probKey: 'promotion', className: 'promotion' },
        relegation: { title: '⚠️ 降格確立 TOP5', probKey: 'relegation', className: 'relegation' },
        full_ranking: { title: '✅ 残留以上確率 TOP15', probKey: 'safe', className: 'safe' }
    };

    let displayOrder;
    if (league === 'J1') {
        categorySettings.relegation.title = '⚠️ J2降格確立 TOP5';
        displayOrder = ['champion', 'relegation', 'full_ranking', 'acl'];
    } else if (league === 'J2') {
        categorySettings.promotion.title = '⬆️ J1昇格確率 TOP5';
        categorySettings.relegation.title = '⚠️ J3降格確立 TOP5';
        displayOrder = ['promotion', 'relegation', 'full_ranking'];
    } else if (league === 'J3') {
        categorySettings.promotion.title = '⬆️ J2昇格確率 TOP5';
        categorySettings.relegation.title = '⚠️ JFL降格確立 TOP5';
        displayOrder = ['promotion', 'relegation', 'full_ranking'];
    } else {
        displayOrder = [];
    }

    let html = '<div class="prediction-grid">';

    displayOrder.forEach(key => {
        const teams = predictions[key];
        if (!teams || teams.length === 0) return;

        const cat = categorySettings[key];

        html += `
            <div class="prediction-card">
                <div class="prediction-card-header ${cat.className}">
                    ${cat.title}
                </div>
                <div class="prediction-card-body">
                    <ul class="prediction-list">
                        ${teams.map((team, index) => {
            const probability = team[cat.probKey];
            const probText = (probability !== null && typeof probability !== 'undefined') ? `${(probability * 100).toFixed(1)}%` : '';

            return `
                                <li>
                                    <div class="rank-team">
                                      <span class="rank">${index + 1}位</span>
                                      <span class="team-name">${team.name}</span>
                                    </div>
                                    ${probText ? `<span class="probability">${probText}</span>` : ''}
                                </li>`;
        }).join('')}
                    </ul>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = dateHtml + html;
}