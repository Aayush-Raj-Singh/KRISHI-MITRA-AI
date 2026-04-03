import React, { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { inspectExternalLink, ExternalLinkCheckResponse } from "../../services/links";

interface ExternalLinkWarningDialogProps {
  open: boolean;
  url: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ExternalLinkWarningDialog: React.FC<ExternalLinkWarningDialogProps> = ({
  open,
  url,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
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
          setError(err instanceof Error ? err.message : t("external_link_warning.inspect_failed"));
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
  }, [open, t, url]);

  const safe = inspection?.safe ?? false;
  const verified = inspection?.verified ?? false;
  const canContinue = safe && verified && !loading;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("external_link_warning.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2}>
          <Typography variant="body2" color="text.secondary">
            {t("external_link_warning.intro")}
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            {url || t("external_link_warning.unknown_destination")}
          </Typography>
          <Stack direction="row" spacing={1}>
            {loading && <Chip label={t("external_link_warning.checking")} size="small" />}
            {!loading && inspection && (
              <>
                <Chip
                  label={
                    safe ? t("external_link_warning.safe_link") : t("external_link_warning.blocked")
                  }
                  size="small"
                  color={safe ? "success" : "error"}
                />
                <Chip
                  label={
                    verified
                      ? t("external_link_warning.verified_source")
                      : t("external_link_warning.unverified_source")
                  }
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
          {!error && inspection?.reason && (!safe || !verified) && (
            <Typography variant="body2" color="error">
              {inspection.reason}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {t("external_link_warning.cancel")}
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={!canContinue}>
          {t("external_link_warning.continue")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExternalLinkWarningDialog;
