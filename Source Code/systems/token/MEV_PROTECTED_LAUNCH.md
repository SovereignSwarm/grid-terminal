# MEV-Protected Launch Guide

> **Objective:** Prevent sandwich attacks and sniping during $GRID token launch

## The Threat

Without MEV protection, bots will:
1. **Front-run pool creation:** Buy immediately after pool appears
2. **Sandwich the first buyers:** Extract value from community
3. **Snipe genesis window:** Bypass genesis tax using block prediction

---

## Jito Bundle Launch Strategy

### What is Jito?
Jito provides MEV-protected transaction bundles on Solana:
- Transactions executed atomically
- Not visible in public mempool
- Include tip for validator priority

### Installation

```bash
npm install jito-ts @solana/web3.js
```

### Launch Bundle Script

```typescript
import { Connection, Keypair, Transaction } from '@solana/web3.js';
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';

const JITO_BLOCK_ENGINE = 'https://mainnet.block-engine.jito.wtf';

async function mevProtectedLaunch() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const deployer = Keypair.fromSecretKey(/* load from secure location */);
  
  // Create all launch transactions
  const txs = [
    await createPoolTransaction(connection, deployer),
    await addLiquidityTransaction(connection, deployer),
    await unfreezeTokenTransaction(connection, deployer),
  ];
  
  // Connect to Jito
  const client = searcherClient(JITO_BLOCK_ENGINE);
  
  // Create bundle
  const bundle = {
    transactions: txs.map(tx => tx.serialize()),
    // Tip 0.01 SOL for priority
    tipLamports: 10_000_000,
  };
  
  // Submit bundle
  const result = await client.sendBundle(bundle);
  console.log('Bundle submitted:', result.bundleId);
  
  // Wait for confirmation
  const status = await client.getBundleStatuses([result.bundleId]);
  console.log('Bundle status:', status);
}
```

---

## Launch Sequence

### Phase 1: Preparation (T-1 hour)
1. ✅ Verify all program deployments
2. ✅ Test Jito connection
3. ✅ Pre-sign all transactions
4. ✅ Fund deployer wallet (extra for tips)

### Phase 2: Bundle Creation (T-10 min)
1. Create pool creation tx
2. Create liquidity add tx
3. Create token unfreeze tx
4. Bundle all transactions

### Phase 3: Launch (T-0)
1. Submit Jito bundle
2. Monitor for inclusion
3. Verify on Solscan
4. Announce to community (after confirmation)

---

## Backup RPC Configuration

```typescript
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',  // Primary
  'https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY',  // Backup 1
  'https://rpc.helius.xyz/?api-key=YOUR_KEY',  // Backup 2
  'https://solana-mainnet.quiknode.pro/YOUR_KEY',  // Backup 3
];

async function getHealthyConnection() {
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(rpc);
      await conn.getSlot();
      return conn;
    } catch {
      console.warn(`RPC ${rpc} unhealthy, trying next...`);
    }
  }
  throw new Error('All RPCs unhealthy');
}
```

---

## Additional MEV Protections

### 1. Private Launch Window (Optional)
```
Block 0-10: Whitelisted wallets only
Block 11+: Public trading
```

### 2. Decaying Launch Fee (Already Implemented)
```
Block 1: 50% fee (deters bots)
Block 150: 2% fee (normal trading)
```

### 3. Max Transaction Size
```typescript
// Limit first-block purchases
const MAX_FIRST_BLOCK_BUY = 1_000_000; // 0.1% of supply
```

---

## Cost Estimate

| Item | Cost |
|------|------|
| Jito tip (priority) | 0.01-0.05 SOL |
| Pool creation | 0.3 SOL |
| Initial liquidity | 2.0 SOL |
| Buffer | 1.0 SOL |
| **Total** | **3.35-3.39 SOL** |

---

## Verification

After launch, verify:
- [ ] Pool created in single block
- [ ] No front-run transactions before pool
- [ ] Genesis tax active (check first trades)
- [ ] Liquidity correct

---

**Status:** 🟢 GUIDE COMPLETE  
**Created:** 2026-02-08
