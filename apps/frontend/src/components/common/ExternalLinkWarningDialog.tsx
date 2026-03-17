import React, { useEffect, useState } from "react";
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

import { inspectExternalLink, ExternalLinkCheckResponse } from "../../services/links";

interface ExternalLinkWarningDialogProps {
  open: boolean;
  url: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ExternalLinkWarningDialog: React.FC<ExternalLinkWarningDialogProps> = ({ open, url, onClose, onConfirm }) => {
  const [inspection, setInspection] = useState<ExternalLinkCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!open || !url) {
        setInspection(null);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await inspectExternalLink(url);
        if (active) {
          setInspection(result);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to inspect link");
          setInspection(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [open, url]);

  const safe = inspection?.safe ?? false;
  const verified = inspection?.verified ?? false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>External Link Warning</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2}>
          <Typography variant="body2" color="text.secondary">
            You are about to open an external website.
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            {url || "Unknown destination"}
          </Typography>
          <Stack direction="row" spacing={1}>
            {loading && <Chip label="Checking..." size="small" />}
            {!loading && inspection && (
              <>
                <Chip label={safe ? "Safe link" : "Blocked"} size="small" color={safe ? "success" : "error"} />
                <Chip
                  label={verified ? "Verified source" : "Unverified source"}
                  size="small"
                  color={verified ? "success" : "warning"}
                />
              </>
            )}
          </Stack>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          {!error && inspection?.reason && !safe && (
            <Typography variant="body2" color="error">
              {inspection.reason}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={!safe || loading}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExternalLinkWarningDialog;
