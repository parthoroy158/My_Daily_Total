import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView,
    Image,
    ActivityIndicator,
} from 'react-native';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const COLORS = {
    bg: '#0A0A0F',
    surface: '#111118',
    border: '#252535',
    accent: '#6C63FF',
    white: '#F0EFFF',
    muted: '#8A8AAA',
    success: '#22C55E',
    error: '#EF4444',
};

// ─── Home Screen (shown after successful login) ───────────────────────────────
function HomeScreen({ user, onSignOut }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                {/* Header */}
                <View style={homeStyles.header}>
                    <Text style={styles.logo}>💰</Text>
                    <Text style={styles.title}>Daily Total</Text>
                    <Text style={styles.subtitle}>Your expense dashboard</Text>
                </View>

                {/* User Profile Card */}
                <View style={homeStyles.profileCard}>
                    {user.picture ? (
                        <Image
                            source={{ uri: user.picture }}
                            style={homeStyles.avatar}
                        />
                    ) : (
                        <View style={homeStyles.avatarFallback}>
                            <Text style={homeStyles.avatarInitial}>
                                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </Text>
                        </View>
                    )}
                    <View style={homeStyles.profileInfo}>
                        <Text style={homeStyles.userName}>{user.name}</Text>
                        <Text style={homeStyles.userEmail}>{user.email}</Text>
                        {user.verified_email && (
                            <View style={homeStyles.verifiedBadge}>
                                <Text style={homeStyles.verifiedText}>✓ Verified</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Quick Stats (placeholder) */}
                <View style={homeStyles.statsRow}>
                    <View style={homeStyles.statBox}>
                        <Text style={homeStyles.statValue}>₹0</Text>
                        <Text style={homeStyles.statLabel}>Today</Text>
                    </View>
                    <View style={[homeStyles.statBox, homeStyles.statBoxMiddle]}>
                        <Text style={homeStyles.statValue}>₹0</Text>
                        <Text style={homeStyles.statLabel}>This Week</Text>
                    </View>
                    <View style={homeStyles.statBox}>
                        <Text style={homeStyles.statValue}>₹0</Text>
                        <Text style={homeStyles.statLabel}>This Month</Text>
                    </View>
                </View>

                {/* Sign Out */}
                <TouchableOpacity style={homeStyles.signOutButton} onPress={onSignOut}>
                    <Text style={homeStyles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null); // null = not logged in

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: 'YOUR_EXPO_CLIENT_ID',
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        webClientId: 'YOUR_WEB_CLIENT_ID',
    });

    // Handle Google OAuth response
    useEffect(() => {
        if (response?.type === 'success') {
            const token = response.authentication?.accessToken;
            if (token) {
                fetchGoogleUser(token);
            }
        } else if (response?.type === 'error') {
            Alert.alert('Google Sign-In Failed', response.error?.message ?? 'Unknown error');
        } else if (response?.type === 'dismiss') {
            // User cancelled — do nothing
        }
    }, [response]);

    const fetchGoogleUser = async (token) => {
        setLoading(true);
        try {
            const res = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`
            );

            if (!res.ok) {
                throw new Error(`Failed to fetch user info: ${res.status}`);
            }

            const userData = await res.json();
            console.log('Google User:', userData);
            setUser(userData); // Navigate to home screen
        } catch (err) {
            console.error('Google User Fetch Error:', err);
            Alert.alert('Error', 'Could not retrieve your Google profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // TODO: Connect to your auth backend (e.g. Firebase, Supabase)
        // Example: signInWithEmailAndPassword(auth, email, password)
        Alert.alert('Login', `Logging in as ${email}`);
    };

    const handleSignOut = () => {
        setUser(null);
        setEmail('');
        setPassword('');
    };

    // If logged in, show home screen
    if (user) {
        return <HomeScreen user={user} onSignOut={handleSignOut} />;
    }

    // Otherwise show login
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.logo}>💰</Text>
                <Text style={styles.title}>Daily Total</Text>
                <Text style={styles.subtitle}>Track your expenses easily</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.muted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                >
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={loginStyles.divider}>
                    <View style={loginStyles.dividerLine} />
                    <Text style={loginStyles.dividerText}>or</Text>
                    <View style={loginStyles.dividerLine} />
                </View>

                {/* Google Sign-In Button */}
                <TouchableOpacity
                    style={[
                        styles.googleButton,
                        (!request || loading) && loginStyles.buttonDisabled,
                    ]}
                    onPress={() => promptAsync()}
                    disabled={!request || loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#4285F4" size="small" />
                    ) : (
                        <>
                            {/* Google "G" SVG-style icon via styled text */}
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.googleText}>Continue with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7}>
                    <Link href="/signUp">
                        <Text style={styles.signupText}>
                            Don't have an account? Sign Up
                        </Text>
                    </Link>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    logo: {
        fontSize: 60,
        textAlign: 'center',
        marginBottom: 10,
    },
    title: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        color: COLORS.muted,
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 25,
    },
    input: {
        backgroundColor: '#1A1A24',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        height: 55,
        paddingHorizontal: 16,
        color: COLORS.white,
        marginBottom: 15,
    },
    loginButton: {
        backgroundColor: COLORS.accent,
        height: 55,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    loginText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        height: 55,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    googleIcon: {
        color: '#4285F4',
        fontSize: 22,
        fontWeight: 'bold',
        marginRight: 10,
    },
    googleText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    signupText: {
        color: COLORS.accent,
        textAlign: 'center',
        marginTop: 20,
        fontWeight: '600',
    },
});

const loginStyles = StyleSheet.create({
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.muted,
        marginHorizontal: 12,
        fontSize: 13,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

const homeStyles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A24',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 14,
    },
    avatarFallback: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
    userEmail: {
        color: COLORS.muted,
        fontSize: 13,
        marginTop: 2,
    },
    verifiedBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#16391F',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginTop: 6,
    },
    verifiedText: {
        color: COLORS.success,
        fontSize: 11,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 10,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#1A1A24',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statBoxMiddle: {
        borderColor: COLORS.accent,
    },
    statValue: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        color: COLORS.muted,
        fontSize: 11,
        marginTop: 4,
    },
    signOutButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signOutText: {
        color: COLORS.muted,
        fontSize: 15,
        fontWeight: '600',
    },
});