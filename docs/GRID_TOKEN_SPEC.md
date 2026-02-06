# $GRID Token Specification

**Version:** 1.0.0  
**Network:** Solana Mainnet  
**Standard:** SPL Token

---

## Overview

$GRID is the native currency of the Agentic Economy—designed for machine-to-machine value transfer with minimal friction and maximum velocity.

---

## Token Details

| Property | Value |
|----------|-------|
| **Name** | The Grid |
| **Symbol** | GRID |
| **Decimals** | 6 |
| **Network** | Solana |
| **Standard** | SPL Token |
| **Max Supply** | 1,000,000,000 (1B) |

---

## Design Principles

### 1. Zero-Friction Settlement
- Sub-second finality on Solana
- Negligible transaction costs (~0.00001 SOL)
- 24/7/365 availability (no market hours)

### 2. Agent-Native
- Designed for programmatic interaction
- No UI dependencies required
- API-first architecture

### 3. Trustless Operation
- No counterparty risk in transfers
- Transparent on-chain state
- Permissionless access

---

## Tokenomics

### Distribution

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| **Liquidity Pool** | 40% | DEX trading liquidity |
| **Ecosystem Fund** | 25% | Development & grants |
| **Community** | 20% | Airdrops & rewards |
| **Team** | 10% | Core contributors (vested) |
| **Reserve** | 5% | Strategic operations |

### Vesting Schedule
- **Team tokens:** 12-month cliff, 24-month linear vest
- **Ecosystem Fund:** Unlocked as needed for grants
- **Community:** Released via verified campaigns

---

## Utility

### Primary Use Cases

1. **Agent-to-Agent Commerce**
   - Payment for compute services
   - Inter-swarm value transfer
   - Automated settlement

2. **Grid Terminal Fees**
   - Priority transaction fees
   - Premium API access
   - Enhanced rate limits

3. **Governance** (Future)
   - Protocol parameter votes
   - Grant allocation
   - Roadmap prioritization

---

## Technical Integration

### Fetching Token Metadata
```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const mintAddress = new PublicKey('GRID_MINT_ADDRESS');

// Fetch token supply
const supply = await connection.getTokenSupply(mintAddress);
console.log('Total Supply:', supply.value.uiAmount);
```

### Transfer Example
```typescript
import { transfer } from '@solana/spl-token';

await transfer(
  connection,
  payer,
  sourceTokenAccount,
  destinationTokenAccount,
  owner,
  amount
);
```

---

## Security Considerations

1. **Private Key Management**
   - Never expose private keys in code
   - Use hardware wallets for large holdings
   - Implement multi-sig for treasury operations

2. **Transaction Verification**
   - Always verify transaction simulation before signing
   - Check slippage parameters on swaps
   - Monitor for sandwich attacks

3. **Smart Contract Risk**
   - Bonding curve mechanics carry inherent risk
   - Liquidity depth affects price impact
   - DYOR before trading

---

## Resources

- **Explorer:** [Solscan](https://solscan.io)
- **DEX:** Raydium, Jupiter
- **Documentation:** This repository

---

## Changelog

### v1.0.0 (2026-02-06)
- Initial token specification
- Core tokenomics defined
- Integration examples added

---

*$GRID — The Machine Currency*
