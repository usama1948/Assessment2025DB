    import React, { useState } from 'react';
    import { Tabs } from '../ui/Tabs';
    import { TestManager } from '../TestManager';
    import { TestResultsChart } from '../charts/TestResultsChart';
    import { 
        TimssResult, PisaResult, PirlsResult, TestResult, School,
        TIMSS_SUBJECTS, TIMSS_GRADES, PISA_SUBJECTS, PIRLS_SUBJECTS 
    } from '../../types';

    interface InternationalTestsViewProps {
        schools: School[];
        timssResults: TimssResult[];
        onAddTimss: (data: Omit<TimssResult, 'id' | 'dateAdded'>) => Promise<boolean>;
        onAddMultipleTimss: (data: Omit<TimssResult, 'id' | 'dateAdded'>[]) => Promise<boolean>;
        onUpdateTimss: (data: TimssResult) => Promise<boolean>;
        onDeleteTimss: (id: number) => Promise<boolean>;
        apiErrorTimss: string | null;
        
        pisaResults: PisaResult[];
        onAddPisa: (data: Omit<PisaResult, 'id' | 'dateAdded'>) => Promise<boolean>;
        onAddMultiplePisa: (data: Omit<PisaResult, 'id' | 'dateAdded'>[]) => Promise<boolean>;
        onUpdatePisa: (data: PisaResult) => Promise<boolean>;
        onDeletePisa: (id: number) => Promise<boolean>;
        apiErrorPisa: string | null;

        pirlsResults: PirlsResult[];
        onAddPirls: (data: Omit<PirlsResult, 'id' | 'dateAdded'>) => Promise<boolean>;
        onAddMultiplePirls: (data: Omit<PirlsResult, 'id' | 'dateAdded'>[]) => Promise<boolean>;
        onUpdatePirls: (data: PirlsResult) => Promise<boolean>;
        onDeletePirls: (id: number) => Promise<boolean>;
        apiErrorPirls: string | null;

        isManager?: boolean;
    }

    // FIX: Define local types to match TestManager props for strict type checking of configs.
    interface FormField {
        name: string;
        label: string;
        type: 'text' | 'number' | 'select';
        placeholder?: string;
        options?: readonly string[];
    }

    interface ListColumn<T extends TestResult> {
        header: string;
        accessor: keyof T;
    }

    interface TestConfig<T extends TestResult> {
        formFields: FormField[];
        listColumns: ListColumn<T>[];
        requiredFields: string[];
        excelHeaders: string[];
    }

    const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
    );

    const TableCellsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 6.75h17.25M3.375 12h17.25m-17.25 5.25h17.25M9 3.75v16.5M15 3.75v16.5" />
    </svg>
    );


    const InternationalTestsView: React.FC<InternationalTestsViewProps> = (props) => {
        const [activeTab, setActiveTab] = useState('TIMSS');
        const [view, setView] = useState<'data' | 'chart'>('data');
        const tabs = ['TIMSS', 'PISA', 'PIRLS'];

        const timssConfig: TestConfig<TimssResult> = {
            formFields: [
                { name: 'schoolNationalId', label: 'الرقم الوطني للمدرسة*', type: 'text', placeholder: '200100...' },
                { name: 'year', label: 'السنة*', type: 'number', placeholder: new Date().getFullYear().toString() },
                { name: 'subject', label: 'المبحث*', type: 'select', options: TIMSS_SUBJECTS },
                { name: 'score', label: 'العلامة*', type: 'number', placeholder: '500' },
                { name: 'grade', label: 'الصف*', type: 'select', options: TIMSS_GRADES },
            ],
            listColumns: [
                { header: 'المدرسة', accessor: 'schoolNationalId' },
                { header: 'السنة', accessor: 'year' },
                { header: 'المبحث', accessor: 'subject' },
                { header: 'الصف', accessor: 'grade' },
                { header: 'العلامة', accessor: 'score' },
            ],
            requiredFields: ['schoolNationalId', 'year', 'subject', 'score', 'grade'],
            excelHeaders: ['schoolNationalId', 'year', 'subject', 'score', 'grade'],
        };

        const pisaConfig: TestConfig<PisaResult> = {
            formFields: [
                { name: 'schoolNationalId', label: 'الرقم الوطني للمدرسة*', type: 'text', placeholder: '200100...' },
                { name: 'year', label: 'السنة*', type: 'number', placeholder: new Date().getFullYear().toString() },
                { name: 'subject', label: 'المبحث*', type: 'select', options: PISA_SUBJECTS },
                { name: 'score', label: 'العلامة*', type: 'number', placeholder: '500' },
            ],
            listColumns: [
                { header: 'المدرسة', accessor: 'schoolNationalId' },
                { header: 'السنة', accessor: 'year' },
                { header: 'المبحث', accessor: 'subject' },
                { header: 'العلامة', accessor: 'score' },
            ],
            requiredFields: ['schoolNationalId', 'year', 'subject', 'score'],
            excelHeaders: ['schoolNationalId', 'year', 'subject', 'score'],
        };

        const pirlsConfig: TestConfig<PirlsResult> = {
            formFields: [
                { name: 'schoolNationalId', label: 'الرقم الوطني للمدرسة*', type: 'text', placeholder: '200100...' },
                { name: 'year', label: 'السنة*', type: 'number', placeholder: new Date().getFullYear().toString() },
                { name: 'subject', label: 'المبحث*', type: 'select', options: PIRLS_SUBJECTS },
                { name: 'score', label: 'العلامة*', type: 'number', placeholder: '500' },
            ],
            listColumns: [
                { header: 'المدرسة', accessor: 'schoolNationalId' },
                { header: 'السنة', accessor: 'year' },
                { header: 'المبحث', accessor: 'subject' },
                { header: 'العلامة', accessor: 'score' },
            ],
            requiredFields: ['schoolNationalId', 'year', 'subject', 'score'],
            excelHeaders: ['schoolNationalId', 'year', 'subject', 'score'],
        };

        const handleTabChange = (tab: string) => {
            setView('data');
            setActiveTab(tab);
        }

        const renderViewToggle = () => (
            <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm bg-white" role="group">
                    <button
                        type="button"
                        onClick={() => setView('data')}
                        className={`relative inline-flex items-center gap-2 rounded-r-md px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-10 transition-colors ${
                            view === 'data' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <TableCellsIcon className="w-5 h-5" />
                        عرض البيانات
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('chart')}
                        className={`relative inline-flex items-center gap-2 rounded-l-md px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-10 transition-colors ${
                            view === 'chart' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        عرض الرسم البياني
                    </button>
                </div>
            </div>
        );

        return (
            <div>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
                <div className="mt-6">
                    {renderViewToggle()}
                    {activeTab === 'TIMSS' && (
                        view === 'data' ? (
                            <TestManager
                                title="نتائج اختبار TIMSS"
                                data={props.timssResults}
                                config={timssConfig}
                                onAdd={props.onAddTimss}
                                onAddMultiple={props.onAddMultipleTimss}
                                onUpdate={props.onUpdateTimss}
                                onDelete={props.onDeleteTimss}
                                schools={props.schools}
                                readOnly={props.isManager}
                                apiError={props.apiErrorTimss}
                            />
                        ) : (
                            <TestResultsChart
                                title="تحليل نتائج TIMSS عبر السنوات"
                                results={props.timssResults}
                                schools={props.schools}
                                subjects={TIMSS_SUBJECTS}
                                grades={TIMSS_GRADES}
                                readOnly={props.isManager}
                            />
                        )
                    )}
                    {activeTab === 'PISA' && (
                        view === 'data' ? (
                            <TestManager
                                title="نتائج اختبار PISA"
                                data={props.pisaResults}
                                config={pisaConfig}
                                onAdd={props.onAddPisa}
                                onAddMultiple={props.onAddMultiplePisa}
                                onUpdate={props.onUpdatePisa}
                                onDelete={props.onDeletePisa}
                                schools={props.schools}
                                readOnly={props.isManager}
                                apiError={props.apiErrorPisa}
                            />
                        ) : (
                            <TestResultsChart
                                title="تحليل نتائج PISA عبر السنوات"
                                results={props.pisaResults}
                                schools={props.schools}
                                subjects={PISA_SUBJECTS}
                                readOnly={props.isManager}
                            />
                        )
                    )}
                    {activeTab === 'PIRLS' && (
                        view === 'data' ? (
                            <TestManager
                                title="نتائج اختبار PIRLS"
                                data={props.pirlsResults}
                                config={pirlsConfig}
                                onAdd={props.onAddPirls}
                                onAddMultiple={props.onAddMultiplePirls}
                                onUpdate={props.onUpdatePirls}
                                onDelete={props.onDeletePirls}
                                schools={props.schools}
                                readOnly={props.isManager}
                                apiError={props.apiErrorPirls}
                            />
                        ) : (
                            <TestResultsChart
                                title="تحليل نتائج PIRLS عبر السنوات"
                                results={props.pirlsResults}
                                schools={props.schools}
                                subjects={PIRLS_SUBJECTS}
                                readOnly={props.isManager}
                            />
                        )
                    )}
                </div>
            </div>
        );
    };

    export default InternationalTestsView;
