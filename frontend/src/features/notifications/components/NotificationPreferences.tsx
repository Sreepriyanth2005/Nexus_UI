import React, { useEffect, useState } from 'react';
import { Spin, Switch, notification, Select } from 'antd';
import { api } from '../../../config/axios';

export interface NotificationPreference {
  certificateReadyEmail: boolean;
  certificateReadyInApp: boolean;
  courseCompletedEmail: boolean;
  courseCompletedInApp: boolean;
  courseEnrollmentEmail: boolean;
  courseEnrollmentInApp: boolean;
  deadlineReminderEmail: boolean;
  deadlineReminderInApp: boolean;
  emailAccountTimeZoneChanges: boolean;
  inactivityReminderEmail: boolean;
  inactivityReminderInApp: boolean;
  marketingEmail: boolean;
  marketingInApp: boolean;
  notificationFrequency: string;
  quizResultEmail: boolean;
  quizResultInApp: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notifications/preferences');
        if (res.data?.data) {
          setPreferences(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        notification.error({ message: 'Failed to load preferences' });
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleUpdate = async (key: keyof NotificationPreference, value: boolean | string) => {
    if (!preferences) return;
    
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    
    try {
      setSaving(true);
      await api.patch('/notifications/preferences', { [key]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
      notification.error({ message: 'Failed to update preference' });
      // Revert on failure
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !preferences) {
    return <div className="p-8 text-center"><Spin /></div>;
  }

  if (!preferences) {
    return <div className="p-8 text-center text-gray-500">Could not load preferences.</div>;
  }

  const preferenceItems = [
    { label: 'Course Enrollment', inAppKey: 'courseEnrollmentInApp', emailKey: 'courseEnrollmentEmail' },
    { label: 'Course Completion', inAppKey: 'courseCompletedInApp', emailKey: 'courseCompletedEmail' },
    { label: 'Quiz Results', inAppKey: 'quizResultInApp', emailKey: 'quizResultEmail' },
    { label: 'Certificates Ready', inAppKey: 'certificateReadyInApp', emailKey: 'certificateReadyEmail' },
    { label: 'Deadline Reminders', inAppKey: 'deadlineReminderInApp', emailKey: 'deadlineReminderEmail' },
    { label: 'Inactivity Reminders', inAppKey: 'inactivityReminderInApp', emailKey: 'inactivityReminderEmail' },
    { label: 'Marketing \u0026 Updates', inAppKey: 'marketingInApp', emailKey: 'marketingEmail' },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
        <p className="text-gray-500 mt-1">Control how and when you receive notifications from the platform.</p>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4">Email Frequency</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">How often should we email you?</div>
            <div className="text-sm text-gray-500">Choose your preferred email delivery frequency.</div>
          </div>
          <Select
            value={preferences.notificationFrequency}
            onChange={(val) => handleUpdate('notificationFrequency', val)}
            className="w-40"
            disabled={saving}
          >
            <Select.Option value="Immediate">Immediate</Select.Option>
            <Select.Option value="Daily">Daily Digest</Select.Option>
            <Select.Option value="Weekly">Weekly Digest</Select.Option>
            <Select.Option value="Never">Never</Select.Option>
          </Select>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 text-sm font-medium text-gray-500">
          <div className="col-span-6">Notification Type</div>
          <div className="col-span-3 text-center">In-App</div>
          <div className="col-span-3 text-center">Email</div>
        </div>

        <div className="divide-y divide-gray-100">
          {preferenceItems.map((item) => (
            <div key={item.label} className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
              <div className="col-span-6 font-medium text-gray-800">{item.label}</div>
              <div className="col-span-3 text-center">
                <Switch 
                  checked={preferences[item.inAppKey as keyof NotificationPreference] as boolean} 
                  onChange={(val) => handleUpdate(item.inAppKey as keyof NotificationPreference, val)}
                  disabled={saving}
                />
              </div>
              <div className="col-span-3 text-center">
                <Switch 
                  checked={preferences[item.emailKey as keyof NotificationPreference] as boolean} 
                  onChange={(val) => handleUpdate(item.emailKey as keyof NotificationPreference, val)}
                  disabled={saving || preferences.notificationFrequency === 'Never'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
