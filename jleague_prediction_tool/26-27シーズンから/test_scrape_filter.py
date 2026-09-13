import sys
import time
import unicodedata
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def normalize_text(text):
    return unicodedata.normalize('NFKC', text)

def get_driver():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    service = ChromeService(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=chrome_options)

def main():
    output_lines = []
    output_lines.append('=' * 60)
    output_lines.append('  カップ戦フィルタリング テスト結果')
    output_lines.append('=' * 60)

    driver = get_driver()
    leagues = ['j1', 'j2', 'j3']

    try:
        for league in leagues:
            url = f'https://www.jleague.jp/{league}/match/'
            output_lines.append(f'\n' + '-' * 50)
            output_lines.append(f'  リーグ: {league.upper()}  ({url})')
            output_lines.append('-' * 50)
            print(f'-> {url} を取得中...')
            driver.get(url)

            try:
                WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.ID, 'onetrust-accept-btn-handler'))
                ).click()
                time.sleep(2)
            except Exception:
                pass

            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'div.m-schedule--game-over'))
                )
            except Exception:
                output_lines.append('  -> 試合終了の試合なし。スキップ。')
                continue
            time.sleep(1)

            league_matches_js = driver.execute_script("""
                const results = [];
                const gameOverDivs = document.querySelectorAll('div.m-schedule--game-over');
                for (const match of gameOverDivs) {
                    let sectionTitle = '';
                    let el = match;
                    while (el) {
                        let prev = el.previousElementSibling;
                        while (prev) {
                            const text = prev.textContent || '';
                            if (text.includes('LEAGUE') || text.includes('リーグ')) {
                                sectionTitle = text.trim();
                                break;
                            }
                            if (text.includes('杯') || text.includes('カップ') || text.includes('Cup') || text.includes('U-21') || text.includes('ACL')) {
                                sectionTitle = text.trim();
                                break;
                            }
                            prev = prev.previousElementSibling;
                        }
                        if (sectionTitle) break;
                        el = el.parentElement;
                    }
                    results.push(sectionTitle);
                }
                return results;
            """)

            game_over_matches = driver.find_elements(By.CSS_SELECTOR, 'div.m-schedule--game-over')
            output_lines.append(f'  検出した試合終了ブロック数: {len(game_over_matches)} 件\n')

            league_count = 0
            cup_count = 0

            for i, match in enumerate(game_over_matches):
                try:
                    section_title = league_matches_js[i] if i < len(league_matches_js) else ''
                    is_league = 'LEAGUE' in section_title or 'リーグ' in section_title
                    is_cup = bool(section_title) and not is_league

                    home_el = match.find_element(By.CSS_SELECTOR, "div.m-schedule__team-home span[data-media='pc']")
                    away_el = match.find_element(By.CSS_SELECTOR, "div.m-schedule__team-away span[data-media='pc']")
                    home_raw = (home_el.get_attribute('textContent') or '').strip()
                    away_raw = (away_el.get_attribute('textContent') or '').strip()

                    score_els = match.find_elements(By.CSS_SELECTOR, 'p.m-schedule__score')
                    if len(score_els) >= 2:
                        hs = score_els[0].text.strip()
                        as_ = score_els[1].text.strip()
                        score_str = f'{hs} - {as_}' if (hs.isdigit() and as_.isdigit()) else '(未終了)'
                    else:
                        score_str = '(スコア取得不可)'

                    judge = 'SKIP(カップ戦)' if is_cup else 'OK  (リーグ戦)'
                    if is_cup:
                        cup_count += 1
                    else:
                        league_count += 1

                    output_lines.append(f'  [{judge}] {home_raw} vs {away_raw}  スコア: {score_str}')
                    output_lines.append(f'           セクション: {section_title[:60] if section_title else "(不明)"}')
                    output_lines.append('')
                except Exception as e:
                    output_lines.append(f'  [エラー] {e}')

            output_lines.append(f'  集計: リーグ戦={league_count}件 / カップ戦等={cup_count}件スキップ')

    finally:
        driver.quit()

    output_lines.append('\n' + '=' * 60)
    output_lines.append('テスト完了')
    output_lines.append('=' * 60)

    out_path = r'test_scrape_result.txt'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    print(f'[完了] 結果を {out_path} に出力しました。')

if __name__ == '__main__':
    main()
