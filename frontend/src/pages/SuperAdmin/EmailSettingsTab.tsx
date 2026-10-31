import React, { useState, useEffect } from "react";
import { api } from "../../config/axios";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";

interface Template {
    id: string;
    name: string;
    templateId: string;
}

interface AuditLog {
    id: string;
    action: string;
    reason: string;
    createdAt: string;
}

interface EmailSettingsProps {
    emailSettings: {
        notificationRetention: string;
        inactiveLearnerTrigger: string;
        notificationPriority: string;
    };
    setEmailSettings: React.Dispatch<React.SetStateAction<{
        notificationRetention: string;
        inactiveLearnerTrigger: string;
        notificationPriority: string;
    }>>;
}

export const EmailSettingsTab = ({ emailSettings, setEmailSettings }: EmailSettingsProps) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templateRes, logsRes] = await Promise.all([
                    api.get('/notifications/templates'),
                    api.get('/admin/progress/audit?action=NOTIFICATION_DELIVERY') // assuming partial match or just fetching audit logs
                ]);

                if (templateRes.data?.success) {
                    setTemplates(templateRes.data.data);
                }
                if (logsRes.data?.data) {
                    // Filter down to just notification delivery logs if not filtered by backend
                    const deliveryLogs = logsRes.data.data.filter((l: any) => l.action.startsWith('NOTIFICATION_DELIVERY'));
                    setLogs(deliveryLogs);
                }
            } catch (error) {
                console.error("Failed to load email settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#C16253]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Email Configuration Policies */}
            <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Email & Notification Policies</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Notification Retention</label>
                        <input type="text" value={emailSettings.notificationRetention} onChange={(e) => setEmailSettings({...emailSettings, notificationRetention: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        <p className="text-[10px] text-gray-400 mt-1">Number of days to keep in-app notifications before deletion.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Inactive Learner Reminder Trigger</label>
                        <input type="text" value={emailSettings.inactiveLearnerTrigger} onChange={(e) => setEmailSettings({...emailSettings, inactiveLearnerTrigger: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                        <p className="text-[10px] text-gray-400 mt-1">When to trigger engagement emails (e.g. 2 weeks, 1 month).</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">Notification Priority Levels</label>
                        <input type="text" value={emailSettings.notificationPriority} onChange={(e) => setEmailSettings({...emailSettings, notificationPriority: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-[#C16253]/20 focus:border-[#C16253] transition-all" />
                    </div>
                </div>
            </div>

            {/* Template Configuration Status */}
            <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Active SendGrid Templates</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                                <p className="text-xs font-mono text-gray-500 mt-1">{t.templateId || 'Not configured'}</p>
                            </div>
                            {t.templateId ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                    Templates are loaded from backend environment variables. Update `.env` to change template IDs.
                </p>
            </div>

            {/* Delivery Audit Logs */}
            <div className="bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Notification Delivery Audit Logs</h2>
                </div>

                {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No recent delivery logs found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#FAF9F5]/80 text-gray-500 text-xs tracking-wider">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium uppercase rounded-tl-lg">Date</th>
                                    <th className="text-left px-4 py-3 font-medium uppercase">Status</th>
                                    <th className="text-left px-4 py-3 font-medium uppercase rounded-tr-lg">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map(log => {
                                    const isSuccess = log.action.includes('SUCCESS');
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {isSuccess ? 'Delivered' : 'Failed'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-gray-800">
                                                {log.reason}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
