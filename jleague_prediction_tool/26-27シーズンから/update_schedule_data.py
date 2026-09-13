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

def scrape_top_page_results(driver):
    """J1, J2, J3の各試合ページから試合結果のみを抽出する"""
    results = {}
    leagues = ['j1', 'j2', 'j3']
    
    try:
        print("--- 新しいJリーグ日程ページから結果を取得中... ---")
        
        for league in leagues:
            url = f"https://www.jleague.jp/{league}/match/"
            print(f"  -> {url} を取得中...")
            driver.get(url)
            
            # クッキー同意などがあればクリック
            try:
                cookie_button_wait = WebDriverWait(driver, 5)
                agree_button = cookie_button_wait.until(EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler")))
                agree_button.click()
                time.sleep(2)
            except Exception:
                pass
            
            # 試合終了の要素が現れるまで待機（最大15秒）
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.m-schedule--game-over"))
                )
            except Exception:
                print(f"    -> {league.upper()} に試合終了の試合が見当たりません。スキップします。")
                continue
            time.sleep(1)
            
            # ★★★ カップ戦除外のため、JavaScriptで各試合ブロックの直前の見出しを確認 ★★★
            league_matches_js = driver.execute_script("""
                const results = [];
                const gameOverDivs = document.querySelectorAll('div.m-schedule--game-over');
                for (const match of gameOverDivs) {
                    let sectionTitle = '';
                    let el = match;
                    
                    // BODYタグまで到達したら遡るのをやめる
                    while (el && el.tagName !== 'BODY') {
                        let prev = el.previousElementSibling;
                        while (prev) {
                            const text = (prev.textContent || '').replace(/\s+/g, ' ').trim();
                            
                            // テキストが長すぎる場合（サイト全体のメニューなど）は判定から除外して次へ
                            if (text.length > 50) {
                                prev = prev.previousElementSibling;
                                continue;
                            }
                            
                            if (text.includes('LEAGUE') || text.includes('リーグ')) {
                                sectionTitle = text;
                                break;
                            }
                            if (text.includes('杯') || text.includes('カップ') || text.includes('Cup') || text.includes('U-21') || text.includes('ACL')) {
                                sectionTitle = text;
                                break;
                            }
                            
                            // 明らかに見出しタグ（h1〜h6）に到達した場合は、そこで探索を打ち切る
                            if (/^H[1-6]$/i.test(prev.tagName)) {
                                sectionTitle = text;
                                break;
                            }
                            
                            prev = prev.previousElementSibling;
                        }
                        if (sectionTitle) break;
                        el = el.parentElement;
                    }
                    results.push({
                        element: match,
                        sectionTitle: sectionTitle
                    });
                }
                return results.map(r => r.sectionTitle);
            """)

            
            game_over_matches = driver.find_elements(By.CSS_SELECTOR, "div.m-schedule--game-over")
            league_game_count = 0
            skip_count = 0
            
            for i, match in enumerate(game_over_matches):
                try:
                    # 対応するセクションタイトルを取得
                    section_title = league_matches_js[i] if i < len(league_matches_js) else ''
                    
                    # カップ戦・天皇杯などはスキップ（「LEAGUE」または「リーグ」を含まない場合）
                    is_league_match = 'LEAGUE' in section_title or 'リーグ' in section_title
                    # セクションタイトルが空の場合はリーグ戦と見なす（安全側に倒す）
                    if section_title and not is_league_match:
                        skip_count += 1
                        print(f"      -> [スキップ] カップ戦のためスキップ: セクション={section_title[:30]}")
                        continue

                    # チーム名はdata-media="pc"のspanから取得（textContentで非表示でも取得可能）
                    home_el = match.find_element(By.CSS_SELECTOR, "div.m-schedule__team-home span[data-media='pc']")
                    away_el = match.find_element(By.CSS_SELECTOR, "div.m-schedule__team-away span[data-media='pc']")
                    
                    home_team_raw = (home_el.get_attribute('textContent') or '').strip()
                    away_team_raw = (away_el.get_attribute('textContent') or '').strip()
                    
                    if not home_team_raw or not away_team_raw:
                        continue
                    
                    home_team_web = normalize_text(home_team_raw)
                    away_team_web = normalize_text(away_team_raw)
                    
                    # スコアは2つのp.m-schedule__score要素に分かれている（ホーム/アウェイ）
                    score_els = match.find_elements(By.CSS_SELECTOR, "p.m-schedule__score")
                    if len(score_els) >= 2:
                        home_score_text = score_els[0].text.strip()
                        away_score_text = score_els[1].text.strip()
                        
                        if home_score_text.isdigit() and away_score_text.isdigit():
                            home_score = float(home_score_text)
                            away_score = float(away_score_text)
                            results[(home_team_web, away_team_web)] = (home_score, away_score)
                            league_game_count += 1
                            print(f"      -> [結果取得] {league.upper()}: {home_team_raw} {int(home_score)}-{int(away_score)} {away_team_raw}")
                except Exception:
                    continue
            
            print(f"    -> {league.upper()}: リーグ戦{league_game_count}件取得、カップ戦等{skip_count}件スキップ")
                    
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

    all_results = scrape_top_page_results(driver)
    if all_results is None:
        print("結果を取得できなかったため、処理を終了します。")
        return

    print(f"\n{len(all_results)}件のリーグ戦試合結果を取得しました。CSVファイルと照合します...")
    updates_found = 0
    
    for index, row in df[df['ホーム得点'].isnull()].iterrows():
        home_csv_full = normalize_text(row['ホーム'])
        away_csv_full = normalize_text(row['アウェイ'])
        
        # サイトのチーム名（フルネーム）とCSVのチーム名（フルネーム）を直接照合
        matched_key = None
        for (home_web, away_web) in all_results.keys():
            home_web_norm = normalize_text(home_web)
            away_web_norm = normalize_text(away_web)
            if home_web_norm == home_csv_full and away_web_norm == away_csv_full:
                matched_key = (home_web, away_web)
                break
        
        if matched_key:
            home_score, away_score = all_results[matched_key]
            df.loc[index, 'ホーム得点'] = home_score
            df.loc[index, 'アウェイ得点'] = away_score
            updates_found += 1
            print(f"結果更新: {row['ホーム']} {int(home_score)} - {int(away_score)} {row['アウェイ']}")


    if updates_found > 0:
        df.to_csv(filepath, index=False, encoding='utf-8-sig')
        print(f"\n{updates_found}件の試合結果を更新し、{filepath} に保存しました。")
    else:
        print("\n更新対象となる試合結果はありませんでした。")

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