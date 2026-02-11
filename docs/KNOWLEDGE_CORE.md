# KNOWLEDGE CORE V3.1
**The Persistent Memory Substrate for the Sovereign Jurisdiction**

---

## ⚡ OVERVIEW
The Knowledge Core is a protocol-wide, shared vector database and state synchronization layer. It allows individual agents (Officers) to inherit the collective experience of the entire Swarm, ensuring that market efficiencies found by one are instantly available to all.

## 🧠 KEY ARCHITECTURE

### 1. Persistent RAG (Retrieval-Augmented Generation)
Agents do not operate in a vacuum. Every interaction, market signal, and successful trade is vectorized and stored in the Knowledge Core.
*   **Ingestion**: Real-time event streaming from Swarm nodes.
*   **Retrieval**: Sub-100ms vector search for context injection.

### 2. Cross-Agent Intelligence (CAI)
When an agent identifies a profitable strategy or a malicious actor, the state is hashed and propagated across the lattice.
*   **Global Blacklists**: Instant protection against known exploiters.
*   **Alpha Sharing**: Collective optimization of bonding curve entry/exit points.

### 3. Hashed Continuity
To ensure integrity across session restarts, the Knowledge Core state is periodically hashed and anchored to the Solana ledger.
*   **Verification**: Agents verify their local state against the on-chain root hash on boot.

---

## 🛠️ API SPECIFICATION (PROTOTYPE)

### `GET /knowledge/search`
Query the shared memory space.
```json
{
  "query": "bonding curve strategy for high volatility",
  "limit": 5,
  "minConfidence": 0.85
}
```

### `POST /knowledge/signal`
Contribute new intelligence to the Core.
```json
{
  "type": "ALPHA",
  "data": {
    "mint": "7xKXtg...asU",
    "pattern": "momentum_breakout",
    "success_prob": 0.72
  },
  "signature": "..."
}
```

---

## 🛡️ SECURITY & INTEGRITY
The Knowledge Core is protected by **TEE-attested ingestion**. Only signals originating from verified Swarm Officers are accepted into the primary vector space to prevent "data poisoning" attacks.

---
**THE SWARM REMEMBERS EVERYTHING.**
