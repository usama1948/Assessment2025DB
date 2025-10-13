import React, { useState, useEffect, useMemo } from 'react';
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
import { ComparisonChart } from './charts/ComparisonChart';

interface ComparativeReportProps {
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

export const ComparativeReport: React.FC<ComparativeReportProps> = ({ schools, allResults }) => {

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

    const [selectedTestKey, setSelectedTestKey] = useState<string>(Object.keys(testConfigs)[0]);
    const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    
    const [chartProps, setChartProps] = useState<any>(null);
    const [message, setMessage] = useState<{type: 'info' | 'error', text: string} | null>(null);

    const activeConfig = testConfigs[selectedTestKey];

    useEffect(() => {
        // Reset selections when test type changes
        setSelectedSubject(activeConfig.subjects[0] || '');
        setSelectedGrade(activeConfig.grades ? activeConfig.grades[0] : '');
        setSelectedSemester(activeConfig.semesters ? activeConfig.semesters[0] : '');
        setChartProps(null);
    }, [selectedTestKey, activeConfig]);
    
    const handleSchoolSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // FIX: Explicitly type 'option' as HTMLOptionElement to resolve 'unknown' type error.
        const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        if (selectedOptions.length > 4) {
            setMessage({type: 'error', text: 'يمكنك اختيار أربعة مدارس على الأكثر للمقارنة.'});
        } else {
            setMessage(null);
        }
        setSelectedSchoolIds(selectedOptions);
        setChartProps(null); // Clear chart on new selection
    };

    const handleGenerateComparison = () => {
        if (selectedSchoolIds.length === 0 || selectedSchoolIds.length > 4 || !selectedSubject || (activeConfig.grades && !selectedGrade) || (activeConfig.semesters && !selectedSemester)) {
             setMessage({type: 'error', text: 'يرجى التأكد من اختيار المدارس (1-4) وجميع الحقول المطلوبة.'});
             return;
        }
        setMessage(null);

        const chartTitle = `مقارنة نتائج ${activeConfig.name} - ${selectedSubject}` +
            (selectedGrade ? ` - ${selectedGrade}` : '') +
            (selectedSemester ? ` - ${selectedSemester}` : '');

        const colors = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#c084fc'];
        
        const datasets = selectedSchoolIds.map((schoolId, index) => {
            const school = schools.find(s => s.nationalId === schoolId);
            const schoolResults = activeConfig.data
                .filter(r => {
                    let matches = String(r.schoolNationalId) === schoolId && r.subject === selectedSubject;
                    if (activeConfig.grades && selectedGrade && 'grade' in r) {
                        matches = matches && (r as any).grade === selectedGrade;
                    }
                    if (activeConfig.semesters && selectedSemester && 'semester' in r) {
                        matches = matches && (r as any).semester === selectedSemester;
                    }
                    return matches;
                })
                .sort((a, b) => a.year - b.year)
                .map(r => ({ x: r.year, y: r.score }));

            return {
                label: school?.schoolNameAr || schoolId,
                data: schoolResults,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length],
                fill: false,
                tension: 0.1,
                pointRadius: 5,
                pointHoverRadius: 8,
            };
        });

        setChartProps({
            title: chartTitle,
            datasets,
            yAxisOptions: activeConfig.yAxisOptions,
        });
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                <h2 className="text-2xl font-bold text-slate-700">إنشاء تقرير مقارنة الكيانات</h2>
                <p className="text-slate-500">قارن أداء مجموعة من المدارس (4 كحد أقصى) في اختبار معين عبر السنوات.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="test-type-select" className="block text-sm font-medium text-slate-600 mb-1">نوع الاختبار</label>
                        <select id="test-type-select" value={selectedTestKey} onChange={e => setSelectedTestKey(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                            {/* FIX: Add type assertion for 'config' to resolve 'unknown' type error from Object.entries. */}
                            {Object.entries(testConfigs).map(([key, config]) => <option key={key} value={key}>{(config as TestConfig).name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="subject-select" className="block text-sm font-medium text-slate-600 mb-1">المبحث</label>
                        <select id="subject-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                            {activeConfig.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {activeConfig.grades && (
                        <div>
                            <label htmlFor="grade-select" className="block text-sm font-medium text-slate-600 mb-1">الصف</label>
                            <select id="grade-select" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                                {activeConfig.grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    )}
                    {activeConfig.semesters && (
                        <div>
                            <label htmlFor="semester-select" className="block text-sm font-medium text-slate-600 mb-1">الفصل الدراسي</label>
                            <select id="semester-select" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                                {activeConfig.semesters.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div>
                    <label htmlFor="school-compare-select" className="block text-sm font-medium text-slate-600 mb-1">المدارس ({selectedSchoolIds.length}/4)</label>
                    <select id="school-compare-select" multiple value={selectedSchoolIds} onChange={handleSchoolSelectionChange} className="w-full h-40 p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                        {schools.sort((a, b) => a.schoolNameAr.localeCompare(b.schoolNameAr)).map(school => (
                            <option key={school.id} value={school.nationalId}>{school.schoolNameAr} ({school.nationalId})</option>
                        ))}
                    </select>
                </div>

                {message && (
                    <p className={`${message.type === 'error' ? 'text-red-600' : 'text-slate-500'} text-sm mt-2`}>
                        {message.text}
                    </p>
                )}
                
                <button
                    onClick={handleGenerateComparison}
                    disabled={selectedSchoolIds.length === 0 || selectedSchoolIds.length > 4}
                    className="w-full sm:w-auto bg-sky-600 text-white font-bold py-3 px-8 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    إنشاء المقارنة
                </button>
            </div>
            
            {chartProps && (
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <ComparisonChart {...chartProps} />
                </div>
            )}
        </div>
    );
};