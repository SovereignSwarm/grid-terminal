# Key Security & Management

> **CRITICAL:** Never commit private keys to version control

## Immediate Actions Required

### 1. Add to .gitignore
Add these patterns to prevent key exposure:

```gitignore
# Private keys - NEVER commit
*.json
!package.json
!tsconfig.json
!anchor.toml
deployer-key.json
*-keypair.json
*wallet*.json
.secret
.env
.env.*
```

### 2. Remove Existing Keys from Git History

```bash
# Remove deployer key from all git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch **/deployer-key.json" \
  --prune-empty -- --all

# Force push (coordinate with team)
git push origin --force --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3. Generate New Keypairs

```bash
# Generate new deployer key
solana-keygen new -o ~/.config/solana/grid-deployer.json

# Set as default
solana config set --keypair ~/.config/solana/grid-deployer.json

# Fund the new key
solana airdrop 2  # devnet only
```

---

## Key Storage Best Practices

### Development Keys
| Type | Location | Backup |
|------|----------|--------|
| Devnet deployer | `~/.config/solana/` | Encrypted USB |
| Test wallets | `~/.config/solana/` | None needed |

### Mainnet Keys
| Type | Location | Backup |
|------|----------|--------|
| Deployer | Hardware wallet | Seed phrase in safe |
| Fee authority | Squads multisig | Multiple signers |
| Freeze authority | Squads multisig | Multiple signers |

---

## Key Types & Rotation

### Authority Keys (Transfer to Multisig)
After mainnet deployment, transfer these to DAO:
- Transfer Fee Authority
- Withdraw Withheld Authority
- Freeze Authority

### Deployer Key (Retire After Launch)
1. Deploy all programs
2. Verify deployments
3. Transfer upgrade authority to DAO
4. Archive key (don't delete)
5. Never use again

---

## Emergency Procedures

### If Key is Compromised

**Devnet:**
1. Generate new key
2. Redeploy programs
3. Update documentation

**Mainnet:**
1. ⚠️ Alert team immediately
2. Freeze token (if authority available)
3. Transfer authorities to new multisig
4. Public disclosure
5. Assess damage

---

## Verification Checklist

Before any deployment:
- [ ] No keys in git (check with `git ls-files | grep -i key`)
- [ ] .gitignore updated
- [ ] Keys stored in secure location
- [ ] Backup verified
- [ ] Team notified of key locations

---

**Status:** 🟢 GUIDE COMPLETE  
**Created:** 2026-02-08
