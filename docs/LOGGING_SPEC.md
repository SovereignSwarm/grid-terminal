# Forensic Logging Specification

> **Immutable Audit Trails for EU AI Act Compliance**

---

## 1. The Compliance Mandate

**EU AI Act, Article 12:**
> "High-risk AI systems shall be designed and developed with capabilities enabling the automatic recording of events ('logs') over the duration of the system's life. These logs must be traceable to the functioning of the AI system."

Sovereign Swarm V3.1 provides the **Technical Rails** to satisfy this requirement via decentralized infrastructure.

---

## 2. Architecture

We do not store terabytes of logs on Solana (too expensive).
We use a **Layered Data Availability** approach.

### Layer 1: The Middleware (Local)
- **Component:** `@sovereign-swarm/openclaw-plugin`
- **Function:** Intercepts every `tool_execution`, `llm_response`, and `error`.
- **Action:** Batches logs into a JSON session file.

### Layer 2: The Archive (Arweave / Celestia)
- **Function:** Permanent, immutable storage.
- **Action:** Uploads the JSON batch to Arweave.
- **Result:** Returns a Transaction ID (`AR_TXID`).

### Layer 3: The Anchor (Solana)
- **Function:** Legal Proof of Existence & Integrity.
- **Action:** Middleware calls `grid_compliance_logger` program.
- **Payload:** `Hash(JSON_Batch) + AR_TXID + Timestamp`.

---

## 3. Data Schema

```json
{
  "session_id": "uuid-v4",
  "agent_id": "Passport_Address",
  "timestamp_start": 1770850000,
  "timestamp_end": 1770853600,
  "events": [
    {
      "type": "TOOL_EXECUTION",
      "tool": "solana_swap",
      "input": { "token": "SOL", "amount": 10 },
      "output": { "tx_hash": "..." },
      "risk_score": 0.1
    },
    {
      "type": "LLM_THOUGHT",
      "content": "Market conditions favorable. Executing buy.",
      "constitutional_check": "PASSED"
    }
  ],
  "signature": "Ed25519_Signature_of_Agent"
}
```

---

## 4. Auditor View

Regulatory Auditors or Insurance Claims Adjusters can inspect an agent's history by:
1. Querying Solana for the `Hash` and `AR_TXID`.
2. Fetching the JSON from Arweave.
3. Verifying `SHA256(JSON) == OnChain_Hash`.

If the hashes match, the log is **Admissible Forensic Evidence**.

---

*Verified by Grid Protocol | V3.1*
