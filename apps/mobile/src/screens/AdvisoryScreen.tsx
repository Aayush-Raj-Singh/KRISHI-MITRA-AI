import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { ChatResponse } from "@krishimitra/shared";

import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { advisoryApi } from "../services/api";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";

type AdvisoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const advisoryCacheKey = buildCacheKey("advisory:thread");

export const AdvisoryScreen = () => {
  const user = useAuthStore((state) => state.user);

  const [messages, setMessages] = useState<AdvisoryMessage[]>([]);
  const [input, setInput] = useState("");
  const [meta, setMeta] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const quickPrompts = [
    "How should I schedule irrigation this week?",
    "Which crop suits my current soil and rainfall conditions?",
    "What signals should I watch before selling produce?",
    "How can I reduce fertilizer waste this season?"
  ];

  useEffect(() => {
    readCacheRecord<{ messages: AdvisoryMessage[]; meta: ChatResponse | null }>(advisoryCacheKey).then((cached) => {
      if (cached) {
        setMessages(cached.value.messages);
        setMeta(cached.value.meta);
        setNotice(`Loaded cached advisory history from ${new Date(cached.updatedAt).toLocaleString()}.`);
      }
    });
  }, []);

  const persistConversation = async (nextMessages: AdvisoryMessage[], nextMeta: ChatResponse | null) => {
    await writeCacheRecord(advisoryCacheKey, {
      messages: nextMessages,
      meta: nextMeta
    });
  };

  const handleSend = async (preset?: string) => {
    const content = (preset || input).trim();
    if (!content || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content } as AdvisoryMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setNotice(null);

    try {
      const response = await advisoryApi.sendMessage({
        message: content,
        language: user?.language || "en"
      });
      const updatedMessages = [...nextMessages, { role: "assistant", content: response.reply } as AdvisoryMessage];
      setMessages(updatedMessages);
      setMeta(response);
      await persistConversation(updatedMessages, response);
    } catch (error) {
      const cached = await readCacheRecord<{ messages: AdvisoryMessage[]; meta: ChatResponse | null }>(advisoryCacheKey);
      if (cached) {
        setMessages(cached.value.messages);
        setMeta(cached.value.meta);
        setNotice(`Live advisory is unavailable. Showing cached thread from ${new Date(cached.updatedAt).toLocaleString()}.`);
      } else {
        setNotice(error instanceof Error ? error.message : "Advisory service is unavailable right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Advisory chat"
      subtitle="Multilingual field guidance with the existing AI workflow, tuned for shorter mobile conversations."
    >
      {notice ? (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <SectionCard title="Quick prompts" subtitle="Start fast with the questions farmers ask most often.">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptRow}>
          {quickPrompts.map((prompt) => (
            <Pressable key={prompt} onPress={() => void handleSend(prompt)} style={styles.promptChip}>
              <Text style={styles.promptText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SectionCard>

      <SectionCard title="Conversation" subtitle="Messages are cached locally so you can reopen recent guidance quickly.">
        <View style={styles.chatList}>
          {messages.length === 0 ? (
            <Text style={styles.placeholderText}>Ask about crops, irrigation, market timing, or disease follow-up.</Text>
          ) : null}
          {messages.map((item, index) => (
            <View
              key={`${item.role}-${index}`}
              style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}
            >
              <Text style={[styles.bubbleText, item.role === "user" ? styles.userText : null]}>{item.content}</Text>
            </View>
          ))}
        </View>

        {meta ? (
          <View style={styles.metaCard}>
            <Text style={styles.metaText}>Model: {meta.model}</Text>
            <Text style={styles.metaText}>Conversation ID: {meta.conversation_id}</Text>
          </View>
        ) : null}

        <FieldInput
          label="Ask the advisory assistant"
          multiline
          onChangeText={setInput}
          placeholder="Describe your field condition, crop stage, or market question."
          style={styles.multilineInput}
          value={input}
        />
        <PrimaryButton label="Send message" loading={loading} onPress={() => void handleSend()} />
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  noticeBanner: {
    backgroundColor: "#ecf4ee",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c8ddcc",
    padding: 14
  },
  noticeText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18
  },
  promptRow: {
    gap: 10
  },
  promptChip: {
    maxWidth: 280,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  promptText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  chatList: {
    gap: 10
  },
  placeholderText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: 18,
    padding: 12
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted
  },
  bubbleText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: colors.white
  },
  metaCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 12,
    gap: 4
  },
  metaText: {
    color: colors.mutedText,
    fontSize: 12
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: "top"
  }
});
