import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';

interface NotificationSchedule {
  id: string;
  jobName: string;
  cronExpr: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

const NotificationSchedules: React.FC = () => {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [retentionDays, setRetentionDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/notifications/config/retention');
      if (res.data?.success) {
        setRetentionDays(res.data.data.retentionDays);
      }
    } catch (error) {
      console.error('Failed to fetch config', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notification-schedules');
      if (res.data?.success) {
        setSchedules(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/notification-schedules/${id}`, { isActive: !currentStatus });
      fetchSchedules();
    } catch (error) {
      console.error('Failed to update schedule', error);
    }
  };

  const updateCron = async (id: string, newCron: string) => {
    try {
      await api.put(`/notification-schedules/${id}`, { cronExpr: newCron });
      fetchSchedules();
    } catch (error) {
      console.error('Failed to update cron', error);
    }
  };

  if (loading) return <div className="p-8">Loading schedules...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Schedules</h1>
          <p className="text-gray-500 mt-2">Manage automated backend notification triggers and retention.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Global Retention Policy</h2>
        <p className="text-gray-600 text-sm mb-4">
          Notifications older than this threshold will be permanently deleted by the cleanup job. 
          To change this value, update the <code>NOTIFICATION_RETENTION_DAYS</code> environment variable.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-semibold text-indigo-600">
            {retentionDays !== null ? `${retentionDays} Days` : 'Loading...'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cron Expression</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{schedule.jobName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input
                    type="text"
                    defaultValue={schedule.cronExpr}
                    onBlur={(e) => {
                      if (e.target.value !== schedule.cronExpr) {
                        updateCron(schedule.id, e.target.value);
                      }
                    }}
                    className="border rounded px-2 py-1 text-sm font-mono"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {schedule.lastRunAt ? new Date(schedule.lastRunAt).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleActive(schedule.id, schedule.isActive)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {schedule.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No schedules configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationSchedules;
