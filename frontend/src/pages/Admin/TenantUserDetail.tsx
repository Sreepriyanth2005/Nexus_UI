import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getTenantUserByIdApi } from '../../core/api/tenantuser.api';

dayjs.extend(relativeTime);

interface TenantUserDetailProps {
  user: any;
  onBack: () => void;
}

export const TenantUserDetail: React.FC<TenantUserDetailProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  
  const tabs = [
    { id: 'Overview', label: 'Overview' },
    { id: 'Courses', label: 'Courses (8)' },
    { id: 'Completion', label: 'Completion proofs (5)' },
    { id: 'Activity', label: 'Activity log' },
    { id: 'Permissions', label: 'Permissions' },
  ];
  
  const { data: fullUser, isLoading } = useQuery({
    queryKey: ['tenantUser', user?.id],
    queryFn: () => getTenantUserByIdApi(user?.id),
    enabled: !!user?.id,
  });

  const displayUser = fullUser || user;
  
  const profile = displayUser?.profile || displayUser;
  const firstName = profile?.firstName || '';
  const lastName = profile?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || displayUser?.username || 'Unknown User';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  const email = displayUser?.email || '';
  const status = displayUser?.status || 'ACTIVE';
  
  // Try to get role from user.roles array or fallback
  const roleName = displayUser?.roles?.[0]?.role?.name || 'User';
  
  // Try to get department from user.departmentAssignments or user.department
  const deptName = displayUser?.departmentAssignments?.[0]?.department?.name || displayUser?.department?.name || 'No Department';
  
  const joinedDate = displayUser?.createdAt ? dayjs(displayUser.createdAt).format('DD MMM YYYY') : 'Unknown';
  // Mock last active for UI purposes if not available
  const lastActive = '2 min ago';

  const completedCoursesCount = displayUser?.userAnalytics?.completedCourses || 0;

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen p-6 animate-in fade-in duration-300">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        
        {/* Back Button */}
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tenant users
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 font-bold text-2xl border border-gray-100">
              {initials}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {status === 'ACTIVE' ? 'Active' : status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                  {roleName}
                </span>
              </div>
              
              <div className="text-sm text-gray-500 mt-2 flex items-center flex-wrap gap-1">
                <span>{email}</span>
                <span className="text-gray-300">•</span>
                <span>{deptName}</span>
                <span className="text-gray-300">•</span>
                <span>Joined {joinedDate}</span>
                <span className="text-gray-300">•</span>
                <span>Last active {lastActive}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Resend invite
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Edit role
            </button>
            <button className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
              Suspend
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-bold text-sm whitespace-nowrap transition-colors
                  ${activeTab === tab.id 
                    ? 'border-gray-900 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hours Learned</p>
                <p className="text-3xl font-bold text-gray-900">142.8h</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Courses Completed</p>
                <p className="text-3xl font-bold text-gray-900">{completedCoursesCount}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900">84.2%</p>
              </div>
            </div>

            {/* In Progress Courses */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">In-Progress Courses</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Course 1 */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-1">ISO 30401 KM Standard</h4>
                  <p className="text-sm text-gray-500 mb-6">Module 4 of 6 • Last accessed 2 hr ago</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gray-900 h-full rounded-full" style={{ width: '62%' }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">62%</span>
                  </div>
                </div>

                {/* Course 2 */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-1">Data Governance Essentials</h4>
                  <p className="text-sm text-gray-500 mb-6">Module 2 of 5 • Last accessed 3 days ago</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gray-900 h-full rounded-full" style={{ width: '28%' }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">28%</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
        
            {/* Mock other tabs for now */}
            {activeTab !== 'Overview' && (
              <div className="flex items-center justify-center py-20 animate-in slide-in-from-bottom-2 duration-300">
                <div className="text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                  <p>This section is under construction.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
