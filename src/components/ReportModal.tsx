import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  reportedUserId?: string;
  reportedMessageId?: string;
}

const ReportModal = ({
  isOpen,
  onClose,
  reporterId,
  reportedUserId,
  reportedMessageId,
}: ReportModalProps) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the report.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId || null,
        reported_message_id: reportedMessageId || null,
        reason: reason.trim(),
      });

      if (error) {
        throw error;
      }

      toast.success("Report submitted successfully. Thank you for helping us keep the community safe!");
      setReason("");
      onClose();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(`Failed to submit report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle>Report {reportedUserId ? "User" : "Message"}</DialogTitle>
          <DialogDescription>
            Please describe why you are reporting this {reportedUserId ? "user" : "message"}.
            Your report helps us maintain a safe and positive environment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Describe the issue..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReport} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;