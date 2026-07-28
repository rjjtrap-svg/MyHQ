import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/src/theme';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  testID?: string;
};

/** Canonical page canvas: safe area, responsive measure, gutters, and scroll rhythm. */
export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  contentStyle,
  testID,
}: ScreenProps) {
  const { width } = useWindowDimensions();
  const content = (
    <View style={[styles.content, width >= 768 && styles.contentWide, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges} testID={testID}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenGutter,
    paddingBottom: spacing.xxxl,
  },
  contentWide: {
    paddingHorizontal: layout.screenGutterWide,
  },
});
