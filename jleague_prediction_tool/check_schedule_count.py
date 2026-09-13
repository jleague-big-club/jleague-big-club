import pandas as pd
import os

# --- 設定項目 ---
BASE_DIR = r'C:\Users\mura\Desktop\jleague-big-club'
DATA_DIR = os.path.join(BASE_DIR, 'data')
SCHEDULE_CSV_PATH = os.path.join(DATA_DIR, 'schedule.csv')
TARGET_YEAR = '2025'

def check_league_games(league_name, expected_teams, expected_home_games, schedule_df):
    """指定されたリーグの試合数をチェックし、不足しているチームと対戦相手を報告する関数"""
    
    print("\n" + "="*40)
    print(f" {league_name}リーグの試合数をチェック中...")
    print("="*40)
    
    # 対象リーグ・年のスケジュールを抽出
    league_schedule = schedule_df[
        (schedule_df['リーグ'] == league_name) & 
        (schedule_df['年'] == TARGET_YEAR)
    ].copy()

    # チーム名の前後の空白を除去
    league_schedule['ホーム'] = league_schedule['ホーム'].astype(str).str.strip()
    league_schedule['アウェイ'] = league_schedule['アウェイ'].astype(str).str.strip()
    
    total_games = len(league_schedule)
    expected_total_games = expected_teams * (expected_teams - 1)
    print(f"{TARGET_YEAR}年 {league_name}リーグの総試合数: {total_games}試合 (本来は{expected_total_games}試合のはずです)")
    
    if total_games == expected_total_games:
        print(f"{league_name}は総試合数に問題ありません。")
        return True

    # ランクファイルからチームリストを取得
    try:
        rank_df = pd.read_csv(os.path.join(DATA_DIR, f'{league_name.lower()}rank.csv'), encoding='utf-8')
        all_teams_in_league = set(rank_df['チーム名'].astype(str).str.strip().unique())
    except FileNotFoundError:
        print(f"エラー: {league_name.lower()}rank.csv が見つかりません。このリーグのチェックをスキップします。")
        return False

    # 各チームのホームゲーム数をカウント
    home_game_counts = league_schedule['ホーム'].value_counts()
    
    any_problem_found = False
    print("\n各チームのホームゲーム数:")
    for team in sorted(list(all_teams_in_league)):
        count = home_game_counts.get(team, 0)
        if count != expected_home_games:
            print(f"- {team.ljust(20)}: {count}試合  (NG - {expected_home_games - count}試合不足しています)")
            any_problem_found = True
        else:
            print(f"- {team.ljust(20)}: {count}試合  (OK)")
            
    if not any_problem_found:
        print("\n[結論] 各チームのホームゲーム数は正常です。")
        print("       総試合数が異なるのは、アウェイ側のデータ重複や他の原因が考えられます。")
        return True
        
    print("\n--- 不足している対戦カードの特定 ---")
    for team in sorted(list(all_teams_in_league)):
        count = home_game_counts.get(team, 0)
        if count < expected_home_games:
            opponent_teams = all_teams_in_league - {team}
            
            played_opponents = set(league_schedule[league_schedule['ホーム'] == team]['アウェイ'].unique())
            missing_opponents = opponent_teams - played_opponents
            
            if missing_opponents:
                print(f"\n[結論] {team} は、ホームで以下のチームとまだ対戦していません:")
                for opponent in sorted(list(missing_opponents)):
                    print(f"  - {opponent}")
    
    print("\n公式サイトなどで正しい試合日程を確認し、不足している試合を schedule.csv に追加してください。")
    print("例: 2025,J1,第XX節,25/XX/XX,不足チーム名,,,不足対戦相手名")
    return False

def main():
    print(f"--- {TARGET_YEAR}年 Jリーグ全カテゴリ 試合数チェックツール ---")
    
    try:
        schedule_df = pd.read_csv(SCHEDULE_CSV_PATH, encoding='utf-8', dtype={'年': str})
        print("スケジュールファイルを正常に読み込みました。")
    except FileNotFoundError as e:
        print(f"エラー: {SCHEDULE_CSV_PATH} が見つかりません。")
        return

    # J1, J2, J3のリーグ情報
    league_info = {
        'J1': {'teams': 20, 'home_games': 19},
        'J2': {'teams': 20, 'home_games': 19},
        'J3': {'teams': 20, 'home_games': 19}
    }
    
    all_ok = True
    for league, info in league_info.items():
        if not check_league_games(league, info['teams'], info['home_games'], schedule_df):
            all_ok = False
            
    print("\n" + "="*40)
    if all_ok:
        print("全リーグの試合数チェックが完了し、問題は見つかりませんでした。")
    else:
        print("試合数が不足しているリーグが見つかりました。上記詳細を確認してください。")
    print("="*40)


if __name__ == '__main__':
    main()