export type TypesettingConfig = {
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontSize: {
    heading: number;
    body: number;
    label: number;
    headerFooter: number;
  };
  lineHeight: number;
  paragraphSpacing: number;
  labelWidth: number;
  pageSize: {
    width: number;
    height: number;
  };
};

export const TYPESET: TypesettingConfig = {
  margin: { top: 101, bottom: 84, left: 71, right: 48 },
  fontSize: { heading: 16, body: 12, label: 12, headerFooter: 9 },
  lineHeight: 1.5,
  paragraphSpacing: 12,
  labelWidth: 80,
  pageSize: { width: 595.28, height: 841.89 },
};
