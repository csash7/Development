'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/config';

export function AnalyticsTracker() {
    useEffect(() => {
        // Track this visit (fire and forget)
        fetch(`${API_URL}/api/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => {
            // Silently fail - analytics should never break the app
        });
    }, []);

    // This component renders nothing
    return null;
}
