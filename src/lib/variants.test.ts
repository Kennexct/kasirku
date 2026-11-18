import { describe, expect, it } from 'vitest';
import type { VariantGroup } from '../types';
import { defaultSelection, toSelectedOptions, toggleOption, validateSelection } from './variants';

const meta = { storeId: 's', createdAt: '', updatedAt: '' };
const pedas: VariantGroup = {
  ...meta, id: 'pedas', name: 'Level Pedas', isRequired: true, selectType: 'single', min: 1, max: 1,
  options: [{ id: 'p0', name: 'Tidak', priceDelta: 0, sortOrder: 0 }, { id: 'p2', name: 'Pedas', priceDelta: 0, sortOrder: 1 }],
};
const topping: VariantGroup = {
  ...meta, id: 'top', name: 'Topping', isRequired: false, selectType: 'multi', min: 0, max: 2,
  options: [
    { id: 't1', name: 'Telur', priceDelta: 3_000, sortOrder: 0 },
    { id: 't2', name: 'Tahu', priceDelta: 2_000, sortOrder: 1 },
    { id: 't3', name: 'Pangsit', priceDelta: 2_000, sortOrder: 2 },
  ],
};

describe('variants', () => {
  it('preselects first option of required single groups only', () => {
    expect(defaultSelection([pedas, topping])).toEqual({ pedas: ['p0'], top: [] });
  });

  it('single select replaces, multi select toggles within max', () => {
    expect(toggleOption(pedas, ['p0'], 'p2')).toEqual(['p2']);
    expect(toggleOption(topping, ['t1'], 't2')).toEqual(['t1', 't2']);
    expect(toggleOption(topping, ['t1', 't2'], 't3')).toEqual(['t1', 't2']);
    expect(toggleOption(topping, ['t1', 't2'], 't1')).toEqual(['t2']);
  });

  it('requires required groups', () => {
    expect(validateSelection([pedas], { pedas: [] })).toBe('Pilih Level Pedas');
    expect(validateSelection([pedas, topping], { pedas: ['p2'], top: [] })).toBeNull();
  });

  it('snapshots options in group order with price deltas', () => {
    expect(toSelectedOptions([pedas, topping], { pedas: ['p2'], top: ['t2', 't1'] })).toEqual([
      { groupId: 'pedas', optionId: 'p2', name: 'Pedas', priceDelta: 0 },
      { groupId: 'top', optionId: 't1', name: 'Telur', priceDelta: 3_000 },
      { groupId: 'top', optionId: 't2', name: 'Tahu', priceDelta: 2_000 },
    ]);
  });
});
