// js/pages/stadium.js
import { clubAbbreviations } from '../config.js';
import { getClubData } from '../dataManager.js';

// J1・J2・J3 全60クラブのスタジアムデータ
const stadiumData = [
    // === J1 (20クラブ) ===
    { category: "J2", club: "北海道コンサドーレ札幌", capacity: 38794, isFootball: false, status: "既存", note: "" },
    { category: "J1", club: "鹿島アントラーズ", capacity: 38669, isFootball: true, status: "構想あり", note: "2033年完成を目指した計画発表" },
    { category: "J1", club: "浦和レッズ", capacity: 62010, isFootball: true, status: "既存", note: "" },
    { category: "J1", club: "柏レイソル", capacity: 15109, isFootball: true, status: "既存", note: "" },
    { category: "J1", club: "FC東京", capacity: 47851, isFootball: false, status: "既存", note: "" },
    { category: "J1", club: "東京ヴェルディ", capacity: 47851, isFootball: false, status: "既存", note: "" },
    { category: "J1", club: "FC町田ゼルビア", capacity: 15489, isFootball: false, status: "既存", note: "" },
    { category: "J1", club: "川崎フロンターレ", capacity: 26827, isFootball: false, status: "構想あり", note: "2029年完成を目指した等々力陸上競技場の球技専用化構想" },
    { category: "J1", club: "横浜F・マリノス", capacity: 71822, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "湘南ベルマーレ", capacity: 15380, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "アルビレックス新潟", capacity: 41684, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "ジュビロ磐田", capacity: 15165, isFootball: true, status: "既存", note: "" },
    { category: "J1", club: "名古屋グランパス", capacity: 43739, isFootball: true, status: "既存", note: "" },
    { category: "J1", club: "京都サンガF.C.", capacity: 21623, isFootball: true, status: "既存", note: "2020年開業" },
    { category: "J1", club: "ガンバ大阪", capacity: 39694, isFootball: true, status: "既存", note: "2015年開業" },
    { category: "J1", club: "セレッソ大阪", capacity: 24481, isFootball: true, status: "既存", note: "2021年大規模改修" },
    { category: "J1", club: "ヴィッセル神戸", capacity: 28996, isFootball: true, status: "既存", note: "" },
    { category: "J1", club: "サンフレッチェ広島", capacity: 28520, isFootball: true, status: "既存", note: "2024年開業" },
    { category: "J1", club: "アビスパ福岡", capacity: 21562, isFootball: true, status: "既存", note: "" },
    { category: "J2", club: "サガン鳥栖", capacity: 24130, isFootball: true, status: "既存", note: "" },
    
    // === J2 (20クラブ) ===
    { category: "J2", club: "ベガルタ仙台", capacity: 19526, isFootball: true, status: "既存", note: "" },
    { category: "J2", club: "ブラウブリッツ秋田", capacity: 20125, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "モンテディオ山形", capacity: 21262, isFootball: false, status: "建設中", note: "天童市内に新スタジアム着工開始" },
    { category: "J2", club: "いわきFC", capacity: 5056, isFootball: true, status: "構想あり", note: "将来的な新スタジアム建設構想" },
    { category: "J1", club: "水戸ホーリーホック", capacity: 22002, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "栃木SC", capacity: 25244, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "ザスパ群馬", capacity: 15190, isFootball: false, status: "既存", note: "" },
    { category: "J1", club: "ジェフユナイテッド千葉", capacity: 19470, isFootball: true, status: "既存", note: "" },
    { category: "J2", club: "横浜FC", capacity: 15440, isFootball: true, status: "既存", note: "" },
    { category: "J2", club: "ヴァンフォーレ甲府", capacity: 17000, isFootball: false, status: "既存", note: "" },
    { category: "J1", club: "清水エスパルス", capacity: 19594, isFootball: true, status: "構想あり", note: "JR清水駅東口などに新スタジアム移転構想" },
    { category: "J2", club: "藤枝MYFC", capacity: 10560, isFootball: true, status: "既存", note: "2024年バックスタンド改修完了" },
    { category: "J1", club: "ファジアーノ岡山", capacity: 15479, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "レノファ山口FC", capacity: 15115, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "徳島ヴォルティス", capacity: 17924, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "愛媛FC", capacity: 21000, isFootball: false, status: "既存", note: "" },
    { category: "J1", club: "V・ファーレン長崎", capacity: 20027, isFootball: true, status: "既存", note: "2024年10月開業" },
    { category: "J3", club: "ロアッソ熊本", capacity: 32000, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "大分トリニータ", capacity: 31997, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "鹿児島ユナイテッドFC", capacity: 19934, isFootball: false, status: "既存", note: "" },

    // === J3 (20クラブ) ===
    { category: "J2", club: "ヴァンラーレ八戸", capacity: 5200, isFootball: true, status: "既存", note: "" },
    { category: "J2", club: "栃木シティ", capacity: 5128, isFootball: true, status: "既存", note: "" },
    { category: "J3", club: "福島ユナイテッドFC", capacity: 6859, isFootball: false, status: "既存", note: "" },
    { category: "J2", club: "RB大宮アルディージャ", capacity: 15491, isFootball: true, status: "既存", note: "" },
    { category: "J3", club: "高知ユナイテッドSC", capacity: 25000, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "SC相模原", capacity: 15300, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "松本山雅FC", capacity: 20000, isFootball: true, status: "既存", note: "" },
    { category: "J3", club: "AC長野パルセイロ", capacity: 15491, isFootball: true, status: "既存", note: "" },
    { category: "J2", club: "カターレ富山", capacity: 25250, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "ツエーゲン金沢", capacity: 10444, isFootball: true, status: "既存", note: "2024年開業" },
    { category: "J3", club: "レイラック滋賀", capacity: 15000, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "FC岐阜", capacity: 16310, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "FC大阪", capacity: 26544, isFootball: true, status: "既存", note: "" },
    { category: "J3", club: "奈良クラブ", capacity: 5369, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "ガイナーレ鳥取", capacity: 11999, isFootball: true, status: "既存", note: "" },
    { category: "J3", club: "カマタマーレ讃岐", capacity: 22338, isFootball: false, status: "既存", note: "" },
    { category: "J3", club: "FC今治", capacity: 5316, isFootball: true, status: "既存", note: "2023年開業" },
    { category: "J3", club: "ギラヴァンツ北九州", capacity: 15300, isFootball: true, status: "既存", note: "2017年開業" },
    { category: "J2", club: "テゲバジャーロ宮崎", capacity: 5354, isFootball: true, status: "既存", note: "2021年開業" },
    { category: "J3", club: "FC琉球", capacity: 10189, isFootball: false, status: "構想あり", note: "沖縄市八重島公園などに新スタジアム構想" }
];

// 全体と各カテゴリーの統計パネルを生成する関数
function generateSummaryHtml(data) {
    const getStats = (catData) => {
        const total = catData.length;
        const football = catData.filter(d => d.isFootball).length;
        const newCount = catData.filter(d => d.status === '建設中' || d.status === '構想あり').length;
        return { total, football, newCount };
    };

    const categories = [
        { label: 'Jリーグ全体', data: data, isAll: true },
        { label: 'J1', data: data.filter(d => d.category === 'J1') },
        { label: 'J2', data: data.filter(d => d.category === 'J2') },
        { label: 'J3', data: data.filter(d => d.category === 'J3') }
    ];

    let html = `<div class="stadium-summary-grid">`;
    categories.forEach(cat => {
        const stats = getStats(cat.data);
        const titleClass = cat.isAll ? 'sum-title-all' : 'sum-title-cat';
        html += `
            <div class="summary-box">
                <div class="sum-title ${titleClass}">${cat.label}</div>
                <div class="sum-row">球技専用: <span class="fc-num">${stats.football}</span><span class="sum-total">/${stats.total}</span></div>
                <div class="sum-row">建設・構想: <span class="warn-num">${stats.newCount}</span><span class="sum-total">クラブ</span></div>
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

export default async function renderStadiumPage(container) {
    const summaryPanelHtml = generateSummaryHtml(stadiumData);

    container.innerHTML = `
        <div class="page-subtitle" style="margin-bottom:20px;">
            <p>各クラブのホームスタジアム一覧です。<br class="sp-br">球技専用スタジアムや、新スタジアムの建設・構想状況を確認できます。</p>
            <p class="sp-guide-text" style="display:none; color:#ffd700; font-size:0.85em; margin-top:5px;">※行をタップするとスタジアム詳細が表示されます</p>
        </div>
        
        <!-- 追加した統計パネル -->
        ${summaryPanelHtml}

        <div class="stadium-legend">
            <span class="legend-item">
                <span class="legend-color-box" style="background-color: rgba(40, 167, 69, 0.25); border: 1px solid #28a745;"></span> 球技専用スタジアム
            </span>
            <span class="legend-item"><span class="status-badge status-building">建設中</span> 建設中</span>
            <span class="legend-item"><span class="status-badge status-plan">構想あり</span> 構想・計画あり</span>
        </div>

        <div id="stadium-tabs" class="tabs" style="display: flex; justify-content: center; margin-bottom: 20px;">
            <button class="rank-tab-btn active" data-category="J1">J1</button>
            <button class="rank-tab-btn" data-category="J2">J2</button>
            <button class="rank-tab-btn" data-category="J3">J3</button>
        </div>
        
        <div id="stadium-table-container"></div>
    `;

    // タブ切り替えイベント
    const tabs = container.querySelectorAll('.rank-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderTable(e.target.getAttribute('data-category'));
        });
    });

    // 初期表示はJ1
    renderTable('J1');
}

function renderTable(category) {
    const data = stadiumData.filter(d => d.category === category);
    const globalClubData = getClubData();
    
    // 収容人数が多い順にソート
    data.sort((a, b) => b.capacity - a.capacity);

    let html = `
    <div class="table-scroll-wrapper stadium-wrapper">
        <table class="stadium-table">
            <thead>
                <tr>
                    <th class="col-club">クラブ名</th>
                    <th class="col-capacity">収容人数</th>
                    <th class="col-type">タイプ</th>
                    <th class="col-status pc-only">新スタジアム/改修</th>
                    <th class="col-toggle sp-only"></th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.length === 0) {
        html += `<tr><td colspan="5" style="padding: 30px;">データがありません</td></tr>`;
    } else {
        data.forEach((item, index) => {
            const rowClass = item.isFootball ? 'football-specific-row' : '';
            const typeHtml = item.isFootball ? `<span class="tag-football">球技専用</span>` : `<span class="tag-track">陸上・多目的</span>`;
            
            // クラブ名の略称を取得
            const shortName = clubAbbreviations[item.club] || item.club;
            
            // クラブのチームカラーを取得
            const clubInfo = globalClubData.find(c => c.name === item.club);
            const teamColor = clubInfo && clubInfo.color ? clubInfo.color : '#4a5a7f';
            
            let statusHtml = '';
            let detailHtml = ''; // スマホ展開用のHTML
            
            if (item.status === '建設中') {
                statusHtml = `<span class="status-badge status-building">建設中</span> <span class="note-text-inline">${item.note}</span>`;
                detailHtml = `<span class="status-badge status-building">建設中</span><div class="detail-note">${item.note}</div>`;
            } else if (item.status === '構想あり') {
                statusHtml = `<span class="status-badge status-plan">構想あり</span> <span class="note-text-inline">${item.note}</span>`;
                detailHtml = `<span class="status-badge status-plan">構想あり</span><div class="detail-note">${item.note}</div>`;
            } else if (item.note) {
                statusHtml = `<span class="note-text-inline">${item.note}</span>`;
                detailHtml = `<div class="detail-note">${item.note}</div>`;
            } else {
                statusHtml = `<span style="color:#666;">-</span>`;
                detailHtml = `<div class="detail-note" style="color:#abc;">特記事項なし</div>`;
            }

            // --- メイン行（常に表示） ---
            html += `
                <tr class="stadium-main-row ${rowClass}" data-index="${index}">
                    <td class="club-name-cell" style="border-left: 6px solid ${teamColor};">
                        <span class="pc-name">${item.club}</span>
                        <span class="mobile-name">${shortName}</span>
                    </td>
                    <td class="num-col">${item.capacity.toLocaleString()}</td>
                    <td>${typeHtml}</td>
                    <td class="status-cell pc-only">${statusHtml}</td>
                    <td class="toggle-cell sp-only"><span class="toggle-icon">▼</span></td>
                </tr>
            `;
            
            // --- 詳細行（スマホでタップ時に展開） ---
            html += `
                <tr class="stadium-detail-row detail-${index}" style="display: none;">
                    <td colspan="4" class="detail-cell" style="border-left: 6px solid ${teamColor};">
                        <div class="detail-content">
                            <div class="detail-label">スタジアム情報</div>
                            ${detailHtml}
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;
    
    document.getElementById('stadium-table-container').innerHTML = html;

    // --- スマホ用のアコーディオン（展開/折畳）イベント ---
    const mainRows = document.querySelectorAll('.stadium-main-row');
    mainRows.forEach(row => {
        row.addEventListener('click', function() {
            // スマホ表示幅の時のみ動作
            if (window.innerWidth <= 768) {
                const index = this.getAttribute('data-index');
                const detailRow = document.querySelector(`.detail-${index}`);
                const icon = this.querySelector('.toggle-icon');
                
                if (detailRow.style.display === 'none') {
                    document.querySelectorAll('.stadium-detail-row').forEach(r => r.style.display = 'none');
                    document.querySelectorAll('.toggle-icon').forEach(i => i.textContent = '▼');
                    detailRow.style.display = 'table-row';
                    icon.textContent = '▲';
                } else {
                    detailRow.style.display = 'none';
                    icon.textContent = '▼';
                }
            }
        });
    });
}