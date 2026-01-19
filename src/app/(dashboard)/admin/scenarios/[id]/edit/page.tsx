'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ScenarioEditModal from '@/components/admin/ScenarioEditModal';

export default function EditScenarioPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <ScenarioEditModal
      scenarioId={params.id}
      onClose={() => router.back()}
      onSuccess={() => router.refresh()}
      onError={(message) => alert(message)}
    />
  );
}
