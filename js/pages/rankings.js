// js/pages/rankings.js

import { getRankingData } from '../dataManager.js';
import { toHalfWidth } from '../uiHelpers.js';
import { clubAbbreviations } from '../config.js';

const borderPoints = {
    'J1': {
        acl: '勝点66',
        survival: '勝点39'
    },
    'J2': {
        promotion: '勝点76',
        playoff: '勝点64',
        survival: '勝点35'
    },
    'J3': {
        promotion: '勝点62',
        playoff: '勝点54',
        survival: '勝点36'
    }
};

// ▼▼▼【ここから変更】各目安情報に色分け用のspanタグを追加 ▼▼▼
function getInfoText(league) {
    const points = borderPoints[league];
    if (!points) return '';
    
    let texts = [];
    if (points.acl) texts.push(`<span class="info-text-acl">ACL圏目安: ${points.acl}</span>`);
    if (points.promotion) texts.push(`<span class="info-text-promotion">自動昇格目安: ${points.promotion}</span>`);
    if (points.playoff) texts.push(`<span class="info-text-playoff">昇格PO目安: ${points.playoff}</span>`);
    
    if ((league === 'J2' || league === 'J3') && points.survival) {
        texts.push(`<br><span class="info-text-survival">残留目安: ${points.survival}</span>`);
    } else if (points.survival) {
        texts.push(`<span class="info-text-survival">残留目安: ${points.survival}</span>`);
    }
    
    return texts.join(' / ');
}
// ▲▲▲【ここまで変更】▲▲▲

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
        
        let topRowHtml = '<div class="rank-info-row">';
        let leftSideInfo = '<div class="rank-info-left">';

        let legendHtml = '<div class="rank-legend">';
        switch (league) {
            case 'J1':
                legendHtml += '<div class="legend-item"><span class="legend-color-box legend-promotion-main"></span>ACL Elite</div>';
                legendHtml += '<div class="legend-item"><span class="legend-color-box legend-promotion-sub"></span>ACL 2</div>';
                legendHtml += '<div class="legend-item"><span class="legend-color-box legend-relegation-main"></span>自動降格</div>';
                break;
            case 'J2':
            case 'J3':
                legendHtml += '<div class="legend-item"><span class="legend-color-box legend-promotion-main"></span>自動昇格</div>';
                legendHtml += '<div class="legend-item"><span class="legend-color-box legend-playoff"></span>昇格PO</div>';
                legendHtml += '<div class="legend-item"><span class="legend-color-box legend-relegation-main"></span>自動降格</div>';
                if (league === 'J3') {
                     legendHtml += '<div class="legend-item"><span class="legend-color-box legend-relegation-playoff"></span>JFL入替戦</div>';
                }
                break;
            case 'JFL':
                 legendHtml += '<div class="legend-item"><span class="legend-color-box legend-promotion-main"></span>J3昇格</div>';
                 legendHtml += '<div class="legend-item"><span class="legend-color-box legend-playoff"></span>J3入替戦</div>';
                 legendHtml += '<div class="legend-item"><span class="legend-color-box legend-relegation-playoff"></span>地域L入替戦</div>';
                 legendHtml += '<div class="legend-item"><span class="legend-color-box legend-relegation-main"></span>地域L降格</div>';
                break;
        }
        legendHtml += '</div>';
        leftSideInfo += legendHtml;
        
        const infoText = getInfoText(league);
        if (infoText) {
            // ここでinnerHTMLを使うことで、<br>タグや<span>タグが正しく解釈される
            leftSideInfo += `<div class="qualification-info">${infoText}</div>`;
        }
        
        leftSideInfo += '</div>';

        let dateHtml = '';
        if (updated) {
            const updatedDate = new Date(updated);
            const formattedDate = updatedDate.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            dateHtml = `<p class="update-date-note">更新日時: ${formattedDate}</p>`;
        }
        
        topRowHtml += leftSideInfo + dateHtml + '</div>';

        const headers = Object.keys(data[0]);

        let tableHTML = `<div class="table-scroll-wrapper"><table><thead><tr>`;
        headers.forEach(h => {
            tableHTML += `<th>${h}</th>`;
        });
        tableHTML += `</tr></thead><tbody>`;

        data.forEach(row => {
            const rank = parseInt(row['順位'], 10);
            let rowClass = '';
            switch (league) {
                case 'J1':
                    if (rank <= 2) rowClass = 'rank-promotion-main';
                    else if (rank === 3) rowClass = 'rank-promotion-sub';
                    else if (rank >= 18) rowClass = 'rank-relegation-main';
                    break;
                case 'J2':
                case 'J3':
                    if (rank <= 2) rowClass = 'rank-promotion-main';
                    else if (rank >= 3 && rank <= 6) rowClass = 'rank-playoff';
                    else if (league === 'J2' && rank >= 18) rowClass = 'rank-relegation-main';
                    else if (league === 'J3' && rank === 19) rowClass = 'rank-relegation-playoff';
                    else if (league === 'J3' && rank >= 20) rowClass = 'rank-relegation-main';
                    break;
                case 'JFL':
                    if (rank === 1) rowClass = 'rank-promotion-main';
                    else if (rank === 2) rowClass = 'rank-playoff';
                    else if (rank === 15) rowClass = 'rank-relegation-playoff';
                    else if (rank >= 16) rowClass = 'rank-relegation-main';
                    break;
            }

            tableHTML += `<tr class="${rowClass}">`;
            headers.forEach(h => {
                let cellValue = row[h] || '';
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
        tableHTML += `</tbody></table></div>`;
        
        container.innerHTML = topRowHtml + tableHTML;
    });
}

// グローバルスコープに公開
window.showRankingTable = showRankingTable;

export default function initRankingPage() {
    const rankButtons = document.getElementById('rank-buttons');
    if (!rankButtons.dataset.initialized) {
        rankButtons.dataset.initialized = 'true';
    }
    showRankingTable('J1');
}