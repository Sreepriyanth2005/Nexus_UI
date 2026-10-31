import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Whatsapp, Facebook, Instagram, TwitterX, Linkedin, Mail } from "../../assets/icons";
import { courseApi } from "../../core/api/course/course.api";
import { regenerateLessonShareTokenApi } from "../../core/api/lesson/lesson.api";
import { regenerateCareerPathShareTokenApi } from "../../core/api/career-path/career-path.api";

export interface ShareContentItem {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  shareToken?: string | null;
  slug?: string | null;
  type?: string;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ShareContentItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, content }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  const rawType = (content?.type || "course").toLowerCase().replace(/_/g, "-");
  const isLesson = rawType === "lesson";
  const isCareerPath = rawType === "career-path" || rawType === "careerpath" || rawType === "learning-path";
  const pathPrefix = isLesson ? "lessons" : isCareerPath ? "career-paths" : "courses";

  useEffect(() => {
    if (!isOpen || !content) return;

    let isMounted = true;
    const defaultUrl = `${window.location.origin}/${pathPrefix}/share/${content.shareToken || content.id}`;
    setShareUrl(defaultUrl);

    // If shareToken isn't present, fetch/regenerate token from DB
    if (!content.shareToken && content.id) {
      const fetchPromise = isLesson
        ? regenerateLessonShareTokenApi(content.id)
        : isCareerPath
        ? regenerateCareerPathShareTokenApi(content.id)
        : courseApi.regenerateShareToken(content.id);

      fetchPromise
        .then((res: any) => {
          if (!isMounted) return;
          const token =
            res?.data?.data?.shareToken ||
            res?.data?.shareToken ||
            res?.shareToken;
          if (token) {
            setShareUrl(`${window.location.origin}/${pathPrefix}/share/${token}`);
          }
        })
        .catch(() => {
          // Keep safe fallback url
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, content, isLesson, isCareerPath, pathPrefix]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !content) return null;

  const typeLabel = isLesson ? "Lesson" : isCareerPath ? "Career Path" : "Course";
  const typeSlugPrefix = isLesson ? "lesson" : isCareerPath ? "career-path" : "course";
  const title = content.title || typeLabel;
  const thumbnail =
    content.thumbnailUrl ||
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=150";

  const displaySlug = content.slug || content.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const displayLink = `nexusacademy.org/${typeSlugPrefix}/${displaySlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link to clipboard.");
    }
  };

  const handleSocialShare = (platform: "whatsapp" | "facebook" | "instagram" | "twitter" | "linkedin" | "email") => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    let target = "";

    switch (platform) {
      case "whatsapp":
        target = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - `)}${encodedUrl}`;
        break;
      case "facebook":
        target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        target = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "linkedin":
        target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "email":
        target = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Check out this ${typeLabel.toLowerCase()}: `)}${encodedUrl}`;
        break;
      case "instagram":
        navigator.clipboard?.writeText(shareUrl).then(() => {
          toast.success("Link copied! Open Instagram to share in stories or DM.");
        });
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        return;
    }

    if (target) {
      window.open(target, "_blank", "noopener,noreferrer,width=600,height=500");
    }
  };

  const handleMore = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title} on Nexus Academy`,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          await handleCopy();
        }
      }
    } else {
      await handleCopy();
      toast.info("Native share not supported on this browser. Link copied to clipboard!");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim,rgba(0,0,0,0.5))] backdrop-blur-xs select-none animate-in fade-in duration-200"
      style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[24px] bg-[var(--paper,#ffffff)] shadow-[var(--shadow-card,0_24px_48px_-12px_rgba(0,0,0,0.18))] p-6 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-bold text-[var(--ink,#141414)] tracking-tight">Share this</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-mute,#5c5c5c)] hover:text-[var(--ink,#141414)] hover:bg-[var(--paper-2,#f6f6f4)] transition-colors cursor-pointer bg-transparent border-none outline-none"
            aria-label="Close modal"
          >
            <X className="w-[17px] h-[17px]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Course Card Preview */}
          <div className="border border-[var(--line,#e5e7eb)] rounded-2xl p-3.5 flex items-center gap-3.5 bg-[var(--paper,#ffffff)]">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[var(--paper-2,#f6f6f4)] border border-gray-100 flex items-center justify-center">
              <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-bold text-[var(--ink,#141414)] leading-snug line-clamp-2 mb-0.5">
                {title}
              </h3>
              <p className="text-[13px] text-[var(--ink-mute,#5c5c5c)] truncate">
                {displayLink}
              </p>
            </div>
          </div>

          {/* Social Share Options */}
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-[var(--ink-mute,#5c5c5c)] mb-2">
              SHARE TO
            </p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => handleSocialShare("whatsapp")}
                className="border border-[var(--line,#e5e7eb)] rounded-xl py-3.5 flex flex-col items-center gap-2 hover:-translate-y-0.5 hover:shadow-xs hover:bg-[var(--paper-2,#f6f6f4)] transition-all duration-200 cursor-pointer bg-white outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--c-sage-wash,#dce5d3)] flex items-center justify-center text-[var(--c-sage-text,#446038)]">
                  <Whatsapp className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft,#3a3a3a)]">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleSocialShare("facebook")}
                className="border border-[var(--line,#e5e7eb)] rounded-xl py-3.5 flex flex-col items-center gap-2 hover:-translate-y-0.5 hover:shadow-xs hover:bg-[var(--paper-2,#f6f6f4)] transition-all duration-200 cursor-pointer bg-white outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[#e7f0fd] flex items-center justify-center text-[#1877f2]">
                  <Facebook className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft,#3a3a3a)]">Facebook</span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={() => handleSocialShare("instagram")}
                className="border border-[var(--line,#e5e7eb)] rounded-xl py-3.5 flex flex-col items-center gap-2 hover:-translate-y-0.5 hover:shadow-xs hover:bg-[var(--paper-2,#f6f6f4)] transition-all duration-200 cursor-pointer bg-white outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-white border border-[#f3d3dc] flex items-center justify-center text-[#e4405f]">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft,#3a3a3a)]">Instagram</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={() => handleSocialShare("twitter")}
                className="border border-[var(--line,#e5e7eb)] rounded-xl py-3.5 flex flex-col items-center gap-2 hover:-translate-y-0.5 hover:shadow-xs hover:bg-[var(--paper-2,#f6f6f4)] transition-all duration-200 cursor-pointer bg-white outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[#f0f0ee] flex items-center justify-center text-[var(--ink,#141414)]">
                  <TwitterX className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft,#3a3a3a)]">X / Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => handleSocialShare("linkedin")}
                className="border border-[var(--line,#e5e7eb)] rounded-xl py-3.5 flex flex-col items-center gap-2 hover:-translate-y-0.5 hover:shadow-xs hover:bg-[var(--paper-2,#f6f6f4)] transition-all duration-200 cursor-pointer bg-white outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--c-honey-wash,#f6e8c4)] flex items-center justify-center text-[var(--c-honey-text,#755a12)]">
                  <Linkedin className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft,#3a3a3a)]">LinkedIn</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => handleSocialShare("email")}
                className="border border-[var(--line,#e5e7eb)] rounded-xl py-3.5 flex flex-col items-center gap-2 hover:-translate-y-0.5 hover:shadow-xs hover:bg-[var(--paper-2,#f6f6f4)] transition-all duration-200 cursor-pointer bg-white outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--c-clay-wash,#efd3c7)] flex items-center justify-center text-[var(--c-clay-text,#8f3a20)]">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft,#3a3a3a)]">Email</span>
              </button>
            </div>

            {/* More Button */}
            <button
              type="button"
              onClick={handleMore}
              className="w-full border border-[var(--line,#e5e7eb)] rounded-full py-2.5 px-4 flex items-center justify-center text-[15px] font-bold text-[var(--ink,#141414)] hover:bg-[var(--paper-2,#f6f6f4)] transition-all cursor-pointer bg-white outline-none shadow-2xs"
            >
              More
            </button>
          </div>

          {/* Copy Link Section */}
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-[var(--ink-mute,#5c5c5c)] mb-2">
              OR COPY LINK
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 min-w-0 border border-[var(--line,#e5e7eb)] rounded-xl px-3.5 py-2.5 bg-white text-[13px] text-[var(--ink-soft,#3a3a3a)] font-medium select-all outline-none truncate shadow-2xs"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--c-honey-wash,#FCF7AE)] hover:bg-[#F5EB8A] text-[var(--ink,#141414)] font-bold border border-[#e5df8a] transition-transform active:scale-95 cursor-pointer shrink-0 shadow-2xs"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Helper Footer */}
          <p className="text-[12px] text-[var(--ink-mute,#5c5c5c)] leading-relaxed pt-2 border-t border-gray-100">
            Sharing reveals title + cover image + duration. Actual content stays gated by enrollment / persona
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
