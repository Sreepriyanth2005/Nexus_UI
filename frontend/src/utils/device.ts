import {
  browserName,
  browserVersion,
  osName,
  deviceType,
  isMobile,
  isTablet,
  isDesktop,
} from "react-device-detect";

import { v4 as uuidv4 } from "uuid";

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  userAgent: string;
  timezone: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  let deviceId =
    localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = uuidv4();

    localStorage.setItem(
      "device_id",
      deviceId
    );
  }

  let deviceName = "Unknown Device";

  if (isMobile) {
    deviceName = "Mobile";
  } else if (isTablet) {
    deviceName = "Tablet";
  } else if (isDesktop) {
    deviceName = "Desktop";
  }

  return {
    deviceId,
    deviceName,
    browser: `${browserName} ${browserVersion}`,
    os: osName,
    userAgent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};