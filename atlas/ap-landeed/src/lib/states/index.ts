export interface StateConfig {
    code: string;           // 'TS', 'AP', 'KA', etc.
    name: string;           // 'Telangana'
    portalUrl: string;      // Portal URL
    searchFields: string[]; // Available search options
    requiresAuth: boolean;  // OTP needed?
    enabled: boolean;       // Available in UI?
    color: string;          // Theme color
}

export const STATES: StateConfig[] = [
    {
        code: 'TS',
        name: 'Telangana',
        portalUrl: 'https://bhubharati.telangana.gov.in/knowLandStatus',
        searchFields: ['survey', 'passbook'],
        requiresAuth: false,
        enabled: true,
        color: 'emerald',
    },
    {
        code: 'AP',
        name: 'Andhra Pradesh',
        portalUrl: 'https://meebhoomi.ap.gov.in',
        searchFields: ['survey', 'account'],
        requiresAuth: true,
        enabled: false,
        color: 'amber',
    },
    {
        code: 'KA',
        name: 'Karnataka',
        portalUrl: 'https://landrecords.karnataka.gov.in',
        searchFields: ['survey'],
        requiresAuth: false,
        enabled: false,
        color: 'yellow',
    }
];

export const DEFAULT_STATE = STATES[0];
