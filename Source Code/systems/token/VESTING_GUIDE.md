# On-Chain Vesting Guide for $GRID

> **Critical:** All vested allocations MUST use on-chain enforcement

## Vesting Schedule Summary

| Allocation | Amount | Cliff | Linear | Platform |
|------------|--------|-------|--------|----------|
| Founder (7.5%) | 80.5M | 6 months | 18 months | Streamflow |
| Team (2.5%) | 26.8M | 6 months | 18 months | Streamflow |
| Presale (20%) | 214.7M | 6 months | 12 months | Streamflow |

---

## Streamflow Setup

### Why Streamflow?
- On-chain enforcement (no trust required)
- Token-2022 compatible
- Cliff + linear release support
- Public verification

### Creating Vesting Contracts

#### 1. Install Streamflow SDK
```bash
npm install @streamflow/stream
```

#### 2. Create Founder Vesting
```typescript
import { StreamflowSolana, Types } from "@streamflow/stream";

const client = new StreamflowSolana.SolanaStreamClient(
  "https://api.mainnet-beta.solana.com"
);

const founderVesting = {
  // Recipient
  recipient: "FOUNDER_WALLET_ADDRESS",
  
  // Amount (with decimals)
  depositedAmount: new BN(80_530_636 * 10**9), // 80.5M tokens
  
  // Token mint
  mint: "GRID_MINT_ADDRESS",
  
  // Cliff: 6 months (in seconds)
  cliff: 6 * 30 * 24 * 60 * 60, // ~15,552,000 seconds
  
  // Total duration: 24 months (6 cliff + 18 linear)
  period: 24 * 30 * 24 * 60 * 60,
  
  // Release frequency: monthly
  cliffAmount: new BN(0), // Nothing at cliff, then linear
  amountPerPeriod: new BN(80_530_636 * 10**9 / 18), // Split over 18 months
  
  // Settings
  name: "GRID Founder Vesting",
  cancelableBySender: false,  // IMMUTABLE!
  cancelableByRecipient: false,
  transferableBySender: false,
  transferableByRecipient: false,
  automaticWithdrawal: false,
};

const { tx, id } = await client.create(founderVesting, wallet);
console.log("Founder vesting created:", id);
```

#### 3. Create Team Vesting
```typescript
const teamVesting = {
  recipient: "TEAM_WALLET_ADDRESS",
  depositedAmount: new BN(26_843_546 * 10**9),
  mint: "GRID_MINT_ADDRESS",
  cliff: 6 * 30 * 24 * 60 * 60,
  period: 24 * 30 * 24 * 60 * 60,
  cliffAmount: new BN(0),
  amountPerPeriod: new BN(26_843_546 * 10**9 / 18),
  name: "GRID Team Vesting",
  cancelableBySender: false,
  cancelableByRecipient: false,
  transferableBySender: false,
  transferableByRecipient: false,
};
```

---

## Token Distribution Flow

### Before TGE
```
1. Create GRID mint (Token-2022)
2. Mint total supply to Treasury PDA
3. Create Streamflow vesting contracts
4. Transfer vested amounts to Streamflow
5. Verify contracts on Streamflow dashboard
```

### At TGE
```
6. Create Raydium LP with LP allocation
7. Lock LP in Streamflow (12 months)
8. Announce vesting contract addresses
```

---

## Verification

### Public Links
Publish these after creation:
- Founder vesting: `https://app.streamflow.finance/contract/<ID>`
- Team vesting: `https://app.streamflow.finance/contract/<ID>`
- LP lock: `https://app.streamflow.finance/contract/<ID>`

### On-Chain Check
```bash
# View vesting details
streamflow show <CONTRACT_ID>
```

---

## Security Considerations

1. **Non-cancellable:** Set `cancelableBySender: false`
2. **Non-transferable:** Set `transferableBySender: false`
3. **Cliff enforcement:** Set cliff time in seconds
4. **Verify before funding:** Check all parameters

---

**Status:** 🟢 GUIDE COMPLETE  
**Created:** 2026-02-08
