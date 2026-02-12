/**
 * Anomaly Detection Engine
 * 
 * Core detection logic for the AI Firewall.
 */

import {
    AnomalyType,
    AlertType,
    SecurityAlert,
    DetectionRule,
    AgentMonitor,
} from './types';

// Default detection rules
export const DEFAULT_RULES: DetectionRule[] = [
    {
        id: 'rule_spending_spike',
        name: 'Spending Spike Detection',
        anomalyType: AnomalyType.UnusualSpending,
        enabled: true,
        threshold: 2.0, // 2x normal spending
        action: 'alert',
    },
    {
        id: 'rule_high_frequency',
        name: 'High Transaction Frequency',
        anomalyType: AnomalyType.HighFrequency,
        enabled: true,
        threshold: 100, // Transactions per hour
        action: 'alert',
    },
    {
        id: 'rule_new_destination',
        name: 'New Destination Detection',
        anomalyType: AnomalyType.NewDestination,
        enabled: true,
        threshold: 5, // New destinations in 24h
        action: 'alert',
    },
    {
        id: 'rule_failed_tx',
        name: 'Failed Transaction Spike',
        anomalyType: AnomalyType.FailedTransactions,
        enabled: true,
        threshold: 10, // Failed transactions in 1h
        action: 'block',
    },
];

export interface AnomalyResult {
    detected: boolean;
    type: AnomalyType;
    severity: AlertType;
    confidence: number; // 0-1
    details: string;
}

export class AnomalyDetector {
    private rules: DetectionRule[];
    private historicalData: Map<string, number[]> = new Map();

    constructor(rules: DetectionRule[] = DEFAULT_RULES) {
        this.rules = rules;
    }

    /**
     * Analyze agent for anomalies
     */
    analyze(monitor: AgentMonitor): AnomalyResult[] {
        const results: AnomalyResult[] = [];

        for (const rule of this.rules) {
            if (!rule.enabled) continue;

            const result = this.checkRule(rule, monitor);
            if (result.detected) {
                results.push(result);
            }
        }

        return results;
    }

    /**
     * Check a single rule against agent data
     */
    private checkRule(rule: DetectionRule, monitor: AgentMonitor): AnomalyResult {
        switch (rule.anomalyType) {
            case AnomalyType.UnusualSpending:
                return this.checkSpending(rule, monitor);
            case AnomalyType.HighFrequency:
                return this.checkFrequency(rule, monitor);
            case AnomalyType.NewDestination:
                return this.checkDestinations(rule, monitor);
            case AnomalyType.FailedTransactions:
                return this.checkFailures(rule, monitor);
            default:
                return { detected: false, type: rule.anomalyType, severity: AlertType.Info, confidence: 0, details: '' };
        }
    }

    /**
     * Check for unusual spending patterns
     */
    private checkSpending(rule: DetectionRule, monitor: AgentMonitor): AnomalyResult {
        const historical = this.getHistorical(monitor.agentId, 'spending');
        const average = historical.length > 0
            ? historical.reduce((a, b) => a + b, 0) / historical.length
            : monitor.spentAmount24h;

        const ratio = monitor.spentAmount24h / (average || 1);
        const detected = ratio > rule.threshold;

        return {
            detected,
            type: AnomalyType.UnusualSpending,
            severity: ratio > 3 ? AlertType.Critical : AlertType.Warning,
            confidence: Math.min(ratio / rule.threshold, 1),
            details: `Spending ${ratio.toFixed(1)}x normal (threshold: ${rule.threshold}x)`,
        };
    }

    /**
     * Check for high transaction frequency
     */
    private checkFrequency(rule: DetectionRule, monitor: AgentMonitor): AnomalyResult {
        const txPerHour = monitor.transactionCount24h / 24;
        const detected = txPerHour > rule.threshold;

        return {
            detected,
            type: AnomalyType.HighFrequency,
            severity: txPerHour > rule.threshold * 2 ? AlertType.Critical : AlertType.Warning,
            confidence: Math.min(txPerHour / rule.threshold, 1),
            details: `${txPerHour.toFixed(0)} tx/hour (threshold: ${rule.threshold})`,
        };
    }

    /**
     * Check for new destinations
     */
    private checkDestinations(rule: DetectionRule, monitor: AgentMonitor): AnomalyResult {
        const detected = monitor.uniqueDestinations24h > rule.threshold;

        return {
            detected,
            type: AnomalyType.NewDestination,
            severity: AlertType.Warning,
            confidence: Math.min(monitor.uniqueDestinations24h / rule.threshold, 1),
            details: `${monitor.uniqueDestinations24h} new destinations (threshold: ${rule.threshold})`,
        };
    }

    /**
     * Check for failed transactions
     */
    private checkFailures(rule: DetectionRule, monitor: AgentMonitor): AnomalyResult {
        const detected = monitor.failedTxCount24h > rule.threshold;

        return {
            detected,
            type: AnomalyType.FailedTransactions,
            severity: detected ? AlertType.Critical : AlertType.Info,
            confidence: Math.min(monitor.failedTxCount24h / rule.threshold, 1),
            details: `${monitor.failedTxCount24h} failed transactions (threshold: ${rule.threshold})`,
        };
    }

    /**
     * Get historical data for an agent
     */
    private getHistorical(agentId: string, metric: string): number[] {
        return this.historicalData.get(`${agentId}:${metric}`) || [];
    }

    /**
     * Record data point for historical analysis
     */
    recordDataPoint(agentId: string, metric: string, value: number): void {
        const key = `${agentId}:${metric}`;
        const data = this.historicalData.get(key) || [];
        data.push(value);

        // Keep last 30 days
        if (data.length > 30) data.shift();

        this.historicalData.set(key, data);
    }

    /**
     * Add custom detection rule
     */
    addRule(rule: DetectionRule): void {
        this.rules.push(rule);
    }

    /**
     * Update rule
     */
    updateRule(ruleId: string, updates: Partial<DetectionRule>): void {
        const idx = this.rules.findIndex(r => r.id === ruleId);
        if (idx >= 0) {
            this.rules[idx] = { ...this.rules[idx], ...updates };
        }
    }
}
