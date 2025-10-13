import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useI18n } from '../../i18n';
import { searchAPI } from '../../services/api';

export default function SearchScreen({ navigation }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchAPI.similarQuizzes(query, 10);
      setResults(res?.data?.data?.quizzes || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('QuizDetail', { id: item._id })}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>{item.category} • {item.similarity ? `${(item.similarity*100).toFixed(0)}%` : ''}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('home:exploreQuizzes')}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder={t('home:exploreQuizzes')} value={query} onChangeText={setQuery} />
        <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
          <Text style={styles.searchText}>🔎</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={styles.subtitle}>{t('common:loading')}</Text>
      ) : (
        <FlatList data={results} keyExtractor={(i,idx)=>i?._id||String(idx)} renderItem={renderItem} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  text: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
});
