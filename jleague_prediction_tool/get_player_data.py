import pandas as pd
import requests
from bs4 import BeautifulSoup
import os
import time
from tqdm import tqdm

# --- 設定項目 ---
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
DATA_FOLDER = os.path.join(WEB_ROOT_PATH, 'data')
PLAYER_CSV_PATH = os.path.join(DATA_FOLDER, 'playerdata.csv')
OVERSEAS_DETAILS_MANUAL_PATH = os.path.join(DATA_FOLDER, 'overseas_details_manual.csv')

BASE_URL = "https://soccer.yahoo.co.jp"
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

def get_team_urls_and_names():
    team_list = []
    print("Jリーグ全チームのURLと名前を取得中...")
    for league in ['j1', 'j2', 'j3']:
        try:
            url = f"{BASE_URL}/jleague/category/{league}/teams"
            response = requests.get(url, headers=HEADERS)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'lxml')
            teams_section = soup.find('section', id='tm_list')
            if not teams_section: continue
            links = teams_section.find_all('a', href=lambda href: href and '/teams/' in href and '/players' in href)
            processed_teams = set()
            for link in links:
                if '/players' in link['href']:
                    team_name_tag = link.find_previous('h2', class_='sc-team__title')
                    if team_name_tag and team_name_tag.get_text(strip=True) not in processed_teams:
                        team_name = team_name_tag.get_text(strip=True)
                        player_page_url = BASE_URL + link['href']
                        team_list.append({'name': team_name, 'url': player_page_url, 'league': league.upper()})
                        processed_teams.add(team_name)
        except Exception: continue
    print(f"合計 {len(team_list)} チームの情報を発見しました。")
    return team_list

def get_players_from_jleague_team(team_info):
    try:
        response = requests.get(team_info['url'], headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')
        players_data = []
        player_table = soup.find('table', id='player')
        if not player_table: return []
        rows = player_table.select('tbody tr.sc-tablePlayer__row')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 6: continue
            position = cells[0].get_text(strip=True)
            player_name = (cells[2].find('a') or cells[2]).get_text(strip=True)
            birth_date = cells[3].get_text(strip=True).split('(')[0].strip()
            height_weight = cells[4].get_text(strip=True)
            origin_place = cells[5].get_text(strip=True)
            height, weight = [x.strip() for x in height_weight.split('/')] if '/' in height_weight else (height_weight, '-')
            if position == '監督': height, weight = '-', '-'
            players_data.append({
                '国': '日本', 'リーグ': team_info['league'], '所属クラブ': team_info['name'],
                '選手名': player_name, '出身地': origin_place, '生年月日': birth_date,
                '身長': height, '体重': weight, 'ポジション': position, '詳細': ''
            })
        return players_data
    except Exception: return []

# ★★★【修正】海外組の処理を、手動CSVを直接読み込む形に変更 ★★★
def get_overseas_players_from_manual_file():
    print("\n海外日本人選手の手動管理ファイルを取得中...")
    try:
        df = pd.read_csv(OVERSEAS_DETAILS_MANUAL_PATH)
        # 不足している必須列があれば空で追加
        for col in ['国', '詳細']:
            if col not in df.columns:
                df[col] = ''
        df['国'] = df['国'].fillna('日本') # 国が空欄なら日本で埋める
        print(f"{len(df)} 人の海外選手データを読み込みました。")
        return df
    except FileNotFoundError:
        print("警告: 手動管理ファイルが見つかりません。海外組のデータはスキップされます。")
        return pd.DataFrame()
    except Exception as e:
        print(f"エラー: 手動管理ファイルの読み込みに失敗しました - {e}")
        return pd.DataFrame()


def main():
    print("--- Jリーグ＆海外日本人 選手データ統合ツール ---")
    
    # 1. Jリーグ選手データ取得
    jleague_teams = get_team_urls_and_names()
    jleague_players_list = []
    if jleague_teams:
        for team in tqdm(jleague_teams, desc="Jリーグ選手データを取得中"):
            jleague_players_list.extend(get_players_from_jleague_team(team))
            time.sleep(0.5)
    jleague_df = pd.DataFrame(jleague_players_list)
    print(f"Jリーグ選手 {len(jleague_df)} 人のデータを取得しました。")

    # 2. 海外組データ取得
    overseas_final_df = get_overseas_players_from_manual_file()
    
    # 3. 全データを結合して保存
    final_df = pd.concat([jleague_df, overseas_final_df], ignore_index=True)
    
    final_cols = ['国', 'リーグ', '所属クラブ', '選手名', '出身地', '生年月日', '身長', '体重', 'ポジション', '詳細']
    for col in final_cols:
        if col not in final_df.columns:
            final_df[col] = ''
    final_df = final_df[final_cols].fillna('')

    final_df.to_csv(PLAYER_CSV_PATH, index=False, encoding='utf-8-sig')
    
    print(f"\n合計 {len(final_df)} 人の全選手データを '{PLAYER_CSV_PATH}' に更新しました。")
    print("--- ツールを終了します ---")

if __name__ == '__main__':
    main()