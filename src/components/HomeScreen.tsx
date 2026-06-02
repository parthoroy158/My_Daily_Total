import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';

export default function HomeScreen() {
    const [entries, setEntries] = useState([]);

    const [name, setName] = useState('Partho');
    const [item, setItem] = useState('');
    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // FETCH DATA
    const fetchEntries = async () => {
        setFetching(true);

        try {
            const res = await fetch(
                'https://daily-total.vercel.app/api/data'
            );

            const result = await res.json();

            setEntries(
                Array.isArray(result)
                    ? result.reverse()
                    : []
            );
        } catch (error) {
            console.log('Fetch Error:', error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    // ADD ENTRY
    const addEntry = async () => {
        if (!name || !item || !date || !amount) {
            alert('Fill all fields');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                'https://daily-total.vercel.app/api/data',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({
                        name,
                        item,
                        date,
                        amount: parseFloat(amount),
                    }),
                }
            );

            const result = await res.json();

            console.log(result);

            // INSTANT UPDATE
            setEntries((prev) => [
                {
                    name,
                    item,
                    date,
                    amount,
                },
                ...prev,
            ]);

            // CLEAR INPUTS
            setItem('');
            setDate('');
            setAmount('');

            alert('Entry Added Successfully');
        } catch (error) {
            console.log('POST Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // TOTALS
    const totalAmount = entries.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
    );

    const parthoTotal = entries
        .filter(
            (e) =>
                e.name?.toLowerCase() === 'partho'
        )
        .reduce(
            (sum, e) =>
                sum + (Number(e.amount) || 0),
            0
        );

    const maityTotal = entries
        .filter(
            (e) =>
                e.name?.toLowerCase() === 'maity'
        )
        .reduce(
            (sum, e) =>
                sum + (Number(e.amount) || 0),
            0
        );

    const rudroTotal = entries
        .filter(
            (e) =>
                e.name?.toLowerCase() === 'rudro'
        )
        .reduce(
            (sum, e) =>
                sum + (Number(e.amount) || 0),
            0
        );

    // DATE FORMAT
    const formatDate = (dateString) => {
        if (!dateString) return '';

        const d = new Date(dateString);

        return `${d.toLocaleDateString()} (${d.toLocaleDateString(
            'en-US',
            {
                weekday: 'long',
            }
        )})`;
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* HEADER */}
                <Text style={styles.title}>
                    Daily Total
                </Text>

                <Text style={styles.subtitle}>
                    Powered by Partho
                </Text>

                {/* FORM */}
                <View style={styles.formCard}>
                    <TextInput
                        placeholder="Name"
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        placeholder="Item Purchased"
                        style={styles.input}
                        value={item}
                        onChangeText={setItem}
                    />

                    <TextInput
                        placeholder="YYYY-MM-DD"
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                    />

                    <TextInput
                        placeholder="Amount"
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={addEntry}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading
                                ? 'Saving...'
                                : 'Add Entry'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* LIST */}
                {fetching ? (
                    <ActivityIndicator
                        size="large"
                        color="#2563eb"
                        style={{ marginTop: 40 }}
                    />
                ) : (
                    <FlatList
                        data={entries}
                        keyExtractor={(item, index) =>
                            index.toString()
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingBottom: 220,
                        }}
                        renderItem={({ item, index }) => (
                            <View style={styles.card}>
                                <View style={styles.row}>
                                    <Text style={styles.index}>
                                        #{index + 1}
                                    </Text>

                                    <Text style={styles.amount}>
                                        ₹{item.amount}
                                    </Text>
                                </View>

                                <Text style={styles.name}>
                                    {item.name}
                                </Text>

                                <Text style={styles.item}>
                                    {item.item}
                                </Text>

                                <Text style={styles.date}>
                                    {formatDate(item.date)}
                                </Text>
                            </View>
                        )}
                    />
                )}

                {/* TOTALS */}
                <View style={styles.totalBox}>
                    <Text style={styles.totalBlue}>
                        Partho: ₹{parthoTotal}
                    </Text>

                    <Text style={styles.totalLight}>
                        Maity: ₹{maityTotal}
                    </Text>

                    <Text style={styles.totalPink}>
                        Rudro: ₹{rudroTotal}
                    </Text>

                    <Text style={styles.totalPurple}>
                        Grand: ₹{totalAmount}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        padding: 16,
    },

    title: {
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2563eb',
        marginTop: 20,
    },

    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
        fontStyle: 'italic',
    },

    formCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        elevation: 4,
    },

    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 50,
        marginBottom: 12,
    },

    button: {
        backgroundColor: '#2563eb',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },

    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },

    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 18,
        marginBottom: 14,
        elevation: 3,
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    index: {
        fontSize: 14,
        color: '#666',
    },

    amount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#16a34a',
    },

    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#111827',
    },

    item: {
        fontSize: 16,
        color: '#374151',
        marginTop: 4,
    },

    date: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 6,
    },

    totalBox: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        elevation: 5,
        marginTop: 10,
    },

    totalBlue: {
        color: '#2563eb',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },

    totalLight: {
        color: '#60a5fa',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },

    totalPink: {
        color: '#d946ef',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },

    totalPurple: {
        color: '#7e22ce',
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: 4,
    },
});