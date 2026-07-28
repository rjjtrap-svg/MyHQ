import { Alert, Platform } from 'react-native';

/**
 * Dialogs that actually appear on the web.
 *
 * `Alert.alert` is a no-op on React Native Web — it renders nothing and resolves nothing.
 * That is invisible in development on a simulator and catastrophic in this app, which
 * ships primarily as a PWA: any action gated behind an Alert confirmation simply never
 * happened. Sign Out was dead on the website for exactly this reason. The button worked
 * fine; it was waiting on a confirmation dialog that could not exist.
 *
 * Informational alerts fail more quietly but no less completely — an error message nobody
 * can see is the same as no error handling at all.
 */

/** Ask before doing something destructive. Resolves true when the user confirms. */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = 'OK'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    // window.confirm is synchronous and blocking, which is exactly the semantics the
    // native Alert callback gives us.
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Tell the user something. No decision, no return value. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
