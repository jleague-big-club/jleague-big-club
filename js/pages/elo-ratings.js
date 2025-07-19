// js/pages/elo-ratings.js

let ratingsData = null;

const abbreviationMap = {
    'ヴィッセル神戸': '神戸', '鹿島アントラーズ': '鹿島', 'サンフレッチェ広島': '広島', 'ガンバ大阪': 'G大阪', 'ＦＣ町田ゼルビア': '町田', 'セレッソ大阪': 'C大阪', '浦和レッズ': '浦和', '柏レイソル': '柏', '名古屋グランパス': '名古屋', '東京ヴェルディ': '東京V', '川崎フロンターレ': '川崎F', '横浜Ｆ・マリノス': '横浜FM', 'アビスパ福岡': '福岡', '京都サンガF.C.': '京都', 'ＦＣ東京': 'FC東京', '湘南ベルマーレ': '湘南', 'アルビレックス新潟': '新潟', 'ジュビロ磐田': '磐田', 'サガン鳥栖': '鳥栖', '北海道コンサドーレ札幌': '札幌',
    '清水エスパルス': '清水', '横浜ＦＣ': '横浜FC', 'Ｖ・ファーレン長崎': '長崎', 'ファジアーノ岡山': '岡山', 'ベガルタ仙台': '仙台', 'ジェフユナイテッド千葉': '千葉', 'いわきＦＣ': 'いわき', '徳島ヴォルティス': '徳島', 'ヴァンフォーレ甲府': '甲府', 'モンテディオ山形': '山形', '愛媛ＦＣ': '愛媛', 'ブラウブリッツ秋田': '秋田', '大分トリニータ': '大分', 'レノファ山口ＦＣ': '山口', '鹿児島ユナイテッドFC': '鹿児島', '水戸ホーリーホック': '水戸', 'ロアッソ熊本': '熊本', '藤枝ＭＹＦＣ': '藤枝', '栃木': '栃木SC',
    'ザスパ群馬': '群馬', 'ＲＢ大宮アルディージャ': '大宮', 'ＦＣ今治': '今治',
    'カターレ富山': '富山', 'ＦＣ大阪': 'FC大阪', 'ツエーゲン金沢': '金沢', '松本山雅FC': '松本', 'ヴァンラーレ八戸': '八戸', 'ギラヴァンツ北九州': '北九州', 'テゲバジャーロ宮崎': '宮崎', '福島ユナイテッドFC': '福島', 'ＳＣ相模原': '相模原', '奈良クラブ': '奈良', 'ガイナーレ鳥取': '鳥取', 'ＦＣ琉球': '琉球', 'AC長野パルセイロ': '長野', 'カマタマーレ讃岐': '讃岐', 'アスルクラロ沼津': '沼津', 'ＦＣ岐阜': '岐阜', 'Ｙ．Ｓ．Ｃ．Ｃ．横浜': 'YS横浜', '栃木シティ': '栃木C', '高知ユナイテッドＳＣ': '高知'
};

async function loadRatingsData() {
    if (ratingsData) return;
    try {
        const response = await fetch('./data/team_ratings.json');
        if (!response.ok) throw new Error('レーティングデータの読み込みに失敗しました');
        ratingsData = await response.json();
    } catch (error) {
        console.error(error);
        ratingsData = null;
    }
}

function createRatingTableHTML(league, data) {
    if (!data || !data[league]) return '<p>データがありません。</p>';
    const sortedTeams = Object.entries(data[league]).sort(([, a], [, b]) => b - a);
    const rowsHTML = sortedTeams.map(([team, rating], index) => {
        const displayName = abbreviationMap[team] || team;
        return `<tr><td>${index + 1}</td><td class="team-name-cell">${displayName}</td><td class="rating-cell">${Math.round(rating)}</td></tr>`;
    }).join('');
    return `<div class="rating-table-container"><h2>${league} レーティング</h2><table><thead><tr><th>順位</th><th>クラブ</th><th>レーティング</th></tr></thead><tbody>${rowsHTML}</tbody></table></div>`;
}

export default async function initializeEloRatingsPage(pageContainer) {
    if (!pageContainer || pageContainer.childElementCount > 0) return;

    const currentYear = new Date().getFullYear();
    const pageTitleH1 = document.querySelector('#page-title-elo-ratings h1');
    if (pageTitleH1) {
        pageTitleH1.textContent = `Jリーグ ${currentYear} Eloレーティング`;
    }
    document.title = `Jリーグ ${currentYear} Eloレーティング - Jリーグビッグクラブ分析`;
    
    let lastUpdated = '不明';
    try {
        const response = await fetch('./data/update_dates.json');
        if (response.ok) {
            const dates = await response.json();
            lastUpdated = dates.ratings_updated || '不明';
        }
    } catch (e) {
        console.warn('更新日の取得に失敗しました。');
    }
    
    pageContainer.innerHTML = `
        <div class="elo-header">
            <p>このレーティングは、${currentYear}シーズンの試合結果のみを基にEloレーティングシステムで算出された、各チームの現在の強さを示す指標です。<br>数値は毎試合の結果に応じて変動します。</p>
            <a href="#blog/elo-rating-explainer" class="article-link-button small">Eloレーティングとは？(解説記事)</a>
        </div>
        <div class="update-date-note">最終更新日: ${lastUpdated}</div>
        <div class="elo-tables-grid">
            <div id="elo-j1-table"></div>
            <div id="elo-j2-table"></div>
            <div id="elo-j3-table"></div>
        </div>
    `;

    await loadRatingsData();
    if (ratingsData) {
        document.getElementById('elo-j1-table').innerHTML = createRatingTableHTML('J1', ratingsData);
        document.getElementById('elo-j2-table').innerHTML = createRatingTableHTML('J2', ratingsData);
        document.getElementById('elo-j3-table').innerHTML = createRatingTableHTML('J3', ratingsData);
    } else {
        pageContainer.innerHTML = '<p style="color:red; text-align:center;">レーティングデータの表示に失敗しました。</p>';
    }
}