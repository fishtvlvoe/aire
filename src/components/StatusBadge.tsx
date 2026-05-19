import { Badge } from "@/components/ui/badge";
import type { CaseRow } from "@/lib/cases-api";

export function StatusBadge({ status }: { status: CaseRow["status"] }) {
  if (status === "keyin") {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100" data-testid="status-badge-keyin">
        填入中
      </Badge>
    );
  }
  if (status === "completed") {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100" data-testid="status-badge-completed">
        完成
      </Badge>
    );
  }
  if (status === "exported") {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100" data-testid="status-badge-exported">
        已匯出
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" data-testid="status-badge-draft">
      草稿
    </Badge>
  );
}
