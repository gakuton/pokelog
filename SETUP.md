# PokeLog セットアップ手順

ローカルで `npm run dev` が動いた後、データベースに接続するまでの手順です。

---

## ステップ 1: Supabase プロジェクトを作成する

1. ブラウザで [https://supabase.com](https://supabase.com) を開く
2. **Sign In** または **Start your project** からログイン
3. ダッシュボードの **New project** をクリック
4. 以下を入力して **Create new project** をクリック

   | 項目 | 入力値 |
   |------|--------|
   | Name | `pokelog`（任意） |
   | Database Password | 任意のパスワード（メモしておく） |
   | Region | `Northeast Asia (Tokyo)` を推奨 |

5. プロジェクトの作成が完了するまで **1〜2 分** 待つ

---

## ステップ 2: API キーを取得する

1. プロジェクトのダッシュボードで、左サイドバーの **Settings（歯車アイコン）** をクリック
2. **API** をクリック
3. 以下の 2 つの値をメモする

   | 変数名 | 場所 | 説明 |
   |--------|------|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** | `https://xxxxxxxx.supabase.co` という形式 |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Project API keys → service_role** | `eyJ...` から始まる長い文字列 |

   > ⚠️ `service_role` キーは強い権限を持ちます。`.env.local` 以外には絶対に貼り付けないでください。

---

## ステップ 3: `.env.local` を更新する

プロジェクトのルートにある `.env.local` を開いてください。

```
/Users/gakuto/Documents/pokelog/.env.local
```

**変更前:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**変更後（ステップ 2 でメモした値に置き換える）:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...（実際のキー）
```

保存したら、ターミナルで開発サーバーを **再起動** してください。

```bash
# Ctrl+C で停止してから
npm run dev
```

---

## ステップ 4: SQL マイグレーションを実行する

1. Supabase ダッシュボードの左サイドバーで **SQL Editor** をクリック
2. 右上の **New query** をクリック
3. 以下のファイルの内容を **全てコピー** してエディタに貼り付ける

   ```
   /Users/gakuto/Documents/pokelog/supabase/migrations/001_init.sql
   ```

4. **RUN（または Ctrl+Enter）** をクリックして実行
5. 画面下部に `Success. No rows returned` と表示されれば成功

   > エラーが出た場合は、エラーメッセージをそのまま Claude に貼り付けてください。

---

## ステップ 5: テーブルが作成されたか確認する

1. Supabase ダッシュボードの左サイドバーで **Table Editor** をクリック
2. 以下の 3 つのテーブルが存在していれば OK

   - `parties`
   - `pokemon_members`
   - `battles`

---

## ステップ 6: 動作確認

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、以下を確認してください。

- [ ] PokeLog のホーム画面が表示される
- [ ] 画面下部にナビゲーションバー（🏠 / 📋 / 📊）が表示される
- [ ] ブラウザの開発者ツール（F12）のコンソールにエラーが出ていない

---

## 完了後の次のステップ

セットアップが完了したら、以下の実装に進みます。

| PR | 内容 |
|----|------|
| PR-01 | ホーム画面（勝率サマリー・最近の対戦） |
| PR-02 | パーティ管理画面 |
| PR-03 | 対戦入力画面 |
| PR-04 | 対戦履歴・詳細画面 |
| PR-05 | レポート画面 |

---

## トラブルシューティング

**`Error: Invalid API key` が出る場合**
→ `.env.local` の `SUPABASE_SERVICE_ROLE_KEY` が正しいか確認。コピー時に末尾のスペースが混入していないか確認。

**SQL 実行時に `permission denied` が出る場合**
→ Supabase の SQL Editor ではなく、**Table Editor → Run SQL** から実行してみる。

**テーブルが見つからないと言われる場合**
→ ステップ 4 の SQL 実行が完了しているか確認。Supabase ダッシュボードをリロードする。
