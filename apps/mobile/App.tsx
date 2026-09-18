import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { categoryLabels, cultureTokens, ruleLabels, sourceClassLabels } from '@culture-context/ui';
import type { BriefResponse } from '@culture-context/domain';
import { createMobileClient, defaultProfile } from './src/api';

const DESTINATIONS = [
  { iso2: 'JP', slug: 'japan', name: 'Japan' },
  { iso2: 'MX', slug: 'mexico', name: 'Mexico' },
  { iso2: 'FR', slug: 'france', name: 'France' },
  { iso2: 'TH', slug: 'thailand', name: 'Thailand' },
  { iso2: 'MA', slug: 'morocco', name: 'Morocco' },
] as const;

export default function App() {
  const [nationality, setNationality] = useState(defaultProfile.nationality);
  const [destination, setDestination] = useState<(typeof DESTINATIONS)[number]>(DESTINATIONS[0] ?? { iso2: 'JP', slug: 'japan', name: 'Japan' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const client = useMemo(() => createMobileClient(), []);

  async function load() {
    setPending(true);
    setError(null);
    try {
      const result = await client.brief({
        nationality,
        destination_country: destination.iso2,
        destination_slug: destination.slug,
        purpose: 'tourism',
        activities: ['driving', 'filming'],
      });
      setBrief(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brief failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.shell}>
        <Text style={styles.kicker}>CULTURE CONTEXT</Text>
        <Text style={styles.title}>Sourced brief</Text>
        <Text style={styles.lede}>Advisories stay advisories. Missing sources stay missing.</Text>
        <TextInput value={nationality} onChangeText={(value) => setNationality(value.toUpperCase())} maxLength={2} style={styles.input} />
        <View style={styles.row}>
          {DESTINATIONS.map((item) => (
            <Pressable key={item.slug} onPress={() => setDestination(item)} style={[styles.chip, destination.slug === item.slug && styles.chipOn]}>
              <Text style={[styles.chipText, destination.slug === item.slug && styles.chipTextOn]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => void load()} style={styles.submit}>
          <Text style={styles.submitText}>{pending ? 'Retrieving…' : 'Get sourced brief'}</Text>
        </Pressable>
        {error ? <Text style={styles.warn}>{error}</Text> : null}
        {brief?.disclaimer ? <Text style={styles.lede}>{brief.disclaimer}</Text> : null}
        {brief?.items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.pill}>{ruleLabels[item.kind]} · {categoryLabels[item.category] || item.category}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text>{item.summary}</Text>
            {item.sources.map((source) => (
              <Text key={source.id} style={styles.source}>
                {source.authority} · {sourceClassLabels[source.source_class]} · {source.url}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cultureTokens.paper },
  shell: { padding: 20, gap: 12 },
  kicker: { color: cultureTokens.accent, letterSpacing: 2, fontWeight: '800', fontSize: 12 },
  title: { fontSize: 34, fontWeight: '700', color: cultureTokens.ink },
  lede: { color: cultureTokens.muted, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: cultureTokens.line, borderRadius: 12, padding: 12, backgroundColor: cultureTokens.panel },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: cultureTokens.line, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: cultureTokens.panel },
  chipOn: { backgroundColor: cultureTokens.ink },
  chipText: { color: cultureTokens.ink, fontWeight: '700' },
  chipTextOn: { color: cultureTokens.panel },
  submit: { backgroundColor: cultureTokens.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
  warn: { color: cultureTokens.warn },
  card: { backgroundColor: cultureTokens.panel, borderColor: cultureTokens.line, borderWidth: 1, borderRadius: 18, padding: 14, gap: 8 },
  pill: { color: cultureTokens.accent, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  cardTitle: { fontSize: 20, fontWeight: '700' },
  source: { color: cultureTokens.muted, fontSize: 12 },
});
