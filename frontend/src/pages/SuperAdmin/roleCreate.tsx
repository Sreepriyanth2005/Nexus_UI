// src/pages/SuperAdmin/roleCreate.tsx
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from "react-router";
import { createRole as apiCreateRole, CreateRolePayload } from '../../core/api/role.api';
import { usePermissions, usePlatformUsers } from '../../hooks/useRolesPermissions';
import { Search, Info } from 'lucide-react';
import { notification } from 'antd';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const generateCodeFromName = (name: string) =>
    name.trim().toUpperCase().replace(/\s+/g, '_');

export const RoleCreate: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        code: string;
        isSystemRole: boolean;
    }>({
        name: '',
        description: '',
        code: '',
        isSystemRole: false,
    });

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    const { data: apiPermissions = [], isLoading: permissionsLoading } = usePermissions();
    const { data: apiUsers = [], isLoading: usersLoading } = usePlatformUsers();

    // Group permissions by module
    const groupedPermissions = React.useMemo(() => {
        const groups: Record<string, typeof apiPermissions> = {};
        apiPermissions.forEach(perm => {
            const module = perm.module || 'SYSTEM';
            if (!groups[module]) groups[module] = [];
            groups[module].push(perm);
        });
        return groups;
    }, [apiPermissions]);

    const filteredUsers = React.useMemo(() => {
        if (!userSearchTerm) return [];
        return apiUsers.filter(u =>
            u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
    }, [apiUsers, userSearchTerm]);

    const createMut = useMutation({
        mutationFn: (payload: CreateRolePayload) => apiCreateRole(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            notification.success({ title: 'Role created successfully' });
            navigate('/roles-permissions');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to create role';
            notification.error({ title: msg });
        },
    });

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            code: generateCodeFromName(prev.name),
        }));
    }, [formData.name]);

    const handleCreate = () => {
        if (!formData.name) {
            notification.error({ title: 'Role name is required' });
            return;
        }

        createMut.mutate({
            code: formData.code,
            name: formData.name,
            description: formData.description,
            isSystemRole: formData.isSystemRole,
            userIds: selectedUserIds,
            permissionIds: selectedPermissionIds,
        });
    };

    const togglePermission = (id: string) => {
        setSelectedPermissionIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleUser = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
        setUserSearchTerm(''); // clear search after selection
    };

    const removeUser = (id: string) => {
        setSelectedUserIds(prev => prev.filter(u => u !== id));
    };

    if (permissionsLoading || usersLoading) {
        return (
            <div className="p-6 space-y-6 w-full min-h-screen bg-[var(--surface)]">
                <div className="space-y-2 mb-8">
                    <Skeleton className="h-8 w-1/4 rounded-[var(--r-sm)]" />
                    <Skeleton className="h-4 w-1/3 rounded-[var(--r-sm)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                    <Skeleton className="h-[100px] rounded-[var(--r-lg)]" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-7">
                <button onClick={() => navigate('/roles-permissions')} className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] hover:text-[var(--ink)] tracking-widest uppercase mb-5 flex items-center gap-1.5 transition-colors">
                    <span>&larr;</span> ROLES & PERMISSIONS
                </button>
                <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] uppercase tracking-widest mb-1.5">
                    SUPER ADMIN ONLY
                </div>
                <h1 className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] tracking-tight mb-2">Create new role</h1>
                <p className="text-[length:var(--fs-body)] text-[var(--ink-soft)]">
                    Define a custom role with a name, description, optional user assignments, and a granular permissions set.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Form */}
                <div className="flex-1 space-y-8">
                    {/* Basic Info */}
                    <Card className="rounded-[var(--r-lg)] px-[22px] py-[18px] shadow-[var(--shadow-sm)] space-y-[22px] border-[var(--line-strong)] bg-[var(--paper)]">
                        <div>
                            <label className="block text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] uppercase tracking-widest mb-2">
                                ROLE NAME <span className="text-[var(--c-honey)]">*</span>
                            </label>
                            <Input
                                variant="md"
                                type="text"
                                placeholder="e.g. Regional Manager"
                                value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="w-full h-[42px] border border-[var(--line-strong)] rounded-[var(--r-lg)] px-4 text-[length:var(--fs-body)] text-[var(--ink)] placeholder-[var(--ink-mute)] bg-[var(--paper)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/5"
                            />
                        </div>
                        <div>
                            <label className="block text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] uppercase tracking-widest mb-2">
                                SHORT DESCRIPTION
                            </label>
                            <Input
                                variant="md"
                                type="text"
                                placeholder="Briefly describe this role's purpose (shown in role picker)"
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full h-[42px] border border-[var(--line-strong)] rounded-[var(--r-lg)] px-4 text-[length:var(--fs-body)] text-[var(--ink)] placeholder-[var(--ink-mute)] bg-[var(--paper)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/5"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-[var(--line-strong)] rounded-[var(--r-lg)] bg-[var(--paper)] gap-3 sm:gap-0">
                            <div>
                                <h4 className="text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink)] mb-0.5">System Role</h4>
                                <p className="text-[length:var(--fs-label)] text-[var(--ink-mute)]">Designate this as a system-level role. Only use this for platform-wide roles.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={formData.isSystemRole}
                                onClick={() => setFormData(p => ({ ...p, isSystemRole: !p.isSystemRole }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-[var(--r-pill)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ink)] focus:ring-offset-2 ${formData.isSystemRole ? 'bg-[var(--ink)]' : 'bg-[var(--paper-2)]'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-[var(--paper)] transition-transform ${formData.isSystemRole ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div>
                            <label className="block text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] uppercase tracking-widest mb-2">
                                ASSIGN TO USERS
                            </label>
                            <div className="relative">
                                <Search className="w-[18px] h-[18px] absolute left-3.5 top-3.5 text-[var(--ink-mute)]" />
                                <Input
                                    variant="md"
                                    type="text"
                                    placeholder="Search users by name or email to assign this role..."
                                    value={userSearchTerm}
                                    onChange={e => setUserSearchTerm(e.target.value)}
                                    className="w-full h-[42px] border border-[var(--line-strong)] rounded-[var(--r-lg)] pl-11 pr-4 text-[length:var(--fs-body)] text-[var(--ink)] placeholder-[var(--ink-mute)] bg-[var(--paper)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/5"
                                />
                                {filteredUsers.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-lg)] shadow-[var(--shadow-md)] max-h-60 overflow-y-auto">
                                        {filteredUsers.map(u => (
                                            <div
                                                key={u.id}
                                                className="px-4 py-2 hover:bg-[var(--paper-2)] cursor-pointer text-[length:var(--fs-meta)]"
                                                onClick={() => toggleUser(u.id)}
                                            >
                                                <div className="font-[var(--fw-medium)] text-[var(--ink)]">{u.name}</div>
                                                <div className="text-[length:var(--fs-label)] text-[var(--ink-mute)]">{u.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Selected Users Tags */}
                            {selectedUserIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {selectedUserIds.map(id => {
                                        const u = apiUsers.find(user => user.id === id);
                                        return u ? (
                                            <div key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--paper-2)] rounded-[var(--r-pill)] text-[length:var(--fs-label)] font-[var(--fw-medium)] text-[var(--ink)]">
                                                {u.name}
                                                <button onClick={() => removeUser(id)} className="text-[var(--ink-mute)] hover:text-[var(--c-danger)]">&times;</button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            )}
                            <p className="text-[length:var(--fs-meta)] text-[var(--ink-mute)] mt-2.5">Optional. You can assign users after creation from the Roles & Permissions table.</p>
                        </div>
                    </Card>

                    {/* Permissions */}
                    <Card className="card-body bg-[var(--paper)] border border-[var(--line-strong)] rounded-[var(--r-lg)] px-[22px] py-[18px] shadow-[var(--shadow-sm)]">
                        <h2 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] uppercase tracking-widest mb-5">PERMISSIONS</h2>

                        <div className="space-y-8">
                            {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                                <div key={moduleName}>
                                    <h3 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] uppercase tracking-widest mb-[10px] border-b border-[var(--line)] pb-[6px]">
                                        {moduleName}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                        {perms.map(perm => (
                                            <label key={perm.id} className="rc-perm-item flex items-start gap-3 cursor-pointer group px-[10px] py-[8px] text-[var(--ink)] w-full break-words hover:bg-[var(--paper-2)] rounded-[var(--r-md)] transition-colors">
                                                <div className="pt-0.5 shrink-0">
                                                    <Checkbox
                                                        checked={selectedPermissionIds.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                        className="w-[18px] h-[18px] rounded-[4px] border-[var(--line-strong)] text-[var(--ink)] focus:ring-[var(--ink)] cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-[length:var(--fs-body)] transition-colors font-sans">
                                                        {perm.description || `${perm.action} ${perm.module}`}
                                                    </div>
                                                    <div className="text-[length:var(--fs-label)] text-[var(--ink-mute)] font-serif mt-0.5">
                                                        {perm.code}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column - Summary & Actions (Sticky) */}
                <div className="w-full lg:w-[340px] shrink-0">
                    <div className="sticky top-8 space-y-5">
                        {/* Summary Box */}
                        <Card className="rounded-[var(--r-lg)] px-[20px] py-[18px] shadow-[var(--shadow-sm)] border-[var(--line-strong)] bg-[var(--paper)]">
                            <h3 className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] uppercase tracking-widest mb-[14px]">
                                NEW ROLE SUMMARY
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] mb-1.5 uppercase tracking-widest">ROLE NAME</div>
                                    <div className="text-[length:var(--fs-body)] text-[var(--ink-soft)]">{formData.name || 'Not set'}</div>
                                </div>
                                <div>
                                    <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] mb-1.5 uppercase tracking-widest">DESCRIPTION</div>
                                    <div className="text-[length:var(--fs-body)] text-[var(--ink-soft)]">{formData.description || 'None'}</div>
                                </div>
                                <div>
                                    <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] mb-1.5 uppercase tracking-widest">ASSIGNED TO</div>
                                    <div className="text-[length:var(--fs-body)] text-[var(--ink-soft)]">
                                        {selectedUserIds.length === 0
                                            ? 'No one yet'
                                            : `${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''}`
                                        }
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[length:var(--fs-label)] font-[var(--fw-bold)] font-serif text-[var(--ink-mute)] mb-1.5 uppercase tracking-widest">PERMISSIONS</div>
                                    <div className="text-[length:var(--fs-body)] text-[var(--ink-soft)]">
                                        {selectedPermissionIds.length === 0
                                            ? 'None selected'
                                            : `${selectedPermissionIds.length} selected`
                                        }
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Info Box */}
                        <div className="p-5 bg-[var(--c-honey-wash)] border border-[var(--c-honey-soft)] rounded-[var(--r-lg)] flex items-start gap-3 text-[length:var(--fs-meta)] text-[var(--c-honey-text)] leading-relaxed">
                            <Info className="w-5 h-5 shrink-0 mt-0.5 text-[var(--c-honey-text)]" />
                            <div className="pt-0.5">
                                Custom roles extend the base permission set. Only Super Administrators can create or modify custom roles. Role creation is written to the audit log.
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="rc-rail-actions flex flex-col pt-2 gap-[10px]">
                            <Button
                                variant="primary"
                                onClick={handleCreate}
                                disabled={createMut.isPending || !formData.name}
                                className="nexus-btn w-full font-[var(--fw-semibold)] rounded-[var(--r-pill)] transition-colors disabled:opacity-50 cursor-pointer border border-[var(--c-honey-soft)] hover:bg-[var(--c-honey-soft)] hover:text-[var(--ink)] bg-[var(--c-honey-wash)] text-[var(--ink)] px-[18px] py-[11px] text-[length:var(--fs-body)]"
                            >
                                {createMut.isPending ? 'Creating...' : 'Create role'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/roles-permissions')}
                                className="nexus-btn ghost w-full border border-[var(--line-strong)] hover:bg-[var(--paper-2)] font-[var(--fw-semibold)] rounded-[var(--r-pill)] transition-colors cursor-pointer bg-[var(--paper)] text-[var(--ink)] px-[18px] py-[11px] text-[length:var(--fs-body)]"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleCreate;