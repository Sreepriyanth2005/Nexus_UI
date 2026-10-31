import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import Select from "react-select";
import { Icon } from "../../components/ui/Icon";
import { useGetTenantById } from "../../hooks/tenant";
import { getTenantUsersByTenantIdApi } from "../../core/api/tenantuser.api";
import { getAvailableCoursesApi, getAvailableCareerPathsApi, bulkAssignCorporateLearningApi } from "../../core/api/corporate-learning.api";

export default function BulkActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedIds, members } = location.state || { selectedIds: [], members: [] };

  const [tenantName, setTenantName] = useState("");
  const { mutateAsync: getTenant } = useGetTenantById();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");

  React.useEffect(() => {
    const fetchTenant = async () => {
      try {
        const storedUser = localStorage.getItem('keycloak_session_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const user = parsed?.user || parsed;
          const tid = user?.tenantId || user?.tenant?.id || user?.organizationId;
          if (tid) {
            setTenantId(tid);
            const tenantData = await getTenant(tid);
            if (tenantData?.name) {
              setTenantName(tenantData.name);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load tenant", err);
      }
    };
    fetchTenant();
  }, [getTenant]);

  const [selectedUsers, setSelectedUsers] = useState<any[]>(
    (members && selectedIds) ? members.filter((m: any) => selectedIds.includes(m.id)) : []
  );

  const { data: rawUsers = [] } = useQuery({
    queryKey: ["tenantUsers", tenantId],
    queryFn: () => getTenantUsersByTenantIdApi(tenantId),
    enabled: !!tenantId
  });

  const availableUsers = React.useMemo(() => {
    return rawUsers
      .filter((u: any) => {
        // Exclude Corporate Admins
        const roleValues = [
            u.roleCode, u.roleName, u.role?.code, u.role?.name, u.role,
            ...(Array.isArray(u.roles) ? u.roles.map((r: any) => typeof r === 'string' ? r : (r?.role?.code || r?.role?.name || r?.name || r?.code)) : []),
            ...(Array.isArray(u.realmRoles) ? u.realmRoles : [])
        ];
        const isCorporateAdmin = roleValues.some(val => typeof val === 'string' && val.toUpperCase().replace(/\s/g, '_') === "CORPORATE_ADMIN");
        
        if (isCorporateAdmin) return false;

        const fName = u.firstName || u.profile?.firstName || u.email || 'Unknown';
        const lName = u.lastName || u.profile?.lastName || '';
        const fullName = `${fName} ${lName}`.trim().toLowerCase();
        
        return !selectedUsers.find(su => su.id === u.id) && fullName.includes(searchQuery.toLowerCase());
      })
      .map((u: any) => {
        const fName = u.firstName || u.profile?.firstName || u.email || 'Unknown';
        const lName = u.lastName || u.profile?.lastName || '';
        return {
          id: u.id,
          name: `${fName} ${lName}`.trim(),
          email: u.email || u.profile?.email || '',
          progressValue: u.progressPercentage || u.progress || 0
        };
      });
  }, [rawUsers, selectedUsers, searchQuery]);

  const addUser = (user: any) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery("");
  };

  const removeUser = (idToRemove: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== idToRemove));
  };

  const count = selectedUsers.length;

  const [selectedContent, setSelectedContent] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const { data: courses = [] } = useQuery({
    queryKey: ["availableCourses", tenantId],
    queryFn: () => getAvailableCoursesApi(tenantId, { limit: 100 }),
    enabled: !!tenantId
  });

  const { data: careerPaths = [] } = useQuery({
    queryKey: ["availableCareerPaths", tenantId],
    queryFn: () => getAvailableCareerPathsApi(tenantId, { limit: 100 }),
    enabled: !!tenantId
  });

  const activeCourses = React.useMemo(() => courses.filter((c: any) => c.status === "PUBLISHED"), [courses]);
  const activeCareerPaths = React.useMemo(() => careerPaths.filter((c: any) => c.status === "PUBLISHED"), [careerPaths]);

  const { mutateAsync: assignCourse, isPending: isAssigning } = useMutation({
    mutationFn: (data: any) => bulkAssignCorporateLearningApi(tenantId, data),
    onSuccess: () => {
      setSelectedContent("");
      setTargetDate("");
      alert("Assigned successfully!");
    }
  });

  const handleAssign = async () => {
    if (!selectedContent || selectedUsers.length === 0) return;
    const [type, id] = selectedContent.split("::");
    const payload: any = {
      userIds: selectedUsers.map(u => u.id)
    };
    if (type === "COURSE") payload.courseId = id;
    if (type === "CAREER_PATH") payload.careerPathId = id;
    if (targetDate) payload.endDate = new Date(targetDate).toISOString();
    
    await assignCourse(payload);
  };

  const handleExportCSV = () => {
    if (selectedUsers.length === 0) return;
    const headers = ["Name", "Email", "Progress"];
    
    const rows = selectedUsers.map(user => {
      const email = user.email || "";
      const progress = user.progressValue !== undefined ? `${user.progressValue}%` : "0%";
      return [
        `"${(user.name || "").replace(/"/g, '""')}"`,
        `"${email.replace(/"/g, '""')}"`,
        `"${progress}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bulk_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectOptions = React.useMemo(() => [
    ...activeCourses.map((c: any) => ({ value: `COURSE::${c.id}`, label: c.title, type: 'COURSE' })),
    ...activeCareerPaths.map((c: any) => ({ value: `CAREER_PATH::${c.id}`, label: c.title, type: 'CAREER_PATH' }))
  ], [activeCourses, activeCareerPaths]);

  const formatOptionLabel = ({ label, type }: any) => (
    <div className="flex items-center justify-between">
      <span className="truncate mr-2 text-[14px]">{label}</span>
      {type === 'CAREER_PATH' && (
        <span className="inline-flex items-center justify-center rounded-[4px] bg-[#f6ded9] text-[#8e4530] text-[10px] font-bold tracking-[0.06em] px-[6px] py-[2px] whitespace-nowrap uppercase">
          Career Path
        </span>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <main className="min-w-0 relative min-h-[940px]">
        {/* Back Button */}
        <button
          onClick={() => navigate("/manage-roles")}
          className="font-sans text-[12px] tracking-[0.1em] uppercase text-[#5c5c5c] font-semibold bg-transparent border-none flex items-center gap-[6px] mb-[14px] p-0 cursor-pointer transition-colors hover:text-[#141414]"
        >
          <Icon size={14}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></Icon>
          Tenant users
        </button>

        {/* Page Head */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-[16px] mb-[24px]">
          <div>
            <div className="font-sans text-[12px] tracking-[0.08em] uppercase text-[#5c5c5c] font-semibold mb-[6px]">
              Tenant · {tenantName || "Corporate"}
            </div>
            <h1 className="font-sans text-[24px] text-[#141414] font-bold leading-[1.2] m-0 mb-[6px]">
              Bulk actions
            </h1>
            <p className="text-[16px] text-[#3a3a3a] leading-[1.55] m-0">
              {count} tenant user{count !== 1 ? 's' : ''} selected. Choose an action below to apply to all selected.
            </p>
          </div>
          <div className="shrink-0">
            <button
              className="inline-flex items-center justify-center h-[36px] px-[28px] rounded-full text-[14px] font-bold transition-all text-[#141414] bg-transparent border border-[#e5e7eb] hover:bg-[#f6f6f4] shadow-sm"
              onClick={() => setSelectedUsers([])}
            >
              Clear selection
            </button>
          </div>
        </div>

        {/* Selected Users Panel */}
        <div className="bg-[#fff] border border-[#e5e7eb] rounded-[8px] z-[5] mb-[24px] p-[18px] px-[22px] relative overflow-visible shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-[16px] mb-[12px]">
            <div className="font-sans text-[12px] tracking-[0.12em] uppercase text-[#5c5c5c] font-semibold mb-0">
              Selected users ({count})
            </div>
            <div className="inline-flex items-center relative">
              <Icon size={14} className="text-[#5c5c5c] pointer-events-none absolute left-[12px]">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </Icon>
              <input
                className="border border-[#11111129] rounded-[8px] bg-[#fff] w-[240px] max-w-full h-[38px] text-[16px] text-[#141414] px-[14px] pl-[34px] focus:border-[#c99b2e] focus:outline-none transition-colors box-border"
                placeholder="Add people..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />
              {(isDropdownOpen || searchQuery) && availableUsers.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#11111129] rounded-[8px] shadow-lg z-10 max-h-48 overflow-y-auto w-full min-w-[240px]">
                  {availableUsers.map((user: any) => (
                    <div 
                      key={user.id} 
                      onMouseDown={(e) => { e.preventDefault(); addUser(user); }} 
                      className="p-2.5 px-3.5 text-[15px] text-[#141414] hover:bg-[#f6f6f4] cursor-pointer transition-colors"
                    >
                      + {user.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-[8px]">
            {selectedUsers.map((user) => (
              <span key={user.id} className="h-[28px] font-sans text-[14px] text-[#141414] bg-[#fff] border border-[#e5e7eb] rounded-full inline-flex items-center gap-[6px] pl-[12px] pr-[8px] font-semibold transition-all">
                {user.name}
                <button
                  type="button"
                  onClick={() => removeUser(user.id)}
                  className="cursor-pointer text-[#5c5c5c] bg-transparent border-none inline-flex justify-center items-center p-0 leading-[1] transition-colors hover:text-[#141414]"
                  aria-label={`Remove ${user.name}`}
                >
                  <Icon size={10}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></Icon>
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">


          {/* Action Card: Assign course */}
          <div className="flex flex-col p-[22px] px-[24px] pb-[24px] transition-all bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] hover:-translate-y-[2px] overflow-visible">
            <div className="rounded-[8px] border border-[#e6f2e9] bg-[#e6f2e9] w-[36px] h-[36px] text-[#2e9f5b] shrink-0 grid place-items-center mb-[14px]">
              <Icon size={17}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></Icon>
            </div>
            <div className="font-sans text-[16px] tracking-[-0.01em] text-[#141414] mb-[5px] font-bold">Assign course</div>
            <p className="text-[16px] text-[#3a3a3a] flex-1 mb-[18px] leading-[1.5]">Assign a course to all {count} users.</p>
            <div className="mb-[12px]">
              <label className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] mb-[6px] font-semibold block">Select course or career path</label>
              <div className="w-full relative">
                <Select
                  options={selectOptions}
                  formatOptionLabel={formatOptionLabel}
                  onChange={(val: any) => setSelectedContent(val ? val.value : "")}
                  placeholder="Select an option..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '40px',
                      borderRadius: '8px',
                      borderColor: state.isFocused ? '#5c5c5c' : '#11111129',
                      boxShadow: state.isFocused ? '0 0 0 1px #5c5c5c' : 'none',
                      '&:hover': {
                        borderColor: '#5c5c5c'
                      }
                    }),
                    option: (base, { isFocused, isSelected }) => ({
                      ...base,
                      backgroundColor: isSelected ? '#f0fdf4' : isFocused ? '#f9fafb' : 'white',
                      color: isSelected ? '#166534' : '#141414',
                      cursor: 'pointer'
                    })
                  }}
                />
              </div>
            </div>
            <div className="mb-[12px] flex-1">
              <label className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#5c5c5c] mb-[6px] font-semibold block" htmlFor="cba-date">
                Target completion date <span className="normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <input id="cba-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="border border-[#11111129] rounded-[8px] w-full h-[40px] font-sans text-[16px] text-[#141414] bg-transparent px-[12px] transition-all focus:border-[#5c5c5c] focus:outline-none focus:shadow-[0_0_0_4px_#1111110a]" />
            </div>
            <div className="mt-auto pt-[4px] flex">
              <button 
                disabled={count === 0 || !selectedContent || isAssigning} 
                onClick={handleAssign}
                className="inline-flex items-center justify-center h-[36px] px-[20px] rounded-full text-[14px] font-bold transition-all text-[#141414] bg-[#fdf2b3] border border-[#e8ce7b] hover:bg-[#f7eaa1] shadow-[0_2px_8px_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? "Assigning..." : `Apply to ${count} users`}
              </button>
            </div>
          </div>

          {/* Action Card: Export selected */}
          <div className="flex flex-col p-[22px] px-[24px] pb-[24px] transition-all bg-[#fff] border border-[#1111111a] rounded-[14px] shadow-[0_4px_16px_-4px_rgba(42,17,8,0.1)] hover:-translate-y-[2px] overflow-visible flex-1">
            <div className="rounded-[8px] border border-[#fae2e2] bg-[#fae2e2] w-[36px] h-[36px] text-[#c12a1c] shrink-0 grid place-items-center mb-[14px]">
              <Icon size={17}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></Icon>
            </div>
            <div className="font-sans text-[16px] tracking-[-0.01em] text-[#141414] mb-[5px] font-bold">Export selected</div>
            <p className="text-[16px] text-[#3a3a3a] flex-1 mb-[18px] leading-[1.5]">Download CSV with profile and progress data for selected users.</p>
            <div className="mt-auto pt-[4px] flex">
              <button disabled={count === 0} onClick={handleExportCSV} className="inline-flex items-center gap-[6px] justify-center h-[36px] px-[20px] rounded-full text-[14px] font-bold transition-all text-[#141414] bg-[#fdf2b3] border border-[#e8ce7b] hover:bg-[#f7eaa1] shadow-[0_2px_8px_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed">
                <Icon size={14}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></Icon>
                Export {count} users
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
