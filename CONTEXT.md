# PokeLog — セッション引き継ぎプロンプト

以下をそのまま新規セッションの最初のメッセージに貼り付けて使う。

---

## プロジェクト概要

**PokeLog** — ポケモンチャンピオンズ MA フォーマット用の対戦記録 PWA。  
個人利用のみ。レート 2000+ を目指すための分析ツール。

- **リポジトリ**: github.com/gakuton/pokelog（public）
- **本番 URL**: Vercel にデプロイ済み（main ブランチへの push で自動デプロイ）
- **ローカル**: `/Users/gakuto/Documents/pokelog`
- **⚠️ デプロイ**: `git push origin main` のみ。`vercel deploy --prod` は絶対に使わない（Hobby plan で Blocked になる）

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16.2.6 App Router |
| DB | Supabase JS v2（service_role キー、RLS バイパス） |
| スタイル | カスタム CSS のみ（Tailwind なし）|
| デプロイ | Vercel（Hobby plan、GitHub 連携）|
| 言語 | TypeScript |

---

## ディレクトリ構成（主要ファイル）

```
app/
  page.tsx                      # ホーム（force-dynamic、戦績・パーティプレビュー・最近の対戦）
  layout.tsx                    # BottomNav 組み込み
  globals.css                   # 全デザイントークン・CSS クラス定義
  history/
    page.tsx                    # 対戦履歴一覧（party_id / my / opp フィルタ）
    [id]/page.tsx               # 対戦詳細（編集ボタン・削除ボタン）
  battles/
    new/page.tsx                # 新規対戦記録（2ステップフォーム）
    [id]/edit/page.tsx          # 対戦編集（既存データ事前読み込み）
  parties/
    page.tsx                    # パーティ一覧（force-dynamic）
    new/page.tsx                # パーティ新規作成
    [id]/page.tsx               # パーティ詳細（インライン名前編集）
    [id]/members/[slot]/page.tsx # メンバー編集
  report/
    page.tsx                    # レポート（ドーナツグラフ・パーティフィルタ・インサイトカード）
  api/
    battles/route.ts            # GET（一覧）/ POST（新規）
    battles/[id]/route.ts       # GET / PATCH（編集）/ DELETE
    parties/route.ts            # GET / POST
    parties/[id]/route.ts       # GET / PUT（名前変更）/ DELETE
    parties/[id]/members/[slot]/route.ts
    pokemon-master/route.ts
    report/my-pokemon/route.ts
    report/opp-pokemon/route.ts
    report/summary/route.ts

components/
  common/
    BottomNav.tsx               # 3タブ（/ / /history / /report）
    PokeAvatar.tsx              # ポケモンアバター（頭文字 + カラートリント）
  battles/
    PokemonCombobox.tsx         # ポケモン名オートコンプリート
    DeleteBattleButton.tsx
  history/
    HistoryFilterBar.tsx        # パーティ・自分・相手の選出フィルタ
  parties/
    MemberEditForm.tsx          # 努力値スライダー付きメンバー編集
    PartyNameEditor.tsx         # インライン名前編集（鉛筆アイコン）
    DeletePartyButton.tsx

lib/
  types.ts                      # Battle / Party / PokemonMember / PokemonMasterEntry など
  supabase.ts                   # createClient（service_role）
  calc.ts                       # calcAllStats / calcHp / calcStat（Lv50、IV=31）
  const.ts                      # NATURES / STAT_LABELS / NATURE_MODIFIERS
  validations/
    battle.ts                   # battleCreateSchema（zod）
    party.ts                    # partyCreateSchema（zod）

public/data/
  pokemon_master.json           # 全使用可能ポケモン（名前・タイプ・種族値・has_mega）
```

---

## DB スキーマ（Supabase）

### battles
| カラム | 型 | 備考 |
|--------|-----|------|
| id | uuid PK | |
| party_id | uuid FK → parties | nullable |
| my_sel1_id / 2 / 3 | uuid FK → pokemon_members | nullable |
| my_sel1_mega / 2 / 3 | boolean | |
| opp_party_json | text[] | nullable、相手パーティ事前情報 |
| opp_sel1_name / 2 / 3 | text | 空文字 OK（3体揃わない場合あり）|
| opp_sel1_mega / 2 / 3 | boolean | |
| selection_intent | text | nullable |
| result | enum(win/lose/draw) | |
| reflection | text | nullable |
| rating_after | integer | nullable |
| created_at | timestamptz | |

### parties
| カラム | 型 |
|--------|-----|
| id | uuid PK |
| name | text |
| created_at / updated_at | timestamptz |

### pokemon_members
| カラム | 型 | 備考 |
|--------|-----|------|
| id | uuid PK | |
| party_id | uuid FK | |
| slot | integer | 1〜6 |
| pokemon_name | text | |
| move1〜4 | text | nullable |
| nature | text | nullable |
| held_item | text | nullable |
| ev_h/a/b/c/d/s | integer | 各最大 32、合計最大 66（チャンピオンズ仕様） |
| has_mega_item | boolean | held_item が「〜ナイト」で自動判定 |
| stat_h/a/b/c/d/s | integer | nullable |

---

## CSS デザインシステム（globals.css）

### カラートークン
```css
--bg: #FAF6EE        /* 背景 */
--card: #FFFFFF
--mb: #7B4FD1        /* マスターボール紫（メイン） */
--mb-tint / --mb-soft / --mb-deep
--pb: #E63946        /* プレミアボール赤（負け・警告） */
--sb: #2563D9        /* スーパーボール青（勝ち） */
--hb: #E5A521        /* ハイパーボール金（引き分け・メモ） */
--ink: #2A2520       /* メインテキスト */
--ink-sub / --ink-mute
--line / --line-soft
--r-sm / --r-md / --r-lg / --r-xl  /* border-radius */
--font-num: 'DM Mono'
```

### 主要クラス
- レイアウト: `.card`, `.section-head`, `.section-label`, `.field`, `.field-label`
- 入力: `.input`, `.select`, `.textarea`
- ボタン: `.btn.primary`, `.btn.ghost`, `.wl-toggle`（勝敗トグル）
- バッジ: `.badge.tag`, `.badge.mega`, `.result-chip.win/lose/draw`, `.rating-pill`
- 対戦: `.battle-card`, `.versus-row`, `.side`, `.vs-divider`
- レポート: `.ring-card`, `.ring-wrap`, `.ring-text`, `.stat-row.good/mid/weak`
- ナビ: `.bottom-nav`, `.fab`（固定 + ボタン）
- ポケモン: `.poke-avatar.xs/md/lg`
- その他: `.steps .step.active`, `.pill-tabs .pill.active`, `.ev-grid`, `.ev-cell`

---

## ビジネスロジック上の重要仕様

| 項目 | 内容 |
|------|------|
| 努力値上限 | 1ステータス最大 **32**、合計最大 **66**（メインシリーズの 252/510 ではない） |
| 選出 | 自分は必ず 3 体。相手は 0〜3 体（試合途中終了に対応）|
| 勝率計算 | 引き分けを含む全試合を分母に。引き分けは勝ちにカウントしない |
| メガシンカ判定 | 持ち物が「〜ナイト」で終わる場合に has_mega_item = true |
| ホーム統計 | `win_rate_summary` ビューは使わず、battles テーブルから JS で直接集計 |
| レポート API | `/api/report/summary` も同様に JS 集計（ビュー非依存）|
| キャッシュ | `app/page.tsx`, `app/parties/page.tsx` は `export const dynamic = 'force-dynamic'` |

---

## 実装済み機能

- [x] ホーム（レート・通算・直近10戦・パーティプレビュー・最近の対戦3件）
- [x] 対戦記録（2ステップ：選出入力→結果・振り返り）
- [x] 対戦履歴一覧（パーティ・ポケモン名フィルタ）
- [x] 対戦詳細（選出・相手パーティ・選出意図・振り返り表示）
- [x] 対戦記録の編集（PATCH /api/battles/:id）
- [x] 対戦記録の削除
- [x] パーティ管理（一覧・新規作成・名前インライン編集・削除）
- [x] パーティメンバー編集（ポケモン名・技・性格・持ち物・努力値）
- [x] レポート（通算/直近10戦ドーナツ・ポケモン別勝率・インサイトカード・パーティフィルタ）
- [x] PokeAvatar コンポーネント（頭文字＋カラー）
- [x] ボトムナビ（/, /history, /report）

---

## git / デプロイ手順

```bash
# 変更を push → Vercel が自動デプロイ
git add <files>
git commit -m "feat: ..."
git push origin main

# ⚠️ 絶対にやらない
vercel deploy --prod   # Hobby plan で Blocked になる
```

git author: `gakuto7733@gmail.com`

---

## 続きのタスク候補（未実装）

特定のタスクがあれば指示してください。なければ以下から選択：

- ポケモン画像の表示（PokeAvatar を画像に差し替え）
- 対戦履歴の日付絞り込み
- レポートのポケモン別詳細（クリック→該当履歴）
- パーティ別勝率をホームに追加
- PWA のオフライン対応強化
- データエクスポート（CSV）
