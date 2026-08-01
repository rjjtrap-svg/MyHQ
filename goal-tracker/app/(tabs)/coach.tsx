import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { usePitchCoachStore } from '@/src/store/pitchCoachStore';
import { useCoachChatStore } from '@/src/store/coachChatStore';
import {
  askObjectionHandling,
  createPitchSubmission,
  deletePitchSubmission,
  uploadPitchAudio,
} from '@/src/firebase/pitchCoaching';
import {
  deleteCoachChatMessage,
  LEGACY_CONVERSATION_ID,
  sendCoachChatMessage,
  uploadCoachChatAudio,
  uploadCoachChatImage,
} from '@/src/firebase/coachChat';
import { generateId } from '@/src/lib/id';
import { CLOSING_TIPS, OBJECTIONS, PITCH_SCRIPT } from '@/src/lib/fiberScript';
import { LockInTab } from '@/src/components/lockin/LockInTab';
import { Section } from '@/src/components/Section';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Banner } from '@/src/components/Banner';
import { Button } from '@/src/components/Button';
import { fonts, colors, radius, spacing, typography } from '@/src/theme';
import { ObjectionExchange, PitchSubmission } from '@/src/types';

type CoachTab = 'accountability' | 'pitch' | 'objections' | 'training' | 'lockin';

const STATUS_LABELS: Record<PitchSubmission['status'], string> = {
  uploading: 'Uploading…',
  transcribing: 'Transcribing…',
  grading: 'Grading…',
  done: 'Done',
  error: 'Error',
};

/**
 * Four cards in a 2x2 grid rather than one segmented bar — with four labels this long,
 * a single row squeezed every label to the point of truncation.
 */
function CoachModePicker({ value, onChange }: { value: CoachTab; onChange: (v: CoachTab) => void }) {
  const options: { key: CoachTab; label: string; hint: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
    { key: 'accountability', label: 'Accountability', hint: 'Talk it out', icon: 'comments' },
    { key: 'pitch', label: 'Grade My Pitch', hint: 'Record & score', icon: 'microphone' },
    { key: 'objections', label: 'Objections', hint: 'Live answers', icon: 'shield' },
    { key: 'training', label: 'Training', hint: 'Script & guide', icon: 'book' },
    { key: 'lockin', label: 'Lock In', hint: 'Quotes & ideas', icon: 'bolt' },
  ];
  return (
    <View style={styles.modeGrid}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <Pressable
            key={o.key}
            style={[styles.modeCard, active && styles.modeCardActive]}
            onPress={() => onChange(o.key)}
          >
            <FontAwesome
              name={o.icon}
              size={18}
              color={active ? colors.gold : colors.textFaint}
            />
            <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{o.label}</Text>
            <Text style={[styles.modeHint, active && styles.modeHintActive]}>{o.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GradeColor(grade?: number): string {
  if (grade === undefined) return colors.textFaint;
  if (grade >= 80) return colors.success;
  if (grade >= 60) return colors.gold;
  return colors.danger;
}

function PitchSubmissionCard({
  submission,
  onDelete,
  deleting,
}: {
  submission: PitchSubmission;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const inProgress = submission.status !== 'done' && submission.status !== 'error';

  return (
    <Pressable style={styles.submissionCard} onPress={() => setExpanded((v) => !v)}>
      <Pressable
        style={styles.submissionDeleteButton}
        onPress={() => setConfirming((v) => !v)}
        hitSlop={8}
      >
        <FontAwesome name="trash-o" size={14} color={colors.textFaint} />
      </Pressable>

      <View style={styles.submissionHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.submissionDate}>
            {new Date(submission.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          {inProgress ? (
            <View style={styles.inProgressRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.inProgressText}>{STATUS_LABELS[submission.status]}</Text>
            </View>
          ) : submission.status === 'error' ? (
            <Text style={styles.errorText}>{submission.errorMessage || 'Something went wrong.'}</Text>
          ) : (
            <Text style={styles.submissionSummary} numberOfLines={expanded ? undefined : 1}>
              {submission.summary}
            </Text>
          )}
        </View>
        {submission.status === 'done' && (
          <Text style={[styles.gradeText, { color: GradeColor(submission.grade) }]}>{submission.grade}</Text>
        )}
      </View>

      {confirming && (
        <View style={styles.deleteConfirmRow}>
          <Text style={styles.deleteConfirmText}>Delete this pitch?</Text>
          <Button label="Cancel" variant="ghost" size="sm" onPress={() => setConfirming(false)} disabled={deleting} />
          <Button label="Delete" variant="danger" size="sm" onPress={() => onDelete(submission.id)} busy={deleting} />
        </View>
      )}

      {expanded && submission.status === 'done' && (
        <View style={styles.expandedBlock}>
          {!!submission.strengths?.length && (
            <>
              <Text style={styles.expandedLabel}>Strengths</Text>
              {submission.strengths.map((s, i) => (
                <Text key={i} style={styles.expandedBullet}>
                  • {s}
                </Text>
              ))}
            </>
          )}
          {!!submission.improvements?.length && (
            <>
              <Text style={[styles.expandedLabel, { marginTop: spacing.sm }]}>To improve</Text>
              {submission.improvements.map((s, i) => (
                <Text key={i} style={styles.expandedBullet}>
                  • {s}
                </Text>
              ))}
            </>
          )}
          {!!submission.transcript && (
            <>
              <Text style={[styles.expandedLabel, { marginTop: spacing.sm }]}>Transcript</Text>
              <Text style={styles.transcriptText}>{submission.transcript}</Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

function GradePitchSection() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const teamId = useTeamStore((s) => s.teamId);
  const submissions = usePitchCoachStore((s) => s.submissions);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function removeSubmission(id: string) {
    if (!teamId || deletingId) return;
    setError(null);
    setDeletingId(id);
    try {
      await deletePitchSubmission(teamId, id);
    } catch (err: any) {
      setError(err?.message ?? 'Could not delete that pitch.');
    } finally {
      setDeletingId(null);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError('Enable microphone access to record a practice pitch.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch (err: any) {
      setError(err?.message ?? 'Could not start recording.');
    }
  }

  async function stopRecording() {
    if (!recording || !teamId || !firebaseUser) return;
    setIsRecording(false);
    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('No recording found.');

      const id = generateId();
      const repName = profile?.displayName ?? 'Unknown rep';
      await createPitchSubmission(teamId, firebaseUser.uid, repName, id);
      await uploadPitchAudio(teamId, id, uri);
    } catch (err: any) {
      setError(err?.message ?? 'Could not upload the recording.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <View style={styles.recordCard}>
        <Text style={styles.recordHint}>
          Record yourself running the pitch — right after a door is best, while it's fresh. The AI coach grades it
          against the script and objection guide.
        </Text>
        <Pressable
          style={[styles.recordButton, isRecording && styles.recordButtonActive, busy && { opacity: 0.6 }]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <FontAwesome name={isRecording ? 'stop' : 'microphone'} size={22} color={colors.background} />
          )}
        </Pressable>
        <Text style={styles.recordLabel}>
          {busy ? 'Uploading…' : isRecording ? 'Tap to stop' : 'Tap to record'}
        </Text>
        {error && (
          <Banner message={error} />
        )}
      </View>

      <Section title="Past Pitches">
        {submissions.length === 0 ? (
          <Text style={styles.emptyText}>No practice pitches recorded yet.</Text>
        ) : (
          submissions.map((s) => (
            <PitchSubmissionCard
              key={s.id}
              submission={s}
              onDelete={removeSubmission}
              deleting={deletingId === s.id}
            />
          ))
        )}
      </Section>
    </>
  );
}

function ObjectionsSection() {
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] = useState<ObjectionExchange[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed) return;
    setError(null);
    setAsking(true);
    try {
      const answer = await askObjectionHandling(trimmed);
      setExchanges((prev) => [{ id: generateId(), question: trimmed, answer }, ...prev]);
      setQuestion('');
    } catch (err: any) {
      setError(err?.message ?? 'Could not reach the AI coach.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <View style={styles.recordCard}>
        <Text style={styles.recordHint}>
          Describe what the customer just said and get a live response grounded in the objection guide.
        </Text>
        <TextInput
          style={styles.objectionInput}
          value={question}
          onChangeText={setQuestion}
          placeholder={'e.g. "They said they\'re under contract for another year"'}
          placeholderTextColor={colors.textFaint}
          multiline
        />
        <Pressable style={[styles.askButton, asking && { opacity: 0.6 }]} onPress={ask} disabled={asking}>
          {asking ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.askButtonText}>Ask Coach</Text>
          )}
        </Pressable>
        {error && (
          <Banner message={error} />
        )}
      </View>

      {exchanges.map((ex) => (
        <View key={ex.id} style={styles.exchangeCard}>
          <Text style={styles.exchangeQuestion}>"{ex.question}"</Text>
          <Text style={styles.exchangeAnswer}>{ex.answer}</Text>
        </View>
      ))}
    </>
  );
}

function AudioBubble({ url }: { url: string }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function toggle() {
    if (soundRef.current) {
      if (playing) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setPlaying(true);
      }
      return;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
    soundRef.current = sound;
    setPlaying(true);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) setPlaying(false);
    });
  }

  return (
    <Pressable style={styles.audioBubbleRow} onPress={toggle}>
      <FontAwesome name={playing ? 'pause' : 'play'} size={13} color={colors.accent} />
      <Text style={styles.audioBubbleLabel}>Voice memo</Text>
    </Pressable>
  );
}

/** "3d ago" / "2w ago" — same shape as territory.tsx's lastWorked(), kept local since it's
 * the only other place this exact formatting is needed. */
function relativeTime(iso: string): string {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function AccountabilityCoachSection({ scrollRef }: { scrollRef: React.RefObject<ScrollView> }) {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const teamId = useTeamStore((s) => s.teamId);
  const messages = useCoachChatStore((s) => s.messages);
  const conversations = useCoachChatStore((s) => s.conversations);
  const activeConversationId = useCoachChatStore((s) => s.activeConversationId);
  const openConversation = useCoachChatStore((s) => s.openConversation);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, sending]);

  function openHistoryConversation(id: string) {
    if (!teamId || !firebaseUser) return;
    openConversation(teamId, firebaseUser.uid, id);
    setShowHistory(false);
  }

  function startNewConversation() {
    if (!teamId || !firebaseUser) return;
    openConversation(teamId, firebaseUser.uid, null);
    setShowHistory(false);
  }

  async function sendText() {
    const trimmed = input.trim();
    if (!trimmed || !teamId || !firebaseUser || sending) return;
    setError(null);
    setInput('');
    setSending(true);
    try {
      const { conversationId } = await sendCoachChatMessage(teamId, activeConversationId, trimmed);
      if (conversationId !== activeConversationId) openConversation(teamId, firebaseUser.uid, conversationId);
    } catch (err: any) {
      setError(err?.message ?? 'Could not reach the AI coach.');
    } finally {
      setSending(false);
    }
  }

  async function sendPhoto(localUri: string) {
    if (!teamId || !firebaseUser || sending) return;
    const caption = input.trim();
    setError(null);
    setInput('');
    setSending(true);
    try {
      const image = await uploadCoachChatImage(teamId, firebaseUser.uid, generateId(), localUri);
      const { conversationId } = await sendCoachChatMessage(teamId, activeConversationId, caption, { image });
      if (conversationId !== activeConversationId) openConversation(teamId, firebaseUser.uid, conversationId);
    } catch (err: any) {
      setError(err?.message ?? 'Could not send that photo.');
    } finally {
      setSending(false);
    }
  }

  async function takePhoto() {
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Enable camera access to attach a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (result.canceled) return;
      await sendPhoto(result.assets[0].uri);
    } catch (err: any) {
      setError(err?.message ?? 'Could not open the camera.');
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError('Enable microphone access to record a voice memo.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch (err: any) {
      setError(err?.message ?? 'Could not start recording.');
    }
  }

  async function stopRecording() {
    if (!recording || !teamId || !firebaseUser) return;
    setIsRecording(false);
    setError(null);
    setSending(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('No recording found.');
      const audio = await uploadCoachChatAudio(teamId, firebaseUser.uid, generateId(), uri);
      const { conversationId } = await sendCoachChatMessage(teamId, activeConversationId, '', { audio });
      if (conversationId !== activeConversationId) openConversation(teamId, firebaseUser.uid, conversationId);
    } catch (err: any) {
      setError(err?.message ?? 'Could not send that voice memo.');
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete(messageId: string) {
    if (!teamId || deletingId || !activeConversationId) return;
    setError(null);
    setDeletingId(messageId);
    try {
      await deleteCoachChatMessage(teamId, activeConversationId, messageId);
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err?.message ?? 'Could not delete that message.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <View style={styles.recordCard}>
        <Text style={styles.recordHint}>
          Talk to your coach about anything — a rough day, a weird objection, a win worth celebrating. Type it,
          snap a photo, or record a voice memo. It remembers you between conversations, not just within one.
        </Text>
      </View>

      {/* Opening the tab always starts a clean thread (activeConversationId defaults to
          null in the store) — memory of the rep still carries over via the coach's
          long-term memory store, only the visible thread is fresh. History pulls up past
          threads from the last 30 days instead of one conversation growing forever. */}
      <View style={styles.threadControls}>
        <Pressable onPress={startNewConversation} style={styles.threadControlButton}>
          <FontAwesome name="plus" size={12} color={colors.textFaint} />
          <Text style={styles.threadControlText}>New</Text>
        </Pressable>
        <Pressable onPress={() => setShowHistory((v) => !v)} style={styles.threadControlButton}>
          <FontAwesome name="history" size={12} color={colors.textFaint} />
          <Text style={styles.threadControlText}>
            History{conversations.length > 0 ? ` (${conversations.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {showHistory && (
        <View style={styles.historyCard}>
          {conversations.length === 0 ? (
            <Text style={styles.historyEmpty}>No conversations from the last 30 days.</Text>
          ) : (
            conversations.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => openHistoryConversation(c.id)}
                style={[styles.historyRow, c.id === activeConversationId && styles.historyRowActive]}
              >
                <Text style={styles.historyPreview} numberOfLines={1}>
                  {c.preview || (c.id === LEGACY_CONVERSATION_ID ? 'Earlier conversation' : '(no preview)')}
                </Text>
                <Text style={styles.historyMeta}>{relativeTime(c.updatedAt)}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      {messages.length === 0 && !sending && <Text style={styles.emptyText}>Nothing here yet — say hello below.</Text>}

      {messages.map((m) => (
        <View key={m.id}>
          <View style={[styles.chatBubble, m.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAgent]}>
            <Pressable
              style={styles.chatBubbleDeleteButton}
              onPress={() => setConfirmDeleteId((prev) => (prev === m.id ? null : m.id))}
              hitSlop={8}
            >
              <FontAwesome name="trash-o" size={13} color={m.role === 'user' ? colors.background : colors.textFaint} />
            </Pressable>
            {m.attachmentType === 'image' && m.attachmentUrl && (
              <Image source={{ uri: m.attachmentUrl }} style={styles.chatBubbleImage} resizeMode="cover" />
            )}
            {m.attachmentType === 'audio' && m.attachmentUrl && <AudioBubble url={m.attachmentUrl} />}
            {!!m.text && (
              <Text style={m.role === 'user' ? styles.chatBubbleUserText : styles.chatBubbleAgentText}>{m.text}</Text>
            )}
          </View>

          {confirmDeleteId === m.id && (
            <View style={styles.deleteConfirmRow}>
              <Text style={styles.deleteConfirmText}>Delete this message?</Text>
              <Button label="Cancel" variant="ghost" size="sm" onPress={() => setConfirmDeleteId(null)} disabled={!!deletingId} />
              <Button
                label="Delete"
                variant="danger"
                size="sm"
                onPress={() => confirmDelete(m.id)}
                busy={deletingId === m.id}
              />
            </View>
          )}
        </View>
      ))}

      {sending && (
        <View style={styles.inProgressRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.inProgressText}>Thinking…</Text>
        </View>
      )}

      {error && (
        <Banner message={error} />
      )}

      <View style={styles.chatInputRow}>
        <Pressable style={styles.chatIconButton} onPress={takePhoto} disabled={sending || isRecording}>
          <FontAwesome name="camera" size={18} color={colors.text} />
        </Pressable>
        <Pressable
          style={[styles.chatIconButton, isRecording && styles.chatIconButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={sending && !isRecording}
        >
          <FontAwesome
            name={isRecording ? 'stop' : 'microphone'}
            size={18}
            color={isRecording ? colors.background : colors.text}
          />
        </Pressable>
        <TextInput
          style={styles.chatInput}
          value={input}
          onChangeText={setInput}
          placeholder="Say anything…"
          placeholderTextColor={colors.textFaint}
          multiline
          editable={!isRecording}
        />
        <Pressable
          style={[styles.chatSendButton, sending && { opacity: 0.6 }]}
          onPress={sendText}
          disabled={sending || isRecording}
        >
          <FontAwesome name="arrow-up" size={16} color={colors.background} />
        </Pressable>
      </View>
    </>
  );
}

function TrainingSection() {
  return (
    <>
      <Section title="Pitch Script">
        {PITCH_SCRIPT.map((section) => (
          <View key={section.title} style={styles.scriptBlock}>
            <Text style={styles.scriptTitle}>{section.title}</Text>
            {section.lines.map((line, i) => (
              <Text key={i} style={styles.scriptLine}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </Section>

      <Section title="Objection Handling Guide">
        {OBJECTIONS.map((o, i) => (
          <View key={i} style={styles.objectionBlock}>
            <Text style={styles.objectionQuestion}>"{o.objection}"</Text>
            <Text style={styles.objectionResponse}>{o.response}</Text>
          </View>
        ))}
      </Section>

      <Section title="Closing Principles">
        {CLOSING_TIPS.map((tip, i) => (
          <Text key={i} style={styles.scriptLine}>
            • {tip}
          </Text>
        ))}
      </Section>
    </>
  );
}

export default function CoachScreen() {
  const [tab, setTab] = useState<CoachTab>('accountability');
  const scrollRef = useRef<ScrollView>(null);
  const isAccountability = tab === 'accountability';
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const teamId = useTeamStore((s) => s.teamId);
  const openConversation = useCoachChatStore((s) => s.openConversation);

  // Opening the Coach screen always lands on a clean conversation rather than wherever the
  // rep left off — History is the deliberate way back to an old thread, not the default.
  useEffect(() => {
    if (teamId && firebaseUser) openConversation(teamId, firebaseUser.uid, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Sharpen up"
          title={isAccountability ? 'Accountability Coach' : 'AI Sales Coach'}
          subtitle={
            isAccountability
              ? 'Your coach, on call — text, photos, or voice memos, any time of day.'
              : 'Practice, get objection help, and review the script — all in one place.'
          }
        />

        <CoachModePicker value={tab} onChange={setTab} />

        {tab === 'accountability' && <AccountabilityCoachSection scrollRef={scrollRef} />}
        {tab === 'pitch' && <GradePitchSection />}
        {tab === 'objections' && <ObjectionsSection />}
        {tab === 'training' && <TrainingSection />}
        {tab === 'lockin' && <LockInTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heading: {
    ...typography.hero,
    fontSize: 28,
    color: colors.text,
    marginTop: spacing.md,
  },
  subheading: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modeCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    gap: spacing.xs,
  },
  modeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeLabel: {
    ...typography.eyebrow,
    fontSize: 11,
    color: colors.text,
    marginTop: spacing.xs,
  },
  modeLabelActive: {
    color: colors.onPrimary,
  },
  modeHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
  },
  modeHintActive: {
    color: colors.primaryMuted,
  },
  submissionDeleteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: 4,
    zIndex: 1,
  },
  recordCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  recordHint: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: colors.danger,
  },
  recordLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: fonts.sansSemiBold,
  },
  emptyText: {
    ...typography.body,
    color: colors.textFaint,
  },
  submissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  submissionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submissionDate: {
    ...typography.caption,
    color: colors.textFaint,
  },
  submissionSummary: {
    ...typography.body,
    color: colors.text,
    marginTop: 2,
  },
  inProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  inProgressText: {
    ...typography.caption,
    color: colors.accent,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 2,
  },
  gradeText: {
    ...typography.scoreValue,
    fontSize: 24,
  },
  expandedBlock: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  expandedLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  expandedBullet: {
    ...typography.caption,
    color: colors.text,
    marginBottom: 2,
  },
  transcriptText: {
    ...typography.caption,
    color: colors.textFaint,
    fontStyle: 'italic',
  },
  objectionInput: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  askButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  askButtonText: {
    color: colors.onPrimary,
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  exchangeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  exchangeQuestion: {
    ...typography.caption,
    color: colors.textFaint,
    fontStyle: 'italic',
  },
  exchangeAnswer: {
    ...typography.body,
    color: colors.text,
  },
  scriptBlock: {
    marginBottom: spacing.md,
  },
  scriptTitle: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  scriptLine: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  objectionBlock: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  objectionQuestion: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  objectionResponse: {
    ...typography.body,
    color: colors.textMuted,
  },
  chatBubble: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.lg + spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: '85%',
    position: 'relative',
  },
  chatBubbleDeleteButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: 4,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  chatBubbleAgent: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatBubbleUserText: {
    ...typography.body,
    color: colors.onPrimary,
  },
  chatBubbleAgentText: {
    ...typography.body,
    color: colors.text,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconButtonActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  chatBubbleImage: {
    width: 200,
    height: 200,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  audioBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  audioBubbleLabel: {
    ...typography.caption,
    color: colors.accent,
    fontFamily: fonts.sansSemiBold,
  },
  threadControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  threadControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  threadControlText: {
    ...typography.caption,
    color: colors.textFaint,
    fontFamily: fonts.sansSemiBold,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  historyEmpty: {
    ...typography.caption,
    color: colors.textFaint,
    padding: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  historyRowActive: {
    backgroundColor: colors.surfaceElevated,
  },
  historyPreview: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  historyMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  deleteConfirmText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
