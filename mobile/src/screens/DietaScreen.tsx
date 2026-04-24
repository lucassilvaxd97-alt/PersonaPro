import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from "react-native-gifted-charts";
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DietaScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'Refeicoes' | 'Resumo' | 'Compras'>('Refeicoes');
  
  // --- ESTADOS DO BACKEND ---
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [refeicoes, setRefeicoes] = useState<any[]>([]);
  const [metaDiaria, setMetaDiaria] = useState({ calorias: 0, proteina: 0, carbo: 0, gordura: 0 });
  const [xpRequestedToday, setXpRequestedToday] = useState(false);
  const [sendingXP, setSendingXP] = useState(false);
  
  // --- ESTADOS LOCAIS (Lista de Compras Automática) ---
  const [listaCompras, setListaCompras] = useState<any[]>([]);
  const [coposAgua, setCoposAgua] = useState(0);
  const META_AGUA = 12; 

  // --- 1. BUSCAR DIETA E MONTAR MERCADO ---
  const fetchDiet = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: linkData, error: linkErr } = await supabase
        .from('student_trainer')
        .select('trainer_id, diet_plan_name')
        .eq('student_id', user.id)
        .single();

      if (linkErr) throw new Error("Sem vínculo.");
      setTrainerId(linkData.trainer_id);

      const nomeDieta = linkData?.diet_plan_name || 'Dieta Padrão'; 

      const { data: dietData } = await supabase
        .from('diet_templates')
        .select('meals, macros')
        .eq('trainer_id', linkData.trainer_id)
        .eq('name', nomeDieta)
        .limit(1)
        .single();

      if (dietData) {
        if (dietData.macros) {
          setMetaDiaria({
            calorias: dietData.macros.calories || 0,
            proteina: dietData.macros.protein || 0,
            carbo: dietData.macros.carbs || 0,
            gordura: dietData.macros.fat || 0
          });
        }

        if (dietData.meals && Array.isArray(dietData.meals)) {
          let itensMercado = new Set<string>(); // Evita itens duplicados na lista de compras

          const formattedMeals = dietData.meals.map((meal: any) => {
            
            // Extrai os alimentos para a Lista de Compras
            meal.option1?.forEach((food: any) => { if(food.name) itensMercado.add(food.name.trim()) });
            meal.option2?.forEach((food: any) => { if(food.name) itensMercado.add(food.name.trim()) });

            return {
              id: meal.id || Math.random().toString(),
              nome: meal.name || 'Refeição',
              horario: meal.time || '00:00',
              obs: meal.obs || '',
              feito: false,
              opcaoEscolhida: 1,
              opcao1: meal.option1 || [],
              opcao2: meal.option2 || []
            };
          });

          setRefeicoes(formattedMeals);

          // Constrói a Lista de Compras visual a partir do Set
          const listaComprasAuto = Array.from(itensMercado).filter(Boolean).map((item, index) => ({
            id: `compra_${index}`,
            item: item,
            check: false
          }));
          setListaCompras(listaComprasAuto);
        }
      }

      // 2. Verifica XP de hoje
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('xp_logs')
        .select('id')
        .eq('student_id', user.id)
        .gte('created_at', `${today}T00:00:00Z`);

      if (logs && logs.length > 0) setXpRequestedToday(true);

    } catch (error: any) {
      console.log("Erro na dieta:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDiet(); }, []));

  // --- ACTIONS ---
  const toggleRefeicao = (id: string) => {
    setRefeicoes(prev => {
      const novaLista = prev.map(item => item.id === id ? { ...item, feito: !item.feito } : item);
      const todasFeitas = novaLista.length > 0 && novaLista.every(r => r.feito);
      
      if (todasFeitas && !xpRequestedToday && !sendingXP) {
        Alert.alert(
          "DIA 100% CONCLUÍDO! 🏆", 
          "Você seguiu a dieta à risca. Enviar seu progresso e ganhar +30 XP?",
          [{ text: "Ainda não", style: 'cancel' }, { text: "Enviar XP", onPress: processarXPDieta }]
        );
      }
      return novaLista;
    });
  };

  const processarXPDieta = async () => {
    setSendingXP(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('xp_logs').insert({
        student_id: user?.id, trainer_id: trainerId, amount: 30, status: 'pendente'
      });
      setXpRequestedToday(true);
      Alert.alert("Boa mutante! 🦍", "XP de Nutrição enviado para aprovação do professor.");
    } catch (error) { Alert.alert("Erro", "Falha ao enviar XP."); } 
    finally { setSendingXP(false); }
  };

  const mudarOpcao = (id: string, opcao: 1 | 2) => setRefeicoes(prev => prev.map(item => item.id === id ? { ...item, opcaoEscolhida: opcao } : item));
  const toggleCompra = (id: string) => setListaCompras(prev => prev.map(item => item.id === id ? { ...item, check: !item.check } : item));
  const addAgua = () => setCoposAgua(prev => prev + 1);
  const resetAgua = () => setCoposAgua(0);

  const barData = [
    { value: metaDiaria.proteina || 1, label: 'Prot', frontColor: '#3b82f6', topLabelComponent: () => <Text style={{color: '#3b82f6', fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>{metaDiaria.proteina}g</Text> },
    { value: metaDiaria.carbo || 1, label: 'Carb', frontColor: '#10b981', topLabelComponent: () => <Text style={{color: '#10b981', fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>{metaDiaria.carbo}g</Text> },
    { value: metaDiaria.gordura || 1, label: 'Gord', frontColor: '#f59e0b', topLabelComponent: () => <Text style={{color: '#f59e0b', fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>{metaDiaria.gordura}g</Text> },
  ];

  if (loading) return <View style={styles.loadingBox}><ActivityIndicator color="#10b981" size="large" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrição</Text>
        <Text style={styles.headerSubtitle}>{metaDiaria.calorias || 0} kcal • Foco na Dieta 🎯</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'Refeicoes' && styles.tabBtnActive]} onPress={() => setAbaAtiva('Refeicoes')}>
          <Text style={[styles.tabText, abaAtiva === 'Refeicoes' && styles.tabTextActive]}>Refeições</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'Compras' && styles.tabBtnActive]} onPress={() => setAbaAtiva('Compras')}>
          <Text style={[styles.tabText, abaAtiva === 'Compras' && styles.tabTextActive]}>Compras</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'Resumo' && styles.tabBtnActive]} onPress={() => setAbaAtiva('Resumo')}>
          <Text style={[styles.tabText, abaAtiva === 'Resumo' && styles.tabTextActive]}>Resumo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* --- REFEIÇÕES --- */}
        {abaAtiva === 'Refeicoes' && (
          <View>
            <View style={styles.waterCard}>
              <View>
                <Text style={styles.waterTitle}>Hidratação Diária</Text>
                <Text style={styles.waterSubtitle}>{coposAgua * 250}ml / {META_AGUA * 250}ml</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <TouchableOpacity onPress={resetAgua}><Ionicons name="refresh" size={20} color="#60a5fa" /></TouchableOpacity>
                <TouchableOpacity style={styles.btnAddWater} onPress={addAgua}>
                  <Ionicons name="water" size={20} color="#fff" />
                  <Text style={styles.textAddWater}>+250ml</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, {width: `${Math.min((coposAgua/META_AGUA)*100, 100)}%`}]} />
            </View>

            {refeicoes.length === 0 ? (
               <View style={styles.emptyState}>
                 <Ionicons name="restaurant-outline" size={60} color="#27272a" />
                 <Text style={{color: '#fff', fontSize: 18, marginTop: 15, fontWeight: 'bold'}}>Sem Dieta Vinculada</Text>
                 <Text style={{color: '#71717a', fontSize: 14, marginTop: 5, textAlign: 'center'}}>Seu professor ainda não vinculou um plano alimentar.</Text>
               </View>
            ) : (
              refeicoes.map((ref) => (
                <View key={ref.id} style={[styles.card, ref.feito && styles.cardDone]}>
                  <TouchableOpacity onPress={() => toggleRefeicao(ref.id)} style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.cardTitle, ref.feito && styles.textDone]}>{ref.nome}</Text>
                      <Text style={styles.cardTime}>{ref.horario}</Text>
                    </View>
                    <Ionicons name={ref.feito ? "checkmark-circle" : "ellipse-outline"} size={28} color={ref.feito ? "#10b981" : "#52525b"} />
                  </TouchableOpacity>

                  <View style={styles.optionSelector}>
                    <TouchableOpacity style={[styles.optionBtn, ref.opcaoEscolhida === 1 && styles.optionBtnActive]} onPress={() => mudarOpcao(ref.id, 1)}>
                      <Text style={[styles.optionText, ref.opcaoEscolhida === 1 && styles.optionTextActive]}>Opção 1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.optionBtn, ref.opcaoEscolhida === 2 && styles.optionBtnActive]} onPress={() => mudarOpcao(ref.id, 2)}>
                      <Text style={[styles.optionText, ref.opcaoEscolhida === 2 && styles.optionTextActive]}>Opção 2</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.foodList}>
                    {(ref.opcaoEscolhida === 1 ? ref.opcao1 : ref.opcao2).map((item: any, index: number) => (
                      <View key={index} style={styles.foodRowLayout}>
                        <Text style={[styles.foodQty, ref.feito && styles.textDone]}>{item.qty}</Text>
                        <Text style={[styles.foodName, ref.feito && styles.textDone]}>{item.name}</Text>
                      </View>
                    ))}

                    {ref.obs ? (
                      <View style={styles.obsBox}>
                        <Text style={styles.obsTitle}>OBSERVAÇÕES</Text>
                        <Text style={styles.obsText}>{ref.obs}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* --- COMPRAS --- */}
        {abaAtiva === 'Compras' && (
          <View>
            <Text style={styles.sectionTitle}>Mercado da Semana 🛒</Text>
            {listaCompras.length === 0 ? (
               <Text style={{color: '#71717a', marginTop: 10}}>Nenhuma dieta vinculada para gerar a lista.</Text>
            ) : (
              listaCompras.map((item) => (
                <TouchableOpacity key={item.id} style={styles.shopItem} onPress={() => toggleCompra(item.id)}>
                  <Text style={[styles.shopText, item.check && styles.textDone]}>{item.item}</Text>
                  <Ionicons name={item.check ? "checkbox" : "square-outline"} size={24} color={item.check ? "#10b981" : "#52525b"} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* --- RESUMO --- */}
        {abaAtiva === 'Resumo' && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Distribuição de Macros</Text>
            
            <View style={styles.chartWrapper}>
              <BarChart data={barData} barWidth={50} noOfSections={4} barBorderTopLeftRadius={8} barBorderTopRightRadius={8} frontColor="#3b82f6" yAxisThickness={0} xAxisThickness={1} xAxisColor="#3f3f46" yAxisTextStyle={{color: '#a1a1aa'}} xAxisLabelTextStyle={{color: '#fff', fontWeight: 'bold', marginTop: 5}} height={220} width={SCREEN_WIDTH - 80} spacing={40} hideRules isAnimated />
            </View>

            <View style={styles.detailsGrid}>
              <View style={[styles.detailCard, {borderColor: '#3b82f6'}]}><Text style={[styles.detailValue, {color: '#3b82f6'}]}>{metaDiaria.proteina}g</Text><Text style={styles.detailLabel}>Proteína</Text></View>
              <View style={[styles.detailCard, {borderColor: '#10b981'}]}><Text style={[styles.detailValue, {color: '#10b981'}]}>{metaDiaria.carbo}g</Text><Text style={styles.detailLabel}>Carbo</Text></View>
              <View style={[styles.detailCard, {borderColor: '#f59e0b'}]}><Text style={[styles.detailValue, {color: '#f59e0b'}]}>{metaDiaria.gordura}g</Text><Text style={styles.detailLabel}>Gordura</Text></View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingBox: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#000' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#10b981', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  tabBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tabText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  waterCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a8a', padding: 16, borderRadius: 16, marginBottom: 10 },
  waterTitle: { color: '#bfdbfe', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  waterSubtitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  btnAddWater: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', gap: 5 },
  textAddWater: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  progressBarBg: { height: 6, backgroundColor: '#172554', borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#60a5fa' },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#27272a' },
  cardDone: { opacity: 0.6, borderColor: '#10b981' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardTime: { color: '#10b981', fontWeight: 'bold' },
  optionSelector: { flexDirection: 'row', backgroundColor: '#09090b', padding: 4, borderRadius: 8, marginBottom: 15 },
  optionBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  optionBtnActive: { backgroundColor: '#27272a' },
  optionText: { color: '#52525b', fontSize: 12, fontWeight: 'bold' },
  optionTextActive: { color: '#fff' },
  foodList: { paddingLeft: 5 },
  foodRowLayout: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  foodQty: { color: '#fff', fontWeight: 'bold', width: 70, fontSize: 15 },
  foodName: { color: '#a1a1aa', flex: 1, fontSize: 15 },
  textDone: { textDecorationLine: 'line-through', color: '#52525b' },
  obsBox: { marginTop: 15, padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#10b981' },
  obsTitle: { color: '#10b981', fontSize: 10, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  obsText: { color: '#6ee7b7', fontSize: 13, fontStyle: 'italic' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  shopItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#27272a' },
  shopText: { color: '#d4d4d8', fontSize: 16 },
  chartSection: { alignItems: 'center', backgroundColor: '#18181b', borderRadius: 20, padding: 20, borderColor: '#27272a', borderWidth: 1 },
  chartWrapper: { alignItems: 'center', marginBottom: 20, marginTop: 20 },
  detailsGrid: { flexDirection: 'row', gap: 10, width: '100%' },
  detailCard: { flex: 1, backgroundColor: '#09090b', padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  detailValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  detailLabel: { color: '#a1a1aa', fontSize: 12 }
});