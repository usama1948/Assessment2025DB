import React, { useState, useEffect, useRef } from 'react';
import type { TestResult, School, TimssResult, UnifiedTestResult } from '../../types';

// Let TypeScript know that Chart.js is available on the global scope
declare var Chart: any;

interface TestResultsChartProps<T extends TestResult> {
    title: string;
    results: T[];
    schools: School[];
    subjects: readonly string[];
    grades?: readonly string[]; // Optional: For tests like TIMSS
    semesters?: readonly string[]; // Optional: For tests like Unified Test
    yAxisMin?: number;
    yAxisMax?: number;
    readOnly?: boolean;
}

export const TestResultsChart = <T extends TestResult>({ title, results, schools, subjects, grades, semesters, yAxisMin, yAxisMax, readOnly = false }: TestResultsChartProps<T>) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null); // To hold the chart instance

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]);
    const [selectedGrade, setSelectedGrade] = useState<string>(grades ? grades[0] : '');
    const [selectedSemester, setSelectedSemester] = useState<string>(semesters ? semesters[0] : '');

    useEffect(() => {
        if(readOnly && schools.length > 0) {
            setSelectedSchoolId(schools[0].nationalId);
        }
    }, [readOnly, schools]);

     useEffect(() => {
        // Reset selections if props change
        setSelectedGrade(grades ? grades[0] : '');
        setSelectedSemester(semesters ? semesters[0] : '');
    }, [grades, semesters]);

    useEffect(() => {
        if (!chartRef.current) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const canRenderChart = selectedSchoolId && selectedSubject && (!grades || selectedGrade) && (!semesters || selectedSemester);
        if(!canRenderChart) {
            return;
        }

        const filteredResults = results
            .filter(r => {
                let matches = String(r.schoolNationalId) === selectedSchoolId && r.subject === selectedSubject;
                if (grades && selectedGrade && 'grade' in r) {
                     matches = matches && (r as TimssResult).grade === selectedGrade;
                }
                if (semesters && selectedSemester && 'semester' in r) {
                    matches = matches && (r as UnifiedTestResult).semester === selectedSemester;
                }
                return matches;
            })
            .sort((a, b) => a.year - b.year);

        const chartData = filteredResults.map(r => ({ x: r.year, y: r.score }));

        const schoolName = schools.find(s => s.nationalId === selectedSchoolId)?.schoolNameAr || selectedSchoolId;
        const gradeText = selectedGrade ? ` للصف ${selectedGrade}`: '';
        const semesterText = selectedSemester ? ` للفصل ${selectedSemester}` : '';
        const chartTitle = chartData.length > 0 ? `نتائج ${selectedSubject}${gradeText}${semesterText} لمدرسة: ${schoolName}` : `تحليل نتائج ${title}`;

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        const noDataPlugin = {
          id: 'noData',
          afterDraw: (chart: any) => {
            if (chart.data.datasets[0].data.length === 0) {
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
                datasets: [{
                    label: 'العلامة',
                    data: chartData,
                    fill: false,
                    borderColor: 'rgb(56, 189, 248)', // sky-400
                    backgroundColor: 'rgb(14, 165, 233)', // sky-600
                    tension: 0.1,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                           size: 18,
                           family: 'Tajawal, sans-serif'
                        }
                    }
                },
                scales: {
                    y: {
                        min: yAxisMin ?? 200,
                        max: yAxisMax ?? 700,
                        title: {
                            display: true,
                            text: 'العلامة'
                        }
                    },
                    x: {
                         type: 'linear',
                         position: 'bottom',
                         title: {
                            display: true,
                            text: 'السنة'
                        },
                        ticks: {
                            precision: 0,
                            stepSize: 1
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

    }, [results, selectedSchoolId, selectedSubject, selectedGrade, selectedSemester, schools, subjects, grades, semesters, title, yAxisMin, yAxisMax]);

    const canRenderChart = selectedSchoolId && selectedSubject && (!grades || selectedGrade) && (!semesters || selectedSemester);
    const gridCols = `md:grid-cols-${1 + (grades ? 1 : 0) + (semesters ? 1 : 0) + (readOnly ? -1 : 0) || 1}`;

    return (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 min-h-[500px]">
            <h3 className="text-xl font-bold mb-4 text-slate-700">{title}</h3>
            
            <div className={`grid grid-cols-1 ${gridCols} gap-4 mb-6`}>
                {!readOnly && (
                    <div>
                        <label htmlFor="school-select" className="block text-sm font-medium text-slate-600 mb-1">اختر مدرسة</label>
                        <select
                            id="school-select"
                            value={selectedSchoolId}
                            onChange={(e) => setSelectedSchoolId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white"
                            disabled={readOnly}
                        >
                            <option value="">-- يرجى اختيار مدرسة --</option>
                            {schools.map(school => (
                                <option key={school.nationalId} value={school.nationalId}>{school.schoolNameAr} ({school.nationalId})</option>
                            ))}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="subject-select" className="block text-sm font-medium text-slate-600 mb-1">اختر المبحث</label>
                    <select
                        id="subject-select"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white"
                    >
                        {subjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>
                {grades && (
                     <div>
                        <label htmlFor="grade-select" className="block text-sm font-medium text-slate-600 mb-1">اختر الصف</label>
                        <select
                            id="grade-select"
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white"
                        >
                            {grades.map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                            ))}
                        </select>
                    </div>
                )}
                {semesters && (
                     <div>
                        <label htmlFor="semester-select" className="block text-sm font-medium text-slate-600 mb-1">اختر الفصل</label>
                        <select
                            id="semester-select"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white"
                        >
                            {semesters.map(semester => (
                                <option key={semester} value={semester}>{semester}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="relative h-96">
                {canRenderChart ? (
                     <canvas ref={chartRef}></canvas>
                ) : (
                    <div className="flex items-center justify-center h-full bg-slate-100 rounded-md">
                        <p className="text-slate-500 text-center p-4">يرجى اختيار مدرسة ومبحث{grades ? ' وصف ' : ' '}{semesters ? 'وفصل دراسي ' : ''}لعرض الرسم البياني.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
