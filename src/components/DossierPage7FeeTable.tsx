import { stampTax, deedTax, buildingTax, landPriceTax } from "@/lib/tax-calculator";

export interface TaxInputs {
  contractPrice: number;
  officialLandValue: number;
  shareRatio: number;
  buildingCurrentValue: number;
  transactionDate: string;
  usage: "residential" | "commercial";
}

export function DossierPage7FeeTable(props: TaxInputs) {
  const { contractPrice, officialLandValue, shareRatio, buildingCurrentValue, transactionDate, usage } = props;

  const stamp = stampTax(contractPrice, officialLandValue, shareRatio);
  const deed = deedTax(contractPrice);
  const building = buildingTax(buildingCurrentValue, usage);

  const daysDiff = transactionDate
    ? Math.max(0, Math.round((Date.now() - new Date(transactionDate).getTime()) / 86400000))
    : 0;
  const landPrice = landPriceTax(officialLandValue, daysDiff);

  const rows = [
    { label: "印花稅", testId: "fee-stamp-tax", value: stamp },
    { label: "契稅", testId: "fee-deed-tax", value: deed },
    { label: "房屋稅（年繳概估）", testId: "fee-building-tax", value: building },
    { label: "地價稅（當年概估）", testId: "fee-land-price-tax", value: landPrice },
  ];

  return (
    <section>
      <h2>第七頁：費用一覽表</h2>
      <table>
        <thead>
          <tr>
            <th>項目</th>
            <th>金額（元）</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, testId, value }) => (
            <tr key={testId}>
              <td>{label}</td>
              <td data-testid={testId}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
