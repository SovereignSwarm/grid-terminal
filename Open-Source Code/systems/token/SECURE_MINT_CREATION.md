# Secure Mint Creation: Transfer Fee Bypass Prevention

> **Critical:** Mint must be created with fee extension ATOMICALLY to prevent bypass attacks

## The Vulnerability

If mint is created **without** fee extension and token accounts exist **before** fee extension is added, those accounts can transfer fee-free forever.

**Attack Vector:**
```
1. Attacker monitors mempool for mint creation
2. Before fee extension init, creates token accounts
3. Fee extension added later
4. Attacker accounts bypass all fees
```

---

## Secure Mint Creation Sequence

### ✅ CORRECT: Atomic Creation

Create mint with fee extension in **single transaction**:

```bash
# This is safe - fee extension enabled at creation
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --decimals 9 \
  --enable-transfer-fee \
  --transfer-fee-basis-points 200 \
  --maximum-fee 1000000000000
```

### ❌ DANGEROUS: Split Creation

Never do this:
```bash
# Step 1: Create mint (NO FEE EXTENSION)
spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

# VULNERABILITY WINDOW: Token accounts created here bypass fees!

# Step 2: Add fee extension later (TOO LATE)
spl-token set-transfer-fee <MINT> 200 ...
```

---

## Verification Checklist

Before proceeding with mint:

| Check | Status |
|-------|--------|
| Using Token-2022 program ID | ⬜ |
| `--enable-transfer-fee` flag included | ⬜ |
| Fee basis points = 200 (2%) | ⬜ |
| Maximum fee set appropriately | ⬜ |
| Single atomic transaction | ⬜ |
| No pre-existing token accounts for this mint | ⬜ |

---

## Pre-Launch Audit

Run before any public announcement:

```bash
# Check mint configuration
spl-token display <MINT_ADDRESS>

# Verify output shows:
# - Transfer Fee: 200 basis points (2.00%)
# - Transfer Fee Config Authority: <YOUR_AUTHORITY>
# - Withdraw Held Authority: <YOUR_AUTHORITY>

# Check for pre-existing accounts (should be 0 or only your accounts)
spl-token accounts --mint <MINT_ADDRESS> -v
```

---

## Post-Launch Monitoring

Monitor for suspicious early accounts:

```bash
# List all token accounts for this mint
spl-token accounts --mint <MINT_ADDRESS> --output json > accounts.json

# Check creation timestamps
# Any account created BEFORE mint should be investigated
```

---

## Emergency Response

If bypass accounts detected:

1. **Identify:** List all accounts created in first 5 seconds
2. **Monitor:** Track transfers from those accounts
3. **Report:** Document for community transparency
4. **Mitigate:** Consider blacklisting if Freeze Authority available

---

**Status:** 🟢 PROCESS DOCUMENTED  
**Created:** 2026-02-08  
**Severity:** CRITICAL - Follow exactly
