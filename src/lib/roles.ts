export type CanonicalRole = 'admin' | 'instructor' | 'learner';

export function normalizeRole(role?: string | null): CanonicalRole | string {
  if (!role) return '';

  switch (role) {
    case 'student':
      return 'learner';
    case 'teacher':
      return 'instructor';
    default:
      return role;
  }
}

export function isLearnerRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'learner';
}

export function isInstructorRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'instructor';
}
