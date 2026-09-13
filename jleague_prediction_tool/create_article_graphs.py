import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import japanize_matplotlib # 日本語表示のためにインポート
import os

# --- 設定項目 ---
WEB_ROOT_PATH = 'C:/Users/mura/Desktop/jleague-big-club'
SCHEDULE_CSV_PATH = os.path.join(WEB_ROOT_PATH, 'data/schedule.csv')
OUTPUT_DIR = os.path.join(WEB_ROOT_PATH, 'posts/img') # 画像の保存先

# --- グラフ作成関数 ---

def create_home_win_rate_chart(df):
    """ホーム勝率の円グラフを作成する関数"""
    print("1. ホーム勝率の円グラフを作成中...")
    df['result'] = df.apply(lambda row: 'ホーム勝利' if row['ホーム得点'] > row['アウェイ得点'] else ('アウェイ勝利' if row['ホーム得点'] < row['アウェイ得点'] else '引き分け'), axis=1)
    result_counts = df['result'].value_counts()
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(8, 8), facecolor='#232947')
    colors = ['#27aee7', '#e94444', '#95a5a6']
    wedgeprops = {'linewidth': 2, 'edgecolor': '#232947'}
    textprops = {'color': 'white', 'fontsize': 16, 'fontweight': 'bold'}
    ax.pie(result_counts, labels=result_counts.index, autopct='%1.1f%%', startangle=90,
           colors=colors, wedgeprops=wedgeprops, textprops=textprops)
    ax.set_title('Jリーグ ホームアドバンテージ (過去10年)', fontsize=20, color='white', pad=20)
    output_path = os.path.join(OUTPUT_DIR, 'home_win_rate_chart.webp')
    plt.savefig(output_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    print(f"   -> グラフを保存しました: {output_path}")
    plt.close()


def create_hap_ranking_chart(df):
    """ホーム・アドバンテージ・ポイント(HAP)のランキンググラフを作成する関数"""
    print("2. HAPランキンググラフを作成中...")
    
    df['リーグ'] = df['リーグ'].str.strip()
    df['ホーム'] = df['ホーム'].str.strip()
    df['アウェイ'] = df['アウェイ'].str.strip()

    # J1, J2のみ、2015年以降のデータに絞り込む
    df_filtered = df[(df['リーグ'].isin(['J1', 'J2'])) & (df['年'] >= 2015)].copy()
    
    if df_filtered.empty:
        print("   -> 警告: HAP計算対象のデータがありません。")
        return

    # ホームとアウェイの勝点を計算
    home_points = df_filtered.apply(lambda r: 3 if r['ホーム得点'] > r['アウェイ得点'] else (1 if r['ホーム得点'] == r['アウェイ得点'] else 0), axis=1)
    away_points = df_filtered.apply(lambda r: 3 if r['ホーム得点'] < r['アウェイ得点'] else (1 if r['ホーム得点'] == r['アウェイ得点'] else 0), axis=1)
    
    df_filtered['home_pts'] = home_points
    df_filtered['away_pts'] = away_points

    home_stats = df_filtered.groupby('ホーム').agg(home_games=('ホーム', 'count'), home_total_pts=('home_pts', 'sum')).reset_index().rename(columns={'ホーム': 'クラブ'})
    away_stats = df_filtered.groupby('アウェイ').agg(away_games=('アウェイ', 'count'), away_total_pts=('away_pts', 'sum')).reset_index().rename(columns={'アウェイ': 'クラブ'})
    
    stats = pd.merge(home_stats, away_stats, on='クラブ', how='outer').fillna(0)
    
    # --- ★★★【最終修正箇所】★★★ ---
    # `年` 列のユニーク数が1しかない問題に対処するため、
    # 代わりに「試合数」を基準にフィルターをかけます。
    # J1/J2で平均的に5シーズン以上活動した場合、ホームゲームは約85試合以上になります。
    # ここでは少し緩めに「ホームで50試合以上」を基準とします。
    
    # stats['total_seasons'] = ... の計算は不要になるため削除
    
    # total_games 列を追加
    stats['total_games'] = stats['home_games'] + stats['away_games']
    
    print("\n--- デバッグ情報 ---")
    print("計算された各クラブのJ1/J2でのホーム試合数（上位15件）:")
    print(stats.sort_values('home_games', ascending=False).head(15)[['クラブ', 'home_games']])
    print("---------------------\n")
    
    # フィルター条件を「ホーム試合数 50試合以上」に変更
    MIN_HOME_GAMES = 50
    stats = stats[stats['home_games'] >= MIN_HOME_GAMES]
    
    if stats.empty:
        print(f"   -> 警告: 「ホームで{MIN_HOME_GAMES}試合以上」の条件を満たすクラブがありませんでした。スキップします。")
        return

    stats['home_ppg'] = stats['home_total_pts'] / stats['home_games']
    stats['away_ppg'] = stats['away_total_pts'] / stats['away_games']
    stats['HAP'] = stats['home_ppg'] - stats['away_ppg']
    
    top10 = stats.nlargest(10, 'HAP')
    worst1 = stats.nsmallest(1, 'HAP')
    chart_data = pd.concat([top10, worst1]).sort_values('HAP', ascending=False)

    if chart_data.empty:
        print("   -> 警告: グラフ描画対象のデータがありません。スキップします。")
        return

    # グラフ描画
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(10, 8), facecolor='#232947')
    
    colors = ['#ffd700' if hap > 0 else '#e74c3c' for hap in chart_data['HAP']]
    sns.barplot(x='HAP', y='クラブ', data=chart_data, palette=colors, ax=ax)
    
    ax.set_title('Jリーグ「アウェイの墓場」ランキング (HAP)', fontsize=20, color='white', pad=20)
    ax.set_xlabel('ホーム・アドバンテージ・ポイント (HAP)', fontsize=14, color='white')
    ax.set_ylabel('クラブ', fontsize=14, color='white')
    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    ax.grid(axis='x', linestyle='--', alpha=0.3)
    
    for index, value in enumerate(chart_data['HAP']):
        ax.text(value, index, f' {value:.2f}', va='center', color='white', fontweight='bold')
        
    fig.text(0.95, 0.05, f'※2015年以降、J1/J2でホーム{MIN_HOME_GAMES}試合以上のクラブが対象', 
             ha='right', va='bottom', fontsize=10, color='gray')

    output_path = os.path.join(OUTPUT_DIR, 'hap_ranking_with_game_filter.webp') # ファイル名を変更
    plt.savefig(output_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
    print(f"   -> グラフを保存しました: {output_path}")
    plt.close()


# --- メイン処理 ---
def main():
    print("--- 記事用グラフ生成ツールを開始します ---")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    try:
        schedule_df = pd.read_csv(SCHEDULE_CSV_PATH, encoding='utf-8-sig', dtype={'年': int})
        schedule_df.dropna(subset=['ホーム得点', 'アウェイ得点'], inplace=True)
    except FileNotFoundError:
        print(f"エラー: {SCHEDULE_CSV_PATH} が見つかりません。")
        return
        
    create_home_win_rate_chart(schedule_df)
    create_hap_ranking_chart(schedule_df)
    
    print("--- 全てのグラフ生成が完了しました ---")

if __name__ == '__main__':
    main()