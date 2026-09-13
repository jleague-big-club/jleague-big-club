import pandas as pd
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
import time

# --- 設定項目 ---
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
DATA_FOLDER = os.path.join(WEB_ROOT_PATH, 'data')
ATTENDANCE_CSV_PATH = os.path.join(DATA_FOLDER, 'attendancefigure.csv')

LEAGUE_IDS = {'J1': '1001', 'J2': '1002', 'J3': '1003'}

# チーム名の表記揺れを統一するためのマップ（soccer-db.net -> CSV）
TEAM_NAME_MAP = {
    '横浜FM': '横浜Ｆ・マリノス', 'FC東京': 'ＦＣ東京', 'Ｃ大阪': 'セレッソ大阪', 'Ｇ大阪': 'ガンバ大阪',
    '京都': '京都サンガF.C.', '広島': 'サンフレッチェ広島', '福岡': 'アビスパ福岡', '鳥栖': 'サガン鳥栖',
    '神戸': 'ヴィッセル神戸', '磐田': 'ジュビロ磐田', '札幌': '北海道コンサドーレ札幌', '新潟': 'アルビレックス新潟',
    '町田': 'ＦＣ町田ゼルビア', '東京Ｖ': '東京ヴェルディ', '岡山': 'ファジアーノ岡山', '長崎': 'Ｖ・ファーレン長崎',
    '千葉': 'ジェフユナイテッド千葉', '仙台': 'ベガルタ仙台', '山形': 'モンテディオ山形', '大宮': 'ＲＢ大宮アルディージャ',
    '大分': '大分トリニータ', '甲府': 'ヴァンフォーレ甲府', '熊本': 'ロアッソ熊本', '山口': 'レノファ山口ＦＣ',
    '秋田': 'ブラウブリッツ秋田', '水戸': '水戸ホーリーホック', '愛媛': '愛媛ＦＣ', '富山': 'カターレ富山',
    '今治': 'ＦＣ今治', '岩手': 'いわてグルージャ盛岡', 'YS横浜': '横浜スポーツ&カルチャークラブ', '金沢': 'ツエーゲン金沢',
    '北九州': 'ギラヴァンツ北九州', '岐阜': 'ＦＣ岐阜', '長野': 'ＡＣ長野パルセイロ', '沼津': 'アスルクラロ沼津',
    '相模原': 'ＳＣ相模原', '宮崎': 'テゲバジャーロ宮崎', '鳥取': 'ガイナーレ鳥取', '讃岐': 'カマタマーレ讃岐',
    '福島': '福島ユナイテッドＦＣ', '八戸': 'ヴァンラーレ八戸', '琉球': 'ＦＣ琉球', 'FC大阪': 'ＦＣ大阪',
    '高知': '高知ユナイテッドSC', '栃木': '栃木ＳＣ', '栃木SCＳＣ': '栃木ＳＣ'
}

def scrape_attendance_data(league_name, year):
    league_id = LEAGUE_IDS[league_name]
    url = f"https://soccer-db.net/competition/attendance/{league_id}/{year}"
    print(f"{league_name} ({year}年) のデータを取得中... URL: {url}")
    
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        response.encoding = response.apparent_encoding
        soup = BeautifulSoup(response.text, 'lxml')
        
        # ★★★【最重要修正】ページ内の全テーブルをチェックし、ヘッダーの内容で判断する ★★★
        target_table = None
        all_tables = soup.find_all('table')
        
        for table in all_tables:
            # テーブルのヘッダー（<th>タグ）を取得
            headers = [th.get_text(strip=True).lower() for th in table.select('tr th')]
            # 必要な列名がすべて含まれているかチェック
            required_headers = ['team', 'ave.', 'max', 'min', 'matches']
            if all(rh in headers for rh in required_headers):
                target_table = table
                break # 目的のテーブルが見つかったのでループを終了

        if target_table is None:
            print(f"警告: {league_name} のデータテーブルが見つかりません。")
            return None

        # pandasを使って見つかったテーブルを直接DataFrameに変換
        df = pd.read_html(str(target_table), header=0)[0]
        
        # 列名をCSV形式に合わせる
        df.rename(columns={
            'team': 'クラブ', 'ave.': '平均観客数', 'max': '年間最高観客数',
            'min': '年間最低観客数', 'matches': 'ゲーム数'
        }, inplace=True)
        
        # 不要な列を削除し、必要な列だけにする
        required_cols = ['クラブ', '平均観客数', '年間最高観客数', '年間最低観客数', 'ゲーム数']
        df = df[required_cols]
        
        df.insert(0, 'リーグ', league_name)
        df.insert(1, '年', year)
        df['クラブ'] = df['クラブ'].apply(lambda x: TEAM_NAME_MAP.get(x, x))
        
        for col in ['平均観客数', '年間最高観客数', '年間最低観客数']:
            if df[col].dtype == 'object':
                 df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', ''), errors='coerce')
        
        df.dropna(subset=['平均観客数'], inplace=True)
        return df
        
    except Exception as e:
        print(f"エラー: {league_name} ({year}年) のデータ取得中にエラーが発生: {e}")
        return None

def main():
    print("--- 観客動員数データ更新ツールを開始します ---")
    target_year = 2026
    print(f"対象シーズン: {target_year}年")
    
    all_new_data = []
    is_successful = True
    
    for league in ['J1', 'J2', 'J3']:
        data = scrape_attendance_data(league, target_year)
        if data is None or data.empty:
            is_successful = False
            break
        all_new_data.append(data)
        time.sleep(1)
    
    if not is_successful:
        print(f"\n{target_year}年のデータ取得に失敗しました。処理を終了します。")
        return
        
    new_season_df = pd.concat(all_new_data, ignore_index=True)
    print(f"\n{target_year}年の新規データを{len(new_season_df)}件取得しました。")
    
    try:
        if os.path.exists(ATTENDANCE_CSV_PATH):
            past_data_df = pd.read_csv(ATTENDANCE_CSV_PATH)
            past_data_df = past_data_df[past_data_df['年'] != target_year]
            combined_df = pd.concat([past_data_df, new_season_df], ignore_index=True)
        else:
            combined_df = new_season_df
            
        # 同一リーグ・同一年・同一クラブの行が二重に入らないようにする
        # (過去に2019〜2022年のJ2で84行の重複が混入していた)
        combined_df = combined_df.drop_duplicates(subset=['リーグ', '年', 'クラブ'], keep='last')
        combined_df = combined_df.sort_values(by=['リーグ', '年', '平均観客数'], ascending=[True, False, False])
        combined_df.to_csv(ATTENDANCE_CSV_PATH, index=False, encoding='utf-8-sig')
        
        print(f"\n'{ATTENDANCE_CSV_PATH}' の更新が正常に完了しました。")
        
    except Exception as e:
        print(f"エラー: CSVファイルの更新中にエラーが発生: {e}")

    print("--- 観客動員数データ更新ツールを終了します ---")

if __name__ == '__main__':
    main()