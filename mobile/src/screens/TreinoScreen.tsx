import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, 
  Alert, TextInput, Keyboard, Modal, Dimensions, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from "react-native-youtube-iframe";
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type TipoTreino = 'A' | 'B' | 'C' | 'D' | string;

export default function TreinoScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [sendingXP, setSendingXP] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<TipoTreino>('A');
  const [todosTreinos, setTodosTreinos] = useState<any>({});
  
  // --- CONTROLE DE TEMPO MANUAL ---
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [timerRunning, setTimerRunning] = useState(false); // Play/Pause

  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

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
              musculo: ex.musculo || ex.target || "Geral", // Buscando o músculo
              series: ex.sets || ex.series || "-", 
              reps: ex.reps || "-",
              carga: ex.carga || "",
              descanso: ex.rest || ex.descanso || 60,
              obs: ex.obs || "",
              videoId: ex.videoId || ex.video_url || ex.videoUrl || "", 
              concluido: false
            }));
          }
        });

        setTodosTreinos(formattedData);
        if (firstAvailableTab && !todosTreinos[abaAtiva]) {
          setAbaAtiva(firstAvailableTab);
        }
      }
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchWorkout(); }, []));

  // --- LÓGICA DO CRONÔMETRO DE TREINO (PLAY/PAUSE) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatElapsed = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  // --- FUNÇÃO PARA PEGAR MÚSCULOS DO TREINO ATUAL ---
  const getMusculosDoDia = () => {
    const exercicios = todosTreinos[abaAtiva] || [];
    const listaMusculos = [...new Set(exercicios.map((ex: any) => ex.musculo))];
    return listaMusculos.length > 0 ? listaMusculos.join(' • ') : 'Foco no Shape';
  };

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
    if (!timerRunning && elapsedTime === 0) return Alert.alert("Atenção", "Inicie o cronômetro para começar o treino!");
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

  const processarXP = async () => {
    setSendingXP(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('xp_logs').insert({
        student_id: user?.id,
        trainer_id: trainerId,
        amount: 50,
        status: 'pendente'
      });
      setTimerRunning(false);
      setElapsedTime(0); 
      Alert.alert("Treino Concluído! 🏆", "XP enviado ao professor!", [
        { text: "Boa!", onPress: () => navigation.navigate('Início')}
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar XP.");
    } finally {
      setSendingXP(false);
    }
  };

  const exerciciosAtuais = todosTreinos[abaAtiva] || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER COM CRONÔMETRO CONTROLÁVEL */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Minha Ficha</Text>
          <Text style={styles.headerSubtitle}>
            {timerRunning ? "Treinando agora..." : "Cronômetro pausado"}
          </Text>
        </View>

        <View style={styles.mainTimerBox}>
           <Text style={styles.mainTimerText}>{formatElapsed(elapsedTime)}</Text>
           <View style={styles.timerControls}>
             <TouchableOpacity onPress={() => setTimerRunning(!timerRunning)}>
               <Ionicons name={timerRunning ? "pause" : "play"} size={24} color={timerRunning ? "#f59e0b" : "#10b981"} />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => { setElapsedTime(0); setTimerRunning(false); }}>
               <Ionicons name="refresh" size={24} color="#ef4444" />
             </TouchableOpacity>
           </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* SELETOR DE TREINOS COM MÚSCULOS DO DIA */}
        <TouchableOpacity style={styles.workoutSelector} onPress={() => setDropdownVisible(true)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.workoutLabel}>Treino Ativo</Text>
            <Text style={styles.workoutSelectorTitle}>FICHA {abaAtiva}</Text>
            <Text style={styles.musculosTexto}>{getMusculosDoDia()}</Text>
          </View>
          <Ionicons name="chevron-down-circle" size={32} color="#3b82f6" />
        </TouchableOpacity>

        {/* LISTA DE EXERCÍCIOS */}
        {exerciciosAtuais.map((ex: any) => (
          <View key={ex.id} style={[styles.card, ex.concluido && styles.cardConcluido]}>
            <View style={styles.cardHeader}>
              <View style={{flex:1}}>
                <Text style={[styles.exNome, ex.concluido && styles.textConcluido]}>{ex.nome}</Text>
                <Text style={styles.exMusculoSmall}>{ex.musculo}</Text>
              </View>
              
              <View style={{flexDirection: 'row', gap: 10}}>
                {ex.videoId ? (
                  <TouchableOpacity onPress={() => openVideo(ex.videoId)}>
                    <Ionicons name="play-circle" size={28} color="#ef4444" />
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
                <TextInput
                  style={styles.inputCarga}
                  value={ex.carga}
                  onChangeText={(text) => updateCarga(ex.id, text)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#52525b"
                />
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.timerButton, activeTimerId === ex.id && styles.timerButtonActive]}
                onPress={() => toggleTimer(ex.id, ex.descanso)}
              >
                <Ionicons name="timer-outline" size={18} color="#a1a1aa" />
                <Text style={styles.timerText}>{activeTimerId === ex.id ? formatTime(timeLeft) : `${ex.descanso}s`}</Text>
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

        <TouchableOpacity style={styles.finishButton} onPress={processarXP}>
          {sendingXP ? <ActivityIndicator color="#000" /> : <Text style={styles.finishButtonText}>FINALIZAR TREINO</Text>}
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      {/* MODAL SELETOR (MANTIDO) */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownContent}>
            {Object.keys(todosTreinos).map((aba) => (
              <TouchableOpacity key={aba} style={styles.dropdownItem} onPress={() => { setAbaAtiva(aba); setDropdownVisible(false); }}>
                <Text style={[styles.dropdownItemText, abaAtiva === aba && {color: '#3b82f6', fontWeight: 'bold'}]}>Treino {aba}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL VÍDEO (MANTIDO) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingBox: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#71717a' },
  
  mainTimerBox: { alignItems: 'center', backgroundColor: '#18181b', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#27272a' },
  mainTimerText: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  timerControls: { flexDirection: 'row', gap: 15, marginTop: 5 },

  list: { padding: 20 },
  workoutSelector: { backgroundColor: '#18181b', padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#3b82f6' },
  workoutLabel: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  workoutSelectorTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  musculosTexto: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold', marginTop: 2 },

  card: { backgroundColor: '#18181b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  cardConcluido: { borderColor: '#22c55e', opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  exNome: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  exMusculoSmall: { color: '#3b82f6', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  textConcluido: { textDecorationLine: 'line-through', color: '#71717a' },
  
  statsRow: { flexDirection: 'row', backgroundColor: '#09090b', borderRadius: 12, padding: 10, marginBottom: 15, justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold' },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  separator: { width: 1, height: 20, backgroundColor: '#27272a' },
  statItemInput: { alignItems: 'center' },
  inputCarga: { color: '#fff', fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#3b82f6', width: 40, textAlign: 'center' },

  actionRow: { flexDirection: 'row', gap: 10 },
  timerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', padding: 12, borderRadius: 8, gap: 5 },
  timerButtonActive: { backgroundColor: '#b91c1c' },
  timerText: { color: '#fff', fontWeight: 'bold' },
  checkButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8 },
  checkButtonDone: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkText: { color: '#3b82f6', fontWeight: 'bold' },
  checkTextDone: { color: '#fff' },

  finishButton: { backgroundColor: '#fff', padding: 18, borderRadius: 14, alignItems: 'center' },
  finishButtonText: { fontWeight: 'bold', color: '#000', fontSize: 16 },
  
  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 40 },
  dropdownContent: { backgroundColor: '#18181b', borderRadius: 20, padding: 20 },
  dropdownItem: { paddingVertical: 15 },
  dropdownItemText: { color: '#fff', fontSize: 18, textAlign: 'center' },
});