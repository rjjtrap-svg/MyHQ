import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { usePitchCoachStore } from '@/src/store/pitchCoachStore';
import { useCoachChatStore } from '@/src/store/coachChatStore';
import { createPitchSubmission, uploadPitchAudio, askObjectionHandling } from '@/src/firebase/pitchCoaching';
import { resetCoachChatSession, sendCoachChatMessage, uploadCoachChatAudio, uploadCoachChatImage } from '@/src/firebase/coachChat';
import { generateId } from '@/src/lib/id';
import { CLOSING_TIPS, OBJECTIONS, PITCH_SCRIPT } from '@/src/lib/fiberScript';
import { Section } from '@/src/components/Section';
import { colors, radius, spacing, typography } from '@/src/theme';
import { ObjectionExchange, PitchSubmission } from '@/src/types';

type CoachTab = 'accountability' | 'pitch' | 'objections' | 'training';

const STATUS_LABELS: Record<PitchSubmission['status'], string> = {
  uploading: 'Uploading…',
  transcribing: 'Transcribing…',
  grading: 'Grading…',
  done: 'Done',
  error: 'Error',
};

function SegmentedControl({ value, onChange }: { value: CoachTab; onChange: (v: CoachTab) => void }) {
  const options: { key: CoachTab; label: string }[] = [
    { key: 'accountability', label: 'Accountability' },
    { key: 'pitch', label: 'Grade My Pitch' },
    { key: 'objections', label: 'Objections' },
    { key: 'training', label: 'Training' },
  ];
  return (
    <View style={styles.segmentRow}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          style={[styles.segmentButton, value === o.key && styles.segmentButtonActive]}
          onPress={() => onChange(o.key)}
        >
          <Text style={[styles.segmentText, value === o.key && styles.segmentTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function GradeColor(grade?: number): string {
  if (grade === undefined) return colors.textFaint;
  if (grade >= 80) return colors.success;
  if (grade >= 60) return colors.gold;
  return colors.danger;
}

function PitchSubmissionCard({ submission }: { submission: PitchSubmission }) {
  const [expanded, setExpanded] = useState(false);
  const inProgress = submission.status !== 'done' && submission.status !== 'error';

  return (
    <Pressable style={styles.submissionCard} onPress={() => setExpanded((v) => !v)}>
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
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
      </View>

      <Section title="Past Pitches">
        {submissions.length === 0 ? (
          <Text style={styles.emptyText}>No practice pitches recorded yet.</Text>
        ) : (
          submissions.map((s) => <PitchSubmissionCard key={s.id} submission={s} />)
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
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
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

function AccountabilityCoachSection({ scrollRef }: { scrollRef: React.RefObject<ScrollView> }) {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const teamId = useTeamStore((s) => s.teamId);
  const messages = useCoachChatStore((s) => s.messages);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, sending]);

  async function sendText() {
    const trimmed = input.trim();
    if (!trimmed || !teamId || sending) return;
    setError(null);
    setInput('');
    setSending(true);
    try {
      await sendCoachChatMessage(teamId, trimmed);
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
      await sendCoachChatMessage(teamId, caption, { image });
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
      await sendCoachChatMessage(teamId, '', { audio });
    } catch (err: any) {
      setError(err?.message ?? 'Could not send that voice memo.');
    } finally {
      setSending(false);
    }
  }

  async function confirmReset() {
    if (!teamId || resetting) return;
    setError(null);
    setResetting(true);
    try {
      await resetCoachChatSession(teamId);
      setConfirmingReset(false);
    } catch (err: any) {
      setError(err?.message ?? 'Could not start a new conversation.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <View style={styles.recordCard}>
        <Text style={styles.recordHint}>
          Talk to your coach about anything — a rough day, a weird objection, a win worth celebrating. Type it,
          snap a photo, or record a voice memo. It remembers the whole conversation.
        </Text>
      </View>

      {!confirmingReset ? (
        <Pressable onPress={() => setConfirmingReset(true)} style={styles.newConversationRow}>
          <FontAwesome name="refresh" size={12} color={colors.textFaint} />
          <Text style={styles.newConversationText}>Start a new conversation</Text>
        </Pressable>
      ) : (
        <View style={styles.resetConfirmCard}>
          <Text style={styles.resetConfirmText}>
            Start fresh? Your coach won't remember this conversation — older messages stay visible, but it forgets
            the context.
          </Text>
          <View style={styles.resetConfirmButtons}>
            <Pressable
              onPress={() => setConfirmingReset(false)}
              style={styles.resetCancelButton}
              disabled={resetting}
            >
              <Text style={styles.resetCancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={confirmReset} style={styles.resetConfirmButton} disabled={resetting}>
              {resetting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.resetConfirmButtonText}>Start fresh</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {messages.length === 0 && !sending && <Text style={styles.emptyText}>Nothing here yet — say hello below.</Text>}

      {messages.map((m) => (
        <View key={m.id} style={[styles.chatBubble, m.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAgent]}>
          {m.attachmentType === 'image' && m.attachmentUrl && (
            <Image source={{ uri: m.attachmentUrl }} style={styles.chatBubbleImage} resizeMode="cover" />
          )}
          {m.attachmentType === 'audio' && m.attachmentUrl && <AudioBubble url={m.attachmentUrl} />}
          {!!m.text && (
            <Text style={m.role === 'user' ? styles.chatBubbleUserText : styles.chatBubbleAgentText}>{m.text}</Text>
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
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{isAccountability ? 'Accountability Coach' : 'AI Sales Coach'}</Text>
        <Text style={styles.subheading}>
          {isAccountability
            ? 'Your coach, on call — text, photos, or voice memos, any time of day.'
            : 'Practice, get objection help, and review the script — all in one place.'}
        </Text>

        <SegmentedControl value={tab} onChange={setTab} />

        {tab === 'accountability' && <AccountabilityCoachSection scrollRef={scrollRef} />}
        {tab === 'pitch' && <GradePitchSection />}
        {tab === 'objections' && <ObjectionsSection />}
        {tab === 'training' && <TrainingSection />}
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
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentButtonActive: {
    backgroundColor: colors.primaryMuted,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  segmentTextActive: {
    color: colors.primary,
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
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#3a1d1d',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#7a3b3b',
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  errorBannerText: {
    color: '#ff9b9b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
    ...typography.statValue,
    fontSize: 24,
  },
  expandedBlock: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  expandedLabel: {
    ...typography.statLabel,
    color: colors.textMuted,
    textTransform: 'uppercase',
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
    color: colors.background,
    fontWeight: '700',
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
    marginBottom: spacing.sm,
    maxWidth: '85%',
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
    color: colors.background,
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
    fontWeight: '600',
  },
  newConversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  newConversationText: {
    ...typography.caption,
    color: colors.textFaint,
    fontWeight: '600',
  },
  resetConfirmCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  resetConfirmText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  resetConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  resetCancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  resetCancelText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  resetConfirmButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  resetConfirmButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
});
