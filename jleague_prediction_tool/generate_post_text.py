import json
import os
import shutil
from datetime import datetime
import pandas as pd

# --- 設定項目 ---
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
DATA_FOLDER = os.path.join(WEB_ROOT_PATH, 'data')

PREDICTION_JSON_PATH = os.path.join(DATA_FOLDER, 'prediction_probabilities.json')
PREV_PREDICTION_JSON_PATH = os.path.join(DATA_FOLDER, 'prediction_probabilities_prev.json')
SCHEDULE_CSV_PATH = os.path.join(DATA_FOLDER, 'schedule.csv')
OUTPUT_FOLDER = os.path.join(DATA_FOLDER, 'generated_texts')
LATEST_OUTPUT_PATH = os.path.join(DATA_FOLDER, 'latest_post_text.json')

# --- データ処理関数 ---

def get_latest_match_result(team_name, schedule_df):
    """ 指定されたチームの最新の試合結果を文字列で返す """
    try:
        # チーム名が含まれる試合を抽出（チーム名は文字列であることを保証）
        team_games = schedule_df[
            (schedule_df['ホーム'].astype(str) == str(team_name)) | (schedule_df['アウェイ'].astype(str) == str(team_name))
        ].copy()
        
        finished_games = team_games.dropna(subset=['ホーム得点', 'アウェイ得点'])
        if finished_games.empty:
            return ""

        finished_games['日付_obj'] = pd.to_datetime(
            finished_games['年'].astype(str) + '/' + finished_games['日付'].astype(str),
            format='%Y/%m/%d',
            errors='coerce'
        )
        latest_game = finished_games.sort_values('日付_obj', ascending=False).iloc[0]

        home_team, away_team = latest_game['ホーム'], latest_game['アウェイ']
        home_score, away_score = int(latest_game['ホーム得点']), int(latest_game['アウェイ得点'])

        if str(team_name) == str(home_team):
            if home_score > away_score: return f"（{away_team}に{home_score}-{away_score}で勝利）"
            elif home_score < away_score: return f"（{away_team}に{home_score}-{away_score}で敗戦）"
            else: return f"（{away_team}と{home_score}-{away_score}で引分）"
        else:
            if away_score > home_score: return f"（{home_team}に{away_score}-{home_score}で勝利）"
            elif away_score < home_score: return f"（{home_team}に{away_score}-{home_score}で敗戦）"
            else: return f"（{home_team}と{away_score}-{home_score}で引分）"
            
    except Exception:
        return ""

# ▼▼▼【修正】データ構造の変更に対応 ▼▼▼
def get_team_data_with_diff(current_data, prev_data, league):
    """ 前回データと比較し、差分を含んだチームリストを返す """
    teams_with_diff = []
    
    current_league_data = current_data.get(league, {})
    prev_league_data = prev_data.get(league, {}) if prev_data else {}

    for team, current_probs in current_league_data.items():
        prev_probs = prev_league_data.get(team, {})
        team_data = {'name': team, **current_probs}

        if prev_data: # 前回データがある場合のみ差分を計算
            for key in ['champion', 'acl', 'promotion', 'relegation', 'safe']:
                if key in current_probs and key in prev_probs:
                    # ネストされた構造から'prob'キーの値を取得して比較
                    current_prob_val = current_probs[key]['prob'] if isinstance(current_probs[key], dict) else current_probs[key]
                    prev_prob_val = prev_probs[key]['prob'] if isinstance(prev_probs[key], dict) else prev_probs[key]
                    team_data[f'{key}_diff'] = current_prob_val - prev_prob_val
        
        teams_with_diff.append(team_data)
    return teams_with_diff

# --- AI投稿文生成ロジック（大幅強化） ---

# ▼▼▼【修正】データ構造の変更に対応 ▼▼▼
def generate_j1_text(teams, schedule_df):
    """ J1リーグの投稿文を生成 """
    title = f"【J1残留争いAI予想 {datetime.now().strftime('%m/%d')}時点】"
    
    # ソートキーを 'relegation' の中の 'prob' に変更
    relegation_sorted = sorted([t for t in teams if 'relegation' in t and isinstance(t['relegation'], dict)], key=lambda x: x['relegation']['prob'], reverse=True)
    
    if len(relegation_sorted) < 2:
        return f"{title}\n今週はJ1の試合がなかったため、AI予想の大きな変動はありませんでした。\n#Jリーグ #J1 #残留争い"

    main_team = relegation_sorted[0]
    main_prob = main_team['relegation']['prob'] * 100 # .prob を追加
    main_diff = main_team.get('relegation_diff', 0) * 100
    main_result = get_latest_match_result(main_team['name'], schedule_df)
    main_comment = f"降格確率首位の{main_team['name']}{main_result}は{main_prob:.1f}%まで上昇。崖っぷちの状況が続く。"

    second_team = relegation_sorted[1]
    second_prob = second_team['relegation']['prob'] * 100 # .prob を追加
    second_result = get_latest_match_result(second_team['name'], schedule_df)
    second_comment = f"続く{second_team['name']}{second_result}も{second_prob:.1f}%と危険水域。熾烈なサバイバルレースに。"
    
    hashtags = "#Jリーグ #J1 #残留争い"
    return f"{title}\n{main_comment}\n{second_comment}\n{hashtags}"

# ▼▼▼【修正】データ構造の変更に対応 ▼▼▼
def generate_j2_text(teams, schedule_df):
    """ J2リーグの投稿文を生成 """
    title = f"【J1昇格争いAI予想 {datetime.now().strftime('%m/%d')}時点】"
    
    # ソートキーを 'promotion' の中の 'prob' に変更
    promo_sorted = sorted([t for t in teams if 'promotion' in t and isinstance(t['promotion'], dict)], key=lambda x: x['promotion']['prob'], reverse=True)

    if not promo_sorted:
        return f"{title}\n今週はJ2の試合がなかったため、AI予想の大きな変動はありませんでした。\n#Jリーグ #J2 #J1昇格"

    main_team = max(promo_sorted[:5], key=lambda x: abs(x.get('promotion_diff', 0)), default=promo_sorted[0])
    main_prob = main_team['promotion']['prob'] * 100 # .prob を追加
    main_diff = main_team.get('promotion_diff', 0) * 100
    main_result = get_latest_match_result(main_team['name'], schedule_df)
    change_text = "上昇" if main_diff > 0 else "下降"
    main_comment = f"大混戦のJ2！特に{main_team['name']}{main_result}が今節の大きな変動要因。昇格確率は{main_prob:.1f}%({main_diff:+.1f}%)に{change_text}！"

    top_team = promo_sorted[0]
    top_prob = top_team['promotion']['prob'] * 100 # .prob を追加
    top_comment = f"現在首位は{top_team['name']}で{top_prob:.1f}%。PO圏内も含め最終節まで目が離せない展開に。"
    
    hashtags = "#Jリーグ #J2 #J1昇格"
    return f"{title}\n{main_comment}\n{top_comment}\n{hashtags}"

# ▼▼▼【修正】データ構造の変更に対応 ▼▼▼
def generate_j3_text(teams, schedule_df):
    """ J3リーグの投稿文を生成 """
    title = f"【J2昇格争いAI予想 {datetime.now().strftime('%m/%d')}時点】"

    # ソートキーを 'promotion' の中の 'prob' に変更
    promo_sorted = sorted([t for t in teams if 'promotion' in t and isinstance(t['promotion'], dict)], key=lambda x: x['promotion']['prob'], reverse=True)

    if len(promo_sorted) < 2:
        return f"{title}\n今週はJ3の試合が少なかったため、定形のAI予想は生成されませんでした。\n#Jリーグ #J3 #J2昇格"

    top_team = promo_sorted[0]
    top_prob = top_team['promotion']['prob'] * 100 # .prob を追加
    top_result = get_latest_match_result(top_team['name'], schedule_df)
    top_comment = f"昇格争いは{top_team['name']}{top_result}が{top_prob:.1f}%で一歩リードか。"

    second_team = promo_sorted[1]
    second_prob = second_team['promotion']['prob'] * 100 # .prob を追加
    second_result = get_latest_match_result(second_team['name'], schedule_df)
    second_comment = f"追う2番手{second_team['name']}{second_result}は{second_prob:.1f}%。直接対決の結果が運命を分けそうだ。"
    
    hashtags = "#Jリーグ #J3 #J2昇格"
    return f"{title}\n{top_comment}\n{second_comment}\n{hashtags}"

# --- メイン実行部 ---
def main():
    print("--- SNS投稿文の自動生成を開始します ---")
    
    try:
        schedule_df = pd.read_csv(SCHEDULE_CSV_PATH, encoding='utf-8-sig', dtype={'年': str}) # 年を文字列として読み込み
        with open(PREDICTION_JSON_PATH, 'r', encoding='utf-8') as f:
            current_data = json.load(f)
        
        prev_data = None
        if os.path.exists(PREV_PREDICTION_JSON_PATH):
            with open(PREV_PREDICTION_JSON_PATH, 'r', encoding='utf-8') as f:
                prev_data = json.load(f)
        else:
            print("警告: 前回データが見つからないため、確率の変動は計算されません。")
            
    except Exception as e:
        print(f"エラー: データ読み込み中にエラーが発生しました。 - {e}")
        return

    j1_teams = get_team_data_with_diff(current_data, prev_data, 'J1')
    j2_teams = get_team_data_with_diff(current_data, prev_data, 'J2')
    j3_teams = get_team_data_with_diff(current_data, prev_data, 'J3')

    post_texts = {
        "J1": generate_j1_text(j1_teams, schedule_df),
        "J2": generate_j2_text(j2_teams, schedule_df),
        "J3": generate_j3_text(j3_teams, schedule_df)
    }
    
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    archive_path = os.path.join(OUTPUT_FOLDER, f'post_texts_{timestamp}.json')
    
    try:
        with open(archive_path, 'w', encoding='utf-8') as f:
            json.dump(post_texts, f, indent=2, ensure_ascii=False)
        print(f"生成した投稿文を '{archive_path}' に保存しました。")
        shutil.copy(archive_path, LATEST_OUTPUT_PATH)
        print(f"最新の投稿文を '{LATEST_OUTPUT_PATH}' に保存しました。")
        shutil.copy(PREDICTION_JSON_PATH, PREV_PREDICTION_JSON_PATH)
        print(f"今回の予測データを次回比較用に '{PREV_PREDICTION_JSON_PATH}' として保存しました。")
    except Exception as e:
        print(f"エラー: ファイルの保存中にエラーが発生しました。 - {e}")

    print("--- SNS投稿文の自動生成が完了しました ---")

if __name__ == "__main__":
    main()