import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createFile } from "@/lib/firebase";

interface NewFileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewFileModal({ userId, isOpen, onClose }: NewFileModalProps) {
  const [fileName, setFileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsCreating(true);
    try {
      const fileExtension = fileName.includes('.') ? '' : '.py';
      const fullFileName = fileName + fileExtension;
      
      await createFile(userId, fullFileName);
      
      toast({
        title: "File Created",
        description: `File '${fullFileName}' has been created successfully.`
      });
      
      setFileName("");
      onClose();
    } catch (error) {
      console.error('Error creating file:', error);
      toast({
        title: "Error",
        description: "Failed to create file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#c9d1d9]">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="filename" className="text-sm text-[#8b949e]">Filename</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="example.py"
                className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
                required
              />
              <p className="text-xs text-[#8b949e]">
                {!fileName.includes('.') && "If no extension is provided, .py will be added automatically."}
              </p>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:bg-[#161b22]"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white"
              disabled={!fileName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
