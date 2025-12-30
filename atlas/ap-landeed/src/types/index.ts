// Land Record Types for AP Land Records Platform

export interface District {
    code: string;
    name: string;
    nameTelugu: string;
}

export interface Mandal {
    code: string;
    name: string;
    nameTelugu: string;
    districtCode: string;
}

export interface Village {
    code: string;
    name: string;
    nameTeugu: string;
    mandalCode: string;
}

export interface LandOwner {
    name: string;
    nameTeugu?: string;
    fatherName?: string;
    aadhaarLast4?: string;
    sharePercentage: number;
}

export interface LandRecord {
    id: string;
    surveyNumber: string;
    subDivision?: string;
    district: string;
    districtCode: string;
    mandal: string;
    mandalCode: string;
    village: string;
    villageCode: string;
    owners: LandOwner[];
    extent: {
        acres: number;
        guntas: number;
        cents: number;
    };
    landClassification: string;
    landNature: string;
    waterSource?: string;
    khataNumber?: string;
    pattaNumber?: string;
    lastUpdated: string;
    status: 'active' | 'disputed' | 'pending';
    coordinates?: [number, number]; // [longitude, latitude]
}

export interface EncumbranceCertificate {
    id: string;
    documentNumber: string;
    propertyDescription: string;
    district: string;
    sro: string;
    fromDate: string;
    toDate: string;
    encumbrances: Encumbrance[];
    status: 'clear' | 'encumbered';
    issuedDate: string;
}

export interface Encumbrance {
    type: 'mortgage' | 'sale' | 'gift' | 'lease' | 'lien' | 'partition';
    documentNumber: string;
    documentDate: string;
    parties: string[];
    amount?: number;
    description: string;
}

export interface SearchFilters {
    district?: string;
    mandal?: string;
    village?: string;
    searchType: 'surveyNumber' | 'ownerName' | 'khataNumber' | 'documentNumber';
    searchValue: string;
}

export interface SearchResult {
    records: LandRecord[];
    totalCount: number;
    page: number;
    pageSize: number;
}
