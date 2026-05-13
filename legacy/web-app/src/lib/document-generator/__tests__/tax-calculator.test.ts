import { describe, it, expect } from 'vitest';
import { calculateTaxFees, calculateLandValueIncrement } from '../tax-calculator';

describe('calculateTaxFees', () => {
  const SALE_PRICE = 5_000_000;
  const HOUSE_ASSESSED_VALUE = 1_200_000;

  it('兩個輸入都存在時，所有 5 個欄位都是非 null 的數字', () => {
    const result = calculateTaxFees({
      sale_price: SALE_PRICE,
      house_assessed_value: HOUSE_ASSESSED_VALUE,
    });

    expect(result.deed_tax).toBe(HOUSE_ASSESSED_VALUE * 0.06);           // 72000
    expect(result.stamp_tax_buyer).toBe(SALE_PRICE * 0.0005);            // 2500
    expect(result.stamp_tax_seller).toBe(SALE_PRICE * 0.0005);           // 2500
    expect(result.registration_fee).toBe(SALE_PRICE * 0.001);            // 5000
    expect(result.escrow_fee_each).toBe((SALE_PRICE * 0.0006) / 2);     // 1500

    expect(result.deed_tax).not.toBeNull();
    expect(result.stamp_tax_buyer).not.toBeNull();
    expect(result.stamp_tax_seller).not.toBeNull();
    expect(result.registration_fee).not.toBeNull();
    expect(result.escrow_fee_each).not.toBeNull();
  });

  it('sale_price 缺少時，deed_tax 非 null，其餘 4 個欄位為 null', () => {
    const result = calculateTaxFees({
      house_assessed_value: HOUSE_ASSESSED_VALUE,
    });

    expect(result.deed_tax).toBe(HOUSE_ASSESSED_VALUE * 0.06);  // 72000
    expect(result.stamp_tax_buyer).toBeNull();
    expect(result.stamp_tax_seller).toBeNull();
    expect(result.registration_fee).toBeNull();
    expect(result.escrow_fee_each).toBeNull();
  });

  it('house_assessed_value 缺少時，deed_tax 為 null，其餘 4 個欄位非 null', () => {
    const result = calculateTaxFees({
      sale_price: SALE_PRICE,
    });

    expect(result.deed_tax).toBeNull();
    expect(result.stamp_tax_buyer).toBe(SALE_PRICE * 0.0005);           // 2500
    expect(result.stamp_tax_seller).toBe(SALE_PRICE * 0.0005);          // 2500
    expect(result.registration_fee).toBe(SALE_PRICE * 0.001);           // 5000
    expect(result.escrow_fee_each).toBe((SALE_PRICE * 0.0006) / 2);    // 1500
  });

  it('兩個輸入都缺少時，所有 5 個欄位都是 null', () => {
    const result = calculateTaxFees({});

    expect(result.deed_tax).toBeNull();
    expect(result.stamp_tax_buyer).toBeNull();
    expect(result.stamp_tax_seller).toBeNull();
    expect(result.registration_fee).toBeNull();
    expect(result.escrow_fee_each).toBeNull();
  });
});

describe('calculateLandValueIncrement', () => {
  it('previous_transfer_value = 5000000 → general=500000, selfUse=400000', () => {
    const result = calculateLandValueIncrement({ previous_transfer_value: 5_000_000 });
    expect(result).not.toBeNull();
    expect(result!.general).toBe(500_000);
    expect(result!.selfUse).toBe(400_000);
  });

  it('previous_transfer_value = undefined → null', () => {
    expect(calculateLandValueIncrement({ previous_transfer_value: undefined })).toBeNull();
  });

  it('previous_transfer_value = NaN → null', () => {
    expect(calculateLandValueIncrement({ previous_transfer_value: NaN })).toBeNull();
  });

  it('previous_transfer_value = 0 → { general: 0, selfUse: 0 }（非 null）', () => {
    const result = calculateLandValueIncrement({ previous_transfer_value: 0 });
    expect(result).not.toBeNull();
    expect(result!.general).toBe(0);
    expect(result!.selfUse).toBe(0);
  });
});
