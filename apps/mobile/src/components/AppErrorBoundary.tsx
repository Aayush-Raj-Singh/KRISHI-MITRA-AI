import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { reportClientError } from "../services/errorReporter";
import { PrimaryButton } from "./PrimaryButton";
import { colors } from "../theme/colors";

type State = {
  hasError: boolean;
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
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected error. The event has been recorded, and you can retry the
            current session.
          </Text>
          <PrimaryButton label="Retry app" onPress={this.handleRetry} />
        </View>
      );
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
