# --- START OF FILE fetch_5league_data.py ---

import sys
import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService # ServiceをChromeServiceとしてインポート
from webdriver_manager.chrome import ChromeDriverManager # ★★★ この行を追加 ★★★
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

# --- 設定 ---
SAVE_DIRECTORY = r'C:\Users\mura\Desktop\jleague-big-club\data'
OUTPUT_FILENAME = '5league-rankings.csv'

LEAGUES_TO_SCRAPE = {
    'プレミアリーグ': 'https://soccer.yahoo.co.jp/ws/category/eng/standings',
    'ラ・リーガ': 'https://soccer.yahoo.co.jp/ws/category/esp/standings',
    'ブンデスリーガ': 'https://soccer.yahoo.co.jp/ws/category/ger/standings',
    'セリエA': 'https://soccer.yahoo.co.jp/ws/category/ita/standings',
    'リーグ・アン': 'https://soccer.yahoo.co.jp/ws/category/fra/standings',
}

# <<< 変更点: 欧州5大リーグ全クラブの略称リストを作成
EUROPE_CLUB_ABBREVIATIONS = {
    # プレミアリーグ
    "マンチェスター・シティ": "マンC", "サンダーランド": "サンダーランド", "トッテナム・ホットスパー": "トッテナム",
    "リヴァプール": "リヴァプール", "ブライトン・アンド・ホーヴ・アルビオン": "ブライトン", "フラム": "フラム",
    "アストン・ヴィラ": "アストン・ビラ", "ニューカッスル・ユナイテッド": "ニューカッスル", "アーセナル": "アーセナル",
    "ブレントフォード": "ブレントフォード", "チェルシー": "チェルシー", "クリスタル・パレス": "C・パレス",
    "エヴァートン": "エヴァートン", "リーズ・ユナイテッド": "リーズ U", "マンチェスター・ユナイテッド": "マンU",
    "ノッティンガム・フォレスト": "N・フォレスト", "ボーンマス": "ボーンマス", "バーンリー": "バーンリー",
    "ウェストハム・ユナイテッド": "ウェストハム", "ウルヴァーハンプトン・ワンダラーズ": "ウルブス",
    # ラ・リーガ
    "FCバルセロナ": "バルセロナ", "ラージョ・バリェカノ": "ラージョ", "ビジャレアルCF": "ビジャレアル",
    "デポルティーボ・アラベス": "アラベス", "レアル・ソシエда": "ソシエダ", "バレンシア": "バレンシア",
    "アスレティック・ビルバオ": "ビルバオ", "アトレティコ・マドリード": "アトレティコ", "セルタ・デ・ビーゴ": "セルタ",
    "エルチェCF": "エルチェ", "エスパニョール": "エスパニョール", "ヘタフェCF": "ヘタフェ", "オサスナ": "オサスナ",
    "レアル・ベティス": "ベティス", "レアル・マドリード": "Rマドリード", "セビージャFC": "セビージャ",
    "レバンテUD": "レバンテ", "ジローナFC": "ジローナ", "レアル・オビエド": "オビエド", "RCDマジョルカ": "マヨルカ",
    "レアル・ソシエダ": "ソシエダ", # 表記揺れ対応
    # ブンデスリーガ
    "FCアウクスブルク": "アウクスブルク", "バイヤー・レバークーゼン": "レバークーゼン", "バイエルン・ミュンヘン": "バイエルン",
    "ボルシア・ドルトムント": "ドルトムント", "ボルシア・メンヒェングラートバッハ": "ボルシアMG", "フランクフルト": "フランクフルト",
    "1.FCケルン": "ケルン", "SCフライブルク": "フライブルク", "ハンブルガーSV": "ハンブルク", "ハイデンハイム": "ハイデンハイム",
    "TSGホッフェンハイム": "ホッフェンハイム", "マインツ05": "マインツ", "RBライプツィヒ": "ライプツィヒ", "ザンクトパウリ": "ザンクトパウリ",
    "VfBシュトゥットガルト": "シュトゥットガルト", "ウニオン・ベルリン": "U・ベルリン", "ヴェルダー・ブレーメン": "ブレーメン",
    "VfLヴォルフスブルク": "ヴォルフスブルク", "VfLボーフム": "ボーフム", "ホルシュタイン・キール": "キール",
    # セリエA
    "ACミラン": "ミラン", "アタランタBC": "アタランタ", "ボローニャFC": "ボローニャ", "カリアリ": "カリアリ",
    "コモ1907": "コモ", "USクレモネーゼ": "クレモネーゼ", "フィオレンティーナ": "フィオレンティーナ",
    "ジェノアCFC": "ジェノア", "インテル・ミラノ": "インテル", "ユヴェントス": "ユヴェントス",
    "SSラツィオ": "ラツィオ", "USレッチェ": "レッチェ", "SSCナポリ": "ナポリ", "パルマ": "パルマ",
    "ピサSC": "ピサ", "ASローマ": "ローマ", "USサッスオーロ": "サッスオーロ", "トリノFC": "トリノ",
    "ウディネーゼ・カルチョ": "ウディネーゼ", "エラス・ヴェローナFC": "ヴェローナ", "エンポリ": "エンポリ", "モンツァ": "モンツァ", "ヴェネツィア": "ヴェネツィア",
    # リーグ・アン
    "ASモナコFC": "モナコ", "オリンピック・リヨン": "リヨン", "スタッド・レンヌFC": "レンヌ", "トゥールーズFC": "トゥールーズ",
    "アンジェSCO": "アンジェ", "AJオセール": "オセール", "スタッド・ブレスト29": "ブレスト",
    "FCロリアン": "ロリアン", "メッス": "メス", "LOSCリール": "リール", "FCナント": "ナント",
    "パリ・サンジェルマン": "パリSG", "パリFC": "パリFC", "RCストラスブール": "ストラスブール",
    "RCランス": "ランス", "オリンピック・マルセイユ": "マルセイユ", "OGCニース": "ニース", "ル・アーヴルAC": "ル・アーヴル",
    "スタッド・ランス": "ランス", "モンペリエHSC": "モンペリエ", "ASサンテティエンヌ": "サンテティエンヌ",
}
# ----------------

def get_driver():
    """WebDriverのインスタンスを生成して返す"""
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        # ★★★ ここを修正 ★★★
        # 古いコード: service = Service(executable_path='./chromedriver.exe')
        # 新しいコード: 自動で適切なバージョンのChromeDriverをインストールして設定する
        service = ChromeService(ChromeDriverManager().install())
        
        return webdriver.Chrome(service=service, options=chrome_options)
    except Exception as e:
        print(f"エラー: ブラウザの起動に失敗しました。 {e}", file=sys.stderr)
        return None

def scrape_yahoo_standings(driver, url, league_name):
    """Yahoo!スポーツから順位表をスクレイピングする関数"""
    all_teams_data = []
    try:
        driver.get(url)
        wait = WebDriverWait(driver, 20)
        table = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, 'sc-tableValue')))
        season = "25-26"
        rows = table.find_element(By.TAG_NAME, 'tbody').find_elements(By.TAG_NAME, 'tr')
        is_first_team = True
        for row in rows:
            cols = row.find_elements(By.TAG_NAME, 'td')
            if len(cols) < 11: continue

            rank = cols[0].text.strip()
            team_cell_text = cols[2].text.strip().split('\n')
            full_team_name = team_cell_text[1] if len(team_cell_text) > 1 else team_cell_text[0]
            
            # <<< 変更点: チーム名を略称に変換（リストにない場合は元の名前を使用）
            team_name = EUROPE_CLUB_ABBREVIATIONS.get(full_team_name, full_team_name)
            
            points, matches, wins, draws, losses, goals_for, goals_against, goal_diff = [
                cols[3].text.strip(), cols[4].text.strip(), cols[5].text.strip(),
                cols[6].text.strip(), cols[7].text.strip(), cols[8].text.strip(),
                cols[9].text.strip(), cols[10].text.strip()
            ]
            
            if is_first_team:
                all_teams_data.append([season, league_name, rank, team_name, matches, wins, draws, losses, goals_for, goals_against, goal_diff, points])
                is_first_team = False
            else:
                all_teams_data.append(['', '', rank, team_name, matches, wins, draws, losses, goals_for, goals_against, goal_diff, points])
        return all_teams_data
    except Exception as e:
        if "TimeoutException" in str(e):
            print(f"情報: {league_name} のページはまだ存在しないか、読み込めませんでした。スキップします。")
        else:
            print(f"エラー: {league_name}のデータ抽出中に予期せぬエラーが発生しました。({type(e).__name__})")
        return []

def main():
    """5大リーグのデータを取得し、1つのCSVにまとめるメイン処理"""
    print("欧州5大リーグの順位表データ取得を開始します...")
    if not os.path.exists(SAVE_DIRECTORY):
        try:
            os.makedirs(SAVE_DIRECTORY)
            print(f"保存先フォルダ '{SAVE_DIRECTORY}' を作成しました。")
        except OSError as e:
            print(f"エラー: 保存先フォルダの作成に失敗しました。 {e}", file=sys.stderr)
            return
    driver = get_driver()
    if not driver:
        return
    all_leagues_data = []
    try:
        for league_name, url in LEAGUES_TO_SCRAPE.items():
            print(f"--- {league_name} のデータを取得中... ---")
            league_data = scrape_yahoo_standings(driver, url, league_name)
            if league_data:
                all_leagues_data.extend(league_data)
                all_leagues_data.append([''] * 12)
            time.sleep(1)
    finally:
        if driver:
            driver.quit()
    if not all_leagues_data:
        print("エラー: どのリーグからもデータを取得できませんでした。")
        return
    columns = ['年', 'リーグ', '順位', 'クラブ名', '試合', '勝', '分', '敗', '得点', '失点', '得失点差', '勝点']
    df = pd.DataFrame(all_leagues_data, columns=columns)
    if not df.empty:
      df.drop(df.tail(1).index, inplace=True)
    filepath = os.path.join(SAVE_DIRECTORY, OUTPUT_FILENAME)
    df.to_csv(filepath, index=False, encoding='utf-8-sig')
    print("-" * 30)
    print(f"\n成功: {filepath} にすべてのリーグの順位表を保存しました。")

if __name__ == '__main__':
    main()