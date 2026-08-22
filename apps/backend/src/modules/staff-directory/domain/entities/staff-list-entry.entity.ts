export interface StaffListEntry {
  accountId: string;
  nombre: string | null;
  apellido: string | null;
  email: string;
  role: 'instructor' | 'administrador';
  status: 'active' | 'deactivated';
}
