import {
  useEffect,
  useState,
} from "react";

import type {
  JSX,
  ReactNode,
} from "react";

import { AppShell } from "./AppShell";

import ProfileCompletionPopup  from "../components/common/error/ProfileCompletionPopup";

import {
  useProfileStore,} from "../store/profile.store";

type MemberLayoutProps = {
  children: ReactNode;
};

export const MemberLayout = ({
  children,
}: MemberLayoutProps): JSX.Element => {

  const { profile } =
    useProfileStore();

  const [showPopup,
    setShowPopup] =
    useState(false);

  useEffect(() => {
    if (!profile) return;

    const percentage = Number((profile as any)?.profileCompleteness || 0);

    if (percentage < 80) {
      const dismissed = localStorage.getItem("profile-popup-dismissed");

      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    } else {
      setShowPopup(false);
    }
  }, [profile]);

  const handleClose =
    () => {

      localStorage.setItem(
        "profile-popup-dismissed",
        "true"
      );

      setShowPopup(false);
    };

  return (
    <>
      <AppShell>
        {children}
      </AppShell>

      {showPopup && (
        <ProfileCompletionPopup
          percentage={Number((profile as any)?.profileCompleteness || 0)}
          onClose={handleClose}
        />
      )}
    </>
  );
};