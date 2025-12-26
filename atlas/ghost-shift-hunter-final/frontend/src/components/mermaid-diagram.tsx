'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
        fontFamily: 'JetBrains Mono',
        primaryColor: '#3b82f6',
        primaryTextColor: '#fff',
        primaryBorderColor: '#60a5fa',
        lineColor: '#58a6ff',
        secondaryColor: '#161b22',
        tertiaryColor: '#161b22'
    }
});

export function MermaidDiagram({ chart }: { chart: string }) {
    const [svg, setSvg] = useState<string>('');

    useEffect(() => {
        const renderChart = async () => {
            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (error) {
                console.error('Mermaid render error:', error);
            }
        };

        if (chart) {
            renderChart();
        }
    }, [chart]);

    return (
        <div
            className="flex justify-center p-8 bg-surface/30 rounded-xl border border-white/5 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
