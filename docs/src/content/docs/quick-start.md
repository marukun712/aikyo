---

title: Quick Start Guide
description: The simplest way to get started with aikyo

---

`aikyo` is a framework for building AI companions that interact peer-to-peer.

# 1 Setup

## 1.1 Clone the Template

```bash
git clone https://github.com/akazdayo/aikyo-template.git
cd aikyo-template
pnpm install
```

## 1.2 Configure Environment Variables

By default, Anthropic is set, but you can also use other API providers by editing the companion card.

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

# 2 Run the Application

```bash
pnpm run dev
```

```bash
$ pwd
/home/akazdayo/projects/aikyo-template

$ cat example-request.json | jq -cM . | websocat ws://localhost:8080
```
