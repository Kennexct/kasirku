import type { Id, SelectedOption, VariantGroup } from '../types';
import { t } from '../i18n';

/** groupId -> selected optionIds */
export type VariantSelection = Readonly<Record<Id, readonly Id[]>>;

/** Single-select replaces; multi-select toggles up to the group's max. */
export function toggleOption(group: VariantGroup, current: readonly Id[], optionId: Id): Id[] {
  if (group.selectType === 'single') return [optionId];
  if (current.includes(optionId)) return current.filter((id) => id !== optionId);
  if (current.length >= group.max) return [...current];
  return [...current, optionId];
}

/** Returns the first validation error, or null when the selection is complete. */
export function validateSelection(groups: readonly VariantGroup[], selection: VariantSelection): string | null {
  for (const group of groups) {
    const count = selection[group.id]?.length ?? 0;
    const min = group.isRequired ? Math.max(1, group.min) : group.min;
    if (count < min) return t('Pilih {0}', group.name);
    if (count > group.max) return t('{0} maksimal {1} pilihan', group.name, group.max);
  }
  return null;
}

/** Snapshot of chosen options in group order, ready to store on an order line. */
export function toSelectedOptions(groups: readonly VariantGroup[], selection: VariantSelection): SelectedOption[] {
  return groups.flatMap((group) =>
    group.options
      .filter((option) => selection[group.id]?.includes(option.id))
      .map((option) => ({ groupId: group.id, optionId: option.id, name: option.name, priceDelta: option.priceDelta })),
  );
}

/** Pre-selects the first option of required single-select groups to save a tap. */
export function defaultSelection(groups: readonly VariantGroup[]): VariantSelection {
  return Object.fromEntries(
    groups.map((group) => {
      const first = group.options[0];
      const shouldPreselect = group.isRequired && group.selectType === 'single' && first !== undefined;
      return [group.id, shouldPreselect ? [first.id] : []];
    }),
  );
}
