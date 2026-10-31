import React, { useState, useEffect, useRef } from "react";
import { Upload, Check, ArrowRight, X } from "../../assets/icons";
import { Loader2 } from "lucide-react";
import {
    useCertificateDesign,
    useSaveCertificateDesign,
    useResetCertificateDesign
} from "../../hooks/certificate/certificate";
import { useAssets } from "../../hooks/asset/useAssets";
import { SaveCertificateDesignPayload } from "../../core/api/certificate/certificateApi.types";
import { uploadAssetApi } from "../../core/api/asset/asset.api";
import { toast } from "sonner";
import { Skeleton } from "../../components/ui/Skeleton/Skeleton";

const ACCENT_COLORS = [
    { id: "gold", hex: "#C99B2E", label: "Gold" },
    { id: "blue", hex: "#2C5E92", label: "Blue" },
    { id: "green", hex: "#5F7D52", label: "Green" },
    { id: "terracotta", hex: "#8A4B3B", label: "Terracotta" },
    { id: "darkgrey", hex: "#3A3A3A", label: "Dark Grey" },
];

const FIELD_OPTIONS: Record<string, string[]> = {
    recipient: ["Learner full name", "Preferred name", "Display name"],
    learning: ["Course / learning title", "Career path title", "Programme name"],
    date: ["Completion date", "Issue date", "Enrollment date"],
    id: ["Credential ID", "Certificate serial number", "System ID"],
    issuer: ["Issuer / signatory", "Institute name", "Department name"],
};

const DEFAULT_FIELD_MAPPINGS = {
    recipient: "Learner full name",
    learning: "Course / learning title",
    date: "Completion date",
    id: "Credential ID",
    issuer: "Issuer / signatory",
};

const FIELDS = [
    { key: "recipient", label: "Recipient name", tag: "{{recipient}}" },
    { key: "learning", label: "Learning title", tag: "{{learning}}" },
    { key: "date", label: "Completion date", tag: "{{date}}" },
    { key: "id", label: "Credential ID", tag: "{{id}}" },
    { key: "issuer", label: "Issuer / signatory", tag: "{{issuer}}" },
];

const SAMPLE_VALUES: Record<string, Record<string, string>> = {
    recipient: {
        "Learner full name": "Aisha Al-Balushi",
        "Preferred name": "Aisha",
        "Display name": "Aisha A.",
    },
    learning: {
        "Course / learning title": "Data Quality Foundations",
        "Career path title": "Senior Data Governance Analyst Path",
        "Programme name": "National Data Management Programme",
    },
    date: {
        "Completion date": "14 May 2026",
        "Issue date": "15 May 2026",
        "Enrollment date": "01 Jan 2026",
    },
    id: {
        "Credential ID": "NX-2026-08814",
        "Certificate serial number": "SN-99482-NX",
        "System ID": "SYS-8814-2026",
    },
};

// Shared inner certificate content — same for all templates, only the frame differs
const CertificateContent = ({
    accentColor,
    logoPreview,
    signatoryName,
    signatoryTitle,
    footerLine,
    fieldMappings,
}: {
    accentColor: string;
    logoPreview: string | null;
    signatoryName: string;
    signatoryTitle?: string;
    footerLine?: string;
    fieldMappings?: Record<string, string>;
}) => {
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        setLogoError(false);
    }, [logoPreview]);

    const recipientText = SAMPLE_VALUES.recipient[fieldMappings?.recipient || "Learner full name"] || "Aisha Al-Balushi";
    const learningText = SAMPLE_VALUES.learning[fieldMappings?.learning || "Course / learning title"] || "Data Quality Foundations";
    const dateText = SAMPLE_VALUES.date[fieldMappings?.date || "Completion date"] || "14 May 2026";
    const idText = SAMPLE_VALUES.id[fieldMappings?.id || "Credential ID"] || "NX-2026-08814";

    return (
        <div className="acs-cert acs-cert-modern acs-cert-landscape absolute inset-0 flex flex-col items-center justify-between pt-5 sm:pt-[30px] md:pt-[40px] px-5 sm:px-[34px] md:px-[44px] pb-4 sm:pb-[24px] md:pb-[30px] text-center overflow-y-auto">
            {/* Logo */}
            {logoPreview && !logoError ? (
                <img
                    src={logoPreview}
                    alt="Institute logo"
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain rounded-[var(--r-md)] shrink-0"
                    onError={() => setLogoError(true)}
                />
            ) : (
                <div
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-[var(--r-md)] flex items-center justify-center text-white font-[var(--fw-bold)] text-[10px] sm:text-[length:var(--fs-meta)] shrink-0 font-[family-name:var(--font-sans)]"
                    style={{backgroundColor: accentColor}}
                >
                    NX
                </div>
            )}

            <div className="flex-1 flex flex-col justify-center my-2 sm:my-0">
                <p
                    className="text-[8px] sm:text-[9px] md:text-[length:var(--fs-micro)] font-[var(--fw-bold)] tracking-[var(--ls-label)] uppercase mb-2 sm:mb-4 font-[family-name:var(--font-sans)]"
                    style={{color: accentColor}}
                >
                    Certificate of Completion
                </p>

                <p className="text-[var(--ink-mute)] text-[10px] sm:text-[11px] md:text-[length:var(--fs-meta)] mb-1 sm:mb-1.5 font-[family-name:var(--font-sans)]" >
                    This certifies that
                </p>

                <h1
                    className="text-[18px] sm:text-[length:var(--fs-h1)] md:text-[30px] font-[var(--fw-bold)] text-[var(--ink)] mb-1.5 sm:mb-2.5 leading-tight tracking-tight font-[family-name:var(--font-serif)]"
                    
                >
                    {recipientText}
                </h1>

                <p className="text-[var(--ink-mute)] text-[10px] sm:text-[11px] md:text-[length:var(--fs-meta)] mb-1 sm:mb-1.5 font-[family-name:var(--font-sans)]" >
                    has successfully completed
                </p>

                <p
                    className="text-[length:var(--fs-label)] sm:text-[length:var(--fs-meta)] md:text-[length:var(--fs-body)] font-[var(--fw-semibold)] mb-2 sm:mb-3 font-[family-name:var(--font-sans)]"
                    style={{color: accentColor}}
                >
                    {learningText}
                </p>

                <p className="mb-2 sm:mb-3 text-[var(--ink-mute)] text-[9px] sm:text-[11px] md:text-[length:var(--fs-meta)] font-[family-name:var(--font-sans)]" >
                    Completed {dateText} &middot; Credential #{idText}
                </p>
            </div>

            {/* Signatory Footer */}
            <div className="flex flex-col items-center w-full shrink-0">
                <div className="w-[80px] sm:w-[110px] md:w-[140px] border-t border-[var(--ink-mute)] mb-1.5 shrink-0" />
                <p className="text-[var(--ink)] text-[length:var(--fs-label)] sm:text-[length:var(--fs-meta)] md:text-[length:var(--fs-body)] font-[var(--fw-medium)] font-[family-name:var(--font-serif)]" >
                    {signatoryName}
                </p>
                {signatoryTitle && (
                    <p className="text-[var(--ink-mute)] text-[9px] sm:text-[10px] md:text-[11px] font-[var(--fw-regular)] mt-0.5 font-[family-name:var(--font-sans)]" >
                        {signatoryTitle}
                    </p>
                )}
                {footerLine && (
                    <p className="text-[var(--ink-faint)] text-[8px] sm:text-[9px] md:text-[10px] font-[var(--fw-regular)] mt-1.5 sm:mt-2 font-[family-name:var(--font-sans)]" >
                        {footerLine}
                    </p>
                )}
            </div>
        </div>
    );
};



const CertificateDesign = () => {
    const { data: response, isLoading } = useCertificateDesign();
    const saveMutation = useSaveCertificateDesign();
    const resetMutation = useResetCertificateDesign();

    const logoInputRef = useRef<HTMLInputElement>(null);

    const [template, setTemplate] = useState<"Classic" | "Modern" | "Minimal">("Classic");
    const [orientation, setOrientation] = useState<"Landscape" | "Portrait">("Landscape");
    const [accentColor, setAccentColor] = useState("gold");
    const [signatoryName, setSignatoryName] = useState("Dr. Aisha Al-Balushi");
    const [signatoryTitle, setSignatoryTitle] = useState("Director, Academic Affairs, Nexus Academy");
    const [footerLine, setFooterLine] = useState("Verify this credential at nexusacademy.org/verify");
    const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(DEFAULT_FIELD_MAPPINGS);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [existingLogoAssetId, setExistingLogoAssetId] = useState<string | null>(null);
    const [inputLogoError, setInputLogoError] = useState(false);

    useEffect(() => {
        setInputLogoError(false);
    }, [logoPreview]);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!response?.data) return;
        const d = response.data as any;
        if (d.templateStyle) setTemplate(d.templateStyle as any);
        if (d.orientation) setOrientation(d.orientation as any);
        if (d.accentColor) {
            const match = ACCENT_COLORS.find(c => c.hex === d.accentColor || c.id === d.accentColor);
            setAccentColor(match ? match.id : "gold");
        }
        if (d.signatoryName) setSignatoryName(d.signatoryName);
        if (d.signatoryTitle) setSignatoryTitle(d.signatoryTitle);
        if (d.footerLine) setFooterLine(d.footerLine);
        if (d.fieldMappings && typeof d.fieldMappings === "object") {
            setFieldMappings({ ...DEFAULT_FIELD_MAPPINGS, ...d.fieldMappings });
        }
        if (d.logoUrl) {
            setLogoPreview(d.logoUrl);
        }
        if (d.logoAssetId) {
            setExistingLogoAssetId(d.logoAssetId);
        }
    }, [response]);

    const currentColor = ACCENT_COLORS.find(c => c.id === accentColor) ?? ACCENT_COLORS[0];

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoPreview(URL.createObjectURL(file));
        setLogoFile(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setLogoFile(null);
        setExistingLogoAssetId(null);
        if (logoInputRef.current) logoInputRef.current.value = "";
    };

    const handleFieldMapping = (key: string, value: string) =>
        setFieldMappings(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setIsSaving(true);
        let finalLogoAssetId = existingLogoAssetId;

        try {
            if (logoFile) {
                const formData = new FormData();
                formData.append("file", logoFile);
                formData.append("assetContext", "SYSTEM");
                formData.append("storagePath", "logos");
                formData.append("assetType", "IMAGE");
                const uploadedAsset = await uploadAssetApi(formData);
                finalLogoAssetId = uploadedAsset.id;
            }

            const payload: SaveCertificateDesignPayload = {
                templateStyle: template,
                orientation,
                accentColor: currentColor.hex,
                signatoryName,
                signatoryTitle,
                footerLine,
                fieldMappings,
                logoAssetId: finalLogoAssetId,
            };
            const res = await saveMutation.mutateAsync(payload);
            setLogoFile(null); // Clear file after successful save
            setExistingLogoAssetId(finalLogoAssetId); // Update tracked existing ID
            if ((res as any)?.data?.logoUrl) {
                setLogoPreview((res as any).data.logoUrl);
            }
            toast.success("Certificate design saved successfully");
        } catch (err: any) {
            console.error("Failed to save certificate design", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Unknown error";
            toast.error(`Failed to save certificate design: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        resetMutation.mutate(undefined as any, {
            onSuccess: () => {
                setTemplate("Classic");
                setOrientation("Landscape");
                setAccentColor("gold");
                setSignatoryName("Dr. Aisha Al-Balushi");
                setSignatoryTitle("Director, Academic Affairs, Nexus Academy");
                setFooterLine("Verify this credential at nexusacademy.org/verify");
                setFieldMappings(DEFAULT_FIELD_MAPPINGS);
                setLogoPreview(null);
                setLogoFile(null);
                setExistingLogoAssetId(null);
                toast.success("Design reset to default settings");
            },
            onError: (err: any) => {
                const errorMessage = err?.response?.data?.message || err?.message || "Unknown error";
                toast.error(`Failed to reset design: ${errorMessage}`);
            }
        });
    };

    if (isLoading) {
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
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mt-[18px] mb-5">
                <div>
                    <div className="text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-semibold)] text-[var(--c-honey-text)] mb-1.5 font-[family-name:var(--font-sans)]" >
                        CERTIFICATE MANAGEMENT
                    </div>
                    <h1 className="text-[length:var(--fs-h1)] font-[var(--fw-bold)] text-[var(--ink)] tracking-tight font-[family-name:var(--font-sans)]" >Certificate design &amp; mapping</h1>
                    <p className="text-[length:var(--fs-body)] text-[var(--ink-soft)] max-w-xl mt-1.5 font-[family-name:var(--font-sans)]" >
                        Set the layout and branding of the completion certificate, and map each placeholder to the data field that fills it. Applies to every credential Nexus Academy issues.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <button
                        onClick={handleReset}
                        disabled={resetMutation.isPending}
                        className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 border border-[var(--line)] rounded-full bg-[var(--paper)] py-[8px] px-[14px] text-[length:var(--fs-meta)] font-[var(--fw-bold)] text-[var(--ink)] hover:bg-[var(--paper-2)] hover:border-[var(--ink-mute)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md shadow-sm cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:hover:border-[var(--line)] font-[family-name:var(--font-sans)]"
                        
                    >
                        {resetMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Reset"}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || saveMutation.isPending}
                        className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 bg-[var(--btn)] border border-[var(--btn-hover)] text-[var(--btn-ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] py-[8px] px-[14px] rounded-full hover:bg-[var(--btn-hover)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md shadow-sm cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm font-[family-name:var(--font-sans)]"
                        
                    >
                        {isSaving || saveMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Check width={14} height={14} className="stroke-[2.5]" />}
                        Save template
                    </button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
                {/* LEFT COLUMN */}
                <div className="w-full lg:flex-1 space-y-6 lg:max-w-[540px] xl:max-w-xl">
                    {/* Layout & design card */}
                    <div className="flex flex-col bg-[var(--paper)] border border-[var(--line)] rounded-xl p-5 sm:p-6">
                        <h2 className="text-[length:var(--fs-body)] font-[var(--fw-bold)] text-[var(--ink)] mb-1 font-[family-name:var(--font-sans)]" >Layout &amp; design</h2>

                        {/* Template */}
                        <div className="acs-field flex flex-col gap-2  mt-[14px] mb-0">
                            <label className="block text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] font-[family-name:var(--font-sans)]" >TEMPLATE</label>
                            <div className="inline-flex bg-[var(--paper-2)] border border-[var(--line)] p-1 rounded-full w-max">
                                {(["Classic", "Modern", "Minimal"] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTemplate(t)}
                                        className={`px-4 py-[7px] rounded-full text-[length:var(--fs-label)] font-[var(--fw-semibold)] transition-colors ${template === t ? 'shadow-sm' : ''}`}
                                        style={template === t
                                            ? { backgroundColor: "var(--c-honey)", color: "var(--ink)" }
                                            : { color: "var(--ink-soft)" }
                                        }
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Orientation */}
                        <div className="acs-field flex flex-col gap-2 mt-[14px] mb-0">
                            <label className="block text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] font-[family-name:var(--font-sans)]" >ORIENTATION</label>
                            <div className="inline-flex bg-[var(--paper-2)] border border-[var(--line)] p-1 rounded-full w-max">
                                {(["Landscape", "Portrait"] as const).map(o => (
                                    <button
                                        key={o}
                                        onClick={() => setOrientation(o)}
                                        className={`px-4 py-[7px] rounded-full text-[length:var(--fs-label)] font-[var(--fw-semibold)] transition-colors ${orientation === o ? 'shadow-sm' : ''}`}
                                        style={orientation === o
                                            ? { backgroundColor: "var(--c-honey)", color: "var(--ink)" }
                                            : { color: "var(--ink-soft)" }
                                        }
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accent Colour */}
                        <div className="acs-field flex flex-col gap-2 mt-[14px] mb-0">
                            <label className="block text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] font-[family-name:var(--font-sans)]" >ACCENT COLOUR</label>
                            <div className="flex gap-2">
                                {ACCENT_COLORS.map(c => (
                                    <button
                                        key={c.id}
                                        title={c.label}
                                        onClick={() => setAccentColor(c.id)}
                                        className={`w-[30px] h-[30px] rounded-full transition-all ${accentColor === c.id ? "ring-2 ring-offset-2 ring-[var(--ink)]" : ""}`}
                                        style={{ backgroundColor: c.hex }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Institute Logo */}
                        <div className="acs-field flex flex-col gap-2 mt-[14px] mb-0">
                            <label className="block text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] font-[family-name:var(--font-sans)]" >INSTITUTE LOGO</label>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="logo-upload"
                                onChange={handleLogoChange}
                            />
                            {logoPreview ? (
                                <div className="flex items-center gap-3">
                                    {!inputLogoError && (
                                        <div className="w-10 h-10 rounded border border-[var(--line)] p-1 bg-[var(--paper-2)] flex items-center justify-center overflow-hidden shrink-0">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="w-full h-full object-contain"
                                                onError={() => setInputLogoError(true)}
                                            />
                                        </div>
                                    )}
                                    <label htmlFor="logo-upload" className="inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] px-[14px] py-[8px] rounded-full hover:bg-[var(--paper-2)] transition-colors cursor-pointer font-[family-name:var(--font-sans)]" >
                                        <Upload width={14} height={14} /> Replace logo
                                    </label>
                                    <button onClick={handleRemoveLogo} className="inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] px-[14px] py-[8px] rounded-full hover:bg-[var(--paper-2)] transition-colors cursor-pointer font-[family-name:var(--font-sans)]" >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="logo-upload" className="inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[length:var(--fs-meta)] font-[var(--fw-bold)] px-[14px] py-[8px] rounded-full hover:bg-[var(--paper-2)] transition-colors cursor-pointer w-max font-[family-name:var(--font-sans)]" >
                                    <Upload width={14} height={14} /> Upload logo
                                </label>
                            )}
                        </div>

                        {/* Signatory Name */}
                        <div className="acs-field flex flex-col gap-2 mt-[14px] mb-0">
                            <label className="block text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] font-[family-name:var(--font-sans)]" >SIGNATORY NAME</label>
                            <input type="text" value={signatoryName} onChange={e => setSignatoryName(e.target.value)}
                                className="acs-input w-full border border-[var(--line)] rounded-md bg-[var(--paper)] py-[9px] px-[12px] text-[length:var(--fs-meta)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-mute)] transition-colors" />
                        </div>

                        {/* Signatory Title */}
                        <div className="acs-field flex flex-col gap-2 mt-[14px] mb-0">
                            <label className="block text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] font-[family-name:var(--font-sans)]" >SIGNATORY TITLE</label>
                            <input type="text" value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)}
                                className="acs-input w-full border border-[var(--line)] rounded-md bg-[var(--paper)] py-[9px] px-[12px] text-[length:var(--fs-meta)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-mute)] transition-colors" />
                        </div>

                        {/* Footer / Verification Line */}
                        <div className="acs-field flex flex-col gap-2 mt-[14px] mb-0">
                            <label className="block text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] font-[family-name:var(--font-sans)]" >FOOTER / VERIFICATION LINE</label>
                            <input type="text" value={footerLine} onChange={e => setFooterLine(e.target.value)}
                                className="acs-input w-full border border-[var(--line)] rounded-md bg-[var(--paper)] py-[9px] px-[12px] text-[length:var(--fs-meta)] text-[var(--ink)] focus:outline-none focus:border-[var(--ink-mute)] transition-colors" />
                        </div>
                    </div>

                    {/* Field Mapping card */}
                    <div className="flex flex-col bg-[var(--paper)] border border-[var(--line)] rounded-xl p-5 sm:p-6">
                        <div>
                            <h2 className="text-[length:var(--fs-body)] font-[var(--fw-bold)] text-[var(--ink)] mb-1 font-[family-name:var(--font-sans)]" >Field mapping</h2>
                            <p className="text-[length:var(--fs-meta)] text-[var(--ink-soft)] mb-[14px] font-[family-name:var(--font-sans)]" >Each placeholder on the certificate is filled from the mapped data field at issue time.</p>
                        </div>

                        <div className="acs-map flex flex-col gap-4">
                            {FIELDS.map(f => (
                                <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="acs-map-ph flex flex-col items-start gap-1 flex-1 min-w-0">
                                        <div className="text-[length:var(--fs-label)] font-[var(--fw-semibold)] text-[var(--ink)] font-[family-name:var(--font-sans)]" >{f.label}</div>
                                        <code
                                            className="acs-map-code inline-block px-[6px] py-[1px] rounded text-[length:var(--fs-meta)] font-mono border border-[var(--c-honey-soft)] bg-[var(--c-honey-wash)] text-[var(--c-honey-text)]"
                                        >
                                            {f.tag}
                                        </code>
                                    </div>
                                    <ArrowRight width={14} height={14} strokeWidth={2.5} className="text-[var(--ink-faint)] hidden sm:block shrink-0" />
                                    <div className="flex-1 relative">
                                        <select
                                            value={fieldMappings[f.key] ?? FIELD_OPTIONS[f.key][0]}
                                            onChange={e => handleFieldMapping(f.key, e.target.value)}
                                            className="w-full h-10 border border-[var(--line-strong)] rounded-lg bg-[var(--paper)] px-3.5 pr-9 text-[length:var(--fs-meta)] font-[var(--fw-semibold)] text-[var(--ink-soft)] focus:outline-none focus:border-[var(--ink-mute)] cursor-pointer appearance-none"
                                        >
                                            {FIELD_OPTIONS[f.key].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                            <svg className="w-4 h-4 text-[var(--ink-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN — Live Preview */}
                <div className="w-full lg:flex-1 lg:max-w-2xl sticky top-6 mt-8 lg:mt-0">
                    <div className="acs-preview-lab text-[length:var(--fs-micro)] uppercase tracking-widest font-[var(--fw-bold)] text-[var(--ink-mute)] mb-[10px] font-[family-name:var(--font-sans)]" >LIVE PREVIEW</div>

                    {/* ── CLASSIC: thick top accent bar, plain white card ── */}
                    {template === "Classic" && (
                        <div
                            className="relative w-full bg-[var(--paper)] shadow-lg overflow-hidden"
                            style={{
                                aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
                                borderRadius: "14px",
                                border: "1px solid var(--line-strong)",
                            }}
                        >
                            {/* Thick accent bar */}
                            <div style={{ height: "10px", width: "100%", backgroundColor: currentColor.hex }} />
                            <CertificateContent
                                accentColor={currentColor.hex}
                                logoPreview={logoPreview}
                                signatoryName={signatoryName}
                                signatoryTitle={signatoryTitle}
                                footerLine={footerLine}
                                fieldMappings={fieldMappings}
                            />
                        </div>
                    )}

                    {/* ── MODERN: accent border + top accent bar ── */}
                    {template === "Modern" && (
                        <div
                            className="relative w-full bg-[var(--paper)] shadow-lg overflow-hidden"
                            style={{
                                aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
                                borderRadius: "14px",
                                border: `2px solid ${currentColor.hex}`,
                            }}
                        >
                            {/* Top accent bar */}
                            <div style={{ height: "8px", width: "100%", backgroundColor: currentColor.hex }} />
                            <CertificateContent
                                accentColor={currentColor.hex}
                                logoPreview={logoPreview}
                                signatoryName={signatoryName}
                                signatoryTitle={signatoryTitle}
                                footerLine={footerLine}
                                fieldMappings={fieldMappings}
                            />
                        </div>
                    )}

                    {/* ── MINIMAL: thin 3px top line ── */}
                    {template === "Minimal" && (
                        <div
                            className="relative w-full bg-[var(--paper)] shadow-lg overflow-hidden"
                            style={{
                                aspectRatio: orientation === "Landscape" ? "1.414/1" : "1/1.414",
                                borderRadius: "14px",
                                border: "1px solid var(--line-strong)",
                            }}
                        >
                            {/* Thin accent line */}
                            <div style={{ height: "3px", width: "100%", backgroundColor: currentColor.hex }} />
                            <CertificateContent
                                accentColor={currentColor.hex}
                                logoPreview={logoPreview}
                                signatoryName={signatoryName}
                                signatoryTitle={signatoryTitle}
                                footerLine={footerLine}
                                fieldMappings={fieldMappings}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CertificateDesign;
