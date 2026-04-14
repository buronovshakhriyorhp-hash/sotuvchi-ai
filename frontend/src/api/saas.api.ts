import api from './axios';

export interface Business {
  id: number;
  name: string;
  slug: string;
  ownerPhone?: string;
  isActive: boolean;
  isApproved: boolean;
  approvedAt?: string;
  trialExpiresAt?: string;
  plan: string;
  brandingName?: string;
  createdAt: string;
  _count?: { users: number };
}

export interface SaaSUser {
  id: number;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface SaasStats {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  totalUsers: number;
}

export const saasApi = {
  getPendingBusinesses: () => api.get('/saas/pending') as Promise<Business[]>,
  getAllBusinesses: ()    => api.get('/saas/businesses') as Promise<Business[]>,
  getStats: ()           => api.get('/saas/stats') as Promise<SaasStats>,
  getBusinessUsers: (id: number) => api.get(`/saas/businesses/${id}/users`) as Promise<SaaSUser[]>,

  approveBusiness: (id: number) =>
    api.post(`/saas/approve/${id}`),

  suspendBusiness: (id: number, currentlyActive: boolean) =>
    api.post(`/saas/suspend/${id}`, { activate: !currentlyActive }),

  extendTrial: (id: number, days: number = 30) =>
    api.post(`/saas/extend/${id}`, { days }),
};
