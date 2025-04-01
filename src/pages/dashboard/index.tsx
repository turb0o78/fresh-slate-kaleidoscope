import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layout';
import { DashboardHome } from './home';
import { ConnectionsPage } from './connections';
import { WorkflowsPage } from './workflows';
import { AnalyticsPage } from './analytics';
import { SettingsPage } from './settings';
import { ReferralsPage } from './referrals';
import { BillingPage } from './billing';

export function DashboardPage() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="workflows" element={<WorkflowsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Routes>
    </DashboardLayout>
  );
}