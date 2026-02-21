import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, TextInput, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function TrainerDietLibraryScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('diet_templates')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTemplates(data);
        setFilteredTemplates(data);
      }
    } catch (error) {
      console.log("Erro ao buscar dietas:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTemplates(); }, []));

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(
        templates.filter(t => t.name.toLowerCase().includes(text.toLowerCase()))
      );
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Excluir Dieta",
      `Tem certeza que deseja apagar "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase.from('diet_templates').delete().eq('id', id);
              if (error) throw error;
              fetchTemplates();
            } catch (error: any) {
              Alert.alert("Erro ao excluir", error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Biblioteca de Dietas</Text>
          
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('TrainerDietEditor')}>
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#71717a" style={{marginRight: 10}} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Buscar dieta..." 
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#10b981" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={60} color="#27272a" />
              <Text style={styles.emptyText}>
                {searchQuery ? "Nenhuma dieta encontrada." : "Sua biblioteca de nutrição está vazia."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mealsObj = item.meals || {};
            const activeMeals = Object.keys(mealsObj).filter(key => mealsObj[key].length > 0);

            return (
              <View style={styles.card}>
                <TouchableOpacity 
                  style={styles.cardInfo} 
                  onPress={() => navigation.navigate('TrainerDietEditor', { template: item })}
                >
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.badge}>
                      <Ionicons name="nutrition" size={12} color="#10b981" style={{marginRight: 4}} />
                      <Text style={styles.badgeText}>Nutrição</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                      <Text style={[styles.badgeText, { color: '#3b82f6' }]}>
                        {activeMeals.length} Refeições
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#09090b', borderBottomWidth: 1, borderColor: '#18181b' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#27272a' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  card: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272a', overflow: 'hidden' },
  cardInfo: { flex: 1, padding: 16 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { width: 60, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderColor: '#27272a' },
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { color: '#71717a', marginTop: 15, fontSize: 14 }
});