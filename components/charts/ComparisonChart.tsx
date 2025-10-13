import React, { useEffect, useRef } from 'react';

declare var Chart: any;

interface ChartDataset {
    label: string;
    data: { x: number, y: number }[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    pointRadius: number;
    pointHoverRadius: number;
}

interface ComparisonChartProps {
    title: string;
    datasets: ChartDataset[];
    yAxisOptions: { min: number, max: number };
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ title, datasets, yAxisOptions }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        const noDataPlugin = {
          id: 'noData',
          afterDraw: (chart: any) => {
            const hasData = chart.data.datasets.some((ds: ChartDataset) => ds.data.length > 0);
            if (!hasData) {
              const { ctx, chartArea: { left, top, right, bottom } } = chart;
              ctx.save();
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.font = '16px Tajawal, sans-serif';
              ctx.fillStyle = 'rgb(100, 116, 139)'; // slate-500
              ctx.fillText('لا توجد بيانات للعرض حسب الاختيارات المحددة.', (left + right) / 2, (top + bottom) / 2);
              ctx.restore();
            }
          }
        };
        
        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                         labels: {
                            font: {
                                family: 'Tajawal, sans-serif'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 18,
                            family: 'Tajawal, sans-serif'
                        },
                        padding: {
                            bottom: 20
                        }
                    },
                     tooltip: {
                        bodyFont: {
                           family: 'Tajawal, sans-serif'
                        },
                        titleFont: {
                           family: 'Tajawal, sans-serif'
                        }
                    }
                },
                scales: {
                    y: {
                        min: yAxisOptions.min,
                        max: yAxisOptions.max,
                        title: {
                            display: true,
                            text: 'العلامة',
                            font: { family: 'Tajawal, sans-serif' }
                        },
                        ticks: {
                           font: { family: 'Tajawal, sans-serif' }
                        }
                    },
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'السنة',
                             font: { family: 'Tajawal, sans-serif' }
                        },
                        ticks: {
                            precision: 0,
                            stepSize: 1,
                            font: { family: 'Tajawal, sans-serif' }
                        }
                    }
                }
            },
            plugins: [noDataPlugin]
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [title, datasets, yAxisOptions]);

    return (
        <div className="relative h-[500px]">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};
