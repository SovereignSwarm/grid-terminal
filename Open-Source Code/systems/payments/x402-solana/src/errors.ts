/**
 * x402 Error Classes
 */

export class X402Error extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'X402Error';
    }
}

export class PaymentRequiredError extends X402Error {
    public readonly paymentRequest: any;

    constructor(paymentRequest: any) {
        super('Payment required');
        this.name = 'PaymentRequiredError';
        this.paymentRequest = paymentRequest;
    }
}

export class InsufficientFundsError extends X402Error {
    public readonly required: number;
    public readonly available: number;

    constructor(required: number, available: number) {
        super(`Insufficient funds: need ${required}, have ${available}`);
        this.name = 'InsufficientFundsError';
        this.required = required;
        this.available = available;
    }
}

export class SpendingLimitError extends X402Error {
    public readonly limit: number;
    public readonly requested: number;

    constructor(limit: number, requested: number) {
        super(`Spending limit exceeded: limit ${limit}, requested ${requested}`);
        this.name = 'SpendingLimitError';
        this.limit = limit;
        this.requested = requested;
    }
}

export class PaymentExpiredError extends X402Error {
    constructor(paymentId: string) {
        super(`Payment request expired: ${paymentId}`);
        this.name = 'PaymentExpiredError';
    }
}
