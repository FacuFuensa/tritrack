import React from 'react';
import { Tabs } from 'expo-router';
import { Sun, CalendarDays, Flag, Trophy } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Platform } from 'react-native';
export default function TabLayout() {
  return <Tabs initialRouteName="hoy/index" screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.accent, tabBarInactiveTintColor: Colors.textTertiary, tabBarStyle: { backgroundColor: Colors.tabBar, borderTopColor: Colors.tabBarBorder, borderTopWidth: 1, ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8 } : {}) }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
    <Tabs.Screen name="hoy/index" options={{ title: 'Hoy', tabBarIcon: ({ color, size }) => <Sun color={color} size={size} /> }} />
    <Tabs.Screen name="semana/index" options={{ title: 'Semana', tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }} />
    <Tabs.Screen name="carreras/index" options={{ title: 'Carreras', tabBarIcon: ({ color, size }) => <Flag color={color} size={size} /> }} />
    <Tabs.Screen name="trofeos/index" options={{ title: 'Trofeos', tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} />
    <Tabs.Screen name="(home)" options={{ href: null }} />
    <Tabs.Screen name="history" options={{ href: null }} />
    <Tabs.Screen name="profile" options={{ href: null }} />
    <Tabs.Screen name="settings" options={{ href: null }} />
  </Tabs>;
}
