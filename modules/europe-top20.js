// === modules/europe-top20.js (最終確定版) ===

// ★★★★★ initialize を async 関数にする ★★★★★
export async function initialize() {
    // 最初に必要なデータを非同期で読み込み、完了を待つ
    await window.loadEuropeTopClubsData();

    const container = document.getElementById('europe-top20');
    if (!container) return;
    if (!window.europeTopClubs || window.europeTopClubs.length === 0) {
        console.error("欧州クラブ売上の表示に必要なデータがありません。");
        container.innerHTML = '<p style="text-align:center;">データを取得できませんでした。</p>';
        return;
    }

    const isMobile = window.innerWidth <= 768;
    const headers = ["順位", "国", "リーグ", "クラブ名", "売上高 (億円)", "平均観客数"];
    let tableHTML = `<div class="data-source-note">※データソース: Deloitte, Transfermarkt (1ユーロ=165円で計算)</div>`;
    tableHTML += `<table><thead><tr>`;
    headers.forEach(h => tableHTML += `<th>${h}</th>`);
    tableHTML += `</tr></thead><tbody>`;

    window.europeTopClubs.forEach((club, index) => {
        tableHTML += `<tr>`;
        tableHTML += `<td>${index + 1}</td>`;
        tableHTML += `<td>${club[0] || '-'}</td>`;
        tableHTML += `<td>${club[1] || '-'}</td>`;
        let clubName = club[2] || '-';
        if (isMobile && window.europeClubAbbreviations[clubName]) {
            clubName = window.europeClubAbbreviations[clubName];
        }
        tableHTML += `<td>${clubName}</td>`;
        let revenueText = '-';
        if (club[4]) {
            const revenueValue = parseFloat(club[4]);
            if (!isNaN(revenueValue)) {
                 revenueText = isMobile ? Math.round(revenueValue).toLocaleString() : revenueValue.toLocaleString();
            }
        }
        tableHTML += `<td>${revenueText}</td>`;
        tableHTML += `<td>${club[5] ? parseInt(club[5]).toLocaleString() : '-'}</td>`;
        tableHTML += `</tr>`;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}