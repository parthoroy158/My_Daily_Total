import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />

      <Stack.Screen
        name="signUp"
        options={{
          headerShown: true,
          title: 'Sign Up',
          headerStyle: {
            backgroundColor: '#0a0a0a',
          },
          headerTintColor: 'rgb(231, 226, 226)',
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#eee',
          },
        }}
      />
    </Stack>
  );
}