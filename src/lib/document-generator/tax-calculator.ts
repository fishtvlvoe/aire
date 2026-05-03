export interface TaxResult {
  deed_tax: number | null;           // house_assessed_value × 0.06
  stamp_tax_buyer: number | null;    // sale_price × 0.0005
  stamp_tax_seller: number | null;   // sale_price × 0.0005
  registration_fee: number | null;   // sale_price × 0.001
  escrow_fee_each: number | null;    // sale_price × 0.0006 / 2
}

function isValidNumber(value: number | undefined | null): value is number {
  return value !== undefined && value !== null && !isNaN(value);
}

export function calculateTaxFees(input: {
  sale_price?: number;
  house_assessed_value?: number;
}): TaxResult {
  const { sale_price, house_assessed_value } = input;

  const deed_tax = isValidNumber(house_assessed_value)
    ? house_assessed_value * 0.06
    : null;

  const stamp_tax_buyer = isValidNumber(sale_price)
    ? sale_price * 0.0005
    : null;

  const stamp_tax_seller = isValidNumber(sale_price)
    ? sale_price * 0.0005
    : null;

  const registration_fee = isValidNumber(sale_price)
    ? sale_price * 0.001
    : null;

  const escrow_fee_each = isValidNumber(sale_price)
    ? (sale_price * 0.0006) / 2
    : null;

  return {
    deed_tax,
    stamp_tax_buyer,
    stamp_tax_seller,
    registration_fee,
    escrow_fee_each,
  };
}
