import { api } from "../../config/axios";
import { getDeviceInfo } from "../../utils/device";

export const loginApi = (data: {
  email: string;
  password: string;
}) =>
  api.post("/auth/login", {
    ...data,
    ...getDeviceInfo(),
  }).then((res) => res.data);

export const adminLoginApi = (data: {
  email: string;
  password: string;
  revokeDeviceId?: string;
}) =>
  api.post("/auth/admin/login", {
    ...data,
    ...getDeviceInfo(),
  }).then((res) => res.data);
  

export const sendRegisterOtpApi = (
  data: {
    email: string;
    firstName: string;
    lastName: string;
    countryName: string;
    consent: {
      accepted: boolean;
      marketingConsent?: boolean;
      consentVersion: string;
      termsVersion: string;
      privacyPolicyVersion?: string;
      platformVersion?: string;
      source?: string;
    };
  }
) =>
  api
    .post("/auth/register/send-otp", {
      ...data,

      device: {
        ...getDeviceInfo()
      },
    })
    .then((res) => res.data);


export const verifyRegisterOtpApi = (
  data: {
    email: string;

    otp: string;
  }
) =>
  api
    .post("/auth/register/verify-otp", {
      ...data,

      device: {
        ...getDeviceInfo()
      },
    })
    .then((res) => res.data);

export const completeRegisterApi = (
  data: {
    verificationToken: string;
  }
) =>
  api
    .post("/auth/register/complete", {
      ...data,

      device: {
        ...getDeviceInfo()
      },
    })
    .then((res) => res.data);

export const sendLoginOtpApi = (
  data: {
    email: string;
    password?: string;
    revokeDeviceId?: string;
  }
) =>
   api
    .post("/auth/login/send-otp", {
      ...data,
      ...getDeviceInfo(),
    })
    .then((res) => res.data);

export const revokeDeviceDuringLoginApi = (
  data: {
    email: string;
    deviceId: string;
  }
) =>
  api
    .post("/auth/login/revoke-device", {
      ...data,
    })
    .then((res) => res.data);

export const resendOtpApi = (
  data: {
    email: string;
    purpose?: "login" | "register" | "admin_login";
  }
) => {
  if (data.purpose === "register") {
    return api
      .post("/auth/register/resend-otp", {
        email: data.email,
      })
      .then((res) => res.data);
  }

  return api
    .post("/auth/login/resend-otp", {
      email: data.email,
    })
    .then((res) => res.data);
};


export const verifyLoginOtpApi = (
    data: {
      email: string;
      otp: string;
      revokeDeviceId?: string;
    }
  ) =>
      api
      .post("/auth/login/verify-otp", {
        ...data,
        ...getDeviceInfo(),
      })
      .then((res) => res.data);

export const verifyAdminLoginOtpApi = (
    data: {
      email: string;
      otp: string;
      revokeDeviceId?: string;
    }
  ) =>
      api
      .post("/auth/admin/login/verify-otp", {
        ...data,
        ...getDeviceInfo(),
      })
      .then((res) => res.data);



export const logoutApi = (
  refreshToken: string
) =>
  api
    .post("/auth/logout", {
      refreshToken,
    })
    .then((res) => res.data);



export const refreshTokenApi = (
  refreshToken: string
) =>
  api
    .post("/auth/refresh-token", {
      refreshToken,
    })
    .then((res) => res.data);

export const getSessionsApi = () =>
  api.get("/auth/sessions").then((res) => res.data);

export const revokeSessionApi = (sessionState: string) =>
  api.delete(`/auth/sessions/${sessionState}`).then((res) => res.data);

export const logoutAllDevicesApi = () =>
  api.post("/auth/logout-all-devices").then((res) => res.data);