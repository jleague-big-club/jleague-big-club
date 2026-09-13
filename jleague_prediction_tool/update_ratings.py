import pandas as pd
import json
import os
import shutil
from datetime import datetime

# --- 設定項目 ---
# <<< 修正点: generate_predictions.pyと統一し、データフォルダのパスを固定で指定
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
DATA_FOLDER = os.path.join(WEB_ROOT_PATH, 'data')

# <<< 修正点: すべてのファイルパスをDATA_FOLDER基準に変更 (この部分は変更なしでOK)
SCHEDULE_CSV_PATH = os.path.join(DATA_FOLDER, 'schedule.csv')
TEAM_RATINGS_JSON_PATH = os.path.join(DATA_FOLDER, 'team_ratings.json') 
# K_FACTORは変更なし
K_FACTOR = 24

# --- Eloレーティングの計算ロジック ---
def calculate_elo(rating_a, rating_b, score_a, score_b):
    expected_a = 1 / (1 + 10**((rating_b - rating_a) / 400))
    actual_a = 0.5
    if score_a > score_b:
        actual_a = 1.0
    elif score_a < score_b:
        actual_a = 0.0
    
    new_rating_a = rating_a + K_FACTOR * (actual_a - expected_a)
    new_rating_b = rating_b - K_FACTOR * (actual_a - expected_a)
    
    return new_rating_a, new_rating_b

# --- メイン処理 ---
def main():
    print("--- チームレーティング更新ツールを開始します ---")
    
    # dataフォルダが存在しない場合は作成
    os.makedirs(DATA_FOLDER, exist_ok=True)

    try:
        schedule_df = pd.read_csv(SCHEDULE_CSV_PATH, encoding='utf-8-sig', dtype={'年': str})
        # team_ratings.jsonは存在しない場合もあるので、なければ空のdictで初期化
        if os.path.exists(TEAM_RATINGS_JSON_PATH):
            with open(TEAM_RATINGS_JSON_PATH, 'r', encoding='utf-8') as f:
                initial_team_ratings = json.load(f)
        else:
            print(f"警告: {TEAM_RATINGS_JSON_PATH} が見つかりません。新規に作成します。")
            initial_team_ratings = {}

        print(f"スケジュール ({SCHEDULE_CSV_PATH}) と初期レーティング ({TEAM_RATINGS_JSON_PATH}) を正常に読み込みました。")
    except FileNotFoundError:
         print(f"エラー: スケジュールファイル '{SCHEDULE_CSV_PATH}' が見つかりません。")
         return
    except Exception as e:
        print(f"エラー: データファイルの読み込み中にエラーが発生しました。 - {e}")
        return

    # ★★★ チーム名正規化マップ ★★★
    team_name_normalization_map = {
        '栃木シティＦＣ': '栃木シティ', '栃木Ｃ': '栃木シティ', '栃木ＳＣ': '栃木SC',
        '栃木': '栃木SC',  # <<<--- この行を追加
        'ザスパクサツ群ma': 'ザスパ群馬', 'Ｙ．Ｓ．Ｃ．Ｃ．横浜': 'YS横浜'
        # 他に必要な正規化があればここに追加
    }
    schedule_df.replace(team_name_normalization_map, inplace=True)
    
    current_season_year = str(datetime.now().year)
    print(f"{current_season_year}年シーズンのレーティングを計算します。")
    
    season_games = schedule_df[schedule_df['年'] == current_season_year].copy()

    if season_games.empty:
        print(f"警告: {current_season_year}年の試合データがschedule.csvに見つかりません。")
        # 処理を続行し、初期レートでファイルを作成・更新する
    
    # リーグ構成はCSVから動的に取得
    league_teams_this_season = {}
    for league in ['J1', 'J2', 'J3']:
        league_games = season_games[season_games['リーグ'] == league]
        if not league_games.empty:
            league_teams_this_season[league] = sorted(list(pd.concat([league_games['ホーム'], league_games['アウェイ']]).unique()))
    print("今シーズンのリーグ構成をschedule.csvから取得しました。")

    flat_ratings = {}
    for teams in initial_team_ratings.values():
        flat_ratings.update(teams)

    for league, teams in league_teams_this_season.items():
        for team in teams:
            if team not in flat_ratings:
                flat_ratings[team] = 1500
                print(f"新規チーム '{team}' を初期レート1500で追加しました。")
    
    finished_games = season_games.dropna(subset=['ホーム得点', 'アウェイ得点']).copy()
    
    if not finished_games.empty:
        # 日付のフォーマットが '25/2/14' と '4/5' の両方に対応
        finished_games['日付_obj'] = pd.to_datetime(
            finished_games['年'] + '/' + finished_games['日付'],
            format='%Y/%m/%d',
            errors='coerce'
        )
        finished_games.sort_values('日付_obj', inplace=True, na_position='first')
        
        for _, row in finished_games.iterrows():
            home_team, away_team = row['ホーム'], row['アウェイ']
            try:
                score_a, score_b = float(row['ホーム得点']), float(row['アウェイ得点'])
            except (ValueError, TypeError):
                continue

            if home_team in flat_ratings and away_team in flat_ratings:
                rating_a, rating_b = flat_ratings[home_team], flat_ratings[away_team]
                new_rating_a, new_rating_b = calculate_elo(rating_a, rating_b, score_a, score_b)
                flat_ratings[home_team], flat_ratings[away_team] = new_rating_a, new_rating_b
        
        print(f"{len(finished_games)}試合の結果を反映し、レーティングを再計算しました。")
    else:
        print(f"{current_season_year}年の試合結果が見つからないため、初期レートのまま出力します。")

    updated_team_ratings = {"J1": {}, "J2": {}, "J3": {}}
    for league, teams in league_teams_this_season.items():
        for team in teams:
            if team in flat_ratings:
                updated_team_ratings[league][team] = flat_ratings[team]

    try:
        with open(TEAM_RATINGS_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(updated_team_ratings, f, indent=4, ensure_ascii=False, sort_keys=True)
        print(f"'{TEAM_RATINGS_JSON_PATH}' を更新しました。")

        # ★★★【修正】更新日時ファイルのパスも修正 ★★★
        update_dates_path = os.path.join(DATA_FOLDER, 'update_dates.json')
        dates_data = {}
        if os.path.exists(update_dates_path):
            with open(update_dates_path, 'r', encoding='utf-8') as f:
                dates_data = json.load(f)
        
        dates_data['ratings_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        with open(update_dates_path, 'w', encoding='utf-8') as f:
            json.dump(dates_data, f, indent=2, ensure_ascii=False)
        print(f"更新日時を '{update_dates_path}' に記録しました。")

    except Exception as e:
        print(f"エラー: レーティングファイルの保存に失敗しました。 - {e}")

    print("--- チームレーティング更新ツールを終了します ---")

if __name__ == '__main__':
    main()