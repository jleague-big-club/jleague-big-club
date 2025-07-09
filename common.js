// === common.js ===
// 全ページで共通して必要な、サイトの「土台」となるコード

// === グローバル変数 ===
let clubData = [];
let clubLeagueList = [];
let playerData = [];
let attendanceData = [];
let europeTopClubs = [];
let best11Filter = { type: 'all', value: null };
let rankingData = {};
let isShowingArticleDetail = false;
let bannerAutoPlayInterval;
let predictionProbabilities = {};
let updateDates = {};
let blogPosts = [];
let blogInitialized = false;

const dataLoaded = {
    attendance: false,
    rankings: false,
    europeTop: false,
    prediction: false,
};

// === ヘルパー関数 ===
function toHalfWidth(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[Ａ-Ｚａ-ｚ０-９．・－（）]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  }).replace(/　/g, ' ');
}
const majorLeagues = ["プレミアリーグ", "ラ・リーガ", "ブンデスリーガ", "セリエA", "リーグ・アン"];
const clubAbbreviations = { "北海道コンサドーレ札幌": "札幌", "鹿島アントラーズ": "鹿島", "浦和レッズ": "浦和", "柏レイソル": "柏", "ＦＣ東京": "FC東京", "東京ヴェルディ": "東京V", "ＦＣ町田ゼルビア": "町田", "川崎フロンターレ": "川崎F", "横浜Ｆ・マリノス": "横浜FM", "湘南ベルマーレ": "湘南", "アルビレックス新潟": "新潟", "ジュビロ磐田": "磐田", "名古屋グランパス": "名古屋", "京都サンガF.C.": "京都", "ガンバ大阪": "G大阪", "セレッソ大阪": "C大阪", "ヴィッセル神戸": "神戸", "サンフレッチェ広島": "広島", "アビスパ福岡": "福岡", "サガン鳥栖": "鳥栖", "ベガルタ仙台": "仙台", "ブラウブリッツ秋田": "秋田", "モンテディオ山形": "山形", "いわきＦＣ": "いわき", "水戸ホーリーホック": "水戸", "栃木ＳＣ": "栃木SC", "ザスパ群馬": "群馬", "ジェフユナイテッド千葉": "千葉", "横浜ＦＣ": "横浜FC", "ヴァンフォーレ甲府": "甲府", "清水エスパルス": "清水", "藤枝ＭＹＦＣ": "藤枝", "ファジアーノ岡山": "岡山", "レノファ山口ＦＣ": "山口", "徳島ヴォルティス": "徳島", "愛媛ＦＣ": "愛媛", "Ｖ・ファーレン長崎": "長崎", "ロアッソ熊本": "熊本", "大分トリニータ": "大分", "鹿児島ユナイテッドＦＣ": "鹿児島", "ＦＣ今治":"今治", "ヴァンラーレ八戸": "八戸", "いわてグルージャ盛岡": "岩手", "福島ユナイテッドＦＣ": "福島", "ＲＢ大宮アルディージャ": "大宮", "Ｙ．Ｓ．Ｃ．Ｃ．横浜": "YS横浜", "ＳＣ相模原": "相模原", "松本山雅ＦＣ": "松本", "ＡＣ長野パルセイロ": "長野", "カターレ富山": "富山", "ツエーゲン金沢": "金沢", "アスルクラロ沼津": "沼津", "ＦＣ岐阜": "岐阜", "ＦＣ大阪": "FC大阪", "奈良クラブ": "奈良", "ガイナーレ鳥取": "鳥取", "カマタマーレ讃岐": "讃岐", "ギラヴァンツ北九州": "北九州", "テゲバジャーロ宮崎": "宮崎", "ＦＣ琉球": "琉球", "栃木シティ": "栃木C", "高知ユナイテッドSC": "高知",};
const europeClubAbbreviations = { "レアル・マドリード": "Rマドリード", "マンチェスター・シティ": "マンC", "パリ・サンジェルマン": "PSG", "バイエルン・ミュンヘン": "バイエルン", "マンチェスター・ユナイテッド": "マンU", "トッテナム・ホットスパー": "トッテナム", "リヴァプール": "リヴァプール", "チェルシー": "チェルシー", "アーセナル": "アーセナル", "ユヴェントス": "ユヴェントス", "ボルシア・ドルトムント": "ドルトムント", "アトレティコ・マドリード": "Aマドリード", "インテル・ミラノ": "インテル", "ACミラン": "ミラン", "ウェストハム・ユナイテッド": "ウェストハム", "アストン・ヴィラ": "アストンヴィラ", "ニューカッスル・ユナイテッド": "ニューカッスル", "オリンピック・マルセイユ": "マルセイユ", "オリンピック・リヨン": "リヨン" };


// === モジュール動的読み込み (★ここを修正しました★) ===
const loadedModules = new Set();
// 各ページに必要なJSモジュールを、必要な時だけ読み込むための関数
async function loadModule(moduleName) {
    try {
        // ES Moduleとして動的にインポートします。
        // デバッグ中はキャッシュを無効にするため、末尾にタイムスタンプを追加しています。
        const module = await import(`./modules/${moduleName}.js?v=${new Date().getTime()}`);
        
        // モジュールに initialize という名前の関数があれば、それを実行します。
        if (module.initialize) {
            module.initialize(); 
        }
        loadedModules.add(moduleName);
    } catch (err) {
        console.error(`Error loading module ${moduleName}:`, err);
    }
}


// === ページ表示ロジック (★内部を一部変更★) ===
async function showPage(id, btn, fromPopState = false) {
    try {
        window.scrollTo(0, 0);
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('visible'));
        const targetPage = document.getElementById(id);
        if (targetPage) targetPage.classList.add('visible');

        document.querySelectorAll('.page-title-row').forEach(row => row.style.display = 'none');
        let titleId = (id === 'europe-top20') ? 'europe-top20' : id;
        const pageTitleDiv = document.getElementById('page-title-' + titleId);
        if (pageTitleDiv) pageTitleDiv.style.display = 'flex';
        
        if (id === 'blog' && !isShowingArticleDetail) {
             await loadModule('blog');
             if(typeof showBlogList === 'function') showBlogList();
        } else if (id !== 'blog') {
            const blogContent = document.getElementById('blog-content');
            const blogListContainer = document.getElementById('blog-list-container');
            const pagination = document.getElementById('pagination');
            if(blogContent) blogContent.style.display = 'none';
            if(blogListContainer) blogListContainer.style.display = 'flex';
            if(pagination) pagination.style.display = 'block';
        }

        updateNavActiveState(id, btn);

        const scoreBtn = document.getElementById('score-method-btn');
        const banner = document.querySelector('.carousel-container');
        if (id === 'top') {
            if(scoreBtn) scoreBtn.style.display = 'block';
            if(banner) banner.style.display = 'block';
            // トップページ用の初期化は page-top.js で行うのでここでは何もしない
        } else {
            if(scoreBtn) scoreBtn.style.display = 'none';
            if(banner) banner.style.display = 'none';
            if (typeof stopBannerAutoPlay === 'function') stopBannerAutoPlay();
        }
        
        if (!fromPopState) {
            const state = { page: id };
            const url = `#${id}`;
            history.pushState(state, '', url);
        }

        // === モジュール動的読み込み ===
        // ページIDと同じ名前のJSモジュールを読み込みます (例: 'best11' なら 'best11.js')
        if (id !== 'top') { 
            await loadModule(id);
        }

    } finally {
        const navLinks = document.getElementById('nav-links');
        if (navLinks && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            document.getElementById('menu-overlay').classList.remove('open');
            document.querySelectorAll('.nav-dropdown.menu-open').forEach(menu => menu.classList.remove('menu-open'));
        }
    }
}

function updateNavActiveState(id, btn) {
    document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
    let targetBtn = btn;
    if (!targetBtn) {
        const pageToBtnMap = {'top': '#nav-analysis-btn','metrics': 'button[onclick*="showPage(\'metrics\'"]','attendance': 'button[onclick*="showPage(\'attendance\'"]','history': 'button[onclick*="showPage(\'history\'"]','introduce': 'button[onclick*="showPage(\'introduce\'"]','rankings': '#nav-rankings-btn','prediction': 'button[onclick*="showPage(\'prediction\'"]','simulation': '#nav-simulation-btn','best11': 'button[onclick*="showPage(\'best11\'"]','europe': '#nav-europe-btn','europe-top20': 'button[onclick*="showPage(\'europe-top20\'"]','blog': 'button[onclick*="showPage(\'blog\'"]',};
        if(pageToBtnMap[id]) {
            targetBtn = document.querySelector(pageToBtnMap[id]);
        }
    }
    if (targetBtn) {
        targetBtn.classList.add('active');
        const parentDropdown = targetBtn.closest('.nav-dropdown');
        if (parentDropdown) {
            const mainButton = parentDropdown.querySelector('button');
            if (mainButton) mainButton.classList.add('active');
        }
    }
}

// ブログ記事詳細はどのページからも呼ばれる可能性があるのでcommonに配置
async function showArticleDetail(slug, title, fromPopState = false) {
    await loadModule('blog');
    // renderArticleDetailはblog.js内で定義されている
    if(typeof renderArticleDetail === 'function') {
        renderArticleDetail(slug, title, fromPopState);
    }
}


// common.js の document.addEventListener("DOMContentLoaded", ...) の部分

document.addEventListener("DOMContentLoaded", () => {
    // サイトの基本データ（クラブ、選手、ブログ）を読み込む
    const dataPromise = Promise.all([
        fetch("data/data.csv").then(res => res.ok ? res.text() : Promise.reject(`data.csv: ${res.status}`)),
        fetch("data/playerdata.csv").then(res => res.ok ? res.text() : Promise.reject(`playerdata.csv: ${res.status}`)),
        fetch("/posts/index.json").then(res => res.ok ? res.json() : Promise.reject(`index.json: ${res.status}`))
    ]);

    // データ読み込みが完了したら、thenの中の処理を実行
    dataPromise.then(([clubCsv, playerCsv, blogIndexJson]) => {
        // --- データ整形 ---
        const parseCsv = (csvText) => {
            if (!csvText || typeof csvText !== 'string' || csvText.trim() === '') return [];
            const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) return [];
            const headers = lines[0].split(',').map(h => h.trim());
            return lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => { obj[h] = values[i] ? values[i].trim() : ''; });
                return obj;
            });
        };

        // クラブデータの解析とグローバル変数へのセット
        const parsedClubData = parseCsv(clubCsv);
        if (parsedClubData.length > 0) {
            parsedClubData.forEach(obj => {
                obj.name = obj["クラブ名"] || 'N/A';
                obj.revenue = parseFloat(obj["売上高（億円）"]) || 0;
                obj.audience = parseInt(obj["平均観客動員数"]) || 0;
                obj.titles = parseInt(obj["タイトル計"]) || 0;
                obj.sum = parseFloat(obj["総合的ビッグクラブスコア"]) || 0;
                obj.l = obj["過去10年J1在籍年数"] || '0';
                obj.m = obj["J1在籍10年平均順位"] || 'N/A';
                obj.o = obj["J1在籍10年平均順位スコア"] || 'N/A';
                obj.p = obj["所属リーグ"] || 'N/A';
            });
            parsedClubData.sort((a, b) => b.sum - a.sum);
            window.clubData = parsedClubData; // ★重要: windowオブジェクトに代入
            window.clubLeagueList = parsedClubData;
        } else {
            console.error("クラブデータの解析に失敗しました。");
            window.clubData = [];
            window.clubLeagueList = [];
        }
        
        // 選手データの解析とグローバル変数へのセット
        const parsedPlayerData = parseCsv(playerCsv);
        if (parsedPlayerData.length > 0) {
            window.playerData = parsedPlayerData; // ★重要: windowオブジェクトに代入
        } else {
             console.error("選手データの解析に失敗しました。");
             window.playerData = [];
        }

        // ブログデータの解析
        if (Array.isArray(blogIndexJson)) {
            window.blogPosts = blogIndexJson.sort((a, b) => new Date(b.date) - new Date(a.date));
            window.blogInitialized = true;
        }

        console.log("全基本データの解析が完了しました。");
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここが最重要ポイント ★★★
        // ★★★ すべてのデータ解析が終わったこの場所で、初めてページ表示処理を開始します ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        handleInitialURL();

    }).catch(err => {
        // データ読み込み自体に失敗した場合
        console.error("基本データの読み込みに失敗しました:", err);
        document.body.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">サイトの基本データの読み込みに失敗しました。<br>リロードしてみてください。</div>`;
    });

    // イベントリスナーの設定は、データ読み込みとは非同期で進めてOK
    setupEventListeners();
    updateCopyButtonText();
    window.addEventListener('resize', updateCopyButtonText);
    setupFooterButtonObserver();

    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const { page, slug, title } = event.state;
            if (page === 'blog' && slug) {
                showArticleDetail(slug, title, true);
            } else {
                showPage(page, null, true);
            }
        } else {
            showPage('top', null, true);
        }
    });
});
function handleInitialURL() {
    const hash = location.hash.substring(1);
    if (hash) {
        if (hash.startsWith('blog/')) {
            const slug = hash.replace('blog/', '');
            // blogPostsが読み込まれるのを待つ必要があるかもしれないが、大抵は間に合う
            const post = blogPosts.find(p => p.slug === slug);
            if (post) {
                showArticleDetail(post.slug, post.title);
            } else {
                showPage('top');
            }
        } else {
            const element = document.getElementById(hash);
            if (element && element.classList.contains('page-section')) {
                showPage(hash);
            } else {
                showPage('top');
            }
        }
    } else {
        showPage('top');
        // 最初のページ読み込み時にURLを#topに設定
        history.replaceState({ page: 'top' }, '', '#top');
    }
}


// === データ遅延読み込み関数群 ===
// これらは各モジュールから必要に応じて呼ばれる
async function loadAttendanceData() {
    if (dataLoaded.attendance) return;
    try {
        const [res, datesRes] = await Promise.all([fetch("data/attendancefigure.csv"), fetch("data/update_dates.json")]);
        const [csvText, datesJson] = await Promise.all([res.text(), datesRes.json()]);
        let lines = csvText.trim().split(/\r?\n/); let headers = lines[0].split(",").map(h => h.trim());
        attendanceData = lines.slice(1).map(line => { const values = line.split(","); const obj = {}; headers.forEach((h, i) => { const val = values[i] ? values[i].trim() : ''; if (['年', '年間最高観客数', '年間最低観客数', 'ゲーム数'].includes(h)) { obj[h] = parseInt(val) || 0; } else if (h === '平均観客数') { obj[h] = parseFloat(val) || 0; } else { obj[h] = val; } }); return obj; });
        if(datesJson && datesJson['attendancefigure.csv']) {
            attendanceData.lastModified = datesJson['attendancefigure.csv'];
        }
        dataLoaded.attendance = true;
    } catch(e) { console.error("Attendance data failed to load", e); }
}

async function loadRankingData() {
    if (dataLoaded.rankings) return;
    try {
        const [j1Res, j2Res, j3Res, datesRes] = await Promise.all([fetch("data/j1rank.csv"), fetch("data/j2rank.csv"), fetch("data/j3rank.csv"), fetch("data/update_dates.json")]);
        const [j1Csv, j2Csv, j3Csv, datesJson] = await Promise.all([j1Res.text(), j2Res.text(), j3Res.text(), datesRes.json()]);
        const parse = (csv) => { if (!csv || csv.trim() === '') return []; const lines = csv.trim().split(/\r?\n/); const headers = lines[0].split(",").map(h => h.trim()); return lines.slice(1).map(line => { const values = line.split(","); const obj = {}; headers.forEach((h, i) => { obj[h] = values[i] ? values[i].trim() : ''; }); return obj; }); };
        rankingData['J1'] = { data: parse(j1Csv), updated: datesJson['j1rank.csv'] };
        rankingData['J2'] = { data: parse(j2Csv), updated: datesJson['j2rank.csv'] };
        rankingData['J3'] = { data: parse(j3Csv), updated: datesJson['j3rank.csv'] };
        dataLoaded.rankings = true;
    } catch(e) { console.error("Ranking data failed to load", e); }
}

async function loadPredictionData() {
    if (dataLoaded.prediction) return;
    try {
        const [res, datesRes] = await Promise.all([fetch("data/prediction_probabilities.json"), fetch("data/update_dates.json")]);
        predictionProbabilities = await res.json();
        updateDates = await datesRes.json();
        dataLoaded.prediction = true;
    } catch(e) { console.error("Prediction data failed to load", e); }
}

async function loadEuropeTopClubsData() {
    if (dataLoaded.europeTop) return;
    try {
        const res = await fetch("data/europebigclub.csv");
        const csvText = await res.text();
        const lines = csvText.trim().split(/\r?\n/);
        const parseCsvLine = (line) => { const result = []; let current = ''; let inQuotes = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"') { inQuotes = !inQuotes; } else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; } else { current += char; } } result.push(current.trim()); return result; };
        europeTopClubs = lines.slice(1).map(line => parseCsvLine(line));
        dataLoaded.europeTop = true;
    } catch(e) { console.error("Europe top clubs data failed to load", e); }
}


// === UIイベントリスナーなど ===
function setupEventListeners() {
    const hamburgerBtn = document.getElementById('hamburger-btn'); const navLinks = document.getElementById('nav-links'); const menuOverlay = document.getElementById('menu-overlay'); if (hamburgerBtn && navLinks && menuOverlay) { const toggleMenu = () => { const isOpen = navLinks.classList.toggle('open'); menuOverlay.classList.toggle('open'); if (!isOpen) { document.querySelectorAll('.nav-dropdown.menu-open').forEach(menu => { menu.classList.remove('menu-open'); }); } }; hamburgerBtn.addEventListener('click', toggleMenu); menuOverlay.addEventListener('click', toggleMenu); }
    // 他のページのボタンイベントは各モジュールで設定
    const scoreBtn = document.getElementById("score-method-btn"); const scorePop = document.getElementById("score-method-pop"); const detailLink = document.getElementById("score-detail-link"); const detailPop = document.getElementById("score-detail-pop"); if (scoreBtn) { scoreBtn.onclick = (e) => { e.stopPropagation(); if(scorePop) scorePop.classList.toggle('popup-visible'); if(detailPop) detailPop.classList.remove('popup-visible'); }; } if (detailLink) { detailLink.onclick = (e) => { e.preventDefault(); e.stopPropagation(); if(detailPop) detailPop.classList.add('popup-visible'); }; }
    document.addEventListener("click", (e) => { const board = document.getElementById("club-status-board"); if (board && board.style.display === "block" && !board.contains(e.target) && !e.target.closest("td[onclick^='showClubStatus']")) { board.style.display = "none"; } if (scorePop && scorePop.classList.contains('popup-visible') && !scorePop.contains(e.target) && !scoreBtn.contains(e.target)) { scorePop.classList.remove('popup-visible'); } if (detailPop && detailPop.classList.contains('popup-visible') && !detailPop.contains(e.target) && !detailLink.contains(e.target)) { detailPop.classList.remove('popup-visible'); } const helpPop = document.getElementById('prediction-help-pop'); const helpBtn = document.getElementById('prediction-help-btn'); if (helpPop && helpPop.style.display === 'block' && !helpPop.contains(e.target) && (helpBtn && !helpBtn.contains(e.target))) { helpPop.style.display = 'none'; } const scoreCalcPop = document.querySelector('.score-calc-pop'); const scoreCalcBtn = document.querySelector('.score-calc-btn'); if (scoreCalcBtn && scoreCalcPop) { if (scoreCalcPop.style.display === 'block' && !scoreCalcBtn.contains(e.target)) { scoreCalcPop.style.display = 'none'; } } const openSelect = document.querySelector('.custom-select-container.open'); if (openSelect && !openSelect.contains(e.target)) { openSelect.classList.remove('open'); } });
    const scoreCalcBtn = document.querySelector('.score-calc-btn'); if (scoreCalcBtn) { const scoreCalcPop = scoreCalcBtn.querySelector('.score-calc-pop'); if (scoreCalcPop) { scoreCalcBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const isVisible = scoreCalcPop.style.display === 'block'; scoreCalcPop.style.display = isVisible ? 'none' : 'block'; }); } }
}

function updateCopyButtonText() {
    const copyButton = document.getElementById('copy-best11-img-btn'); if (copyButton) { if (window.innerWidth <= 768) { copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>ダウンロード</span>'; } else { copyButton.innerHTML = '画像をコピー'; } }
}

function setupFooterButtonObserver() {
    const scoreBtn = document.getElementById('score-method-btn'); const footer = document.querySelector('.site-footer'); if (window.innerWidth <= 768) { if (scoreBtn) { scoreBtn.classList.add('fixed-to-viewport'); } return; } if (!scoreBtn || !footer) { return; } const observer = new IntersectionObserver( (entries) => { entries.forEach(entry => { if (entry.isIntersecting) { scoreBtn.classList.remove('fixed-to-viewport'); } else { scoreBtn.classList.add('fixed-to-viewport'); } }); }, { root: null, rootMargin: '0px', threshold: 0 } ); observer.observe(footer);
}

function toggleSubMenu(btn, event) {
    event.preventDefault(); event.stopPropagation(); const parentDropdown = btn.parentElement; if(!parentDropdown) return; document.querySelectorAll('.nav-links .nav-dropdown.menu-open').forEach(openMenu => { if (openMenu !== parentDropdown) { openMenu.classList.remove('menu-open'); } }); parentDropdown.classList.toggle('menu-open');
}

// エクスポート（他のモジュールから使えるようにする）
window.showPage = showPage;
window.toggleSubMenu = toggleSubMenu;
window.toHalfWidth = toHalfWidth;
// グローバル変数は直接 window には付けず、必要なモジュールで import するのがモダンだが、
// 今回の構造では onclick などで直接参照されるため、やむを得ずグローバルに残す
window.clubAbbreviations = clubAbbreviations;
window.europeClubAbbreviations = europeClubAbbreviations;
window.majorLeagues = majorLeagues;
window.clubData = clubData;
window.playerData = playerData;
window.attendanceData = attendanceData;
window.europeTopClubs = europeTopClubs;
window.rankingData = rankingData;
window.predictionProbabilities = predictionProbabilities;
window.updateDates = updateDates;
window.blogPosts = blogPosts;
window.best11Filter = best11Filter;

// データロード関数もグローバルに
window.loadAttendanceData = loadAttendanceData;
window.loadRankingData = loadRankingData;
window.loadPredictionData = loadPredictionData;
window.loadEuropeTopClubsData = loadEuropeTopClubsData;