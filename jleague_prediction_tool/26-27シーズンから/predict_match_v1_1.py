import re
import csv
import math
from pathlib import Path

# --- 設定 ---

# ★★★【設定項目】予測の対象とするシーズンを指定 ★★★
TARGET_YEAR = 2026
# 的中率の集計を開始する節（これ未満は参考値）。winner.js と合わせること。
ACCURACY_START_SECTION = 10

# ★★★【設定項目】ホームチームの有利さを調整する係数 ★★★
# 1.0より大きい値にするとホームが有利に、小さい値にすると不利になります。
HOME_ADVANTAGE_FACTOR = 1.1

# このスクリプトの場所を基準に必要なファイルを指定
SCRIPT_DIR = Path(__file__).parent
SCHEDULE_CSV_PATH = SCRIPT_DIR.parent.parent / 'data' / 'schedule.csv'
STATS_CSV_PATH = SCRIPT_DIR / 'team_stats.csv'

# 予測の際に考慮する最大ゴール数
MAX_GOALS = 5

# --- 確率計算関数 ---

def poisson_probability(actual, mean):
    """ポアソン分布に基づき、特定の事象（ゴール数）が起こる確率を計算する。"""
    if mean <= 0:
        return 1.0 if actual == 0 else 0.0
    try:
        return (mean**actual * math.exp(-mean)) / math.factorial(actual)
    except (ValueError, OverflowError):
        # mean や actual が大きすぎる場合にエラーを回避
        return 0.0

# --- メイン処理 ---

def main():
    """チームスタッツと試合スケジュールから、未対戦の試合結果を予測する。"""
    print(f"--- 試合予測プログラム v1.1 (対象シーズン: {TARGET_YEAR}) ---")
    
    predictions = [] # ★ ここで初期化

    # 1. チームスタッツデータを読み込む
    try:
        with open(STATS_CSV_PATH, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            team_stats = {
                row['team_name']: {
                    'league': row['league'],
                    'attack_power': float(row['attack_power']),
                    'defense_power': float(row['defense_power'])
                } for row in reader
            }
        print(f"[完了] {len(team_stats)}チームの統計データを読み込みました。")
    except FileNotFoundError:
        print(f"エラー: チーム統計ファイルが見つかりません: {STATS_CSV_PATH}")
        print("先に `calculate_team_stats.py` を実行してください。")
        return
    except Exception as e:
        print(f"エラー: チーム統計ファイルの読み込み中に問題が発生しました - {e}")
        return

    # 2. リーグ全体の平均得点を計算
    league_avg_goals = sum(stats['attack_power'] for stats in team_stats.values()) / len(team_stats) if team_stats else 1.0
    print(f"[完了] リーグ全体の平均得点: {league_avg_goals:.3f}")

    print("\n--- 今後の試合予測 ---")
    
    import datetime
    predictions = {
        "version": "ver.1.1",
        "J1": [], "J2": [], "J3": []
    }
    
    # リーグごとに処理する上限（1節分程度）
    match_limit_per_league = 15
    matches_processed = {"J1": 0, "J2": 0, "J3": 0}

    # 2.5 参考値（第9節まで）かどうかは、予測対象の節で判定する。
    #      消化試合数で判定すると、第10節の予測を作る時点では
    #      まだ第9節までしか終わっておらず、第10節が参考値扱いになってしまうため。
    earliest_section = None

    # 3. 試合スケジュールを読み込み、未対戦の試合を予測
    #    ※ 中止・延期などで「日付が過去なのに結果が未入力」の試合が
    #      CSVの先頭に残っているため、日付で絞り込んでから日付順に並べる。
    #      （絞り込まないと『今後の試合予測』に第1節などの過去の試合が並んでしまう）
    today = datetime.date.today()

    # アーカイブのファイル名に使う「対象試合日」（予測対象のうち最も早い試合日）
    earliest_match_date = None

    def parse_section_number(setsu_str):
        """'第8節' のような文字列から節番号を取り出す"""
        matched = re.search(r'(\d+)', setsu_str or '')
        return int(matched.group(1)) if matched else None

    def parse_match_date(date_str):
        try:
            return datetime.datetime.strptime(f"20{date_str.strip()}", "%Y/%m/%d").date()
        except (ValueError, AttributeError):
            return None

    try:
        with open(SCHEDULE_CSV_PATH, 'r', encoding='utf-8-sig') as f:
            upcoming_rows = []
            for row in csv.DictReader(f):
                try:
                    match_year = int(row.get('年'))
                except (ValueError, TypeError):
                    continue
                if match_year != TARGET_YEAR or row.get('ホーム得点'):
                    continue
                if row.get('リーグ') not in matches_processed:
                    continue
                match_date = parse_match_date(row.get('日付'))
                if match_date is None or match_date < today:
                    continue
                upcoming_rows.append((match_date, row))

            upcoming_rows.sort(key=lambda item: item[0])

            for match_date, row in upcoming_rows:
                league = row.get('リーグ')

                if matches_processed[league] < match_limit_per_league:
                    home_team = row.get('ホーム')
                    away_team = row.get('アウェイ')
                    setsu = row.get('節')
                    date_str = row.get('日付')

                    home_stats = team_stats.get(home_team)
                    away_stats = team_stats.get(away_team)

                    if not home_stats or not away_stats:
                        print(f"\n警告: {home_team} vs {away_team} の統計データが見つからないため、スキップします。")
                        continue

                    # 4. ホームとアウェイそれぞれのゴール期待値を計算（ホームアドバンテージを考慮）
                    lambda_home = (home_stats['attack_power'] * away_stats['defense_power'] / league_avg_goals) * HOME_ADVANTAGE_FACTOR
                    lambda_away = (away_stats['attack_power'] * home_stats['defense_power'] / league_avg_goals) / HOME_ADVANTAGE_FACTOR
                    
                    # 5. スコアごとの確率を計算し、リスト化する
                    score_probs = []
                    for i in range(MAX_GOALS + 1):
                        for j in range(MAX_GOALS + 1):
                            prob = poisson_probability(i, lambda_home) * poisson_probability(j, lambda_away)
                            score_probs.append({ 'score': f"{i}-{j}", 'prob': prob })
                    
                    # 確率が高い順にソート
                    score_probs.sort(key=lambda x: x['prob'], reverse=True)

                    if not score_probs:
                        continue

                    honmei = score_probs[0]
                    taiko = score_probs[1] if len(score_probs) > 1 else {'score': '-', 'prob': 0}
                    
                    ooana = {'score': '-', 'prob': 0}
                    for sp in score_probs[2:]:
                        if 0.01 <= sp['prob'] <= 0.05:
                            ooana = sp
                            break
                    if ooana['score'] == '-' and len(score_probs) > 2:
                        ooana = score_probs[2]

                    def get_odds(prob):
                        if prob <= 0: return "N/A"
                        odds = 1 / prob
                        return f"{min(odds, 99.9):.1f}倍"

                    kickoff_str = f"{date_str} 19:00 ({setsu})"

                    match_prediction = {
                        "kickoff": kickoff_str,
                        "home": home_team,
                        "away": away_team,
                        "predictions": [
                            {"type": "本命", "score": honmei['score'], "odds": get_odds(honmei['prob']), "class": "favorite"},
                            {"type": "対抗", "score": taiko['score'], "odds": get_odds(taiko['prob']), "class": "contender"},
                            {"type": "大穴", "score": ooana['score'], "odds": get_odds(ooana['prob']), "class": "longshot"}
                        ]
                    }
                    predictions[league].append(match_prediction)
                    matches_processed[league] += 1
                    if earliest_match_date is None or match_date < earliest_match_date:
                        earliest_match_date = match_date
                    section_no = parse_section_number(setsu)
                    if section_no is not None and (earliest_section is None or section_no < earliest_section):
                        earliest_section = section_no

                    print(f"  > [{league} {setsu}] {home_team} vs {away_team} の予測を生成しました。")

    except FileNotFoundError:
        print(f"エラー: スケジュールファイルが見つかりません: {SCHEDULE_CSV_PATH}")
    except Exception as e:
        print(f"エラー: スケジュールファイルの処理中に問題が発生しました - {e}")

    # 第9節までは参考値。予測ページのお知らせバナーの表示に使う。
    predictions["is_reference"] = (
        earliest_section is not None and earliest_section < ACCURACY_START_SECTION
    )

    # --- JSONへの保存とアーカイブ化 ---
    import json
    import os
    import shutil
    
    data_dir = SCRIPT_DIR.parent.parent / 'data'
    archive_base_dir = data_dir / 'archive' / 'predictions-archive' # 以前のディレクトリ構成に準拠
    
    # 互換性のため親フォルダ直下の prediction-archive も更新する
    root_archive_dir = SCRIPT_DIR.parent.parent / 'predictions-archive'
    version_dir = root_archive_dir / 'ver.1.1'
    os.makedirs(version_dir, exist_ok=True)
    
    # アーカイブ名は対象試合日を使う（ver.1 と同じ規則）。
    # 生成日で命名すると、同じ節を週に何度も生成したときに
    # 中身が同じファイルが日付違いで増え、的中率の集計で
    # 同一試合を二重カウントしてしまうため。
    if earliest_match_date is not None:
        target_date = earliest_match_date.strftime('%Y-%m-%d')
    else:
        target_date = datetime.datetime.now().strftime('%Y-%m-%d')
    
    # 1. 最新データの保存
    output_json_path = data_dir / 'winner-predictions.json'
    try:
        os.makedirs(data_dir, exist_ok=True)
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(predictions, f, indent=2, ensure_ascii=False)
        print(f"\n[完了] 最新の予測データを '{output_json_path}' に保存しました。")
    except Exception as e:
        print(f"エラー: JSONの保存に失敗しました - {e}")

    # 2. アーカイブの保存
    #    参考値期間（第9節まで）でもアーカイブする。
    #    結果検証ページは predictions-archive のみを参照するため、
    #    保存しないと今季の予測が結果検証ページに一切出てこない。
    #    第9節までの試合は winner.js 側で的中率の集計から除外される。
    archive_filename = f"winner-predictions_{target_date}.json"
    archive_path = version_dir / archive_filename
    try:
        with open(archive_path, 'w', encoding='utf-8') as f:
            json.dump(predictions, f, indent=2, ensure_ascii=False)
        note = "（参考値期間のため的中率の集計対象外）" if predictions.get("is_reference") else ""
        print(f"[完了] アーカイブを '{archive_path}' に保存しました。{note}")
    except Exception as e:
        print(f"エラー: アーカイブの保存に失敗しました: {e}")

    # 3. マニフェストの更新
    try:
        all_archive_files = []
        for version_folder in os.listdir(root_archive_dir):
            version_path = os.path.join(root_archive_dir, version_folder)
            if os.path.isdir(version_path):
                files = [f"{version_folder}/{f}" for f in os.listdir(version_path) if f.endswith('.json') and f != 'archive-manifest.json']
                all_archive_files.extend(files)

        all_archive_files.sort(key=lambda name: os.path.basename(name), reverse=True)
        manifest_path = root_archive_dir / 'archive-manifest.json'
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(all_archive_files, f, indent=2, ensure_ascii=False)
        print(f"[完了] アーカイブのマニフェスト '{manifest_path}' を更新しました。")
    except Exception as e:
        print(f"マニフェストファイルの更新中にエラーが発生しました: {e}")

if __name__ == '__main__':
    main()