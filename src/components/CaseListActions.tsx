"use client";

import {
  Download,
  Eye,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CaseListActionsProps {
  caseId: string;
  onView: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onDownload: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function stopPropagation(
  handler: (event: React.MouseEvent<HTMLButtonElement>) => void,
): (event: React.MouseEvent<HTMLButtonElement>) => void {
  return (event) => {
    event.stopPropagation();
    handler(event);
  };
}

export function CaseListActions({
  caseId,
  onView,
  onEdit,
  onDelete,
  onDownload,
}: CaseListActionsProps) {
  const router = useRouter();

  function handleSupplement(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    router.push(`/cases/${caseId}/keyin`);
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button className="h-8 w-8" size="icon" variant="ghost" title="補件" onClick={handleSupplement}>
        <PlusCircle className="h-4 w-4" />
      </Button>
      <Button className="h-8 w-8" size="icon" variant="ghost" title="查看" onClick={stopPropagation(onView)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button className="h-8 w-8" size="icon" variant="ghost" title="修改" onClick={stopPropagation(onEdit)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button className="h-8 w-8" size="icon" variant="ghost" title="刪除" onClick={stopPropagation(onDelete)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button className="h-8 w-8" size="icon" variant="ghost" title="下載" onClick={stopPropagation(onDownload)}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
