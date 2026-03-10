import NetInfo from "@react-native-community/netinfo";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { sendAdvisoryChat } from "../services/api";
import {
  MobileChatMessage,
  QueuedChatRequest,
  enqueueChatRequest,
  getCachedChatMessages,
  getQueuedChatRequests,
  removeQueuedChatRequest,
  setCachedChatMessages,
} from "../services/offline";

interface AdvisoryChatScreenProps {
  accessToken: string;
  onBack: () => void;
}

const AdvisoryChatScreen: React.FC<AdvisoryChatScreenProps> = ({ accessToken, onBack }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MobileChatMessage[]>([]);
  const [queue, setQueue] = useState<QueuedChatRequest[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const voiceAvailable = useMemo(
    () => Boolean(ExpoSpeechRecognitionModule?.isRecognitionAvailable?.()),
    []
  );

  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
    setVoiceError(null);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript ?? "";
    if (transcript) {
      setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    setIsListening(false);
    setVoiceError(event.message || "Voice input failed");
  });

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const [cachedMessages, queued] = await Promise.all([getCachedChatMessages(), getQueuedChatRequests()]);
      if (!mounted) return;
      setItems(cachedMessages);
      setQueue(queued);
    };
    bootstrap();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(online);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    void setCachedChatMessages(items);
  }, [items]);

  const syncQueue = useCallback(async () => {
    if (!isConnected || queue.length === 0 || loading) return;
    setLoading(true);
    try {
      for (const pending of queue) {
        try {
          const result = await sendAdvisoryChat(accessToken, {
            message: pending.message,
            language: pending.language,
          });
          setItems((prev) => [
            ...prev,
            { id: `${pending.id}-assistant`, role: "assistant", text: result.reply },
          ]);
          await removeQueuedChatRequest(pending.id);
        } catch (err) {
          setItems((prev) => [
            ...prev,
            {
              id: `${pending.id}-error`,
              role: "assistant",
              text: err instanceof Error ? err.message : "Queued advisory sync failed",
            },
          ]);
          break;
        }
      }
    } finally {
      const updatedQueue = await getQueuedChatRequests();
      setQueue(updatedQueue);
      setLoading(false);
    }
  }, [accessToken, isConnected, loading, queue]);

  useEffect(() => {
    if (isConnected) {
      void syncQueue();
    }
  }, [isConnected, syncQueue]);

  const sendOrQueueMessage = async (text: string) => {
    const messageId = `${Date.now()}`;
    const userItem: MobileChatMessage = { id: `${messageId}-user`, role: "user", text };
    setItems((prev) => [...prev, userItem]);

    if (!isConnected) {
      const queuedRequest: QueuedChatRequest = {
        id: messageId,
        message: text,
        language: "en",
        createdAt: new Date().toISOString(),
      };
      await enqueueChatRequest(queuedRequest);
      const updatedQueue = await getQueuedChatRequests();
      setQueue(updatedQueue);
      setItems((prev) => [
        ...prev,
        {
          id: `${messageId}-queued`,
          role: "assistant",
          text: "Saved offline. Will sync automatically when network is available.",
          queued: true,
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const result = await sendAdvisoryChat(accessToken, { message: text, language: "en" });
      const assistantItem: MobileChatMessage = {
        id: `${messageId}-assistant`,
        role: "assistant",
        text: result.reply,
      };
      setItems((prev) => [...prev, assistantItem]);
    } catch (err) {
      const queuedRequest: QueuedChatRequest = {
        id: messageId,
        message: text,
        language: "en",
        createdAt: new Date().toISOString(),
      };
      await enqueueChatRequest(queuedRequest);
      const updatedQueue = await getQueuedChatRequests();
      setQueue(updatedQueue);
      const assistantItem: MobileChatMessage = {
        id: `${messageId}-error`,
        role: "assistant",
        text:
          err instanceof Error
            ? `${err.message}. Saved to offline queue.`
            : "Advisory request failed. Saved to offline queue.",
        queued: true,
      };
      setItems((prev) => [...prev, assistantItem]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    await sendOrQueueMessage(text);
  };

  const handleVoiceToggle = async () => {
    if (!voiceAvailable) {
      setVoiceError("Voice input is not available on this device.");
      return;
    }
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setVoiceError("Microphone permission is required for voice input.");
      return;
    }
    setVoiceError(null);
    ExpoSpeechRecognitionModule.start({
      lang: "en-IN",
      interimResults: false,
      continuous: false,
    });
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    setSpeakingId(id);
    Speech.speak(text, {
      language: "en-IN",
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Advisory Chat</Text>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </View>

      <View style={[styles.networkBadge, isConnected ? styles.onlineBadge : styles.offlineBadge]}>
        <Text style={styles.networkBadgeText}>
          {isConnected ? "Online" : "Offline"} • Queue: {queue.length}
        </Text>
        {queue.length > 0 && isConnected && (
          <Pressable onPress={() => void syncQueue()}>
            <Text style={styles.syncText}>Sync now</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
            {item.role === "assistant" && (
              <Pressable style={styles.speakButton} onPress={() => handleSpeak(item.id, item.text)}>
                <Text style={styles.speakText}>{speakingId === item.id ? "Stop" : "Listen"}</Text>
              </Pressable>
            )}
            {item.queued && <Text style={styles.queuedLabel}>Queued</Text>}
          </View>
        )}
      />

      {voiceError ? <Text style={styles.errorText}>{voiceError}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask your farming question"
          style={styles.input}
        />
        <Pressable
          style={[styles.voiceButton, isListening ? styles.voiceButtonActive : undefined]}
          onPress={() => void handleVoiceToggle()}
          disabled={loading}
        >
          <Text style={styles.voiceText}>{isListening ? "Stop" : "Voice"}</Text>
        </Pressable>
        <Pressable style={styles.sendButton} onPress={() => void handleSend()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f8ef",
    padding: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0d5d33",
  },
  back: {
    color: "#1b6b3a",
    fontWeight: "600",
  },
  networkBadge: {
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  onlineBadge: {
    backgroundColor: "rgba(27, 107, 58, 0.12)",
  },
  offlineBadge: {
    backgroundColor: "rgba(181, 93, 42, 0.18)",
  },
  networkBadgeText: {
    color: "#204430",
    fontWeight: "600",
    fontSize: 12,
  },
  syncText: {
    color: "#1b6b3a",
    fontWeight: "700",
    fontSize: 12,
  },
  listContent: {
    gap: 8,
    paddingBottom: 10,
  },
  bubble: {
    borderRadius: 12,
    padding: 10,
    maxWidth: "90%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#d9f2e1",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d5e3d6",
  },
  bubbleText: {
    color: "#203428",
  },
  speakButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(27, 107, 58, 0.12)",
  },
  speakText: {
    color: "#1b6b3a",
    fontWeight: "700",
    fontSize: 12,
  },
  queuedLabel: {
    marginTop: 4,
    color: "#b65d2a",
    fontSize: 11,
    fontWeight: "700",
  },
  errorText: {
    color: "#b00020",
    marginBottom: 6,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#c9d5c8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  voiceButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1b6b3a",
    borderRadius: 10,
    minWidth: 66,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  voiceButtonActive: {
    backgroundColor: "rgba(27, 107, 58, 0.15)",
  },
  voiceText: {
    color: "#1b6b3a",
    fontWeight: "700",
  },
  sendButton: {
    backgroundColor: "#1b6b3a",
    borderRadius: 10,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default AdvisoryChatScreen;
