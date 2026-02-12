/**
 * x402 Client - Handles outgoing payments for agent requests
 */

import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { X402PaymentRequest, X402PaymentReceipt, X402Config, SpendingRecord } from './types';
import { parsePaymentRequest } from './protocol';
import { InsufficientFundsError, SpendingLimitError, X402Error } from './errors';

const DEFAULT_CONFIG: X402Config = {
    maxPayment: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL max per tx
    dailyLimit: 1 * LAMPORTS_PER_SOL,   // 1 SOL daily limit
    autoPayThreshold: 0.01 * LAMPORTS_PER_SOL, // Auto-pay below 0.01 SOL
    confirmationTimeout: 30000, // 30 seconds
};

export class X402Client {
    private connection: Connection;
    private payer: Keypair;
    private config: X402Config;
    private spending: Map<string, SpendingRecord> = new Map();

    constructor(
        connection: Connection,
        payer: Keypair,
        config: Partial<X402Config> = {}
    ) {
        this.connection = connection;
        this.payer = payer;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Pay a x402 payment request
     */
    async pay(request: X402PaymentRequest): Promise<X402PaymentReceipt> {
        const amount = BigInt(request.amount);

        // Validate amount against limits
        await this.validatePayment(amount);

        // Record spending
        this.recordSpending(Number(amount));

        let signature: string;

        if (request.asset) {
            // SPL Token payment
            signature = await this.payToken(request);
        } else {
            // Native SOL payment
            signature = await this.paySol(request);
        }

        return {
            paymentId: request.paymentId,
            signature,
            payer: this.payer.publicKey.toBase58(),
            timestamp: Math.floor(Date.now() / 1000),
        };
    }

    /**
     * Pay and retry request with receipt
     */
    async payAndRetry<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        // First request - expect 402
        const response = await fetch(url, options);

        if (response.status !== 402) {
            return response.json();
        }

        // Parse payment request
        const paymentRequest = parsePaymentRequest(
            Object.fromEntries(response.headers.entries())
        );

        // Make payment
        const receipt = await this.pay(paymentRequest);

        // Retry with receipt
        const retryResponse = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'X-Payment-Receipt': Buffer.from(JSON.stringify(receipt)).toString('base64'),
            },
        });

        if (!retryResponse.ok) {
            throw new X402Error(`Request failed after payment: ${retryResponse.status}`);
        }

        return retryResponse.json();
    }

    /**
     * Pay native SOL
     */
    private async paySol(request: X402PaymentRequest): Promise<string> {
        const recipient = new PublicKey(request.payTo);
        const amount = BigInt(request.amount);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: this.payer.publicKey,
                toPubkey: recipient,
                lamports: amount,
            })
        );

        if (request.memo) {
            // Add memo instruction if present
            // (simplified - would need memo program integration)
        }

        const signature = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.payer],
            { commitment: 'confirmed' }
        );

        return signature;
    }

    /**
     * Pay SPL Token (Token-2022 compatible)
     */
    private async payToken(request: X402PaymentRequest): Promise<string> {
        const mint = new PublicKey(request.asset!);
        const recipient = new PublicKey(request.payTo);
        const amount = BigInt(request.amount);

        const fromAta = await getAssociatedTokenAddress(
            mint,
            this.payer.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const toAta = await getAssociatedTokenAddress(
            mint,
            recipient,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const transaction = new Transaction().add(
            createTransferInstruction(
                fromAta,
                toAta,
                this.payer.publicKey,
                amount,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );

        const signature = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.payer],
            { commitment: 'confirmed' }
        );

        return signature;
    }

    /**
     * Validate payment against limits
     */
    private async validatePayment(amount: bigint): Promise<void> {
        // Check per-transaction limit
        if (Number(amount) > this.config.maxPayment) {
            throw new SpendingLimitError(this.config.maxPayment, Number(amount));
        }

        // Check daily limit
        const today = new Date().toISOString().split('T')[0];
        const record = this.spending.get(today);
        const spentToday = record?.spent || 0;

        if (spentToday + Number(amount) > this.config.dailyLimit) {
            throw new SpendingLimitError(
                this.config.dailyLimit - spentToday,
                Number(amount)
            );
        }

        // Check balance
        const balance = await this.connection.getBalance(this.payer.publicKey);
        if (balance < Number(amount)) {
            throw new InsufficientFundsError(Number(amount), balance);
        }
    }

    /**
     * Record spending for limit tracking
     */
    private recordSpending(amount: number): void {
        const today = new Date().toISOString().split('T')[0];
        const record = this.spending.get(today) || { date: today, spent: 0, transactions: [] };
        record.spent += amount;
        this.spending.set(today, record);
    }

    /**
     * Get current spending status
     */
    getSpendingStatus(): { today: number; limit: number; remaining: number } {
        const today = new Date().toISOString().split('T')[0];
        const record = this.spending.get(today);
        const spent = record?.spent || 0;

        return {
            today: spent,
            limit: this.config.dailyLimit,
            remaining: this.config.dailyLimit - spent,
        };
    }
}
