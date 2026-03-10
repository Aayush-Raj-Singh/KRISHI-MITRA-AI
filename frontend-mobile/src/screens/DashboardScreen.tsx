import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { fetchDashboardOverview } from "../services/api";

interface DashboardScreenProps {
  accessToken: string;
  onOpenAdvisory: () => void;
  onOpenCrop: () => void;
  onOpenPrice: () => void;
  onOpenWater: () => void;
  onOpenFeedback: () => void;
  onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  accessToken,
  onOpenAdvisory,
  onOpenCrop,
  onOpenPrice,
  onOpenWater,
  onOpenFeedback,
  onLogout,
}) => {
  const [status, setStatus] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetchDashboardOverview(accessToken);
        if (mounted) {
          setStatus(response.status);
        }
      } catch (err) {
        if (mounted) {
          setStatus(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {loading ? <ActivityIndicator color="#1b6b3a" /> : <Text style={styles.status}>Realtime: {status}</Text>}
      <Pressable style={styles.primaryButton} onPress={onOpenCrop}>
        <Text style={styles.buttonText}>Crop Recommendation</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={onOpenPrice}>
        <Text style={styles.buttonText}>Price Forecast</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={onOpenWater}>
        <Text style={styles.buttonText}>Water Optimization</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={onOpenAdvisory}>
        <Text style={styles.buttonText}>Open Advisory Chat</Text>
      </Pressable>
      <Pressable style={styles.primaryButton} onPress={onOpenFeedback}>
        <Text style={styles.buttonText}>Submit Outcome Feedback</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onLogout}>
        <Text style={styles.secondaryText}>Logout</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f8ef",
    padding: 20,
    justifyContent: "center",
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0d5d33",
  },
  status: {
    fontSize: 16,
    color: "#24382b",
  },
  primaryButton: {
    backgroundColor: "#1b6b3a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#1b6b3a",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: "#1b6b3a",
    fontWeight: "600",
  },
});

export default DashboardScreen;
