import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  StatusBar, RefreshControl, Image, TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function TrainerStudentsScreen({ navigation }: any) {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('student_trainer')
      .select(`
        id, student_id, status, plan_name, nickname, restrictions, created_at,
        student:profiles!student_id (email, full_name, avatar_url)
      `)
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setStudents(data);
      setFilteredStudents(data);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchStudents(); }, []));

  // --- LÓGICA DE BUSCA ---
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(item => {
        const name = item.nickname || item.student?.full_name || '';
        const email = item.student?.email || '';
        return name.toLowerCase().includes(text.toLowerCase()) || 
               email.toLowerCase().includes(text.toLowerCase());
      });
      setFilteredStudents(filtered);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER FIXO */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Gerenciar Alunos</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('TrainerAddStudent')}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* BARRA DE BUSCA */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#71717a" style={{marginRight: 10}} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Buscar por nome ou email..." 
            placeholderTextColor="#71717a"
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* LISTAGEM */}
      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStudents} tintColor="#3b82f6"/>}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color="#27272a" />
            <Text style={styles.emptyText}>
              {searchText ? "Nenhum aluno encontrado na busca." : "Nenhum aluno vinculado ainda."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const student = item.student || {};
          const name = item.nickname || student.full_name || 'Aluno Sem Nome';
          const email = student.email;
          const hasRestriction = item.restrictions && item.restrictions.length > 0;
          const isActive = item.status === 'active';

          return (
            <TouchableOpacity 
              style={[styles.card, !isActive && styles.cardInactive]}
              // AQUI ESTÁ A MÁGICA: Navega levando o ID do aluno
              onPress={() => navigation.navigate('TrainerStudentDetail', { studentId: item.student_id })}
            >
              <View style={styles.cardHeader}>
                
                {/* AVATAR COM STATUS */}
                <View>
                  <View style={[styles.avatarContainer, !isActive && {borderColor: '#52525b'}]}>
                    {student.avatar_url ? (
                      <Image source={{ uri: student.avatar_url }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: isActive ? '#10b981' : '#71717a' }]} />
                </View>

                {/* INFO PRINCIPAL */}
                <View style={{flex: 1, marginLeft: 15}}>
                  <Text style={[styles.name, !isActive && {color: '#71717a'}]}>{name}</Text>
                  <Text style={styles.email}>{email}</Text>
                  
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8}}>
                    <View style={styles.planBadge}>
                      <Ionicons name="barbell" size={10} color="#3b82f6" style={{marginRight: 4}} />
                      <Text style={styles.planText}>{item.plan_name}</Text>
                    </View>
                    
                    {/* BADGE DE RESTRIÇÃO MÉDICA */}
                    {hasRestriction && (
                      <View style={styles.alertBadge}>
                        <Ionicons name="medkit" size={10} color="#ef4444" style={{marginRight: 4}} />
                        <Text style={styles.alertText}>ATENÇÃO</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#52525b" />
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // Header
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#09090b', borderBottomWidth: 1, borderColor: '#18181b' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 5 },
  
  // Busca
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#27272a' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  // Card
  card: { backgroundColor: '#18181b', borderRadius: 16, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#27272a' },
  cardInactive: { opacity: 0.6, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  
  // Avatar
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6' },
  avatarImage: { width: 46, height: 46, borderRadius: 23 },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statusDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#18181b' },

  // Textos
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#71717a', fontSize: 12, marginBottom: 2 },
  
  // Badges
  planBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  planText: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  alertText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { color: '#71717a', marginTop: 15, fontSize: 14 }
});