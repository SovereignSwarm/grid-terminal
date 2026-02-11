/**
 * x402 Server - Handles incoming payment requests
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { X402PaymentRequest, X402PaymentReceipt, PaymentHandler } from './types';
import { create402Response, generatePaymentId } from './protocol';
import { X402Error } from './errors';

export class X402Server {
    private connection: Connection;
    private payTo: PublicKey;
    private pendingPayments: Map<string, X402PaymentRequest> = new Map();
    private confirmedPayments: Set<string> = new Set();

    constructor(connection: Connection, payTo: PublicKey) {
        this.connection = connection;
        this.payTo = payTo;
    }

    /**
     * Create a payment request for a service
     */
    createPaymentRequest(
        amount: number | string,
        options: {
            asset?: string;
            expiresIn?: number; // seconds
            memo?: string;
        } = {}
    ): X402PaymentRequest {
        const paymentId = generatePaymentId();
        const expires = Math.floor(Date.now() / 1000) + (options.expiresIn || 300);

        const request: X402PaymentRequest = {
            version: '1.0',
            network: 'solana-devnet', // TODO: Make configurable
            payTo: this.payTo.toBase58(),
            amount: amount.toString(),
            expires,
            paymentId,
            asset: options.asset,
            memo: options.memo,
        };

        this.pendingPayments.set(paymentId, request);

        // Auto-cleanup after expiry
        setTimeout(() => {
            this.pendingPayments.delete(paymentId);
        }, (options.expiresIn || 300) * 1000);

        return request;
    }

    /**
     * Create HTTP 402 response
     */
    create402(amount: number | string, options = {}): ReturnType<typeof create402Response> {
        const request = this.createPaymentRequest(amount, options);
        return create402Response(request);
    }

    /**
     * Verify a payment receipt
     */
    async verifyReceipt(receipt: X402PaymentReceipt): Promise<boolean> {
        // Check if already confirmed (prevent double-spend)
        if (this.confirmedPayments.has(receipt.paymentId)) {
            return true;
        }

        // Check if payment was requested
        const request = this.pendingPayments.get(receipt.paymentId);
        if (!request) {
            throw new X402Error('Unknown payment ID');
        }

        // Verify transaction on-chain
        try {
            const tx = await this.connection.getTransaction(receipt.signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });

            if (!tx) {
                throw new X402Error('Transaction not found');
            }

            if (tx.meta?.err) {
                throw new X402Error('Transaction failed');
            }

            // --- Payment Verification ---
            const requestAmount = BigInt(request.amount);
            let verified = false;

            if (request.asset) {
                // SPL Token Verification
                // Check postTokenBalances for increment
                const preBalances = tx.meta?.preTokenBalances || [];
                const postBalances = tx.meta?.postTokenBalances || [];

                // Find recipient's balance change for this mint
                // Note: We scan all token balance changes to find the one matching our wallet and asset
                const recipientPre = preBalances.find(b => b.mint === request.asset && b.owner === this.payTo.toBase58());
                const recipientPost = postBalances.find(b => b.mint === request.asset && b.owner === this.payTo.toBase58());

                if (recipientPost) {
                    const preAmount = recipientPre ? BigInt(recipientPre.uiTokenAmount.amount) : BigInt(0);
                    const postAmount = BigInt(recipientPost.uiTokenAmount.amount);

                    if ((postAmount - preAmount) >= requestAmount) {
                        verified = true;
                    }
                }

            } else {
                // Native SOL Verification
                // Find account index of this.payTo
                const accountKeys = tx.transaction.message.getAccountKeys();
                const recipientIndex = accountKeys.staticAccountKeys.findIndex(k => k.equals(this.payTo));

                // If not in static keys, might be in writable/readonly tables (v0), but simple transfers usually use static.
                // Fallback for address lookups if needed, but for now we search static.

                if (recipientIndex !== -1) {
                    const preLamports = tx.meta?.preBalances[recipientIndex] || 0;
                    const postLamports = tx.meta?.postBalances[recipientIndex] || 0;

                    if (BigInt(postLamports) - BigInt(preLamports) >= requestAmount) {
                        verified = true;
                    }
                }
            }

            if (!verified) {
                throw new X402Error('Payment verification failed: recipient did not receive funds');
            }

            // Mark as confirmed
            this.confirmedPayments.add(receipt.paymentId);
            this.pendingPayments.delete(receipt.paymentId);

            return true;
        } catch (e) {
            throw new X402Error(`Payment verification failed: ${e}`);
        }
    }

    /**
     * Express-style middleware for x402 payments
     */
    middleware(pricePerRequest: number) {
        return async (req: any, res: any, next: any) => {
            // Check for payment receipt
            const receiptHeader = req.headers['x-payment-receipt'];

            if (receiptHeader) {
                try {
                    const receipt = JSON.parse(
                        Buffer.from(receiptHeader, 'base64').toString('utf-8')
                    ) as X402PaymentReceipt;

                    const verified = await this.verifyReceipt(receipt);
                    if (verified) {
                        return next();
                    }
                } catch (e) {
                    // Invalid receipt, send 402
                }
            }

            // No valid receipt, require payment
            const response = this.create402(pricePerRequest);
            res.status(402);
            Object.entries(response.headers).forEach(([k, v]) => res.setHeader(k, v));
            res.send(response.body);
        };
    }
}
