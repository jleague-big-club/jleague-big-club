import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

driver.get("https://www.jleague.jp/j1/match/")
WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.m-schedule--game-over")))
time.sleep(1)

game_over_matches = driver.find_elements(By.CSS_SELECTOR, "div.m-schedule--game-over")
print(f"Game over matches: {len(game_over_matches)}")

for i, match in enumerate(game_over_matches):
    print(f"\n--- Match {i+1} ---")
    
    # Check home team
    try:
        home_els = match.find_elements(By.CSS_SELECTOR, "div.m-schedule__team-home span[data-media='pc']")
        print(f"  Home spans (pc): {len(home_els)} -> '{home_els[0].text.strip() if home_els else 'NONE'}'")
    except Exception as e:
        print(f"  Home error: {e}")
    
    # Check away team
    try:
        away_els = match.find_elements(By.CSS_SELECTOR, "div.m-schedule__team-away span[data-media='pc']")
        print(f"  Away spans (pc): {len(away_els)} -> '{away_els[0].text.strip() if away_els else 'NONE'}'")
    except Exception as e:
        print(f"  Away error: {e}")
    
    # Check score elements
    try:
        score_els = match.find_elements(By.CSS_SELECTOR, "p.m-schedule__score")
        print(f"  Score elements: {len(score_els)}")
        for j, s in enumerate(score_els):
            print(f"    Score[{j}]: '{s.text.strip()}'")
    except Exception as e:
        print(f"  Score error: {e}")
    
    # Try broader selector
    try:
        all_p = match.find_elements(By.CSS_SELECTOR, "p[class*='m-schedule__score']")
        print(f"  Score p (contains): {len(all_p)}")
    except Exception as e:
        print(f"  Score broad error: {e}")

driver.quit()
