import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

import { reportClientError } from "../../services/errorReporter";

type State = {
  hasError: boolean;
};

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportClientError(error, {
      componentStack: info.componentStack,
      type: "react-boundary",
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            px: 3,
            background: "linear-gradient(180deg, #f4f1e8 0%, #eef4ed 100%)",
          }}
        >
          <Stack
            spacing={2}
            className="app-shell-enter"
            sx={{ maxWidth: 520, textAlign: "center" }}
          >
            <Typography variant="h3">Something went wrong</Typography>
            <Typography color="text.secondary">
              The app hit an unexpected error. The event has been recorded, and you can reload
              without losing the current deployment.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
              <Button variant="contained" onClick={this.handleReload}>
                Reload app
              </Button>
              <Button variant="outlined" href="/">
                Back to home
              </Button>
            </Stack>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}
