import { getEuropeTopClubsData } from '../dataManager.js';
import { europeClubAbbreviations } from '../config.js';

function renderEuropeTop20Table() {
    const container = document.getElementById('europe-top20');
    if (!container) return;

    getEuropeTopClubsData().then(europeTopClubs => {
        if (europeTopClubs.length === 0) return;

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
    });
}


export default function initEuropeTop20Page() {
    renderEuropeTop20Table();
}