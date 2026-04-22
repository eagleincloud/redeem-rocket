import { useCallback, useState } from 'react';
import { ManagerAssignment } from '@/business/types';
import { smartAssignLead, reassignToManager } from '@/business/services/manager-assignment';

export function useManagerAssignment() {
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = useCallback(async (businessId: string, leadId: string, criteria?: any) => {
    try {
      setAssigning(true);
      setError(null);
      const result = await smartAssignLead(businessId, leadId, criteria);
      return result ? { id: 'assign-1', manager_id: result.managerId, status: 'active' } as ManagerAssignment : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    } finally {
      setAssigning(false);
    }
  }, []);

  const handleReassign = useCallback(async (assignmentId: string, newManagerId: string, reason: string) => {
    try {
      setAssigning(true);
      setError(null);
      return await reassignToManager(assignmentId, newManagerId, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    } finally {
      setAssigning(false);
    }
  }, []);

  return { assigning, error, assign: handleAssign, reassign: handleReassign };
}
