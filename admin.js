document.addEventListener("DOMContentLoaded", () => {
    // === グローバル変数 ===
    let clubData = [], attendanceData = [], predictionData = {}, updateDates = {}, playerData = [], postTexts = {}; // postTextsを追加
    let attendanceChart = null, customChart = null;
    const leagueColors = { J1: '#e60012', J2: '#00a0e9', J3: '#67b52d', other: '#888' };

    // === DOM要素 ===
    const panels = {
        graph: document.getElementById('panel-graph-generator'),
        attendance: document.getElementById('panel-attendance'),
        prediction: document.getElementById('panel-prediction'),
        sns: document.getElementById('panel-sns-post'), // snsパネルを追加
        simulation: document.getElementById('panel-simulation'),
        best11: document.getElementById('panel-best11'),
    };
    const navButtons = document.querySelectorAll('.nav-btn');
    const messageArea = document.getElementById('message-area');

    // === 初期化 ===
    async function initializeDashboard() {
        try {
            await fetchAllData();
            renderAllPanels();
            setupAllEventListeners();
            switchPanel('panel-prediction');
        } catch (error) {
            console.error("ダッシュボード初期化エラー:", error);
            document.body.innerHTML = `<div style="color: #f85149; padding: 20px; text-align: center;">初期化エラー。データファイルの読み込みを確認してください。</div>`;
        }
    }

    // === データ読み込み ===
    async function fetchAllData() {
        // ★★★【修正】latest_post_text.jsonの読み込みを追加 ★★★
        const [clubRes, attRes, predRes, datesRes, playerRes, postRes] = await Promise.all([
            fetch("data/data.csv").catch(e=>null), fetch("data/attendancefigure.csv").catch(e=>null),
            fetch("data/prediction_probabilities.json").catch(e=>null), fetch("data/update_dates.json").catch(e=>null),
            fetch("data/playerdata.csv").catch(e=>null), fetch("data/latest_post_text.json").catch(e=>null),
        ]);
        if (clubRes) {
            const text = await clubRes.text(); let lines = text.trim().split("\n"); let headers = lines[0].split(",").map(h => h.trim());
            clubData = lines.slice(1).map(line => {
                const values = line.split(","); const obj = {}; headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
                return { name: obj["クラブ名"]||'N/A', league: obj["所属リーグ"]||'N/A', revenue: parseFloat(obj["売上高（億円）"])||0, audience: parseInt(obj["平均観客動員数"])||0, titles: parseInt(obj["タイトル計"])||0, sum: parseFloat(obj["総合的ビッグクラブスコア"])||0, avgRank: parseFloat(obj["J1在籍10年平均順位"]) || 21 };
            });
        }
        if (attRes) {
            const text = await attRes.text(); let lines = text.trim().split("\n"); let headers = lines[0].split(",").map(h => h.trim());
            attendanceData = lines.slice(1).map(line => {
                const values = line.split(","); const obj = {}; headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
                return { クラブ: obj.クラブ, 年: parseInt(obj.年), リーグ: obj.リーグ, 平均観客数: parseFloat(obj.平均観客数) };
            });
        }
        if (playerRes) {
            const text = await playerRes.text(); let lines = text.trim().split("\n"); let headers = lines[0].split(",").map(h => h.trim());
            playerData = lines.slice(1).map(line => {
                const vals = line.split(","); const obj = {}; headers.forEach((h, i) => obj[h] = vals[i] ? vals[i].trim() : '');
                return { name: obj["選手名"], club: obj["所属クラブ"], position: obj["ポジション"], league: obj["リーグ"] };
            });
        }
        if (predRes) predictionData = await predRes.json();
        if (datesRes) updateDates = await datesRes.json();
        if (postRes) postTexts = await postRes.json(); // ★★★【修正】postTextsに格納 ★★★
    }
    
    // === パネル切り替え ===
    function switchPanel(panelId) {
        navButtons.forEach(b => b.classList.toggle('active', b.dataset.panel === panelId));
        Object.values(panels).forEach(p => {
            if (p) p.classList.toggle('active', p.id === panelId);
        });
        if(panelId === 'panel-graph-generator' && panels.graph) updateChart();
        if(panelId === 'panel-attendance' && panels.attendance) handleAttendanceViewChange();
        if(panelId === 'panel-prediction' && panels.prediction) renderPredictionCards('J1');
        if(panelId === 'panel-sns-post' && panels.sns) renderSnsPostPanel('J1'); 
        if(panelId === 'panel-simulation' && panels.simulation) runSimulation();
        if(panelId === 'panel-best11' && panels.best11) renderBest11Selectors();
    }

    // === 全パネルのHTMLを動的生成 ===
    function renderAllPanels() {
        if (panels.graph) panels.graph.innerHTML = getGraphGeneratorHTML();
        if (panels.attendance) panels.attendance.innerHTML = getAttendanceAnalysisHTML();
        if (panels.prediction) panels.prediction.innerHTML = getPredictionHTML();
        if (panels.sns) panels.sns.innerHTML = getSnsPostHTML(); 
        if (panels.simulation) panels.simulation.innerHTML = getSimulationHTML();
        if (panels.best11) panels.best11.innerHTML = getBest11HTML();
    }

    // === イベントリスナー設定 ===
    function setupAllEventListeners() {
        navButtons.forEach(btn => btn.addEventListener('click', () => switchPanel(btn.dataset.panel)));
        
        document.getElementById('update-chart-btn')?.addEventListener('click', updateChart);
        document.getElementById('copy-graph-btn')?.addEventListener('click', () => generateImage('graph-capture-area'));
        setupFilterButtonListeners('graph-club-filters', 'graph-club-checkboxes');
        
        document.getElementById('attendance-view-btns')?.addEventListener('click', handleAttendanceViewChange);
        document.getElementById('attendance-league-select')?.addEventListener('change', handleAttendanceViewChange);
        document.getElementById('attendance-club-select')?.addEventListener('change', handleAttendanceViewChange);
        document.getElementById('copy-attendance-btn')?.addEventListener('click', () => generateImage('attendance-capture-area'));
        
        document.getElementById('prediction-league-tabs')?.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') renderPredictionCards(e.target.dataset.league);
        });
        document.getElementById('prediction-cards-container')?.addEventListener('click', (e) => {
            const button = e.target.closest('.copy-btn[data-capture-id]');
            if (button) generateImage(button.dataset.captureId);
        });

        // ★★★【修正】SNSパネル用のイベントリスナーを追加 ★★★
        document.getElementById('sns-post-tabs')?.addEventListener('click', (e) => {
            if(e.target.tagName === 'BUTTON') renderSnsPostPanel(e.target.dataset.league);
        });
        document.getElementById('sns-copy-button')?.addEventListener('click', () => {
            const textarea = document.getElementById('sns-post-textarea');
            textarea.select();
            navigator.clipboard.writeText(textarea.value);
            messageArea.textContent = 'コピーしました！';
            setTimeout(() => { messageArea.textContent = ''; }, 2000);
        });
        
        document.getElementById('sim-club-select')?.addEventListener('change', (e) => {
            const club = clubData.find(c => c.name === e.target.value);
            if (club) {
                document.getElementById('sim-revenue').value = club.revenue;
                document.getElementById('sim-audience').value = club.audience;
                document.getElementById('sim-titles').value = club.titles;
                document.getElementById('sim-avg-rank').value = club.avgRank;
            }
            runSimulation();
        });
        document.querySelectorAll('.sim-input').forEach(input => input.addEventListener('input', runSimulation));
        document.getElementById('copy-sim-btn')?.addEventListener('click', () => generateImage('sim-capture-area'));
        
        document.getElementById('best11-controls')?.addEventListener('input', (e) => {
            if (e.target.id === 'best11-club-filter' || e.target.classList.contains('best11-formation-btn')) {
                renderBest11Selectors();
            }
            renderBest11Court();
        });
        document.getElementById('copy-best11-btn')?.addEventListener('click', () => generateImage('best11-capture-core'));
    }
    
    // === 機能別ロジックとHTMLテンプレート (既存の関数は省略) ===
    
    // (getGraphGeneratorHTML, updateChart, getAttendanceAnalysisHTML, ... , runSimulation, getBest11HTML, ... は変更なし)
    
    // --- (省略された既存の関数群) ---
    function getGraphGeneratorHTML() {
        const clubCheckboxes = clubData.sort((a,b) => a.name.localeCompare(b.name, 'ja')).map(c => `<div class="checkbox-item"><input type="checkbox" id="graph-cb-${c.name}" value="${c.name}" data-league="${c.league}" checked><label for="graph-cb-${c.name}">${c.name}</label></div>`).join('');
        return `
            <div class="controls">
                <h2>グラフ設定</h2>
                <div class="control-grid">
                    <div class="control-group"><label>タイトル:</label><input type="text" id="title-input" placeholder="例: J1クラブ売上高ランキング"></div>
                    <div class="control-group"><label>指標:</label><select id="metric-select"><option value="revenue" data-unit="億円">売上高</option><option value="audience" data-unit="人">平均観客数</option><option value="titles" data-unit="個">累計タイトル数</option><option value="sum" data-unit="pt">ビッグクラブスコア</option></select></div>
                    <div class="control-group"><label>並び順:</label><select id="sort-select"><option value="metric_desc">指標の降順</option><option value="score_desc">スコア順</option></select></div>
                    <div class="control-group"><label>表示件数:</label><select id="limit-select"><option value="10">上位10件</option><option value="20">上位20件</option><option value="all" selected>すべて</option></select></div>
                </div>
                <div class="control-group"><label>表示クラブ:</label><div class="filter-buttons" id="graph-club-filters"><button class="filter-btn" data-action="check-all">全選択</button><button class="filter-btn" data-action="uncheck-all">全解除</button><button class="filter-btn" data-league="J1">J1</button><button class="filter-btn" data-league="J2">J2</button><button class="filter-btn" data-league="J3">J3</button></div><div id="graph-club-checkboxes" class="checkbox-container">${clubCheckboxes}</div></div>
                <button id="update-chart-btn" class="main-action-btn">グラフを更新</button>
            </div>
            <div id="graph-capture-area" class="capture-area"><h2 class="capture-title" id="chart-title-display"></h2><div class="chart-container"><canvas id="custom-chart"></canvas></div><div class="chart-legend" id="chart-legend"></div><div class="capture-footer">BigClub-Japan.com</div></div>
            <div class="actions"><button id="copy-graph-btn" class="copy-btn">画像をコピー</button></div>`;
    }
    function updateChart() {
        const select = document.getElementById('metric-select');
        const selectedMetric = select.value; const unit = select.options[select.selectedIndex].dataset.unit;
        const sort = document.getElementById('sort-select').value; const limit = document.getElementById('limit-select').value;
        const title = document.getElementById('title-input').value.trim();
        const selectedClubs = Array.from(document.querySelectorAll('#graph-club-checkboxes input:checked')).map(cb => cb.value);
        let displayData = clubData.filter(c => selectedClubs.includes(c.name));
        
        if (sort === 'metric_desc') displayData.sort((a, b) => b[selectedMetric] - a[selectedMetric]);
        else if (sort === 'score_desc') displayData.sort((a, b) => b.sum - a.sum);
        if (limit !== 'all') displayData = displayData.slice(0, parseInt(limit));
        
        document.getElementById('chart-title-display').textContent = title || `${select.options[select.selectedIndex].textContent} TOP${displayData.length}`;
        const dataValues = displayData.map(c => c[selectedMetric]);
        const suggestedMax = Math.max(...dataValues) > 0 ? Math.max(...dataValues) * 1.15 : 10;
        const backgroundColors = displayData.map(c => leagueColors[c.league] || leagueColors.other);

        document.getElementById('chart-legend').innerHTML = Object.entries(leagueColors).filter(([key])=>key!=='other').map(([key, color]) => `
            <div class="legend-item"><span class="legend-color-box" style="background-color:${color};"></span>${key}</div>`).join('');
        
        const ctx = document.getElementById('custom-chart').getContext('2d');
        if (customChart) customChart.destroy();
        customChart = new Chart(ctx, {
            type: 'bar', data: { labels: displayData.map(c => c.name), datasets: [{ data: dataValues, backgroundColor: backgroundColors }] },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.parsed.x.toLocaleString()} ${unit}` } }, datalabels: { anchor: 'end', align: 'end', formatter: (v) => v.toLocaleString(), color: '#c9d1d9', font: { weight: 'bold', size: 12 } } },
                scales: { x: { suggestedMax: suggestedMax, ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }, y: { ticks: { color: '#c9d1d9', font: { size: 13 } }, grid: { display: false } } }
            },
            plugins: [ChartDataLabels]
        });
    }

    function getAttendanceAnalysisHTML() {
        const clubOptions = clubData.sort((a,b)=>a.name.localeCompare(b.name,'ja')).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        return `
            <div class="controls">
                <h2>観客数データ分析</h2>
                <div class="control-grid single-col">
                    <div class="control-group"><label>表示切替:</label><div class="filter-buttons" id="attendance-view-btns"><button class="filter-btn active" data-view="record">最高記録更新クラブ</button><button class="filter-btn" data-view="ranking">ランキング</button><button class="filter-btn" data-view="club">クラブ別推移</button></div></div>
                    <div id="attendance-ranking-controls" style="display:none;"><div class="control-group"><label>リーグ:</label><select id="attendance-league-select"><option value="all">全体</option><option value="J1">J1</option><option value="J2">J2</option><option value="J3">J3</option></select></div></div>
                    <div id="attendance-club-controls" style="display:none;"><div class="control-group"><label>クラブ:</label><select id="attendance-club-select"><option value="">選択...</option>${clubOptions}</select></div></div>
                </div>
            </div>
            <div id="attendance-capture-area" class="capture-area"><h2 class="capture-title" id="attendance-title"></h2><div id="attendance-result"></div></div>
            <div class="actions"><button id="copy-attendance-btn" class="copy-btn">画像をコピー</button></div>`;
    }
    function handleAttendanceViewChange(e) {
        if(e?.target.tagName === 'BUTTON') {
            document.querySelectorAll('#attendance-view-btns button').forEach(b=>b.classList.remove('active'));
            e.target.classList.add('active');
        }
        const view = document.querySelector('#attendance-view-btns .active').dataset.view;
        document.getElementById('attendance-ranking-controls').style.display = view === 'ranking' ? 'block' : 'none';
        document.getElementById('attendance-club-controls').style.display = view === 'club' ? 'block' : 'none';
        
        const titleEl = document.getElementById('attendance-title'), resultEl = document.getElementById('attendance-result');

        if (view === 'record') {
            titleEl.textContent = `🎉 2025年 平均観客数 過去最高更新クラブ一覧`;
            const year = 2025;
            const targetClubs = attendanceData.filter(d => d.年 === year).map(d => d.クラブ);
            const recordHighClubs = [];
            targetClubs.forEach(name => {
                const history = attendanceData.filter(d => d.クラブ === name && d.年 <= year);
                if (history.length < 2) return;
                const current = history.find(d => d.年 === year);
                const max = Math.max(...history.filter(d=>d.年 < year).map(d => d.平均観客数));
                if (current && current.平均観客数 > max) recordHighClubs.push({ name, current: current.平均観客数, league: current.リーグ });
            });
            let html = `<ul class="result-list">`;
            if (recordHighClubs.length > 0) html += recordHighClubs.sort((a,b)=>b.current-a.current).map(c=>`<li><div class="club-info">📈<div class="club-name">${c.name} (${c.league})</div></div> <div class="record-info">平均: <span>${Math.round(c.current).toLocaleString()}人</span></div></li>`).join('');
            else html += `<p class="placeholder" style="padding: 20px 0;">該当クラブはありませんでした。</p>`;
            resultEl.innerHTML = html + `</ul>`;
        } else if (view === 'ranking') {
            const league = document.getElementById('attendance-league-select').value;
            titleEl.textContent = `2025年 平均観客数ランキング (${league==='all'?'全体':league})`;
            let rankedData = attendanceData.filter(d => d.年 === 2025);
            if (league !== 'all') rankedData = rankedData.filter(d => d.リーグ === league);
            rankedData.sort((a,b) => b.平均観客数 - a.平均観客数);
            resultEl.innerHTML = `<div class="attendance-table-container"><table class="attendance-table"><thead><tr><th>順位</th><th>クラブ</th><th>平均観客数</th></tr></thead><tbody>${rankedData.map((d, i) => `<tr><td>${i+1}</td><td>${d.クラブ} (${d.リーグ})</td><td>${Math.round(d.平均観客数).toLocaleString()}</td></tr>`).join('')}</tbody></table></div>`;
        } else if (view === 'club') {
            const clubName = document.getElementById('attendance-club-select').value;
            if (!clubName) { titleEl.textContent = 'クラブを選択してください'; resultEl.innerHTML = ''; return; }
            titleEl.textContent = `${clubName} 平均観客数推移`;
            const clubHistory = attendanceData.filter(d => d.クラブ === clubName).sort((a,b)=>a.年-b.年);
            resultEl.innerHTML = `<div class="chart-container" style="height:400px;"><canvas id="attendance-chart"></canvas></div>`;
            const ctx = document.getElementById('attendance-chart').getContext('2d');
            if(attendanceChart) attendanceChart.destroy();
            attendanceChart = new Chart(ctx, { type: 'line', data: { labels: clubHistory.map(d => d.年), datasets: [{ label: '平均観客数', data: clubHistory.map(d => d.平均観客数), borderColor: 'var(--accent-color)', tension: 0.1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        }
    }
    
    function getPredictionHTML() {
        const updated = updateDates['prediction_probabilities.json'] ? new Date(updateDates['prediction_probabilities.json']).toLocaleString('ja-JP') : 'N/A';
        return `
            <div class="controls">
                <h2>シーズン終了時 順位確率</h2>
                <div class="control-grid single-col"><div class="control-group">
                    <label>リーグ選択:</label>
                    <div class="filter-buttons" id="prediction-league-tabs">
                        <button class="filter-btn active" data-league="J1">J1</button><button class="filter-btn" data-league="J2">J2</button><button class="filter-btn" data-league="J3">J3</button>
                    </div>
                </div></div>
                <p class="update-date-note">データ更新日時: ${updated}</p>
            </div>
            <div id="prediction-cards-container" class="analysis-cards"></div>`;
    }
    // admin.js の中の renderPredictionCards 関数を以下のように修正してください。
// (他の関数は変更不要です)

function renderPredictionCards(league) {
    document.querySelectorAll('#prediction-league-tabs button').forEach(b => b.classList.remove('active'));
    document.querySelector(`#prediction-league-tabs button[data-league="${league}"]`)?.classList.add('active');
    const container = document.getElementById('prediction-cards-container');
    const leagueProbs = predictionData[league];
    if (!leagueProbs) { container.innerHTML = '<p class="placeholder">予測データなし</p>'; return; }
    
    const teams = Object.keys(leagueProbs).map(name => ({ name, ...leagueProbs[name] }));
    const cats = {
        champion: { title: '優勝', key: 'champion', class: 'champion', icon: '🏆' }, 
        acl: { title: 'ACL圏内', key: 'acl', class: 'acl', icon: '🌏' },
        promotion: { title: '昇格', key: 'promotion', class: 'promotion', icon: '⬆️' }, 
        relegation: { title: '降格', key: 'relegation', class: 'relegation', icon: '⬇️' },
        safe: { title: '残留以上', key: 'safe', class: 'safe', icon: '✅' }
    };
    
    let order;
    if (league === 'J1') { 
        order = ['champion', 'acl', 'relegation', 'safe'];
    } else {
        cats.promotion.title = league === 'J2' ? 'J1昇格' : 'J2昇格'; 
        cats.relegation.title = league === 'J2' ? 'J3降格' : 'JFL降格';
        order = ['promotion', 'relegation', 'safe'];
    }

    let dateStr = "";
    if (updateDates['prediction_probabilities.json']) {
        const d = new Date(updateDates['prediction_probabilities.json']);
        dateStr = `${d.getMonth()+1}月${d.getDate()}日時点`;
    }

    container.innerHTML = order.map(catKey => {
        const cat = cats[catKey];
        const sorted = teams.sort((a, b) => b[cat.key].prob - a[cat.key].prob).slice(0, 20);
        
        const renderRows = (arr, startIndex) => arr.map((t, i) => {
            const probData = t[cat.key];
            const probability = probData.prob;
            const change = probData.change;

            let changeHtml = '';
            if (change === 'up') changeHtml = '<span class="change-arrow up">▲</span>';
            else if (change === 'down') changeHtml = '<span class="change-arrow down">▼</span>';
            else changeHtml = '<span class="change-arrow flat">–</span>';

            return `<tr><td class="rank">${startIndex + i + 1}</td><td class="club">${t.name}</td><td class="prob">${changeHtml}${(probability*100).toFixed(1)}%</td></tr>`;
        }).join('');

        const leftHalf = sorted.slice(0, 10);
        const rightHalf = sorted.slice(10, 20);

        return `<div class="prediction-wrapper">
            <div id="pred-card-${catKey}" class="capture-area prediction-card">
                <div class="card-header ${cat.class}">
                    <span>${cat.icon} ${cat.title} 確率 Top 20</span>
                    <span style="font-size: 0.85rem; color: var(--subtext-color); font-weight: normal; margin-left: auto;">${dateStr}</span>
                </div>
                <div class="card-body" style="display: flex; gap: 15px; padding: 15px;">
                    <div style="flex: 1;"><table class="prediction-table"><tbody>${renderRows(leftHalf, 0)}</tbody></table></div>
                    <div style="width: 1px; background-color: var(--border-color); margin: 10px 0;"></div>
                    <div style="flex: 1;"><table class="prediction-table"><tbody>${renderRows(rightHalf, 10)}</tbody></table></div>
                </div>
            </div>
            <div class="actions" style="margin-top: -5px;"><button class="copy-btn" data-capture-id="pred-card-${catKey}">コピー</button></div>
        </div>`;
    }).join('');
}

    // ★★★【新規】SNS投稿案パネルのHTMLとロジック ★★★
    function getSnsPostHTML() {
        return `
            <div class="controls">
                <h2>AI生成 SNS投稿案</h2>
                <div id="sns-post-tabs" class="sns-post-controls">
                    <button class="filter-btn active" data-league="J1">J1</button>
                    <button class="filter-btn" data-league="J2">J2</button>
                    <button class="filter-btn" data-league="J3">J3</button>
                </div>
                <textarea id="sns-post-textarea" placeholder="ここに投稿文が表示されます..."></textarea>
                <button id="sns-copy-button" class="sns-copy-button">クリップボードにコピー</button>
            </div>`;
    }
    // ★★★【修正】この関数を丸ごと置き換えてください ★★★
    function renderSnsPostPanel(league) {
        // タブのアクティブ状態を切り替え
        document.querySelectorAll('#sns-post-tabs button').forEach(b => b.classList.remove('active'));
        document.querySelector(`#sns-post-tabs button[data-league="${league}"]`).classList.add('active');
        
        const textarea = document.getElementById('sns-post-textarea');
        if (textarea) {
            // テキストエリアに内容をセット
            textarea.value = postTexts[league] || `AIによる${league}の投稿文はありませんでした。`;
            
            // ★★★【最終手段】JavaScriptで直接高さを強制設定 ★★★
            textarea.style.height = '200px';
            textarea.style.width = '300px';
        }
    }
    
    function getSimulationHTML() {
        const clubOptions = clubData.sort((a,b)=>a.name.localeCompare(b.name,'ja')).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        return `
            <div id="sim-capture-area" class="capture-area sim-container">
                <h2 class="capture-title">ビッグクラブ シミュレーター</h2>
                <div class="sim-controls"><div class="control-group"><label>クラブ選択</label><select id="sim-club-select"><option value="">選択してください...</option>${clubOptions}</select></div></div>
                <div class="sim-input-grid">
                    <div class="sim-input-group"><label>売上高 (億円)</label><input type="number" id="sim-revenue" class="sim-input"></div>
                    <div class="sim-input-group"><label>平均観客動員数</label><input type="number" id="sim-audience" class="sim-input"></div>
                    <div class="sim-input-group"><label>累計タイトル数</label><input type="number" id="sim-titles" class="sim-input"></div>
                    <div class="sim-input-group"><label>過去10年 J1平均順位</label><input type="number" step="0.1" id="sim-avg-rank" class="sim-input"></div>
                </div>
                <div id="sim-result-area"></div>
                <div class="capture-footer" style="margin-top:20px;">BigClub-Japan.com</div>
            </div>
            <div class="actions"><button id="copy-sim-btn" class="copy-btn">画像をコピー</button></div>`;
    }
    function runSimulation() {
        const clubName = document.getElementById('sim-club-select').value;
        const resultArea = document.getElementById('sim-result-area');
        if (!clubName) { resultArea.innerHTML = ''; return; }
        const club = clubData.find(c => c.name === clubName);
        const revenue = parseFloat(document.getElementById('sim-revenue').value) || club.revenue;
        const audience = parseInt(document.getElementById('sim-audience').value) || club.audience;
        const titles = parseInt(document.getElementById('sim-titles').value) || club.titles;
        const avgRank = parseFloat(document.getElementById('sim-avg-rank').value) || club.avgRank;
        
        const calcScore = (r, a, rank, t) => (r/200*100*0.3) + (a/45000*100*0.15) + (t/98*100*0.25) + ((21-rank)*0.3);
        const currentScore = club.sum; const newScore = calcScore(revenue, audience, avgRank, titles);
        const getCategoryInfo = score => { if (score > 60) return { text: "ビッグクラブ", color: "var(--yellow-color)" }; if(score > 40) return { text: "強豪クラブ", color: "var(--accent-color)"}; return { text: "その他", color: "var(--subtext-color)"}};
        const currentCategory = getCategoryInfo(currentScore); const newCategory = getCategoryInfo(newScore);

        resultArea.innerHTML = `
            <div class="sim-score-display">
                <div class="sim-score-box" style="background-color:rgba(139,148,158,0.1)">
                    <h3>現在のスコア</h3><p>${currentScore.toFixed(2)}</p><p class="category" style="color:${currentCategory.color}">${currentCategory.text}</p>
                </div>
                <div class="sim-score-box" style="background-color:rgba(88,166,255,0.1)">
                    <h3>予測スコア</h3><p style="color:var(--accent-color)">${newScore.toFixed(2)}</p><p class="category" style="color:${newCategory.color}">${newCategory.text}</p>
                </div>
            </div>`;
    }

    function getBest11HTML() {
        const clubOptions = [...new Set(playerData.map(p=>p.club))].sort().map(c=>`<option value="${c}">${c}</option>`).join('');
        return `
            <div class="controls best11-controls" id="best11-controls">
                <h2>ベスト11 メーカー</h2>
                <div class="control-grid">
                    <div class="control-group"><label>フォーメーション:</label><div class="filter-buttons"><button class="best11-formation-btn filter-btn active" data-formation="4-3-3">4-3-3</button><button class="best11-formation-btn filter-btn" data-formation="3-4-3">3-4-3</button></div></div>
                    <div class="control-group"><label>クラブフィルター:</label><select id="best11-club-filter"><option value="all">全クラブ</option>${clubOptions}</select></div>
                </div>
                <div id="best11-selectors"></div>
            </div>
            <div id="best11-capture-area" class="capture-area"><h2 class="capture-title" id="best11-title">あなたのベストイレブン</h2><div id="best11-capture-core" class="best11-capture-core"><img src="img/court.png" alt="コート" id="best11-court-img"><div class="court-players" id="court-players"></div><div class="best11-logo">BigClub-Japan.com</div></div></div>
            <div class="actions"><button id="copy-best11-btn" class="copy-btn">画像をコピー</button></div>`;
    }
    function renderBest11Selectors() {
        const container = document.getElementById('best11-selectors');
        const formation = document.querySelector('.best11-formation-btn.active').dataset.formation;
        const clubFilter = document.getElementById('best11-club-filter').value;
        const positions = formation === '4-3-3' ? {GK:1, DF:4, MF:3, FW:3} : {GK:1, DF:3, MF:4, FW:3};
        
        const filteredPlayers = clubFilter === 'all' ? playerData : playerData.filter(p => p.club === clubFilter);
        const playerOptions = (pos) => filteredPlayers.filter(p => p.position === pos).map(p => `<option value="${p.name}">${p.name} (${p.club})</option>`).join('');

        let html = '';
        for (const [pos, count] of Object.entries(positions)) {
            html += `<div class="control-group"><label>${pos} (${count}名)</label><div class="control-grid" style="grid-template-columns:1fr;">`;
            for (let i = 0; i < count; i++) {
                html += `<select class="best11-pos-select" data-pos="${pos}" data-index="${i}"><option value="">選手を選択...</option>${playerOptions(pos)}</select>`;
            }
            html += `</div></div>`;
        }
        container.innerHTML = html;
        renderBest11Court();
    }
    function renderBest11Court() {
        const formation = document.querySelector('.best11-formation-btn.active').dataset.formation;
        const coords = formation === '4-3-3' ? {GK:[{t:'88%',l:'50%'}], DF:[{t:'72%',l:'18%'},{t:'75%',l:'40%'},{t:'75%',l:'60%'},{t:'72%',l:'82%'}], MF:[{t:'50%',l:'25%'},{t:'55%',l:'50%'},{t:'50%',l:'75%'}], FW:[{t:'28%',l:'20%'},{t:'22%',l:'50%'},{t:'28%',l:'80%'}]}
                                          : {GK:[{t:'88%',l:'50%'}], DF:[{t:'75%',l:'25%'},{t:'78%',l:'50%'},{t:'75%',l:'75%'}], MF:[{t:'55%',l:'18%'},{t:'58%',l:'40%'},{t:'58%',l:'60%'},{t:'55%',l:'82%'}], FW:[{t:'28%',l:'25%'},{t:'22%',l:'50%'},{t:'28%',l:'75%'}]};
        let html = '';
        document.querySelectorAll('.best11-pos-select').forEach(sel => {
            const pos = sel.dataset.pos, index = parseInt(sel.dataset.index);
            const coord = coords[pos][index];
            const playerName = sel.value || pos;
            html += `<div class="player-label ${sel.value?'':'unselected'}" style="top:${coord.t}; left:${coord.l};">${playerName}</div>`;
        });
        document.getElementById('court-players').innerHTML = html;
    }

    function setupFilterButtonListeners(containerId, checkboxContainerId) {
        document.getElementById(containerId)?.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll(`#${containerId} button`).forEach(b=>b.classList.remove('active'));
            e.target.classList.add('active');
            const { action, league } = e.target.dataset;
            document.querySelectorAll(`#${checkboxContainerId} input`).forEach(cb => {
                if (action === 'check-all') cb.checked = true;
                else if (action === 'uncheck-all') cb.checked = false;
                else if (league) cb.checked = cb.dataset.league === league;
            });
        });
    }

    async function generateImage(elementId) {
        const target = document.getElementById(elementId);
        if (!target) {
            messageArea.textContent = '対象要素が見つかりません。';
            setTimeout(() => { messageArea.textContent = ''; }, 3000);
            return;
        }
        messageArea.textContent = '画像生成中...';
        const originalInlineStyles = new Map();
        const elementsToStyle = [target, ...target.querySelectorAll('*')];
        elementsToStyle.forEach(el => {
            originalInlineStyles.set(el, el.style.cssText);
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 50));
            const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: null });
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => b ? resolve(b) : reject(new Error("画像Blobの生成に失敗しました。")));
            });

            if (navigator.clipboard?.write) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                messageArea.textContent = 'コピーしました！';
            } else {
                messageArea.textContent = 'お使いのブラウザはコピー機能に非対応です。';
            }
        } catch (err) {
            console.error("Image generation failed:", err);
            messageArea.textContent = '画像生成に失敗しました。';
        } finally {
            originalInlineStyles.forEach((style, el) => {
                el.style.cssText = style;
            });
            setTimeout(() => { messageArea.textContent = ''; }, 3000);
        }
    }
    
    // === 実行 ===
    initializeDashboard();
});