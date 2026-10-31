import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send, Bell, AlertTriangle, Info, BellRing, Users } from 'lucide-react';
import { toast } from 'sonner';
import { NotificationAPI } from '../../core/api/notification.api';

const BroadcastNotification: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState('ALL_USERS');
  const [role, setRole] = useState('MEMBER');
  const [tenantId, setTenantId] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }

    if (audience === 'SPECIFIC_TENANT' && !tenantId.trim()) {
      toast.error('Tenant ID is required for tenant-specific broadcasts.');
      return;
    }

    try {
      setLoading(true);
      await NotificationAPI.sendBroadcastNotification({
        title,
        message,
        targetAudience: audience,
        priority,
        ...(audience === 'SPECIFIC_ROLE' && { targetRole: role }),
        ...(audience === 'SPECIFIC_TENANT' && { targetTenantId: tenantId }),
      });
      toast.success('Broadcast notification sent successfully!');
      setTitle('');
      setMessage('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send broadcast notification.');
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = () => {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'CRITICAL':
        return <BellRing className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/super-admin-dashboard')}
        className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Broadcast Notification</h1>
          <p className="text-slate-500 mt-2">Send system-wide announcements or alerts to targeted user groups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSend} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Audience & Priority</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'ALL_USERS', label: 'All Users', desc: 'Every active user' },
                    { id: 'SPECIFIC_ROLE', label: 'Specific Role', desc: 'E.g., Admins or SMEs' },
                    { id: 'SPECIFIC_TENANT', label: 'Specific Tenant', desc: 'Users in a single tenant' }
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setAudience(opt.id)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        audience === opt.id ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 mb-1 text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {audience === 'SPECIFIC_ROLE' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="MEMBER">Members (Learners)</option>
                    <option value="ADMIN">Tenant Admins</option>
                    <option value="CONTENT_DEVELOPER">Content Developers</option>
                    <option value="SME">Subject Matter Experts</option>
                  </select>
                </div>
              )}

              {audience === 'SPECIFIC_TENANT' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tenant ID</label>
                  <input
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="Enter the unique Tenant ID..."
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              )}

              <hr className="border-slate-100" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Priority Level</label>
                <div className="flex gap-4">
                  {[
                    { id: 'NORMAL', label: 'Information', color: 'blue' },
                    { id: 'HIGH', label: 'Warning', color: 'amber' },
                    { id: 'CRITICAL', label: 'Critical', color: 'red' }
                  ].map((p) => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p.id}
                        checked={priority === p.id}
                        onChange={(e) => setPriority(e.target.value)}
                        className={`text-${p.color}-600 focus:ring-${p.color}-500 w-4 h-4`}
                      />
                      <span className="text-sm font-medium text-slate-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Message Details</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., System Maintenance Upcoming"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message Content</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter the detailed announcement..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  System notifications cannot be deleted by end-users. They will remain visible as read-only.
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading || !title.trim() || !message.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
              >
                {loading ? 'Sending...' : 'Send Broadcast'}
                {!loading && <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Preview</h3>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-2 rounded-lg ${
                    priority === 'CRITICAL' ? 'bg-red-50' : 
                    priority === 'HIGH' ? 'bg-amber-50' : 'bg-blue-50'
                  }`}>
                    {renderIcon()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 leading-tight">
                      {title || 'Notification Title'}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2 whitespace-pre-wrap break-words">
                    {message || 'Your detailed message will appear here...'}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                      SYSTEM
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Just now</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Delivery Details
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 mt-2 list-disc pl-5">
                <li>Sent immediately to targeted users</li>
                <li>Appears in their in-app notification center</li>
                <li>Cannot be manually deleted by recipients</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastNotification;
