import requests
import pandas as pd
from bs4 import BeautifulSoup
import os
import time

# --- 設定項目 ---
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
DATA_DIR = os.path.join(WEB_ROOT_PATH, 'data')
SCHEDULE_CSV_PATH = os.path.join(DATA_DIR, 'schedule.csv')
ATTENDANCE_CSV_PATH = os.path.join(DATA_DIR, 'attendancefigure.csv')
YEAR = 2025

# --- URL定義 ---
JLEAGUE_BASE_URL = "https://www.jleague.jp"
JLEAGUE_SCHEDULE_URL = f"{JLEAGUE_BASE_URL}/match/search.html?year={YEAR}"
JLEAGUE_RANKING_URL_TEMPLATE = "https://www.jleague.jp/standings/j{league}/"
JFL_RANKING_URL = "http://www.jfl.or.jp/jfl-pc/view/s.php?a=2376"
SOCCERDB_ATTENDANCE_URL_TEMPLATE = "https://soccer-db.net/competition/attendance.php?comp={league_id}"

# --- チーム名の表記揺れを統一するマップ ---
JFL_TEAM_MAP = {
    '滋賀': 'レイラック滋賀ＦＣ', '沖縄SV': '沖縄ＳＶ', 'Honda': 'Ｈｏｎｄａ　ＦＣ',
    'V大分': 'ヴェルスパ大分', '枚方': 'ティアモ枚方', '浦安': 'ブリオベッカ浦安',
    '岩手': 'いわてグルージャ盛岡', '鈴鹿': 'アトレチコ鈴鹿', '三重': 'ヴィアティン三重',
    '岡崎': 'マルヤス岡崎', '新宿': 'クリアソン新宿', 'YS横浜': 'Ｙ．Ｓ．Ｃ．Ｃ．横浜',
    '武蔵野': '東京武蔵野ユナイテッドＦＣ', '飛鳥': '飛鳥ＦＣ', 'ミネベア': 'ミネベアミツミＦＣ'
}

INV_SOCCERDB_TEAM_MAP = {
    "浦和": "浦和レッズ", "FC東京": "ＦＣ東京", "名古屋": "名古屋グランパス", "Ｇ大阪": "ガンバ大阪",
    "広島": "サンフレッチェ広島", "鹿島": "鹿島アントラーズ", "横浜FM": "横浜Ｆ・マリノス", "新潟": "アルビレックス新潟",
    "川崎": "川崎フロンターレ", "神戸": "ヴィッセル神戸", "東京Ｖ": "東京ヴェルディ", "清水": "清水エスパルス",
    "Ｃ大阪": "セレッソ大阪", "岡山": "ファジアーノ岡山", "京都": "京都サンガF.C.", "町田": "ＦＣ町田ゼルビア",
    "柏": "柏レイソル", "湘南": "湘南ベルマーレ", "横浜FC": "横浜ＦＣ", "福岡": "アビスパ福岡"
    # J2, J3も必要に応じて追加
}

def get_soup(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        response.encoding = response.apparent_encoding
        return BeautifulSoup(response.text, 'html.parser')
    except requests.exceptions.RequestException as e:
        print(f"エラー: {url} へのアクセスに失敗しました - {e}")
        return None

def scrape_jleague_schedule():
    print("--- Jリーグ公式サイトから試合日程・結果の取得を開始 ---")
    all_matches = []
    
    for month in range(2, 13): # 2月から12月まで
        print(f"{month}月のデータを取得中...")
        url = f"{JLEAGUE_SCHEDULE_URL}&month={month}"
        soup = get_soup(url)
        if not soup: continue

        match_divs = soup.find_all('div', class_='match-list-item')
        for match_div in match_divs:
            try:
                league_tag = match_div.find('div', class_='league-emblem').find('img')['alt']
                league = ''
                if 'Ｊ１' in league_tag: league = 'J1'
                elif 'Ｊ２' in league_tag: league = 'J2'
                elif 'Ｊ３' in league_tag: league = 'J3'
                if not league: continue

                date_str = match_div.find('h4', class_='left').text.split('(')[0]
                formatted_date = f"{str(YEAR)[-2:]}/{date_str}"
                
                section = match_div.find('h5').text.strip()
                home_team = match_div.find('dd', class_='match-team-home').find('a').text.strip()
                away_team = match_div.find('dd', class_='match-team-away').find('a').text.strip()
                
                score_elem = match_div.find('dd', class_='match-score')
                home_score, away_score = None, None
                if score_elem and score_elem.find('a'):
                    scores = score_elem.find('a').text.strip().split('-')
                    if len(scores) == 2 and scores[0].isdigit() and scores[1].isdigit():
                        home_score, away_score = int(scores[0]), int(scores[1])

                all_matches.append([YEAR, league, section, formatted_date, home_team, home_score, away_score, away_team])
            except Exception:
                continue
        time.sleep(1)

    if not all_matches: return pd.DataFrame()
    df = pd.DataFrame(all_matches, columns=['年', 'リーグ', '節', '日付', 'ホーム', 'ホーム得点', 'アウェイ得点', 'アウェイ'])
    df['ホーム得点'], df['アウェイ得点'] = df['ホーム得点'].astype('Int64'), df['アウェイ得点'].astype('Int64')
    return df

def update_schedule_csv(new_df):
    print("\n--- schedule.csv の更新を開始 ---")
    if new_df.empty:
        print("取得したデータが空のため、schedule.csvを更新しませんでした。")
        return
    try:
        if os.path.exists(SCHEDULE_CSV_PATH):
            existing_df = pd.read_csv(SCHEDULE_CSV_PATH, encoding='utf-8-sig', dtype={'年': str})
        else:
            existing_df = pd.DataFrame(columns=['年', 'リーグ', '節', '日付', 'ホーム', 'ホーム得点', 'アウェイ得点', 'アウェイ'])
        
        existing_df['key'] = existing_df['年'].astype(str) + '_' + existing_df['ホーム'] + '_' + existing_df['アウェイ']
        new_df['key'] = new_df['年'].astype(str) + '_' + new_df['ホーム'] + '_' + new_df['アウェイ']
        merged_df = pd.concat([existing_df, new_df[~new_df['key'].isin(existing_df['key'])]], ignore_index=True)
        merged_df.set_index('key', inplace=True)
        new_df.set_index('key', inplace=True)
        merged_df.update(new_df[['ホーム得点', 'アウェイ得点']])
        merged_df.reset_index(inplace=True)
        
        final_df = merged_df.drop(columns='key')
        final_df.sort_values(by=['年', 'リーグ', '節', '日付'], inplace=True)
        final_df.to_csv(SCHEDULE_CSV_PATH, index=False, encoding='utf-8-sig')
        print(f"-> schedule.csv を正常に更新しました。({len(final_df)}試合)")
    except Exception as e:
        print(f"エラー: schedule.csv の更新に失敗しました - {e}")

def scrape_and_save_rankings():
    print("\n--- Jリーグ順位表の取得を開始 ---")
    for league in [1, 2, 3]:
        print(f"J{league}の順位表を取得中...")
        url = JLEAGUE_RANKING_URL_TEMPLATE.format(league=league)
        try:
            soup = get_soup(url)
            rank_table = soup.find('table', class_='J_rank_table')
            if not rank_table:
                print(f"  - 警告: J{league}の順位表テーブルが見つかりません。")
                continue
            rows = rank_table.find('tbody').find_all('tr')
            league_data = []
            for row in rows:
                cols = row.find_all('td')
                rank, team, points = cols[0].text.strip(), cols[1].find('a').text.strip(), cols[2].text.strip()
                league_data.append([rank, team, points])
            df = pd.DataFrame(league_data, columns=['順位', 'チーム名', '勝点'])
            df.to_csv(os.path.join(DATA_DIR, f'j{league}rank.csv'), index=False, encoding='utf-8-sig')
            print(f"-> j{league}rank.csv を正常に更新しました。({len(df)}チーム)")
            time.sleep(1)
        except Exception as e:
            print(f"  - エラー: J{league}の順位表取得に失敗しました - {e}")

def scrape_and_save_jfl_ranking():
    print("\n--- JFL順位表の取得を開始 ---")
    soup = get_soup(JFL_RANKING_URL)
    if not soup: return
    try:
        table = soup.find('table', class_='ranking-table')
        if not table:
             print("  - 警告: JFLの順位表テーブルが見つかりません。")
             return
        rows = table.find_all('tr')[1:]
        jfl_data = []
        for row in rows:
            cols = row.find_all('td')
            rank, team_raw, points = cols[0].text.strip(), cols[1].text.strip(), cols[2].text.strip()
            team_name = JFL_TEAM_MAP.get(team_raw, team_raw)
            jfl_data.append([rank, team_name, points, '0','0','0','0','0','0'])
        df = pd.DataFrame(jfl_data, columns=['順位', 'チーム名', '勝点', '試合数', '勝', '分', '敗', '得点', '失点'])
        df.to_csv(os.path.join(DATA_DIR, 'jflrank.csv'), index=False, encoding='utf-8-sig')
        print(f"-> jflrank.csv を正常に更新しました。({len(df)}チーム)")
    except Exception as e:
        print(f"  - エラー: JFL順位表の解析に失敗しました - {e}")

def scrape_and_update_attendance():
    print("\n--- 観客動員数データの更新を開始 ---")
    try:
        existing_df = pd.read_csv(ATTENDANCE_CSV_PATH, encoding='utf-8-sig')
    except FileNotFoundError:
        existing_df = pd.DataFrame(columns=['リーグ', '年', 'クラブ', '平均観客数', '年間最高観客数', '年間最低観客数', 'ゲーム数'])
    
    all_new_data = []
    for league_id, league_name in zip([1, 2, 3], ['J1', 'J2', 'J3']):
        url = SOCCERDB_ATTENDANCE_URL_TEMPLATE.format(league_id=league_id)
        print(f"{league_name}の観客数を取得中...")
        soup = get_soup(url)
        if not soup: continue
        try:
            table = soup.select_one('table#rank_table.tablesorter')
            if not table:
                print(f"  - 警告: {league_name}の観客数テーブルが見つかりません。")
                continue
            rows = table.find('tbody').find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                team_raw = cols[1].text.strip()
                team_name = INV_SOCCERDB_TEAM_MAP.get(team_raw, team_raw)
                avg, high, low, games = [c.text.strip().replace(',', '') for c in cols[2:6]]
                all_new_data.append([league_name, YEAR, team_name, avg, high, low, games])
        except Exception as e:
            print(f"  - エラー: {league_name}の観客数データの解析に失敗しました - {e}")
        time.sleep(1)

    if not all_new_data:
        print("新しい観客数データを取得できませんでした。")
        return
        
    new_df = pd.DataFrame(all_new_data, columns=['リーグ', '年', 'クラブ', '平均観客数', '年間最高観客数', '年間最低観客数', 'ゲーム数'])
    df_without_current_year = existing_df[existing_df['年'] != YEAR]
    final_df = pd.concat([df_without_current_year, new_df], ignore_index=True)
    final_df.sort_values(by=['年', 'リーグ', '平均観客数'], ascending=[False, True, False], inplace=True)
    final_df.to_csv(ATTENDANCE_CSV_PATH, index=False, encoding='utf-8-sig')
    print(f"-> attendancefigure.csv を正常に更新しました。({len(final_df)}件)")

def main():
    # 1. スケジュールを取得して更新
    new_schedule_df = scrape_jleague_schedule()
    update_schedule_csv(new_schedule_df)
    
    # 2. Jリーグ順位表を取得して保存
    scrape_and_save_rankings()
    
    # 3. JFL順位表を取得して保存
    scrape_and_save_jfl_ranking()

    # 4. 観客動員数を取得して更新
    scrape_and_update_attendance()

if __name__ == '__main__':
    main()