import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Emblem } from '@/src/components/Emblem';
import { Button } from '@/src/components/Button';
import { colors, spacing, typography } from '@/src/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
      <View style={styles.container}>
        <Emblem size={76} />
        <Text style={styles.eyebrow}>Dead end</Text>
        <Text style={styles.title}>Nothing at this address.</Text>
        <Text style={styles.body}>
          That link doesn't lead anywhere. Head back to your dashboard and carry on.
        </Text>
        <Button label="Back to Home" onPress={() => router.replace('/')} style={styles.button} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.gold,
    marginTop: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  button: {
    marginTop: spacing.xl,
  },
});
