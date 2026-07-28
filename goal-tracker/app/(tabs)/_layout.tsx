import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { colors, elevation, radius, typography } from '@/src/theme';

function TabIcon({ name, color, focused }: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWell, focused && styles.iconWellActive]}>
      <FontAwesome name={name} size={18} color={color} />
    </View>
  );
}

// Purely visual — the tab bar's own touchable handles the press (see the
// `add` screen's `tabPress` listener below). Nesting a second Pressable here
// caused the click to bubble into both handlers and race with the tab
// navigator's default action.
function AddTabButtonIcon() {
  return (
    <View style={styles.addButtonWrap} pointerEvents="none">
      <View style={styles.addButton}>
        <FontAwesome name="plus" size={26} color={colors.background} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);

  if (!firebaseUser || !profile) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* Order matters: three destinations either side of the centre Add button. */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarIcon: ({ color, focused }) => <TabIcon name="briefcase" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => <AddTabButtonIcon />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add-deal');
          },
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarIcon: ({ color, focused }) => <TabIcon name="users" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => <TabIcon name="graduation-cap" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabIcon name="gear" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    ...elevation.raised,
    backgroundColor: colors.surfaceElevated,
    borderTopColor: colors.borderSubtle,
    height: Platform.select({ ios: 92, default: 70 }),
    paddingTop: 7,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderLeftColor: colors.borderSubtle,
    borderRightColor: colors.borderSubtle,
  },
  // Seven destinations across a phone-width bar, so labels are set small and tight —
  // any larger and "Settings"/"Profile" start truncating on narrow devices.
  tabLabel: {
    ...typography.badge,
    fontSize: 8,
    letterSpacing: 0.35,
  },
  tabItem: {
    paddingHorizontal: 0,
  },
  addButtonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.raised,
    borderWidth: 3,
    borderColor: colors.background,
  },
  iconWell: {
    width: 34,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellActive: {
    backgroundColor: colors.surfaceRaised,
  },
});
