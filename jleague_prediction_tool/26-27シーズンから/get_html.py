import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

# --- 設定 ---

# ★★★ 調査したいページのURLをここに指定 ★★★
TARGET_URL = 'https://www.jleague.jp/stats/j1/club/2025/score/'

# ★★★ HTMLの保存ファイル名を指定 ★★★
OUTPUT_FILENAME = 'jleague_stats_page.html'

# --- メイン処理 ---

def get_driver():
    """WebDriverのインスタンスを生成して返す共通関数"""
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

def main():
    """指定されたURLのHTMLを取得し、ファイルに保存する"""
    
    driver = get_driver()
    if not driver:
        return

    try:
        print(f"\nページにアクセスしています: {TARGET_URL}")
        driver.get(TARGET_URL)
        
        # ページが完全に読み込まれるのを少し待つ (JavaScriptで描画されるコンテンツのため)
        print("ページの読み込みを待っています (5秒)...")
        time.sleep(5) 
        
        print("ページのHTMLソースを取得しています...")
        # driver.page_source を使うと、JavaScript実行後の最終的なHTMLを取得できる
        html_source = driver.page_source
        
        print(f"HTMLを '{OUTPUT_FILENAME}' に保存しています...")
        with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as f:
            f.write(html_source)
            
        print(f"\n✔ 成功: {OUTPUT_FILENAME} にページのHTMLを保存しました。")
        print("このファイルをブラウザで開いたり、エディタで構造を確認してください。")

    except Exception as e:
        print(f"エラー: ページの取得中に予期せぬエラーが発生しました。 {e}", file=sys.stderr)
    finally:
        if driver:
            driver.quit()
            print("\nブラウザを終了しました。")

if __name__ == '__main__':
    main()