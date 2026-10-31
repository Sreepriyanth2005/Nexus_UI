import React, { useState, useEffect } from 'react';
import { Smartphone, Laptop, LogOut, Loader2, ShieldCheck } from 'lucide-react';

interface SessionLimitProps {
    activeDevices: any[];
    onRevokeDevice: (deviceId: string) => void;
    onCancel: () => void;
    isPending?: boolean;
}

const SessionLimit: React.FC<SessionLimitProps> = ({
    activeDevices,
    onRevokeDevice,
    onCancel,
    isPending = false
}) => {
    const [revokingId, setRevokingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isPending) {
            setRevokingId(null);
        }
    }, [isPending]);

    const handleRevokeClick = (deviceId: string) => {
        setRevokingId(deviceId);
        onRevokeDevice(deviceId);
    };

    return (
        <div className="flex flex-col items-center text-center">
            {/* Device Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#f1b020]/10 border border-[#f1b020]/25 flex items-center justify-center mb-4 text-[#f5bf38] shadow-lg shadow-[#f1b020]/10">
                <Laptop className="w-7 h-7" />
            </div>

            {/* Device Limit Eyebrow */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1b020]/10 border border-[#f1b020]/20 text-[11px] font-bold uppercase tracking-wider text-[#f5bf38] mb-2.5">
                Concurrent Device Limit
            </span>

            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                Too many active sessions
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-[360px] mb-5">
                You are currently signed in on {activeDevices.length || 2} devices. Terminate an existing session to proceed with this login.
            </p>

            {/* Devices list */}
            <div className="w-full space-y-2.5 mb-5 text-left">
                {activeDevices.map((device: any, i: number) => {
                    const isMobile =
                        device.os?.toLowerCase().includes('ios') ||
                        device.os?.toLowerCase().includes('android');

                    return (
                        <div
                            key={device.deviceId || i}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                    {isMobile ? (
                                        <Smartphone className="w-4 h-4" />
                                    ) : (
                                        <Laptop className="w-4 h-4" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">
                                        {device.browser || "Browser"} · {device.os || "Device"}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        {device.location ? `${device.location} · ` : ''}
                                        {device.lastActiveAt || 'Active now'}
                                    </div>
                                </div>
                            </div>

                            {device.isCurrentDevice ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    This device
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleRevokeClick(device.deviceId)}
                                    disabled={isPending && revokingId === device.deviceId}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {isPending && revokingId === device.deviceId ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Revoking...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut className="w-3 h-3" />
                                            <span>Sign out</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cancel Action */}
            <button
                type="button"
                onClick={onCancel}
                className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center cursor-pointer mb-2"
            >
                Cancel and return to sign in
            </button>

            <p className="text-[11px] text-slate-500">
                Up to 2 active sessions permitted per enterprise user account.
            </p>
        </div>
    );
};

export default SessionLimit;
