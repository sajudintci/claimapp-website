export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  initials: string;
  avatarUrl?: string | null;
  organizationId?: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type MockCredential = AuthUser & {
  password: string;
};
