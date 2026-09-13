import pandas as pd
import json
import os
from datetime import datetime

# --- 設定項目 ---
BASE_DIR = r'C:\Users\mura\Desktop\jleague-big-club'
DATA_DIR = os.path.join(BASE_DIR, 'data')
SCHEDULE_CSV_PATH = os.path.join(DATA_DIR, 'schedule.csv')
TEAM_RATINGS_JSON_PATH = os.path.join(DATA_DIR, 'team_ratings.json')
OUTPUT_TEXT_PATH = os.path.join(DATA_DIR, 'remaining_elo_analysis.txt')

def get_difficulty_label(rank_percentage):
    """順位のパーセンテージに応じて難易度ラベルを返す"""
    if rank_percentage <= 0.2:
        return "(最も厳しい)"
    elif rank_percentage <= 0.4:
        return "(厳しい)"
    elif rank_percentage <= 0.6:
        return "(やや厳しい)"
    elif rank_percentage <= 0.8:
        return "(やや楽)"
    else:
        return "(楽)"

def analyze_league(league_name, all_teams_in_league, schedule_df, team_ratings_flat):
    """リーグごとの残り対戦相手の平均Eloと難易度を計算する"""
    league_results = []
    
    current_year = str(datetime.now().year)

    print("\n" + "="*40)
    print(f" {league_name}リーグの内訳を計算中...")
    print("="*40)

    # ▼▼▼【デバッグコード追加】▼▼▼
    # 1. schedule.csvから今シーズンのリーグの未消化試合だけを抽出
    league_future_games = schedule_df[
        (schedule_df['年'] == current_year) &
        (schedule_df['リーグ'] == league_name) &
        (schedule_df['ホーム得点'].isna())
    ].copy()
    
    print(f"\n--- デバッグ情報 ({league_name}) ---")
    print(f"team_ratings.json に登録されているチーム数: {len(all_teams_in_league)}")
    print(f"schedule.csv 内の未消化試合数: {len(league_future_games)}")
    
    # 2. schedule.csv内のユニークなチーム名と、team_ratings.jsonのチーム名を比較
    schedule_teams = set(pd.concat([league_future_games['ホーム'], league_future_games['アウェイ']]).unique())
    ratings_teams = set(all_teams_in_league)

    if schedule_teams != ratings_teams:
        print("\n[警告] チームリストに不一致があります！")
        only_in_schedule = schedule_teams - ratings_teams
        only_in_ratings = ratings_teams - schedule_teams
        if only_in_schedule:
            print(f"  schedule.csvにしか存在しないチーム: {only_in_schedule}")
        if only_in_ratings:
            print(f"  team_ratings.jsonにしか存在しないチーム: {only_in_ratings}")
        print("  => チーム名の表記揺れ（特に前後の空白）や全角/半角の違いを確認してください。")
    else:
        print("\nチームリストは一致しています。問題ありません。")

    print("\n各チームの残り試合数をチェックします:")
    # ▲▲▲【デバッグコード完了】▲▲▲

    for team in all_teams_in_league:
        future_games_home = league_future_games[league_future_games['ホーム'] == team]
        future_games_away = league_future_games[league_future_games['アウェイ'] == team]

        opponent_elos = []
        opponent_details = []

        for opponent in future_games_home['アウェイ']:
            elo = team_ratings_flat.get(opponent, 1500)
            opponent_elos.append(elo)
            opponent_details.append(f"  - vs {opponent} (A): {elo:.1f}")

        for opponent in future_games_away['ホーム']:
            elo = team_ratings_flat.get(opponent, 1500)
            opponent_elos.append(elo)
            opponent_details.append(f"  - vs {opponent} (H): {elo:.1f}")

        if not opponent_elos:
            average_elo = 0
        else:
            average_elo = sum(opponent_elos) / len(opponent_elos)
            
        league_results.append({'チーム名': team, '平均相手Elo': average_elo})

        print(f"\n[ {team} ] - 残り {len(opponent_details)} 試合")
        if opponent_details:
            for detail in opponent_details:
                print(detail)
            print(f"  --------------------")
            print(f"  >> 平均相手Elo: {average_elo:.1f}")
        else:
            print("  - 全日程終了")

    if not league_results:
        return ""

    results_df = pd.DataFrame(league_results)
    results_df = results_df.sort_values(by='平均相手Elo', ascending=False).reset_index(drop=True)
    
    num_teams = len(results_df)
    results_df['難易度'] = results_df.index.map(lambda x: get_difficulty_label(x / (num_teams - 1) if num_teams > 1 else 0.5))

    output_lines = [f"--- {league_name} ---"]
    for _, row in results_df.iterrows():
        if row['平均相手Elo'] == 0:
            output_lines.append(f"{row['チーム名']}: 全日程終了")
        else:
            output_lines.append(f"{row['チーム名']}: {row['平均相手Elo']:.1f} {row['難易度']}")
            
    return "\n".join(output_lines) + "\n"


def main():
    print("残り対戦相手の平均Eloレーティング計算ツールを開始します。")

    try:
        schedule_df = pd.read_csv(SCHEDULE_CSV_PATH, encoding='utf-8', dtype={'年': str})
        with open(TEAM_RATINGS_JSON_PATH, 'r', encoding='utf-8') as f:
            team_ratings = json.load(f)
    except FileNotFoundError as e:
        print(f"エラー: データファイルが見つかりません。パスを確認してください。 - {e}")
        return

    team_ratings_flat = {}
    for league_data in team_ratings.values():
        team_ratings_flat.update(league_data)
        
    schedule_df['ホーム'] = schedule_df['ホーム'].astype(str).str.strip()
    schedule_df['アウェイ'] = schedule_df['アウェイ'].astype(str).str.strip()

    output_content = ""
    
    for league in ['J1', 'J2', 'J3']:
        if league in team_ratings:
            all_teams_in_league = sorted(list(team_ratings[league].keys()))
            league_analysis_text = analyze_league(league, all_teams_in_league, schedule_df, team_ratings_flat)
            output_content += league_analysis_text + "\n"

    with open(OUTPUT_TEXT_PATH, 'w', encoding='utf-8') as f:
        f.write(output_content)

    print(f"\n計算が完了しました。結果を {OUTPUT_TEXT_PATH} に保存しました。")
    print("このファイルの内容をコピーして、記事の表に貼り付けてください。")

if __name__ == '__main__':
    main()