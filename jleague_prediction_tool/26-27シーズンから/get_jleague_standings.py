# --- START OF FILE get_jleague_standings.py ---

import sys
import datetime
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService # ServiceをChromeServiceとしてインポート
from webdriver_manager.chrome import ChromeDriverManager # ★★★ この行を追加 ★★★
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

# 保存先のフォルダパスをここで指定
SAVE_DIRECTORY = r'C:\Users\mura\Desktop\その他\webサイト\jleague-big-club\data'

def zenkaku_to_hankaku(text):
    """全角英数字・記号を半角に変換する関数"""
    return text.translate(str.maketrans({chr(0xFF01 + i): chr(0x21 + i) for i in range(94)}))

def get_driver():
    """WebDriverのインスタンスを生成して返す共通関数"""
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

def scrape_jleague_standings(driver, league_code):
    """Jリーグ(j1, j2, j3)の順位表を取得する関数"""
    all_data = []
    try:
        url = f'https://www.jleague.jp/standings/{league_code}/'
        driver.get(url)
        
        wait = WebDriverWait(driver, 20)
        # 新しいクラス名 rt-TableRootTable を持つテーブルを待機
        table = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, 'rt-TableRootTable')))
        
        columns = ['順位', 'チーム名', '勝点', '試合数', '勝', '分', '敗', '得点', '失点', '得失点差']
        rows = table.find_element(By.TAG_NAME, 'tbody').find_elements(By.TAG_NAME, 'tr')
        
        for row in rows:
            cols = row.find_elements(By.TAG_NAME, 'td')
            if len(cols) < 11: continue

            rank = cols[0].text.strip()
            team_name_raw = cols[1].text.strip()
            # 順位等の数字が含まれてしまうケースなどがあれば適宜整形
            team_name = zenkaku_to_hankaku(team_name_raw)
            
            # 3: 勝点, 4: 試合数, 5: 勝, 6: 分, 7: 敗, 8: 得点, 9: 失点, 10: 得失点差
            team_stats = [cols[i].text.strip() for i in range(3, 11)]
            final_row = [rank, team_name] + team_stats
            all_data.append(final_row)

        df = pd.DataFrame(all_data, columns=columns)
        
        filename = f'{league_code}rank.csv'
        filepath = os.path.join(SAVE_DIRECTORY, filename)
        df.to_csv(filepath, index=False, encoding='utf-8-sig')
        
        print(f"成功: {filepath} に順位表を保存しました。")

    except Exception as e:
        print(f"エラー: {league_code.upper()}のデータ抽出中に予期せぬエラーが発生しました。 {e}", file=sys.stderr)

def to_int_safely(text):
    """文字列を安全に整数に変換する。変換できない場合は0を返す。"""
    try:
        return int(text.strip())
    except (ValueError, AttributeError):
        return 0

def scrape_jfl_standings(driver):
    """JFLの順位表を取得する最終完成版関数"""
    all_data = []
    try:
        url = 'http://www.jfl.or.jp/jfl-pc/view/s.php?a=2376'
        driver.get(url)

        wait = WebDriverWait(driver, 20)
        table = wait.until(EC.visibility_of_element_located((By.XPATH, "//h3[contains(., '順位表')]/following-sibling::table")))
        
        columns = ['順位', 'チーム名', '勝点', '試合数', '勝', '分', '敗', '得点', '失点', '得失点差']
        
        rows = table.find_element(By.TAG_NAME, 'tbody').find_elements(By.TAG_NAME, 'tr')

        for row in rows[2:]:
            cols = row.find_elements(By.TAG_NAME, 'td')
            if len(cols) < 16: continue

            rank = cols[0].text.strip()
            team_name_raw = cols[1].text.strip()
            team_name = zenkaku_to_hankaku(team_name_raw)
            
            points = cols[2].text.strip()
            matches = cols[3].text.strip()
            
            total_wins = to_int_safely(cols[4].text)
            total_draws = to_int_safely(cols[7].text)
            total_losses = to_int_safely(cols[10].text)
            
            goals_for = cols[14].text.strip()
            goals_against = cols[15].text.strip()
            goal_diff = cols[13].text.strip()
            
            final_row = [rank, team_name, points, matches, total_wins, total_draws, total_losses, goals_for, goals_against, goal_diff]
            all_data.append(final_row)
        
        df = pd.DataFrame(all_data, columns=columns)
        
        filename = f'jflrank.csv'
        filepath = os.path.join(SAVE_DIRECTORY, filename)
        df.to_csv(filepath, index=False, encoding='utf-8-sig')
        
        print(f"成功: {filepath} に順位表を保存しました。")

    except Exception as e:
        print(f"エラー: JFLのデータ抽出中に予期せぬエラーが発生しました。 {e}", file=sys.stderr)

def main():
    """J1, J2, J3, JFLの全データを順番に取得するメイン処理"""
    
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
        j_leagues = ['j1', 'j2', 'j3']
        for league in j_leagues:
            print("-" * 30)
            print(f"リーグ: {league.upper()}")
            scrape_jleague_standings(driver, league)
        
        print("-" * 30)
        print(f"リーグ: JFL")
        scrape_jfl_standings(driver)

    finally:
        if driver:
            driver.quit()
        print("-" * 30)
        print("\nすべての処理が完了しました。")

if __name__ == '__main__':
    main()