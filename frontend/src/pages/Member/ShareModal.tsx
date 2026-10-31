import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import { Award, BookOpen, Loader2, X, Copy, Check, Share2, Globe } from "lucide-react";

import { Whatsapp, Facebook, Instagram, TwitterX, Linkedin, Mail } from "../../assets/icons";
import { certificateIntegrationApi } from "../../core/api/certificate/certificate.api";
import { courseApi } from "../../core/api/course/course.api";

export interface ShareItem {
  id?: string;
  title?: string;
  thumbnailUrl?: string;
  type?: "certificate" | "course" | "career-path" | string;
  shareToken?: string;
  proofId?: string;
  link?: string;
}

export interface ShareModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  content?: ShareItem;
  title?: string;
  thumbnail?: string;
  link?: string;
}

const getAssetImageUrl = (ast: any): string | null => {
  if (!ast) return null;
  if (typeof ast === "string") {
    const trimmed = ast.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("data:image")) {
      return trimmed;
    }
    return null;
  }
  if (typeof ast === "object") {
    if (ast.signedUrl && typeof ast.signedUrl === "string") return ast.signedUrl;
    if (ast.fileUrl && typeof ast.fileUrl === "string") return ast.fileUrl;
    if (ast.url && typeof ast.url === "string") return ast.url;
    if (ast.thumbnailUrl && typeof ast.thumbnailUrl === "string") return ast.thumbnailUrl;
    if (ast.coverImageUrl && typeof ast.coverImageUrl === "string") return ast.coverImageUrl;
    if (ast.gcsKey && ast.bucketName) return `https://storage.googleapis.com/${ast.bucketName}/${ast.gcsKey}`;
  }
  return null;
};

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen = true,
  onClose,
  content: propContent,
  title: propTitle,
  thumbnail: propThumbnail,
  link: propLink,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Merge content from props or location.state
  const activeContent: ShareItem | undefined =
    propContent ||
    location.state?.content ||
    (location.state?.id
      ? {
          id: location.state.id,
          title: location.state.title,
          thumbnailUrl: location.state.thumbnail || location.state.thumbnailUrl,
          type: location.state.type || "certificate",
          shareToken: location.state.shareToken,
          proofId: location.state.proofId,
          link: location.state.link,
        }
      : undefined);

  const title =
    activeContent?.title ||
    propTitle ||
    location.state?.title ||
    "CSS Fundamentals";

  const rawThumbnail =
    activeContent?.thumbnailUrl ||
    propThumbnail ||
    location.state?.thumbnail ||
    location.state?.thumbnailUrl ||
    null;

  const thumbnail = getAssetImageUrl(rawThumbnail);

  useEffect(() => {
    setImageError(false);
  }, [thumbnail]);

  const isCertType =
    activeContent?.type === "certificate" ||
    (!activeContent?.type && !!activeContent?.proofId);

  const [shareUrl, setShareUrl] = useState<string>(() => {
    if (activeContent?.link) return activeContent.link;
    if (propLink) return propLink;
    if (location.state?.link) return location.state.link;
    if (activeContent?.shareToken) {
      const isCourse = activeContent.type === "course";
      return isCourse
        ? `${window.location.origin}/courses/share/${activeContent.shareToken}`
        : `${window.location.origin}/certificate/public/${activeContent.shareToken}`;
    }
    if (activeContent?.proofId) {
      return `${window.location.origin}/verify/${activeContent.proofId}`;
    }
    return typeof window !== "undefined" ? window.location.href : "";
  });

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/certificate-detail");
    }
  }, [onClose, navigate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Token resolution effect based on active content ID and type
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function resolveShareUrl() {
      // 1. Direct link override if no ID provided
      if (!activeContent?.id && (activeContent?.link || propLink || location.state?.link)) {
        if (isMounted) {
          setShareUrl(activeContent?.link || propLink || location.state?.link || window.location.href);
        }
        return;
      }

      if (!activeContent?.id) {
        if (isMounted) {
          setShareUrl(window.location.href);
        }
        return;
      }

      if (isCertType) {
        // Reuse existing share token if present
        if (activeContent.shareToken) {
          if (isMounted) {
            setShareUrl(`${window.location.origin}/certificate/public/${activeContent.shareToken}`);
          }
          return;
        }

        setIsLoadingToken(true);
        try {
          const res = await certificateIntegrationApi.shareCertificate(activeContent.id);
          const token = res?.data?.token;
          if (!isMounted) return;

          if (token) {
            setShareUrl(`${window.location.origin}/certificate/public/${token}`);
          } else if (res?.data?.shareUrl) {
            const urlObj = new URL(res.data.shareUrl, window.location.origin);
            setShareUrl(`${window.location.origin}${urlObj.pathname}`);
          } else if (activeContent.proofId) {
            setShareUrl(`${window.location.origin}/verify/${activeContent.proofId}`);
          }
        } catch (err) {
          console.error("Failed to generate certificate share link:", err);
          if (!isMounted) return;
          if (activeContent.proofId) {
            setShareUrl(`${window.location.origin}/verify/${activeContent.proofId}`);
          } else {
            setShareUrl(window.location.href);
          }
        } finally {
          if (isMounted) setIsLoadingToken(false);
        }
      } else {
        // Course, Career Path, or Lesson
        if (activeContent.shareToken) {
          if (isMounted) {
            setShareUrl(`${window.location.origin}/courses/share/${activeContent.shareToken}`);
          }
          return;
        }

        if (activeContent.type === "lesson" && activeContent.link) {
          if (isMounted) {
            setShareUrl(activeContent.link);
          }
          return;
        }

        if (activeContent.type === "career-path" && activeContent.link) {
          if (isMounted) {
            setShareUrl(activeContent.link);
          }
          return;
        }

        setIsLoadingToken(true);
        try {
          const tokenRes = await courseApi.regenerateShareToken(activeContent.id);
          const token =
            (tokenRes as any)?.data?.data?.shareToken ||
            (tokenRes as any)?.data?.shareToken ||
            (tokenRes as any)?.shareToken;
          if (!isMounted) return;

          if (token) {
            setShareUrl(`${window.location.origin}/courses/share/${token}`);
          } else if (activeContent.link) {
            setShareUrl(activeContent.link);
          } else {
            setShareUrl(`${window.location.origin}/courses/${activeContent.id}`);
          }
        } catch (err) {
          console.error("Failed to generate course share link:", err);
          if (!isMounted) return;
          if (activeContent.link) {
            setShareUrl(activeContent.link);
          } else {
            setShareUrl(`${window.location.origin}/courses/${activeContent.id}`);
          }
        } finally {
          if (isMounted) setIsLoadingToken(false);
        }
      }
    }

    resolveShareUrl();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    isCertType,
    activeContent?.id,
    activeContent?.shareToken,
    activeContent?.type,
    activeContent?.proofId,
    activeContent?.link,
    propLink,
    location.state?.link,
  ]);

  if (!isOpen) return null;

  const rawCurrentLink = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
  const currentLink = rawCurrentLink.startsWith("http://") || rawCurrentLink.startsWith("https://")
    ? rawCurrentLink
    : `${typeof window !== "undefined" ? window.location.origin : ""}${rawCurrentLink.startsWith("/") ? "" : "/"}${rawCurrentLink}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        const textBlob = new Blob([currentLink], { type: "text/plain" });
        const htmlBlob = new Blob([`<a href="${currentLink}">${currentLink}</a>`], { type: "text/html" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": textBlob,
            "text/html": htmlBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(currentLink);
      }
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(currentLink);
        setCopied(true);
        toast.success("Share link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  };

  const shareOnWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(currentLink)}`, "_blank");
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentLink)}`, "_blank");
  };

  const shareOnInstagram = () => {
    handleCopy();
    window.open("https://instagram.com", "_blank");
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentLink)}`, "_blank");
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentLink)}`, "_blank");
  };

  const shareOnEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(title || "Link")}&body=${encodeURIComponent(currentLink)}`);
  };

  const handleMore = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: currentLink });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--scrim)] flex items-center justify-center p-6 select-none fixed inset-0 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-[24px] bg-[var(--paper)] shadow-[var(--shadow-card)] p-6 relative font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-semibold text-(--ink) tracking-tight">Share this</h2>
          <button
            onClick={handleClose}
            className="text-(--ink-mute) hover:text-[var(--ink)] transition-colors cursor-pointer bg-transparent border-none p-1 outline-none"
            aria-label="Close"
          >
            <X className="w-[17px] h-[17px]" />
          </button>
        </div>

        <div className="space-y-5.5">
          {/* Card */}
          <div className="border border-[var(--line)] rounded-xl p-3 flex items-center gap-4 bg-[var(--paper)]">
            <div className="w-13.5 h-13.5 rounded-lg overflow-hidden shrink-0 bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center">
              {thumbnail && !imageError ? (
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : isCertType ? (
                <div className="w-full h-full bg-[#fdf8ec] flex items-center justify-center text-[#c99b2e]">
                  <Award className="w-7 h-7 text-[#c99b2e]" />
                </div>
              ) : (
                <div className="w-full h-full bg-[var(--paper-2)] flex items-center justify-center text-[var(--ink-mute)]">
                  <BookOpen className="w-7 h-7" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-[16px] font-semibold text-[var(--ink)] leading-snug mb-[3px] truncate" title={title}>
                {title}
              </h3>
              <a
                href={currentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-[#2c5e92] hover:underline truncate block"
                title={currentLink}
              >
                {isLoadingToken ? "Generating public link..." : currentLink}
              </a>
            </div>
          </div>

          {/* Share Options */}
          <div>
            <p className="text-[12px] font-bold tracking-widest uppercase text-[var(--ink-mute)] mb-2">
              Share to
            </p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="border border-[var(--line)] rounded-xl py-4 flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:bg-[var(--paper-2)] transition-all duration-300 cursor-pointer bg-white outline-none"
              >
                <div className="w-9.5 h-9.5 rounded-full bg-(--c-sage-wash) flex items-center justify-center text-(--c-sage-text)">
                  <Whatsapp className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-semibold text-(--ink-soft)">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={shareOnFacebook}
                className="border border-(--line) rounded-xl py-4 flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:bg-[var(--paper-2)] transition-all duration-300 cursor-pointer bg-white outline-none"
              >
                <div className="w-9.5 h-9.5 rounded-full bg-(--paper-2) flex items-center justify-center text-[#1877f2]">
                  <Facebook className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-semibold text-(--ink-soft)">Facebook</span>
              </button>

              <button
                type="button"
                onClick={shareOnInstagram}
                className="border border-(--line) rounded-xl py-4 flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:bg-[var(--paper-2)] transition-all duration-300 cursor-pointer bg-white outline-none"
              >
                <div className="w-9.5 h-9.5 rounded-full bg-(--paper) flex items-center justify-center text-[#e4405f]">
                  <Instagram className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-semibold text-(--ink-soft)">Instagram</span>
              </button>

              <button
                type="button"
                onClick={shareOnTwitter}
                className="border border-(--line) rounded-xl py-4 flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:bg-[var(--paper-2)] transition-all duration-300 cursor-pointer bg-white outline-none"
              >
                <div className="w-9.5 h-9.5 rounded-full bg-(--paper) flex items-center justify-center text-(--ink)">
                  <TwitterX className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-semibold text-(--ink-soft)">X / Twitter</span>
              </button>

              <button
                type="button"
                onClick={shareOnLinkedIn}
                className="border border-(--line) rounded-xl py-4 flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:bg-[var(--paper-2)] transition-all duration-300 cursor-pointer bg-white outline-none"
              >
                <div className="w-9.5 h-9.5 rounded-full bg-(--c-honey-wash) flex items-center justify-center text-(--c-honey-text)">
                  <Linkedin className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-semibold text-(--ink-soft)">LinkedIn</span>
              </button>

              <button
                type="button"
                onClick={shareOnEmail}
                className="border border-(--line) rounded-xl py-4 flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-md hover:bg-[var(--paper-2)] transition-all duration-300 cursor-pointer bg-white outline-none"
              >
                <div className="w-9.5 h-9.5 rounded-full bg-(--c-clay-wash) flex items-center justify-center text-[#8c4534]">
                  <Mail className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-semibold text-(--ink-soft)">Email</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleMore}
              className="w-full border border-(--line-strong) rounded-full py-[11px] px-[18px] flex items-center justify-center text-[16px] font-semibold text-(--ink) hover:bg-(--paper-2) transition cursor-pointer bg-(--card) outline-none mt-4"
            >
              More
            </button>
          </div>

          {/* Copy Link */}
          <div>
            <p className="text-[12px] font-bold tracking-widest uppercase text-(--ink-mute) mb-2">
              Or Copy Link
            </p>
            <div className="flex gap-2">
              <div className="flex-1 border border-[var(--line)] rounded-xl px-4 py-3 bg-white text-[14px] text-(--ink-soft) truncate border-[1.5px] flex items-center gap-2">
                {isLoadingToken && <Loader2 className="w-4 h-4 animate-spin text-(--ink-mute) shrink-0" />}
                <a
                  href={currentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[#2c5e92] hover:underline flex-1 block"
                  title={currentLink}
                >
                  {isLoadingToken ? "Generating public verification link..." : currentLink}
                </a>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={isLoadingToken}
                className="px-6 rounded-full text-[16px] bg-(--btn) text-(--ink) hover:bg-(--btn-hover) font-semibold cursor-pointer select-none outline-none border border-[#c99b2e8c] transition-transform active:scale-95 disabled:opacity-50"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[14px] text-(--ink-mute) leading-relaxed my-4">
            {isCertType
              ? "Anyone with this public link can view and verify this credential without signing in."
              : "Sharing reveals title + cover image + duration. Actual content stays gated by enrollment + persona."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;