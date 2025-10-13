import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { School, TestResult, TimssResult, PisaResult, PirlsResult, NationalTestResult, AssessmentTestResult, UnifiedTestResult, LiteracyNumeracyResult, AloResult } from '../types';
import { 
    TIMSS_SUBJECTS, TIMSS_GRADES, 
    PISA_SUBJECTS, 
    PIRLS_SUBJECTS,
    NATIONAL_TEST_SUBJECTS, NATIONAL_TEST_GRADES,
    ASSESSMENT_TEST_SUBJECTS,
    UNIFIED_TEST_SUBJECTS, UNIFIED_TEST_GRADES, UNIFIED_TEST_SEMESTERS,
    LITERACY_NUMERACY_SUBJECTS, LITERACY_NUMERACY_GRADES,
    ALO_SUBJECTS, ALO_GRADES
} from '../types';

declare var Chart: any;

interface SingleSchoolTrendReportProps {
    schools: School[];
    allResults: {
        timssResults: TimssResult[];
        pisaResults: PisaResult[];
        pirlsResults: PirlsResult[];
        nationalTestResults: NationalTestResult[];
        assessmentTestResults: AssessmentTestResult[];
        unifiedTestResults: UnifiedTestResult[];
        literacyNumeracyResults: LiteracyNumeracyResult[];
        aloResults: AloResult[];
    }
}

interface TestConfig {
    name: string;
    data: TestResult[];
    subjects: readonly string[];
    grades?: readonly string[];
    semesters?: readonly string[];
    yAxisOptions: { min: number, max: number };
}

export const SingleSchoolTrendReport: React.FC<SingleSchoolTrendReportProps> = ({ schools, allResults }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);
    
    const testConfigs = useMemo((): Record<string, TestConfig> => ({
        timssResults: { name: "TIMSS", data: allResults.timssResults, subjects: TIMSS_SUBJECTS, grades: TIMSS_GRADES, yAxisOptions: { min: 200, max: 700 }},
        pisaResults: { name: "PISA", data: allResults.pisaResults, subjects: PISA_SUBJECTS, yAxisOptions: { min: 200, max: 700 }},
        pirlsResults: { name: "PIRLS", data: allResults.pirlsResults, subjects: PIRLS_SUBJECTS, yAxisOptions: { min: 200, max: 700 }},
        nationalTestResults: { name: "الاختبار الوطني", data: allResults.nationalTestResults, subjects: NATIONAL_TEST_SUBJECTS, grades: NATIONAL_TEST_GRADES, yAxisOptions: { min: 0, max: 100 }},
        assessmentTestResults: { name: "الاختبار التقييمي", data: allResults.assessmentTestResults, subjects: ASSESSMENT_TEST_SUBJECTS, yAxisOptions: { min: 0, max: 100 }},
        unifiedTestResults: { name: "الاختبار الموحد", data: allResults.unifiedTestResults, subjects: UNIFIED_TEST_SUBJECTS, grades: UNIFIED_TEST_GRADES, semesters: UNIFIED_TEST_SEMESTERS, yAxisOptions: { min: 0, max: 100 }},
        literacyNumeracyResults: { name: "القرائية والحساب", data: allResults.literacyNumeracyResults, subjects: LITERACY_NUMERACY_SUBJECTS, grades: LITERACY_NUMERACY_GRADES, yAxisOptions: { min: 0, max: 100 }},
        aloResults: { name: "تقييم مخرجات التعلم (ALO)", data: allResults.aloResults, subjects: ALO_SUBJECTS, grades: ALO_GRADES, yAxisOptions: { min: 0, max: 100 }},
    }), [allResults]);

    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedTestKey, setSelectedTestKey] = useState<string>(Object.keys(testConfigs)[0]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('');

    const activeConfig = testConfigs[selectedTestKey];
    
    useEffect(() => {
        // Reset selections when test type changes
        setSelectedSubject(activeConfig.subjects[0] || '');
        setSelectedGrade(activeConfig.grades ? activeConfig.grades[0] : '');
        setSelectedSemester(activeConfig.semesters ? activeConfig.semesters[0] : '');
    }, [selectedTestKey, activeConfig]);

    useEffect(() => {
        if (!chartRef.current) return;
        
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        if (!selectedSchoolId) return;

        const filteredResults = activeConfig.data
            .filter(r => {
                let matches = String(r.schoolNationalId) === selectedSchoolId && r.subject === selectedSubject;
                if (activeConfig.grades && selectedGrade && 'grade' in r) {
                    matches = matches && (r as any).grade === selectedGrade;
                }
                if (activeConfig.semesters && selectedSemester && 'semester' in r) {
                    matches = matches && (r as any).semester === selectedSemester;
                }
                return matches;
            })
            .sort((a, b) => a.year - b.year);
        
        const chartData = filteredResults.map(r => ({ x: r.year, y: r.score }));

        const schoolName = schools.find(s => s.nationalId === selectedSchoolId)?.schoolNameAr || selectedSchoolId;
        const gradeText = selectedGrade ? ` للصف ${selectedGrade}`: '';
        const semesterText = selectedSemester ? ` للفصل ${selectedSemester}` : '';
        const chartTitle = `نتائج ${selectedSubject}${gradeText}${semesterText} لمدرسة: ${schoolName}`;

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
              ctx.fillStyle = 'rgb(100, 116, 139)';
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
                    borderColor: 'rgb(56, 189, 248)',
                    backgroundColor: 'rgb(14, 165, 233)',
                    tension: 0.1,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: chartTitle, font: { size: 18, family: 'Tajawal, sans-serif' } }
                },
                scales: {
                    y: { ...activeConfig.yAxisOptions, title: { display: true, text: 'العلامة' } },
                    x: {
                         type: 'linear',
                         position: 'bottom',
                         title: { display: true, text: 'السنة' },
                         ticks: { precision: 0, stepSize: 1, callback: (value: any) => value.toString().replace(/,/g, '') }
                    }
                }
            },
            plugins: [noDataPlugin]
        });

        return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
    }, [selectedSchoolId, selectedSubject, selectedGrade, selectedSemester, activeConfig, schools]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                <h2 className="text-2xl font-bold text-slate-700">إنشاء التقرير المقارن (لمدرسة واحدة)</h2>
                <p className="text-slate-500">اختر مدرسة واختباراً محدداً لعرض تطور أدائها عبر السنوات.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="school-select" className="block text-sm font-medium text-slate-600 mb-1">المدرسة</label>
                        <select id="school-select" value={selectedSchoolId} onChange={e => setSelectedSchoolId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                            <option value="">-- اختر مدرسة --</option>
                            {schools.sort((a,b) => a.schoolNameAr.localeCompare(b.schoolNameAr)).map(school => (
                                <option key={school.id} value={school.nationalId}>{school.schoolNameAr} ({school.nationalId})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="test-type-select-single" className="block text-sm font-medium text-slate-600 mb-1">نوع الاختبار</label>
                        <select id="test-type-select-single" value={selectedTestKey} onChange={e => setSelectedTestKey(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                            {Object.entries(testConfigs).map(([key, config]) => <option key={key} value={key}>{(config as TestConfig).name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="subject-select-single" className="block text-sm font-medium text-slate-600 mb-1">المبحث</label>
                        <select id="subject-select-single" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                            {activeConfig.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {activeConfig.grades && (
                        <div>
                            <label htmlFor="grade-select-single" className="block text-sm font-medium text-slate-600 mb-1">الصف</label>
                            <select id="grade-select-single" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                                {activeConfig.grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    )}
                    {activeConfig.semesters && (
                        <div>
                            <label htmlFor="semester-select-single" className="block text-sm font-medium text-slate-600 mb-1">الفصل الدراسي</label>
                            <select id="semester-select-single" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                                {activeConfig.semesters.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md min-h-[550px] flex items-center justify-center">
                {selectedSchoolId ? (
                     <div className="relative h-[500px] w-full">
                        <canvas ref={chartRef}></canvas>
                    </div>
                ): (
                    <div className="text-center text-slate-500">
                        <p>يرجى اختيار مدرسة من القائمة أعلاه لعرض الرسم البياني لتطور أدائها.</p>
                    </div>
                )}
            </div>
        </div>
    );
};