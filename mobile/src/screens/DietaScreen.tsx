import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- MOCK DATA: Dieta Flexível (Agora com 6 Refeições) ---
const DIETA_FLEXIVEL = [
  { 
    id: 1, 
    horario: "07:30", 
    nome: "Café da Manhã",
    concluido: false,
    lembrete: true,
    obs: "Beba água ao acordar.",
    opcoes: {
      1: {
        titulo: "Clássico (Salgado)",
        itens: ["3 Ovos Mexidos", "2 Fatias Pão Integral", "Café Preto"],
        calorias: 450
      },
      2: {
        titulo: "Doce (Mingau)",
        itens: ["40g Aveia", "30g Whey Protein", "1 Banana"],
        calorias: 420
      }
    }
  },
  { 
    id: 2, 
    horario: "10:30", 
    nome: "Lanche da Manhã",
    concluido: false,
    lembrete: false,
    obs: "",
    opcoes: {
      1: {
        titulo: "Fruta + Prot",
        itens: ["1 Maçã", "1 Iogurte Natural"],
        calorias: 200
      },
      2: {
        titulo: "Oleaginosas",
        itens: ["30g Mix de Castanhas", "Água de Coco"],
        calorias: 250
      }
    }
  },
  { 
    id: 3, 
    horario: "13:30", 
    nome: "Almoço",
    concluido: false,
    lembrete: true,
    obs: "Salada à vontade.",
    opcoes: {
      1: {
        titulo: "Frango Grelhado",
        itens: ["150g Peito de Frango", "100g Arroz Branco", "Feijão"],
        calorias: 600
      },
      2: {
        titulo: "Carne Moída",
        itens: ["150g Patinho", "120g Batata Doce", "Legumes"],
        calorias: 650
      }
    }
  },
  { 
    id: 4, 
    horario: "16:30", 
    nome: "Lanche da Tarde",
    concluido: false,
    lembrete: true,
    obs: "",
    opcoes: {
      1: {
        titulo: "Vitamina",
        itens: ["200ml Leite Desn.", "1 Banana", "30g Aveia"],
        calorias: 350
      },
      2: {
        titulo: "Sanduíche",
        itens: ["2 Fatias Pão", "Pasta de Amendoim"],
        calorias: 380
      }
    }
  },
  { 
    id: 5, 
    horario: "20:00", 
    nome: "Jantar",
    concluido: false,
    lembrete: true,
    obs: "Evite líquidos.",
    opcoes: {
      1: {
        titulo: "Omelete",
        itens: ["3 Ovos", "Queijo Branco", "Espinafre"],
        calorias: 400
      },
      2: {
        titulo: "Sopa",
        itens: ["Sopa de Legumes com Frango desfiado"],
        calorias: 300
      }
    }
  },
  // --- NOVA REFEIÇÃO ADICIONADA: CEIA ---
  { 
    id: 6, 
    horario: "22:30", 
    nome: "Ceia",
    concluido: false,
    lembrete: false,
    obs: "Para melhorar o sono.",
    opcoes: {
      1: {
        titulo: "Gorduras Boas",
        itens: ["2 Castanhas do Pará", "Chá de Camomila"],
        calorias: 120
      },
      2: {
        titulo: "Proteína Lenta",
        itens: ["1 Scoop Albumina ou Caseína", "Água"],
        calorias: 110
      }
    }
  },
];

export default function DietaScreen({ navigation }: any) {
  const [refeicoes, setRefeicoes] = useState(DIETA_FLEXIVEL);
  const [coposAgua, setCoposAgua] = useState(0);
  
  // Estado para controlar qual opção está selecionada (1 ou 2)
  // IMPORTANTE: Adicionei o ID 6 aqui para a Ceia funcionar
  const [escolhas, setEscolhas] = useState<{[key: number]: 1 | 2}>({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1
  });

  // Trocar Opção (1 ou 2)
  const selecionarOpcao = (idRefeicao: number, opcao: 1 | 2) => {
    setEscolhas(prev => ({ ...prev, [idRefeicao]: opcao }));
  };

  // Marcar Check (Feito)
  const toggleRefeicao = (id: number) => {
    setRefeicoes(prev => prev.map(ref => 
      ref.id === id ? { ...ref, concluido: !ref.concluido } : ref
    ));
  };

  // Lógica da Água
  const addAgua = () => setCoposAgua(c => (c < 15 ? c + 1 : c));
  const removeAgua = () => setCoposAgua(c => (c > 0 ? c - 1 : 0));

  // Cálculos Dinâmicos (baseados na opção escolhida)
  const calcularTotais = () => {
    let total = 0;
    let consumido = 0;

    refeicoes.forEach(ref => {
      const opcaoEscolhida = escolhas[ref.id] || 1; // Fallback para 1 se der erro
      const dadosOpcao = ref.opcoes[opcaoEscolhida];
      
      if (dadosOpcao) {
        total += dadosOpcao.calorias;
        if (ref.concluido) {
          consumido += dadosOpcao.calorias;
        }
      }
    });

    return { total, consumido };
  };

  const { total, consumido } = calcularTotais();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header Fixo */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Plano Flexível</Text>
          <Text style={styles.headerProgress}>{consumido} / {total} kcal</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: total > 0 ? `${(consumido / total) * 100}%` : '0%' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Widget Água */}
        <View style={styles.waterCard}>
          <View>
            <Text style={styles.waterTitle}>Hidratação</Text>
            <Text style={styles.waterSubtitle}>{coposAgua * 250}ml / 3000ml</Text>
          </View>
          <View style={styles.waterControls}>
            <TouchableOpacity onPress={removeAgua} style={styles.waterButtonSmall}>
              <Ionicons name="remove" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <View style={styles.waterCount}>
              <Ionicons name="water" size={18} color="#3b82f6" />
              <Text style={styles.waterNumber}>{coposAgua}</Text>
            </View>
            <TouchableOpacity onPress={addAgua} style={styles.waterButton}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Refeições do Dia</Text>
        
        {refeicoes.map((ref) => {
          const opcaoAtiva = escolhas[ref.id] || 1;
          const dados = ref.opcoes[opcaoAtiva];

          return (
            <View key={ref.id} style={[styles.card, ref.concluido && styles.cardConcluido]}>
              
              {/* Topo do Card */}
              <View style={styles.cardHeader}>
                <View style={styles.timeWrapper}>
                   <Text style={styles.timeText}>{ref.horario}</Text>
                </View>
                <Text style={[styles.refName, ref.concluido && styles.textConcluido]}>{ref.nome}</Text>
                
                {ref.obs !== "" && (
                  <TouchableOpacity onPress={() => Alert.alert("Dica do Nutri", ref.obs)}>
                    <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Seletor de Opções (Abas dentro do card) */}
              <View style={styles.optionSelector}>
                <TouchableOpacity 
                  style={[styles.optionBtn, opcaoAtiva === 1 && styles.optionBtnActive]}
                  onPress={() => selecionarOpcao(ref.id, 1)}
                  disabled={ref.concluido} 
                >
                  <Text style={[styles.optionText, opcaoAtiva === 1 && styles.optionTextActive]}>Opção 1</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionBtn, opcaoAtiva === 2 && styles.optionBtnActive]}
                  onPress={() => selecionarOpcao(ref.id, 2)}
                  disabled={ref.concluido}
                >
                  <Text style={[styles.optionText, opcaoAtiva === 2 && styles.optionTextActive]}>Opção 2</Text>
                </TouchableOpacity>
              </View>

              {/* Detalhes da Opção Escolhida */}
              <View style={styles.foodList}>
                <Text style={styles.optionTitle}>{dados.titulo}</Text>
                {dados.itens.map((item, i) => (
                  <Text key={i} style={[styles.foodItem, ref.concluido && styles.textConcluido]}>• {item}</Text>
                ))}
              </View>

              {/* Rodapé */}
              <View style={styles.cardFooter}>
                <Text style={styles.calText}>{dados.calorias} kcal</Text>
                
                <TouchableOpacity 
                  style={[styles.checkButton, ref.concluido && styles.checkButtonActive]}
                  onPress={() => toggleRefeicao(ref.id)}
                >
                  <Text style={[styles.checkText, ref.concluido && styles.checkTextActive]}>
                    {ref.concluido ? "FEITO" : "MARCAR"}
                  </Text>
                  <Ionicons name={ref.concluido ? "checkmark-circle" : "ellipse-outline"} size={18} color={ref.concluido ? "#fff" : "#3b82f6"} />
                </TouchableOpacity>
              </View>

            </View>
          );
        })}

        <TouchableOpacity style={styles.finishButton} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.finishButtonText}>FINALIZAR O DIA ✅</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#000', borderBottomWidth: 1, borderColor: '#18181b' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerProgress: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: '#27272a', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#3b82f6', borderRadius: 3 },

  scrollContent: { padding: 20 },

  waterCard: { backgroundColor: '#18181b', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  waterTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  waterSubtitle: { color: '#3b82f6', fontSize: 12, marginTop: 4 },
  waterControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waterButtonSmall: { padding: 6, backgroundColor: '#09090b', borderRadius: 8 },
  waterButton: { padding: 8, backgroundColor: '#3b82f6', borderRadius: 8 },
  waterCount: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 40, justifyContent: 'center' },
  waterNumber: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },

  card: { backgroundColor: '#18181b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardConcluido: { opacity: 0.5, borderColor: '#3b82f6' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timeWrapper: { backgroundColor: '#09090b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  timeText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 12 },
  refName: { color: '#fff', fontWeight: 'bold', fontSize: 16, flex: 1 },
  textConcluido: { textDecorationLine: 'line-through', color: '#71717a' },

  optionSelector: { flexDirection: 'row', backgroundColor: '#09090b', borderRadius: 8, padding: 4, marginBottom: 12 },
  optionBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  optionBtnActive: { backgroundColor: '#27272a' },
  optionText: { color: '#52525b', fontSize: 12, fontWeight: 'bold' },
  optionTextActive: { color: '#fff' },

  foodList: { marginLeft: 4, marginBottom: 15 },
  optionTitle: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  foodItem: { color: '#a1a1aa', fontSize: 14, marginBottom: 4 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#27272a', paddingTop: 12 },
  calText: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  checkButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6' },
  checkButtonActive: { backgroundColor: '#3b82f6' },
  checkText: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6' },
  checkTextActive: { color: '#fff' },

  finishButton: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  finishButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});