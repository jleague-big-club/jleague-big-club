import { getClubData, getIntroductionsData } from '../dataManager.js';

let sortCol = 'sum';
let sortAsc = false;

window.toggleDetailRow = (id) => {
    const row = document.getElementById(id);
    const contentDiv = row.querySelector('.detail-content');
    
    if (row.classList.contains('visible')) {
        contentDiv.style.maxHeight = null;
        contentDiv.style.opacity = '0';
        setTimeout(() => {
            row.classList.remove('visible');
            row.style.display = 'none';
        }, 300);
    } else {
        row.style.display = 'table-row';
        requestAnimationFrame(() => {
            row.classList.add('visible');
            contentDiv.style.maxHeight = contentDiv.scrollHeight + "px";
            contentDiv.style.opacity = '1';
        });
    }
};

export async function render(content) {
    const [allData, introData] = await Promise.all([
        getClubData(),
        getIntroductionsData()
    ]);
    
    const jLeagueData = allData.filter(c => c.p !== 'JFL');

    jLeagueData.forEach(club => {
        club.introduction = introData[club.name] || "紹介文データがありません。";
    });

    // ★★★ CSS修正箇所 ★★★
    // スマホ時に数値列(.num-col)を非表示にし、詳細エリア(.mobile-data-view)を表示する設定を追加
    const style = `
        <style>
            .metrics-table-container {
                overflow-x: auto; /* PCでの予備として残すが、スマホではスクロール不要を目指す */
                margin-top: 5px;
                background: #232947;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                border: 1px solid #4a5a7f;
            }
            .metrics-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.95rem;
                min-width: auto; /* スマホで幅を強制しない */
                color: #eaf7fc;
            }
            .metrics-table th, .metrics-table td {
                padding: 14px 12px;
                text-align: left;
                border-bottom: 1px solid #3a486b;
                white-space: nowrap;
            }
            .metrics-table th {
                background: linear-gradient(180deg, #2a3758 0%, #232947 100%);
                cursor: pointer;
                user-select: none;
                font-weight: 700;
                color: #baf7fa;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            .metrics-table th:hover {
                background: #344062;
                color: #fff;
            }
            
            .main-row {
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .main-row:hover {
                background-color: rgba(41, 182, 246, 0.15) !important;
            }
            .main-row:nth-child(4n-3) {
                background-color: rgba(255, 255, 255, 0.02);
            }
            
            .detail-row {
                display: none;
                background-color: #1f253d;
            }
            .detail-row td {
                padding: 0;
                border-bottom: 1px solid #3a486b;
                white-space: normal;
            }
            .detail-content {
                max-height: 0;
                opacity: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
                padding: 0 20px;
                color: #ddd;
                line-height: 1.8;
                font-size: 0.95em;
            }
            .detail-row.visible .detail-content {
                padding: 20px;
            }

            .rank-col { 
                width: 40px; 
                text-align: center !important; 
                font-weight: bold;
                color: #8899bb;
            }
            .main-row .rank-col.top1 { color: gold; font-size: 1.2em; text-shadow: 0 0 10px rgba(255,215,0,0.3); }
            .main-row .rank-col.top2 { color: silver; font-size: 1.15em; }
            .main-row .rank-col.top3 { color: #cd7f32; font-size: 1.1em; }

            .num-col { 
                text-align: right !important; 
                font-family: monospace;
                font-size: 1.05em;
                color: #dbeafe;
            }
            .club-name-cell {
                font-weight: bold;
                color: #fff !important;
                display: flex;
                align-items: center;
            }
            .expand-icon {
                display: inline-block;
                width: 16px;
                text-align: center;
                margin-right: 8px;
                color: #299ad3;
                font-size: 0.8em;
            }

            .intro-header-row {
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
                margin-bottom: 5px;
                flex-wrap: wrap;
                gap: 5px;
            }
            .intro-note-left { color: #eaf7fc; font-size: 0.9em; }
            .intro-note-right { text-align: right; color: #abc; font-size: 0.9em; font-weight: bold; margin-left: auto; }

            /* モバイル用データ表示エリア（PCでは非表示） */
            .mobile-data-view {
                display: none;
                margin-bottom: 15px;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                padding: 10px;
            }
            .mobile-data-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px 15px;
            }
            .mobile-data-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px dashed rgba(255,255,255,0.1);
                padding-bottom: 4px;
            }
            .mobile-data-item .label { color: #abc; font-size: 0.85em; }
            .mobile-data-item .value { color: #fff; font-weight: bold; font-family: monospace; }

            /* ★★★ スマホ表示時の最適化 ★★★ */
            @media (max-width: 768px) {
                /* 数値列を隠す */
                .num-col { display: none; }
                
                /* モバイル用データエリアを表示 */
                .mobile-data-view { display: block; }

                .intro-header-row { flex-direction: column; align-items: flex-start; }
                .intro-note-left { font-size: 0.85em; margin-bottom: 2px; }
                .intro-note-right { font-size: 0.8em; }

                .metrics-table th, .metrics-table td {
                    padding: 12px 10px; /* タップしやすいサイズ */
                    font-size: 0.95rem;
                }
                
                /* クラブ名が長くても省略せず折り返す設定に変更する場合 */
                /* .club-name-cell { white-space: normal; } */
                
                /* リーグ列の幅を固定 */
                .metrics-table th:nth-child(3),
                .metrics-table td:nth-child(3) {
                    text-align: center;
                    width: 50px;
                }
            }
        </style>
    `;

    content.innerHTML = `
        ${style}
        <div class="metrics-page fade-in">
            <div class="intro-header-row">
                <div class="intro-note-left">
                    <span style="color:#299ad3;">▼</span> クラブ名をタップすると詳細データが表示されます
                </div>
                <div class="intro-note-right">
                    ※2025年度のデータ
                </div>
            </div>

            <div id="metrics-table-container" class="metrics-table-container"></div>
            
            <div style="text-align: right; font-size: 0.8em; color: #abc; margin-top: 5px; padding-right: 5px;">
                ※項目名をクリックすると並び替えが可能です
            </div>
        </div>
    `;

    setTimeout(() => {
        const tableContainer = document.getElementById('metrics-table-container');
        if (tableContainer) {
            renderTable(tableContainer, jLeagueData);
        }
    }, 0);
}

function renderTable(container, data) {
    if (!container) return;

    const sortedData = [...data].sort((a, b) => {
        let valA = a[sortCol];
        let valB = b[sortCol];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    let html = `
        <table class="metrics-table">
            <thead>
                <tr>
                    <th onclick="handleMetricsSort('rank')" class="rank-col">#${getSortIndicator('rank')}</th>
                    <th onclick="handleMetricsSort('name')">クラブ名${getSortIndicator('name')}</th>
                    <th onclick="handleMetricsSort('p')">リーグ${getSortIndicator('p')}</th>
                    <!-- 以下の列はスマホで非表示(.num-col) -->
                    <th onclick="handleMetricsSort('sum')" class="num-col">BC指数${getSortIndicator('sum')}</th>
                    <th onclick="handleMetricsSort('revenue')" class="num-col">売上(億)${getSortIndicator('revenue')}</th>
                    <th onclick="handleMetricsSort('audience')" class="num-col">平均入場${getSortIndicator('audience')}</th>
                    <th onclick="handleMetricsSort('titles')" class="num-col">タイトル${getSortIndicator('titles')}</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedData.forEach((club, index) => {
        const rank = index + 1;
        const colorStyle = club.color ? `border-left: 4px solid ${club.color};` : '';
        
        let scoreColor = '#eaf7fc';
        if (club.sum >= 30) scoreColor = '#ffd700';
        else if (club.sum >= 20) scoreColor = '#7dd3fc';

        let rankClass = '';
        if (rank === 1) rankClass = 'top1';
        else if (rank === 2) rankClass = 'top2';
        else if (rank === 3) rankClass = 'top3';

        const detailRowId = `detail-row-${index}`;

        html += `
            <tr class="main-row" onclick="toggleDetailRow('${detailRowId}')">
                <td class="rank-col ${rankClass}">${rank}</td>
                <td style="${colorStyle} padding-left: 12px;" class="club-name-cell">
                    <span class="expand-icon">▼</span>${club.name}
                </td>
                <td style="color: #abc; text-align: center;">${club.p}</td>
                
                <!-- PC用: 通常のセル -->
                <td class="num-col" style="font-weight:bold; color: ${scoreColor}; font-size: 1.1em;">${club.sum.toFixed(1)}</td>
                <td class="num-col">${club.revenue ? club.revenue.toFixed(1) : '-'}</td>
                <td class="num-col">${club.audience ? club.audience.toLocaleString() : '-'}</td>
                <td class="num-col">${club.titles || '0'}</td>
            </tr>
        `;

        // 詳細行（スマホ用データ + 紹介文）
        html += `
            <tr id="${detailRowId}" class="detail-row">
                <td colspan="8">
                    <div class="detail-content">
                        <!-- スマホでのみ表示されるデータグリッド -->
                        <div class="mobile-data-view">
                            <div class="mobile-data-grid">
                                <div class="mobile-data-item">
                                    <span class="label">BC指数</span>
                                    <span class="value" style="color:${scoreColor}; font-size:1.2em;">${club.sum.toFixed(1)}</span>
                                </div>
                                <div class="mobile-data-item">
                                    <span class="label">タイトル</span>
                                    <span class="value">${club.titles || '0'}</span>
                                </div>
                                <div class="mobile-data-item">
                                    <span class="label">売上高</span>
                                    <span class="value">${club.revenue ? club.revenue.toFixed(1) + '億' : '-'}</span>
                                </div>
                                <div class="mobile-data-item">
                                    <span class="label">平均入場</span>
                                    <span class="value">${club.audience ? club.audience.toLocaleString() + '人' : '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; gap:15px; align-items:start;">
                            <div style="flex:1;">
                                <strong style="color:${club.color || '#fff'}; font-size:1.1em;">${club.name}</strong><br>
                                <span style="font-size:0.95em; color:#ddd;">${club.introduction}</span>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function getSortIndicator(col) {
    if (sortCol === 'rank' && col === 'rank') return sortAsc ? '<span class="indicator">▲</span>' : '<span class="indicator">▼</span>';
    if (sortCol !== col) return '<span class="indicator" style="opacity:0.1">↕</span>';
    return sortAsc ? '<span class="indicator">▲</span>' : '<span class="indicator">▼</span>';
}

window.handleMetricsSort = async (col) => {
    if (col === 'rank') {
        if (sortCol === 'sum' && sortAsc === false) {
            sortAsc = true;
        } else {
            sortCol = 'sum';
            sortAsc = false;
        }
    } else {
        if (sortCol === col) {
            sortAsc = !sortAsc;
        } else {
            sortCol = col;
            sortAsc = false;
            if (col === 'name' || col === 'p') sortAsc = true;
        }
    }

    const [allData, introData] = await Promise.all([
        getClubData(),
        getIntroductionsData()
    ]);
    const jLeagueData = allData.filter(c => c.p !== 'JFL');
    jLeagueData.forEach(club => {
        club.introduction = introData[club.name] || "紹介文データがありません。";
    });

    renderTable(document.getElementById('metrics-table-container'), jLeagueData);
};

export default async function (container) {
    await render(container);
}