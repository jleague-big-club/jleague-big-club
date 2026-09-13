import pandas as pd
import matplotlib.pyplot as plt
import os
from adjustText import adjust_text
import matplotlib.patches as mpatches

# --- 準備 ---

# 1. 日本語フォントの設定
plt.rcParams['font.family'] = 'Meiryo'

# 2. パス設定
input_file_path = r"C:\Users\mura\Desktop\jleague-big-club\data\8league_jleague.csv"
output_folder_path = r"C:\Users\mura\Desktop\jleague-big-club\posts\img"

# 3. 保存先フォルダの作成
if not os.path.exists(output_folder_path):
    os.makedirs(output_folder_path)
    print(f"フォルダを作成しました: {output_folder_path}")

# 4. CSV読み込み
try:
    df = pd.read_csv(input_file_path)
    print("CSVファイルの読み込みに成功しました。\n")
except FileNotFoundError:
    print(f"エラー: ファイルが見つかりません。パス: {input_file_path}")
    exit()

# --- 1. 表を画像として作成・保存 ---

print("表を画像として作成します...")

table_data = df[['国', 'リーグ', '円（1€=165円）', '備考（移籍収入込みか）']].copy()
table_data.rename(columns={'円（1€=165円）': '売上（10億円）', '備考（移籍収入込みか）': '移籍金有無'}, inplace=True)

fig, ax = plt.subplots(figsize=(8, 4.5))
ax.axis('tight')
ax.axis('off')

the_table = ax.table(cellText=table_data.values,
                     colLabels=table_data.columns,
                     loc='center',
                     cellLoc='center',
                     colWidths=[0.2, 0.3, 0.2, 0.2])

the_table.auto_set_font_size(False)
the_table.set_fontsize(11)
the_table.scale(1.2, 1.2)

for (i, j), cell in the_table.get_celld().items():
    cell.set_height(0.1)
    if i == 0:
        cell.set_text_props(weight='bold', color='white')
        cell.set_facecolor('#2c3e50')
    else:
        if 'J1' in table_data.iloc[i-1]['リーグ']:
            cell.set_facecolor('#fff2f2')

plt.title('リーグ別 売上高 比較表 (2023/24 & 2024シーズン)', weight='bold', fontsize=16, pad=20)

table_output_path = os.path.join(output_folder_path, 'league_revenue_table_final_v2.png')
plt.savefig(table_output_path, dpi=300, bbox_inches='tight', pad_inches=0.5)
print(f"表を画像ファイルとして保存しました: {table_output_path}")
plt.close()

print("\n" + "="*50 + "\n")


# --- 2. 見やすい散布図の作成とPNGファイルへの保存 ---

print("見やすい散布図を作成します...")

plot_df = df[~((df['リーグ'] == 'J1リーグ') & (df['備考（移籍収入込みか）'] == '含まず'))].copy()

fig, ax = plt.subplots(figsize=(12, 9))

# ★★★★★★★★★★★★★★★★★★★★★★★★★
# ★ ここを修正しました ★
# ★★★★★★★★★★★★★★★★★★★★★★★★★
colors = ['#5cb85c' if 備考 == '含む' else '#007acc' for 備考 in plot_df['備考（移籍収入込みか）']]

ax.scatter(plot_df['平均観客数'], plot_df['円（1€=165円）'], s=200, alpha=0.8, edgecolors='k', c=colors)

texts = []
for i, row in plot_df.iterrows():
    texts.append(ax.text(row['平均観客数'], row['円（1€=165円）'], row['リーグ'], fontsize=12, weight='bold'))

adjust_text(texts, 
            force_points=(0.5, 0.5), 
            force_text=(0.5, 0.5),
            expand_points=(1.5, 1.5),
            arrowprops=dict(arrowstyle='->', color='gray', lw=1.0, shrinkA=5, shrinkB=5))

margin_x = (plot_df['平均観客数'].max() - plot_df['平均観客数'].min()) * 0.05
ax.set_xlim(plot_df['平均観客数'].min() - margin_x, plot_df['平均観客数'].max() + margin_x)
margin_y = plot_df['円（1€=165円）'].max() * 0.05
ax.set_ylim(0, plot_df['円（1€=165円）'].max() + margin_y)

ax.set_title('リーグ別 平均観客数と売上高の関係 (2023/24 & 2024シーズン)', fontsize=18, pad=20, weight='bold')
ax.set_xlabel('平均観客数（人）', fontsize=14)
ax.set_ylabel('クラブ合算売上（10億円）', fontsize=14)
ax.grid(True, linestyle='--', alpha=0.6)

legend_handles = [
    mpatches.Patch(color='#007acc', label='移籍収入含まず'),
    mpatches.Patch(color='#5cb85c', label='移籍収入込み')
]
ax.legend(handles=legend_handles, loc='upper left', fontsize=12, title='売上基準')

graph_output_path = os.path.join(output_folder_path, 'league_scatter_plot_final_v2.png')
plt.savefig(graph_output_path, dpi=300, bbox_inches='tight')
print(f"散布図を画像ファイルとして保存しました: {graph_output_path}")

plt.show()

print("\n処理が完了しました。")