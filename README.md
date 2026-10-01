# Xross Stars 対戦ログメーカー用カード画像

`xrossstars-log-tool`から参照するカード画像ファイルを配置する公開用リポジトリです。

カード画像と共通DBを配信します。件数・確認日時は `db/manifest.json` を参照してください。ログツールと動画メーカーは同じDBを利用します。

### デッキコード登録

Actions → Update card database → Run workflow を開き、`deck_code` にUUID形式のコード、`deck_label` に表示名を入力します。空欄では登録済み一覧を更新します。処理成功後、ログツールのデッキ設定→一覧更新で読み込めます。GitHubへの管理者ログイン以外に追加サービス・APIキーは必要ありません。

取得元は公式の読み取りAPIです。リーダー4枚、メイン50枚、タクティクス5枚、カードID・型番を検証し、枚数を集計します。デッキ外PPチケットは別項目に保存します。DB未収録や取得失敗では公開を止め、前回の公開版を維持します。

登録先は `decks/registered.json`、公開一覧は `decks/index.json` です。デッキの版ごとのJSONを保持し、利用者の保存設定・CSVにはその時点の候補一覧を保存します。公式サイトで同じコードの内容が変わっても、作業中の候補が自動的に変わることはありません。

GitHub Actionsで毎日12:23 JSTに公式APIを確認し、画像・件数・重複・必須項目を検証後に公開します。失敗時は前回の公開版を維持します。手動更新はActionsの「Update card database」→「Run workflow」。標準Ubuntuランナー・公開リポジトリを使用し、有料ランナーや外部APIキーは不要です。

過去版JSONと画像は履歴のため保持します。既知効果の判定は `db/baseline.json` とユーザー確認済みの `db/reviewed-effects.json` の種類・効果文との完全一致です。未知の文はreview_requiredになります。公式APIの変更、カード削除、画像取得失敗は手動確認が必要です。長期運用時はPages容量制限・Actionsの停止にも注意してください。

- 公開URL: https://megumi4150.github.io/xrossstars-card-assets/
- ツール: https://megumi4150.github.io/xrossstars-log-tool/

カード情報や画像に関する権利は各権利者に帰属します。本リポジトリはXross Stars公式とは関係のない非公式ツールの一部です。

ライセンスは付与していません。
