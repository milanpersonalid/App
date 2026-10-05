import { AppUserAccess } from '../types';
import { requireSupabase } from '../lib/supabase';

const fromRow = (row: any): AppUserAccess => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name ?? '',
  role: row.role,
  accessStatus: row.access_status,
  requestedAt: row.requested_at,
  reviewedAt: row.reviewed_at ?? undefined,
  reviewedBy: row.reviewed_by ?? undefined,
});

export async function fetchOwnAccessProfile(userId: string): Promise<AppUserAccess | null> {
  const { data, error } = await requireSupabase()
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function fetchAppUsers(): Promise<AppUserAccess[]> {
  const { data, error } = await requireSupabase()
    .from('app_users')
    .select('*')
    .order('requested_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function reviewAppUser(
  userId: string,
  accessStatus: 'approved' | 'rejected'
): Promise<AppUserAccess> {
  const { data: authData } = await requireSupabase().auth.getUser();
  const { data, error } = await requireSupabase()
    .from('app_users')
    .update({
      access_status: accessStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: authData.user?.id ?? null,
    })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}
