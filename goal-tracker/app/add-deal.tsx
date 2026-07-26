import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useDealsStore } from '@/src/store/dealsStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { uploadDealPhoto } from '@/src/firebase/storage';
import { prepareImageForUpload } from '@/src/lib/image';
import { generateId } from '@/src/lib/id';
import { colors, radius, spacing, typography } from '@/src/theme';
import { addDays, todayISO, toISODate } from '@/src/lib/dates';

export default function AddDealScreen() {
  const router = useRouter();
  const addDeal = useDealsStore((s) => s.addDeal);
  const updateDealDetails = useDealsStore((s) => s.updateDealDetails);
  const liveDeals = useDealsStore((s) => s.deals);

  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const teamId = useTeamStore((s) => s.teamId);
  const repUid = firebaseUser?.uid ?? '';
  const repName = profile?.displayName ?? 'Unknown rep';

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [savedDealId, setSavedDealId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const yesterday = toISODate(addDays(new Date(), -1));
  const liveDeal = savedDealId ? liveDeals.find((d) => d.id === savedDealId) : undefined;

  // Auto-fills once from the Cloud Function's best guess, rather than making the rep tap
  // to accept a chip. Only runs once per deal so it never clobbers a manual edit made
  // after the guess lands.
  const autofilledRef = useRef(false);
  useEffect(() => {
    if (autofilledRef.current || !liveDeal || liveDeal.ocrStatus !== 'done') return;
    const { ocrGuessedName, ocrGuessedAddress } = liveDeal;
    if (!ocrGuessedName && !ocrGuessedAddress) return;
    autofilledRef.current = true;
    if (ocrGuessedName) setCustomerName((prev) => prev || ocrGuessedName);
    if (ocrGuessedAddress) setAddress((prev) => prev || ocrGuessedAddress);
  }, [liveDeal]);

  function haptic(type: 'success' | 'error' = 'success') {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(
      type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
  }

  async function captureAndUpload(uri: string) {
    setError(null);
    if (!teamId) {
      setError('No team loaded yet — try again in a moment.');
      return;
    }
    setUploading(true);
    try {
      setUploadStage('Preparing photo…');
      const prepared = await prepareImageForUpload(uri);
      const id = generateId();
      setUploadStage('Uploading photo…');
      const photoUrl = await uploadDealPhoto(teamId, id, prepared);
      setUploadStage('Saving deal…');
      await addDeal(repUid, repName, { date: todayISO(), photoUrl }, id);
      setPhotoUri(uri);
      setSavedDealId(id);
      haptic('success');
    } catch (err: any) {
      haptic('error');
      setError(err?.message ?? 'Check your connection and try again.');
    } finally {
      setUploading(false);
      setUploadStage('');
    }
  }

  async function takePhoto() {
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Enable camera access in your browser/phone settings to log a deal.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled) return;
      await captureAndUpload(result.assets[0].uri);
    } catch (err: any) {
      setError(err?.message ?? 'Could not open the camera.');
    }
  }

  async function pickFromLibrary() {
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('Enable photo library access in your browser/phone settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (result.canceled) return;
      await captureAndUpload(result.assets[0].uri);
    } catch (err: any) {
      setError(err?.message ?? 'Could not open the photo library.');
    }
  }

  async function saveDetails() {
    if (!savedDealId) return;
    setError(null);
    setSaving(true);
    try {
      await updateDealDetails(savedDealId, { customerName, address, notes, date });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!firebaseUser || !profile) {
    return <Redirect href="/auth" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Add Deal</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <FontAwesome name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!photoUri ? (
            <>
              <View style={styles.photoRequiredCard}>
                <FontAwesome name="camera" size={32} color={colors.primary} />
                <Text style={styles.photoRequiredTitle}>Every deal needs a photo</Text>
                <Text style={styles.photoRequiredHint}>
                  Snap the contract, ID, or paperwork — we'll scan it for customer details you can tap to fill in.
                </Text>
              </View>

              <Pressable
                style={[styles.actionButton, uploading && { opacity: 0.6 }]}
                onPress={takePhoto}
                disabled={uploading}
              >
                <FontAwesome name="camera" size={18} color={colors.background} />
                <Text style={styles.actionButtonText}>Take photo</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButtonSecondary, uploading && { opacity: 0.6 }]}
                onPress={pickFromLibrary}
                disabled={uploading}
              >
                <FontAwesome name="image" size={16} color={colors.primary} />
                <Text style={styles.actionButtonSecondaryText}>Choose from library</Text>
              </Pressable>

              {uploading && (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.uploadingText}>{uploadStage || 'Uploading…'}</Text>
                </View>
              )}

              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.photoPreviewRow}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedText}>Deal logged — counts toward your total already.</Text>
                  <Text style={styles.hint}>Add customer details below, or close this and fill them in later.</Text>
                </View>
              </View>

              <View style={styles.ocrBox}>
                {liveDeal?.ocrStatus === 'pending' && (
                  <View style={styles.ocrRow}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={styles.ocrText}>Scanning photo for details…</Text>
                  </View>
                )}
                {liveDeal?.ocrStatus === 'done' && (liveDeal.ocrGuessedName || liveDeal.ocrGuessedAddress) && (
                  <Text style={styles.ocrLabelSuccess}>
                    Auto-filled from the photo below — double-check it's correct.
                  </Text>
                )}
                {liveDeal?.ocrStatus === 'done' && !liveDeal.ocrGuessedName && !liveDeal.ocrGuessedAddress && (
                  <Text style={styles.ocrText}>Couldn't find a clear name/address — fill in the details manually below.</Text>
                )}
                {liveDeal?.ocrStatus === 'error' && (
                  <Text style={styles.ocrText}>No text detected — fill in the details manually below.</Text>
                )}
              </View>

              <View style={styles.dateRow}>
                <DateChip label="Today" active={date === todayISO()} onPress={() => setDate(todayISO())} />
                <DateChip label="Yesterday" active={date === yesterday} onPress={() => setDate(yesterday)} />
              </View>

              <Field label="Customer name">
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Optional"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                />
              </Field>

              <Field label="Address">
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Optional"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                />
              </Field>

              <Field label="Notes">
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional"
                  placeholderTextColor={colors.textFaint}
                  style={[styles.input, styles.textArea]}
                  multiline
                />
              </Field>

              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={saveDetails} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save details'}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function DateChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  photoRequiredCard: {
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
  photoRequiredTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  photoRequiredHint: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  actionButtonSecondaryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  uploadingText: {
    color: colors.textMuted,
  },
  errorBanner: {
    backgroundColor: '#3a1d1d',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#7a3b3b',
    padding: spacing.sm + 2,
    marginTop: spacing.md,
  },
  errorText: {
    color: '#ff9b9b',
    fontSize: 13,
    fontWeight: '600',
  },
  photoPreviewRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  savedText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
  },
  hint: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
  ocrBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  ocrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ocrText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ocrLabelSuccess: {
    ...typography.caption,
    color: colors.success,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.statLabel,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
