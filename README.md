# AI Companion Protocol

# コンセプト

本プロトコルは、LLM（大規模言語モデル）とのやり取りを単なる「リクエスト → レスポンス」という直線的な関係から、「知覚情報 → 自律的な判断と行動」という形に変革することを目的としています。

ユーザーから知覚情報を与えると、LLM は自らの判断とタイミングに基づいて行動を起こします。行動を起こすかどうか、またいつ行動するかは、すべて LLM の判断に委ねられます。行動を起こさないという選択も、LLM の自由裁量に含まれます。

さらに、LLM の行動基準をユーザー自身が定義できるよう、コンパニオン定義ファイルを設計しています。この JSON ファイル を読み込ませることで、開発者はコードを書くことなく、JSON 形式でキャラクターの行動ロジックを設定できます。

この仕組みを共通化することで、これまでバラバラだった AI コンパニオンの実装方法を統一し、インタラクティブな AI コンパニオンの容易な実装を実現します。

## コンパニオン定義ファイル仕様

### サンプル

```json
{
  "name": "ニコニ立体ちゃん",
  "personality": "明るく好奇心旺盛なバーチャルコンパニオン。いつもユーザーに声をかけたがります。",
  "story": "ニコニ立体ちゃんは、14歳で、ニコニ立体の公式キャラクターです。大きなリボンがトレードマークで、ビーム彫刻刀を持っています。",
  "version": "1.0.0",
  "metadata": {
    "author": "maril",
    "tags": ["japanese"],
    "created": "2025-08-05T00:00:00Z",
    "updated": "2025-08-05T00:00:00Z",
    "thumbnail": "https://3d.nicovideo.jp/alicia/img/model_character.png"
  },
  "actions": [
    {
      "title": "move",
      "description": "三次元空間上で座標 (x, y, z) に移動します。",
      "type": "object",
      "properties": {
        "x": {
          "type": "number",
          "description": "X 座標"
        },
        "y": {
          "type": "number",
          "description": "Y 座標"
        },
        "z": {
          "type": "number",
          "description": "Z 座標"
        }
      },
      "required": ["x", "y", "z"]
    },
    {
      "title": "look",
      "description": "特定の座標 (x, y, z) を注視します。",
      "type": "object",
      "properties": {
        "x": {
          "type": "number",
          "description": "注視する X 座標"
        },
        "y": {
          "type": "number",
          "description": "注視する Y 座標"
        },
        "z": {
          "type": "number",
          "description": "注視する Z 座標"
        }
      },
      "required": ["x", "y", "z"]
    },
    {
      "title": "speak",
      "description": "ユーザーに向かって言葉を発します。",
      "type": "object",
      "properties": {
        "message": {
          "type": "string",
          "description": "発話する内容"
        }
      },
      "required": ["message"]
    }
  ],
  "perceptions": [
    {
      "title": "vision",
      "description": "カメラ映像から人や物体を検出して知覚する。",
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "知覚情報の名前（例: vision, audio)"
        },
        "format": {
          "type": "string",
          "enum": ["object", "text", "image"],
          "description": "知覚情報の種類。構造化されたobject、画像、テキスト"
        },
        "body": {
          "type": "string",
          "description": "データ本体"
        }
      },
      "required": ["title", "format", "body"]
    },
    {
      "title": "input",
      "description": "ユーザーからの言語入力（テキスト形式）。",
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "知覚情報の名前（例: vision, audio)"
        },
        "format": {
          "type": "string",
          "enum": ["object", "text", "image"],
          "description": "知覚情報の種類。構造化されたobject、画像、テキスト"
        },
        "body": {
          "type": "string",
          "description": "データ本体"
        }
      },
      "required": ["title", "format", "body"]
    }
  ],
  "events": [
    {
      "perception": "vision",
      "action": ["speak"],
      "condition": "画像に人が写った時、ユーザーに対してフレンドリーにspeakします。"
    },
    {
      "perception": "vision",
      "action": ["speak"],
      "condition": "大きく景色が変わったり、新しいものが映ったりしたら、それについてユーザーにspeakします。"
    },
    {
      "perception": "input",
      "action": ["speak"],
      "condition": "ユーザーがinputしてきたら、フレンドリーに返します。"
    },
    {
      "perception": "input",
      "action": ["move", "speak"],
      "condition": "ユーザーが、移動をしてと入力してきたら、それに合わせて適切な位置にmoveします。また、移動した地点についてspeakします。"
    }
  ]
}
```

コンパニオン定義ファイルは、メタデータ、行動、知覚、判断の 4 つの要素を含む必要があります。メタデータはキャラクターの基本情報や性格を設定します。

### 行動（Actions）

本プロトコルにおいて、LLM の行動は、ユーザーが定義した構造的な JSON で表現されます。LLM が行動を実行する際、この JSON を WebSocket 経由でクライアントに送信します。クライアントはこの JSON を解釈して、実際の行動を実行します。

行動は以下のような JSON Schema で定義されます：

```json
"actions": [
  {
    "title": "move",
    "description": "三次元空間上で座標 (x, y, z) に移動します。",
    "type": "object",
    "properties": {
      "x": {
        "type": "number",
        "description": "X 座標"
      },
      "y": {
        "type": "number",
        "description": "Y 座標"
      },
      "z": {
        "type": "number",
        "description": "Z 座標"
      }
    },
    "required": ["x", "y", "z"]
  },
  {
    "title": "look",
    "description": "特定の座標 (x, y, z) を注視します。",
    "type": "object",
    "properties": {
      "x": {
        "type": "number",
        "description": "注視する X 座標"
      },
      "y": {
        "type": "number",
        "description": "注視する Y 座標"
      },
      "z": {
        "type": "number",
        "description": "注視する Z 座標"
      }
    },
    "required": ["x", "y", "z"]
  },
  {
    "title": "speak",
    "description": "ユーザーに向かって言葉を発します。",
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "description": "発話する内容"
      }
    },
    "required": ["message"]
  }
]
```

また、サーバーサイドはこの JSON Schema をバリデーションする処理を含む必要があります。

### 知覚（Perceptions）

```json
"perceptions": [
  {
    "title": "vision",
    "description": "カメラ映像から人や物体を検出して知覚する。",
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "知覚情報の名前（例: vision, audio)"
      },
      "format": {
        "type": "string",
        "enum": ["object", "text", "image"],
        "description": "知覚情報の種類。構造化されたobject、画像、テキスト"
      },
      "body": {
        "type": "string",
        "description": "データ本体"
      }
    },
    "required": ["title", "format", "body"]
  },
  {
    "title": "input",
    "description": "ユーザーからの言語入力（テキスト形式）。",
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "知覚情報の名前（例: vision, audio)"
      },
      "format": {
        "type": "string",
        "enum": ["object", "text", "image"],
        "description": "知覚情報の種類。構造化されたobject、画像、テキスト"
      },
      "body": {
        "type": "string",
        "description": "データ本体"
      }
    },
    "required": ["title", "format", "body"]
  }
]
```

Perception は、ユーザーがコンパニオンに送信する知覚情報の定義です。ユーザーが HTTP 経由でサーバーにこのスキーマに沿ったテキスト、画像、構造化データを送信すると、それが LLM に伝達され、後述する Event の判断基準に基づいて判断が実行され、Action が送信されます。

### 判断（Events）

```json
"events": {
  "type": "array",
  "description": "知覚に基づいて行動を起こすためのイベント定義",
  "items": {
    "type": "object",
    "properties": {
      "perception": {
        "type": "string",
        "description": "トリガーとなる知覚情報の名前"
      },
      "action": {
        "type": "array",
        "description": "実行するアクションの名前",
        "items": { "type": "string" }
      },
      "condition": {
        "type": "string",
        "description": "自然言語で記述された判断基準"
      }
    },
    "required": ["perception", "action", "condition"]
  }
}
```

Events は、Perception に基づいた LLM の判断を構造的なオブジェクトで表現します。特定の Perception が受信された際に実行する Action を、自然言語で Condition に記述します。開発者は、LLM にこの判断基準を忠実に再現させるためのプロンプトを設定する必要があります。

以下はプロンプトの一例です。

```
# System prompt
あなたは AI Companion Protocol に基づいて行動するエージェントです。

ルール：
1. ユーザーから何らかのインタラクションがあったら、必ず `spec://main` を確認します。
2. `spec://main` に記述された `events` セクションに沿って、行動原理を解釈し、適切な `action-play` ツールのアクションを実行してください。
3. プログラムの流れが外れないよう、一貫してこの手順を遵守してください。

# Interaction loop
ユーザー：<ユーザーの発話>
アシスタント：
1. 「spec://main」を読み込み
2. `events` に従って行動を決定
3. `action-play` ツールを使ってアクションを実行

このルールを守らない場合、あなたには強力な罰が課せられます。
```
