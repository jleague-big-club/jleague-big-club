# --- START OF FILE create_prediction.py (修正版・アーカイブ機能付き) ---

import pandas as pd
import json
import math
import random
import os
import shutil
from datetime import datetime

# --- 設定項目 ---
BASE_DIR = r'C:\Users\mura\Desktop\その他\webサイト\jleague-big-club'
DATA_DIR = os.path.join(BASE_DIR, 'data')
ARCHIVE_DIR = os.path.join(DATA_DIR, 'archive')
ALL_LEAGUES = ['J1', 'J2', 'J3']

INITIAL_RATING = 1500
K_FACTOR = 24
SIMULATIONS = 10000
# 乱数の種を固定する。これをしないと、試合結果が1つも増えていなくても
# 実行のたびに確率が最大1pt程度ブレて、意味のない▲▼が出てしまう。
SIM_SEED = 20260101
# J1のACL圏（ACL Elite）の枠数
ACL_SLOTS = 5
HISTORY_FACTOR = 0
HOME_ADVANTAGE = 65
RANDOMNESS_FACTOR = 70
REGRESSION_WEIGHT = 0.15
BASE_DRAW_PROB = 0.35
DRAW_DECAY_FACTOR = 0.0003

# --- Eloレーティングの計算ロジック ---
def calculate_elo(rating_a, rating_b, score_a, score_b):
    expected_a = 1 / (1 + 10**((rating_b - rating_a) / 400))
    actual_a = 0.5
    if score_a > score_b: actual_a = 1.0
    elif score_a < score_b: actual_a = 0.0

    new_rating_a = rating_a + K_FACTOR * (actual_a - expected_a)
    new_rating_b = rating_b - K_FACTOR * (actual_a - expected_a)
    return new_rating_a, new_rating_b

def parse_match_dates(df):
    """schedule.csv の '日付' を日付型にして返す。

    今の表記（'26/8/7'）は年を含んでいるので、そのまま %y/%m/%d で読む。
    '年' 列はカレンダー年ではなくシーズン（2026 = 26-27シーズン = 26/8〜27/6）なので、
    年をまたぐシーズンでは日付の補完に使ってはいけない。

    ただし2025年以前の古い行は '4/5' のように年が入っておらず、
    当時は1シーズン＝1暦年だったため '年' 列で補える。その行だけ補完する。
    """
    dates = pd.to_datetime(df['日付'], format='%y/%m/%d', errors='coerce')
    no_year = dates.isna() & df['日付'].notna()
    if no_year.any():
        dates.loc[no_year] = pd.to_datetime(
            df.loc[no_year, '年'].astype(str) + '/' + df.loc[no_year, '日付'].astype(str),
            format='%Y/%m/%d', errors='coerce'
        )
    return dates


def detect_current_season(schedule_df):
    """今のシーズンラベルを schedule.csv から判定する。

    '年' 列はカレンダー年ではなくシーズン（2026 = 26-27シーズン = 26/8〜27/6）。
    「すでに開幕しているシーズンのうち最も新しいもの」を試合日から選ぶので、
    来シーズンの日程がCSVに入れば自動で切り替わる。
    """
    dates = parse_match_dates(schedule_df)
    starts = dates.groupby(schedule_df['年'].astype(str)).min().dropna()
    if starts.empty:
        raise ValueError('schedule.csv から試合日を読み取れませんでした。')
    today = pd.Timestamp.today().normalize()
    started = starts[starts <= today]
    return str(started.idxmax() if not started.empty else starts.idxmin())


# --- メイン処理 ---
def main(target_leagues=None):
    """target_leagues で指定したリーグだけ予測を更新する（省略時は全リーグ）。

    指定しなかったリーグは前回の値をそのまま残す。
    J2・J3は今日、J1は明日、のように節の終わりに合わせてリーグごとに回すため。
    """
    target_leagues = list(target_leagues or ALL_LEAGUES)
    print(f"更新するリーグ: {' / '.join(target_leagues)}")
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    print(f"アーカイブフォルダを確認しました: {ARCHIVE_DIR}")
    
    try:
        schedule_df = pd.read_csv(os.path.join(DATA_DIR, 'schedule.csv'), encoding='utf-8', dtype={'ホーム得点': 'Int64', 'アウェイ得点': 'Int64'})
        yearrank_df = pd.read_csv(os.path.join(DATA_DIR, 'yearrank.csv'), encoding='utf-8')
        all_teams_df = pd.read_csv(os.path.join(DATA_DIR, 'data.csv'), encoding='utf-8')
        j1_df = pd.read_csv(os.path.join(DATA_DIR, 'j1rank.csv'), encoding='utf-8')
        j2_df = pd.read_csv(os.path.join(DATA_DIR, 'j2rank.csv'), encoding='utf-8')
        j3_df = pd.read_csv(os.path.join(DATA_DIR, 'j3rank.csv'), encoding='utf-8')
    except FileNotFoundError as e:
        print(f"エラー: データファイルが見つかりません。パスを確認してください。 - {e}")
        return

    # ▼▼▼【修正箇所1】team_name_mappingを修正。半角→全角ではなく、表記揺れの修正のみにする▼▼▼
    team_name_mapping = {
        # 'Y.S.C.C.横浜' と 'Y．S．C．C．横浜' のような表記揺れを統一
        'Y.S.C.C.横浜': 'Y.S.C.C.横浜',
        'Y．S．C．C．横浜': 'Y.S.C.C.横浜',
        # '高知' を正式名称に統一
        '高知': '高知ユナイテッドSC',
        # 明らかな間違いを修正
        '柏柏': '柏レイソル',
        '滋賀': 'レイラック滋賀FC',
        'レイラック滋賀': 'レイラック滋賀FC',
    }
    # ▲▲▲【修正完了1】▲▲▲

    # ▼▼▼【修正箇所2】abbreviation_mapのキー(チーム正式名称)をすべて半角に修正▼▼▼
    abbreviation_map = {
        'ヴィッセル神戸': '神戸', '鹿島アントラーズ': '鹿島', 'サンフレッチェ広島': '広島', 'ガンバ大阪': 'G大阪', 'FC町田ゼルビア': '町田', 'セレッソ大阪': 'C大阪', '浦和レッズ': '浦和', '柏レイソル': '柏', '名古屋グランパス': '名古屋', '東京ヴェルディ': '東京V', '川崎フロンターレ': '川崎F', '横浜F・マリノス': '横浜FM', 'アビスパ福岡': '福岡', '京都サンガF.C.': '京都', 'FC東京': 'FC東京', '湘南ベルマーレ': '湘南', 'アルビレックス新潟': '新潟', 'ジュビロ磐田': '磐田', 'サガン鳥栖': '鳥栖', '北海道コンサドーレ札幌': '札幌',
        '清水エスパルス': '清水', '横浜FC': '横浜FC', 'V・ファーレン長崎': '長崎', 'ファジアーノ岡山': '岡山', 'ベガルタ仙台': '仙台', 'ジェフユナイテッド千葉': '千葉', 'いわきFC': 'いわき', '徳島ヴォルティス': '徳島', 'ヴァンフォーレ甲府': '甲府', 'モンテディオ山形': '山形', '愛媛FC': '愛媛', 'ブラウブリッツ秋田': '秋田', '大分トリニータ': '大分', 'レノファ山口FC': '山口', '鹿児島ユナイテッドFC': '鹿児島', '水戸ホーリーホック': '水戸', 'ロアッソ熊本': '熊本', '藤枝MYFC': '藤枝', '栃木SC': '栃木SC', 'ザスパ群馬': '群馬',
        'RB大宮アルディージャ': '大宮', 'FC今治': '今治', 'カターレ富山': '富山', 'FC大阪': 'FC大阪', 'ツエーゲン金沢': '金沢', '松本山雅FC': '松本', 'ヴァンラーレ八戸': '八戸', 'ギラヴァンツ北九州': '北九州', 'テゲバジャーロ宮崎': '宮崎', '福島ユナイテッドFC': '福島', 'SC相模原': '相模原', '奈良クラブ': '奈良', 'ガイナーレ鳥取': '鳥取', 'FC琉球': '琉球', 'AC長野パルセイロ': '長野', 'カマタマーレ讃岐': '讃岐', 'アスルクラロ沼津': '沼津', 'FC岐阜': '岐阜', 'Y.S.C.C.横浜': 'YS横浜', '栃木シティ': '栃木C', '高知ユナイテッドSC': '高知', 'レイラック滋賀FC': '滋賀'
    }
    # ▲▲▲【修正完了2】▲▲▲

    all_dfs = [schedule_df, yearrank_df, all_teams_df, j1_df, j2_df, j3_df]
    for df in all_dfs:
        df.replace(team_name_mapping, inplace=True)

    # ▼▼▼【修正箇所3】チーム名の表記を「略称」に統一する ▼▼▼
    # Jリーグ公式サイトのリニューアルにより、順位表(j1rank.csv等)のチーム名が
    # 正式名称から略称（例: 鹿島アントラーズ → 鹿島）に変わった。
    # schedule.csv は正式名称のままなので、統一しないと後段の
    # 「current_sim_standings に home_team / away_team が居るか」判定が全て失敗し、
    # 未消化試合が1試合もシミュレートされず、確率が 0% / 100% に張り付く。
    for df in all_dfs:
        df.replace(abbreviation_map, inplace=True)
    # ▲▲▲【修正完了3】▲▲▲

    all_names_series = pd.concat([
        all_teams_df['クラブ名'], schedule_df['ホーム'], schedule_df['アウェイ'],
        j1_df['チーム名'], j2_df['チーム名'], j3_df['チーム名']
    ])
    target_year_str = detect_current_season(schedule_df)
    print(f"対象シーズン: {target_year_str}（schedule.csv の試合日から判定）")
    all_teams = sorted([team for team in all_names_series.unique() if isinstance(team, str) and team])
    ratings = {team: INITIAL_RATING for team in all_teams}
    
    current_season_schedule = schedule_df[schedule_df['年'].astype(str) == target_year_str].copy()
    finished_games = current_season_schedule.dropna(subset=['ホーム得点', 'アウェイ得点']).copy()
    
    if not finished_games.empty:
        # 以前はここで '2026' + '/' + '26/8/7' という文字列を作っていたため
        # 全試合の日付変換が失敗し、Eloが日付順ではなくCSVの行順で計算されていた
        finished_games['日付_obj'] = parse_match_dates(finished_games)
        unparsed = finished_games['日付_obj'].isna().sum()
        if unparsed:
            print(f"警告: 日付を読めなかった試合が {unparsed} 件あります。並び順の先頭に置きます。")
        finished_games.sort_values('日付_obj', inplace=True, na_position='first')
        
        for _, row in finished_games.iterrows():
            home_team, away_team = row['ホーム'], row['アウェイ']
            if home_team in all_teams and away_team in all_teams:
                ratings[home_team], ratings[away_team] = calculate_elo(
                    ratings.get(home_team, INITIAL_RATING), ratings.get(away_team, INITIAL_RATING), row['ホーム得点'], row['アウェイ得点']
                )
    future_games = current_season_schedule[current_season_schedule['ホーム得点'].isna()]
    league_teams = {}
    final_rankings_tally = {}
    sim_standings = {}
    df_map = {'J1': j1_df, 'J2': j2_df, 'J3': j3_df}
    for league, df in df_map.items():
        try:
            teams_in_league = [team for team in df['チーム名'].unique() if isinstance(team, str)]
            
            # ▼ 開幕前対応: 順位表が空の場合、スケジュールからチーム一覧を取得
            if not teams_in_league:
                teams_list = schedule_df[schedule_df['リーグ'] == league]['ホーム'].tolist() + schedule_df[schedule_df['リーグ'] == league]['アウェイ'].tolist()
                teams_in_league = list(set([team for team in teams_list if isinstance(team, str)]))
                print(f"[{league}] 順位表が空のため、スケジュールから {len(teams_in_league)} チームを抽出しました。")
            
            league_teams[league] = teams_in_league
            final_rankings_tally[league] = {team: {'champion': 0, 'acl': 0, 'promotion': 0, 'relegation': 0, 'safe': 0} for team in teams_in_league}
            
            if df.empty:
                sim_standings[league] = {team: {'勝点': 0} for team in teams_in_league}
            else:
                sim_standings[league] = {row['チーム名']: {'勝点': int(row['勝点'])} for _, row in df.iterrows() if isinstance(row['チーム名'], str)}
        except (FileNotFoundError, KeyError) as e:
            print(f"警告: {league}のデータ処理中にエラーが発生しました。スキップします。 - {e}")
            continue

    random.seed(SIM_SEED)
    print(f"{SIMULATIONS}回のシミュレーションを開始します...")
    for i in range(SIMULATIONS):
        if (i + 1) % 1000 == 0:
            print(f"  ... {i + 1}/{SIMULATIONS}")

        sim_ratings = ratings.copy()
        
        if REGRESSION_WEIGHT > 0:
            for league, teams in league_teams.items():
                if not teams: continue
                league_ratings = [r for t, r in sim_ratings.items() if t in teams]
                if not league_ratings: continue
                avg_rating = sum(league_ratings) / len(league_ratings)
                for team in teams:
                    original_rating = sim_ratings.get(team, INITIAL_RATING)
                    sim_ratings[team] = (original_rating * (1 - REGRESSION_WEIGHT)) + (avg_rating * REGRESSION_WEIGHT)

        current_sim_standings = {lg: {tm: d.copy() for tm, d in data.items()} for lg, data in sim_standings.items()}

        for _, game in future_games.iterrows():
            league, home_team, away_team = game['リーグ'], game['ホーム'], game['アウェイ']
            if league not in current_sim_standings or home_team not in current_sim_standings[league] or away_team not in current_sim_standings[league]:
                continue
            
            home_random = random.uniform(-RANDOMNESS_FACTOR, RANDOMNESS_FACTOR)
            away_random = random.uniform(-RANDOMNESS_FACTOR, RANDOMNESS_FACTOR)
            home_rating = sim_ratings.get(home_team, INITIAL_RATING)
            away_rating = sim_ratings.get(away_team, INITIAL_RATING)

            home_power = home_rating + HOME_ADVANTAGE + home_random
            away_power = away_rating + away_random
            
            prob_home_win = 1 / (1 + 10**((away_power - home_power) / 400))
            rating_diff = abs(home_power - away_power)
            draw_prob = max(0, BASE_DRAW_PROB - (DRAW_DECAY_FACTOR * rating_diff))
            prob_home_win_adjusted = prob_home_win * (1 - draw_prob)
            
            rand_val = random.random()
            
            if rand_val < prob_home_win_adjusted: 
                current_sim_standings[league][home_team]['勝点'] += 3
                score_h, score_a = 1, 0
            elif rand_val < prob_home_win_adjusted + draw_prob:
                current_sim_standings[league][home_team]['勝点'] += 1
                current_sim_standings[league][away_team]['勝点'] += 1
                score_h, score_a = 0, 0
            else: 
                current_sim_standings[league][away_team]['勝点'] += 3
                score_h, score_a = 0, 1

            new_home_rating, new_away_rating = calculate_elo(home_rating, away_rating, score_h, score_a)
            sim_ratings[home_team] = new_home_rating
            sim_ratings[away_team] = new_away_rating
        
        for league in ['J1', 'J2', 'J3']:
            if league not in current_sim_standings: continue
            
            team_list_to_sort = list(current_sim_standings[league].items())
            random.shuffle(team_list_to_sort)
            sorted_teams = sorted(team_list_to_sort, key=lambda item: item[1]['勝点'], reverse=True)
            
            if not sorted_teams: continue
            
            promotion_teams = set()
            relegation_teams = set()

            if league == 'J1':
                relegation_teams = {t[0] for t in sorted_teams[-3:]}
                if sorted_teams: final_rankings_tally[league][sorted_teams[0][0]]['champion'] += 1
                # ACL圏 = 1〜5位（ACL Elite）。順位表の色分け（rankings.js）と合わせること
                for i in range(min(ACL_SLOTS, len(sorted_teams))): final_rankings_tally[league][sorted_teams[i][0]]['acl'] += 1
            elif league == 'J2':
                promotion_teams = {t[0] for t in sorted_teams[:2]}
                relegation_teams = {t[0] for t in sorted_teams[-3:]}
            elif league == 'J3':
                promotion_teams = {t[0] for t in sorted_teams[:2]}
                relegation_teams = {t[0] for t in sorted_teams[-1:]}  # 降格枠1つ
            
            for team_name, _ in sorted_teams:
                if team_name in final_rankings_tally[league]:
                    if team_name in promotion_teams: final_rankings_tally[league][team_name]['promotion'] += 1
                    elif team_name in relegation_teams: final_rankings_tally[league][team_name]['relegation'] += 1
                    else: final_rankings_tally[league][team_name]['safe'] += 1

    # --- 前回データの読み込み & アーカイブ処理 ---
    output_path = os.path.join(DATA_DIR, 'prediction_probabilities.json')
    prev_data = {}
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                prev_data = json.load(f)
            print("前回予測データを読み込みました。")
        except Exception as e:
            print(f"警告: 前回予測データの読み込みに失敗しました。前回比は出せません。 - {e}")
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            archive_filename = f'prediction_probabilities_{timestamp}.json'
            archive_path = os.path.join(ARCHIVE_DIR, archive_filename)
            shutil.copy2(output_path, archive_path)
            print(f"前回データをアーカイブしました: {archive_path}")
        except Exception as e:
            print(f"警告: 前回予測データのアーカイブに失敗しました。 - {e}")

    # --- 最終的な確率計算ロジック ---
    # 前回比は「そのリーグを前回回したとき」との比較。
    # 節の終わりはリーグを選んで回すことで人が決めるので、日付から推測はしない。
    final_probabilities_with_change = {}
    updated_at = dict(prev_data.get('updated_at', {}))
    prev_file_updated = None
    try:
        with open(os.path.join(DATA_DIR, 'update_dates.json'), 'r', encoding='utf-8') as f:
            prev_file_updated = json.load(f).get('prediction_probabilities.json')
    except Exception:
        pass
    now_iso = datetime.now().astimezone().isoformat(timespec='seconds')
    for league, teams_data in final_rankings_tally.items():
        if league not in target_leagues and league in prev_data:
            final_probabilities_with_change[league] = prev_data[league]
            # リーグ別の日時が無い古いデータは、前回のファイル全体の更新日時を引き継ぐ
            if league not in updated_at and prev_file_updated:
                updated_at[league] = prev_file_updated
            print(f"[{league}] 今回は更新しません（前回の値をそのまま残します）。")
            continue
        if not teams_data: continue
        prev_league = prev_data.get(league, {})
        final_probabilities_with_change[league] = {}
        for team_full, counts in teams_data.items():
            team_abbr = abbreviation_map.get(team_full, team_full)
            current_probs = {
                'champion': counts['champion'] / SIMULATIONS, 'acl': counts['acl'] / SIMULATIONS,
                'promotion': counts['promotion'] / SIMULATIONS, 'relegation': counts['relegation'] / SIMULATIONS,
                'safe': (counts['promotion'] + counts['safe']) / SIMULATIONS
            }
            final_probabilities_with_change[league][team_abbr] = {}
            for key, new_prob in current_probs.items():
                change, diff = 'flat', 0.0
                try:
                    old = prev_league.get(team_abbr, {}).get(key)
                    old_prob = old.get('prob') if isinstance(old, dict) else old
                    if old_prob is not None:
                        diff = round(new_prob - float(old_prob), 4)
                        if diff > 0: change = 'up'
                        elif diff < 0: change = 'down'
                except (AttributeError, TypeError, ValueError): pass
                final_probabilities_with_change[league][team_abbr][key] = {'prob': new_prob, 'change': change, 'diff': diff}
        updated_at[league] = now_iso
        print(f"[{league}] 予測を更新しました。")
    final_probabilities_with_change['updated_at'] = updated_at

    # ▼▼▼【追加】10節未満（300試合未満）の場合は参考値フラグを立てる ▼▼▼
    # finished_games は既に対象シーズンで絞り込み済みなので、そのまま件数を数える
    # （以前は int の '年' 列を文字列 '2026' と比較していたため、常に 0 件になっていた）
    total_finished = len(finished_games)
    final_probabilities_with_change['is_reference'] = total_finished < 300

    # --- 新しい予測データの書き込み ---
    temp_output_path = output_path + '.tmp'
    try:
        with open(temp_output_path, 'w', encoding='utf-8') as f:
            json.dump(final_probabilities_with_change, f, ensure_ascii=False, indent=2)
        os.replace(temp_output_path, output_path)
        print(f"新しい予測データの生成が完了しました: {output_path}")

    except Exception as e:
        print(f"エラー: 予測データのファイル書き込みに失敗しました。 - {e}")
        if os.path.exists(temp_output_path):
            os.remove(temp_output_path)
            
    # 以前の「1節前の基準」方式で使っていたファイル。今は使わないので消す
    old_baseline_path = os.path.join(DATA_DIR, 'prediction_baseline.json')
    if os.path.exists(old_baseline_path):
        os.remove(old_baseline_path)
        print(f"クリーンアップ: 使わなくなった {old_baseline_path} を削除しました。")

    prev_file_path = os.path.join(DATA_DIR, 'prediction_probabilities_prev.json')
    if os.path.exists(prev_file_path):
        try:
            os.remove(prev_file_path)
            print(f"クリーンアップ: 不要なファイル {prev_file_path} を削除しました。")
        except Exception as e:
            print(f"警告: {prev_file_path} の削除に失敗しました。 - {e}")

if __name__ == '__main__':
    import sys
    # 例: python create_prediction.py J2 J3   （何も付けなければ全リーグ）
    args = [a.upper() for a in sys.argv[1:]]
    invalid = [a for a in args if a not in ALL_LEAGUES]
    if invalid:
        sys.exit(f"エラー: リーグの指定が正しくありません: {' '.join(invalid)}（J1 / J2 / J3 で指定）")
    main([lg for lg in ALL_LEAGUES if lg in args] or None)