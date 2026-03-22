import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function TrainerDietEditorScreen({ navigation, route }: any) {
  const [loading, setLoading] = useState(false);
  
  // Verifica se veio uma dieta para EDITAR pela navegação
  const existingDiet = route.params?.diet;
  const [dietId, setDietId] = useState<string | null>(null);
  
  const [dietName, setDietName] = useState('');
  const [macros, setMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' });

  const [meals, setMeals] = useState<any[]>([
    { 
      id: Math.random().toString(), 
      name: 'Café da Manhã', 
      time: '07:00', 
      obs: '',
      option1: [{ id: Math.random().toString(), qty: '', name: '' }], 
      option2: [{ id: Math.random().toString(), qty: '', name: '' }] 
    }
  ]);

  // --- CARREGA OS DADOS SE FOR MODO DE EDIÇÃO ---
  useEffect(() => {
    if (existingDiet) {
      setDietId(existingDiet.id);
      setDietName(existingDiet.name || '');
      
      if (existingDiet.macros) {
        setMacros({
          calories: existingDiet.macros.calories?.toString() || '',
          protein: existingDiet.macros.protein?.toString() || '',
          carbs: existingDiet.macros.carbs?.toString() || '',
          fat: existingDiet.macros.fat?.toString() || ''
        });
      }

      if (existingDiet.meals && existingDiet.meals.length > 0) {
        setMeals(existingDiet.meals);
      }
    }
  }, [existingDiet]);

  const addMeal = () => {
    setMeals([...meals, { 
      id: Math.random().toString(), name: '', time: '', obs: '',
      option1: [{ id: Math.random().toString(), qty: '', name: '' }], 
      option2: [{ id: Math.random().toString(), qty: '', name: '' }] 
    }]);
  };

  const removeMeal = (id: string) => setMeals(meals.filter(m => m.id !== id));

  const updateMealField = (id: string, field: string, value: string) => {
    setMeals(meals.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addFood = (mealId: string, option: 'option1' | 'option2') => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        return { ...m, [option]: [...(m[option] || []), { id: Math.random().toString(), qty: '', name: '' }] };
      }
      return m;
    }));
  };

  const removeFood = (mealId: string, option: 'option1' | 'option2', foodId: string) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        return { ...m, [option]: m[option].filter((f: any) => f.id !== foodId) };
      }
      return m;
    }));
  };

  const updateFood = (mealId: string, option: 'option1' | 'option2', foodId: string, field: 'qty' | 'name', value: string) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const updatedFoods = m[option].map((f: any) => f.id === foodId ? { ...f, [field]: value } : f);
        return { ...m, [option]: updatedFoods };
      }
      return m;
    }));
  };

  // --- SALVAR OU ATUALIZAR ---
  const handleSaveDiet = async () => {
    if (!dietName.trim()) return Alert.alert("Atenção", "Dê um nome para a dieta!");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const dietData = {
        trainer_id: user.id,
        name: dietName,
        macros: {
          calories: parseInt(macros.calories) || 0,
          protein: parseInt(macros.protein) || 0,
          carbs: parseInt(macros.carbs) || 0,
          fat: parseInt(macros.fat) || 0
        },
        meals: meals 
      };

      if (dietId) {
        // MODO ATUALIZAR (UPDATE)
        const { error } = await supabase.from('diet_templates').update(dietData).eq('id', dietId);
        if (error) throw error;
        Alert.alert("Sucesso! 🥦", "Dieta atualizada com sucesso!");
      } else {
        // MODO CRIAR NOVA (INSERT)
        const { error } = await supabase.from('diet_templates').insert(dietData);
        if (error) throw error;
        Alert.alert("Sucesso! 🥦", "Nova dieta salva na sua biblioteca!");
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Erro ao salvar", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dietId ? 'EDITAR DIETA' : 'MONTAR DIETA'}</Text>
        <TouchableOpacity onPress={handleSaveDiet} disabled={loading}>
          {loading ? <ActivityIndicator color="#10b981" /> : <Ionicons name="save" size={24} color="#10b981" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.label}>NOME DO PLANO ALIMENTAR</Text>
          <TextInput style={styles.input} placeholder="Ex: Seca Caverna 2000kcal" placeholderTextColor="#52525b" value={dietName} onChangeText={setDietName} />
        </View>

        <Text style={styles.sectionTitle}>METAS DIÁRIAS (MACROS)</Text>
        <View style={styles.macrosGrid}>
          <View style={styles.macroInputBox}>
            <Text style={styles.macroLabel}>Kcal</Text>
            <TextInput style={styles.macroInput} keyboardType="numeric" value={macros.calories} onChangeText={t => setMacros({...macros, calories: t})} placeholder="0" placeholderTextColor="#52525b" />
          </View>
          <View style={styles.macroInputBox}>
            <Text style={[styles.macroLabel, {color: '#3b82f6'}]}>Prot (g)</Text>
            <TextInput style={styles.macroInput} keyboardType="numeric" value={macros.protein} onChangeText={t => setMacros({...macros, protein: t})} placeholder="0" placeholderTextColor="#52525b" />
          </View>
          <View style={styles.macroInputBox}>
            <Text style={[styles.macroLabel, {color: '#10b981'}]}>Carb (g)</Text>
            <TextInput style={styles.macroInput} keyboardType="numeric" value={macros.carbs} onChangeText={t => setMacros({...macros, carbs: t})} placeholder="0" placeholderTextColor="#52525b" />
          </View>
          <View style={styles.macroInputBox}>
            <Text style={[styles.macroLabel, {color: '#f59e0b'}]}>Gord (g)</Text>
            <TextInput style={styles.macroInput} keyboardType="numeric" value={macros.fat} onChangeText={t => setMacros({...macros, fat: t})} placeholder="0" placeholderTextColor="#52525b" />
          </View>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 20}]}>REFEIÇÕES</Text>
        
        {meals.map((meal, index) => (
          <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealCounter}>Refeição {index + 1}</Text>
              <TouchableOpacity onPress={() => removeMeal(meal.id)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
              <View style={{flex: 2}}>
                <Text style={styles.label}>NOME DA REFEIÇÃO</Text>
                <TextInput style={styles.input} placeholder="Ex: Almoço" placeholderTextColor="#52525b" value={meal.name} onChangeText={t => updateMealField(meal.id, 'name', t)} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>HORÁRIO</Text>
                <TextInput style={styles.input} placeholder="12:30" placeholderTextColor="#52525b" value={meal.time} onChangeText={t => updateMealField(meal.id, 'time', t)} />
              </View>
            </View>

            {/* OPÇÃO 1 */}
            <View style={styles.optionBox}>
              <Text style={styles.optionTitle}>Opção Principal (Opção 1)</Text>
              {(meal.option1 || []).map((food: any) => (
                <View key={food.id} style={styles.foodRow}>
                  <TextInput style={[styles.inputFood, {flex: 1}]} placeholder="150g" placeholderTextColor="#52525b" value={food.qty} onChangeText={t => updateFood(meal.id, 'option1', food.id, 'qty', t)} />
                  <TextInput style={[styles.inputFood, {flex: 3}]} placeholder="Frango grelhado" placeholderTextColor="#52525b" value={food.name} onChangeText={t => updateFood(meal.id, 'option1', food.id, 'name', t)} />
                  <TouchableOpacity onPress={() => removeFood(meal.id, 'option1', food.id)} style={{padding: 5}}>
                    <Ionicons name="close" size={20} color="#71717a" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addFoodBtn} onPress={() => addFood(meal.id, 'option1')}>
                <Text style={styles.addFoodText}>+ Adicionar Alimento</Text>
              </TouchableOpacity>
            </View>

            {/* OPÇÃO 2 */}
            <View style={styles.optionBox}>
              <Text style={styles.optionTitle}>Substituição (Opção 2)</Text>
              {(meal.option2 || []).map((food: any) => (
                <View key={food.id} style={styles.foodRow}>
                  <TextInput style={[styles.inputFood, {flex: 1}]} placeholder="100g" placeholderTextColor="#52525b" value={food.qty} onChangeText={t => updateFood(meal.id, 'option2', food.id, 'qty', t)} />
                  <TextInput style={[styles.inputFood, {flex: 3}]} placeholder="Carne Moída" placeholderTextColor="#52525b" value={food.name} onChangeText={t => updateFood(meal.id, 'option2', food.id, 'name', t)} />
                  <TouchableOpacity onPress={() => removeFood(meal.id, 'option2', food.id)} style={{padding: 5}}>
                    <Ionicons name="close" size={20} color="#71717a" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addFoodBtn} onPress={() => addFood(meal.id, 'option2')}>
                <Text style={styles.addFoodText}>+ Adicionar Alimento</Text>
              </TouchableOpacity>
            </View>

            {/* OBSERVAÇÕES */}
            <Text style={styles.label}>OBSERVAÇÕES (Opcional)</Text>
            <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline placeholder="Ex: Preparar com azeite extra virgem." placeholderTextColor="#52525b" value={meal.obs} onChangeText={t => updateMealField(meal.id, 'obs', t)} />

          </View>
        ))}

        <TouchableOpacity style={styles.addMealBtn} onPress={addMeal}>
          <Ionicons name="add-circle" size={24} color="#10b981" />
          <Text style={styles.addMealText}>NOVA REFEIÇÃO</Text>
        </TouchableOpacity>

        <View style={{height: 50}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#18181b', backgroundColor: '#09090b' },
  backBtn: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  content: { padding: 20 },
  section: { marginBottom: 25 },
  label: { color: '#a1a1aa', fontSize: 10, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#18181b', color: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', fontSize: 14 },
  sectionTitle: { color: '#52525b', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  
  macrosGrid: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  macroInputBox: { flex: 1, backgroundColor: '#18181b', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', alignItems: 'center' },
  macroLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  macroInput: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', width: '100%' },

  mealCard: { backgroundColor: '#09090b', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#27272a' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#27272a', paddingBottom: 10 },
  mealCounter: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  
  optionBox: { backgroundColor: '#18181b', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#27272a' },
  optionTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputFood: { backgroundColor: '#000', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#27272a', fontSize: 14 },
  addFoodBtn: { marginTop: 5, padding: 8 },
  addFoodText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 },
  
  addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#10b981', borderStyle: 'dashed' },
  addMealText: { color: '#10b981', fontWeight: 'bold', marginLeft: 10 }
});