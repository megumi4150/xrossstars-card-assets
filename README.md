# Xross Stars 対戦ログメーカー用カード画像

`xrossstars-log-tool`から参照するカード画像ファイルを配置する公開用リポジトリです。

カード画像と共通DBを配信します。件数・確認日時は `db/manifest.json` を参照してください。ログツールと動画メーカーは同じDBを利用します。

GitHub Actionsで毎日12:23 JSTに公式APIを確認し、画像・件数・重複・必須項目を検証後に公開します。失敗時は前回の公開版を維持します。手動更新はActionsの「Update card database」→「Run workflow」。標準Ubuntuランナー・公開リポジトリを使用し、有料ランナーや外部APIキーは不要です。

過去版JSONと画像は履歴のため保持します。既知効果の判定は `db/baseline.json` とユーザー確認済みの `db/reviewed-effects.json` の種類・効果文との完全一致です。未知の文はreview_requiredになります。公式APIの変更、カード削除、画像取得失敗は手動確認が必要です。長期運用時はPages容量制限・Actionsの停止にも注意してください。

- 公開URL: https://megumi4150.github.io/xrossstars-card-assets/
- ツール: https://megumi4150.github.io/xrossstars-log-tool/

カード情報や画像に関する権利は各権利者に帰属します。本リポジトリはXross Stars公式とは関係のない非公式ツールの一部です。

ライセンスは付与していません。
