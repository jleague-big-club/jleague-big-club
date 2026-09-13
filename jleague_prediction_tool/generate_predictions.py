import pandas as pd
import json
import os
from datetime import datetime
import random
import locale
from collections import Counter
import numpy as np

try:
    locale.setlocale(locale.LC_TIME, 'ja_JP.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_TIME, 'Japanese_Japan.932')
    except locale.Error:
        print("警告: 日本語ロケールを設定できませんでした。曜日は英語表記になります。")

# --- 設定項目 ---
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
RECENT_GAMES_COUNT = 38
SHORT_TERM_WEIGHT = 0.7 
SCORE_SIMULATIONS = 10000 
PREDICTION_VERSION = "ver.1"

# --- ここから下は変更不要です ---
# <<< 修正点: データフォルダのパスを定義し、すべてのデータパスをそこから生成
DATA_FOLDER = os.path.join(WEB_ROOT_PATH, 'data')
SCHEDULE_CSV_PATH = os.path.join(DATA_FOLDER, 'schedule.csv')
TEAM_RATINGS_JSON_PATH = os.path.join(DATA_FOLDER, 'team_ratings.json')

def load_data():
    """必要なデータを読み込む"""
    try:
        schedule_df = pd.read_csv(SCHEDULE_CSV_PATH, encoding='utf-8-sig', dtype={'年': str})
        with open(TEAM_RATINGS_JSON_PATH, 'r', encoding='utf-8') as f:
            team_ratings = json.load(f)
        print("スケジュールとチームレーティングを正常に読み込みました。")
        return schedule_df, team_ratings
    except FileNotFoundError as e:
        print(f"エラー: データファイルが見つかりません。パスを確認してください。 - {e}")
        return None, None
    except Exception as e:
        print(f"データの読み込み中に予期せぬエラーが発生しました: {e}")
        return None, None

def calculate_elo(rating_a, rating_b, score_a, score_b):
    """Eloレーティングを計算する共通関数"""
    K_FACTOR = 24
    expected_a = 1 / (1 + 10**((rating_b - rating_a) / 400))
    actual_a = 0.5
    if score_a > score_b:
        actual_a = 1.0
    elif score_a < score_b:
        actual_a = 0.0
    
    new_rating_a = rating_a + K_FACTOR * (actual_a - expected_a)
    new_rating_b = rating_b - K_FACTOR * (actual_a - expected_a)
    return new_rating_a, new_rating_b

def calculate_short_term_ratings(schedule_df, long_term_ratings_flat):
    """直近の試合結果から短期的なレーティングを計算する"""
    print(f"直近 {RECENT_GAMES_COUNT} 試合を基に短期レーティングを計算します...")
    
    finished_games = schedule_df.dropna(subset=['ホーム得点', 'アウェイ得点']).copy()
    finished_games['kickoff_dt'] = pd.to_datetime(finished_games['年'].astype(str) + '/' + finished_games['日付'].str.replace(r'^\d{2}/', '', regex=True), format='%Y/%m/%d', errors='coerce')
    finished_games = finished_games.sort_values(by='kickoff_dt', ascending=False)
    
    recent_games = finished_games.head(RECENT_GAMES_COUNT)
    
    short_term_ratings = {team: 1500 for team in long_term_ratings_flat.keys()}
    
    for _, row in recent_games.iloc[::-1].iterrows():
        home_team, away_team = row['ホーム'], row['アウェイ']
        score_a, score_b = float(row['ホーム得点']), float(row['アウェイ得点'])

        if home_team in short_term_ratings and away_team in short_term_ratings:
            rating_a = short_term_ratings[home_team]
            rating_b = short_term_ratings[away_team]
            new_rating_a, new_rating_b = calculate_elo(rating_a, rating_b, score_a, score_b)
            short_term_ratings[home_team] = new_rating_a
            short_term_ratings[away_team] = new_rating_b

    return short_term_ratings

def find_next_match_date(df):
    """結果が空の、最も近い未来の試合日を見つける"""
    try:
        future_matches = df[df['ホーム得点'].isna()].copy()
        if future_matches.empty:
            return None
        
        future_matches['日付_クリーン'] = future_matches['日付'].str.replace(r'^\d{2}/', '', regex=True)
        future_matches['kickoff_dt'] = pd.to_datetime(
            future_matches['年'].astype(str) + '/' + future_matches['日付_クリーン'],
            format='%Y/%m/%d',
            errors='coerce'
        )
        
        future_matches.dropna(subset=['kickoff_dt'], inplace=True)
        if future_matches.empty:
            return None
        
        next_date = future_matches['kickoff_dt'].min().date()
        return next_date
    except Exception as e:
        print(f"次の試合日の特定中にエラーが発生しました: {e}")
        return None

def predict_score(home_rating, away_rating):
    """レーティング差とポアソン分布に基づいてスコアを予測する"""
    HOME_ADVANTAGE = 65
    rating_diff = (home_rating + HOME_ADVANTAGE) - away_rating
    
    league_avg_goals = 1.25
    lambda_home = league_avg_goals * (10**(rating_diff / 400))
    lambda_away = league_avg_goals / (10**(rating_diff / 400))

    home_goals = np.random.poisson(lambda_home)
    away_goals = np.random.poisson(lambda_away)

    return f"{home_goals}-{away_goals}"

def generate_predictions_for_date(target_date, schedule_df, prediction_ratings):
    """指定された日付の試合の予測を生成する"""
    print(f"{SCORE_SIMULATIONS}回のスコアシミュレーションを開始します...")
    
    predictions = {
        "version": PREDICTION_VERSION,
        "J1": [], "J2": [], "J3": []
    }
    
    schedule_df['日付_クリーン'] = schedule_df['日付'].str.replace(r'^\d{2}/', '', regex=True)
    schedule_df['kickoff_dt'] = pd.to_datetime(
        schedule_df['年'].astype(str) + '/' + schedule_df['日付_クリーン'],
        format='%Y/%m/%d',
        errors='coerce'
    )
    
    target_matches = schedule_df[schedule_df['kickoff_dt'].dt.date == target_date]

    if target_matches.empty:
        print(f"{target_date} にはWINNER対象試合がありません。")
        return predictions

    for index, row in target_matches.iterrows():
        league, home_team, away_team = row['リーグ'], row['ホーム'], row['アウェイ']
        if league not in predictions:
            continue

        print(f"  > {home_team} vs {away_team} の予測を計算中...")

        home_rating = prediction_ratings.get(home_team, 1500)
        away_rating = prediction_ratings.get(away_team, 1500)

        score_sim_results = [predict_score(home_rating, away_rating) for _ in range(SCORE_SIMULATIONS)]
        score_counts = Counter(score_sim_results)
        sorted_scores = sorted(score_counts.items(), key=lambda item: item[1], reverse=True)
        
        if not sorted_scores:
            continue

        honmei_score, honmei_count = sorted_scores[0]
        taiko_score, taiko_count = sorted_scores[1] if len(sorted_scores) > 1 else ("-", 0)
        
        ooana_score, ooana_count = "-", 0
        for score, count in sorted_scores[2:]:
            prob = count / SCORE_SIMULATIONS
            if 0.01 <= prob <= 0.05:
                ooana_score = score
                ooana_count = count
                break
        if ooana_score == "-" and len(sorted_scores) > 2:
            ooana_score, ooana_count = sorted_scores[2]
            
        def get_odds(count):
            if count == 0: return "N/A"
            prob = count / SCORE_SIMULATIONS
            odds = 1 / prob if prob > 0 else 999.9
            return f"{min(odds, 99.9):.1f}倍"

        match_date_obj = row['kickoff_dt']
        weekdays_jp = ["月", "火", "水", "木", "金", "土", "日"]
        day_of_week = weekdays_jp[match_date_obj.weekday()]
        kickoff_str = f"{row['日付_クリーン']} ({day_of_week}) 19:00"

        match_prediction = {
            "kickoff": kickoff_str, "home": home_team, "away": away_team,
            "predictions": [
                {"type": "本命", "score": honmei_score, "odds": get_odds(honmei_count), "class": "favorite"},
                {"type": "対抗", "score": taiko_score, "odds": get_odds(taiko_count), "class": "contender"},
                {"type": "大穴", "score": ooana_score, "odds": get_odds(ooana_count), "class": "longshot"}
            ]
        }
        predictions[league].append(match_prediction)
        
    return predictions

def save_predictions(predictions, target_date):
    """予測結果をJSONファイルとしてウェブサイトフォルダに保存する"""
    latest_path = os.path.join(DATA_FOLDER, 'winner-predictions.json')
    try:
        with open(latest_path, 'w', encoding='utf-8') as f:
            json.dump(predictions, f, indent=2, ensure_ascii=False)
        print(f"最新の予測を '{latest_path}' に保存しました。")
    except Exception as e:
        print(f"エラー: 最新予測の保存に失敗しました。パスを確認してください: {e}")

    version_dir = os.path.join(WEB_ROOT_PATH, 'predictions-archive', PREDICTION_VERSION)
    os.makedirs(version_dir, exist_ok=True)
    
    archive_filename = f"winner-predictions_{target_date.strftime('%Y-%m-%d')}.json"
    archive_path = os.path.join(version_dir, archive_filename)
    try:
        with open(archive_path, 'w', encoding='utf-8') as f:
            json.dump(predictions, f, indent=2, ensure_ascii=False)
        print(f"アーカイブを '{archive_path}' に保存しました。")
    except Exception as e:
        print(f"エラー: アーカイブの保存に失敗しました: {e}")

    update_archive_manifest(os.path.join(WEB_ROOT_PATH, 'predictions-archive'))

def update_archive_manifest(base_archive_dir):
    """predictions-archive配下の全バージョンのJSONファイル一覧を作成・更新する"""
    all_archive_files = []
    try:
        os.makedirs(base_archive_dir, exist_ok=True)
        for version_folder in os.listdir(base_archive_dir):
            version_path = os.path.join(base_archive_dir, version_folder)
            if os.path.isdir(version_path):
                files = [os.path.join(version_folder, f).replace('\\', '/') for f in os.listdir(version_path) if f.endswith('.json')]
                all_archive_files.extend(files)

        all_archive_files.sort(key=lambda name: os.path.basename(name), reverse=True)
        
        manifest_path = os.path.join(base_archive_dir, 'archive-manifest.json')
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(all_archive_files, f, indent=2, ensure_ascii=False)
        print(f"アーカイブのマニフェスト '{manifest_path}' を更新しました。")
    except Exception as e:
        print(f"マニフェストファイルの更新中にエラーが発生しました: {e}")


if __name__ == '__main__':
    print("--- WINNER予測生成ツールを開始します ---")
    
    schedule_df, long_term_ratings = load_data()
    
    if schedule_df is not None and long_term_ratings is not None:
        
        # ★★★【追加】チーム名正規化マップ ★★★
        team_name_normalization_map = {
            '栃木シティＦＣ': '栃木シティ',
            '栃木Ｃ': '栃木シティ',
            '栃木ＳＣ': '栃木SC',
        }
        schedule_df.replace(team_name_normalization_map, inplace=True)
        print("スケジュール内のチーム名を正規化しました。")
        
        long_term_ratings_flat = {}
        for teams in long_term_ratings.values():
            long_term_ratings_flat.update(teams)

        short_term_ratings = calculate_short_term_ratings(schedule_df, long_term_ratings_flat)

        prediction_ratings = {}
        for team in long_term_ratings_flat.keys():
            long_r = long_term_ratings_flat.get(team, 1500)
            short_r = short_term_ratings.get(team, 1500)
            
            pred_r = (long_r * (1 - SHORT_TERM_WEIGHT)) + (short_r * SHORT_TERM_WEIGHT)
            prediction_ratings[team] = pred_r

        next_date = find_next_match_date(schedule_df)
        
        if next_date:
            print(f"\n次の予測対象日: {next_date}")
            predictions_data = generate_predictions_for_date(next_date, schedule_df, prediction_ratings)
            save_predictions(predictions_data, next_date)
        else:
            print("予測対象となる未実施の試合が schedule.csv に見つかりません。")
            empty_predictions = {"version": PREDICTION_VERSION, "J1": [], "J2": [], "J3": []}
            save_predictions(empty_predictions, datetime.now().date())
            
    print("--- 予測生成ツールを終了します ---")