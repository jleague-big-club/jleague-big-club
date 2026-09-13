import pandas as pd
import json
import os
import matplotlib.pyplot as plt
import seaborn as sns
import japanize_matplotlib
import unicodedata
import numpy as np

# --- 設定項目 ---
BASE_PROJECT_PATH = 'C:/Users/mura/Desktop/jleague-big-club' 
DATA_DIR = os.path.join(BASE_PROJECT_PATH, 'data')
RATINGS_JSON_PATH = os.path.join(DATA_DIR, 'team_ratings.json')
BIGCLUB_CSV_PATH = os.path.join(DATA_DIR, 'data.csv')
OUTPUT_DIR = os.path.join(BASE_PROJECT_PATH, 'posts', 'img')

def normalize_club_name(name):
    if not isinstance(name, str): return name
    return unicodedata.normalize('NFKC', name).strip()

def create_scatter_plot(df, title, filename, reg_params):
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 9), facecolor='#232947')

    defined_palette = {'J1': '#e74c3c', 'J2': '#3498db', 'J3': '#2ecc71', 'JFL': '#95a5a6'}
    leagues_in_df = df['league'].unique()
    palette = {league: defined_palette.get(league, '#888888') for league in leagues_in_df}

    sns.scatterplot(x='営業収益', y='rating', hue='league', data=df, s=120, palette=palette, ax=ax, edgecolor='w', alpha=0.9)

    for i, row in df.iterrows():
        ax.text(row['営業収益'] * 1.015, row['rating'], row['クラブ名'], fontsize=9, color='white', alpha=0.9)

    ax.set_title(title, fontsize=20, color='white', pad=20)
    ax.set_xlabel('営業収益 (億円)', fontsize=14, color='white')
    ax.set_ylabel('Eloレーティング (現在の強さ)', fontsize=14, color='white')
    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    ax.grid(linestyle='--', alpha=0.2)
    
    handles, labels = ax.get_legend_handles_labels()
    ax.legend(handles=handles, labels=labels, title='リーグ', facecolor='#3a486b', labelcolor='white')

    if reg_params is not None:
        a, b = reg_params
        x_reg = np.array(ax.get_xlim())
        y_reg = a * x_reg + b
        ax.plot(x_reg, y_reg, color='gray', linestyle=':', linewidth=1.5, label='期待値ライン')
        
        # ### 修正点: テキスト表記を正しい意味に入れ替え、配置も分かりやすく変更 ###
        # 左上: 期待値ラインより「上」の領域
        ax.text(ax.get_xlim()[0] * 1.1, ax.get_ylim()[1] * 0.98, '効率的 (コスパが良い)', 
                ha='left', va='top', color='#2ecc71', fontsize=12, fontweight='bold')
        # 右下: 期待値ラインより「下」の領域
        ax.text(ax.get_xlim()[1] * 0.99, ax.get_ylim()[0] * 1.02, '課題あり', 
                ha='right', va='bottom', color='#e74c3c', fontsize=12, fontweight='bold')

    output_path = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(output_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    print(f"グラフを保存しました: {output_path}")
    plt.close()

def main():
    print("--- コスパ分析グラフ生成ツール ---")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    try:
        with open(RATINGS_JSON_PATH, 'r', encoding='utf-8') as f:
            ratings_data = json.load(f)
        bigclub_df = pd.read_csv(BIGCLUB_CSV_PATH, encoding='utf-8-sig', header=None, usecols=[0, 1])
        bigclub_df.columns = ['クラブ名', '営業収益']
        if bigclub_df.iloc[0]['クラブ名'] == 'クラブ名':
            bigclub_df = bigclub_df.drop(bigclub_df.index[0]).reset_index(drop=True)
        bigclub_df['営業収益'] = pd.to_numeric(bigclub_df['営業収益'], errors='coerce')
        bigclub_df.dropna(subset=['営業収益'], inplace=True)
        print("データファイルを正常に読み込みました。")
    except Exception as e:
        print(f"エラー: データファイルの読み込みに失敗しました。 - {e}")
        return

    flat_ratings = {}
    for league, teams in ratings_data.items():
        for team, rating in teams.items():
            flat_ratings[normalize_club_name(team)] = {'rating': rating, 'league': league}
    ratings_df = pd.DataFrame.from_dict(flat_ratings, orient='index').reset_index().rename(columns={'index': 'クラブ名'})
    bigclub_df['クラブ名'] = bigclub_df['クラブ名'].apply(normalize_club_name)
    name_mapping = {'栃木': '栃木SC', '京都サンガFC': '京都サンガF.C.'}
    ratings_df['クラブ名'] = ratings_df['クラブ名'].replace(name_mapping)
    merged_df = pd.merge(bigclub_df, ratings_df, on='クラブ名', how='inner')
    
    print(f"\n結合後のデータ数: {len(merged_df)}")
    if merged_df.empty:
        print("エラー: 結合できるデータがありませんでした。")
        return

    all_clubs_reg_params = None
    if len(merged_df) > 1:
        x_all = merged_df['営業収益']
        y_all = merged_df['rating']
        all_clubs_reg_params = np.polyfit(x_all, y_all, 1)

    create_scatter_plot(merged_df, 'Jリーグ全クラブ 営業収益 vs Eloレーティング (2025)', 'cost_performance_all.webp', all_clubs_reg_params)
    create_scatter_plot(merged_df[merged_df['league'] == 'J1'].copy(), 'J1クラブ 営業収益 vs Eloレーティング (2025)', 'cost_performance_j1.webp', all_clubs_reg_params)
    create_scatter_plot(merged_df[merged_df['league'] == 'J2'].copy(), 'J2クラブ 営業収益 vs Eloレーティング (2025)', 'cost_performance_j2.webp', all_clubs_reg_params)
    create_scatter_plot(merged_df[merged_df['league'] == 'J3'].copy(), 'J3クラブ 営業収益 vs Eloレーティング (2025)', 'cost_performance_j3.webp', all_clubs_reg_params)

if __name__ == '__main__':
    main()