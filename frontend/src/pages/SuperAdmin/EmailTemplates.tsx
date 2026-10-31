import * as React from "react";
import { useEffect, useState } from "react";
import { Mail, Settings, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../../config/axios";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  templateId?: string;
}

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/notifications/templates');
        if (res.data.success) {
          setTemplates(res.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch email templates");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-2">Manage SendGrid transactional email templates used across the platform</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Mail className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {templates.map((template) => (
            <div key={template.id} className="border border-gray-100 rounded-xl p-5 hover:border-indigo-100 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${template.templateId ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {template.templateId ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">SendGrid Template ID</p>
                <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 font-mono text-xs text-gray-600 break-all">
                  {template.templateId ? template.templateId : 'Not Configured (Using default HTML)'}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="flex items-start gap-4">
            <Settings className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Template Configuration</h4>
              <p className="text-sm text-gray-500 mt-1">
                To update these templates, modify the <code>SENDGRID_*_TEMPLATE_ID</code> environment variables in your server configuration. If a template ID is not provided, the system falls back to generic HTML emails.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
