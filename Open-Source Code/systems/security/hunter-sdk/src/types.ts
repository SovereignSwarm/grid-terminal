/**
 * Hunter SDK - AI Firewall Service
 * 
 * Security-as-a-Service for autonomous AI agents.
 * Monitors agent behavior, detects anomalies, and enforces constraints.
 */

// Subscription tiers
export enum SubscriptionTier {
    Basic = 'basic',
    Pro = 'pro',
    Enterprise = 'enterprise',
}

// Tier pricing in $GRID tokens per month
export const TIER_PRICING = {
    [SubscriptionTier.Basic]: 100,      // 100 $GRID/mo
    [SubscriptionTier.Pro]: 500,        // 500 $GRID/mo
    [SubscriptionTier.Enterprise]: 2000, // 2000 $GRID/mo
};

// Tier features
export const TIER_FEATURES = {
    [SubscriptionTier.Basic]: {
        maxAgents: 5,
        anomalyDetection: true,
        realTimeAlerts: false,
        customRules: false,
        apiAccess: false,
    },
    [SubscriptionTier.Pro]: {
        maxAgents: 25,
        anomalyDetection: true,
        realTimeAlerts: true,
        customRules: true,
        apiAccess: false,
    },
    [SubscriptionTier.Enterprise]: {
        maxAgents: -1, // Unlimited
        anomalyDetection: true,
        realTimeAlerts: true,
        customRules: true,
        apiAccess: true,
    },
};

// Alert types
export enum AlertType {
    Info = 'info',
    Warning = 'warning',
    Critical = 'critical',
    Emergency = 'emergency',
}

// Alert definition
export interface SecurityAlert {
    id: string;
    type: AlertType;
    agentId: string;
    timestamp: Date;
    message: string;
    metadata: Record<string, any>;
    acknowledged: boolean;
}

// Anomaly types
export enum AnomalyType {
    UnusualSpending = 'unusual_spending',
    HighFrequency = 'high_frequency',
    NewDestination = 'new_destination',
    OffHours = 'off_hours',
    SuspiciousPattern = 'suspicious_pattern',
    FailedTransactions = 'failed_transactions',
}

// Detection rule
export interface DetectionRule {
    id: string;
    name: string;
    anomalyType: AnomalyType;
    enabled: boolean;
    threshold: number;
    action: 'alert' | 'block' | 'pause';
}

// Agent monitoring data
export interface AgentMonitor {
    agentId: string;
    lastSeen: Date;
    transactionCount24h: number;
    spentAmount24h: number;
    uniqueDestinations24h: number;
    failedTxCount24h: number;
    alerts: SecurityAlert[];
}

// Subscription
export interface Subscription {
    id: string;
    customerId: string;
    tier: SubscriptionTier;
    startDate: Date;
    endDate: Date;
    active: boolean;
    agentIds: string[];
}
