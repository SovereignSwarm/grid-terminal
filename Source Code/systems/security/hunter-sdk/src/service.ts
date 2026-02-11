/**
 * Hunter Service Manager
 * 
 * Multi-tenant AI Firewall service with subscription management.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import {
    Subscription,
    SubscriptionTier,
    TIER_FEATURES,
    TIER_PRICING,
    AgentMonitor,
    SecurityAlert,
    AlertType,
} from './types';
import { AnomalyDetector, AnomalyResult } from './detector';

export class HunterService {
    private connection: Connection;
    private subscriptions: Map<string, Subscription> = new Map();
    private monitors: Map<string, AgentMonitor> = new Map();
    private detector: AnomalyDetector;
    private alertCallbacks: Map<string, (alert: SecurityAlert) => void> = new Map();

    constructor(connection: Connection) {
        this.connection = connection;
        this.detector = new AnomalyDetector();
    }

    /**
     * Create new subscription
     */
    createSubscription(
        customerId: string,
        tier: SubscriptionTier,
        durationMonths: number = 1
    ): Subscription {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const subscription: Subscription = {
            id: `sub_${Date.now()}`,
            customerId,
            tier,
            startDate,
            endDate,
            active: true,
            agentIds: [],
        };

        this.subscriptions.set(subscription.id, subscription);
        return subscription;
    }

    /**
     * Add agent to subscription
     */
    addAgent(subscriptionId: string, agentId: string): boolean {
        const sub = this.subscriptions.get(subscriptionId);
        if (!sub || !sub.active) return false;

        const features = TIER_FEATURES[sub.tier];
        if (features.maxAgents !== -1 && sub.agentIds.length >= features.maxAgents) {
            return false;
        }

        sub.agentIds.push(agentId);
        this.initializeMonitor(agentId);
        return true;
    }

    /**
     * Initialize monitoring for an agent
     */
    private initializeMonitor(agentId: string): void {
        this.monitors.set(agentId, {
            agentId,
            lastSeen: new Date(),
            transactionCount24h: 0,
            spentAmount24h: 0,
            uniqueDestinations24h: 0,
            failedTxCount24h: 0,
            alerts: [],
        });
    }

    /**
     * Record transaction for monitoring
     */
    recordTransaction(
        agentId: string,
        amount: number,
        destination: string,
        success: boolean
    ): void {
        const monitor = this.monitors.get(agentId);
        if (!monitor) return;

        monitor.lastSeen = new Date();
        monitor.transactionCount24h++;
        monitor.spentAmount24h += success ? amount : 0;
        if (!success) monitor.failedTxCount24h++;

        // Check for anomalies
        const anomalies = this.detector.analyze(monitor);
        for (const anomaly of anomalies) {
            if (anomaly.detected) {
                this.createAlert(agentId, anomaly);
            }
        }

        // Record for historical analysis
        this.detector.recordDataPoint(agentId, 'spending', amount);
    }

    /**
     * Create security alert
     */
    private createAlert(agentId: string, anomaly: AnomalyResult): void {
        const alert: SecurityAlert = {
            id: `alert_${Date.now()}`,
            type: anomaly.severity,
            agentId,
            timestamp: new Date(),
            message: anomaly.details,
            metadata: {
                anomalyType: anomaly.type,
                confidence: anomaly.confidence,
            },
            acknowledged: false,
        };

        const monitor = this.monitors.get(agentId);
        if (monitor) {
            monitor.alerts.push(alert);
        }

        // Trigger callback if registered
        const callback = this.alertCallbacks.get(agentId);
        if (callback) callback(alert);
    }

    /**
     * Register alert callback for real-time notifications
     */
    onAlert(agentId: string, callback: (alert: SecurityAlert) => void): void {
        this.alertCallbacks.set(agentId, callback);
    }

    /**
     * Get agent status
     */
    getAgentStatus(agentId: string): AgentMonitor | null {
        return this.monitors.get(agentId) || null;
    }

    /**
     * Get all alerts for subscription
     */
    getSubscriptionAlerts(subscriptionId: string): SecurityAlert[] {
        const sub = this.subscriptions.get(subscriptionId);
        if (!sub) return [];

        const alerts: SecurityAlert[] = [];
        for (const agentId of sub.agentIds) {
            const monitor = this.monitors.get(agentId);
            if (monitor) {
                alerts.push(...monitor.alerts);
            }
        }

        return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Get subscription pricing
     */
    getPrice(tier: SubscriptionTier, months: number = 1): number {
        return TIER_PRICING[tier] * months;
    }

    /**
     * Check if subscription has feature
     */
    hasFeature(subscriptionId: string, feature: keyof typeof TIER_FEATURES.basic): boolean {
        const sub = this.subscriptions.get(subscriptionId);
        if (!sub) return false;
        return !!TIER_FEATURES[sub.tier][feature];
    }
}
