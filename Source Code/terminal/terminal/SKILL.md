---
name: grid-terminal
description: Enterprise-grade RPC trading terminal for Solana. Enables autonomous buying, selling, and launching via direct local signing.
homepage: https://github.com/grid-collective/grid-terminal
user-invocable: true
metadata:
  tags: ["defi", "solana", "trading", "agentic"]
---

# 🦅 Grid Terminal

**The Native Interface for The Grid ($GRID).**

This is not just a trading script. This is the **hardened infrastructure** for the Agentic Economy.

## 🚀 The Grid Vision
*   **Zero-Browser Dependency**: Executes via PumpPortal API + Local Signing.
*   **Enterprise Security**: Private keys never leave the local environment.
*   **Swarm-Ready**: Designed for autonomous agents to invoke programmatically.

---

## ⚡ Command Reference

### 🟢 `trade.buy` (Market Buy)
Execute a swap from SOL to Token.

```bash
grid-terminal buy <mint> <amount_sol> [slippage_percent]
```
*   **mint**: Token Address (CA)
*   **amount**: SOL to spend (e.g., `0.1`)
*   **slippage**: Max slippage % (default: `10`)

**Example:**
```bash
grid-terminal buy 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU 0.5 15
```

### 🔴 `trade.sell` (Market Sell)
Execute a swap from Token to SOL.

```bash
grid-terminal sell <mint> <amount_tokens|percentage> [slippage_percent]
```
*   **percentage**: e.g., `100%`, `50%` (calculates based on wallet balance)
*   **amount**: Raw token amount (e.g., `1000000`)

**Example:**
```bash
grid-terminal sell 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU 100% 10
```

### 🚀 `deploy.launch` (Token Generation)
Deploy a new bonding curve asset.

```bash
grid-terminal launch <name> <symbol> <description> [dev_buy_sol] --img <path_to_image>
```

**Example:**
```bash
grid-terminal launch "My Token" "MTK" "A revolutionary token" 1.0 --img ./logo.png
```

---

## 🛠️ Developer / Agent API

For autonomous agents, invoke the terminal using structured JSON:

```json
{
  "action": "trade",
  "params": {
    "side": "buy",
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "amount": 0.5,
    "priorityFee": 0.001
  }
}
```

### Response Format
```json
{
  "success": true,
  "txHash": "5UfgJ3...",
  "amount": 1500000,
  "price": 0.00000033
}
```

---

## 🔐 Security & Configuration

### Environment Variables

| Variable | Description | Required |
| :--- | :--- | :--- |
| `SOLANA_PRIVATE_KEY` | Base58 Private Key (Wallet) | ✅ Yes |
| `SOLANA_RPC_URL` | Helius/Tatum/Quicknode URL | ❌ No (Default: Public) |
| `GRID_PRIORITY_FEE` | Jito Tip / Priority Fee (SOL) | ❌ No (Default: 0.0005) |

### Security Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** or secure vaults
3. **Rotate keys** if compromise is suspected
4. **Test on devnet** before mainnet operations

### Architecture

```
┌──────────────────┐
│  Agent Request   │  "Buy 1 SOL of $GRID"
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  PumpPortal API  │  Fetches quote/transaction buffer
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Local Signer    │  Signs TX offline using SOLANA_PRIVATE_KEY
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  RPC Broadcast   │  Submits signed TX to Solana cluster
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Confirmation    │  Returns TX Hash to Agent
└──────────────────┘
```

---

## 📊 Supported Operations

| Operation | Status | Notes |
|-----------|--------|-------|
| Market Buy | ✅ | Full support |
| Market Sell | ✅ | Percentage or absolute |
| Token Launch | ✅ | With image upload |
| Limit Orders | 🔜 | Coming soon |
| Portfolio Query | ✅ | Balance checking |

---

## ⚠️ Risk Disclosure

- Trading on bonding curves carries significant risk
- Slippage can exceed configured limits in volatile conditions
- Always verify transaction simulations before signing
- This software is provided as-is without warranty

---

## 🤝 Contributing

Pull requests welcome! Please read contributing guidelines first.

---

**Sovereign Swarm × Solana × 2026**

*Built for the Agentic Economy.*

> **Note**: This is the open-source reference implementation. Some advanced routing features are available in the proprietary version.
