"use client";

import {
  Download,
  Eye,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaseListActionsProps {
  onSupplement: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
  onSupplement,
  onView,
  onEdit,
  onDelete,
  onDownload,
}: CaseListActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" title="補件" onClick={stopPropagation(onSupplement)}>
        <PlusCircle className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" title="查看" onClick={stopPropagation(onView)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" title="修改" onClick={stopPropagation(onEdit)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" title="刪除" onClick={stopPropagation(onDelete)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" title="下載" onClick={stopPropagation(onDownload)}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
