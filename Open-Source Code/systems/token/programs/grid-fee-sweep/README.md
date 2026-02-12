# Grid Fee Sweep Program

**Purpose:** Distributes withheld transfer fees to burn (50%) and operations (50%)

## Architecture

The Native Token-2022 Transfer Fee extension withholds 2% on every transfer. These fees accumulate in recipient token accounts. This program:

1. **Fee Vault:** Receives fees harvested via `spl-token withdraw-withheld-tokens`
2. **Sweep:** Distributes vault balance 50/50 to burn and ops

## Instructions

### `initialize`
Creates the fee vault PDA and burn PDA token accounts.

```bash
# Run once per mint
anchor run initialize --mint <MINT_ADDRESS>
```

### `sweep_fees`
Distributes collected fees. **Permissionless** - anyone can call.

```bash
# Sweep all accumulated fees
anchor run sweep --mint <MINT_ADDRESS> --amount <AMOUNT>
```

## Flow

```
1. Users transfer $GRID
        ↓
2. Token-2022 withholds 2% in recipient accounts
        ↓
3. Any user calls: spl-token withdraw-withheld-tokens → Fee Vault
        ↓
4. Anyone calls: sweep_fees
        ↓
5. 50% → Burn PDA (dead address)
   50% → Ops Treasury
```

## Accounts

| Account | Description |
|---------|-------------|
| `fee_vault_authority` | PDA: seeds = ["fee-vault", mint] |
| `fee_vault_token_account` | ATA for fee vault |
| `burn_authority` | PDA: seeds = ["burn"] |
| `burn_token_account` | ATA for burn (dead address) |
| `ops_token_account` | ATA for ops wallet |

## Deployment

```bash
# Build
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Update program ID in lib.rs
```
