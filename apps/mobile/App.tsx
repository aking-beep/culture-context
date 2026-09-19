import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { categoryLabels, cultureTokens, ruleLabels, sourceClassLabels } from '@culture-context/ui';
import type { BriefResponse } from '@culture-context/domain';
import { createMobileClient } from './src/api';
import WORLD from './src/world-countries.json';

type Country = { iso2: string; slug: string; name: string; capital: string };
const COUNTRIES = WORLD as Country[];
const POPULAR = ['JP', 'IT', 'ES', 'MX', 'TH', 'US', 'FR', 'AE'];

function findCountry(query: string): Country[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return COUNTRIES.filter((country) => POPULAR.includes(country.iso2));
  return COUNTRIES.filter((country) => (
    country.name.toLowerCase().includes(needle) || country.iso2.toLowerCase() === needle
  )).slice(0, 8);
}

export default function App() {
  const [homeQuery, setHomeQuery] = useState('United States');
  const [destQuery, setDestQuery] = useState('');
  const [home, setHome] = useState<Country>(COUNTRIES.find((country) => country.iso2 === 'US') ?? COUNTRIES[0]!);
  const [destination, setDestination] = useState<Country>(COUNTRIES.find((country) => country.iso2 === 'JP') ?? COUNTRIES[0]!);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<BriefResponse | null>(null);
  const client = useMemo(() => createMobileClient(), []);
  const homes = findCountry(homeQuery);
  const dests = findCountry(destQuery);

  async function load() {
    setPending(true);
    setError(null);
    try {
      const result = await client.brief({
        nationality: home.iso2,
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
        <Text style={styles.title}>Trip notes</Text>
        <Text style={styles.lede}>Type any country. Official notes only. Missing sources stay missing.</Text>
        <Text style={styles.label}>Passport country</Text>
        <TextInput value={homeQuery} onChangeText={setHomeQuery} style={styles.input} placeholder="Nigeria, India, Brazil…" />
        <View style={styles.row}>
          {homes.map((item) => (
            <Pressable key={item.iso2} onPress={() => { setHome(item); setHomeQuery(item.name); }} style={[styles.chip, home.iso2 === item.iso2 && styles.chipOn]}>
              <Text style={[styles.chipText, home.iso2 === item.iso2 && styles.chipTextOn]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Going to</Text>
        <TextInput value={destQuery} onChangeText={setDestQuery} style={styles.input} placeholder="Italy, Japan, Mexico…" />
        <View style={styles.row}>
          {dests.map((item) => (
            <Pressable key={`d-${item.iso2}`} onPress={() => { setDestination(item); setDestQuery(item.name); }} style={[styles.chip, destination.iso2 === item.iso2 && styles.chipOn]}>
              <Text style={[styles.chipText, destination.iso2 === item.iso2 && styles.chipTextOn]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => void load()} style={styles.submit}>
          <Text style={styles.submitText}>{pending ? 'Looking up notes…' : `Show notes for ${destination.name}`}</Text>
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
  label: { fontWeight: '800', color: cultureTokens.ink, marginTop: 8 },
  input: { borderWidth: 1, borderColor: cultureTokens.line, borderRadius: 12, padding: 12, backgroundColor: cultureTokens.panel, minHeight: 48 },
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
