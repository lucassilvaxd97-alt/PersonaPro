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
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from "react-native-youtube-iframe";
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type TipoTreino = 'A' | 'B' | 'C' | 'D' | string;

export default function TreinoScreen({ navigation }: any) {
  // --- ESTADOS DO BACKEND ---
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [sendingXP, setSendingXP] = useState(false);
  
  const [abaAtiva, setAbaAtiva] = useState<TipoTreino>('A');
  const [todosTreinos, setTodosTreinos] = useState<any>({});
  
  // --- CONTROLE DE TEMPO (Sem Bloqueio) ---
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); 

  // --- ESTADOS DE VÍDEO E TIMER ---
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const [playing, setPlaying] = useState(false);

  // --- 1. BUSCAR DADOS NO BANCO ---
  const fetchWorkout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: linkData, error: linkErr } = await supabase
        .from('student_trainer')
        .select('trainer_id, plan_name')
        .eq('student_id', user.id)
        .single();

      if (linkErr || !linkData?.plan_name) throw new Error("Sem treino vinculado.");
      setTrainerId(linkData.trainer_id);

      const { data: templateData } = await supabase
        .from('workout_templates')
        .select('exercises')
        .eq('trainer_id', linkData.trainer_id)
        .eq('name', linkData.plan_name)
        .single();

      if (templateData?.exercises) {
        let formattedData: any = {};
        let firstAvailableTab = '';

        Object.keys(templateData.exercises).forEach(key => {
          if (templateData.exercises[key].length > 0) {
            if (!firstAvailableTab) firstAvailableTab = key;
            formattedData[key] = templateData.exercises[key].map((ex: any) => ({
              id: ex.id || Math.random().toString(),
              nome: ex.name || ex.nome || "Exercício",
              series: ex.sets || ex.series || "-", 
              reps: ex.reps || "-",
              carga: ex.carga || "",
              descanso: ex.rest || ex.descanso || 60,
              obs: ex.obs || "",
              // Garante que pegue o vídeo de qualquer formato que venha do banco
              videoId: ex.videoId || ex.video_url || ex.videoUrl || "", 
              concluido: false
            }));
          }
        });

        setTodosTreinos(formattedData);
        if (firstAvailableTab) setAbaAtiva(firstAvailableTab);
      }
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchWorkout(); }, []));

  // --- CRONÔMETRO DO TREINO ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutStarted) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStarted]);

  const formatElapsed = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- LÓGICA DO TIMER DE DESCANSO ---
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

  // --- INTERAÇÕES DO LAYOUT ---
  const toggleConcluido = (id: string) => {
    if (!workoutStarted) return Alert.alert("Atenção", "Inicie o treino primeiro!");
    Keyboard.dismiss();
    setTodosTreinos((prev: any) => ({
      ...prev,
      [abaAtiva]: prev[abaAtiva].map((ex: any) => 
        ex.id === id ? { ...ex, concluido: !ex.concluido } : ex
      )
    }));
  };

  const updateCarga = (id: string, novaCarga: string) => {
    setTodosTreinos((prev: any) => ({
      ...prev,
      [abaAtiva]: prev[abaAtiva].map((ex: any) => 
        ex.id === id ? { ...ex, carga: novaCarga } : ex
      )
    }));
  };

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
    const listaAtual = todosTreinos[abaAtiva] || [];
    const faltam = listaAtual.filter((ex: any) => !ex.concluido).length;
    if (faltam > 0) {
      Alert.alert("Atenção", `Faltam ${faltam} exercícios nesta aba.`, [
        { text: "Continuar" },
        { text: "Sair e Enviar XP", onPress: processarXP, style: 'destructive' }
      ]);
    } else {
      processarXP();
    }
  };

  const processarXP = async () => {
    setSendingXP(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('xp_logs').insert({
        student_id: user?.id,
        trainer_id: trainerId,
        amount: 50,
        status: 'pendente'
      });
      if (error) throw error;

      setWorkoutStarted(false);
      setElapsedTime(0); // Zera o cronômetro para o próximo treino
      Alert.alert("Treino Concluído! 🏆", `Cargas salvas e XP enviado ao professor!`, [
        { text: "Boa!", onPress: () => navigation.navigate('Início') }
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar XP.");
    } finally {
      setSendingXP(false);
    }
  };

  if (loading) return <View style={styles.loadingBox}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  const abasDisponiveis = Object.keys(todosTreinos);
  const exerciciosAtuais = todosTreinos[abaAtiva] || [];

  if (abasDisponiveis.length === 0) {
    return (
      <View style={styles.loadingBox}>
        <Ionicons name="barbell-outline" size={60} color="#27272a" />
        <Text style={{color: '#fff', fontSize: 18, marginTop: 15, fontWeight: 'bold'}}>Sem Ficha</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER ORIGINAL */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Ficha</Text>
        <Text style={styles.headerSubtitle}>
          {workoutStarted ? `Treino em andamento: ${formatElapsed(elapsedTime)}` : 'Toque no ▶ para ver a execução'}
        </Text>
      </View>

      {/* ABAS ORIGINAIS */}
      <View style={styles.tabContainer}>
        {abasDisponiveis.map((letra) => (
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
           <Text style={styles.workoutLabel}>TREINO {abaAtiva} <Text style={{color: '#a1a1aa', fontWeight: 'normal'}}>• Foco do Dia</Text></Text>
        </View>

        {/* INICIAR TREINO */}
        {!workoutStarted && (
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity style={styles.startBtn} onPress={() => setWorkoutStarted(true)}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startBtnText}>INICIAR TREINO</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LISTA ORIGINAL */}
        {exerciciosAtuais.map((ex: any) => (
          <View key={ex.id} style={[styles.card, ex.concluido && styles.cardConcluido, !workoutStarted && {opacity: 0.6}]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.exNome, ex.concluido && styles.textConcluido]}>{ex.nome}</Text>
              
              <View style={{flexDirection: 'row', gap: 10}}>
                {/* BOTÃO DO YOUTUBE VOLTOU COM FORÇA TOTAL */}
                {ex.videoId ? (
                  <TouchableOpacity onPress={() => openVideo(ex.videoId)}>
                    <Ionicons name="play-circle" size={28} color="#ef4444" />
                  </TouchableOpacity>
                ) : null}
                {ex.obs ? (
                  <TouchableOpacity onPress={() => Alert.alert("Dica", ex.obs)}>
                    <Ionicons name="information-circle" size={28} color="#3b82f6" />
                  </TouchableOpacity>
                ) : null}
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
                    editable={workoutStarted} 
                  />
                  <Ionicons name="pencil" size={10} color="#3b82f6" style={{marginLeft: 4}} />
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.timerButton, activeTimerId === ex.id && styles.timerButtonActive]}
                onPress={() => toggleTimer(ex.id, ex.descanso)}
                disabled={!workoutStarted}
              >
                <Ionicons name={activeTimerId === ex.id ? "stop" : "timer-outline"} size={18} color={activeTimerId === ex.id ? "#fff" : "#a1a1aa"} />
                <Text style={[styles.timerText, activeTimerId === ex.id && styles.timerTextActive]}>
                  {activeTimerId === ex.id ? formatTime(timeLeft) : `${ex.descanso}s`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.checkButton, ex.concluido && styles.checkButtonDone]}
                onPress={() => toggleConcluido(ex.id)}
                disabled={!workoutStarted}
              >
                <Text style={[styles.checkText, ex.concluido && styles.checkTextDone]}>
                  {ex.concluido ? "FEITO" : "CONCLUIR"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* BOTÃO FINALIZAR ORIGINAL */}
        {workoutStarted && (
          <TouchableOpacity style={styles.finishButton} onPress={finalizarTreino}>
            {sendingXP ? <ActivityIndicator color="#000" /> : <Text style={styles.finishButtonText}>FINALIZAR TREINO</Text>}
          </TouchableOpacity>
        )}

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

// STYLESHEET ORIGINAL INTACTO
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingBox: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
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
  finishButtonText: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#18181b', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  videoWrapper: { overflow: 'hidden', borderRadius: 12, backgroundColor: '#000' },

  // Botão de iniciar treino
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#059669' },
  startBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});