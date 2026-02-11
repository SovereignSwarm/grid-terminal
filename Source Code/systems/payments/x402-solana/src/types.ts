/**
 * x402 Protocol Types and Interfaces
 */

import { PublicKey } from '@solana/web3.js';

/**
 * x402 Payment Request - sent in HTTP 402 response header
 */
export interface X402PaymentRequest {
    /** Protocol version */
    version: '1.0';

    /** Payment network */
    network: 'solana-mainnet' | 'solana-devnet';

    /** Payment recipient address */
    payTo: string;

    /** Amount in lamports (SOL) or token base units */
    amount: string;

    /** Token mint address (undefined = native SOL) */
    asset?: string;

    /** Expiration timestamp (unix seconds) */
    expires: number;

    /** Unique payment ID for verification */
    paymentId: string;

    /** Optional memo/reference */
    memo?: string;
}

/**
 * x402 Payment Receipt - sent after payment confirmed
 */
export interface X402PaymentReceipt {
    /** Payment request ID */
    paymentId: string;

    /** Transaction signature */
    signature: string;

    /** Payer address */
    payer: string;

    /** Block timestamp */
    timestamp: number;
}

/**
 * Client configuration
 */
export interface X402Config {
    /** Maximum payment amount (lamports) */
    maxPayment: number;

    /** Daily spending limit (lamports) */
    dailyLimit: number;

    /** Auto-pay threshold (lamports) - above this, require confirmation */
    autoPayThreshold: number;

    /** Timeout for payment confirmation (ms) */
    confirmationTimeout: number;
}

/**
 * Server-side payment handler
 */
export type PaymentHandler = (receipt: X402PaymentReceipt) => Promise<boolean>;

/**
 * Spending record for limit enforcement
 */
export interface SpendingRecord {
    date: string; // YYYY-MM-DD
    spent: number;
    transactions: string[];
}

/**
 * Agent spending limits from Policy Guard
 */
export interface AgentLimits {
    agent: PublicKey;
    dailyLimit: number;
    perTxLimit: number;
    cooldownSeconds: number;
}
