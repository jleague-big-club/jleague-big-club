"""
schedule26-27.txt を schedule.csv と同じ形式に変換するスクリプト

【出力形式】
年,リーグ,節,日付,ホーム,ホーム得点,アウェイ得点,アウェイ

【実行方法】
python convert_schedule.py
"""

import csv
import os

# --- チーム名マップ（略称 → フル名）---
TEAM_NAME_MAP = {
    # J1
    '横浜FM': '横浜F・マリノス',
    '鹿島':   '鹿島アントラーズ',
    'G大阪':  'ガンバ大阪',
    '浦和':   '浦和レッズ',
    'FC東京': 'FC東京',
    '町田':   'FC町田ゼルビア',
    '名古屋': '名古屋グランパス',
    '清水':   '清水エスパルス',
    '福岡':   'アビスパ福岡',
    '神戸':   'ヴィッセル神戸',
    '柏':     '柏レイソル',
    '柏柏':   '柏レイソル',   # typoの修正
    '水戸':   '水戸ホーリーホック',
    'C大阪':  'セレッソ大阪',
    '岡山':   'ファジアーノ岡山',
    '広島':   'サンフレッチェ広島',
    '千葉':   'ジェフユナイテッド千葉',
    '東京V':  '東京ヴェルディ',
    '川崎F':  '川崎フロンターレ',
    '長崎':   'V・ファーレン長崎',
    '京都':   '京都サンガF.C.',
    # J2
    '札幌':   '北海道コンサドーレ札幌',
    '徳島':   '徳島ヴォルティス',
    '八戸':   'ヴァンラーレ八戸',
    '富山':   'カターレ富山',
    '藤枝':   '藤枝MYFC',
    '仙台':   'ベガルタ仙台',
    '宮崎':   'テゲバジャーロ宮崎',
    '横浜FC': '横浜FC',
    '大宮':   'RB大宮アルディージャ',
    '新潟':   'アルビレックス新潟',
    '大分':   '大分トリニータ',
    '湘南':   '湘南ベルマーレ',
    '磐田':   'ジュビロ磐田',
    '秋田':   'ブラウブリッツ秋田',
    '鳥栖':   'サガン鳥栖',
    '甲府':   'ヴァンフォーレ甲府',
    'いわきFC': 'いわきFC',
    '今治':   'FC今治',
    '山形':   'モンテディオ山形',
    '栃木C':  '栃木シティ',
    # J3
    '長野':   'AC長野パルセイロ',
    '山口':   'レノファ山口FC',
    '相模原': 'SC相模原',
    '熊本':   'ロアッソ熊本',
    '琉球':   'FC琉球',
    '北九州': 'ギラヴァンツ北九州',
    '鹿児島': '鹿児島ユナイテッドFC',
    '群馬':   'ザスパ群馬',
    '鳥取':   'ガイナーレ鳥取',
    'FC大阪': 'FC大阪',
    '高知':   '高知ユナイテッドSC',
    '松本':   '松本山雅FC',
    '福島':   '福島ユナイテッドFC',
    '讃岐':   'カマタマーレ讃岐',
    '滋賀':   'サウルコス福井',   # ★要確認：正式名称が不明な場合はここを修正
    '岐阜':   'FC岐阜',
    '栃木SC': '栃木SC',
    '金沢':   'ツエーゲン金沢',
    '愛媛':   '愛媛FC',
    '奈良':   '奈良クラブ',
}

HEADER = '節\t日付\tホーム\t\t\tアウェイ'

def convert_date(date_str):
    """
    '8/7'  → '26/8/7'  (月が先頭 → 2026年として扱う)
    '27/6/6' → '27/6/6' (すでに年付き)
    """
    parts = date_str.split('/')
    first = int(parts[0])
    if first > 12:
        # すでに年付き (例: 27/6/6)
        return date_str
    else:
        # 月始まり → 2026年を付加
        return f'26/{date_str}'

def get_year(date_str):
    """変換後の日付から年を取得 (26 → 2026, 27 → 2027)"""
    yy = int(date_str.split('/')[0])
    return 2000 + yy

def convert_team(name, unmapped):
    """チーム名を変換。マップにない場合はそのまま返し警告リストに追加"""
    if name in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[name]
    else:
        if name not in unmapped:
            unmapped.append(name)
        return name  # 変換できない場合はそのまま

def main():
    input_path  = os.path.join(os.path.dirname(__file__), 'schedule26-27.txt')
    output_path = os.path.join(os.path.dirname(__file__), 'schedule_26-27.csv')

    rows = []
    current_league = None
    unmapped_teams = []
    league_order = ['J1', 'J2', 'J3']
    league_index = -1

    with open(input_path, encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.rstrip('\r\n')
            if not line.strip():
                continue

            # ヘッダー行の検出 → リーグを次へ
            if line.startswith('節'):
                league_index += 1
                if league_index < len(league_order):
                    current_league = league_order[league_index]
                    print(f'--- {current_league} セクション開始 ---')
                continue

            # データ行を分割（タブ区切り、空列を除去）
            cols = [c for c in line.split('\t') if c.strip()]
            if len(cols) < 3:
                continue

            setsu  = cols[0]   # 第X節
            date   = cols[1]   # 日付
            home   = cols[2]   # ホーム略称
            away   = cols[3]   # アウェイ略称

            converted_date = convert_date(date)
            year = get_year(converted_date)
            home_full = convert_team(home, unmapped_teams)
            away_full = convert_team(away, unmapped_teams)

            rows.append([
                year,
                current_league,
                setsu,
                converted_date,
                home_full,
                '',   # ホーム得点（空欄）
                '',   # アウェイ得点（空欄）
                away_full
            ])

    # CSV出力
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['年', 'リーグ', '節', '日付', 'ホーム', 'ホーム得点', 'アウェイ得点', 'アウェイ'])
        writer.writerows(rows)

    print(f'\n[完了] 変換完了: {output_path}')
    print(f'  -> {len(rows)} 試合を出力しました')

    if unmapped_teams:
        print(f'\n[警告] 以下のチーム名がマップにありません（要確認）:')
        for t in unmapped_teams:
            print(f'   - {t}')
    else:
        print('  -> すべてのチーム名を正常に変換しました [OK]')

if __name__ == '__main__':
    main()
