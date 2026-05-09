export type FieldPage = 'cover' | 'content';

export interface FieldPosition {
  fieldKey: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  page: FieldPage;
}

export const DEFAULT_COVER_FIELDS: FieldPosition[] = [];

export const DEFAULT_CONTENT_FIELDS: FieldPosition[] = [
  { fieldKey: 'object-id', label: '物件編號', x: 24, y: 14.5, width: 58, height: 2.8, fontSize: 13, textAlign: 'left', page: 'content' },
  { fieldKey: 'object-name', label: '物件名稱', x: 20, y: 18.5, width: 65, height: 2.8, fontSize: 13, textAlign: 'left', page: 'content' },
  { fieldKey: 'agent-name', label: '委託人', x: 14, y: 69, width: 16, height: 3, fontSize: 12, textAlign: 'center', page: 'content' },
  { fieldKey: 'store-name', label: '店名', x: 30, y: 69, width: 16, height: 3, fontSize: 12, textAlign: 'center', page: 'content' },
  { fieldKey: 'broker-name', label: '經紀人', x: 46, y: 69, width: 16, height: 3, fontSize: 12, textAlign: 'center', page: 'content' },
  { fieldKey: 'broker-cert', label: '經紀人證書', x: 62, y: 69, width: 22, height: 3, fontSize: 12, textAlign: 'center', page: 'content' },
  { fieldKey: 'company-name', label: '公司名稱', x: 24, y: 80, width: 58, height: 2.8, fontSize: 12, textAlign: 'left', page: 'content' },
  { fieldKey: 'company-address', label: '地址', x: 20, y: 84, width: 62, height: 2.8, fontSize: 12, textAlign: 'left', page: 'content' },
  { fieldKey: 'company-phone', label: '電話', x: 20, y: 88, width: 35, height: 2.8, fontSize: 12, textAlign: 'left', page: 'content' },
  { fieldKey: 'document-date', label: '日期', x: 20, y: 92, width: 40, height: 2.8, fontSize: 12, textAlign: 'left', page: 'content' },
];
