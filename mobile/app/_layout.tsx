import { Stack } from 'expo-router';
import { MemberProvider } from '../context/MemberContext';

export default function RootLayout() {
  return (
    <MemberProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="meeting/new" />
        <Stack.Screen name="meeting/[id]" />
      </Stack>
    </MemberProvider>
  );
}
