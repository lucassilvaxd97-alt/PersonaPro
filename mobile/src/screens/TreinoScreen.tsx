import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, 
  Alert, TextInput, Keyboard, Modal, Dimensions, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from "react-native-youtube-iframe";
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

type TipoTreino = 'A' | 'B' | 'C' | 'D' | string;

export default function TreinoScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [sendingXP, setSendingXP] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<TipoTreino>('A');
  const [todosTreinos, setTodosTreinos] = useState<any>({});
  
  // --- CONTROLE DE TEMPO MANUAL ---
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [timerRunning, setTimerRunning] = useState(false); 

  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // ESTADOS DOS MODAIS
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [modoTreinoVisible, setModoTreinoVisible] = useState(false);
  
  // ESTADOS DO VÍDEO
  const [modalVideoVisible, setModalVideoVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const [playing, setPlaying] = useState(false);

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
              musculo: ex.musculo || ex.target || "Geral", 
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

  // --- LÓGICA DO CRONÔMETRO DE TREINO ---
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
      Alert.alert("🔥 Tempo Esgotado!", "Bora pra próxima série!");
      setActiveTimerId(null);
    }
    return () => clearInterval(interval);
  }, [activeTimerId, timeLeft]);

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
    setModalVideoVisible(true);
    setPlaying(true);
  };

  const iniciarModoTreino = () => {
    setTimerRunning(true);
    setModoTreinoVisible(true);
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

      let volumeTotal = 0;
      const exerciciosTreinados = todosTreinos[abaAtiva] || [];
      exerciciosTreinados.forEach((ex: any) => {
        if (ex.concluido && ex.carga && !isNaN(parseFloat(ex.carga))) {
           volumeTotal += parseFloat(ex.carga) * (parseInt(ex.series) || 1) * (parseInt(ex.reps) || 10);
        }
      });

      setTimerRunning(false);
      setModoTreinoVisible(false);

      const dadosTreino = {
        titulo: `FICHA ${abaAtiva}`,
        musculos: getMusculosDoDia(),
        tempo: formatElapsed(elapsedTime),
        volume: volumeTotal > 0 ? `${volumeTotal} kg` : 'N/A'
      };

      setElapsedTime(0); 
      
      Alert.alert("Treino Concluído! 🏆", "Bora mostrar esse shape pro mundo?", [
        { text: "Bora!", onPress: () => navigation.navigate('ResumoTreino', { treino: dadosTreino }) }
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar treino.");
    } finally {
      setSendingXP(false);
    }
  };

  const exerciciosAtuais = todosTreinos[abaAtiva] || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* TELA PRINCIPAL - RESUMO / PRÉ-TREINO */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Minha Ficha</Text>
          <Text style={styles.headerSubtitle}>Preparação para o combate</Text>
        </View>
        <View style={styles.mainTimerBox}>
           <Text style={styles.mainTimerText}>{formatElapsed(elapsedTime)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        
        {/* SELETOR SIMPLES DA FICHA */}
        <TouchableOpacity style={styles.workoutSelector} onPress={() => setDropdownVisible(true)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.workoutLabel}>FICHA SELECIONADA</Text>
            <Text style={styles.workoutSelectorTitle}>TREINO {abaAtiva}</Text>
            <Text style={styles.musculosTexto}>{getMusculosDoDia()}</Text>
          </View>
          <Ionicons name="chevron-down-circle" size={32} color="#3b82f6" />
        </TouchableOpacity>

        {/* LISTA DE EXERCÍCIOS PREVIEW */}
        <Text style={styles.previewTitle}>Exercícios de Hoje ({exerciciosAtuais.length}):</Text>
        {exerciciosAtuais.map((ex: any, index: number) => (
          <View key={ex.id} style={styles.previewCard}>
            <Text style={styles.previewIndex}>{index + 1}</Text>
            <View>
              <Text style={styles.previewName} numberOfLines={1}>{ex.nome}</Text>
              <Text style={styles.previewDetails}>{ex.series} séries • {ex.reps} reps</Text>
            </View>
            {ex.concluido && <Ionicons name="checkmark-circle" size={24} color="#22c55e" style={{ marginLeft: 'auto' }} />}
          </View>
        ))}

        <TouchableOpacity style={styles.startBigButton} onPress={iniciarModoTreino}>
          <Ionicons name="play" size={24} color="#000" />
          <Text style={styles.startBigButtonText}>INICIAR MODO TREINO</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      {/* 🚀 MODAL "TINDER" DOS EXERCÍCIOS (MODO TREINO) */}
      <Modal visible={modoTreinoVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.focusContainer}>
          
          <View style={styles.focusHeader}>
            <TouchableOpacity onPress={() => setModoTreinoVisible(false)} style={styles.minimizeBtn}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Minimizar</Text>
            </TouchableOpacity>
            
            <View style={styles.focusTimerBox}>
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
              <Text style={styles.focusTimerText}>{formatElapsed(elapsedTime)}</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            {exerciciosAtuais.map((ex: any, index: number) => (
              <View key={ex.id} style={styles.focusCardWrapper}>
                <View style={[styles.focusCard, ex.concluido && styles.focusCardDone]}>
                  
                  <View style={styles.focusCardHeader}>
                    <Text style={styles.focusCounter}>{index + 1} DE {exerciciosAtuais.length}</Text>
                    {/* 🚀 BOTÃO YOUTUBE FUNCIONANDO AQUI */}
                    {ex.videoId ? (
                      <TouchableOpacity onPress={() => openVideo(ex.videoId)}>
                        <Ionicons name="logo-youtube" size={38} color="#ef4444" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <Text style={styles.focusExName}>{ex.nome}</Text>
                  <Text style={styles.focusExMuscle}>{ex.musculo}</Text>

                  <View style={styles.focusStatsGrid}>
                    <View style={styles.focusStatBox}>
                      <Text style={styles.focusStatLabel}>SÉRIES</Text>
                      <Text style={styles.focusStatValue}>{ex.series}</Text>
                    </View>
                    <View style={styles.focusStatBox}>
                      <Text style={styles.focusStatLabel}>REPS</Text>
                      <Text style={styles.focusStatValue}>{ex.reps}</Text>
                    </View>
                    <View style={[styles.focusStatBox, {backgroundColor: '#27272a'}]}>
                      <Text style={styles.focusStatLabel}>CARGA (KG)</Text>
                      <TextInput
                        style={styles.focusInputCarga}
                        value={ex.carga}
                        onChangeText={(text) => updateCarga(ex.id, text)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#71717a"
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.focusRestBtn, activeTimerId === ex.id && styles.focusRestBtnActive]}
                    onPress={() => toggleTimer(ex.id, ex.descanso)}
                  >
                    <Ionicons name={activeTimerId === ex.id ? "timer" : "timer-outline"} size={24} color={activeTimerId === ex.id ? "#fff" : "#3b82f6"} />
                    <Text style={[styles.focusRestText, activeTimerId === ex.id && {color: '#fff'}]}>
                      {activeTimerId === ex.id ? `DESCANSO: ${formatTime(timeLeft)}` : `INICIAR DESCANSO (${ex.descanso}s)`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.focusDoneBtn, ex.concluido && styles.focusDoneBtnActive]}
                    onPress={() => toggleConcluido(ex.id)}
                  >
                    <Text style={[styles.focusDoneText, ex.concluido && {color: '#fff'}]}>
                      {ex.concluido ? "EXERCÍCIO FINALIZADO" : "MARCAR COMO FEITO"}
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            ))}

            <View style={styles.focusCardWrapper}>
              <View style={[styles.focusCard, {justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b'}]}>
                <Ionicons name="trophy" size={80} color="#eab308" style={{marginBottom: 20}} />
                <Text style={styles.focusExName}>Fim da Linha!</Text>
                <Text style={[styles.focusExMuscle, {textAlign: 'center', marginBottom: 40}]}>Você passou por todos os exercícios. Se já marcou todos como feitos, é hora de ganhar seu XP.</Text>
                
                <TouchableOpacity style={styles.finishBigBtn} onPress={processarXP}>
                  {sendingXP ? <ActivityIndicator color="#000" /> : <Text style={styles.finishBigBtnText}>FINALIZAR E SALVAR</Text>}
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* MODAL SELETOR DE FICHA */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownContent}>
            {Object.keys(todosTreinos).map((aba) => (
              <TouchableOpacity key={aba} style={styles.dropdownItem} onPress={() => { setAbaAtiva(aba); setDropdownVisible(false); }}>
                <Text style={[styles.dropdownItemText, abaAtiva === aba && {color: '#3b82f6', fontWeight: 'bold'}]}>Ficha {aba}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 📺 MODAL DO YOUTUBE */}
      <Modal visible={modalVideoVisible} transparent animationType="fade">
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModalContent}>
            <View style={styles.videoHeader}>
              <Text style={styles.videoTitle}>Execução do Movimento</Text>
              <TouchableOpacity onPress={() => { setModalVideoVisible(false); setPlaying(false); }}>
                <Ionicons name="close-circle" size={32} color="#71717a" />
              </TouchableOpacity>
            </View>
            
            <YoutubePlayer
              height={220}
              play={playing}
              videoId={currentVideoId}
              onChangeState={(event) => {
                if (event === "ended") setPlaying(false);
              }}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#71717a' },
  mainTimerBox: { alignItems: 'center', backgroundColor: '#18181b', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#27272a' },
  mainTimerText: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },

  list: { padding: 20 },
  workoutSelector: { backgroundColor: '#18181b', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#27272a' },
  workoutLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  workoutSelectorTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  musculosTexto: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold', marginTop: 2 },

  previewTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  previewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090b', padding: 15, borderRadius: 12, marginBottom: 10 },
  previewIndex: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold', marginRight: 15, width: 25 },
  previewName: { color: '#fff', fontSize: 16, fontWeight: 'bold', maxWidth: width * 0.5 },
  previewDetails: { color: '#71717a', fontSize: 12, marginTop: 2 },

  startBigButton: { backgroundColor: '#fff', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 10 },
  startBigButtonText: { color: '#000', fontSize: 18, fontWeight: '900' },

  dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  dropdownContent: { backgroundColor: '#18181b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 30 },
  dropdownItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  dropdownItemText: { color: '#fff', fontSize: 20, textAlign: 'center' },

  // MODO TREINO (TINDER)
  focusContainer: { flex: 1, backgroundColor: '#000' },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  minimizeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  focusTimerBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#18181b', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  focusTimerText: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  
  focusCardWrapper: { width: width, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  focusCard: { width: width * 0.9, height: height * 0.7, backgroundColor: '#18181b', borderRadius: 24, padding: 25, borderWidth: 1, borderColor: '#27272a', justifyContent: 'space-between' },
  focusCardDone: { borderColor: '#22c55e', backgroundColor: '#0f172a' },
  
  focusCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  focusCounter: { color: '#71717a', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  
  focusExName: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 36 },
  focusExMuscle: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 5, marginBottom: 25 },
  
  focusStatsGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  focusStatBox: { flex: 1, backgroundColor: '#09090b', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  focusStatLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  focusStatValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  focusInputCarga: { color: '#fff', fontSize: 28, fontWeight: 'bold', borderBottomWidth: 2, borderBottomColor: '#3b82f6', width: '80%', textAlign: 'center' },
  
  focusRestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#09090b', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#3b82f6', marginBottom: 15 },
  focusRestBtnActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  focusRestText: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold' },
  
  focusDoneBtn: { backgroundColor: '#27272a', padding: 20, borderRadius: 16, alignItems: 'center' },
  focusDoneBtnActive: { backgroundColor: '#22c55e' },
  focusDoneText: { color: '#a1a1aa', fontSize: 16, fontWeight: 'bold' },

  finishBigBtn: { backgroundColor: '#eab308', padding: 20, borderRadius: 16, width: '100%', alignItems: 'center' },
  finishBigBtnText: { color: '#000', fontSize: 18, fontWeight: '900' },

  // VÍDEO MODAL
  videoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  videoModalContent: { backgroundColor: '#18181b', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' },
  videoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  videoTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});