export type UserRole = 'business' | 'club';

export type SessionUser = {
  id: string;
  email: string;
  businessName: string;
  role: UserRole;
};

export type BusinessPost = {
  id: string;
  userId: string;
  title: string;
  description: string;
  body: string;
  imageKey: string | null;
  updatedAt: string;
  businessName: string;
  role: UserRole;
};
