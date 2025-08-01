// js/dataManager.js

let clubData = [];
let playerData = [];
let blogPosts = [];
let attendanceData = [];
let rankingData = {};
let predictionProbabilities = {};
let europeTopClubs = [];
let europeRankingData = null; 
let updateDates = {};
let scheduleData = '';
let introductionsData = null;

const dataCache = {};

async function fetchData(url) {
    if (dataCache[url]) {
        return dataCache[url];
    }
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`${url} の読み込みに失敗しました: ${res.status}`);
    }
    const data = url.endsWith('.json') ? await res.json() : await res.text();
    dataCache[url] = data;
    return data;
}

export async function loadInitialData() {
    const [clubCsv, playerCsv] = await Promise.all([
        fetchData("/data/data.csv"),
        fetchData("/data/playerdata.csv"),
    ]);

    // Parse Club Data
    let lines = clubCsv.trim().split("\n");
    let headers = lines[0].split(",").map(h => h.trim());
    clubData = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
        obj.name = obj["クラブ名"] || 'N/A';
        obj.revenue = parseFloat(obj["売上高（億円）"]) || 0;
        obj.audience = parseInt(obj["平均観客動員数"]) || 0;
        obj.titles = parseInt(obj["タイトル計"]) || 0;
        obj.sum = parseFloat(obj["総合的ビッグクラブスコア"]) || 0;
        obj.l = obj["過去10年J1在籍年数"] || '0';
        obj.m = obj["J1在籍10年平均順位"] || 'N/A';
        obj.o = obj["J1在籍10年平均順位スコア"] || '0';
        obj.p = obj["所属リーグ"] || 'N/A';
        obj.color = obj["チームカラー"] || '#4a5a7f';
        obj.revenueScore = parseFloat(obj["売上スコア"]) || 0;
        obj.audienceScore = parseFloat(obj["観客スコア"]) || 0;
        obj.titleScore = parseFloat(obj["タイトルスコア"]) || 0;
        obj.rankScore = parseFloat(obj["平均順位スコア"]) || 0;
        obj.lat = parseFloat(obj["緯度"]) || 0;
        obj.lon = parseFloat(obj["経度"]) || 0;
        return obj;
    });
    clubData.sort((a, b) => b.sum - a.sum);

    // Parse Player Data
    lines = playerCsv.trim().split("\n");
    headers = lines[0].split(",").map(h => h.trim());
    playerData = lines.slice(1).map(line => {
        const vals = line.split(",");
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i] ? vals[i].trim() : '');
        return obj;
    });
}

export async function getIntroductionsData() {
    if (introductionsData) return introductionsData;
    introductionsData = await fetchData("/data/introductions.json");
    return introductionsData;
}

export const getClubData = () => clubData;
export const getPlayerData = () => playerData;

export async function getBlogPosts() {
    if (blogPosts.length > 0) return blogPosts;
    const blogIndexJson = await fetchData("/posts/index.json");
    if (Array.isArray(blogIndexJson)) {
        blogPosts = blogIndexJson.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return blogPosts;
}


export async function getAttendanceData() {
    if (attendanceData.length > 0) return attendanceData;
    const [csvText, datesJson] = await Promise.all([
        fetchData("/data/attendancefigure.csv"),
        fetchData("/data/update_dates.json")
    ]);
    let lines = csvText.trim().split("\n");
    let headers = lines[0].split(",").map(h => h.trim());
    attendanceData = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => {
            const val = values[i] ? values[i].trim() : '';
            if (['年', '年間最高観客数', '年間最低観客数', 'ゲーム数'].includes(h)) {
                obj[h] = parseInt(val) || 0;
            } else if (h === '平均観客数') {
                obj[h] = parseFloat(val) || 0;
            } else {
                obj[h] = val;
            }
        });
        return obj;
    });
    attendanceData.lastModified = datesJson['attendancefigure.csv'];
    return attendanceData;
}

export async function getRankingData() {
    if (Object.keys(rankingData).length > 0) return rankingData;
    const [j1Csv, j2Csv, j3Csv, jflCsv, datesJson] = await Promise.all([
        fetchData("/data/j1rank.csv"),
        fetchData("/data/j2rank.csv"),
        fetchData("/data/j3rank.csv"),
        fetchData("/data/jflrank.csv"),
        fetchData("/data/update_dates.json")
    ]);
    const parse = (csv) => {
        if (!csv || csv.trim() === '') return [];
        const lines = csv.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(",");
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = values[i] ? values[i].trim() : '';
            });
            return obj;
        });
    };
    rankingData['J1'] = { data: parse(j1Csv), updated: datesJson['j1rank.csv'] };
    rankingData['J2'] = { data: parse(j2Csv), updated: datesJson['j2rank.csv'] };
    rankingData['J3'] = { data: parse(j3Csv), updated: datesJson['j3rank.csv'] };
    rankingData['JFL'] = { data: parse(jflCsv), updated: datesJson['jflrank.csv'] };
    return rankingData;
}

export async function getPredictionData() {
    if (Object.keys(predictionProbabilities).length > 0) return { predictionProbabilities, updateDates };
    const [preds, dates] = await Promise.all([
        fetchData("/data/prediction_probabilities.json"),
        fetchData("/data/update_dates.json")
    ]);
    predictionProbabilities = preds;
    updateDates = dates;
    return { predictionProbabilities, updateDates };
}

export async function getScheduleData() {
    if (scheduleData) return scheduleData;
    const csvText = await fetchData("/data/schedule.csv");
    scheduleData = csvText;
    return scheduleData;
}

export async function getEuropeTopClubsData() {
    if (europeTopClubs.length > 0) return europeTopClubs;
    const csvText = await fetchData("/data/europebigclub.csv");
    const lines = csvText.trim().split("\n");
    const parseCsvLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };
    europeTopClubs = lines.slice(1).map(line => parseCsvLine(line));
    return europeTopClubs;
}
export async function getEuropeRankingData() {
    if (europeRankingData) return europeRankingData;

    try {
        const csvText = await fetchData("/data/5league-rankings.csv");
        const lines = csvText.trim().split("\n").slice(1); 
        const headers = ['年', 'リーグ', '順位', 'クラブ名', '試合数', '勝', '分', '敗', '得点', '失点', '得失点差', '勝点'];
        
        let currentLeague = '';
        let currentYear = '';

        const data = lines
            .map(line => {
                const values = line.split(",");
                const obj = {};
                headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
                if (obj['年'] && obj['年'].trim() !== '') {
                    currentYear = obj['年'];
                } else {
                    obj['年'] = currentYear;
                }
                if (obj['リーグ'] && obj['リーグ'].trim() !== '') {
                    currentLeague = obj['リーグ'];
                } else {
                    obj['リーグ'] = currentLeague;
                }
                return obj;
            })
            .filter(row => row && row['クラブ名'] && row['クラブ名'].trim() !== '');

        const groupedData = data.reduce((acc, row) => {
            const league = row['リーグ'];
            if (league) {
                if (!acc[league]) {
                    acc[league] = [];
                }
                acc[league].push(row);
            }
            return acc;
        }, {});
        
        europeRankingData = groupedData;
        return europeRankingData;

    } catch (error) {
        console.error("5大リーグ順位表データの読み込みに失敗しました:", error);
        return null;
    }
}