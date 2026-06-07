
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';

const COLORS = {
    bg: '#09090B',
    surface: '#18181B',
    border: '#27272A',
    accent: '#7C3AED',
    white: '#FFFFFF',
    muted: '#A1A1AA',
};

export default function SignUpScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignUp = () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        Alert.alert('Success', 'Account created successfully');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        Smart Expense Tracking
                    </Text>
                </View>

                <Text style={styles.logo}>💰</Text>

                <Text style={styles.title}>
                    Create Account
                </Text>

                <Text style={styles.subtitle}>
                    Start tracking your expenses and savings today
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={COLORS.muted}
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
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

                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={COLORS.muted}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSignUp}
                >
                    <Text style={styles.primaryButtonText}>
                        Create Account
                    </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.line} />
                </View>

                <TouchableOpacity style={styles.googleButton}>
                    <Text style={styles.googleText}>
                        Continue with Google
                    </Text>
                </TouchableOpacity>

                <Text style={styles.terms}>
                    By creating an account, you agree to our
                    Terms of Service and Privacy Policy.
                </Text>

                <TouchableOpacity>
                    <Link href="/profile">
                        <Text style={styles.loginText}>
                            Already have an account? Log In
                        </Text>
                    </Link>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        padding: 20,
    },

    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    badge: {
        alignSelf: 'center',
        backgroundColor: '#2E1065',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 18,
    },

    badgeText: {
        color: '#C4B5FD',
        fontWeight: '600',
        fontSize: 12,
    },

    logo: {
        fontSize: 60,
        textAlign: 'center',
    },

    title: {
        color: COLORS.white,
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 10,
    },

    subtitle: {
        color: COLORS.muted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 25,
    },

    input: {
        backgroundColor: '#27272A',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        height: 55,
        paddingHorizontal: 16,
        color: COLORS.white,
        marginBottom: 14,
    },

    primaryButton: {
        backgroundColor: COLORS.accent,
        height: 55,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },

    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
    },

    line: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },

    orText: {
        color: COLORS.muted,
        marginHorizontal: 12,
        fontSize: 12,
    },

    googleButton: {
        backgroundColor: '#FFFFFF',
        height: 55,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    googleText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 15,
    },

    terms: {
        color: COLORS.muted,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 18,
        lineHeight: 18,
    },

    loginText: {
        color: COLORS.accent,
        textAlign: 'center',
        marginTop: 18,
        fontWeight: '700',
    },
});

