import { useAuthStore } from '../auth/auth.store';
import { useUserStore } from '../../store/user.store';
import { getSystemRoles } from '../api/role.api';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
export const keycloakClient = {
  initialized: false,

  async init(): Promise<void> {
    this.initialized = true;
    console.log('Keycloak client initialised');
  },
  getAccessToken(): string | null {
    const { accessToken } = useAuthStore.getState();
    return accessToken;
  },
  getRefreshToken(): string | null {
    const { refreshToken } = useUserStore.getState();
    return refreshToken;
  },

  async logout(): Promise<void> {
    const { role, systemRoles, setSystemRoles } = useAuthStore.getState();
    let adminRoles = systemRoles;

    if (!adminRoles || adminRoles.length === 0) {
      try {
        adminRoles = await getSystemRoles();
        setSystemRoles(adminRoles);
      } catch (err) {
        console.error('Failed to fetch system roles during logout', err);
        // Fallback or leave empty
      }
    }

    const isLogoutAdmin = role && adminRoles.map(r => r.toUpperCase()).includes(role.toUpperCase());
    const redirectPath = isLogoutAdmin ? '/admin/login' : '/login';

    const { logout: clearAuth } = useAuthStore.getState();
    await clearAuth();
    window.location.href = redirectPath;
  },
};

