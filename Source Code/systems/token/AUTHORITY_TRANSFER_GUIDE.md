# Authority Transfer Guide: Securing Token-2022 Fee Authorities

> **Critical:** Transfer fee authorities to DAO multisig BEFORE mainnet launch

## Overview

Token-2022 Transfer Fee Extension uses two critical authorities:
1. **Transfer Fee Authority** - Can change fee rate (basis points)
2. **Withdraw Withheld Authority** - Can extract accumulated fees

Both MUST be transferred to a DAO-controlled multisig to prevent key-man risk.

---

## Target Configuration

| Authority | Before | After |
|-----------|--------|-------|
| Transfer Fee Authority | Deployer keypair | Squads 3-of-5 Multisig |
| Withdraw Withheld Authority | Deployer keypair | Squads 3-of-5 Multisig |
| Mint Authority | Deployer keypair | NULL (revoked) |
| Freeze Authority | Deployer keypair | DAO Multisig |

---

## Step 1: Create Squads Multisig

### 1.1 Go to Squads
```
https://app.squads.so/
```

### 1.2 Create New Multisig
- **Name:** GRID Fee Authority
- **Threshold:** 3-of-5
- **Members:**
  1. Founder wallet
  2. Team wallet 1
  3. Team wallet 2
  4. Community representative 1
  5. Community representative 2

### 1.3 Record Multisig Address
```
MULTISIG_ADDRESS = <copy from Squads UI>
```

---

## Step 2: Transfer Transfer Fee Authority

```bash
# Set the new transfer fee authority to Squads multisig
spl-token set-authority \
  <MINT_ADDRESS> \
  --authority-type transfer-fee-config \
  --new-authority <MULTISIG_ADDRESS> \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

### Verify
```bash
spl-token display <MINT_ADDRESS>
# Should show:
# Transfer Fee Config Authority: <MULTISIG_ADDRESS>
```

---

## Step 3: Transfer Withdraw Withheld Authority

```bash
# Set the new withdraw authority to Squads multisig
spl-token set-authority \
  <MINT_ADDRESS> \
  --authority-type withdraw-withheld-tokens \
  --new-authority <MULTISIG_ADDRESS> \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

### Verify
```bash
spl-token display <MINT_ADDRESS>
# Should show:
# Withdraw Withheld Authority: <MULTISIG_ADDRESS>
```

---

## Step 4: Revoke Mint Authority (Optional but Recommended)

```bash
# Permanently revoke minting capability (irreversible!)
spl-token authorize \
  <MINT_ADDRESS> \
  mint \
  --disable \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

---

## Step 5: Transfer Freeze Authority to DAO

```bash
spl-token set-authority \
  <MINT_ADDRESS> \
  --authority-type freeze \
  --new-authority <MULTISIG_ADDRESS> \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

---

## Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Transfer Fee Auth | `spl-token display <MINT>` | Multisig address |
| Withdraw Auth | `spl-token display <MINT>` | Multisig address |
| Mint Auth | `spl-token display <MINT>` | `null` or Multisig |
| Freeze Auth | `spl-token display <MINT>` | Multisig address |

---

## Operational Procedures

### Changing Fee Rate (Post-Transfer)
1. Create proposal in Squads
2. Include command: `spl-token set-transfer-fee <MINT> <NEW_BPS> <MAX_FEE>`
3. Collect 3-of-5 signatures
4. Execute proposal

### Withdrawing Fees (Post-Transfer)
1. Create proposal in Squads
2. Include command: `spl-token withdraw-withheld-tokens <MINT> <DESTINATION>`
3. Collect 3-of-5 signatures
4. Execute proposal

---

## Emergency Procedures

### If Deployer Key Compromised BEFORE Transfer
1. **Immediately** execute authority transfers
2. Revoke mint authority
3. Notify community
4. Audit all transactions from compromised key

### If Multisig Member Compromised AFTER Transfer
1. Use Squads to remove compromised member
2. Add replacement member
3. Threshold still requires 3-of-5 (attacker needs 2 more)

---

**Status:** 🟢 GUIDE COMPLETE  
**Created:** 2026-02-08  
**Priority:** Execute before mainnet
