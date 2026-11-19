import { useSessionStore } from '../../store/useSessionStore';
import { usePinPromptStore } from '../../store/usePinPromptStore';
import { Sheet } from '../ui/Sheet';
import { OwnerPinForm } from './OwnerPinForm';
import { t } from '../../i18n';

/** Mount once at the app root: renders the prompt opened by `requestOwnerApproval()`. */
export function OwnerPinHost() {
  const request = usePinPromptStore((s) => s.request);
  const settle = usePinPromptStore((s) => s.settle);
  const ownerId = useSessionStore((s) => s.ownerId);

  if (!request) return null;
  return (
    <Sheet title={t('Persetujuan pemilik')} subtitle={request.reason} isOpen onClose={() => settle(null)}>
      <OwnerPinForm onVerified={() => settle(ownerId)} />
    </Sheet>
  );
}
