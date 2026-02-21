import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

type FoodItem = { name: string; amount: string; obs: string; };
type DietSplit = { [key: string]: FoodItem[]; };

export default function TrainerDietEditorScreen({ route, navigation }: any) {
  const editingTemplate = route.params?.template;

  const [dietName, setDietName] = useState(editingTemplate?.name || '');
  const [loading, setLoading] = useState(false);
  
  // Abas de Refeições
  const [selectedMeal, setSelectedMeal] = useState('Refeição 1');
  const mealsTabs = ['Refeição 1', 'Refeição 2', 'Refeição 3', 'Refeição 4', 'Refeição 5', 'Refeição 6'];
  
  // O Estado agora armazena as refeições
  const [meals, setMeals] = useState<DietSplit>(
    editingTemplate?.meals || { 
      'Refeição 1': [], 'Refeição 2': [], 'Refeição 3': [], 
      'Refeição 4': [], 'Refeição 5': [], 'Refeição 6': [] 
    }
  );

  // --- AÇÕES DA DIETA ---
  const addFood = () => {
    const newFood: FoodItem = { name: '', amount: '', obs: '' };
    setMeals(prev => ({
      ...prev,
      [selectedMeal]: [...prev[selectedMeal], newFood]
    }));
  };

  const removeFood = (index: number) => {
    const currentList = [...meals[selectedMeal]];
    currentList.splice(index, 1);
    setMeals(prev => ({ ...prev, [selectedMeal]: currentList }));
  };

  const updateFood = (index: number, field: keyof FoodItem, value: string) => {
    const currentList = [...meals[selectedMeal]];
    currentList[index] = { ...currentList[index], [field]: value };
    setMeals(prev => ({ ...prev, [selectedMeal]: currentList }));
  };

  const handleSave = async () => {
    if (!dietName) return Alert.alert("Erro", "Dê um nome à Dieta (Ex: Bulking 3000kcal).");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingTemplate?.id) {
        const { error } = await supabase.from('diet_templates')
          .update({ name: dietName, meals: meals })
          .eq('id', editingTemplate.id);
          
        if (error) throw error;
        Alert.alert("Sucesso! 🍏", "Dieta atualizada!");
      } else {
        const { error } = await supabase.from('diet_templates').insert({
          trainer_id: user?.id,
          name: dietName,
          meals: meals 
        });

        if (error) throw error;
        Alert.alert("Sucesso! 🍏", "Nova dieta salva na biblioteca!");
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Erro ao Salvar", error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentFoods = meals[selectedMeal] || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingTemplate ? 'Editar Dieta' : 'Nova Dieta'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading ? <ActivityIndicator color="#000" size="small"/> : <Text style={styles.saveText}>SALVAR</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <View style={styles.mainContent}>
          
          {/* NOME DA DIETA */}
          <TextInput 
            style={styles.nameInput} 
            placeholder="Nome do Plano (Ex: Seca Tudo 1800kcal)" 
            placeholderTextColor="#52525b"
            value={dietName}
            onChangeText={setDietName}
          />

          {/* ABAS (REFEIÇÕES) */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mealsTabs.map(tab => {
                const isActive = selectedMeal === tab;
                const hasFood = meals[tab]?.length > 0;
                return (
                  <TouchableOpacity 
                    key={tab} 
                    style={[styles.tab, isActive && styles.tabActive, hasFood && !isActive && styles.tabFilled]}
                    onPress={() => setSelectedMeal(tab)}
                  >
                    <Text style={[styles.tabText, isActive && {color:'#000'}, !isActive && {color:'#71717a'}]}>
                      {tab.toUpperCase()}
                    </Text>
                    {hasFood && <View style={styles.dot} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* LISTA DE ALIMENTOS DA REFEIÇÃO SELECIONADA */}
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {currentFoods.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#27272a" style={{marginBottom: 10}}/>
                <Text style={styles.emptyText}>Nenhum alimento na {selectedMeal}</Text>
              </View>
            ) : (
              currentFoods.map((food, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.itemNumber}>Item {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeFood(index)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 2 }]}>
                      <Text style={styles.label}>ALIMENTO</Text>
                      <TextInput 
                        style={styles.inputSmall} 
                        placeholder="Ex: Peito de Frango"
                        placeholderTextColor="#3f3f46"
                        value={food.name} 
                        onChangeText={(t) => updateFood(index, 'name', t)}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>QUANTIDADE</Text>
                      <TextInput 
                        style={styles.inputSmall} 
                        placeholder="Ex: 150g"
                        placeholderTextColor="#3f3f46"
                        value={food.amount} 
                        onChangeText={(t) => updateFood(index, 'amount', t)}
                      />
                    </View>
                  </View>
                  
                  <TextInput 
                    style={styles.obsInput} 
                    placeholder="Obs (Ex: Grelhado, sem óleo)"
                    placeholderTextColor="#3f3f46"
                    value={food.obs}
                    onChangeText={(t) => updateFood(index, 'obs', t)}
                  />
                </View>
              ))
            )}

            <TouchableOpacity style={styles.addBtn} onPress={addFood}>
              <Ionicons name="add" size={24} color="#10b981" />
              <Text style={styles.addText}>Adicionar Alimento</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#18181b' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  saveBtn: { backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 12 },

  mainContent: { padding: 20, flex: 1 },
  nameInput: { fontSize: 20, color: '#fff', fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#27272a', paddingBottom: 10, marginBottom: 20 },

  // TABS DE REFEIÇÃO
  tabsContainer: { flexDirection: 'row', marginBottom: 20 },
  tab: { paddingHorizontal: 15, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#18181b', marginRight: 10, borderWidth: 1, borderColor: '#27272a' },
  tabActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tabFilled: { borderColor: '#10b981' },
  tabText: { fontWeight: 'bold', fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', position: 'absolute', top: 5, right: 5 },

  // CARD DE ALIMENTO
  card: { backgroundColor: '#18181b', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemNumber: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputGroup: { flex: 1 },
  label: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  inputSmall: { backgroundColor: '#09090b', color: '#fff', borderRadius: 6, padding: 10, fontWeight: 'bold', borderWidth: 1, borderColor: '#27272a' },
  obsInput: { backgroundColor: '#09090b', color: '#a1a1aa', borderRadius: 6, padding: 10, fontSize: 12, fontStyle: 'italic', borderWidth: 1, borderColor: '#27272a' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderWidth: 1, borderColor: '#10b981', borderStyle: 'dashed', borderRadius: 12, marginTop: 10 },
  addText: { color: '#10b981', fontWeight: 'bold', marginLeft: 8 },
  
  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { color: '#71717a' },
});