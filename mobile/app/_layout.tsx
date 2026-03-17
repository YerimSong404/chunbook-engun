import { Stack } from 'expo-router';
import { MemberProvider } from '../context/MemberContext';
import { AlertProvider } from '../context/AlertContext';

export default function RootLayout() {
  return (
    <MemberProvider>
      <AlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mypage" />
        <Stack.Screen name="member/[id]" />
        <Stack.Screen name="meeting/new" />
        <Stack.Screen name="meeting/[id]" />
      </Stack>
      </AlertProvider>
    </MemberProvider>
  );
}
