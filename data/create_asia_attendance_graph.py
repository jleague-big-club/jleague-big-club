import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import japanize_matplotlib
import os

def main():
    """
    東アジア3リーグの平均観客数の推移データを読み込み、
    折れ線グラフを生成して画像ファイルとして保存するスクリプト。
    """
    print("--- 東アジアリーグ観客数推移グラフ生成ツール ---")

    # --- 設定項目 ---
    DATA_CSV_PATH = 'C:/Users/mura/Desktop/jleague-big-club/data/asia_attendance.csv'
    OUTPUT_DIR = 'C:/Users/mura/Desktop/jleague-big-club/posts/img'
    OUTPUT_FILENAME = 'east_asia_league_attendance_trends.webp'

    # --- データ読み込み ---
    try:
        df_wide = pd.read_csv(DATA_CSV_PATH, encoding='utf-8-sig')
        print(f"データファイルを読み込みました: {DATA_CSV_PATH}")
    except FileNotFoundError:
        print(f"エラー: ファイルが見つかりません。パスを確認してください: {DATA_CSV_PATH}")
        return
    except Exception as e:
        print(f"エラー: ファイルの読み込みに失敗しました。 - {e}")
        return

    # ### 修正点1: 対象リーグを東アジア3リーグに絞り込む ###
    target_leagues = ['J1リーグ', 'K1リーグ', '中国スーパーリーグ']
    df_wide = df_wide[df_wide['リーグ名'].isin(target_leagues)]

    if df_wide.empty:
        print("エラー: CSVファイルに対象の東アジアリーグが見つかりませんでした。")
        return

    # --- データ加工 ---
    id_vars = ['リーグ名']
    value_vars = [col for col in df_wide.columns if col.isdigit() and int(col) >= 2015]
    
    df_long = pd.melt(df_wide, id_vars=id_vars, value_vars=value_vars, var_name='年', value_name='平均観客数')

    df_long['年'] = pd.to_numeric(df_long['年'])
    df_long['平均観客数'] = df_long['平均観客数'].replace(0, pd.NA)
    df_long.dropna(subset=['平均観客数'], inplace=True)
    
    # --- グラフ描画 ---
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(14, 8), facecolor='#232947')

    sns.lineplot(
        data=df_long,
        x='年',
        y='平均観客数',
        hue='リーグ名',
        marker='o',
        linewidth=2.5,
        ax=ax,
        palette='bright' # 色のテーマを明るいものに変更
    )
    
    # --- グラフの装飾 ---
    # ### 修正点2: グラフのタイトルを変更 ###
    ax.set_title('東アジア主要3リーグ 平均観客数推移 (2015-2025)', fontsize=20, color='white', pad=20)
    ax.set_xlabel('年', fontsize=14, color='white')
    ax.set_ylabel('平均観客数（人）', fontsize=14, color='white')
    
    ax.tick_params(axis='x', colors='white')
    ax.tick_params(axis='y', colors='white')
    ax.grid(linestyle='--', alpha=0.2)
    
    ax.legend(title='リーグ', facecolor='#3a486b', labelcolor='white')
    
    plt.tight_layout()
    
    # --- 画像ファイルとして保存 ---
    try:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        # ### 修正点3: 保存ファイル名を変更 ###
        output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)
        
        plt.savefig(output_path, facecolor=fig.get_facecolor(), bbox_inches='tight')
        print(f"\nグラフを保存しました: {output_path}")
    except Exception as e:
        print(f"\nエラー: グラフの保存に失敗しました。 - {e}")
    finally:
        plt.close()

if __name__ == '__main__':
    main()