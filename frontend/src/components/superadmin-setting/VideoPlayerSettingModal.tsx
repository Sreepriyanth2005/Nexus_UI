import React from "react";
import { 
    X, 
    PlaySquare, 
    FastForward, 
    Maximize2, 
    Wifi, 
    Volume2, 
    Palette, 
    Subtitles,
    Save,
    Loader2,
    Sparkles,
    CheckCircle2
} from "lucide-react";
import { Toggle } from "../ui/Toggle";
import { Button } from "../ui/Button";

interface VideoPlayerSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoSettings: any;
    setVideoSettings: (settings: any) => void;
    onSave: () => void;
    isSaving: boolean;
}

export const VideoPlayerSettingModal: React.FC<VideoPlayerSettingModalProps> = ({
    isOpen,
    onClose,
    videoSettings,
    setVideoSettings,
    onSave,
    isSaving
}) => {
    if (!isOpen) return null;

    const toggles = [
        {
            key: "caption",
            title: "Subtitles & Closed Captions",
            desc: "Permit learners to toggle multilingual subtitles and automated transcripts during playback.",
            icon: Subtitles,
            color: "text-blue-500 bg-blue-50",
        },
        {
            key: "fastForwarding",
            title: "Timeline Fast-Forwarding & Seeking",
            desc: "Allow learners to scrub ahead or jump past unwatched video timeline segments.",
            icon: FastForward,
            color: "text-indigo-500 bg-indigo-50",
        },
        {
            key: "fullscreen",
            title: "Immersive Fullscreen Mode",
            desc: "Allow expanding video playback to native edge-to-edge browser display.",
            icon: Maximize2,
            color: "text-purple-500 bg-purple-50",
        },
        {
            key: "streaming",
            title: "Adaptive Bitrate Streaming (HLS)",
            desc: "Dynamically adjust video stream quality based on the learner's live bandwidth speed.",
            icon: Wifi,
            color: "text-emerald-500 bg-emerald-50",
        },
        {
            key: "volumeCtrl",
            title: "Volume Slider & Audio Boost",
            desc: "Allow learners to adjust output volume, mute audio, and activate vocal normalization.",
            icon: Volume2,
            color: "text-amber-500 bg-amber-50",
        },
        {
            key: "customizeCaption",
            title: "Custom Caption Aesthetics",
            desc: "Allow users to personalize font scale, contrast background, and text highlight colors.",
            icon: Palette,
            color: "text-rose-500 bg-rose-50",
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-300 border border-white/10 shadow-sm">
                            <PlaySquare className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white tracking-tight">Video Player Engine Configuration</h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    HLS Core
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">Customize global player controls and playback governance for course video assets.</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3 bg-slate-50/50">
                    {toggles.map((item) => {
                        const Icon = item.icon;
                        const isChecked = !!videoSettings[item.key];
                        return (
                            <div 
                                key={item.key} 
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                    isChecked 
                                        ? "bg-white border-indigo-200 shadow-sm" 
                                        : "bg-white/80 border-slate-200/80 hover:bg-white"
                                }`}
                            >
                                <div className="flex items-start gap-3.5 pr-4">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                                <Toggle 
                                    checked={isChecked} 
                                    onCheckedChange={(c) => setVideoSettings({ ...videoSettings, [item.key]: c })} 
                                    tone="check" 
                                    className="shrink-0"
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Applies platform-wide to all video media modules.</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Button 
                            variant="ghost" 
                            onClick={onClose} 
                            className="h-10 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={onSave} 
                            disabled={isSaving}
                            className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-sm shadow-blue-500/20 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Engine Settings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
