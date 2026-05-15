export function parseAddressForQuery(address: string): { district: string; keyword: string } {
  // district: 第 3 層行政區劃（區/鎮/市）
  // 策略：以「縣/市」作為第 2 層分界，抓取後面第一個「X區/X鎮/X市」
  const districtMatch = address.match(/(?:縣|市)([一-鿿]+?(?:區|鎮|市))/);
  const district = districtMatch ? districtMatch[1] : "";

  // keyword: 第一個路名（路/街/大道/巷）
  // 策略：優先在 district 之後找第一個路名（避免抓到「市東區...」）
  const rest = district ? address.slice(address.indexOf(district) + district.length) : address;
  const keywordMatch = rest.match(/([一-鿿0-9]+?(?:路|街|大道|巷))/);
  const keyword = keywordMatch ? keywordMatch[1] : "";

  return { district, keyword };
}
