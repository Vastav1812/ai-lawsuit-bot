'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { CaseFilingForm, CaseFilingFormData } from '@/components/cases/CaseFilingForm';

export default function FileCasePage() {
  const handleFormSubmit = (data: CaseFilingFormData) => {
    console.log('Case filing data:', data);
    // Implement actual case filing logic here, e.g., API call
    alert('Case filed successfully!');
  };

  return (
    <PageContainer>
      <PageHeader
        title="File a New Case"
        description="Submit a grievance against an AI agent"
      />
      <CaseFilingForm onSubmit={handleFormSubmit} />
    </PageContainer>
  );
} 