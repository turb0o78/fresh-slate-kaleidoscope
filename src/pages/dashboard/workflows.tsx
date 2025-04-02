
import React from 'react';
import { SocialWorkflowCreator } from '../../components/workflows/SocialWorkflowCreator';
import { ActiveWorkflows } from '../../components/workflows/ActiveWorkflows';

export function WorkflowsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Workflows automatiques</h1>
      
      <div className="space-y-6">
        <SocialWorkflowCreator />
        <ActiveWorkflows />
      </div>
    </div>
  );
}
