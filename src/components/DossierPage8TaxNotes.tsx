export function DossierPage8TaxNotes() {
  const notes = [
    { index: 1, text: "本增值稅概算表僅供參考，實際稅額請以地政事務所核算為準。" },
    { index: 2, text: "土地增值稅以地價稅評定現值為計算基礎，公告現值每年1月1日調整。" },
    { index: 3, text: "自用住宅用地符合土地稅法第34條規定者，得適用10%優惠稅率，一生一次。" },
    { index: 4, text: "共有土地持分出售時，增值稅依各持分人持分比例分別計算。" },
    { index: 5, text: "非都市土地持分面積>700m²者，超出部分不得適用自用住宅優惠稅率。" },
    { index: 6, text: "房地合一稅自2021年7月1日起，持有2年以內出售稅率45%，2至5年35%，5至10年20%，10年以上15%。" },
    { index: 7, text: "土地增值稅及房地合一稅之詳細計算方式，請洽地政士或稅務機關確認。" },
  ];

  return (
    <section>
      <h2>第八頁：增值稅概算附注</h2>
      <ol>
        {notes.map(({ index, text }) => (
          <li key={index} data-note-index={String(index)}>
            {text}
          </li>
        ))}
      </ol>
    </section>
  );
}
