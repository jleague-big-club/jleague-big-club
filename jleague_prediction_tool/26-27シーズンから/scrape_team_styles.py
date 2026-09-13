import sys
import time
import os
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- 設定 ---

# ★★★ 対象シーズンを指定 ★★★
TARGET_YEAR = "2025"

# ★★★ 取得したいリーグのリスト ★★★
TARGET_LEAGUES = ["j1", "j2", "j3"]

# ★★★ 取得したいスタッツのリスト ★★★
STATS_TO_SCRAPE = {
    'シュート総数': 'shoot',
    'ファウル総数': 'foul_count',
    '警告数': 'yellow_count',
    'クロス総数': 'cross_count'
}

# ★★★ 出力ファイル名 ★★★
OUTPUT_FILENAME = f'team_style_stats_all_{TARGET_YEAR}.csv'

# --- WebDriverの共通関数 ---
def get_driver():
    """WebDriverのインスタンスを生成して返す"""
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        service = ChromeService(ChromeDriverManager().install())
        print("ブラウザを起動しています...")
        driver = webdriver.Chrome(service=service, options=chrome_options)
        print("✔ ブラウザの起動に成功しました。")
        return driver
    except Exception as e:
        print(f"エラー: ブラウザの起動に失敗しました。 {e}", file=sys.stderr)
        return None

# --- メイン処理 ---
def main():
    """指定されたリーグ・スタッツのデータをスクレイピングし、1つのCSVに出力する"""
    
    driver = get_driver()
    if not driver:
        return

    # 全リーグ・全スタッツのデータを格納するための辞書
    all_stats_data = {}

    try:
        for league_code in TARGET_LEAGUES:
            print("=" * 40)
            print(f"リーグ: {league_code.upper()} のデータ取得を開始...")
            
            for stat_name, stat_value in STATS_TO_SCRAPE.items():
                print(f"  - '{stat_name}' を取得中...")
                
                url = f'https://www.jleague.jp/stats/{league_code}/club/{TARGET_YEAR}/{stat_value}/'
                driver.get(url)
                
                wait = WebDriverWait(driver, 10)
                ranking_list = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, 'ranking_list')))
                
                team_items = ranking_list.find_elements(By.TAG_NAME, 'li')
                
                for item in team_items:
                    try:
                        team_name = item.find_element(By.CLASS_NAME, 'team').text.strip()
                        value_text = item.find_element(By.CSS_SELECTOR, '.ranking_stats p, .ranking_stats_1 p, .ranking_stats_2 p, .ranking_stats_3 p').text
                        value = int(value_text.split('\n')[0])

                        # データを辞書に格納（リーグ情報も追加）
                        if team_name not in all_stats_data:
                            all_stats_data[team_name] = {'リーグ': league_code.upper()}
                        all_stats_data[team_name][stat_name] = value
                        
                    except Exception as e:
                        print(f"    - 警告: 一部のデータ項目が取得できませんでした。スキップします。 {e}")
                        continue
                
                print(f"  ✔ '{stat_name}' の取得完了。")
                time.sleep(1.5) # サーバー負荷軽減のための待機

    except Exception as e:
        print(f"エラー: スクレイピング中に予期せぬエラーが発生しました。 {e}", file=sys.stderr)
    finally:
        if driver:
            driver.quit()
            print("\nブラウザを終了しました。")

    # 取得したデータをCSVファイルに出力
    if not all_stats_data:
        print("\nデータが1件も取得できませんでした。処理を終了します。")
        return

    try:
        df = pd.DataFrame.from_dict(all_stats_data, orient='index')
        df.index.name = 'チーム名'
        
        # 列の順番を整える (リーグ列を先頭に)
        column_order = ['チーム名', 'リーグ'] + list(STATS_TO_SCRAPE.keys())
        df = df.reset_index()
        df = df.reindex(columns=column_order)

        save_path = os.path.join(os.path.dirname(__file__), OUTPUT_FILENAME)
        
        df.to_csv(save_path, index=False, encoding='utf-8-sig')
        
        print(f"\n✔ 成功: 全リーグのデータを '{save_path}' に保存しました。")

    except Exception as e:
        print(f"エラー: CSVファイルへの書き込みに失敗しました。 {e}", file=sys.stderr)

if __name__ == '__main__':
    main()