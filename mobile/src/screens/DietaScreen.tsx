import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importando BarChart agora!
import { BarChart } from "react-native-gifted-charts";

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- DADOS MOCK (Dieta) ---
const META_DIARIA = {
  calorias: 2800, proteina: 180, carbo: 300, gordura: 70
};

const DADOS_REFEICOES = [
  { 
    id: '1', nome: 'Café da Manhã', horario: '07:00', feito: false, opcaoEscolhida: 1,
    opcao1: ['3 Ovos Mexidos', '2 Fatias Pão Integral', '1 Banana', 'Café Preto'],
    opcao2: ['Crepioca (2 ovos + 30g tapioca)', 'Requeijão Light', '1 Maçã']
  },
  { 
    id: '2', nome: 'Almoço', horario: '12:30', feito: false, opcaoEscolhida: 1,
    opcao1: ['200g Frango Grelhado', '150g Arroz Branco', 'Feijão (1 concha)', 'Salada à vontade'],
    opcao2: ['200g Patinho Moído', '200g Batata Inglesa', 'Legumes no Vapor']
  },
  { 
    id: '3', nome: 'Lanche da Tarde', horario: '16:00', feito: false, opcaoEscolhida: 1,
    opcao1: ['1 Scoop Whey Protein', '30g Aveia', 'Fruta'],
    opcao2: ['Iogurte Natural', 'Granola sem açúcar', 'Mel']
  },
  { 
    id: '4', nome: 'Jantar', horario: '20:00', feito: false, opcaoEscolhida: 1,
    opcao1: ['150g Peixe Branco', '100g Purê de Mandioquinha', 'Brócolis'],
    opcao2: ['Omelete (3 ovos)', 'Salada Grande', 'Azeite de Oliva']
  },
];

const LISTA_COMPRAS_INICIAL = [
  { id: 'c1', item: 'Ovos (30 un)', check: false },
  { id: 'c2', item: 'Frango (2kg)', check: false },
  { id: 'c3', item: 'Arroz Integral', check: false },
  { id: 'c4', item: 'Aveia em Flocos', check: false },
  { id: 'c5', item: 'Whey Protein', check: false },
  { id: 'c6', item: 'Banana Prata', check: false },
  { id: 'c7', item: 'Pasta de Amendoim', check: false },
];

export default function DietaScreen() {
  const [abaAtiva, setAbaAtiva] = useState<'Refeicoes' | 'Resumo' | 'Compras'>('Refeicoes');
  const [refeicoes, setRefeicoes] = useState(DADOS_REFEICOES);
  const [listaCompras, setListaCompras] = useState(LISTA_COMPRAS_INICIAL);
  const [coposAgua, setCoposAgua] = useState(0);
  const META_AGUA = 12; 

  // --- ACTIONS ---
  const toggleRefeicao = (id: string) => {
    setRefeicoes(prev => prev.map(item => item.id === id ? { ...item, feito: !item.feito } : item));
  };
  const mudarOpcao = (id: string, opcao: 1 | 2) => {
    setRefeicoes(prev => prev.map(item => item.id === id ? { ...item, opcaoEscolhida: opcao } : item));
  };
  const toggleCompra = (id: string) => {
    setListaCompras(prev => prev.map(item => item.id === id ? { ...item, check: !item.check } : item));
  };
  const addAgua = () => setCoposAgua(prev => prev + 1);
  const resetAgua = () => setCoposAgua(0);

  // --- DADOS DO GRÁFICO DE BARRAS ---
  const barData = [
    { 
      value: META_DIARIA.proteina, 
      label: 'Prot', 
      frontColor: '#3b82f6', 
      topLabelComponent: () => <Text style={{color: '#3b82f6', fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>{META_DIARIA.proteina}g</Text>
    },
    { 
      value: META_DIARIA.carbo, 
      label: 'Carb', 
      frontColor: '#10b981', 
      topLabelComponent: () => <Text style={{color: '#10b981', fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>{META_DIARIA.carbo}g</Text>
    },
    { 
      value: META_DIARIA.gordura, 
      label: 'Gord', 
      frontColor: '#f59e0b', 
      topLabelComponent: () => <Text style={{color: '#f59e0b', fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>{META_DIARIA.gordura}g</Text>
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrição</Text>
        <Text style={styles.headerSubtitle}>{META_DIARIA.calorias} kcal • Foco na Dieta 🎯</Text>
      </View>

      {/* ABAS */}
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

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* === ABA 1: REFEIÇÕES === */}
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

            {refeicoes.map((ref) => (
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
                  {(ref.opcaoEscolhida === 1 ? ref.opcao1 : ref.opcao2).map((item, index) => (
                    <Text key={index} style={[styles.foodItem, ref.feito && styles.textDone]}>• {item}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* === ABA 2: COMPRAS === */}
        {abaAtiva === 'Compras' && (
          <View>
            <Text style={styles.sectionTitle}>Mercado da Semana 🛒</Text>
            {listaCompras.map((item) => (
              <TouchableOpacity key={item.id} style={styles.shopItem} onPress={() => toggleCompra(item.id)}>
                <Text style={[styles.shopText, item.check && styles.textDone]}>{item.item}</Text>
                <Ionicons name={item.check ? "checkbox" : "square-outline"} size={24} color={item.check ? "#3b82f6" : "#52525b"} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.btnPrint} onPress={() => Alert.alert("Em breve", "Função de exportar PDF")}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={{color: '#fff', fontWeight: 'bold', marginLeft: 8}}>COMPARTILHAR LISTA</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* === ABA 3: RESUMO (GRÁFICO DE COLUNAS) === */}
        {abaAtiva === 'Resumo' && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Distribuição de Macros</Text>
            
            <View style={styles.chartWrapper}>
              <BarChart
                data={barData}
                barWidth={50}
                noOfSections={4}
                barBorderTopLeftRadius={8}
                barBorderTopRightRadius={8}
                frontColor="#3b82f6"
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#3f3f46"
                yAxisTextStyle={{color: '#a1a1aa'}}
                xAxisLabelTextStyle={{color: '#fff', fontWeight: 'bold', marginTop: 5}}
                height={220}
                width={SCREEN_WIDTH - 80}
                spacing={40} // Espaço entre as barras
                hideRules
                isAnimated
              />
            </View>

            {/* CARD DE DETALHES ABAIXO */}
            <View style={styles.detailsGrid}>
              <View style={[styles.detailCard, {borderColor: '#3b82f6'}]}>
                <Text style={[styles.detailValue, {color: '#3b82f6'}]}>{META_DIARIA.proteina}g</Text>
                <Text style={styles.detailLabel}>Proteína</Text>
              </View>
              <View style={[styles.detailCard, {borderColor: '#10b981'}]}>
                <Text style={[styles.detailValue, {color: '#10b981'}]}>{META_DIARIA.carbo}g</Text>
                <Text style={styles.detailLabel}>Carbo</Text>
              </View>
              <View style={[styles.detailCard, {borderColor: '#f59e0b'}]}>
                <Text style={[styles.detailValue, {color: '#f59e0b'}]}>{META_DIARIA.gordura}g</Text>
                <Text style={styles.detailLabel}>Gordura</Text>
              </View>
            </View>

          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#000' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold' },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  tabBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  // HIDRATAÇÃO E REFEIÇÕES
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
  cardTime: { color: '#3b82f6', fontWeight: 'bold' },
  optionSelector: { flexDirection: 'row', backgroundColor: '#09090b', padding: 4, borderRadius: 8, marginBottom: 10 },
  optionBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  optionBtnActive: { backgroundColor: '#27272a' },
  optionText: { color: '#52525b', fontSize: 12, fontWeight: 'bold' },
  optionTextActive: { color: '#fff' },
  foodList: { paddingLeft: 5 },
  foodItem: { color: '#a1a1aa', fontSize: 14, marginBottom: 4 },
  textDone: { textDecorationLine: 'line-through', color: '#52525b' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  shopItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#27272a' },
  shopText: { color: '#d4d4d8', fontSize: 16 },
  btnPrint: { marginTop: 20, backgroundColor: '#27272a', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },

  // GRÁFICOS
  chartSection: { alignItems: 'center', backgroundColor: '#18181b', borderRadius: 20, padding: 20, borderColor: '#27272a', borderWidth: 1 },
  chartWrapper: { alignItems: 'center', marginBottom: 20, marginTop: 20 },
  
  // Detalhes em Grid
  detailsGrid: { flexDirection: 'row', gap: 10, width: '100%' },
  detailCard: { flex: 1, backgroundColor: '#09090b', padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  detailValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  detailLabel: { color: '#a1a1aa', fontSize: 12 }
});