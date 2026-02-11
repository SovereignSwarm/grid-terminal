# Program Upgrade Authority Security Guide

> **Critical:** Transfer upgrade authority to DAO multisig before mainnet

## The Risk

Solana programs deployed via Anchor are upgradeable by default. The upgrade authority can:
- Deploy new bytecode (backdoors, exploits)
- Change program behavior entirely
- Disable the program

**Current Risk:** Single deployer key controls all program upgrades.

---

## Programs to Secure

| Program | Status | Target Authority |
|---------|--------|------------------|
| grid-transfer-hook | ⚠️ Deployer | Squads multisig |
| grid-fee-sweep | ⚠️ Deployer | Squads multisig |
| policy-guard | ⚠️ Deployer | Squads multisig |

---

## Option 1: Transfer to DAO Multisig (Recommended)

Allows future upgrades with DAO approval.

```bash
# Check current authority
solana program show <PROGRAM_ID>

# Transfer to multisig
solana program set-upgrade-authority <PROGRAM_ID> \
  --new-upgrade-authority <MULTISIG_ADDRESS> \
  --keypair <CURRENT_AUTHORITY_KEYPAIR>
```

### Upgrade Process After Transfer
1. Developer submits upgrade proposal to DAO
2. Proposal includes:
   - New bytecode hash
   - Audit reference
   - Change description
3. 3-of-5 multisig approves
4. Execute upgrade via Squads

---

## Option 2: Make Immutable (Irreversible)

No future upgrades possible. Use only for battle-tested code.

```bash
# WARNING: This is PERMANENT
solana program set-upgrade-authority <PROGRAM_ID> --final
```

**When to use:**
- After extensive mainnet testing (6+ months)
- When no bugs likely
- For maximum trustlessness

---

## Verification

```bash
# Confirm authority change
solana program show <PROGRAM_ID>

# Expected output:
# Program Id: <PROGRAM_ID>
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# Upgrade Authority: <MULTISIG_ADDRESS>
```

---

## Emergency Procedures

### If Current Authority Compromised

1. **Immediately** transfer to new multisig (if still possible)
2. Alert community
3. Pause all user interactions
4. Assess if exploit occurred
5. Deploy patched version via new authority

### If Multisig Compromised

1. Threshold (3-of-5) limits damage
2. Remove compromised signer
3. Add replacement signer
4. Review all pending proposals

---

## Checklist

Before mainnet:
- [ ] Deploy programs to mainnet
- [ ] Create Squads 3-of-5 multisig
- [ ] Transfer upgrade authority for each program
- [ ] Verify transfers on Solscan
- [ ] Document multisig address publicly

---

**Status:** 🟢 GUIDE COMPLETE  
**Created:** 2026-02-08
