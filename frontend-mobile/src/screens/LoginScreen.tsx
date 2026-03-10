import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { login } from "../services/api";

interface LoginScreenProps {
  onLoggedIn: (token: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoggedIn }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await login({ phone, password });
      onLoggedIn(result.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KrishiMitra-AI</Text>
      <Text style={styles.subtitle}>Farmer Login</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f1f8ef",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0d5d33",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: "#425147",
  },
  input: {
    borderWidth: 1,
    borderColor: "#c9d5c8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  error: {
    color: "#b00020",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#1b6b3a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default LoginScreen;
