// js/pages/findMyClub.js

import { getClubData } from '../dataManager.js';

// ===================================================================================
// ▼▼▼ グローバル変数 ▼▼▼
// ===================================================================================
let currentAudio = null;
let isAudioEnabled = true;
let userAnswers = {};
let currentQuestionIndex = 0;
let candidateClubs = [];
let questionContainerListener = null;
let baseCandidateClubs = []; // 診断のベースとなるクラブリスト
let answerHistory = [];

let audioContextUnlocked = false; // オーディオコンテキストがアンロックされたかどうかのフラグ
const preloadedAudio = {}; // プリロードしたオーディオをキャッシュするオブジェクト

// 音声ファイルをプリロードする関数
function preloadAudio(filename) {
    if (preloadedAudio[filename]) return; // 既に読み込み済みなら何もしない
    
    const audio = new Audio(`/audio/zundamon/${filename}`);
    audio.preload = 'auto'; // ブラウザに自動で読み込ませるよう指示
    preloadedAudio[filename] = audio;
    
    // 実際にデータをフェッチさせるための小技
    fetch(`/audio/zundamon/${filename}`).then(response => response.blob());
    console.log(`Preloading audio: ${filename}`);
}


// ユーザーの最初の操作でオーディオコンテキストをアンロックする関数
function unlockAudioContext() {
    if (audioContextUnlocked) return;
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        if (context.state === 'suspended') {
            context.resume();
        }
        // 無音のバッファを再生して再生許可を得る
        const buffer = context.createBuffer(1, 1, 22050);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
        audioContextUnlocked = true;
        console.log("AudioContext unlocked.");
    } catch (e) {
        console.error("Failed to unlock AudioContext:", e);
    }
}

// 現在再生中の音声を中断するだけの関数（音声設定は変更しない）
function interruptCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

function stopCurrentAudio() {
  interruptCurrentAudio(); // 上で定義した関数を呼び出す
  isAudioEnabled = false; // 音声機能を無効化
  const toggleBtn = document.getElementById('zundamon-audio-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = '🔇 音声OFF';
  }
}
window.stopCurrentAudio = stopCurrentAudio;

// ===================================================================================
// ▼▼▼ 診断データ ▼▼▼
// ===================================================================================
const clubDiagnosticData = [
    { "クラブ名": "北海道コンサドーレ札幌", "都道府県": "北海道", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "ドーム", "プレースタイル": ["攻撃的", "ポゼッション"], "ホームタウンの魅力": ["大都市", "観光地", "グルメ"], "一言で言えば": "ドームなので天候に気にせず観戦できる" },
    { "クラブ名": "ヴァンラーレ八戸", "都道府県": "青森県", "カテゴリー": "J3", "サポーターの熱量": "アットホーム", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市", "グルメ"], "一言で言えば": "球技専用なので迫力のある試合が見れる" },
    { "クラブ名": "ベガルタ仙台", "都道府県": "宮城県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["大都市", "グルメ"], "一言で言えば": "東北一熱いクラブ" },
    { "クラブ名": "ブラウブリッツ秋田", "都道府県": "秋田県", "カテゴリー": "J2", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "モンテディオ山形", "都道府県": "山形県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市", "自然豊か"], "一言で言えば": "想像以上のサポーター熱がある" },
    { "クラブ名": "福島ユナイテッドFC", "都道府県": "福島県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "いわきFC", "都道府県": "福島県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "まるで映画のような街クラブ" },
    { "クラブ名": "鹿島アントラーズ", "都道府県": "茨城県", "カテゴリー": "J1", "サポーターの熱量": "熱狂的", "スタジアムの種類": "球技専用", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "Jリーグで一番タイトルを獲得" },
    { "クラブ名": "水戸ホーリーホック", "都道府県": "茨城県", "カテゴリー": "J2", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "J2の門番" },
    { "クラブ名": "栃木SC", "都道府県": "栃木県", "カテゴリー": "J2", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "ダービーが熱い" },
    { "クラブ名": "栃木シティ", "都道府県": "栃木県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "球技専用なので迫力のある試合が見れる" },
    { "クラブ名": "ザスパ群馬", "都道府県": "群馬県", "カテゴリー": "J3", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "浦和レッズ", "都道府県": "埼玉県", "カテゴリー": "J1", "サポーターの熱量": "熱狂的", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "海外で最も有名なJリーグのクラブ" },
    { "クラブ名": "RB大宮アルディージャ", "都道府県": "埼玉県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "外資系企業に買収された新時代のクラブ" },
    { "クラブ名": "ジェフユナイテッド千葉", "都道府県": "千葉県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "千葉の2大クラブ" },
    { "クラブ名": "柏レイソル", "都道府県": "千葉県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "ゴール裏は迫力満点" },
    { "クラブ名": "FC東京", "都道府県": "東京都", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "国内1.2を争う観客が入る" },
    { "クラブ名": "東京ヴェルディ", "都道府県": "東京都", "カテゴリー": "J1", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["テクニカル"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "東京1のクラブを目指す" },
    { "クラブ名": "FC町田ゼルビア", "都道府県": "東京都", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "国内でもトップクラスの勢いがある新興クラブ" },
    { "クラブ名": "川崎フロンターレ", "都道府県": "神奈川県", "カテゴリー": "J1", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "三苫など現日本代表を大量に輩出するクラブ" },
    { "クラブ名": "横浜F・マリノス", "都道府県": "神奈川県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "神奈川の2大クラブ" },
    { "クラブ名": "横浜FC", "都道府県": "神奈川県", "カテゴリー": "J1", "サポーターの熱量": "のんびり", "スタジアムの種類": "球技専用", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "神奈川で唯一の専用スタジアム" },
    { "クラブ名": "湘南ベルマーレ", "都道府県": "神奈川県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["観光地"], "一言で言えば": "" },
    { "クラブ名": "SC相模原", "都道府県": "神奈川県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "ヴァンフォーレ甲府", "都道府県": "山梨県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市", "自然豊か"], "一言で言えば": "" },
    { "クラブ名": "松本山雅FC", "都道府県": "長野県", "カテゴリー": "J3", "サポーターの熱量": "熱狂的", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市", "自然豊か"], "一言で言えば": "サッカー熱が高い" },
    { "クラブ名": "AC長野パルセイロ", "都道府県": "長野県", "カテゴリー": "J3", "サポーターの熱量": "アットホーム", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市", "観光地"], "一言で言えば": "ダービーが熱い" },
    { "クラブ名": "アルビレックス新潟", "都道府県": "新潟県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "カターレ富山", "都道府県": "富山県", "カテゴリー": "J2", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "ツエーゲン金沢", "都道府県": "石川県", "カテゴリー": "J3", "サポーターの熱量": "アットホーム", "スタジアムの種類": "球技専用", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市", "観光地"], "一言で言えば": "" },
    { "クラブ名": "清水エスパルス", "都道府県": "静岡県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["地方都市", "グルメ"], "一言で言えば": "静岡の2大クラブ" },
    { "クラブ名": "ジュビロ磐田", "都道府県": "静岡県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "有名選手が多数在籍した名門" },
    { "クラブ名": "藤枝MYFC", "都道府県": "静岡県", "カテゴリー": "J2", "サポーターの熱量": "のんびり", "スタジアムの種類": "球技専用", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "アスルクラロ沼津", "都道府県": "静岡県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "名古屋グランパス", "都道府県": "愛知県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "国内トップクラスの観客数" },
    { "クラブ名": "FC岐阜", "都道府県": "岐阜県", "カテゴリー": "J3", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "京都サンガF.C.", "都道府県": "京都府", "カテゴリー": "J1", "サポーターの熱量": "アットホーム", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["大都市", "観光地"], "一言で言えば": "" },
    { "クラブ名": "ガンバ大阪", "都道府県": "大阪府", "カテゴリー": "J1", "サポーターの熱量": "熱狂的", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "大阪の2大クラブ" },
    { "クラブ名": "セレッソ大阪", "都道府県": "大阪府", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["テクニカル"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "ダービーが熱い" },
    { "クラブ名": "FC大阪", "都道府県": "大阪府", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["大都市"], "一言で言えば": "" },
    { "クラブ名": "ヴィッセル神戸", "都道府県": "兵庫県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "ドーム", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["大都市", "観光地"], "一言で言えば": "近年J最強" },
    { "クラブ名": "奈良クラブ", "都道府県": "奈良県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市", "観光地"], "一言で言えば": "" },
    { "クラブ名": "ガイナーレ鳥取", "都道府県": "鳥取県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "球技専用", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "ファジアーノ岡山", "都道府県": "岡山県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "地方クラブでトップクラスの一体感" },
    { "クラブ名": "サンフレッチェ広島", "都道府県": "広島県", "カテゴリー": "J1", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["大都市", "グルメ"], "一言で言えば": "最新スタジアム" },
    { "クラブ名": "レノファ山口FC", "都道府県": "山口県", "カテゴリー": "J2", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "カマタマーレ讃岐", "都道府県": "香川県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市", "グルメ"], "一言で言えば": "" },
    { "クラブ名": "徳島ヴォルティス", "都道府県": "徳島県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "愛媛FC", "都道府県": "愛媛県", "カテゴリー": "J2", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "FC今治", "都道府県": "愛媛県", "カテゴリー": "J3", "サポーターの熱量": "アットホーム", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "まるで映画のような街クラブ" },
    { "クラブ名": "高知ユナイテッドSC", "都道府県": "高知県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市", "自然豊か"], "一言で言えば": "" },
    { "クラブ名": "アビスパ福岡", "都道府県": "福岡県", "カテゴリー": "J1", "サポーターの熱量": "アットホーム", "スタジアムの種類": "球技専用", "プレースタイル": ["堅守速攻"], "ホームタウンの魅力": ["大都市", "グルメ"], "一言で言えば": "" },
    { "クラブ名": "ギラヴァンツ北九州", "都道府県": "福岡県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "球技専用", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "海の見える専用スタジアム" },
    { "クラブ名": "サガン鳥栖", "都道府県": "佐賀県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "V・ファーレン長崎", "都道府県": "長崎県", "カテゴリー": "J2", "サポーターの熱量": "一体感", "スタジアムの種類": "球技専用", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市", "観光地"], "一言で言えば": "最新スタジアム" },
    { "クラブ名": "ロアッソ熊本", "都道府県": "熊本県", "カテゴリー": "J2", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "大分トリニータ", "都道府県": "大分県", "カテゴリー": "J2", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "テゲバジャーロ宮崎", "都道府県": "宮崎県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "球技専用", "プレースタイル": ["ハードワーク"], "ホームタウンの魅力": ["地方都市"], "一言で言えば": "" },
    { "クラブ名": "鹿児島ユナイテッドFC", "都道府県": "鹿児島県", "カテゴリー": "J3", "サポーターの熱量": "アットホーム", "スタジアムの種類": "陸上競技場", "プレースタイル": ["ポゼッション"], "ホームタウンの魅力": ["地方都市", "グルメ"], "一言で言えば": "" },
    { "クラブ名": "FC琉球", "都道府県": "沖縄県", "カテゴリー": "J3", "サポーターの熱量": "のんびり", "スタジアムの種類": "陸上競技場", "プレースタイル": ["攻撃的"], "ホームタウンの魅力": ["観光地", "グルメ"], "一言で言えば": "" }
];
// ===================================================================================
// ▼▼▼ 診断の質問 ▼▼▼
// ===================================================================================
const questions = [
    { id: 'q1', type: 'choice', property: 'サポーターの熱量', question: "どんな雰囲気で応援したいのだ？", answers: ["熱狂的", "一体感", "アットホーム", "のんびり"] },
    { id: 'q2', type: 'choice', property: 'カテゴリー', question: "どのくらいのレベルのリーグが見たい？", answers: ["国内最高峰の戦いが見たい！(J1)", "J1昇格を目指す激しい戦い！(J2)", "これからが楽しみな原石たちの戦い！(J3)"] },
    { id: 'q3', type: 'choice', property: 'スタジアムの種類', question: "どんなスタジアムで観たいのだ？", answers: ["球技専用", "陸上競技場", "ドーム"] },
    { id: 'q4', type: 'choice', property: 'プレースタイル', question: "どんなサッカーが好きかな？", answers: ["攻撃的", "堅守速攻", "ポゼッション", "ハードワーク", "テクニカル"] },
    { id: 'q5', type: 'choice', property: 'ホームタウンの魅力', question: "どんな街のクラブを応援したいのだ？", answers: ["大都市", "地方都市", "観光地", "グルメ", "自然豊か"] },
    { id: 'q6', type: 'final_choice', property: '一言で言えば', question: "最後に、ピンと来た言葉を選ぶのだ！", answers: [] }
];

// 音声再生やUI更新の関数
async function playSound(audioFiles) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }
    if (!isAudioEnabled) return;

    const playlist = Array.isArray(audioFiles) ? audioFiles : [audioFiles];
    for (const filename of playlist) {
        if (!isAudioEnabled) break;
        
        await new Promise(resolve => {
            const audio = preloadedAudio[filename] || new Audio(`/audio/zundamon/${filename}`);
            currentAudio = audio;
            
            if (audio.ended) {
                audio.currentTime = 0;
            }
            
            if (audio.readyState >= 3) {
                audio.play().catch(e => {
                    console.error(`Error playing ${filename}:`, e);
                    resolve();
                });
            } else {
                const playHandler = () => {
                    audio.removeEventListener('canplaythrough', playHandler);
                    audio.play().catch(e => {
                        console.error(`Error playing ${filename}:`, e);
                        resolve();
                    });
                };
                audio.addEventListener('canplaythrough', playHandler);
            }

            const endedHandler = () => {
                audio.removeEventListener('ended', endedHandler);
                resolve();
            };
            audio.addEventListener('ended', endedHandler);

            audio.addEventListener('error', (e) => {
                console.error(`${filename} の再生に失敗…`, e);
                resolve();
            });
        });
        
        currentAudio = null;
        if (playlist.length > 1) {
             await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}
function updateZundamonUI(text, imageName = 'normal') { const zt = document.getElementById('zundamon-text'); const zi = document.getElementById('zundamon-image'); if (zt) zt.textContent = text; if (zi) zi.src = `/img/zundamon/${imageName}.webp`; }
function updateMapMarker(club, markerId) { const marker = document.getElementById(markerId); if (!marker) return; const hasCoords = club.lat && club.lon; const mapContainer = marker.closest('.map-container'); if (!hasCoords) { if (mapContainer) mapContainer.style.display = 'none'; return; } if (mapContainer) mapContainer.style.display = 'block'; const mapBounds = { top: 46.0, bottom: 30.0, left: 128.0, right: 146.0 }; const topPercent = 100 - ((club.lat - mapBounds.bottom) / (mapBounds.top - mapBounds.bottom)) * 100; const leftPercent = ((club.lon - mapBounds.left) / (mapBounds.right - mapBounds.left)) * 100; marker.style.top = `${topPercent}%`; marker.style.left = `${leftPercent}%`; marker.style.backgroundColor = club.color; marker.style.display = 'block'; marker.title = club.name; }

// === 診断ロジック ===

function goBack() {
    if (answerHistory.length === 0) return;
    interruptCurrentAudio();

    const lastState = answerHistory.pop();
    currentQuestionIndex = lastState.questionIndex;
    userAnswers = lastState.userAnswers;
    
    renderQuestion();
}

function startDiagnosis(initialCandidates = clubDiagnosticData) {
    baseCandidateClubs = initialCandidates;
    currentQuestionIndex = 0;
    userAnswers = {};
    answerHistory = [];
    renderQuestion();
}

function renderQuestion() {
    // 毎回、診断開始時の候補リスト(baseCandidateClubs)の安全なコピーを使用して、
    // これまでの全回答(userAnswers)で絞り込み直す
    let filteredClubs = [...baseCandidateClubs];
    for (const property in userAnswers) {
        const userAnswer = userAnswers[property];
        filteredClubs = filteredClubs.filter(club => {
            const clubValue = club[property];
            
            // 【修正点】データにプロパティが存在しない場合、安全に除外します
            if (clubValue === undefined || clubValue === null) {
                return false;
            }

            // クラブのデータが配列（例：プレースタイル）か単一の値（例：カテゴリー）かで判定を分岐
            return Array.isArray(clubValue) ? clubValue.includes(userAnswer) : clubValue === userAnswer;
        });
    }
    candidateClubs = filteredClubs;

    if (candidateClubs.length <= 1 || currentQuestionIndex >= questions.length) {
        showResult();
        return;
    }
    
    const questionData = questions[currentQuestionIndex];
    const container = document.getElementById('find-my-club-questions');
    
    const backButtonHtml = answerHistory.length > 0 ? `<button class="diagnosis-btn back" id="back-btn">１つ前に戻る</button>` : '';

    if (questionData.type === 'final_choice') {
        updateZundamonUI(questionData.question);
        const oneLiners = candidateClubs.map(c => c.一言で言えば).filter(Boolean);
        const uniqueOneLiners = [...new Set(oneLiners)];
        
        if (uniqueOneLiners.length <= 1) {
            showResult();
            return;
        }

        const shuffled = uniqueOneLiners.sort(() => 0.5 - Math.random());
        const finalAnswers = shuffled.slice(0, 4);

        let answersHtml = finalAnswers.map(answer => `<button class="diagnosis-btn" data-answer="${answer}">${answer}</button>`).join('');
        container.innerHTML = `<div class="diagnosis-question-box"><h2>${questionData.question}</h2><div class="diagnosis-answers">${answersHtml}${backButtonHtml}</div></div>`;
    } else {
        const property = questionData.property;
        let availableAnswers;
        if (property === 'カテゴリー') {
            const categoriesInCandidates = [...new Set(candidateClubs.map(c => c.カテゴリー))];
            if (categoriesInCandidates.length <= 1) {
                currentQuestionIndex++;
                renderQuestion();
                return;
            }
            availableAnswers = questionData.answers.filter(answer => {
                if (answer.includes('J1')) return categoriesInCandidates.includes('J1');
                if (answer.includes('J2')) return categoriesInCandidates.includes('J2');
                if (answer.includes('J3')) return categoriesInCandidates.includes('J3');
                return false;
            });

        } else {
            const answersFromClubs = [...new Set(candidateClubs.flatMap(c => c[property]).filter(Boolean))];
            
            if (answersFromClubs.length <= 1) {
                currentQuestionIndex++;
                renderQuestion();
                return;
            }
            
            availableAnswers = answersFromClubs.sort();
        }

        if (availableAnswers.length === 0) {
             currentQuestionIndex++;
             renderQuestion();
             return;
        }
        
        updateZundamonUI(questionData.question);
        let answersHtml = availableAnswers.map(answer => `<button class="diagnosis-btn" data-answer="${answer}">${answer}</button>`).join('');
        container.innerHTML = `<div class="diagnosis-question-box"><h2>${questionData.question}</h2><div class="diagnosis-answers">${answersHtml}${backButtonHtml}</div></div>`;
    }
}

function handleAnswer(e) {
    const btn = e.target.closest('.diagnosis-btn');
    if (!btn) return;

    if (btn.id === 'back-btn') {
        goBack();
        return;
    }

    if (typeof btn.dataset.answer === 'undefined') {
        return;
    }

    // 回答前の状態を履歴に保存
    answerHistory.push({
        questionIndex: currentQuestionIndex,
        userAnswers: { ...userAnswers },
    });

    const questionData = questions[currentQuestionIndex];
    let answer = btn.dataset.answer;
    
    // 【修正点】カテゴリーの判定をより厳密にしました（例: "(J1)" を含むかで判定）
    if (questionData.property === 'カテゴリー') {
        if (answer.includes('(J1)')) answer = 'J1';
        else if (answer.includes('(J2)')) answer = 'J2';
        else if (answer.includes('(J3)')) answer = 'J3';
    }
    userAnswers[questionData.property] = answer;

    const reactionAudios = ['react_01_ok.mp3', 'react_02_hmm.mp3', 'react_03_good.mp3'];
    playSound(reactionAudios[Math.floor(Math.random() * reactionAudios.length)]);
    
    currentQuestionIndex++;
    renderQuestion();
}

async function showResult(directResultClub = null) {
    document.getElementById('find-my-club-questions').style.display = 'none';
    document.getElementById('page-title-find-my-club').style.display = 'none';
    const resultContainer = document.getElementById('find-my-club-result');
    
    updateZundamonUI("どきどきなのだ…", 'thinking');
    await playSound('result_01_intro.mp3');
    
    let resultClub;
    if (directResultClub) {
        resultClub = directResultClub;
    } else {
        let finalCandidates = [...candidateClubs];
        const finalAnswer = userAnswers['一言で言えば'];
        
        if (finalAnswer) {
             const finalFiltered = finalCandidates.filter(club => club.一言で言えば === finalAnswer);
             if (finalFiltered.length > 0) {
                 finalCandidates = finalFiltered;
             }
        }
        
        if (finalCandidates.length === 0) { 
            finalCandidates = [...candidateClubs];
            if(finalCandidates.length === 0) finalCandidates = baseCandidateClubs;
        }

        resultClub = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
    }
    
    if (!resultClub) {
        console.error("Could not determine a result club.");
        resultClub = clubDiagnosticData[Math.floor(Math.random() * clubDiagnosticData.length)];
    }
    
    const clubData = getClubData().find(c => c.name === resultClub.クラブ名);

    if (!clubData) {
        console.error("Result club not found in main data:", resultClub.クラブ名);
        resultContainer.innerHTML = `<div class="result-box"><h2>エラーが発生しました</h2><p>クラブデータが見つかりませんでした。もう一度診断をやり直してください。</p><div class="result-actions"><button class="diagnosis-btn secondary" id="retry-diagnosis-btn">もう一度診断する</button></div></div>`;
        resultContainer.style.display = 'block';
        document.getElementById('retry-diagnosis-btn').addEventListener('click', () => {
            playSound('react_04_again_ok.mp3');
            setTimeout(() => initFindMyClubPage(document.getElementById('find-my-club')), 500);
        });
        return;
    }

    const oneLinerHTML = resultClub.一言で言えば ? `<p class="result-oneword">「${resultClub.一言で言えば}」</p>` : '';

    resultContainer.innerHTML = `
        <div class="result-box">
            <p class="result-intro-text">あなたにおすすめのクラブは…</p>
            <h1>${resultClub.クラブ名}</h1>
            <div class="map-container" style="max-width: 300px; margin: 25px auto 20px; border-radius: 8px; overflow: hidden; border: 1px solid #4a5a7f; position: relative;">
                <img src="/img/japan-map.svg" alt="日本地図" style="width: 100%; display: block; opacity: 0.7;">
                <div id="map-marker-result" style="position: absolute; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; transform: translate(-50%, -50%); box-shadow: 0 0 10px rgba(0,0,0,0.7); display: none;"></div>
            </div>
            ${oneLinerHTML}
            <p class="result-reason">
                ${resultClub.都道府県}をホームタウンとするクラブ。<br>
                ${resultClub.カテゴリー}リーグに所属し、熱いサポーターと共に戦っています！
            </p>
            <div class="result-actions">
                <a href="#/introduce/${clubData.teamId}" class="diagnosis-btn">各クラブ紹介ページを見てみる</a>
                <button class="diagnosis-btn secondary" id="retry-diagnosis-btn">もう一度診断する</button>
            </div>
        </div>`;
    resultContainer.style.display = 'block';

    updateMapMarker(clubData, 'map-marker-result');

    document.getElementById('retry-diagnosis-btn').addEventListener('click', () => {
        playSound('react_04_again_ok.mp3');
        setTimeout(() => initFindMyClubPage(document.getElementById('find-my-club')), 500);
    });

    updateZundamonUI(`じゃーん！きみにおすすめのクラブは「${resultClub.クラブ名}」なのだ！`, 'smile');
    
    const resultPlaylist = ['result_02_announce.mp3', 'result_04_next.mp3', 'result_05_retry.mp3'];
    await playSound(resultPlaylist);
}

function renderPrefectureSelect() {
    const container = document.getElementById('find-my-club-questions');
    const prefectures = [...new Set(clubDiagnosticData.map(c => c.都道府県))].sort();
    const options = prefectures.map(p => `<option value="${p}">${p}</option>`).join('');
    
    container.innerHTML = `
        <div class="diagnosis-question-box">
            <h2>どの都道府県のクラブに興味があるのだ？</h2>
            <select id="prefecture-select" class="diagnosis-select">
                <option value="">都道府県を選んでね</option>
                ${options}
            </select>
            <div id="pref-result-area"></div>
        </div>`;
     updateZundamonUI("どの都道府県のクラブに興味があるのだ？");
     playSound('local_01_select.mp3');

    document.getElementById('prefecture-select').addEventListener('change', e => {
        const selectedPref = e.target.value;
        const prefResultArea = document.getElementById('pref-result-area');
        if (!selectedPref) {
            prefResultArea.innerHTML = '';
            return;
        }

        const clubsInPref = clubDiagnosticData.filter(c => c.都道府県 === selectedPref);
        if (clubsInPref.length === 1) {
            playSound('local_02_decided.mp3');
            showResult(clubsInPref[0]);
        } else if (clubsInPref.length > 1) {
            playSound('local_03_multi.mp3');
            startDiagnosis(clubsInPref);
        } else {
             playSound('local_04_notfound.mp3');
            prefResultArea.innerHTML = `
                <p style="margin-top: 20px;">その県にはJリーグクラブがないみたいだ…<br>全国のクラブから探してみない？</p>
                <div class="diagnosis-answers" style="margin-top: 15px;">
                    <button class="diagnosis-btn" id="search-national-fallback-btn">全国から探すのだ！</button>
                </div>`;
            document.getElementById('search-national-fallback-btn').addEventListener('click', () => {
                startDiagnosis();
            });
        }
    });
}

function renderModeSelect() {
    const container = document.getElementById('find-my-club-questions');
    container.innerHTML = `
        <div class="diagnosis-question-box">
            <h2>どうやって探すのだ？</h2>
            <div class="diagnosis-answers">
                 <button class="diagnosis-btn" data-mode="local">地元・お近くのクラブから探すのだ！</button>
                 <button class="diagnosis-btn" data-mode="national">全国のクラブから診断するのだ！</button>
            </div>
        </div>`;
    updateZundamonUI("どうやって探すのだ？");
    playSound('start_02_guide.mp3');
    
    container.querySelectorAll('.diagnosis-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const mode = e.target.dataset.mode;
            playSound('react_01_ok.mp3');
            if (mode === 'local') {
                renderPrefectureSelect();
            } else {
                startDiagnosis();
            }
        });
    });
}

function renderStartScreen() {
    preloadAudio('start_01_greeting.mp3');

    const container = document.getElementById('find-my-club-questions');
    container.innerHTML = `
        <div class="diagnosis-question-box">
            <h2>僕が君にぴったりのクラブを見つけてあげるのだ！</h2>
            <p>Jリーグを見ようと思うけど、どのクラブがいいのか分からない…<br>と言う方に、質問に答えてあなたにぴったりの「推しクラブ」を見つけるのだ！</p>
            <div class="start-options">
                <p>音声案内は利用するのだ？</p>
                <div class="start-buttons">
                    <button class="diagnosis-btn" id="start-with-audio">🔊 はい</button>
                    <button class="diagnosis-btn secondary" id="start-without-audio">🔇 いいえ</button>
                </div>
            </div>
        </div>`;
    
    document.getElementById('start-with-audio').addEventListener('click', async () => {
        unlockAudioContext();
        isAudioEnabled = true;
        document.getElementById('zundamon-audio-toggle').textContent = '🔊 音声ON';
        await playSound('start_01_greeting.mp3');
        if (isAudioEnabled) {
            renderModeSelect();
        }
    });
     document.getElementById('start-without-audio').addEventListener('click', () => {
        unlockAudioContext();
        isAudioEnabled = false;
        document.getElementById('zundamon-audio-toggle').textContent = '🔇 音声OFF';
        renderModeSelect();
    });
}

export default async function initFindMyClubPage(container) {
    if (!container) return;

    document.querySelectorAll('.page-title-row').forEach(el => el.style.display = 'none');
    const findMyClubTitle = document.getElementById('page-title-find-my-club');
    if (findMyClubTitle) {
        findMyClubTitle.style.display = 'flex';
    }
    
    if (!document.getElementById('zundamon-guide')) {
        const zundamonHtml = `
            <div id="zundamon-guide">
                <img id="zundamon-image" src="/img/zundamon/normal.webp" alt="ずんだもん">
                <div id="zundamon-speech-bubble"><p id="zundamon-text"></p></div>
                <button id="zundamon-audio-toggle">🔊 音声ON</button>
            </div>`;
        container.insertAdjacentHTML('afterbegin', zundamonHtml);

        document.getElementById('zundamon-audio-toggle').addEventListener('click', (e) => {
            isAudioEnabled = !isAudioEnabled;
            e.target.textContent = isAudioEnabled ? '🔊 音声ON' : '🔇 音声OFF';
            if (!isAudioEnabled) {
                stopCurrentAudio();
            }
        });
    } else {
        document.getElementById('zundamon-guide').style.display = 'flex';
    }
    
    userAnswers = {};
    currentQuestionIndex = 0;
    candidateClubs = [];
    answerHistory = [];

    document.getElementById('find-my-club-questions').style.display = 'block';
    document.getElementById('find-my-club-result').style.display = 'none';
    
    const questionContainer = document.getElementById('find-my-club-questions');
    if (questionContainerListener) {
        questionContainer.removeEventListener('click', questionContainerListener);
    }
    
    questionContainerListener = handleAnswer;
    questionContainer.addEventListener('click', questionContainerListener);

    renderStartScreen();
    updateZundamonUI("僕が君にぴったりのクラブを見つけてあげるのだ！", 'normal');
}