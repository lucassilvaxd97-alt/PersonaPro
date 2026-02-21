import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Modal, FlatList, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

type Exercise = { name: string; sets: string; reps: string; obs: string; };
type WorkoutSplit = { [key: string]: Exercise[]; };

export default function TemplateEditor({ route, navigation }: any) {
  const editingTemplate = route.params?.template;

  const [workoutName, setWorkoutName] = useState(editingTemplate?.name || '');
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('A');
  const tabs = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  const [splitWorkouts, setSplitWorkouts] = useState<WorkoutSplit>(
    editingTemplate?.exercises || { 'A': [], 'B': [], 'C': [], 'D': [], 'E': [], 'F': [] }
  );

  // --- BIBLIOTECA DE EXERCÍCIOS ---
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  useEffect(() => { fetchLibrary(); }, []);

  const fetchLibrary = async () => {
    try {
      const { data } = await supabase.from('workout_exercises_library').select('*').order('name');
      if (data) {
        setLibraryExercises(data);
        setFilteredExercises(data);
      }
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    let result = libraryExercises;
    if (selectedMuscle) result = result.filter(ex => ex.muscle_group === selectedMuscle);
    if (searchQuery) result = result.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredExercises(result);
  }, [searchQuery, selectedMuscle, libraryExercises]);

  // --- AÇÕES DO TREINO ---
  const addExerciseToCurrentTab = (exerciseFromDb: any) => {
    const newExercise: Exercise = { name: exerciseFromDb.name, sets: '4', reps: '10-12', obs: '' };
    setSplitWorkouts(prev => ({
      ...prev,
      [selectedTab]: [...prev[selectedTab], newExercise]
    }));
    setLibraryVisible(false);
    setSearchQuery('');
  };

  const removeExercise = (index: number) => {
    const currentList = [...splitWorkouts[selectedTab]];
    currentList.splice(index, 1);
    setSplitWorkouts(prev => ({ ...prev, [selectedTab]: currentList }));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const currentList = [...splitWorkouts[selectedTab]];
    currentList[index] = { ...currentList[index], [field]: value };
    setSplitWorkouts(prev => ({ ...prev, [selectedTab]: currentList }));
  };

  const handleSave = async () => {
    if (!workoutName) return Alert.alert("Erro", "Dê um nome ao Template.");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingTemplate?.id) {
        const { error } = await supabase.from('workout_templates')
          .update({ name: workoutName, exercises: splitWorkouts })
          .eq('id', editingTemplate.id);
          
        if (error) throw error;
        Alert.alert("Sucesso! 🦖", "Template atualizado!");
      } else {
        const { error } = await supabase.from('workout_templates').insert({
          trainer_id: user?.id,
          name: workoutName,
          category: 'Musculação',
          exercises: splitWorkouts 
        });

        if (error) throw error;
        Alert.alert("Sucesso! 🦖", "Novo template criado!");
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Erro ao Salvar", error.message);
    } finally {
      setLoading(false);
    }
  };

  const muscleGroups = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen'];
  const currentExercises = splitWorkouts[selectedTab] || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingTemplate ? 'Editar Template' : 'Novo Template'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading ? <ActivityIndicator color="#000" size="small"/> : <Text style={styles.saveText}>SALVAR</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <TextInput 
          style={styles.nameInput} 
          placeholder="Nome do Plano" 
          placeholderTextColor="#52525b"
          value={workoutName}
          onChangeText={setWorkoutName}
        />

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map(tab => {
              const isActive = selectedTab === tab;
              const hasExercises = splitWorkouts[tab]?.length > 0;
              return (
                <TouchableOpacity 
                  key={tab} 
                  style={[styles.tab, isActive && styles.tabActive, hasExercises && !isActive && styles.tabFilled]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text style={[styles.tabText, isActive && {color:'#000'}, !isActive && {color:'#71717a'}]}>
                    TREINO {tab}
                  </Text>
                  {hasExercises && <View style={styles.dot} />}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {currentExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum exercício no Treino {selectedTab}</Text>
            </View>
          ) : (
            currentExercises.map((ex, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.exName}>{index + 1}. {ex.name}</Text>
                  <TouchableOpacity onPress={() => removeExercise(index)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>SÉRIES</Text>
                    <TextInput 
                      style={styles.inputSmall} 
                      value={ex.sets} 
                      onChangeText={(t) => updateExercise(index, 'sets', t)}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>REPETIÇÕES</Text>
                    <TextInput 
                      style={styles.inputSmall} 
                      value={ex.reps} 
                      onChangeText={(t) => updateExercise(index, 'reps', t)}
                    />
                  </View>
                </View>
                <TextInput 
                  style={styles.obsInput} 
                  placeholder="Obs..."
                  placeholderTextColor="#3f3f46"
                  value={ex.obs}
                  onChangeText={(t) => updateExercise(index, 'obs', t)}
                />
              </View>
            ))
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => setLibraryVisible(true)}>
            <Ionicons name="add" size={24} color="#3b82f6" />
            <Text style={styles.addText}>Adicionar ao Treino {selectedTab}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* --- MODAL BIBLIOTECA --- */}
      <Modal visible={libraryVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalBg}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Biblioteca Fábrica</Text>
            <TouchableOpacity onPress={() => setLibraryVisible(false)}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#71717a" />
            <TextInput style={styles.searchInput} placeholder="Buscar..." placeholderTextColor="#71717a" value={searchQuery} onChangeText={setSearchQuery}/>
          </View>
          <View style={{height: 50}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, gap: 8}}>
              <TouchableOpacity onPress={() => setSelectedMuscle(null)} style={[styles.chip, !selectedMuscle && styles.chipActive]}><Text style={[styles.chipText, !selectedMuscle && {color:'#fff'}]}>Todos</Text></TouchableOpacity>
              {muscleGroups.map(m => (
                <TouchableOpacity key={m} onPress={() => setSelectedMuscle(m === selectedMuscle ? null : m)} style={[styles.chip, selectedMuscle === m && styles.chipActive]}><Text style={[styles.chipText, selectedMuscle === m && {color:'#fff'}]}>{m}</Text></TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <FlatList 
            data={filteredExercises}
            keyExtractor={item => item.id}
            contentContainerStyle={{padding: 20}}
            renderItem={({item}) => {
              // VERIFICAÇÃO MÁGICA: O exercício já está no dia atual?
              const isAdded = currentExercises.some(ex => ex.name === item.name);

              return (
                <TouchableOpacity 
                  style={[styles.libItem, isAdded && { opacity: 0.4 }]} // Fica transparente se já adicionou
                  onPress={() => !isAdded && addExerciseToCurrentTab(item)} // Só deixa clicar se não foi adicionado
                  disabled={isAdded} // Desativa o botão
                >
                  <Text style={styles.libName}>{item.name}</Text>
                  <Text style={styles.libGroup}>{item.muscle_group}</Text>
                  
                  {/* Troca o ícone baseado se já foi adicionado */}
                  {isAdded ? (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" style={{position:'absolute', right: 15}}/>
                  ) : (
                    <Ionicons name="add-circle" size={24} color="#3b82f6" style={{position:'absolute', right: 15}}/>
                  )}
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#18181b' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  saveBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  mainContent: { padding: 20, flex: 1 },
  nameInput: { fontSize: 20, color: '#fff', fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#27272a', paddingBottom: 10, marginBottom: 20 },
  tabsContainer: { flexDirection: 'row', marginBottom: 20 },
  tab: { width: 80, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#18181b', marginRight: 10, borderWidth: 1, borderColor: '#27272a' },
  tabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabFilled: { borderColor: '#3b82f6' },
  tabText: { fontWeight: 'bold', fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', position: 'absolute', top: 5, right: 5 },
  card: { backgroundColor: '#18181b', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  exName: { color: '#fff', fontWeight: 'bold', fontSize: 15, width: '90%' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputGroup: { flex: 1 },
  label: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  inputSmall: { backgroundColor: '#09090b', color: '#fff', borderRadius: 6, padding: 8, textAlign: 'center', fontWeight: 'bold', borderWidth: 1, borderColor: '#27272a' },
  obsInput: { backgroundColor: '#09090b', color: '#a1a1aa', borderRadius: 6, padding: 8, fontSize: 12, fontStyle: 'italic' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: '#3b82f6', borderStyle: 'dashed', borderRadius: 12, marginTop: 10 },
  addText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 8 },
  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { color: '#71717a' },
  modalBg: { flex: 1, backgroundColor: '#09090b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#27272a' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeText: { color: '#3b82f6', fontSize: 16 },
  searchBar: { flexDirection: 'row', backgroundColor: '#18181b', margin: 20, padding: 10, borderRadius: 8, alignItems: 'center' },
  searchInput: { color: '#fff', marginLeft: 10, flex: 1 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  chipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { color: '#71717a', fontSize: 12 },
  libItem: { padding: 15, borderBottomWidth: 1, borderColor: '#18181b', justifyContent: 'center' },
  libName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  libGroup: { color: '#71717a', fontSize: 12 }
});