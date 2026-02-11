# $GRID Governance: Founder Voting Lockout & Fair Launch

> **Decision:** Founders cannot vote for 12 months post-TGE to prevent governance capture

## Problem: Governance Circular Dependency

At launch:
- Total veGRID = 0 (no one has locked yet)
- First lockers have 100% voting power
- Founder/Team allocation = 10% of supply
- If founder locks first → controls all early votes

---

## Solution: Founder Voting Lockout

### Rule 1: 12-Month Voting Lockout

| Wallet Type | Can Lock veGRID | Can Vote | Duration |
|-------------|-----------------|----------|----------|
| Founder | ✅ Yes | ❌ No | 12 months |
| Team/Advisor | ✅ Yes | ❌ No | 12 months |
| Treasury | N/A | ❌ No | Governed by DAO |
| Community | ✅ Yes | ✅ Yes | Immediate |

### Implementation

In Realms DAO configuration:
```json
{
  "votingLockout": {
    "founderWallet": "FOUNDER_PUBKEY",
    "teamWallets": ["TEAM1_PUBKEY", "TEAM2_PUBKEY"],
    "lockoutDuration": 31536000,  // 12 months in seconds
    "lockoutStart": "TGE_TIMESTAMP"
  }
}
```

**Enforcement:** Policy Guard program checks voter wallet against lockout list before accepting votes.

---

## Solution: Community-First Distribution

### Airdrop Before Governance

Distribute initial $GRID to community **before** any governance proposals:

| Phase | Action | veGRID Impact |
|-------|--------|---------------|
| TGE | Mint + LP lock | 0 veGRID active |
| TGE + 1h | Community airdrop (5%) | Community can lock |
| TGE + 24h | First proposal allowed | Community voters active |
| TGE + 12mo | Founder lockout ends | Founder can vote |

### Airdrop Criteria (5% of supply = 53,687,091 $GRID)
- Discord/X verified followers
- Whitepaper early readers
- Testnet participants
- $GRID terminal testers

---

## Solution: Quadratic Voting

Reduce whale dominance with sqrt-weighted voting:

```
Standard: votes = veGRID_balance
Quadratic: votes = √(veGRID_balance)
```

| veGRID Locked | Standard Votes | Quadratic Votes |
|---------------|----------------|-----------------|
| 100           | 100            | 10              |
| 10,000        | 10,000         | 100             |
| 1,000,000     | 1,000,000      | 1,000           |

**Effect:** A whale with 10,000x more tokens only gets 100x more votes.

---

## Updated Governance Rules

Add to GOVERNANCE_SPEC_v1.0.md:

```markdown
## 6. Fair Launch Governance Rules

### 6.1 Founder Voting Lockout
Founder and Team wallets are prohibited from voting for 12 months
post-TGE. This ensures community-first governance.

### 6.2 Community Airdrop Requirement
A minimum 5% of supply must be distributed to community members
BEFORE any governance proposals can be created.

### 6.3 Quadratic Voting (Optional Phase 2)
To reduce whale dominance, the DAO may adopt quadratic voting
via governance proposal after 6 months of operation.
```

---

## Verification

### Public Lockout Dashboard
```
1. List all founder/team wallets on public page
2. Show lockout status (LOCKED / UNLOCKED)
3. Show countdown to unlock date
4. Link from whitepaper and website
```

---

**Status:** 🟢 RULES DEFINED  
**Created:** 2026-02-08  
**Next:** Implement in Policy Guard program
