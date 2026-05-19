export function DossierPage6Notices() {
  const notices = [
    { index: 1, text: "平均地權條例第47條：雙方當事人應於訂約後30日內共同申報登錄不動產成交案件實際資訊。" },
    { index: 2, text: "不動產成交案件實際資訊申報登錄作業規則：申報人應以書面或電子方式向主管機關為之。" },
    { index: 3, text: "房地合一稅（所得稅法第4條之4）：個人出售房屋、房屋及其坐落基地或依法得核發建造執照之土地，其交易所得應依本章規定課徵所得稅。" },
    { index: 4, text: "土地稅法第33條：土地漲價總數額之計算，以出售或典賣時申報之現值或依本法規定評定之地價，減除下列各項後之餘額為準。" },
    { index: 5, text: "土地稅法第39條：被徵收之土地，免徵其土地增值稅。" },
    { index: 6, text: "不動產說明書應記載及不得記載事項：賣方及其代理人應據實填寫本說明書，不得為不實之記載或有隱匿之行為。" },
  ];

  return (
    <section>
      <h2>第六頁：重要法規告知事項</h2>
      <ol>
        {notices.map(({ index, text }) => (
          <li key={index} data-notice-index={String(index)}>
            {text}
          </li>
        ))}
      </ol>
    </section>
  );
}
