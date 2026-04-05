import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { reportClientError } from "../services/errorReporter";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { PrimaryButton } from "./PrimaryButton";
import { colors } from "../theme/colors";

type State = {
  hasError: boolean;
};

const ErrorFallback = ({ onRetry }: { onRetry: () => void }) => {
  const copy = useMobileTranslatedContent({
    title: "Something went wrong",
    subtitle:
      "The app hit an unexpected error. The event has been recorded, and you can retry the current session.",
    action: "Retry app",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>
      <PrimaryButton label={copy.action} onPress={onRetry} />
    </View>
  );
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportClientError(error, {
      type: "react-boundary",
      componentStack: info.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.mutedText,
    textAlign: "center",
    marginBottom: 8,
  },
});
