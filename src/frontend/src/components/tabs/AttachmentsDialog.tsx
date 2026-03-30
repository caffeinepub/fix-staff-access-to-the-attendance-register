import type { FileAttachmentMetadata } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import {
  useDeleteAttachment,
  useGetAttachmentsForItem,
  useUploadAttachmentToItem,
} from "@/hooks/useQueries";
import {
  AlertCircle,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

interface AttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItemId: bigint;
  inventoryItemName: string;
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

interface AttachmentRowProps {
  attachment: FileAttachmentMetadata;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}

function AttachmentRow({
  attachment,
  onDelete,
  isDeleting,
}: AttachmentRowProps) {
  const { actor } = useActor();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const isImage = isImageMimeType(attachment.mimeType);

  // Load image preview on mount for image types
  const loadPreview = async () => {
    if (!isImage || previewUrl || loadingPreview || previewError) return;
    if (!actor) return;
    setLoadingPreview(true);
    try {
      const full = await actor.getAttachment(attachment.id);
      if (full) {
        const blob = new Blob([new Uint8Array(full.content)], {
          type: full.mimeType,
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch {
      setPreviewError(true);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Trigger preview load when component mounts for images
  if (isImage && !previewUrl && !loadingPreview && !previewError) {
    loadPreview();
  }

  const handleView = async () => {
    if (!actor) return;
    try {
      const full = await actor.getAttachment(attachment.id);
      if (!full) return;
      const blob = new Blob([new Uint8Array(full.content)], {
        type: full.mimeType,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      // silently fail; toast is shown by the query hook
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors group">
      {/* Thumbnail or icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
        {isImage ? (
          loadingPreview ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={attachment.filename}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {attachment.filename}
        </p>
        <p className="text-xs text-muted-foreground">{attachment.mimeType}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleView}
          title="Download / View"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(attachment.id)}
          disabled={isDeleting}
          title="Delete attachment"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function AttachmentsDialog({
  open,
  onOpenChange,
  inventoryItemId,
  inventoryItemName,
}: AttachmentsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const {
    data: attachments = [],
    isLoading,
    isError,
  } = useGetAttachmentsForItem(open ? inventoryItemId : null);

  const uploadMutation = useUploadAttachmentToItem();
  const deleteMutation = useDeleteAttachment();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const content = new Uint8Array(arrayBuffer);

    await uploadMutation.mutateAsync({
      inventoryItemId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      content,
    });

    // Reset file input so the same file can be re-uploaded if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (attachmentId: bigint) => {
    setDeletingId(attachmentId);
    try {
      await deleteMutation.mutateAsync({ id: attachmentId, inventoryItemId });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            Attachments
          </DialogTitle>
          <DialogDescription>
            Files attached to{" "}
            <span className="font-medium text-foreground">
              {inventoryItemName}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Upload area */}
        <div className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-3 bg-muted/20 hover:bg-muted/40 transition-colors">
          <div className="bg-primary/10 rounded-full p-3">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Upload a file</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Images, PDFs, Word, Excel, or text files
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Paperclip className="h-4 w-4" />
                Choose File
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Attachments list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Attached Files
              {attachments.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {attachments.length}
                </span>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Failed to load attachments. Please try again.
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No files attached yet
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-2">
                {attachments.map((attachment) => (
                  <AttachmentRow
                    key={attachment.id.toString()}
                    attachment={attachment}
                    onDelete={handleDelete}
                    isDeleting={deletingId === attachment.id}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
