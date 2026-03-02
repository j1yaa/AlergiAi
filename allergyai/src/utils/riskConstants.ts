export const RISKTHRES = {
    LOWMAX: 30,
    MODERATEMAX: 70,
    HIGHMIN: 71
} as const;

export const getRiskTier = (score: number): 'Low Risk' | 'Moderate Risk' | 'High Risk' => {
    if (score <= RISKTHRES.LOWMAX) return 'Low Risk';
    if (score <= RISKTHRES.MODERATEMAX) return 'Moderate Risk';
    return 'High Risk';
};

export const getAlertSeverity = (riskTier: string): 'low' | 'medium' | 'high' => {
    if (riskTier <= 'High Risk') return 'high';
    if (riskTier <= 'Moderate Risk') return 'medium';
    return 'low';
};

export const getAlertSeverityFromScore = (score: number): 'low' | 'medium' | 'high' => {
    return getAlertSeverity(getRiskTier(score));
};