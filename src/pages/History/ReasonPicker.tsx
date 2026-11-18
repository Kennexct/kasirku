import { inputBase, labelBase, option } from '../../components/ui/styles';
import { REFUND_REASON_LABEL } from '../../constants';
import type { ReasonInput } from '../../services/refunds';
import { REFUND_REASONS } from '../../types';

interface ReasonPickerProps {
  value: ReasonInput;
  onChange: (value: ReasonInput) => void;
}

/** Shared reason codes for void and refund (PRD M11) — reported in the audit trail. */
export function ReasonPicker({ value, onChange }: ReasonPickerProps) {
  return (
    <fieldset>
      <legend className={labelBase}>Alasan</legend>
      <div className="grid grid-cols-2 gap-2">
        {REFUND_REASONS.map((code) => (
          <button key={code} type="button" aria-pressed={value.code === code} onClick={() => onChange({ ...value, code })} className={option(value.code === code)}>
            {REFUND_REASON_LABEL[code]}
          </button>
        ))}
      </div>
      <input
        aria-label="Catatan alasan"
        value={value.note}
        maxLength={120}
        onChange={(event) => onChange({ ...value, note: event.target.value })}
        placeholder={value.code === 'other' ? 'Tulis alasannya (wajib)' : 'Catatan tambahan (opsional)'}
        className={`${inputBase} mt-2`}
      />
    </fieldset>
  );
}
