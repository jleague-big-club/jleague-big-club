// js/pages/rankings.js

import { getRankingData } from '../dataManager.js';
import { toHalfWidth } from '../uiHelpers.js';
import { clubAbbreviations } from '../config.js';

function showRankingTable(league) {
    document.querySelectorAll('#rank-buttons .rank-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`#rank-buttons .rank-tab-btn[onclick="showRankingTable('${league}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const container = document.getElementById('ranking-table-container');
    if (!container) return;

    getRankingData().then(rankingData => {
        const { data, updated } = rankingData[league];
        if (!data || data.length === 0) {
            container.innerHTML = "<p>順位データがありません。</p>";
            return;
        }

        let dateHtml = '';
        if (updated) {
            const updatedDate = new Date(updated);
            const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            // スタイルをCSSに移譲し、クラス名を付与する
            dateHtml = `<p class="update-date-note">更新日時: ${formattedDate}</p>`;
        }

        const headers = Object.keys(data[0]);

        // tableHTMLの開始部分に横スクロール用のラッパーdivを追加
        let tableHTML = `<div class="table-scroll-wrapper"><table><thead><tr>`;

        headers.forEach(h => {
            tableHTML += `<th>${h}</th>`;
        });
        tableHTML += `</tr></thead><tbody>`;

        data.forEach(row => {
            tableHTML += `<tr>`;
            headers.forEach(h => {
                let cellValue = row[h] || '';
                // スマホ表示のときだけチーム名を短縮する
                const isMobile = window.innerWidth <= 768;
                if (h === 'チーム名' && isMobile) {
                    const normalizedTeamName = toHalfWidth(cellValue);
                    let abbreviatedName = cellValue;
                    for (const key in clubAbbreviations) {
                        if (toHalfWidth(key) === normalizedTeamName) {
                            abbreviatedName = clubAbbreviations[key];
                            break;
                        }
                    }
                    cellValue = abbreviatedName;
                }
                tableHTML += `<td>${cellValue}</td>`;
            });
            tableHTML += `</tr>`;
        });
        // tableHTMLの終了部分にラッパーdivの閉じタグを追加
        tableHTML += `</tbody></table></div>`;
        container.innerHTML = dateHtml + tableHTML;
    });
}

// グローバルスコープに公開
window.showRankingTable = showRankingTable;

export default function initRankingPage() {
    const rankButtons = document.getElementById('rank-buttons');
    if (!rankButtons.dataset.initialized) {
        // イベントリスナーはHTMLにonclickで書かれているので不要
        rankButtons.dataset.initialized = 'true';
    }
    showRankingTable('J1');
}