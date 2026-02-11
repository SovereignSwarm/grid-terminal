# Capital Requirements for $GRID Launch

> **Current:** 1 SOL | **Required:** 5+ SOL

## Cost Breakdown

| Category | Item | Cost (SOL) |
|----------|------|------------|
| **Deployment** | Transfer Hook program | 0.1 |
| | Token mint | 0.05 |
| | Fee sweep program | 0.1 |
| | Metadata | 0.02 |
| **Liquidity** | Raydium pool creation | 0.3 |
| | Initial LP (minimum) | 2.0 |
| **Operations** | Jito tips (launch) | 0.05 |
| | RPC fees (month) | 0.1 |
| | Gas buffer | 0.5 |
| **Buffer** | Emergency reserve | 1.0 |
| **TOTAL** | | **4.22 SOL** |

**Recommended:** 5 SOL (20% safety margin)

---

## Risk Analysis

### With 1 SOL (Current)
| Scenario | Outcome |
|----------|---------|
| Pool creation fails | ❌ Cannot retry |
| RPC issues | ❌ No backup funds |
| Gas spike | ❌ Transactions fail |
| MEV tip needed | ❌ Insufficient |

### With 5 SOL (Recommended)
| Scenario | Outcome |
|----------|---------|
| Pool creation fails | ✅ Can retry 2x |
| RPC issues | ✅ Switch to paid RPC |
| Gas spike | ✅ Covered |
| MEV tip needed | ✅ Up to 0.1 SOL tip |

---

## Funding Options

1. **Personal funding** (fastest)
2. **Community presale** (builds audience)
3. **Grant application** (Solana Foundation)
4. **Strategic investor** (angel)

---

## Minimum Viable Launch

If only 3 SOL available:
- Skip paid RPC (use free tier)
- Reduce initial LP to 1 SOL
- No retry buffer

**Risk:** Higher chance of failed launch.

---

**Status:** 🟢 REQUIREMENTS DEFINED  
**Created:** 2026-02-08
