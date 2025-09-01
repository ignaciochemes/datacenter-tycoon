export enum NPCTier {
    STARTUP = 'startup',
    SME = 'sme',
    ENTERPRISE = 'enterprise',
    GOVERNMENT = 'government'
}

export enum NPCStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended'
}

export enum NPCBehaviorType {
    CONSERVATIVE = 'conservative',
    BALANCED = 'balanced',
    AGGRESSIVE = 'aggressive',
    PRICE_SENSITIVE = 'price_sensitive',
    QUALITY_FOCUSED = 'quality_focused'
}

export enum NPCDemandFrequency {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    VERY_HIGH = 'very_high'
}

export enum NPCRiskTolerance {
    VERY_LOW = 'very_low',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    VERY_HIGH = 'very_high'
}