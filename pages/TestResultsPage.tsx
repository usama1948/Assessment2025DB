import React from 'react';
import InternationalTestsView from '../components/international-tests/InternationalTestsView';
import NationalTestsView from '../components/national-tests/NationalTestsView';
import UnifiedTestsView from '../components/unified-tests/UnifiedTestsView';
import LiteracyNumeracyView from '../components/literacy-numeracy/LiteracyNumeracyView';
import AloTestsView from '../components/regional-tests/AloTestsView';
import { useApiData } from '../hooks/useApiData';
import type { TimssResult, PisaResult, PirlsResult, School, NationalTestResult, AssessmentTestResult, UnifiedTestResult, LiteracyNumeracyResult, AloResult } from '../types';
import CollapsibleSection from '../components/CollapsibleSection';
import { useAuth } from '../contexts/AuthContext';

const TestResultsPage: React.FC = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager';

    const { data: schools, loading: schoolsLoading } = useApiData<School>('schools');
    
    // FIX: Destructure the `error` state from each useApiData hook call.
    // TIMSS
    const { data: timssResults, addItem: addTimss, addMultipleItems: addMultipleTimss, updateItem: updateTimss, removeItem: deleteTimss, loading: timssLoading, error: timssError } = useApiData<TimssResult>('timssResults');

    // PISA
    const { data: pisaResults, addItem: addPisa, addMultipleItems: addMultiplePisa, updateItem: updatePisa, removeItem: deletePisa, loading: pisaLoading, error: pisaError } = useApiData<PisaResult>('pisaResults');

    // PIRLS
    const { data: pirlsResults, addItem: addPirls, addMultipleItems: addMultiplePirls, updateItem: updatePirls, removeItem: deletePirls, loading: pirlsLoading, error: pirlsError } = useApiData<PirlsResult>('pirlsResults');
    
    // National Test
    const { data: nationalTestResults, addItem: addNationalTest, addMultipleItems: addMultipleNationalTests, updateItem: updateNationalTest, removeItem: deleteNationalTest, loading: nationalLoading, error: nationalError } = useApiData<NationalTestResult>('nationalTestResults');
    
    // Assessment Test
    const { data: assessmentTestResults, addItem: addAssessmentTest, addMultipleItems: addMultipleAssessmentTests, updateItem: updateAssessmentTest, removeItem: deleteAssessmentTest, loading: assessmentLoading, error: assessmentError } = useApiData<AssessmentTestResult>('assessmentTestResults');
    
    // Unified Test
    const { data: unifiedTestResults, addItem: addUnifiedTest, addMultipleItems: addMultipleUnifiedTests, updateItem: updateUnifiedTest, removeItem: deleteUnifiedTest, loading: unifiedLoading, error: unifiedError } = useApiData<UnifiedTestResult>('unifiedTestResults');
    
    // Literacy & Numeracy
    const { data: literacyNumeracyResults, addItem: addLiteracyNumeracy, addMultipleItems: addMultipleLiteracyNumeracy, updateItem: updateLiteracyNumeracy, removeItem: deleteLiteracyNumeracy, loading: literacyLoading, error: literacyError } = useApiData<LiteracyNumeracyResult>('literacyNumeracyResults');
    
    // ALO
    const { data: aloResults, addItem: addAlo, addMultipleItems: addMultipleAlo, updateItem: updateAlo, removeItem: deleteAlo, loading: aloLoading, error: aloError } = useApiData<AloResult>('aloResults');
    
    const filterForManager = <T extends { schoolNationalId: string }>(results: T[]): T[] => {
        if (isManager && user?.schoolId) {
            return results.filter(r => String(r.schoolNationalId) === user.schoolId);
        }
        return results;
    }
    
    const schoolsForView = isManager ? schools.filter(s => s.nationalId === user?.schoolId) : schools;

    const isLoading = schoolsLoading || timssLoading || pisaLoading || pirlsLoading || nationalLoading || assessmentLoading || unifiedLoading || literacyLoading || aloLoading;

    if (isLoading) {
        return (
            <div className="text-center p-10 bg-white rounded-lg shadow-md">
                <p className="text-slate-500 text-lg">جاري تحميل بيانات الاختبارات من الخادم...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-700 mb-6">نتائج الاختبارات</h2>
            
            <CollapsibleSection title="الاختبارات الدولية">
                 <InternationalTestsView
                    schools={schoolsForView}
                    isManager={isManager}
                    // FIX: Pass the specific error states down to the child component.
                    // TIMSS Props
                    timssResults={filterForManager(timssResults)}
                    onAddTimss={addTimss}
                    onAddMultipleTimss={addMultipleTimss}
                    onUpdateTimss={updateTimss}
                    onDeleteTimss={deleteTimss}
                    apiErrorTimss={timssError}
                    // PISA Props
                    pisaResults={filterForManager(pisaResults)}
                    onAddPisa={addPisa}
                    onAddMultiplePisa={addMultiplePisa}
                    onUpdatePisa={updatePisa}
                    onDeletePisa={deletePisa}
                    apiErrorPisa={pisaError}
                    // PIRLS Props
                    pirlsResults={filterForManager(pirlsResults)}
                    onAddPirls={addPirls}
                    onAddMultiplePirls={addMultiplePirls}
                    onUpdatePirls={updatePirls}
                    onDeletePirls={deletePirls}
                    apiErrorPirls={pirlsError}
                 />
            </CollapsibleSection>

            <CollapsibleSection title="الاختبارات الوطنية">
                 <NationalTestsView
                    schools={schoolsForView}
                    isManager={isManager}
                    // National Test Props
                    nationalTestResults={filterForManager(nationalTestResults)}
                    onAddNationalTest={addNationalTest}
                    onAddMultipleNationalTests={addMultipleNationalTests}
                    onUpdateNationalTest={updateNationalTest}
                    onDeleteNationalTest={deleteNationalTest}
                    apiErrorNational={nationalError}
                    // Assessment Test Props
                    assessmentTestResults={filterForManager(assessmentTestResults)}
                    onAddAssessmentTest={addAssessmentTest}
                    onAddMultipleAssessmentTests={addMultipleAssessmentTests}
                    onUpdateAssessmentTest={updateAssessmentTest}
                    onDeleteAssessmentTest={deleteAssessmentTest}
                    apiErrorAssessment={assessmentError}
                 />
            </CollapsibleSection>

            <CollapsibleSection title="الاختبارات الموحدة">
                 <UnifiedTestsView
                    schools={schoolsForView}
                    isManager={isManager}
                    unifiedTestResults={filterForManager(unifiedTestResults)}
                    onAddUnifiedTest={addUnifiedTest}
                    onAddMultipleUnifiedTests={addMultipleUnifiedTests}
                    onUpdateUnifiedTest={updateUnifiedTest}
                    onDeleteUnifiedTest={deleteUnifiedTest}
                    apiError={unifiedError}
                 />
            </CollapsibleSection>

            <CollapsibleSection title="القرائية والحساب">
                 <LiteracyNumeracyView
                    schools={schoolsForView}
                    isManager={isManager}
                    literacyNumeracyResults={filterForManager(literacyNumeracyResults)}
                    onAddLiteracyNumeracy={addLiteracyNumeracy}
                    onAddMultipleLiteracyNumeracy={addMultipleLiteracyNumeracy}
                    onUpdateLiteracyNumeracy={updateLiteracyNumeracy}
                    onDeleteLiteracyNumeracy={deleteLiteracyNumeracy}
                    apiError={literacyError}
                 />
            </CollapsibleSection>
            
            <CollapsibleSection title="الاختبار الإقليمي: تقييم مخرجات التعلم (ALO)">
                 <AloTestsView
                    schools={schoolsForView}
                    isManager={isManager}
                    aloResults={filterForManager(aloResults)}
                    onAddAlo={addAlo}
                    onAddMultipleAlo={addMultipleAlo}
                    onUpdateAlo={updateAlo}
                    onDeleteAlo={deleteAlo}
                    apiError={aloError}
                 />
            </CollapsibleSection>
        </div>
    );
};

export default TestResultsPage;