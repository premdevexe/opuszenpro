# OpusZenPro — Claude LLM Proxy & High-Capacity API Gateway

[![Domain](https://img.shields.io/badge/Live%20Domain-opuszen.pro-orange?style=flat-square)](https://opuszen.pro)
[![CLI](https://img.shields.io/badge/CLI-npx%20opuszenpro-amber?style=flat-square)](https://opuszen.pro/docs)
[![Anthropic API](https://img.shields.io/badge/API-Anthropic%20v1%20Compatible-blue?style=flat-square)](https://opuszen.pro/v1/models)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel%20Edge%20%2B%20Serverless-black?style=flat-square)](https://opuszen.pro)

**OpusZenPro** (`https://opuszen.pro`) is an ultra-low latency, drop-in Anthropic Claude API Gateway and developer platform. It provides high-capacity 5-hour rolling quota windows, unbuffered Server-Sent Events (SSE) streaming, zero-overhead prompt caching, real-time key inspection, and a 1-step interactive terminal setup CLI (`npx opuszenpro`).

---

## ⚡ 1-Step Instant Setup

Configure your entire local development environment (Claude Code CLI, Cursor IDE, Windsurf, Cline, shell environment) with a single command:

```bash
npx opuszenpro
```

The interactive CLI prompts for your OpusZenPro API key and automatically writes your configuration into:
- `~/.claude/settings.json` (Claude Code CLI)
- Cursor IDE model settings
- Current terminal session exports

---

## 🌟 Key Features

1. **Drop-in Anthropic Compatibility (`https://opuszen.pro/v1`)**:
   - 100% 1:1 passthrough for `/v1/messages`, `/v1/models`, and `/v1/chat/completions`.
   - Compatible with official `@anthropic-ai/sdk`, Anthropic Python SDK, OpenAI SDK, Claude Code, Cursor, Windsurf, Cline, and Roo Code.

2. **Ultra-Low Latency & Unbuffered SSE Streaming**:
   - Zero-buffering Server-Sent Events stream tokens straight from upstream to client with sub-20ms initial chunk delivery.

3. **5-Hour Rolling Window Quota Engine**:
   - Quotas reset 5 hours from your first request — no arbitrary 24-hour lockouts or calendar midnight cliffs.

4. **Real-Time Key Inspector API (`/api/key-status`)**:
   - Query key balances, rolling window token limits, countdown to reset, allowed model IDs, and node health in real-time.

5. **100% Free Prompt Caching Reads**:
   - Upstream cache reads are forwarded at zero quota burn against your rolling window.

6. **Interactive Claude Playground**:
   - Test prompts against Claude 3.7 Sonnet (Hybrid Reasoning), Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3.5 Haiku with live streaming metrics.

7. **Production Multi-Tier Rate Limiting**:
   - IP-based sliding window protection with resilient fail-safe error boundaries.

---

## 🚀 Quick Integration

### 1. Claude Code CLI

Add to `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
    "ANTHROPIC_BASE_URL": "https://opuszen.pro/v1",
    "ANTHROPIC_MODEL": "claude-3-7-sonnet-20250219",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-3-7-sonnet-20250219",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "hasCompletedOnboarding": true
}
```

Or run:
```bash
export ANTHROPIC_BASE_URL="https://opuszen.pro/v1"
export ANTHROPIC_API_KEY="YOUR_API_KEY"
claude
```

---

### 2. Cursor IDE

In **Cursor Settings** (`Cmd+,` or `Ctrl+,`) → **Models** → **Anthropic API Key**:
- **Override Base URL**: `https://opuszen.pro/v1`
- **Anthropic API Key**: `YOUR_API_KEY`
- **Model Names**: `claude-3-7-sonnet-20250219, claude-3-5-sonnet-20241022, claude-3-opus-20240229`

---

### 3. Python SDK (`anthropic`)

```python
import anthropic

client = anthropic.Anthropic(
    api_key="YOUR_API_KEY",
    base_url="https://opuszen.pro/v1",  # OpusZenPro Gateway
)

message = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Explain distributed consensus in one paragraph."}
    ],
)

print(message.content[0].text)
```

---

### 4. TypeScript / Node.js SDK (`@anthropic-ai/sdk`)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'https://opuszen.pro/v1',
});

const response = await anthropic.messages.create({
  model: 'claude-3-7-sonnet-20250219',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Write a TypeScript quicksort.' }],
});

console.log(response.content[0]);
```

---

### 5. cURL

```bash
curl https://opuszen.pro/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Hello from OpusZenPro!" }
    ]
  }'
```

---

### 6. OpenAI SDK Drop-in

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://opuszen.pro/v1",
)

response = client.chat.completions.create(
    model="claude-3-7-sonnet-20250219",
    messages=[{"role": "user", "content": "Hello from OpenAI client!"}],
)

print(response.choices[0].message.content)
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/v1/messages` | Standard Anthropic Messages API with SSE streaming |
| `GET` | `/v1/models` | List all active supported models |
| `POST` | `/v1/chat/completions` | OpenAI-compatible chat completion proxy |
| `POST` / `GET` | `/api/key-status` | Real-time key inspection & 5-hour rolling quota balance |
| `GET` | `/api/status` | Gateway latency & cluster health |
| `GET` | `/api/health` | Service health status |

---

## 🛠️ Development & Local Run

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/premdevexe/opuszenpro.git
cd opuszenpro

# Install all dependencies
npm run install:all

# Configure environment variables
cp .env.example .env

# Start dev server (Vite frontend on :5173 + Express gateway on :5000)
npm run dev
```

---

## 🌐 Production Deployment

The gateway is built for serverless or edge deployments on **Vercel**:

- Apex Domain: `https://opuszen.pro`
- Gateway Base: `https://opuszen.pro/v1`
- Vercel Serverless Functions: `api/index.js` wraps the Express gateway and proxies requests transparently.

```bash
vercel --prod
```

---

## 📄 License

MIT © OpusZenPro Team
