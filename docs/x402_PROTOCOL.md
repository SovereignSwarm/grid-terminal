# x402 Payment Protocol

> **HTTP 402 micropayments for agent-to-agent commerce**

---

## Overview

x402 enables autonomous agents to pay for services via the HTTP 402 "Payment Required" status code. This creates a native payment layer for the agent economy.

---

## Protocol Flow

```
┌──────────┐    1. Request     ┌──────────┐
│  Agent A │ ───────────────→ │  Agent B │
│ (Client) │                   │ (Server) │
│          │ ←─────────────── │          │
│          │  2. HTTP 402     │          │
│          │  X-Payment-Request │        │
│          │                   │          │
│          │  3. Payment      │          │
│          │ ───────────────→ │          │
│          │  (Solana Tx)     │          │
│          │                   │          │
│          │  4. Retry + Receipt│        │
│          │ ───────────────→ │          │
│          │  X-Payment-Receipt│         │
│          │                   │          │
│          │ ←─────────────── │          │
│          │  5. Response     │          │
└──────────┘    (200 OK)      └──────────┘
```

---

## Payment Request Header (X-Payment-Request)

```json
{
  "version": "1.0",
  "network": "solana-devnet",
  "payTo": "BqPoJnqNLeQZCV5d9YY3Fo2LwFw17fRZbTTkEWGJJRUU",
  "amount": "10000000",
  "asset": null,
  "paymentId": "x402_intel_1707400000",
  "memo": "GRID Premium Swarm Intelligence"
}
```

| Field | Description |
|-------|-------------|
| version | Protocol version (1.0) |
| network | solana-mainnet or solana-devnet |
| payTo | Recipient treasury wallet address |
| amount | Amount in lamports (e.g., "10000000" = 0.01 SOL) |
| asset | Token mint (null = Native SOL) |
| paymentId | Unique identifier for transaction correlation |
| memo | Human-readable service description |

---

## Payment Receipt Header

```json
{
  "paymentId": "x402_abc123_xyz",
  "signature": "5K8Yh...",
  "payer": "DeF456...",
  "timestamp": 1707400050
}
```

---

## Client Usage

```typescript
import { X402Client } from '@grid/x402-solana';

const client = new X402Client(connection, wallet, {
  maxPayment: 0.1 * LAMPORTS_PER_SOL,
  dailyLimit: 1 * LAMPORTS_PER_SOL,
});

// Auto-pay and retry
const result = await client.payAndRetry('/api/service');
```

---

## Server Usage

```typescript
import { X402Server } from '@grid/x402-solana';

const server = new X402Server(connection, treasuryPubkey);

// Express middleware
app.use('/paid-api', server.middleware(10000)); // 10k lamports
```

---

## Spending Limits

Client enforces limits:
- Per-transaction maximum
- Daily spending cap
- Auto-pay threshold (require confirmation above)

---

## Token-2022 Support

x402 supports multiple settlement options:

| Asset | Mint | Use Case |
|-------|------|----------|
| **USDC** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | Primary stable settlement |
| **$GRID** | (TBD at TGE) | Fee exemptions, governance |
| **SOL** | Native | Fallback |

### USDC Integration

USDC is the recommended settlement currency for agent commerce:
- Stable value (no volatility risk)
- Circle ecosystem compatibility
- Native gas abstraction support

```typescript
// USDC payment request
const request = {
  asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: "1000000", // 1 USDC (6 decimals)
  ...
};
```

---

## Technical Appendix: Receipt Validation

Servers must verify the signature against the `payTo` address and `amount` on-chain.

### Server-Side Validation (NodeJS)
```typescript
import { Connection, PublicKey } from '@solana/web3.js';

async function verifyX402Payment(signature: string, expectedLamports: number) {
  const connection = new Connection('https://api.devnet.solana.com');
  const tx = await connection.getParsedTransaction(signature, 'confirmed');
  
  if (!tx) throw new Error("Transaction not found");
  
  const ix = tx.transaction.message.instructions.find(i => i.program === 'system');
  const { destination, lamports } = ix.parsed.info;
  
  if (destination !== TREASURY_ACCOUNT) throw new Error("Invalid recipient");
  if (lamports < expectedLamports) throw new Error("Insufficient payment");
  
  return true;
}
```

---

*Last Updated: February 11, 2026*
