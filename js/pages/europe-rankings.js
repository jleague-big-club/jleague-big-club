// js/pages/europe-rankings.js

import { getEuropeRankingData } from '../dataManager.js';

let europeRankingsData = null;
const leagueOrder = ["プレミアリーグ", "ラ・リーガ", "セリエA", "ブンデスリーガ", "リーグ・アン"];

// 順位表を描画する関数
function renderRankingTable(leagueName) {
    const container = document.getElementById('europe-rankings-table-container');
    if (!container || !europeRankingsData || !europeRankingsData[leagueName]) {
        container.innerHTML = `<p class="no-data-message">データが見つかりません。</p>`;
        return;
    }

    const data = europeRankingsData[leagueName];
    
    // スマホで非表示にする列に className を追加
    const displayHeaders = [
        { key: '順位', label: '順位' },
        { key: 'クラブ名', label: 'チーム名' },
        { key: '勝点', label: '勝点' },
        { key: '試合数', label: '試合数' },
        { key: '勝', label: '勝', className: 'mobile-hidden-col' },
        { key: '分', label: '分', className: 'mobile-hidden-col' },
        { key: '敗', label: '敗', className: 'mobile-hidden-col' },
        { key: '得点', label: '得点' },
        { key: '失点', label: '失点' },
        { key: '得失点差', label: '得失点差' }
    ];
    
    // 順位でデータをソート
    const sortedData = [...data].sort((a, b) => parseInt(a['順位']) - parseInt(b['順位']));

    // Jリーグ順位表と同じクラス名を使ってスタイルを適用
    const tableHTML = `
        <div class="rankings-table-wrapper">
            <table class="rankings-table">
                <thead>
                    <tr>
                        ${displayHeaders.map(h => `<th class="${h.className || ''}">${h.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${sortedData.map(row => `
                        <tr>
                            ${displayHeaders.map(header => {
                                const value = row[header.key] !== undefined ? row[header.key] : '';
                                const tdClasses = [];
                                if (header.className) {
                                    tdClasses.push(header.className);
                                }
                                // チーム名のセルは左寄せにする
                                if (header.key === 'クラブ名') {
                                    tdClasses.push('team-name-cell');
                                }
                                return `<td class="${tdClasses.join(' ')}">${value}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// ページ初期化関数
export default async function initEuropeRankingsPage(container) {
    if (!container) return;

    // データの読み込み
    if (!europeRankingsData) {
        try {
            europeRankingsData = await getEuropeRankingData();
        } catch (error) {
            console.error('5大リーグの順位表データ読み込みエラー:', error);
            container.innerHTML = `<p class="error-message">データの読み込みに失敗しました。</p>`;
            return;
        }
    }

    if (!container.dataset.initialized) {
        // Jリーグページ風のボタンセレクターに変更
        const leagueButtons = leagueOrder
            .map((league, index) => {
                // ボタンの表示名を短く調整
                const buttonLabel = league.replace('プレミアリーグ', 'プレミア').replace('ラ・リーガ', 'ラリーガ').replace('リーグ・アン', 'リーグアン');
                return `<button data-league="${league}" class="category-btn ${index === 0 ? 'active' : ''}">${buttonLabel}</button>`;
            })
            .join('');

        container.innerHTML = `
            <div class="category-selector">
                ${leagueButtons}
            </div>
            <div id="europe-rankings-table-container"></div>
        `;

        const buttons = container.querySelectorAll('.category-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                buttons.forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');
                renderRankingTable(e.currentTarget.dataset.league);
            });
        });

        container.dataset.initialized = 'true';
    }

    // 初期表示
    const initialLeague = container.querySelector('.category-btn.active')?.dataset.league || leagueOrder[0];
    renderRankingTable(initialLeague);
}