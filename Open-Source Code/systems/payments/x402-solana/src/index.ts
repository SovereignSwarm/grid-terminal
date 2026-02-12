/**
 * x402-solana: HTTP 402 Payment Protocol for Solana
 * 
 * Enables agent-to-agent micropayments using the x402 standard.
 * 
 * @example
 * ```typescript
 * import { X402Client } from '@grid/x402-solana';
 * 
 * const client = new X402Client(connection, wallet);
 * const response = await client.payAndRetry(request);
 * ```
 */

export { X402Client } from './client';
export { X402Server } from './server';
export { parsePaymentRequest, createPaymentRequest } from './protocol';
export { X402Error, PaymentRequiredError, InsufficientFundsError } from './errors';
export type {
    X402PaymentRequest,
    X402PaymentReceipt,
    X402Config,
    PaymentHandler
} from './types';
