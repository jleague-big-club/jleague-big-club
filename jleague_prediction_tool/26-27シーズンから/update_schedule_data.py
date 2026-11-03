# --- START OF FILE update_schedule_data.py ---

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
from selenium.common.exceptions import NoSuchElementException
import os
import re
import unicodedata
from datetime import date

# --- 設定 ---
SAVE_DIRECTORY = r'C:\Users\mura\Desktop\その他\webサイト\jleague-big-club\data'
CSV_FILENAME = 'schedule.csv'
# ----------------

TEAM_NAME_MAP = {
    '札幌': '北海道コンサドーレ札幌', '鹿島': '鹿島アントラーズ', '浦和': '浦和レッズ', '柏': '柏レイソル',
    'FC東京': 'FC東京', '東京V': '東京ヴェルディ', '町田': 'FC町田ゼルビア', '川崎F': '川崎フロンターレ',
    '横浜FM': '横浜F・マリノス', '横浜FC': '横浜FC', '湘南': '湘南ベルマーレ', '新潟': 'アルビレックス新潟',
    '清水': '清水エスパルス', '磐田': 'ジュビロ磐田', '名古屋': '名古屋グランパス', '京都': '京都サンガF.C.',
    'G大阪': 'ガンバ大阪', 'C大阪': 'セレッソ大阪', '神戸': 'ヴィッセル神戸', '岡山': 'ファジアーノ岡山',
    '広島': 'サンフレッチェ広島', '福岡': 'アビスパ福岡', '鳥栖': 'サガン鳥栖', '仙台': 'ベガルタ仙台',
    '秋田': 'ブラウブリッツ秋田', '山形': 'モンテディオ山形', 'いわき': 'いわきFC', '水戸': '水戸ホーリーホック',
    '栃木SC': '栃木SC', '群馬': 'ザスパ群馬', '千葉': 'ジェフユナイテッド千葉', '甲府': 'ヴァンフォーレ甲府',
    '富山': 'カターレ富山', '藤枝': '藤枝MYFC', '山口': 'レノファ山口FC', '徳島': '徳島ヴォルティス',
    '愛媛': '愛媛FC', '今治': 'FC今治', '長崎': 'V・ファーレン長崎', '熊本': 'ロアッソ熊本',
    '大分': '大分トリニータ', '鹿児島': '鹿児島ユナイテッドFC', '八戸': 'ヴァンラーレ八戸',
    '岩手': 'いわてグルージャ盛岡', '福島': '福島ユナイテッドFC', '大宮': 'RB大宮アルディージャ',
    'YS横浜': 'Y．S．C．C．横浜', '相模原': 'SC相模原', '松本': '松本山雅FC', '長野': 'AC長野パルセイロ',
    '金沢': 'ツエーゲン金沢', '沼津': 'アスルクラロ沼津', '岐阜': 'FC岐阜', 'FC大阪': 'FC大阪',
    '奈良': '奈良クラブ', '鳥取': 'ガイナーレ鳥取', '讃岐': 'カマタマーレ讃岐', '北九州': 'ギラヴァンツ北九州',
    '宮崎': 'テゲバジャーロ宮崎', '琉球': 'FC琉球', '栃木C': '栃木シティ', '高知': '高知ユナイテッドSC'
}

def normalize_text(text):
    """文字列内の全角英数字記号を半角に変換する"""
    return unicodedata.normalize('NFKC', text)

def get_driver():
    """WebDriverのインスタンスを生成して返す"""
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        service = ChromeService(ChromeDriverManager().install())
        
        return webdriver.Chrome(service=service, options=chrome_options)
    except Exception as e:
        print(f"エラー: ブラウザの起動に失敗しました。 {e}", file=sys.stderr)
        return None

# 公式サイトとCSVで表記が違うチーム名（公式サイト側 → CSV側。全角は半角にした後の文字列で書く）
# ここに無い食い違いがあると、そのチームの結果が一切取り込まれない。
# 照合できないチーム名は実行時に警告が出るので、出たらここに足す。
WEB_TO_CSV_NAME = {
    'レイラック滋賀FC': 'レイラック滋賀',
}

# 各試合のリンク先（/match/j3/2026/080815/ など）から、大会名と対戦カード・スコアを読む
SCRAPE_MATCHES_JS = """
    return [...document.querySelectorAll('div.m-schedule--game-over')].map(m => {
        // リンクは試合の枠の中だけを見る。親までさかのぼると隣の試合のリンクを拾ってしまい、
        // ルヴァンカップの試合をJ1リーグ戦と取り違える（実際に起きた）
        const link = m.querySelector('a[href*="/match/"]');
        const href = link ? link.getAttribute('href') : '';
        const team = side => m.querySelector('div.m-schedule__team-' + side + " span[data-media='pc']")?.textContent.trim() || '';
        const scores = [...m.querySelectorAll('p.m-schedule__score')].map(p => p.textContent.trim());
        return { href: href || '', home: team('home'), away: team('away'), homeScore: scores[0] || '', awayScore: scores[1] || '' };
    });
"""


def detect_current_season(df):
    """今のシーズンラベルと開幕日を schedule.csv から求める。

    '年' 列はカレンダー年ではなくシーズン（2026 = 26-27シーズン = 26/8〜27/6）なので、
    「すでに開幕しているシーズンのうち最も新しいもの」を試合日から選ぶ。
    """
    dates = pd.to_datetime(df['日付'], format='%y/%m/%d', errors='coerce')
    starts = dates.groupby(df['年'].astype(str)).min().dropna()
    today = pd.Timestamp.today().normalize()
    started = starts[starts <= today]
    label = started.idxmax() if not started.empty else starts.idxmin()
    return label, starts[label].date()


def to_csv_name(web_name):
    name = normalize_text(web_name)
    return WEB_TO_CSV_NAME.get(name, name)


def scrape_season_results(driver, season_start):
    """J1〜J3のシーズン開幕から今日までの全試合結果を取得する。

    以前は「今週」のページだけを見ていたため、batを回すタイミング次第で
    取りこぼした試合が二度と取り込まれなかった。期間を指定して毎回シーズン全体を取り直す。
    カップ戦・天皇杯はリンク先の大会名（/match/leaguecup/ など）で除外する。
    """
    results = {}
    today = date.today()
    try:
        print("--- Jリーグ公式サイトからシーズン全体の結果を取得中... ---")
        for league in ['j1', 'j2', 'j3']:
            url = (f"https://www.jleague.jp/{league}/match/"
                   f"?startdate={season_start:%Y-%m-%d}&enddate={today:%Y-%m-%d}&period=custom")
            print(f"  -> {url} を取得中...")
            driver.get(url)

            try:
                agree_button = WebDriverWait(driver, 5).until(EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler")))
                agree_button.click()
                time.sleep(2)
            except Exception:
                pass

            try:
                WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.m-schedule--game-over"))
                )
            except Exception:
                print(f"    -> {league.upper()} に試合終了の試合が見当たりません。スキップします。")
                continue

            # 読み込みの途中で数えないよう、試合数が増えなくなるまで待つ
            previous = -1
            for _ in range(15):
                count = len(driver.find_elements(By.CSS_SELECTOR, "div.m-schedule--game-over"))
                if count == previous:
                    break
                previous = count
                time.sleep(1)

            league_results = {}
            skipped = 0
            no_link = 0
            for row in driver.execute_script(SCRAPE_MATCHES_JS):
                parts = row['href'].split('/')
                category = parts[2] if len(parts) > 2 else ''
                if not category:
                    no_link += 1  # 大会が判別できない試合は取り込まない
                    continue
                if category != league:
                    skipped += 1  # 天皇杯・ルヴァンカップなど
                    continue
                if not (row['homeScore'].isdigit() and row['awayScore'].isdigit()):
                    continue
                key = (to_csv_name(row['home']), to_csv_name(row['away']))
                league_results[key] = (float(row['homeScore']), float(row['awayScore']))

            results[league.upper()] = league_results
            print(f"    -> {league.upper()}: リーグ戦{len(league_results)}件取得、カップ戦等{skipped}件除外")
            if no_link:
                print(f"    ★警告★ {league.upper()}: 大会を判別できなかった試合が{no_link}件あり、取り込みませんでした。")
        return results
    except Exception as e:
        print(f"エラー: Jリーグ日程の取得に失敗しました。 ({type(e).__name__}) - {e}")
        return None


def update_schedule(driver, filepath):
    """schedule.csvを読み込み、公式サイトの結果を元にスコアを更新する"""
    try:
        df = pd.read_csv(filepath, encoding='utf-8-sig')
    except FileNotFoundError:
        print(f"エラー: {filepath} が見つかりません。")
        return

    season_label, season_start = detect_current_season(df)
    print(f"対象シーズン: {season_label}（開幕 {season_start}）")

    all_results = scrape_season_results(driver, season_start)
    if all_results is None:
        print("結果を取得できなかったため、処理を終了します。")
        return

    season_mask = df['年'].astype(str) == str(season_label)

    # 公式サイトのチーム名がCSVに見つからない場合は、その結果が取り込めないので警告する
    for league, league_results in all_results.items():
        league_rows = df[season_mask & (df['リーグ'] == league)]
        csv_names = {normalize_text(n) for n in pd.concat([league_rows['ホーム'], league_rows['アウェイ']]).dropna()}
        web_names = {n for pair in league_results for n in pair}
        unknown = sorted(web_names - csv_names)
        if unknown:
            print(f"\n★警告★ {league}: 公式サイトのチーム名がschedule.csvと一致しません: {', '.join(unknown)}")
            print("        update_schedule_data.py の WEB_TO_CSV_NAME に対応を追加してください。")

    total = sum(len(r) for r in all_results.values())
    print(f"\n{total}件のリーグ戦試合結果を取得しました。CSVファイルと照合します...")
    updates_found = 0

    # 今シーズンの、結果が未入力の試合だけを埋める（過去シーズンの未入力行には触れない）
    for index, row in df[season_mask & df['ホーム得点'].isnull()].iterrows():
        key = (normalize_text(row['ホーム']), normalize_text(row['アウェイ']))
        result = all_results.get(row['リーグ'], {}).get(key)
        if result:
            home_score, away_score = result
            df.loc[index, 'ホーム得点'] = home_score
            df.loc[index, 'アウェイ得点'] = away_score
            updates_found += 1
            print(f"結果更新: {row['ホーム']} {int(home_score)} - {int(away_score)} {row['アウェイ']}")

    if updates_found > 0:
        df.to_csv(filepath, index=False, encoding='utf-8-sig')
        print(f"\n{updates_found}件の試合結果を更新し、{filepath} に保存しました。")
    else:
        print("\n更新対象となる試合結果はありませんでした。")

    # 日付が過ぎたのに結果が無い試合（延期・中止など）を一覧にしておく
    dates = pd.to_datetime(df['日付'], format='%y/%m/%d', errors='coerce')
    pending = df[season_mask & df['ホーム得点'].isnull() & (dates < pd.Timestamp.today().normalize())]
    if not pending.empty:
        print(f"\n日付が過ぎたのに結果が無い試合が {len(pending)} 件あります（延期・中止なら問題なし）:")
        for _, row in pending.iterrows():
            print(f"  {row['リーグ']} {row['節']} {row['日付']} {row['ホーム']} vs {row['アウェイ']}")

    # 未来の日付なのに結果が入っている試合は、カップ戦などを取り違えた可能性が高い
    future_filled = df[season_mask & df['ホーム得点'].notna() & (dates > pd.Timestamp.today().normalize())]
    if not future_filled.empty:
        print(f"\n★警告★ 未来の日付なのに結果が入っている試合が {len(future_filled)} 件あります（前倒し開催でなければ誤り）:")
        for _, row in future_filled.iterrows():
            print(f"  {row['リーグ']} {row['節']} {row['日付']} {row['ホーム']} {int(row['ホーム得点'])}-{int(row['アウェイ得点'])} {row['アウェイ']}")


def main():
    """メイン処理"""
    filepath = os.path.join(SAVE_DIRECTORY, CSV_FILENAME)
    print(f"{filepath} の更新を開始します...")
    
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
        
    try:
        update_schedule(driver, filepath)
    finally:
        driver.quit()
        print("\nすべての処理が完了しました。")

if __name__ == '__main__':
    main()