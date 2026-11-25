# X投稿文の材料を作る。
#
# シーズン予測（create_prediction.py）が終わったあとに bat から呼ばれ、
# Claude（デスクトップアプリのチャット）が投稿文を考えるための材料を 今回の材料.md に書き出す。
# 確率の行（「高知　46.1%↘️」）はここで正確に組み立てておき、Claudeには数字を書かせない。
#
# 例: python make_post_materials.py J2 J3   （何も付けなければ全リーグ）

import importlib.util
import json
import os
import sys
from datetime import datetime

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL_DIR = os.path.dirname(HERE)
DATA_DIR = os.path.join(TOOL_DIR, '..', '..', 'data')
OUTPUT_PATH = os.path.join(HERE, '今回の材料.md')

ALL_LEAGUES = ['J1', 'J2', 'J3']

# どのリーグで何を投稿するか（各リーグ2本ずつ）
POST_TARGETS = {
    'J1': ['champion', 'relegation'],
    'J2': ['promotion', 'relegation'],
    'J3': ['promotion', 'relegation'],
}
CATEGORY_LABEL = {
    'champion': '優勝確率',
    'acl': 'ACL圏内確率',
    'promotion': '昇格確率',
    'relegation': '降格確率',
}
ARROW = {'up': '↗️', 'down': '↘️', 'flat': '➡️'}
CANDIDATES_PER_POST = 8  # 材料に出す候補（投稿の確率の行は上から2〜3クラブ。残りは短評の話題用）


def load_prediction_module():
    """チーム名の略称表とシーズン判定を create_prediction.py から借りる"""
    spec = importlib.util.spec_from_file_location('create_prediction', os.path.join(TOOL_DIR, 'create_prediction.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def to_abbr(name, cp):
    name = cp.TEAM_NAME_MAPPING.get(name, name)
    return cp.ABBREVIATION_MAP.get(name, name)


def team_matches(league_games, team):
    """そのチームの消化済みリーグ戦を新しい順に返す"""
    rows = []
    for _, g in league_games.iterrows():
        if team == g['home']:
            gf, ga, opp, venue = g['ホーム得点'], g['アウェイ得点'], g['away'], 'H'
        elif team == g['away']:
            gf, ga, opp, venue = g['アウェイ得点'], g['ホーム得点'], g['home'], 'A'
        else:
            continue
        result = '勝' if gf > ga else ('負' if gf < ga else '分')
        rows.append({'date': g['date'], 'section': g['節'], 'opp': opp, 'venue': venue,
                     'score': f"{int(gf)}-{int(ga)}", 'result': result})
    return sorted(rows, key=lambda r: r['date'], reverse=True)


def streaks(results):
    """新しい順の勝敗リストから、連勝・連敗・負けなし・勝ちなしの数を数える"""
    def leading(pred):
        n = 0
        for r in results:
            if not pred(r):
                break
            n += 1
        return n
    found = []
    wins, losses = leading(lambda r: r == '勝'), leading(lambda r: r == '負')
    unbeaten, winless = leading(lambda r: r != '負'), leading(lambda r: r != '勝')
    if wins >= 2:
        found.append(f'{wins}連勝中')
    if losses >= 2:
        found.append(f'{losses}連敗中')
    if unbeaten >= 3 and unbeaten > wins:
        found.append(f'{unbeaten}試合負けなし')
    if winless >= 3 and winless > losses:
        found.append(f'{winless}試合勝ちなし')
    return ' / '.join(found) if found else '目立った連続記録なし'


def pct(x):
    return f"{x * 100:.1f}%"


def build_analysis(league, prediction, details, ratings, games, ranks, cp):
    """5種類の解説を計算する。投稿文の材料（文章）と管理画面（JSON）の両方に使う。"""
    league_details = details.get(league, {})
    categories = cp.DETAIL_CATEGORIES[league]
    table_rank = lambda team: int(ranks[team]['順位']) if team in ranks else None

    # ① 次節の試合の重み
    matches = []
    for m in league_details.get('next_matches', []):
        rows, swing_max = [], 0
        for team, side in ((m['home'], 'H'), (m['away'], 'A')):
            win, lose = side, ('A' if side == 'H' else 'H')
            for cat in categories:
                now = prediction.get(league, {}).get(team, {}).get(cat, {}).get('prob', 0)
                if not 0.01 <= now <= 0.99:
                    continue
                get = lambda r: m['results'][r]['teams'].get(team, {}).get(cat) if m['results'][r]['share'] else None
                w, d, l = get(win), get('D'), get(lose)
                if w is None or l is None:
                    continue
                swing_max = max(swing_max, abs(w - l))
                if abs(w - l) >= 0.03:
                    rows.append({'team': team, 'label': CATEGORY_LABEL[cat], 'now': now, 'win': w, 'draw': d, 'lose': l})
        if rows:
            matches.append({'section': m['section'], 'date': m['date'],
                            'home': m['home'], 'home_rank': table_rank(m['home']),
                            'away': m['away'], 'away_rank': table_rank(m['away']),
                            'swing': swing_max, 'rows': rows})
    matches = sorted(matches, key=lambda x: -x['swing'])[:6]

    # ② 昇格・残留ラインの予想
    lines = [{'label': label, 'median': v['median'], 'low': v['range_80'][0], 'high': v['range_80'][1]}
             for label, v in league_details.get('lines', {}).items()]

    # ③ 残り日程の厳しさ（残りの対戦相手のEloの平均）
    league_ratings = {to_abbr(k, cp): v for k, v in ratings.get(league, {}).items()}
    remaining = games[games['ホーム得点'].isna()]
    schedule = []
    for team in ranks:
        opp = [league_ratings[o] for o in
               list(remaining.loc[remaining['home'] == team, 'away']) + list(remaining.loc[remaining['away'] == team, 'home'])
               if o in league_ratings]
        if opp:
            schedule.append({'team': team, 'table_rank': table_rank(team), 'avg': round(sum(opp) / len(opp)), 'games': len(opp)})
    schedule.sort(key=lambda x: -x['avg'])
    for i, row in enumerate(schedule, start=1):
        row['hardness_rank'] = i

    # ④ 実力（Eloの順位）と実際の順位のギャップ
    elo_rank = {team: i for i, (team, _) in enumerate(sorted(league_ratings.items(), key=lambda kv: -kv[1]), start=1)}
    gaps = []
    for team in ranks:
        if team in elo_rank:
            gap = table_rank(team) - elo_rank[team]
            if abs(gap) >= 4:
                gaps.append({'team': team, 'table_rank': table_rank(team), 'elo_rank': elo_rank[team],
                             'note': '実力の割に順位が低い（巻き返し候補）' if gap > 0 else '実力以上に勝点を取れている'})
    gaps.sort(key=lambda g: -abs(g['table_rank'] - g['elo_rank']))

    # ⑤ 最終順位の幅
    positions = []
    for team, p in league_details.get('positions', {}).items():
        positions.append({'team': team, 'table_rank': table_rank(team), 'most_likely': p['most_likely'],
                          'low': p['range_80'][0], 'high': p['range_80'][1]})
    positions.sort(key=lambda x: x['table_rank'] or 99)

    return {'next_matches': matches, 'lines': lines, 'schedule': schedule, 'gaps': gaps, 'positions': positions}


def render_analysis(a):
    """解説を、Claudeが読む材料の文章にする"""
    out = ["### 解説① 次節の試合の重み（結果ごとの確率。すべて予想値）", "",
           "勝ち/分け/負けで確率がどれだけ変わるか。変化の大きい試合から順に並べている。", ""]
    for m in a['next_matches']:
        out.append(f"- {m['section']} {m['date']} {m['home']}（{m['home_rank']}位） vs {m['away']}（{m['away_rank']}位）")
        for r in m['rows']:
            draw = pct(r['draw']) if r['draw'] is not None else '-'
            out.append(f"  - {r['team']}の{r['label']}（今 {pct(r['now'])}）: 勝てば {pct(r['win'])} / 分けなら {draw} / 負ければ {pct(r['lose'])}")
    if not a['next_matches']:
        out.append("（目立って確率が動く試合なし）")

    out += ["", "### 解説② ライン予想（最終的にその順位のチームが取る勝点。予想値）", ""]
    out += [f"- {l['label']}: 勝点{l['median']}前後（8割の確率で{l['low']}〜{l['high']}）" for l in a['lines']]

    out += ["", "### 解説③ 残り日程の厳しさ（残りの対戦相手の実力＝Eloの平均。1位が一番厳しい）", ""]
    if a['schedule']:
        spread = a['schedule'][0]['avg'] - a['schedule'][-1]['avg']
        verdict = 'クラブごとの差はほぼ無いので、③は使わない' if spread < 20 else 'クラブごとに差があるので話題にしてよい'
        out.append(f"一番厳しいクラブと一番楽なクラブの差: {spread}（{verdict}）")
        out.append("")
    out += [f"- {s['hardness_rank']}. {s['team']}（{s['table_rank']}位）: 相手の平均 {s['avg']}（残り{s['games']}試合）" for s in a['schedule']]

    out += ["", "### 解説④ 実力（Eloの順位）と実際の順位のギャップ（差が4以上のクラブ）", ""]
    out += [f"- {g['team']}: 実際 {g['table_rank']}位 / 実力 {g['elo_rank']}番手 → {g['note']}" for g in a['gaps']]
    if not a['gaps']:
        out.append("（大きなギャップのあるクラブなし）")
    out.append("")
    return out


def position_text(analysis, team):
    p = next((x for x in analysis['positions'] if x['team'] == team), None)
    if not p:
        return 'データなし'
    return f"一番ありそうなのは{p['most_likely']}位、8割の確率で{p['low']}〜{p['high']}位"


def build_league_section(league, prediction, details, ratings, schedule, cp):
    games = schedule[schedule['リーグ'] == league]
    played = games[games['ホーム得点'].notna()]
    upcoming = games[games['ホーム得点'].isna() & (games['date'] >= pd.Timestamp.today().normalize())].sort_values('date')
    if played.empty:
        return f"## {league}\n\nまだ消化試合がありません。\n", None

    last_date = played['date'].max()
    current_section = played.loc[played['date'] == last_date, '節'].iloc[0]
    date_label = f"{last_date.month}/{last_date.day}"
    rank_df = pd.read_csv(os.path.join(DATA_DIR, f'{league.lower()}rank.csv'), encoding='utf-8-sig')
    ranks = {r['チーム名']: r for _, r in rank_df.iterrows()}

    lines = [f"## {league}", "",
             f"- 今節: {current_section}（最後の試合日 {last_date:%Y-%m-%d}）",
             f"- 投稿の日付表記: {date_label}", "",
             "### 順位表", "",
             "| 順位 | クラブ | 勝点 | 試合 | 勝 | 分 | 敗 | 得失点差 |", "|---|---|---|---|---|---|---|---|"]
    for _, r in rank_df.iterrows():
        lines.append(f"| {r['順位']} | {r['チーム名']} | {r['勝点']} | {r['試合数']} | {r['勝']} | {r['分']} | {r['敗']} | {r['得失点差']} |")
    lines.append("")
    analysis = build_analysis(league, prediction, details, ratings, games, ranks, cp)
    lines += render_analysis(analysis)

    league_probs = prediction.get(league, {})
    for category in POST_TARGETS[league]:
        label = CATEGORY_LABEL[category]
        ranked = sorted(league_probs.items(), key=lambda kv: -kv[1][category]['prob'])
        ranked = [(t, v[category]) for t, v in ranked if v[category]['prob'] > 0][:CANDIDATES_PER_POST]

        lines += [f"### 投稿: {league} {label}", "",
                  "見出し（このまま使う）:", "", "```",
                  f"【update🔔】{league} {date_label}終了時点　{label}AI予想", "```", "",
                  "確率の行の候補（確率の高い順。上から2〜3行を、文字を変えずにそのまま使う）:", "", "```"]
        for team, p in ranked:
            lines.append(f"{team}　{p['prob'] * 100:.1f}%{ARROW.get(p['change'], '')}")
        lines += ["```", "", "各クラブの材料:", ""]

        for team, p in ranked:
            r = ranks.get(team)
            matches = team_matches(played, team)
            recent = matches[:5]
            latest = matches[0] if matches else None
            this_round = (f"{latest['result']}（{latest['venue']} {latest['opp']} {latest['score']}）"
                          if latest is not None and latest['section'] == current_section else '今節は試合なし（未消化）')
            nexts = upcoming[(upcoming['home'] == team) | (upcoming['away'] == team)].head(2)
            next_text = []
            for _, g in nexts.iterrows():
                opp = g['away'] if g['home'] == team else g['home']
                venue = 'H' if g['home'] == team else 'A'
                opp_rank = ranks.get(opp)
                rank_text = f"{opp_rank['順位']}位" if opp_rank is not None else ''
                next_text.append(f"{g['節']} {g['date']:%m/%d} {venue} {opp}（{rank_text}）")
            diff_pt = round(p.get('diff', 0) * 100, 1) + 0.0  # -0.0 を 0.0 にする
            lines += [
                f"- **{team}**（{r['順位']}位・勝点{r['勝点']}・{r['試合数']}試合）" if r is not None else f"- **{team}**",
                f"  - {label}: {p['prob'] * 100:.1f}%（前回比 {diff_pt:+.1f}pt）",
                f"  - 今節: {this_round}",
                f"  - 直近5試合（新しい順）: " + '、'.join(f"{m['result']}({m['venue']} {m['opp']} {m['score']})" for m in recent),
                f"  - 連続記録: {streaks([m['result'] for m in matches])}",
                f"  - 解説⑤ 最終順位の幅: {position_text(analysis, team)}",
                f"  - 次の試合: " + ('、'.join(next_text) if next_text else 'なし'),
            ]
        lines.append("")
    return "\n".join(lines), analysis


def load_json(path):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def main(leagues):
    cp = load_prediction_module()
    with open(os.path.join(DATA_DIR, 'prediction_probabilities.json'), encoding='utf-8') as f:
        prediction = json.load(f)

    schedule = pd.read_csv(os.path.join(DATA_DIR, 'schedule.csv'), encoding='utf-8-sig')
    season = cp.detect_current_season(schedule)
    schedule = schedule[schedule['年'].astype(str) == season].copy()
    schedule['date'] = cp.parse_match_dates(schedule)
    schedule['home'] = schedule['ホーム'].map(lambda n: to_abbr(n, cp))
    schedule['away'] = schedule['アウェイ'].map(lambda n: to_abbr(n, cp))

    sections = [
        "# X投稿文の材料",
        "",
        f"- 作成: {datetime.now():%Y-%m-%d %H:%M}",
        f"- 対象リーグ: {' / '.join(leagues)}",
        "- 書き方は 投稿文の作り方.md、文体は 過去の投稿例.md を見ること。",
        "- 矢印は前回そのリーグを回したときとの比較（↗️上昇 ↘️下降 ➡️変化なし）。",
        "- 解説①〜⑤は毎回全部使わない。その回に話題になるものを1〜2個だけ選ぶ。",
        "",
    ]
    details = load_json(os.path.join(DATA_DIR, 'prediction_details.json'))
    ratings = load_json(os.path.join(DATA_DIR, 'team_ratings.json'))
    # 管理画面（admin.html）に出す解説。更新しないリーグは前回のまま残す
    analysis_path = os.path.join(DATA_DIR, 'prediction_analysis.json')
    analysis_all = load_json(analysis_path)
    for league in leagues:
        text, analysis = build_league_section(league, prediction, details, ratings, schedule, cp)
        sections.append(text)
        if analysis is not None:
            analysis_all[league] = analysis
    analysis_all['updated_at'] = datetime.now().astimezone().isoformat(timespec='seconds')
    with open(analysis_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_all, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write("\n".join(sections))
    print(f"X投稿文の材料を作りました: {OUTPUT_PATH}")


if __name__ == '__main__':
    args = [a.upper() for a in sys.argv[1:]]
    invalid = [a for a in args if a not in ALL_LEAGUES]
    if invalid:
        sys.exit(f"エラー: リーグの指定が正しくありません: {' '.join(invalid)}（J1 / J2 / J3 で指定）")
    main([lg for lg in ALL_LEAGUES if lg in args] or ALL_LEAGUES)
