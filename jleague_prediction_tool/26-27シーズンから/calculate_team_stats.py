import csv
from pathlib import Path
from collections import defaultdict

# --- 設定 ---
CURRENT_SEASON = 2026
PREVIOUS_SEASON = 2025

# 切り替えの基準となる試合数（各チーム平均◯試合終わったら新シーズンデータに切り替える）
# ユーザーの要望により、1節からでも当該シーズンのデータのみで算出するため「0」に変更
SWITCH_MATCH_COUNT = 0 

SCRIPT_DIR = Path(__file__).parent
SCHEDULE_CSV_PATH = SCRIPT_DIR.parent.parent / 'data' / 'schedule.csv'
OUTPUT_CSV_PATH = SCRIPT_DIR / 'team_stats.csv'

def main():
    print(f"--- チーム統計（攻撃力・守備力）計算ツール ---")
    
    # データを格納する辞書
    teams_current = defaultdict(lambda: {'matches': 0, 'goals_scored': 0, 'goals_conceded': 0, 'league': ''})
    teams_previous = defaultdict(lambda: {'matches': 0, 'goals_scored': 0, 'goals_conceded': 0, 'league': ''})

    # schedule.csv の読み込み
    try:
        with open(SCHEDULE_CSV_PATH, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    year = int(row['年'])
                    home_score = row['ホーム得点']
                    away_score = row['アウェイ得点']
                    
                    # スコアが空でない（試合終了済み）の場合のみ計算
                    if home_score and away_score:
                        home_score = float(home_score)
                        away_score = float(away_score)
                        home_team = row['ホーム']
                        away_team = row['アウェイ']
                        league = row['リーグ']

                        if year == CURRENT_SEASON:
                            target_dict = teams_current
                        elif year == PREVIOUS_SEASON:
                            target_dict = teams_previous
                        else:
                            continue

                        # ホームチームの集計
                        target_dict[home_team]['matches'] += 1
                        target_dict[home_team]['goals_scored'] += home_score
                        target_dict[home_team]['goals_conceded'] += away_score
                        target_dict[home_team]['league'] = league

                        # アウェイチームの集計
                        target_dict[away_team]['matches'] += 1
                        target_dict[away_team]['goals_scored'] += away_score
                        target_dict[away_team]['goals_conceded'] += home_score
                        target_dict[away_team]['league'] = league

                except (ValueError, KeyError):
                    continue
    except FileNotFoundError:
        print(f"エラー: {SCHEDULE_CSV_PATH} が見つかりません。")
        return

    # 今シーズンの平均消化試合数をチェック
    total_matches_current = sum(t['matches'] for t in teams_current.values())
    total_teams_current = len(teams_current) if teams_current else 1
    avg_matches_current = total_matches_current / total_teams_current

    print(f"現在の {CURRENT_SEASON} シーズン平均消化試合数: {avg_matches_current:.1f} 試合")

    # 使うデータを判定
    if avg_matches_current >= SWITCH_MATCH_COUNT:
        print(f"→ 規定試合数（{SWITCH_MATCH_COUNT}試合）に達しているため、【{CURRENT_SEASON}シーズン】のデータを使用します。")
        target_teams = teams_current
    else:
        print(f"→ まだ規定試合数に達していないため、【{PREVIOUS_SEASON}シーズン】のデータをベースに使用します。")
        target_teams = teams_previous

    # 新しく昇格したチームなど、前年データがないチームは、同リーグの平均値を代入するなどの処理が必要ですが、
    # ここではシンプルに今シーズンのデータがあればそれを使い、なければ基本値(1.0)にします。
    
    # 最終的な出力データの計算
    output_rows = []
    
    # 現在のシーズン（2026）に存在する全チームのリストを取得
    all_teams_this_year = set()
    with open(SCHEDULE_CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('年') == str(CURRENT_SEASON):
                all_teams_this_year.add((row['ホーム'], row['リーグ']))

    for team_name, league in all_teams_this_year:
        stats = target_teams.get(team_name)
        
        if stats and stats['matches'] > 0:
            attack_power = stats['goals_scored'] / stats['matches']
            defense_power = stats['goals_conceded'] / stats['matches']
        else:
            # 前年のデータが存在しない昇格チームなどは、仮の平均値(1.3)を設定
            attack_power = 1.3
            defense_power = 1.3
            
        output_rows.append({
            'team_name': team_name,
            'league': league,
            'attack_power': round(attack_power, 3),
            'defense_power': round(defense_power, 3)
        })

    # CSV出力
    with open(OUTPUT_CSV_PATH, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['team_name', 'league', 'attack_power', 'defense_power'])
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"[完了] 統計データを {OUTPUT_CSV_PATH} に出力しました。（全{len(output_rows)}チーム）")

if __name__ == '__main__':
    main()
