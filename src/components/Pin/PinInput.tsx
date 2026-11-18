import { PIN_MAX_LENGTH } from '../../constants';
import { inputBase } from '../ui/styles';

interface PinInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Masked numeric field for PINs inside forms. A text input with disc masking (not type=password)
 * so browsers don't offer to save a counter PIN as a site password.
 */
export function PinInput({ id, value, onChange, placeholder = '••••' }: PinInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={PIN_MAX_LENGTH}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
      className={`${inputBase} num tracking-[0.3em] [-webkit-text-security:disc]`}
    />
  );
}
