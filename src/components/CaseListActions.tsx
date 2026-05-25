"use client";

import {
  Download,
  FileText,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { caseDetailHref } from "@/lib/case-routes";

interface CaseListActionsProps {
  caseId: string;
  onPreview: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
  onPreview,
  onEdit,
  onDelete,
  onDownload,
}: CaseListActionsProps) {
  const router = useRouter();

  function handleSupplement(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    router.push(caseDetailHref(caseId, "supplements"));
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button aria-label="補件" className="h-8 w-8" size="icon" variant="ghost" title="補件" onClick={handleSupplement}>
        <PlusCircle className="h-4 w-4" />
      </Button>
      <Button aria-label="預覽 PDF" className="h-8 w-8" size="icon" variant="ghost" title="預覽 PDF" onClick={stopPropagation(onPreview)}>
        <FileText className="h-4 w-4" />
      </Button>
      <Button aria-label="修改" className="h-8 w-8" size="icon" variant="ghost" title="修改" onClick={stopPropagation(onEdit)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button aria-label="刪除" className="h-8 w-8" size="icon" variant="ghost" title="刪除" onClick={stopPropagation(onDelete)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button aria-label="匯出 PDF" className="h-8 w-8" size="icon" variant="ghost" title="匯出 PDF" onClick={stopPropagation(onDownload)}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
