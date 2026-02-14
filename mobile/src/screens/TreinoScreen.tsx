import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Alert,
  TextInput,
  Keyboard,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from "react-native-youtube-iframe";

const { width } = Dimensions.get('window');

// --- MOCK DATA: TREINOS COM ID DOS VÍDEOS ---
const TREINOS_INICIAIS = {
  'A': [
    { id: 'a1', nome: "Supino Máquina", series: 3, reps: "12-15", carga: "10", descanso: 60, obs: "Segure firme e controle a volta.", videoId: "np22BPdFZj0", concluido: false },
    { id: 'a2', nome: "Desenv. Halteres", series: 3, reps: "12", carga: "4", descanso: 60, obs: "Cuidado para não arquear as costas.", videoId: "bO1e8jCgSfw", concluido: false },
    { id: 'a3', nome: "Tríceps Pulley", series: 3, reps: "15", carga: "15", descanso: 45, obs: "Cotovelos colados no corpo.", videoId: "vB5OHsJ3ECE", concluido: false },
    { id: 'a4', nome: "Elevação Lateral", series: 3, reps: "12", carga: "3", descanso: 45, obs: "", videoId: "P-8M9epT73c", concluido: false },
  ],
  'B': [
    { id: 'b1', nome: "Puxada Frontal", series: 3, reps: "12-15", carga: "20", descanso: 60, obs: "Traga a barra até o peito.", videoId: "CAwf7n6Luuc", concluido: false },
    { id: 'b2', nome: "Remada Baixa", series: 3, reps: "12", carga: "15", descanso: 60, obs: "Estufe o peito ao puxar.", videoId: "GZbfZ033f74", concluido: false },
    { id: 'b3', nome: "Rosca Direta", series: 3, reps: "12", carga: "5", descanso: 45, obs: "Não balance o corpo.", videoId: "i1jMDf63A64", concluido: false },
    { id: 'b4', nome: "Rosca Martelo", series: 3, reps: "12", carga: "5", descanso: 45, obs: "", videoId: "zC3nLlEptmA", concluido: false },
  ],
  'C': [
    { id: 'c1', nome: "Leg Press 45º", series: 3, reps: "12", carga: "40", descanso: 90, obs: "Não estique o joelho totalmente.", videoId: "yZmx_Ac3880", concluido: false },
    { id: 'c2', nome: "Cadeira Extensora", series: 3, reps: "15", carga: "15", descanso: 60, obs: "Segure 1 seg no topo.", videoId: "LJ3a0K1fcKQ", concluido: false },
    { id: 'c3', nome: "Mesa Flexora", series: 3, reps: "12", carga: "15", descanso: 60, obs: "", videoId: "1Tq3QdYUuHs", concluido: false },
    { id: 'c4', nome: "Panturrilha", series: 4, reps: "15-20", carga: "20", descanso: 45, obs: "Amplitude máxima.", videoId: "5jZ7S4T9t0A", concluido: false },
  ],
  'D': [
    { id: 'd1', nome: "Esteira", series: 1, reps: "20min", carga: "Vel 5", descanso: 0, obs: "Inclinação 2.0 se possível.", videoId: "", concluido: false },
    { id: 'd2', nome: "Abdominal Supra", series: 3, reps: "20", carga: "0", descanso: 45, obs: "Peso do corpo.", videoId: "02c-02l-02k", concluido: false }, 
    { id: 'd3', nome: "Prancha", series: 3, reps: "30s", carga: "0", descanso: 45, obs: "Abdômen contraído.", videoId: "pSHjTRCQxIw", concluido: false },
  ]
};

type TipoTreino = 'A' | 'B' | 'C' | 'D';

export default function TreinoScreen({ navigation }: any) {
  const [abaAtiva, setAbaAtiva] = useState<TipoTreino>('A');
  const [todosTreinos, setTodosTreinos] = useState(TREINOS_INICIAIS);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Estados do Vídeo
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimerId && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && activeTimerId) {
      Alert.alert("Tempo Esgotado!", "Bora pra próxima série! 🔥");
      setActiveTimerId(null);
    }
    return () => clearInterval(interval);
  }, [activeTimerId, timeLeft]);

  const toggleTimer = (id: string, segundos: number) => {
    if (activeTimerId === id) setActiveTimerId(null);
    else {
      setActiveTimerId(id);
      setTimeLeft(segundos);
    }
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const toggleConcluido = (id: string) => {
    Keyboard.dismiss();
    setTodosTreinos(prev => ({
      ...prev,
      [abaAtiva]: prev[abaAtiva].map(ex => 
        ex.id === id ? { ...ex, concluido: !ex.concluido } : ex
      )
    }));
  };

  const updateCarga = (id: string, novaCarga: string) => {
    setTodosTreinos(prev => ({
      ...prev,
      [abaAtiva]: prev[abaAtiva].map(ex => 
        ex.id === id ? { ...ex, carga: novaCarga } : ex
      )
    }));
  };

  // --- LÓGICA DO VÍDEO ---
  const openVideo = (videoId: string) => {
    if (!videoId) return Alert.alert("Ops", "Vídeo não disponível.");
    setCurrentVideoId(videoId);
    setModalVisible(true);
    setPlaying(true);
  };

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") setPlaying(false);
  }, []);

  const finalizarTreino = () => {
    const listaAtual = todosTreinos[abaAtiva];
    const faltam = listaAtual.filter(ex => !ex.concluido).length;
    if (faltam > 0) {
      Alert.alert("Atenção", `Faltam ${faltam} exercícios.`, [
        { text: "Continuar" },
        { text: "Sair", onPress: () => navigation.navigate('Dashboard') }
      ]);
    } else {
      Alert.alert("Treino Concluído! 🏆", "Cargas salvas.", [
        { text: "Finalizar", onPress: () => navigation.navigate('Dashboard') }
      ]);
    }
  };

  const exerciciosAtuais = todosTreinos[abaAtiva];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Ficha</Text>
        <Text style={styles.headerSubtitle}>Toque no ▶ para ver a execução</Text>
      </View>

      {/* Abas */}
      <View style={styles.tabContainer}>
        {(['A', 'B', 'C', 'D'] as TipoTreino[]).map((letra) => (
          <TouchableOpacity 
            key={letra} 
            style={[styles.tabButton, abaAtiva === letra && styles.tabActive]}
            onPress={() => setAbaAtiva(letra)}
          >
            <Text style={[styles.tabText, abaAtiva === letra && styles.tabTextActive]}>{letra}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.workoutHeader}>
           <Text style={styles.workoutLabel}>TREINO {abaAtiva}</Text>
        </View>

        {exerciciosAtuais.map((ex) => (
          <View key={ex.id} style={[styles.card, ex.concluido && styles.cardConcluido]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.exNome, ex.concluido && styles.textConcluido]}>{ex.nome}</Text>
              
              <View style={{flexDirection: 'row', gap: 10}}>
                {/* BOTÃO PLAY VERMELHO */}
                {ex.videoId !== "" && (
                  <TouchableOpacity onPress={() => openVideo(ex.videoId)}>
                    <Ionicons name="play-circle" size={28} color="#ef4444" />
                  </TouchableOpacity>
                )}
                {ex.obs !== "" && (
                  <TouchableOpacity onPress={() => Alert.alert("Dica", ex.obs)}>
                    <Ionicons name="information-circle" size={28} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statLabel}>SÉRIES</Text><Text style={styles.statValue}>{ex.series}</Text></View>
              <View style={styles.separator} />
              <View style={styles.statItem}><Text style={styles.statLabel}>REPS</Text><Text style={styles.statValue}>{ex.reps}</Text></View>
              <View style={styles.separator} />
              <View style={styles.statItemInput}>
                <Text style={styles.statLabel}>KG</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputCarga}
                    value={ex.carga}
                    onChangeText={(text) => updateCarga(ex.id, text)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#52525b"
                    maxLength={3}
                  />
                  <Ionicons name="pencil" size={10} color="#3b82f6" style={{marginLeft: 4}} />
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.timerButton, activeTimerId === ex.id && styles.timerButtonActive]}
                onPress={() => toggleTimer(ex.id, ex.descanso)}
              >
                <Ionicons name={activeTimerId === ex.id ? "stop" : "timer-outline"} size={18} color={activeTimerId === ex.id ? "#fff" : "#a1a1aa"} />
                <Text style={[styles.timerText, activeTimerId === ex.id && styles.timerTextActive]}>
                  {activeTimerId === ex.id ? formatTime(timeLeft) : `${ex.descanso}s`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.checkButton, ex.concluido && styles.checkButtonDone]}
                onPress={() => toggleConcluido(ex.id)}
              >
                <Text style={[styles.checkText, ex.concluido && styles.checkTextDone]}>
                  {ex.concluido ? "FEITO" : "CONCLUIR"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.finishButton} onPress={finalizarTreino}>
          <Text style={styles.finishButtonText}>FINALIZAR TREINO</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      {/* MODAL DO VÍDEO YOUTUBE */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { setModalVisible(false); setPlaying(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Execução</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setPlaying(false); }}>
                <Ionicons name="close-circle" size={30} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.videoWrapper}>
              <YoutubePlayer
                height={220}
                width={width - 60}
                play={playing}
                videoId={currentVideoId}
                onChangeState={onStateChange}
                initialPlayerParams={{ rel: false, modestbranding: true }}
              />
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#000' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a1a1aa' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 10 },
  tabButton: { flex: 1, paddingVertical: 10, backgroundColor: '#18181b', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  tabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  list: { padding: 20 },
  workoutHeader: { marginBottom: 20 },
  workoutLabel: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold' },
  card: { backgroundColor: '#18181b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardConcluido: { opacity: 0.6, borderColor: '#3b82f6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  exNome: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  textConcluido: { textDecorationLine: 'line-through', color: '#71717a' },
  statsRow: { flexDirection: 'row', backgroundColor: '#09090b', borderRadius: 12, padding: 10, marginBottom: 15, justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', width: 60 },
  statItemInput: { alignItems: 'center', width: 80 },
  statLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  separator: { width: 1, height: 20, backgroundColor: '#27272a' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#3b82f6', paddingBottom: 2 },
  inputCarga: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', width: 40, padding: 0 },
  actionRow: { flexDirection: 'row', gap: 10 },
  timerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#27272a', gap: 5 },
  timerButtonActive: { backgroundColor: '#b91c1c', borderColor: '#ef4444' },
  timerText: { color: '#a1a1aa', fontWeight: 'bold' },
  timerTextActive: { color: '#fff' },
  checkButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8 },
  checkButtonDone: { backgroundColor: '#3b82f6' },
  checkText: { color: '#3b82f6', fontWeight: 'bold' },
  checkTextDone: { color: '#000' },
  finishButton: { marginTop: 10, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  finishButtonText: { fontWeight: 'bold', fontSize: 16 },
  
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#18181b', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  videoWrapper: { overflow: 'hidden', borderRadius: 12, backgroundColor: '#000' }
});