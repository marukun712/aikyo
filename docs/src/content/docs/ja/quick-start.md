---

title: クイックスタート
description: aikyoを最も簡単に始める

---

`aikyo`は、P2Pで相互に作用するAIコンパニオンを構築するためのフレームワークです。

# 1 セットアップ

## 1.1 テンプレートをクローン

```bash
git clone https://github.com/akazdayo/aikyo-template.git
cd aikyo-template
pnpm install
```

## 1.2 環境変数を設定

デフォルトでAnthropicが設定されていますが、コンパニオンカードを編集することで他のAPIプロバイダーを使用することも可能です。

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

# 2 実行

```bash
pnpm run dev
```

```bash
$ pwd
/home/akazdayo/projects/aikyo-template

$ cat example_request.json | jq -cM . | websocat ws://localhost:8080
```
