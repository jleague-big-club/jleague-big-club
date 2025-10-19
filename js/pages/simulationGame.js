// js/pages/simulationGame.js

// ゲームの状態を管理するオブジェクト
let gameState = {};
let mainChartInstance = null; // グラフインスタンスを単一で管理

// 全クラブのデータを保持（Jリーグ、JFL、地域リーグ）
const allClubsData = [
    { league: '北海道地域リーグ', rank: 1, name: 'BTOPサンクくりやま', style: '攻撃型', power: 222 }, { league: '北海道地域リーグ', rank: 2, name: '十勝スカイアース', style: 'バランス型', power: 222 }, { league: '北海道地域リーグ', rank: 3, name: 'ノルブリッツ北海道', style: '標準', power: 116 }, { league: '北海道地域リーグ', rank: 4, name: '札幌大学', style: '標準', power: 111 }, { league: '北海道地域リーグ', rank: 5, name: 'Sabas', style: '攻守に課題', power: 104 }, { league: '北海道地域リーグ', rank: 6, name: 'ASC北海道', style: '攻守に課題', power: 100 }, { league: '北海道地域リーグ', rank: 7, name: '日本製鉄室蘭', style: '攻守に課題', power: 86 }, { league: '北海道地域リーグ', rank: 8, name: 'Canale小樽', style: '攻守に課題', power: 68 },
    { league: '東北地域リーグ1部', rank: 1, name: 'Cobaltore女川', style: 'バランス型', power: 250 }, { league: '東北地域リーグ1部', rank: 2, name: 'ブランデュー弘前', style: '攻撃型', power: 207 }, { league: '東北地域リーグ1部', rank: 3, name: '仙台大学', style: '攻撃型', power: 182 }, { league: '東北地域リーグ1部', rank: 4, name: 'FC LA U. de Sendai', style: 'バランス型', power: 176 }, { league: '東北地域リーグ1部', rank: 5, name: 'みちのく仙台', style: '標準', power: 107 }, { league: '東北地域リーグ1部', rank: 6, name: 'ガンジュ', style: '堅守', power: 102 }, { league: '東北地域リーグ1部', rank: 7, name: '七ヶ浜SC', style: '攻守に課題', power: 87 }, { league: '東北地域リーグ1部', rank: 8, name: '七戸サッカークラブ', style: '攻守に課題', power: 78 }, { league: '東北地域リーグ1部', rank: 9, name: '富士2003', style: '攻守に課題', power: 71 }, { league: '東北地域リーグ1部', rank: 10, name: '仙台SASUKE.FC', style: '攻守に課題', power: 68 },
    { league: '関東地域リーグ1部', rank: 1, name: '東京ユナイテッドFC', style: '堅守', power: 218 }, { league: '関東地域リーグ1部', rank: 2, name: '南葛', style: '攻撃型', power: 213 }, { league: '関東地域リーグ1部', rank: 3, name: '東邦チタニウム', style: '堅守', power: 178 }, { league: '関東地域リーグ1部', rank: 4, name: 'VONDS市原', style: '堅守', power: 164 }, { league: '関東地域リーグ1部', rank: 5, name: '日本大学サッカー部', style: '標準', power: 111 }, { league: '関東地域リーグ1部', rank: 6, name: '東京23FC', style: '標準', power: 98 }, { league: '関東地域リーグ1部', rank: 7, name: '桐横大FC', style: '攻守に課題', power: 91 }, { league: '関東地域リーグ1部', rank: 8, name: 'エリース東京', style: '堅守', power: 82 }, { league: '関東地域リーグ1部', rank: 9, name: '流経大ドラゴンズ龍ケ崎', style: '攻守に課題', power: 71 }, { league: '関東地域リーグ1部', rank: 10, name: 'つくばFC', style: '攻守に課題', power: 56 },
    { league: '北信越地域リーグ1部', rank: 1, name: '新庄クラブ', style: 'バランス型', power: 216 }, { league: '北信越地域リーグ1部', rank: 2, name: '福井ユナイテッドFC', style: '攻撃型', power: 211 }, { league: '北信越地域リーグ1部', rank: 3, name: 'JAPAN.S.C', style: 'バランス型', power: 198 }, { league: '北信越地域リーグ1部', rank: 4, name: '新潟医療福祉大学FC', style: '標準', power: 120 }, { league: '北信越地域リーグ1部', rank: 5, name: 'アルティスタ浅間', style: '堅守', power: 111 }, { league: '北信越地域リーグ1部', rank: 6, name: '新潟経営大FC', style: '攻守に課題', power: 64 }, { league: '北信越地域リーグ1部', rank: 7, name: '北陸大', style: '攻守に課題', power: 60 }, { league: '北信越地域リーグ1部', rank: 8, name: 'Komatsu', style: '攻守に課題', power: 59 },
    { league: '東海地域リーグ1部', rank: 1, name: 'モスペリオ', style: 'バランス型', power: 204 }, { league: '東海地域リーグ1部', rank: 2, name: 'FC伊勢志摩', style: 'バランス型', power: 184 }, { league: '東海地域リーグ1部', rank: 3, name: 'FC刈谷', style: '堅守', power: 156 }, { league: '東海地域リーグ1部', rank: 4, name: '藤枝市役所', style: '攻守に課題', power: 111 }, { league: '東海地域リーグ1部', rank: 5, name: '中京大学FC', style: '標準', power: 109 }, { league: '東海地域リーグ1部', rank: 6, name: 'wyvern', style: '堅守', power: 93 }, { league: '東海地域リーグ1部', rank: 7, name: 'Vencedor Mie United Club', style: '攻守に課題', power: 87 }, { league: '東海地域リーグ1部', rank: 8, name: 'AS刈谷', style: '攻守に課題', power: 68 },
    { league: '関西地域リーグ1部', rank: 1, name: '和歌山', style: 'バランス型', power: 207 }, { league: '関西地域リーグ1部', rank: 2, name: 'BASARA HYOGO', style: 'バランス型', power: 207 }, { league: '関西地域リーグ1部', rank: 3, name: 'Cento Cuore HARIMA', style: '堅守', power: 118 }, { league: '関西地域リーグ1部', rank: 4, name: 'AS.ラランジャ京都', style: '標準', power: 109 }, { league: '関西地域リーグ1部', rank: 5, name: '守山侍2000', style: '堅守', power: 107 }, { league: '関西地域リーグ1部', rank: 6, name: 'VELAGO生駒', style: '標準', power: 98 }, { league: '関西地域リーグ1部', rank: 7, name: 'AWJ', style: '攻守に課題', power: 91 }, { league: '関西地域リーグ1部', rank: 8, name: '神戸FC1970', style: '攻守に課題', power: 50 },
    { league: '中国地域リーグ', rank: 1, name: '福山シティ', style: 'バランス型', power: 231 }, { league: '中国地域リーグ', rank: 2, name: 'ベルガロッソ浜田', style: 'バランス型', power: 198 }, { league: '中国地域リーグ', rank: 3, name: '環太平洋大学', style: '攻撃型', power: 187 }, { league: '中国地域リーグ', rank: 4, name: 'Yonago Genki SC', style: '堅守', power: 122 }, { league: '中国地域リーグ', rank: 5, name: '廿日市', style: '攻守に課題', power: 122 }, { league: '中国地域リーグ', rank: 6, name: 'バレイン下関', style: '標準', power: 118 }, { league: '中国地域リーグ', rank: 7, name: '三菱水島FC', style: '攻守に課題', power: 100 }, { league: '中国地域リーグ', rank: 8, name: 'SRC広島', style: '攻守に課題', power: 98 }, { league: '中国地域リーグ', rank: 9, name: 'JXTGエネルギー水島', style: '攻守に課題', power: 51 }, { league: '中国地域リーグ', rank: 10, name: 'バンメル鳥取', style: '攻守に課題', power: 68 },
    { league: '四国地域リーグ', rank: 1, name: 'FC徳島', style: 'バランス型', power: 250 }, { league: '四国地域リーグ', rank: 2, name: 'SONIO高松', style: '攻撃型', power: 180 }, { league: '四国地域リーグ', rank: 3, name: '多度津FC', style: 'バランス型', power: 173 }, { league: '四国地域リーグ', rank: 4, name: 'レベニロッソNC', style: '攻守に課題', power: 102 }, { league: '四国地域リーグ', rank: 5, name: 'Llamas高知FC', style: '堅守', power: 102 }, { league: '四国地域リーグ', rank: 6, name: 'アルヴェリオ高松', style: '攻守に課題', power: 91 }, { league: '四国地域リーグ', rank: 7, name: 'KUFC南国', style: '攻守に課題', power: 76 }, { league: '四国地域リーグ', rank: 8, name: 'YFC四国中央', style: '攻守に課題', power: 53 },
    { league: '九州地域リーグ', rank: 1, name: 'ジェイリース', style: 'バランス型', power: 220 }, { league: '九州地域リーグ', rank: 2, name: 'J.FC Miyazaki', style: '攻撃型', power: 209 }, { league: '九州地域リーグ', rank: 3, name: 'AGATA', style: 'バランス型', power: 209 }, { league: '九州地域リーグ', rank: 4, name: '九州三菱自動車', style: '標準', power: 180 }, { league: '九州地域リーグ', rank: 5, name: '三菱重工長崎SC', style: '攻守に課題', power: 109 }, { league: '九州地域リーグ', rank: 6, name: 'Brew KASHIMA', style: '攻守に課題', power: 91 }, { league: '九州地域リーグ', rank: 7, name: '川副クラブ', style: '攻守に課題', power: 84 }, { league: '九州地域リーグ', rank: 8, name: '日本製鉄大分', style: '攻守に課題', power: 80 }, { league: '九州地域リーグ', rank: 9, name: 'NIFS Kanoya', style: '攻守に課題', power: 73 }, { league: '九州地域リーグ', rank: 10, name: '博多', style: '攻守に課題', power: 59 },
    { league: 'JFL', rank: 1, name: 'レイラック滋賀', style: '攻撃型', power: 400 }, { league: 'JFL', rank: 2, name: 'Honda FC', style: 'バランス型', power: 389 }, { league: 'JFL', rank: 3, name: 'ラインメール青森', style: '堅守', power: 384 }, { league: 'JFL', rank: 4, name: '沖縄SV', style: 'バランス型', power: 374 }, { league: 'JFL', rank: 5, name: 'ヴェルスパ大分', style: '堅守', power: 366 }, { league: 'JFL', rank: 6, name: 'ブリオベッカ浦安･市川', style: '堅守', power: 366 }, { league: 'JFL', rank: 7, name: 'FCティアモ枚方', style: '攻撃型', power: 342 }, { league: 'JFL', rank: 8, name: 'ミネベアミツミFC', style: '標準', power: 318 }, { league: 'JFL', rank: 9, name: 'ヴィアティン三重', style: '標準', power: 313 }, { league: 'JFL', rank: 10, name: 'いわてグルージャ盛岡', style: '標準', power: 313 }, { league: 'JFL', rank: 11, name: 'FCマルヤス岡崎', style: '標準', power: 313 }, { league: 'JFL', rank: 12, name: 'クリアソン新宿', style: '標準', power: 304 }, { league: 'JFL', rank: 13, name: 'アトレチコ鈴鹿', style: '攻守に課題', power: 292 }, { league: 'JFL', rank: 14, name: 'Y.S.C.C.横浜', style: '攻守に課題', power: 279 }, { league: 'JFL', rank: 15, name: '横河武蔵野FC', style: '攻守に課題', power: 279 }, { league: 'JFL', rank: 16, name: '飛鳥FC', style: '堅守', power: 250 },
    { league: 'J1リーグ', rank: 1, name: '鹿島アントラーズ', style: 'バランス型', power: 930 }, { league: 'J1リーグ', rank: 2, name: '京都サンガF.C.', style: '攻撃型', power: 884 }, { league: 'J1リーグ', rank: 3, name: '柏レイソル', style: '標準', power: 879 }, { league: 'J1リーグ', rank: 4, name: 'ヴィッセル神戸', style: 'バランス型', power: 879 }, { league: 'J1リーグ', rank: 5, name: 'サンフレッチェ広島', style: 'バランス型', power: 844 }, { league: 'J1リーグ', rank: 6, name: 'FC町田ゼルビア', style: '堅守', power: 811 }, { league: 'J1リーグ', rank: 7, name: '川崎フロンターレ', style: '攻撃型', power: 753 }, { league: 'J1リーグ', rank: 8, name: 'ガンバ大阪', style: '堅守', power: 721 }, { league: 'J1リーグ', rank: 9, name: '浦和レッズ', style: '堅守', power: 713 }, { league: 'J1リーグ', rank: 10, name: 'セレッソ大阪', style: '標準', power: 643 }, { league: 'J1リーグ', rank: 11, name: '清水エスパルス', style: '攻撃型', power: 603 }, { league: 'J1リーグ', rank: 12, name: 'FC東京', style: '標準', power: 584 }, { league: 'J1リーグ', rank: 13, name: '名古屋グランパス', style: '堅守', power: 543 }, { league: 'J1リーグ', rank: 14, name: 'ファジアーノ岡山', style: '堅守', power: 533 }, { league: 'J1リーグ', rank: 15, name: '東京ヴェルディ', style: '堅守', power: 528 }, { league: 'J1リーグ', rank: 16, name: 'アビスパ福岡', style: '堅守', power: 528 }, { league: 'J1リーグ', rank: 17, name: '横浜F・マリノス', style: '攻撃型', power: 433 }, { league: 'J1リーグ', rank: 18, name: '横浜FC', style: 'バランス型', power: 395 }, { league: 'J1リーグ', rank: 19, name: '湘南ベルマーレ', style: '攻守に課題', power: 350 }, { league: 'J1リーグ', rank: 20, name: 'アルビレックス新潟', style: '攻撃型', power: 322 },
    { league: 'J2リーグ', rank: 1, name: '水戸ホーリーホック', style: '攻撃型', power: 700 }, { league: 'J2リーグ', rank: 2, name: 'V・ファーレン長崎', style: '攻撃型', power: 696 }, { league: 'J2リーグ', rank: 3, name: 'ベガルタ仙台', style: '堅守', power: 623 }, { league: 'J2リーグ', rank: 4, name: 'サガン鳥栖', style: '攻守に課題', power: 609 }, { league: 'J2リーグ', rank: 5, name: '徳島ヴォルティス', style: '標準', power: 605 }, { league: 'J2リーグ', rank: 6, name: 'ジェフユナイテッド千葉', style: '攻撃型', power: 588 }, { league: 'J2リーグ', rank: 7, name: 'いわきFC', style: '標準', power: 565 }, { league: 'J2リーグ', rank: 8, name: 'ジュビロ磐田', style: '攻守に課題', power: 549 }, { league: 'J2リーグ', rank: 9, name: '北海道コンサドーレ札幌', style: '標準', power: 528 }, { league: 'J2リーグ', rank: 10, name: 'ヴァンフォーレ甲府', style: '標準', power: 528 }, { league: 'J2リーグ', rank: 11, name: 'モンテディオ山形', style: '標準', power: 518 }, { league: 'J2リーグ', rank: 12, name: 'ブラウブリッツ秋田', style: '堅守', power: 514 }, { league: 'J2リーグ', rank: 13, name: '藤枝MYFC', style: '攻撃型', power: 453 }, { league: 'J2リーグ', rank: 14, name: 'ロアッソ熊本', style: '標準', power: 434 }, { league: 'J2リーグ', rank: 15, name: '大分トリニータ', style: '標準', power: 418 }, { league: 'J2リーグ', rank: 16, name: 'レノファ山口FC', style: '攻守に課題', power: 382 }, { league: 'J2リーグ', rank: 17, name: 'カターレ富山', style: '標準', power: 372 }, { league: 'J2リーグ', rank: 18, name: '愛媛FC', style: '堅守', power: 350 },
    { league: 'J3リーグ', rank: 1, name: 'ヴァンラーレ八戸', style: '標準', power: 550 }, { league: 'J3リーグ', rank: 2, name: '栃木シティ', style: '標準', power: 481 }, { league: 'J3リーグ', rank: 3, name: '鹿児島ユナイテッドFC', style: '攻守に課題', power: 477 }, { league: 'J3リーグ', rank: 4, name: 'テゲバジャーロ宮崎', style: '攻守に課題', power: 459 }, { league: 'J3リーグ', rank: 5, name: 'FC大阪', style: '堅守', power: 446 }, { league: 'J3リーグ', rank: 6, name: '栃木SC', style: '攻守に課題', power: 421 }, { league: 'J3リーグ', rank: 7, name: 'FC今治', style: 'バランス型', power: 421 }, { league: 'J3リーグ', rank: 8, name: '奈良クラブ', style: '攻守に課題', power: 415 }, { league: 'J3リーグ', rank: 9, name: 'RB大宮アルディージャ', style: 'バランス型', power: 409 }, { league: 'J3リーグ', rank: 10, name: 'ツエーゲン金沢', style: '標準', power: 402 }, { league: 'J3リーグ', rank: 11, name: '松本山雅FC', style: '標準', power: 388 }, { league: 'J3リーグ', rank: 12, name: 'FC岐阜', style: '攻守に課題', power: 388 }, { league: 'J3リーグ', rank: 13, name: '福島ユナイテッドFC', style: '標準', power: 384 }, { league: 'J3リーグ', rank: 14, name: 'SC相模原', style: '標準', power: 377 }, { league: 'J3リーグ', rank: 15, name: 'ギラヴァンツ北九州', style: '攻守に課題', power: 376 }, { league: 'J3リーグ', rank: 16, name: 'ガイナーレ鳥取', style: '攻守に課題', power: 373 }, { league: 'J3リーグ', rank: 17, name: 'FC琉球', style: '攻守に課題', power: 365 }, { league: 'J3リーグ', rank: 18, name: '高知ユナイテッドSC', style: '標準', power: 355 }, { league: 'J3リーグ', rank: 19, name: 'AC長野パルセイロ', style: '攻守に課題', power: 331 }, { league: 'J3リーグ', rank: 20, name: 'ザスパ群馬', style: '攻守に課題', power: 321 }, { league: 'J3リーグ', rank: 21, name: 'カマタマーレ讃岐', style: '攻守に課題', power: 320 }, { league: 'J3リーグ', rank: 22, name: 'アスルクラロ沼津', style: '攻守に課題', power: 300 }
];

// リーグ構造とパラメータ
const leagueStructure = {
    '地域リーグ': { name: '地域リーグ', level: 0, teamCount: 8, matches: 14, promotion: 1, relegation: 1, ticketPrice: 10000, distribution: 3000000, powerCap: 250, debtCrisis: 15000000, personnelCost: 5000000, otherCost: 1000000 },
    'JFL': { name: 'JFL', level: 1, teamCount: 16, matches: 30, promotion: 1, promotionPlayoff: 2, relegation: 1, ticketPrice: 20000, distribution: 7000000, powerCap: 400, debtCrisis: 50000000, personnelCost: 20000000, otherCost: 2500000 },
    'J3': { name: 'J3', level: 2, teamCount: 20, matches: 38, promotion: 3, relegation: 1, relegationPlayoff: 19, ticketPrice: 20000, distribution: 20000000, powerCap: 550, debtCrisis: 70000000, personnelCost: 50000000, otherCost: 5000000 },
    'J2': { name: 'J2', level: 3, teamCount: 20, matches: 38, promotion: 3, relegation: 3, ticketPrice: 25000, distribution: 50000000, powerCap: 700, debtCrisis: 150000000, personnelCost: 100000000, otherCost: 10000000 },
    'J1': { name: 'J1', level: 4, teamCount: 20, matches: 38, promotion: 0, relegation: 3, ticketPrice: 50000, distribution: 100000000, powerCap: 1000, debtCrisis: 300000000, personnelCost: 300000000, otherCost: 20000000 }
};

const prefectures = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];
const regionMap = {
    "北海道": "北海道地域リーグ", "青森県": "東北地域リーグ1部", "岩手県": "東北地域リーグ1部", "宮城県": "東北地域リーグ1部", "秋田県": "東北地域リーグ1部", "山形県": "東北地域リーグ1部", "福島県": "東北地域リーグ1部",
    "茨城県": "関東地域リーグ1部", "栃木県": "関東地域リーグ1部", "群馬県": "関東地域リーグ1部", "埼玉県": "関東地域リーグ1部", "千葉県": "関東地域リーグ1部", "東京都": "関東地域リーグ1部", "神奈川県": "関東地域リーグ1部", "山梨県": "関東地域リーグ1部",
    "新潟県": "北信越地域リーグ1部", "富山県": "北信越地域リーグ1部", "石川県": "北信越地域リーグ1部", "福井県": "北信越地域リーグ1部", "長野県": "北信越地域リーグ1部",
    "岐阜県": "東海地域リーグ1部", "静岡県": "東海地域リーグ1部", "愛知県": "東海地域リーグ1部", "三重県": "東海地域リーグ1部",
    "滋賀県": "関西地域リーグ1部", "京都府": "関西地域リーグ1部", "大阪府": "関西地域リーグ1部", "兵庫県": "関西地域リーグ1部", "奈良県": "関西地域リーグ1部", "和歌山県": "関西地域リーグ1部",
    "鳥取県": "中国地域リーグ", "島根県": "中国地域リーグ", "岡山県": "中国地域リーグ", "広島県": "中国地域リーグ", "山口県": "中国地域リーグ",
    "徳島県": "四国地域リーグ", "香川県": "四国地域リーグ", "愛媛県": "四国地域リーグ", "高知県": "四国地域リーグ",
    "福岡県": "九州地域リーグ", "佐賀県": "九州地域リーグ", "長崎県": "九州地域リーグ", "熊本県": "九州地域リーグ", "大分県": "九州地域リーグ", "宮崎県": "九州地域リーグ", "鹿児島県": "九州地域リーグ", "沖縄県": "九州地域リーグ"
};

// ヘルパー関数
function showScreen(screenId) {
    document.querySelectorAll('.sim-game-screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

function showStory(title, message, onConfirm) {
    const storyContainer = document.getElementById('game-step-story');
    if (!storyContainer) return;

    storyContainer.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
            <h2>${title}</h2>
            <p style="text-align: left; max-width: 500px; margin: 20px auto; line-height: 1.8;">${message}</p>
            <button class="sim-game-btn" style="max-width: 300px; margin: 20px auto;">次へ</button>
        </div>
    `;

    storyContainer.querySelector('button').addEventListener('click', onConfirm);
    showScreen('game-step-story');
}

// ゲームの各ステップ
function setupCreationScreen() {
    const container = document.getElementById('simulation-game-container');
    const prefectureOptions = prefectures.map(pref => `<option value="${pref}">${pref}</option>`).join('');

    container.innerHTML = `
        <div id="game-step-story" class="sim-game-screen"></div>
        <div id="game-step-creation" class="sim-game-screen"></div>
        <div id="game-step-management" class="sim-game-screen"></div>
        <div id="game-step-season" class="sim-game-screen"></div>
        <div id="game-step-result" class="sim-game-screen"></div>
        <div id="game-step-playoff" class="sim-game-screen"></div>
        <div id="game-step-data" class="sim-game-screen"></div>
    `;

    showStory(
        '物語のはじまり',
        `あなたは、Jリーグ加盟・Jリーグ制覇という大きな夢を抱く、ある地方クラブのオーナーに就任した。<br><br>資金も、選手も、ファンも、何もないゼロからのスタート。<br>あなたの経営手腕だけが、このクラブを日本の頂点へと導く唯一の力となる。<br><br>さあ、クラブの歴史に、最初の1ページを刻もう。<br><br><b>MISSION:チームパワーMAX・観客数MAX、そして夢の専用スタジアム完成を達成せよ！`,
        () => {
            const creationScreen = document.getElementById('game-step-creation');
            if (creationScreen) {
                creationScreen.innerHTML = `
                    <h2>クラブ創設</h2>
                    <p>あなたのオリジナルクラブを創設し、Jリーグの頂点を目指しましょう！</p>
                    <div class="form-group"><label for="club-name-input">クラブ名</label><input type="text" id="club-name-input" class="sim-game-input" placeholder="例: FCドリーム"></div>
                    <div class="form-group"><label for="hometown-select">ホームタウン</label><select id="hometown-select" class="sim-game-input">${prefectureOptions}</select></div>
                    <div class="form-group"><label for="initial-assets-select">初期総資産</label><select id="initial-assets-select" class="sim-game-input">
                        <option value="30000000">3,000万円</option><option value="50000000" selected>5,000万円</option><option value="100000000">1億円</option>
                    </select></div>
                    <div class="form-group"><label for="initial-sponsors-select">初期スポンサー数 (小型)</label><select id="initial-sponsors-select" class="sim-game-input">
                        <option value="10">10社</option><option value="20" selected>20社</option><option value="30">30社</option><option value="50">50社</option>
                    </select></div>
                    <div class="form-group"><label for="manager-type-select">監督タイプ</label><select id="manager-type-select" class="sim-game-input">
                        <option value="attack">攻撃的</option><option value="defense">守備的</option><option value="balance" selected>安定型</option>
                    </select></div>
                    <button id="create-club-btn" class="sim-game-btn">クラブを創設する</button>
                `;
                creationScreen.querySelector('#create-club-btn').addEventListener('click', createClub);
                showScreen('game-step-creation');
            }
        }
    );
}

function createClub() {
    const clubName = document.getElementById('club-name-input').value;
    if (!clubName) { alert('クラブ名を入力してください。'); return; }

    const initialAssets = parseInt(document.getElementById('initial-assets-select').value, 10);
    const initialSponsors = parseInt(document.getElementById('initial-sponsors-select').value, 10);
    const hometown = document.getElementById('hometown-select').value;
    const managerType = document.getElementById('manager-type-select').value;

    gameState = {
        year: new Date().getFullYear(), clubName, hometown, league: '地域リーグ', teamPower: 100, fans: 300, reputation: 10, manager: managerType,
        history: [], totalAssets: initialAssets,
        cumulativeBalance: 0, deficitYears: 0, facilityInvestment: 0,
        sponsors: { small: initialSponsors, medium: 0, large: 0 }, lastSeasonAttendance: 300,
        regionalLeague: regionMap[hometown] || '関東地域リーグ1部',
        managerFiredThisSeason: false, // 監督解任フラグ
        justPromotedToJFL: false, // JFL昇格フラグ
        hasWonJ1: false, // J1優勝経験フラグ
        gameCleared: false // ゲームクリアフラグ
    };

    if (managerType === 'attack') gameState.teamPower += 35;
    else if (managerType === 'defense') gameState.teamPower += 10;
    else if (managerType === 'balance') gameState.teamPower += 20;

    gameState.budget = gameState.totalAssets;

    showStory(
        `${gameState.year}シーズン開幕`,
        `クラブ「${gameState.clubName}」が誕生した！<br><br>ホームタウンは${gameState.hometown}。所属するは${gameState.regionalLeague}だ。<br>最初の目標は、この厳しいリーグを勝ち抜き、JFLへの昇格を果たすこと。`,
        () => {
            showStory(
                '最初の経営判断',
                `オーナーとして、限られた予算をどこに投資するかを決めよう。<br><br><b>①チーム強化費:</b><br>選手の補強や育成に使い、チームの強さ（チームパワー）を直接上げる。<br><br><b>②宣伝・広報費:</b><br>クラブの知名度を上げ、観客数を増やす。<br><br><b>③施設投資費:</b><br>練習環境やスタジアムを改善し、観客数を増やす。投資を続けると、いつか専用スタジアムが手に入るかもしれない…。`,
                () => {
                    setupManagementScreen();
                    showScreen('game-step-management');
                }
            );
        }
    );
}

function setupManagementScreen() {
    // ゲームクリア条件チェック
    if (gameState.teamPower >= 1000 && gameState.lastSeasonAttendance >= 61500 && gameState.facilityInvestment >= 1000000000 && gameState.hasWonJ1) {
        gameState.gameCleared = true;
        showStory(
            '🏆 ゲームクリア！全ての数値が上限に達しました 🏆',
            `おめでとう！ あなたのクラブ「${gameState.clubName}」は、名実ともに日本を代表するビッグクラブとなった。<br><br>最強のチーム、熱狂的なサポーターで埋め尽くされた専用スタジアム、そして盤石な経営基盤。すべてを手に入れたあなたの挑戦は、伝説として語り継がれるだろう。<br><br>素晴らしい経営手腕に、最大の賛辞を！`,
            () => { 
                setupDataScreen(); // クリア後はデータ分析室へ
                showScreen('game-step-data');
            }
        );
        return;
    }

    const container = document.getElementById('game-step-management');

    const stadiumName = gameState.facilityInvestment >= 1000000000 ? `${gameState.clubName}スタジアム (専用)` : `${gameState.hometown}陸上競技場`;
    const budgetLimit = gameState.budget;
    const sliderMax = budgetLimit > 0 ? budgetLimit : 0;

    const stadiumProgress = Math.min(100, Math.floor(gameState.facilityInvestment / 1000000000 * 100));

    const defaultTotalInvestment = Math.floor(budgetLimit * 0.3);
    const defaultInvestmentPerSlider = Math.floor(defaultTotalInvestment / 3 / 1000000) * 1000000;

    const managerSection = (gameState.year > new Date().getFullYear() && !gameState.managerFiredThisSeason) ? `
        <div class="form-group" style="text-align: center; margin-top: 20px;">
            <button id="fire-manager-btn" class="sim-game-btn" style="background: #dc3545; max-width: 250px; margin: auto;">監督を解任する</button>
        </div>
    ` : '';

    const isTeamPowerMax = gameState.teamPower >= 950;
    const isFansMax = gameState.lastSeasonAttendance >= 61500;

    let teamSliderHTML;
    if (isTeamPowerMax) {
        teamSliderHTML = `<div class="slider-group"><p style="text-align:center; font-weight:bold; color: #baf7fa;">チームパワーは上限(950)に達しました。</p></div>`;
    } else {
        teamSliderHTML = `
            <div class="slider-group">
                <div class="slider-label"><span class="label-text">① チーム強化費</span><span id="team-invest-value" class="label-value">0円</span></div>
                <input type="range" id="team-invest-slider" class="sim-game-slider" min="0" max="${sliderMax}" step="1000000" value="${defaultInvestmentPerSlider}">
                <div class="slider-label" style="font-size: 0.9em; margin-top: 5px;"><span>効果: チームパワー <span id="team-power-effect" style="color: #A9D18E; font-weight: bold;">+0</span></span></div>
            </div>
        `;
    }

    let prSliderHTML;
    if (isFansMax) {
        prSliderHTML = `<div class="slider-group"><p style="text-align:center; font-weight:bold; color: #baf7fa;">観客数は上限(61,500人)に達しました。</p></div>`;
    } else {
        prSliderHTML = `
            <div class="slider-group">
                <div class="slider-label"><span class="label-text">② 宣伝・広報費</span><span id="pr-invest-value" class="label-value">0円</span></div>
                <input type="range" id="pr-invest-slider" class="sim-game-slider" min="0" max="${sliderMax}" step="1000000" value="${defaultInvestmentPerSlider}">
                <div class="slider-label" style="font-size: 0.9em; margin-top: 5px;"><span>効果: 観客数 <span id="pr-fan-effect" style="color: #A9D18E; font-weight: bold;">+0</span> / パワー <span id="pr-power-effect" style="color: #A9D18E; font-weight: bold;">+0</span></span></div>
            </div>
        `;
    }

    let facilitySliderHTML;
    if (stadiumProgress >= 100) {
        facilitySliderHTML = `<div class="slider-group"><p style="text-align:center; font-weight:bold; color: #baf7fa;">専用スタジアムは完成済みです。</p></div>`;
    } else if (isFansMax) {
        facilitySliderHTML = `<div class="slider-group"><p style="text-align:center; font-weight:bold; color: #baf7fa;">観客数が上限のため、施設投資はできません。</p></div>`;
    } else {
        facilitySliderHTML = `
            <div class="slider-group">
                <div class="slider-label"><span class="label-text">③ 施設投資費</span><span id="facility-invest-value" class="label-value">0円</span></div>
                <input type="range" id="facility-invest-slider" class="sim-game-slider" min="0" max="${sliderMax}" step="1000000" value="${defaultInvestmentPerSlider}">
                 <div class="slider-label" style="font-size: 0.9em; margin-top: 5px;"><span>効果: 観客数 <span id="facility-fan-effect" style="color: #A9D18E; font-weight: bold;">+0</span> / 専用スタジアムまで: ${stadiumProgress}%</span></div>
            </div>
        `;
    }
    
    // gameState.manager の値を日本語に変換
    const managerTypeText = {
        'attack': '攻撃的',
        'defense': '守備的',
        'balance': '安定型'
    }[gameState.manager] || '不明';


    container.innerHTML = `
        <h2>${gameState.year}シーズン 経営方針</h2>
        <div class="result-summary" style="margin-bottom: 15px;">
             <div class="result-summary-grid">
                <div class="result-item"><h3>現在の総資産</h3><div class="value">${gameState.totalAssets.toLocaleString()}円</div></div>
                <div class="result-item"><h3>チームパワー</h3><div class="value">${Math.round(gameState.teamPower)}</div></div>
                <div class="result-item"><h3>所属カテゴリー</h3><div class="value">${gameState.league}</div></div>
                <div class="result-item"><h3>昨季平均観客数</h3><div class="value">${gameState.lastSeasonAttendance.toLocaleString()}人</div></div>
                <div class="result-item"><h3>スポンサー</h3><div class="value" style="font-size: 1rem;">小:${gameState.sponsors.small} 中:${gameState.sponsors.medium} 大:${gameState.sponsors.large}</div></div>
                <div class="result-item"><h3>スタジアム</h3><div class="value" style="font-size: 1.2em;">${stadiumName}</div></div>
                <div class="result-item"><h3>監督タイプ</h3><div class="value">${managerTypeText}</div></div>
             </div>
        </div>
        <button id="show-data-btn" class="sim-game-btn" style="background: #5a6268; max-width: 250px; margin: 0 auto 20px auto; padding: 10px;">経営データを見る</button>
        ${managerSection}
        <p style="text-align: left; font-weight: bold;">今季の投資可能額: ${budgetLimit.toLocaleString()}円</p>
        <div class="budget-sliders">
            ${teamSliderHTML}
            ${prSliderHTML}
            ${facilitySliderHTML}
        </div>
        <div id="budget-summary">投資合計額: <span id="total-invested">0</span>円</div>
        <button id="start-season-btn" class="sim-game-btn">シーズンを開始する</button>
    `;

    document.getElementById('show-data-btn').addEventListener('click', () => {
        setupDataScreen();
        showScreen('game-step-data');
    });

    const fireManagerBtn = document.getElementById('fire-manager-btn');
    if(fireManagerBtn) {
        fireManagerBtn.addEventListener('click', () => {
            if(confirm('本当に監督を解任しますか？今シーズンは、もう監督交代はできません。')) {
                gameState.managerFiredThisSeason = true;
                showManagerSelection();
            }
        });
    }

    const sliders = { team: document.getElementById('team-invest-slider'), pr: document.getElementById('pr-invest-slider'), facility: document.getElementById('facility-invest-slider') };
    const values = { team: document.getElementById('team-invest-value'), pr: document.getElementById('pr-invest-value'), facility: document.getElementById('facility-invest-value') };
    const effects = { teamPower: document.getElementById('team-power-effect'), prFan: document.getElementById('pr-fan-effect'), prPower: document.getElementById('pr-power-effect'), facilityFan: document.getElementById('facility-fan-effect') };
    const totalInvestedEl = document.getElementById('total-invested');

    function updateBudget() {
        let totalInvested = 0;
        Object.values(sliders).forEach(slider => {
            if (slider) totalInvested += parseInt(slider.value, 10);
        });
    
        if (totalInvested > budgetLimit) {
            const overBudget = totalInvested - budgetLimit;
            const changedSliderId = this?.id;
            let adjusted = false;
    
            if (changedSliderId && sliders[changedSliderId.split('-')[0]]) {
                const sliderToAdjust = document.getElementById(changedSliderId);
                const currentValue = parseInt(sliderToAdjust.value, 10);
                if (currentValue >= overBudget) {
                    sliderToAdjust.value = currentValue - overBudget;
                    adjusted = true;
                }
            }
    
            if (!adjusted) {
                for (const key of Object.keys(sliders).reverse()) { // 施設費から引くように逆順で
                    if (sliders[key]) {
                        const slider = sliders[key];
                        const currentValue = parseInt(slider.value, 10);
                        if (currentValue > 0) {
                            const reduction = Math.min(currentValue, overBudget);
                            slider.value = currentValue - reduction;
                            totalInvested -= reduction;
                            if (totalInvested <= budgetLimit) break;
                        }
                    }
                }
            }
        }
    
        let newTotal = 0;
        for (const key in sliders) {
            if (sliders[key]) {
                const value = parseInt(sliders[key].value, 10);
                if (values[key]) values[key].textContent = `${value.toLocaleString()}円`;
                newTotal += value;
            }
        }
        if (totalInvestedEl) totalInvestedEl.textContent = `${newTotal.toLocaleString()}`;
    
        const leagueInfo = leagueStructure[gameState.league];
        const teamInvest = sliders.team ? parseInt(sliders.team.value, 10) * 1.5 : 0;
        const prInvest = sliders.pr ? parseInt(sliders.pr.value, 10) * 1.5 : 0;
        const facilityInvest = sliders.facility ? parseInt(sliders.facility.value, 10) * 1.5 : 0;

        const powerGain = Math.floor(teamInvest / 2000000);
        if (effects.teamPower) effects.teamPower.textContent = `+${powerGain}`;

        const leagueBonus = (leagueInfo.level + 1) * 0.2;
        const prFansGain = Math.floor(prInvest / 50000 * leagueBonus);
        if (effects.prFan) effects.prFan.textContent = `+${prFansGain}`;
        if (effects.prPower) effects.prPower.textContent = `+${Math.floor(prInvest / 10000000)}`;

        const stadiumBonus = gameState.facilityInvestment >= 1000000000 ? 2 : 1;
        const facilityFansGain = Math.floor(facilityInvest / 2000000 * stadiumBonus);
        if (effects.facilityFan) effects.facilityFan.textContent = `+${facilityFansGain}`;
    }
    
    Object.values(sliders).forEach(slider => {
        if(slider) slider.addEventListener('input', updateBudget);
    });
    updateBudget();

    document.getElementById('start-season-btn').addEventListener('click', startSeason);
}

function showManagerSelection() {
    const container = document.getElementById('game-step-management');
    container.innerHTML = `
        <h2>監督交代</h2>
        <p>新しい監督を選んでください。</p>
        <div class="form-group">
            <label for="manager-type-select">監督タイプ</label>
            <select id="manager-type-select" class="sim-game-input">
                <option value="attack">攻撃的 (+35 / 降格リスク有)</option>
                <option value="defense">守備的 (+10 / 降格リスク無)</option>
                <option value="balance" selected>安定型 (+20)</option>
            </select>
        </div>
        <button id="confirm-manager-btn" class="sim-game-btn">この監督と契約する</button>
    `;

    document.getElementById('confirm-manager-btn').addEventListener('click', () => {
        const managerType = document.getElementById('manager-type-select').value;
        // 既存の監督ボーナスをリセット
        if (gameState.manager === 'attack') gameState.teamPower -= 35;
        else if (gameState.manager === 'defense') gameState.teamPower -= 10;
        else if (gameState.manager === 'balance') gameState.teamPower -= 20;
        
        // 新しい監督のボーナスを追加
        gameState.manager = managerType;
        if (managerType === 'attack') gameState.teamPower += 35;
        else if (managerType === 'defense') gameState.teamPower += 10;
        else if (managerType === 'balance') gameState.teamPower += 20;

        setupManagementScreen();
        showScreen('game-step-management');
    });
}


function startSeason() {
    gameState.managerFiredThisSeason = false; // シーズン開始時にリセット
    gameState.investments = {
        team: parseInt(document.getElementById('team-invest-slider')?.value || 0, 10),
        pr: parseInt(document.getElementById('pr-invest-slider')?.value || 0, 10),
        facility: parseInt(document.getElementById('facility-invest-slider')?.value || 0, 10)
    };

    const leagueInfo = leagueStructure[gameState.league];
    const teamInvest = gameState.investments.team * 1.5;
    const prInvest = gameState.investments.pr * 1.5;
    const facilityInvest = gameState.investments.facility * 1.5;

    let powerGain = Math.floor(teamInvest / 2000000);
    powerGain += Math.floor(prInvest / 10000000);
    gameState.teamPower = Math.min(1000, gameState.teamPower + powerGain);

    const leagueBonus = (leagueInfo.level + 1) * 0.2;
    let fansGain = Math.floor(prInvest / 50000 * leagueBonus);
    
    const stadiumBonus = gameState.facilityInvestment >= 1000000000 ? 2 : 1;
    fansGain += Math.floor(facilityInvest / 2000000 * stadiumBonus);
    
    gameState.fans = Math.min(61500, gameState.fans + fansGain);

    gameState.reputation += Math.floor(gameState.investments.facility / 1000000);
    gameState.facilityInvestment += gameState.investments.facility;

    showScreen('game-step-season');
    simulateSeason();
}

async function simulateSeason() {
    const container = document.getElementById('game-step-season');
    container.innerHTML = `<h2>${gameState.year}シーズン進行中...</h2><div id="season-progress-bar-container"><div id="season-progress-bar">0%</div></div><div id="season-live-standings">現在の順位: -位</div><div id="season-log"></div>`;

    const progressBar = document.getElementById('season-progress-bar'), standingsEl = document.getElementById('season-live-standings'), logEl = document.getElementById('season-log');
    const leagueInfo = leagueStructure[gameState.league];

    const opponentsSource = gameState.league === '地域リーグ'
        ? allClubsData.filter(c => c.league === gameState.regionalLeague)
        : leagueStructure[gameState.league].opponents;

    let seasonResult = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    const otherTeams = opponentsSource.filter(c => c.name !== gameState.clubName).sort(() => 0.5 - Math.random()).slice(0, leagueInfo.teamCount - 1);
    const allTeamsInLeague = [{ name: gameState.clubName, power: gameState.teamPower }, ...otherTeams];

    const schedule = [];
    if (leagueInfo.teamCount > 1) {
        for (let i = 0; i < allTeamsInLeague.length; i++) {
            for (let j = i + 1; j < allTeamsInLeague.length; j++) {
                schedule.push({ home: allTeamsInLeague[i], away: allTeamsInLeague[j] });
                schedule.push({ home: allTeamsInLeague[j], away: allTeamsInLeague[i] });
            }
        }
    }
    while (schedule.length > leagueInfo.matches * (leagueInfo.teamCount / 2)) {
        schedule.splice(Math.floor(Math.random() * schedule.length), 1);
    }

    let standings = allTeamsInLeague.map(t => ({ name: t.name, power: t.power, points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0 }));

    for (let i = 0; i < leagueInfo.matches; i++) {
        const matchDay = schedule.filter(m => !m.played).slice(0, Math.floor(leagueInfo.teamCount / 2));

        for (const match of matchDay) {
            const home = standings.find(t => t.name === match.home.name);
            const away = standings.find(t => t.name === match.away.name);

            if (!home || !away) continue;

            const powerDiff = home.power - away.power;
            const winProb = 0.5 + (powerDiff / 500);
            const drawProb = 0.25 - Math.abs(powerDiff / 1000);

            let result;
            const rand = Math.random();

            if (rand < winProb) { result = 'win'; }
            else if (rand < winProb + drawProb) { result = 'draw'; }
            else { result = 'loss'; }

            let homeScore = 0, awayScore = 0;
            switch(result) {
                case 'win':
                    home.wins++; home.points += 3; away.losses++;
                    homeScore = Math.floor(Math.random() * 3) + 1;
                    awayScore = Math.floor(Math.random() * homeScore);
                    break;
                case 'draw':
                    home.draws++; home.points += 1; away.draws++; away.points += 1;
                    homeScore = Math.floor(Math.random() * 3);
                    awayScore = homeScore;
                    break;
                case 'loss':
                    home.losses++; away.wins++; away.points += 3;
                    awayScore = Math.floor(Math.random() * 3) + 1;
                    homeScore = Math.floor(Math.random() * awayScore);
                    break;
            }
            home.gf += homeScore; home.ga += awayScore;
            away.gf += awayScore; away.ga += homeScore;

            if (home.name === gameState.clubName) {
                logEl.innerHTML += `第${i + 1}節 vs ${away.name} (H): ${homeScore}-${awayScore} (${result})<br>`;
            } else if (away.name === gameState.clubName) {
                logEl.innerHTML += `第${i + 1}節 vs ${home.name} (A): ${homeScore}-${awayScore} (${result})<br>`;
            }
            match.played = true;
        }

        standings.forEach(team => team.gd = team.gf - team.ga);
        standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
        const myRank = standings.findIndex(t => t.name === gameState.clubName) + 1;

        const progress = ((i + 1) / leagueInfo.matches) * 100;
        progressBar.style.width = `${progress}%`; progressBar.textContent = `${Math.round(progress)}%`;
        standingsEl.textContent = `現在の順位: ${myRank}位`;
        logEl.scrollTop = logEl.scrollHeight;

        await new Promise(resolve => setTimeout(resolve, 50));
    }

    const myFinalStats = standings.find(t => t.name === gameState.clubName);

    if (gameState.manager === 'attack' && Math.random() < 0.15) { // 15%の確率で強制降格順位に
        const relegationRank = leagueInfo.teamCount - leagueInfo.relegation + 1;
        const myCurrentRank = standings.findIndex(t => t.name === gameState.clubName) + 1;
        if (myCurrentRank < relegationRank) {
            standings = standings.filter(t => t.name !== gameState.clubName);
            const myTeam = { name: gameState.clubName, ...myFinalStats };
            standings.splice(relegationRank - 1, 0, myTeam);
        }
    }

    gameState.seasonResult = { wins: myFinalStats.wins, draws: myFinalStats.draws, losses: myFinalStats.losses, goalsFor: myFinalStats.gf, goalsAgainst: myFinalStats.ga, points: myFinalStats.points };
    gameState.finalRank = standings.findIndex(t => t.name === gameState.clubName) + 1;
    gameState.finalStandings = standings;

    showResultScreen();
}

function showResultScreen(fromPlayoff = false, playoffResult = null) {
    const container = document.getElementById('game-step-result');
    const originalLeague = fromPlayoff ? playoffResult.originalLeague : gameState.league;
    const leagueInfo = leagueStructure[originalLeague];

    // 収支計算
    const sponsorIncome = (gameState.sponsors.small * 1000000) + (gameState.sponsors.medium * 3000000) + (gameState.sponsors.large * 8000000);
    const rankBonus = Math.max(0, (5 - gameState.finalRank) * 0.1);
    const attendance = Math.floor(gameState.fans * (0.8 + rankBonus));
    const gateIncome = attendance * leagueInfo.ticketPrice;
    const distribution = leagueInfo.distribution;
    const totalIncome = sponsorIncome + gateIncome + distribution;
    const totalInvestments = gameState.investments.team + gameState.investments.pr + gameState.investments.facility;
    const totalFixedCosts = leagueInfo.personnelCost + leagueInfo.otherCost;
    const totalExpenditure = totalInvestments + totalFixedCosts;
    const annualBalance = totalIncome - totalExpenditure;

    const beginningTotalAssets = gameState.totalAssets;
    
    // プレーオフからの遷移でない場合のみ、財務と履歴を更新
    if (!fromPlayoff) {
        gameState.totalAssets += annualBalance;
        gameState.cumulativeBalance += annualBalance;
        if (annualBalance < 0) { gameState.deficitYears++; } else { gameState.deficitYears = 0; }

        gameState.history.push({
            year: gameState.year, league: gameState.league, rank: gameState.finalRank,
            attendance: attendance, balance: annualBalance, totalAssets: gameState.totalAssets
        });
    }
    gameState.lastSeasonAttendance = attendance;

    // 経営破綻チェック
    if (beginningTotalAssets < 5000000 || gameState.totalAssets < 0) {
        let reason = "経営判断の誤りにより";
        if (beginningTotalAssets < 5000000) reason = "期首の資産が500万円未満で人件費が支払えず";
        else if (gameState.totalAssets < 0) reason = "債務超過に陥り";
        container.innerHTML = `<h2>経営破綻</h2><div id="promotion-relegation-text"><span style="color: #FF9999;">${reason}、クラブは経営破綻しました...</span><p>あなたの挑戦はここで終わりです。</p></div><button id="restart-game-btn" class="sim-game-btn">もう一度挑戦する</button>`;
        document.getElementById('restart-game-btn').addEventListener('click', setupCreationScreen);
        showScreen('game-step-result');
        return;
    }
    
    // ゲームクリア条件チェック
    if (gameState.teamPower >= 1000 && gameState.lastSeasonAttendance >= 61500 && gameState.facilityInvestment >= 1000000000 && gameState.hasWonJ1) {
        gameState.gameCleared = true;
        showStory(
            '🏆 ゲームクリア！全ての数値が上限に達しました 🏆',
            `おめでとう！ あなたのクラブ「${gameState.clubName}」は、名実ともに日本を代表するビッグクラブとなった。<br><br>最強のチーム、熱狂的なサポーターで埋め尽くされた専用スタジアム、そして盤石な経営基盤。すべてを手に入れたあなたの挑戦は、伝説として語り継がれるだろう。<br><br>素晴らしい経営手腕に、最大の賛辞を！`,
            () => { 
                setupDataScreen(); // クリア後はデータ分析室へ
                showScreen('game-step-data');
            }
        );
        return;
    }

    let alertText = '';
    if (gameState.deficitYears >= 3) { alertText = `<p style="color: #FF9999; font-weight: bold;">警告: ${gameState.deficitYears}年連続の赤字です。赤字が続くと経営破綻します。</p>`; }
    else if (beginningTotalAssets < 15000000) { alertText = `<p style="color: #FF9999; font-weight: bold;">警告: 資産が1500万円を下回りました。経営に注意してください。</p>`;}

    let statusText = '', subText = '', newLeague = gameState.league;
    
    if (fromPlayoff) {
        statusText = playoffResult.statusText;
        subText = playoffResult.subText;
        newLeague = playoffResult.newLeague;
    } else {
        const leagueLevels = Object.values(leagueStructure).sort((a, b) => a.level - b.level);
        const currentLeagueIndex = leagueLevels.findIndex(l => l.name === gameState.league);
        const canPromoteToJ3 = gameState.league === 'JFL' && attendance >= 2000;

        if (gameState.league === 'JFL' && gameState.finalRank === leagueInfo.promotionPlayoff) {
            showPlayoffScreen('J3', 'JFL'); return;
        } else if (gameState.league === 'J3' && gameState.finalRank === leagueInfo.relegationPlayoff) {
            showPlayoffScreen('J3', 'JFL'); return;
        } else if (gameState.league === 'J1' && gameState.finalRank === 1) {
            statusText = `<span class="result-celebrate">🏆 J1優勝！</span>`;
            subText = `クラブの歴史に、新たな黄金時代が刻まれた！`;
            gameState.hasWonJ1 = true; // J1優勝フラグを立てる
        } else if (gameState.finalRank <= leagueInfo.promotion) {
            if (leagueInfo.level < 4) {
                if (gameState.league === 'JFL' && !canPromoteToJ3) {
                    statusText = `<span class="result-fail">昇格失敗...</span>`;
                    subText = `順位要件は満たしたが、平均観客数2,000人の壁に阻まれた。来季は集客にも力を入れよう。`;
                } else {
                    newLeague = leagueLevels[currentLeagueIndex + 1].name;
                    statusText = `<span class="result-promote">祝！ ${newLeague}へ昇格！</span>`;
                    subText = (newLeague === 'J3') ? `ついにJリーグの舞台へ！夢への挑戦がここから始まる。` : `クラブは新たなステージへ！挑戦は続く。`;
                    if (newLeague === 'JFL') gameState.justPromotedToJFL = true;
                }
            }
        } else if (gameState.finalRank > (leagueInfo.teamCount - leagueInfo.relegation)) {
            if (leagueInfo.level > 0) {
                newLeague = leagueLevels[currentLeagueIndex - 1].name;
                statusText = `<span class="result-relegate">無念… ${newLeague}へ降格…</span>`;
                subText = `この悔しさを胸に、一年で必ず這い上がろう。`;
            } else {
                 container.innerHTML = `<h2>経営破綻</h2><div id="promotion-relegation-text"><span style="color: #FF9999;">地域リーグで最下位となり、クラブは解散した...</span><p>あなたの挑戦はここで終わりです。</p></div><button id="restart-game-btn" class="sim-game-btn">もう一度挑戦する</button>`;
                 document.getElementById('restart-game-btn').addEventListener('click', setupCreationScreen);
                 showScreen('game-step-result');
                 return;
            }
        } else {
            statusText = `${gameState.league}残留`;
            subText = gameState.league === 'J1' ? `来シーズンこそは、この国の頂点を目指そう！` : `来シーズンこそは、上のカテゴリーを目指そう！`;
        }
    }

    if (newLeague !== gameState.league) {
        if (statusText.includes('昇格')) {
            if (newLeague === 'JFL') { gameState.fans += 1000; }
            else if (newLeague === 'J3') { gameState.fans += 500; gameState.sponsors.small = Math.min(100, gameState.sponsors.small + 1); gameState.sponsors.medium = Math.min(50, gameState.sponsors.medium + 1); }
            else if (newLeague === 'J2') { gameState.fans += 3000; gameState.sponsors.medium = Math.min(50, gameState.sponsors.medium + 2); }
            else if (newLeague === 'J1') { gameState.fans += 6000; gameState.sponsors.large = Math.min(30, gameState.sponsors.large + 1); }
            const nextLeagueOpponents = leagueStructure[newLeague].opponents;
            if (nextLeagueOpponents.length > 0) {
                const avgPower = nextLeagueOpponents.reduce((s, t) => s + t.power, 0) / nextLeagueOpponents.length;
                gameState.teamPower = Math.floor((gameState.teamPower + avgPower) / 2) + 20;
            } else { gameState.teamPower = Math.floor(gameState.teamPower * 1.2); }
        } else { // 降格
            gameState.teamPower = Math.floor(gameState.teamPower * 0.9);
            if (gameState.league === 'JFL') { gameState.fans = Math.max(300, gameState.fans - 500); }
            else if (gameState.league === 'J3') { gameState.fans = Math.max(300, gameState.fans - 700); }
            else if (gameState.league === 'J2') { gameState.fans = Math.max(300, gameState.fans - 1500); }
            else if (gameState.league === 'J1') { gameState.fans = Math.max(300, gameState.fans - 3000); }
            if (gameState.sponsors.large > 0) { gameState.sponsors.large = Math.max(0, gameState.sponsors.large - 2); }
            else if (gameState.sponsors.medium > 0) { gameState.sponsors.medium = Math.max(0, gameState.sponsors.medium - 2); }
        }
    }

    const cumulativeBalanceText = gameState.deficitYears > 0 ? `${gameState.cumulativeBalance.toLocaleString()}円 <span style="color: #FF9999;">(${gameState.deficitYears}年連続赤字)</span>` : `${gameState.cumulativeBalance.toLocaleString()}円`;

    const standingsHTML = `
        <div class="standings-table-container">
            <h4>${originalLeague === '地域リーグ' ? gameState.regionalLeague : originalLeague} 最終順位表</h4>
            <table>
                <thead><tr><th>順位</th><th>クラブ</th><th>勝点</th><th>得失差</th></tr></thead>
                <tbody>
                    ${gameState.finalStandings.map((t, i) => `
                        <tr class="${t.name === gameState.clubName ? 'my-club' : ''}">
                            <td>${i + 1}</td>
                            <td>${t.name.substring(0, 10)}</td>
                            <td>${t.points}</td>
                            <td>${t.gd}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    const financialDetailsHTML = `
        <div class="result-summary" style="margin-top:20px;">
            <div class="result-item" style="grid-column: 1 / -1;"><h3 style="font-size: 1.1em;">財務詳細</h3>
                <div style="font-size: 0.9em; text-align: left; max-width: 450px; margin: auto; line-height: 1.8;">
                    <div style="display: flex; justify-content: space-between;"><span>期首総資産:</span> <span>${beginningTotalAssets.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>(+) スポンサー収入:</span> <span style="color: #A9D18E;">+${sponsorIncome.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>(+) 観客収入:</span> <span style="color: #A9D18E;">+${gateIncome.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>(+) リーグ分配金:</span> <span style="color: #A9D18E;">+${distribution.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #666; margin-top: 5px; padding-top: 5px;"><span>= 総収入:</span> <span>${totalIncome.toLocaleString()}円</span></div>
                    <hr style="border-color: #4a5a7f; margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between;"><span>(-) 人件費:</span> <span style="color: #FF9999;">-${leagueInfo.personnelCost.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>(-) その他経費:</span> <span style="color: #FF9999;">-${leagueInfo.otherCost.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>(-) 強化費投資:</span> <span style="color: #FF9999;">-${gameState.investments.team.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>(-) 宣伝費投資:</span> <span style="color: #FF9999;">-${gameState.investments.pr.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>(-) 施設費投資:</span> <span style="color: #FF9999;">-${gameState.investments.facility.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #666; margin-top: 5px; padding-top: 5px;"><span>= 総支出:</span> <span>-${totalExpenditure.toLocaleString()}円</span></div>
                    <hr style="border-color: #4a5a7f; margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>= 年間収支:</span> <span>${annualBalance >= 0 ? '+' : ''}${annualBalance.toLocaleString()}円</span></div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>= 期末総資産:</span> <span>${gameState.totalAssets.toLocaleString()}円</span></div>
                </div>
            </div>
            <div class="result-item" style="grid-column: 1 / -1; border-top: 1px solid #4a5a7f; margin-top: 15px; padding-top: 15px;"><h3>累計収支</h3><div class="value ${gameState.cumulativeBalance >= 0 ? 'positive' : 'negative'}">${cumulativeBalanceText}</div></div>
        </div>
    `;


    container.innerHTML = `
        <h2>${gameState.year}シーズン 結果報告</h2>
        ${alertText}
        <div class="result-flex-container">
            <div class="result-main-content">
                <div class="result-summary">
                    <div class="result-summary-grid">
                        <div class="result-item"><h3>最終順位</h3><div class="value">${gameState.finalRank}位</div></div>
                        <div class="result-item"><h3>戦績</h3><div class="value">${gameState.seasonResult.wins}勝${gameState.seasonResult.draws}分${gameState.seasonResult.losses}敗</div></div>
                        <div class="result-item"><h3>平均観客数</h3><div class="value">${attendance.toLocaleString()}人</div></div>
                        <div class="result-item"><h3>年間収支</h3><div class="value ${annualBalance >= 0 ? 'positive' : 'negative'}">${annualBalance >= 0 ? '+' : ''}${annualBalance.toLocaleString()}円</div></div>
                    </div>
                </div>
                <div id="promotion-relegation-text">${statusText}<p>${subText}</p></div>
            </div>
            ${standingsHTML}
        </div>
        ${financialDetailsHTML}
        <div id="next-season-info">
            <button id="next-season-btn" class="sim-game-btn">次のシーズンへ</button>
            <button id="restart-game-btn" class="sim-game-btn" style="background: #6c757d; color: white; margin-top: 10px;">はじめからやり直す</button>
        </div>
    `;

    gameState.year++;
    gameState.league = newLeague;
    gameState.budget = gameState.totalAssets;
    gameState.teamPower = Math.max(50, Math.floor(gameState.teamPower * 0.95));

    document.getElementById('next-season-btn').addEventListener('click', () => {
        if (gameState.justPromotedToJFL) {
            gameState.justPromotedToJFL = false;
            showStory(
                'Jリーグへの挑戦',
                `JFLへようこそ！ここからが本当の戦いだ。<br><br>J3リーグへ昇格するためには、厳しい順位要件に加え、<b>年間の平均観客数が2,000人を超える</b>必要がある。<br><br>ピッチの上の結果だけでなく、スタジアムをファンで埋め尽くすことも、オーナーであるあなたの重要な使命だ。`,
                () => setupNextSeason()
            );
        } else {
            setupNextSeason();
        }
    });

    function setupNextSeason() {
        let storyTitle = `${gameState.year}シーズン開幕`;
        let storyMessage = `新たなシーズンが始まる。<br><br>昨季の成績を糧に、クラブはさらなる高みを目指す。オーナー、今季の経営方針を示してくれ。`;
        if(gameState.facilityInvestment >= 1000000000 && !gameState.stadiumBuilt) {
            storyTitle = `新スタジアム完成！`;
            storyMessage = `長年の施設投資が実を結び、ついにクラブの夢であった専用スタジアム「${gameState.clubName}スタジアム」が完成した！<br><br>これにより、観客収入の大幅な増加が見込まれる。クラブの新たな象徴と共に、さらなる飛躍を目指そう。`;
            gameState.stadiumBuilt = true;
        }
        showStory(storyTitle, storyMessage, () => {
            setupManagementScreen();
            showScreen('game-step-management');
        });
    }

    document.getElementById('restart-game-btn').addEventListener('click', () => {
        if(confirm('本当に最初からやり直しますか？現在のデータは失われます。')) setupCreationScreen();
    });
    showScreen('game-step-result');
}

function showPlayoffScreen(upperLeague, lowerLeague) {
    const isPlayerInLowerLeague = gameState.league === lowerLeague; // プレイヤーがJFL側か
    
    // プレーオフ後の結果を先に計算
    const winProb = 0.75;
    const win = Math.random() < winProb;
    let playoffResult = { originalLeague: gameState.league };

    if (isPlayerInLowerLeague) { // プレイヤーはJFL2位
        if (win) {
            playoffResult.statusText = `<span class="result-promote">祝！ ${upperLeague}へ昇格！</span>`;
            playoffResult.subText = `激闘のプレーオフを制し、クラブは新たなステージへ！`;
            playoffResult.newLeague = upperLeague;
        } else {
            playoffResult.statusText = `${lowerLeague}残留`;
            playoffResult.subText = `昇格の夢は、あと一歩のところで絶たれた。来季こそ自動昇格を掴み取ろう。`;
            playoffResult.newLeague = lowerLeague;
        }
    } else { // プレイヤーはJ3 19位
        if (win) {
            playoffResult.statusText = `${upperLeague}残留`;
            playoffResult.subText = `崖っぷちの戦いを制し、意地を見せた！`;
            playoffResult.newLeague = upperLeague;
        } else {
            playoffResult.statusText = `<span class="result-relegate">無念… ${lowerLeague}へ降格…</span>`;
            playoffResult.subText = `この悔しさを忘れず、一年で必ず這い上がろう。`;
            playoffResult.newLeague = lowerLeague;
        }
    }
    
    // プレーオフの結果を結果画面に渡す
    showResultScreen(true, playoffResult);
}


function setupDataScreen() {
    const container = document.getElementById('game-step-data');
    if (gameState.history.length === 0) {
        container.innerHTML = `<h2>経営データ分析室</h2><p>まだ記録されたシーズンがありません。</p><button id="back-to-management-btn" class="sim-game-btn" style="max-width: 300px; margin: 20px auto;">経営方針画面に戻る</button>`;
        document.getElementById('back-to-management-btn').addEventListener('click', () => showScreen('game-step-management'));
        return;
    }

    let historyHtml = gameState.history.filter(h => h.year).map(h => `
        <tr>
            <td>${h.year}</td>
            <td>${h.league}</td>
            <td>${h.rank}位</td>
            <td>${h.attendance.toLocaleString()}人</td>
            <td class="${h.balance >= 0 ? 'positive' : 'negative'}">${h.balance >= 0 ? '+' : ''}${h.balance.toLocaleString()}円</td>
            <td>${h.totalAssets.toLocaleString()}円</td>
        </tr>
    `).join('');

    let buttonsHtml = `<button id="back-to-management-btn" class="sim-game-btn">経営方針画面に戻る</button>`;
    if (gameState.gameCleared) {
        buttonsHtml += `<button id="restart-game-from-data-btn" class="sim-game-btn">もう一度初めから始める</button>`;
    }

    container.innerHTML = `
        <h2>経営データ分析室</h2>
        <div class="data-tabs">
            <button class="data-tab-btn active" data-tab="history">年度別サマリー</button>
            <button class="data-tab-btn" data-tab="charts">グラフ分析</button>
        </div>

        <div id="data-history" class="data-content active">
            <div class="table-scroll-wrapper">
                <table class="data-table">
                    <thead><tr><th>年度</th><th>カテゴリー</th><th>最終順位</th><th>平均観客数</th><th>年間収支</th><th>期末総資産</th></tr></thead>
                    <tbody>${historyHtml}</tbody>
                </table>
            </div>
        </div>

        <div id="data-charts" class="data-content">
            <div class="chart-area-wrapper">
                <div class="chart-selector-tabs">
                    <button class="chart-selector-btn active" data-chart="assets">総資産</button>
                    <button class="chart-selector-btn" data-chart="balance">年間収支</button>
                    <button class="chart-selector-btn" data-chart="attendance">平均観客数</button>
                </div>
                <div class="chart-container">
                    <canvas id="mainChart"></canvas>
                </div>
            </div>
        </div>

        <div class="data-buttons-container">
            ${buttonsHtml}
        </div>
    `;

    document.getElementById('back-to-management-btn').addEventListener('click', () => {
        showScreen('game-step-management');
    });

    if (gameState.gameCleared) {
        document.getElementById('restart-game-from-data-btn').addEventListener('click', () => {
            if(confirm('本当に最初からやり直しますか？現在のデータは失われます。')) {
                setupCreationScreen();
            }
        });
    }

    const tabs = container.querySelectorAll('.data-tab-btn');
    const contents = container.querySelectorAll('.data-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const contentEl = document.getElementById(`data-${tab.dataset.tab}`);
            contentEl.classList.add('active');

            if(tab.dataset.tab === 'charts') {
                renderDataCharts('assets');

                contentEl.querySelectorAll('.chart-selector-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.classList.contains('active')) return;
                        contentEl.querySelectorAll('.chart-selector-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        renderDataCharts(btn.dataset.chart);
                    });
                });
            }
        });
    });
}

function renderDataCharts(chartType) {
    if (mainChartInstance) {
        mainChartInstance.destroy();
    }

    const labels = gameState.history.map(h => h.year);
    const chartOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false, 
        plugins: {
            legend: { display: false },
            title: { display: true, text: title, color: '#eaf7fc', font: { size: 16 } }
        },
        scales: {
            x: { ticks: { color: '#abc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
            y: { ticks: { color: '#abc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
        }
    });

    const chartData = {
        assets: {
            type: 'line',
            data: { labels, datasets: [{ label: '総資産', data: gameState.history.map(h => h.totalAssets), borderColor: '#299ad3', backgroundColor: 'rgba(41, 154, 211, 0.1)', fill: true, tension: 0.1 }] },
            options: chartOptions('総資産の推移')
        },
        balance: {
            type: 'bar',
            data: { labels, datasets: [{ label: '年間収支', data: gameState.history.map(h => h.balance),
                backgroundColor: gameState.history.map(h => h.balance >= 0 ? 'rgba(169, 209, 142, 0.7)' : 'rgba(255, 153, 153, 0.7)'),
                borderColor: gameState.history.map(h => h.balance >= 0 ? '#A9D18E' : '#FF9999'),
                borderWidth: 1 }] },
            options: chartOptions('年間収支の推移')
        },
        attendance: {
            type: 'line',
            data: { labels, datasets: [{ label: '平均観客数', data: gameState.history.map(h => h.attendance), borderColor: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.1)', fill: true, tension: 0.1 }] },
            options: chartOptions('平均観客数の推移')
        }
    };

    const ctx = document.getElementById('mainChart')?.getContext('2d');
    if (ctx && chartData[chartType]) {
        mainChartInstance = new Chart(ctx, chartData[chartType]);
    }
}

export default function initializeGamePage(container) {
    if (!leagueStructure['J1'].opponents || leagueStructure['J1'].opponents.length === 0) {
        Object.keys(leagueStructure).forEach(leagueKey => {
            const leagueInfo = leagueStructure[leagueKey];
            const filterKey = leagueInfo.level === 0 ? '地域リーグ' : leagueInfo.name;
            leagueStructure[leagueKey].opponents = allClubsData.filter(c => c.league.includes(filterKey));
        });
    }

    container.innerHTML = `<div id="simulation-game-container"></div>`;
    setupCreationScreen();
}