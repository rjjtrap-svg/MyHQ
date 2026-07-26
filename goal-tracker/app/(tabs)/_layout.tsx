import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/theme';

function TabIcon({ name, color }: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome name={name} size={19} color={color} />;
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarIcon: ({ color }) => <TabIcon name="briefcase" color={color} />,
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
          tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color }) => <TabIcon name="graduation-cap" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: Platform.select({ ios: 88, default: 64 }),
    paddingTop: 8,
  },
  // Seven destinations across a phone-width bar, so labels are set small and tight —
  // any larger and "Settings"/"Profile" start truncating on narrow devices.
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});
