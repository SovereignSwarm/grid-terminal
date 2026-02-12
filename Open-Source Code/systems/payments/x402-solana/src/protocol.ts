/**
 * x402 Protocol Parser and Creator
 */

import { X402PaymentRequest } from './types';
import { X402Error } from './errors';

// x402 header names
const X402_HEADER = 'X-Payment-Request';
const X402_RECEIPT_HEADER = 'X-Payment-Receipt';

/**
 * Parse x402 payment request from HTTP 402 response headers
 */
export function parsePaymentRequest(headers: Headers | Record<string, string>): X402PaymentRequest {
    const headerValue = headers instanceof Headers
        ? headers.get(X402_HEADER)
        : headers[X402_HEADER] || headers[X402_HEADER.toLowerCase()];

    if (!headerValue) {
        throw new X402Error('Missing X-Payment-Request header');
    }

    try {
        // Header format: base64-encoded JSON
        const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
        const request = JSON.parse(decoded) as X402PaymentRequest;

        // Validate required fields
        if (!request.version || request.version !== '1.0') {
            throw new X402Error('Unsupported x402 version');
        }
        if (!request.payTo) {
            throw new X402Error('Missing payTo field');
        }
        if (!request.amount) {
            throw new X402Error('Missing amount field');
        }
        if (!request.paymentId) {
            throw new X402Error('Missing paymentId field');
        }
        if (request.expires && request.expires < Date.now() / 1000) {
            throw new X402Error('Payment request expired');
        }

        return request;
    } catch (e) {
        if (e instanceof X402Error) throw e;
        throw new X402Error(`Failed to parse payment request: ${e}`);
    }
}

/**
 * Create x402 payment request header value
 */
export function createPaymentRequest(request: X402PaymentRequest): string {
    const json = JSON.stringify(request);
    return Buffer.from(json).toString('base64');
}

/**
 * Create HTTP 402 response with payment request
 */
export function create402Response(
    request: X402PaymentRequest,
    body?: string
): { status: number; headers: Record<string, string>; body: string } {
    return {
        status: 402,
        headers: {
            [X402_HEADER]: createPaymentRequest(request),
            'Content-Type': 'application/json',
        },
        body: body || JSON.stringify({
            error: 'Payment Required',
            paymentId: request.paymentId,
            amount: request.amount,
            asset: request.asset || 'SOL',
        }),
    };
}

/**
 * Generate unique payment ID
 */
export function generatePaymentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `x402_${timestamp}_${random}`;
}
