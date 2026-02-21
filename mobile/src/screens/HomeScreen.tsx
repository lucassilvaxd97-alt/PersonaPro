import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [msgVisivel, setMsgVisivel] = useState(true);

  // --- ESTADOS REAIS DO BANCO DE DADOS ---
  const [userData, setUserData] = useState({
    nome: "Atleta",
    foto: "https://github.com/shadcn.png",
    streak: 0, 
    msgProfessor: "Mantenha o foco! O Protocolo Caverna não perdoa falhas. 🦍",
    pesoAtual: "-- kg",
    pesoMeta: "-- kg"
  });

  const [resumoDia, setResumoDia] = useState({
    treinoNome: "Buscando ficha...",
    treinoFeito: false,
    caloriasConsumidas: 0,
    caloriasMeta: 2500,
    aguaTomada: 0, 
    aguaMeta: 10   
  });

  // --- BUSCAR DADOS NO BACKEND ---
  const fetchHomeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Puxa o perfil do aluno
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      // 2. Descobre qual ficha o treinador passou para ele
      const { data: linkData } = await supabase
        .from('student_trainer')
        .select('plan_name')
        .eq('student_id', user.id)
        .single();

      // 3. Verifica se ele já enviou XP hoje (Status do Card)
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('xp_logs')
        .select('id')
        .eq('student_id', user.id)
        .gte('created_at', `${today}T00:00:00Z`);

      const hasTrainedToday = logs && logs.length > 0;

      // Atualiza os estados
      setUserData(prev => ({
        ...prev,
        nome: profile?.full_name?.split(' ')[0] || "Atleta",
        foto: profile?.avatar_url || "https://github.com/shadcn.png"
      }));

      setResumoDia(prev => ({
        ...prev,
        treinoNome: linkData?.plan_name || "Nenhum treino vinculado",
        treinoFeito: hasTrainedToday
      }));

    } catch (error) {
      console.log("Erro ao carregar a Home:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchHomeData(); }, []));

  // --- NAVEGAÇÃO ---
 const irParaTreino = () => navigation.navigate('MainTabs', { screen: 'Treino' }); 
  const irParaDieta = () => navigation.navigate('Dieta');
  const irParaEvolucao = () => navigation.navigate('Evolução'); 

  // Cálculo de Progresso Visual
  const progressoCalorias = Math.min(resumoDia.caloriasConsumidas / resumoDia.caloriasMeta, 1);
  const progressoAgua = Math.min(resumoDia.aguaTomada / resumoDia.aguaMeta, 1);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image source={{ uri: userData.foto }} style={styles.profileImage} />
          <View>
            <Text style={styles.greeting}>Fala, {userData.nome}! 🦖</Text>
            <Text style={styles.subtitle}>Bora esmagar hoje?</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <View style={styles.notifBadge} /> 
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 1. MENSAGEM DO PROFESSOR */}
        {userData.msgProfessor && msgVisivel && (
          <View style={styles.alertCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Ionicons name="megaphone" size={24} color="#f59e0b" style={{marginRight: 10}} />
              <Text style={styles.alertText}>{userData.msgProfessor}</Text>
            </View>
            <TouchableOpacity onPress={() => setMsgVisivel(false)}>
              <Ionicons name="close" size={20} color="#71717a" />
            </TouchableOpacity>
          </View>
        )}

        {/* 2. OFENSIVA (STREAK) */}
        <View style={styles.streakContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="flame" size={20} color="#ef4444" />
            <Text style={styles.streakText}> {userData.streak} Dias de Foco Seguidos!</Text>
          </View>
        </View>

        {/* 3. HERO CARD: TREINO DO DIA (LINCADO COM BANCO) */}
        <Text style={styles.sectionTitle}>Treino de Hoje</Text>
        <TouchableOpacity style={styles.heroCard} activeOpacity={0.9} onPress={irParaTreino}>
          <LinearGradient
            colors={resumoDia.treinoFeito ? ['#064e3b', '#065f46'] : ['#1e3a8a', '#172554']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroHeader}>
              <View style={[styles.tagTreino, resumoDia.treinoFeito && {backgroundColor: '#10b981'}]}>
                <Text style={styles.tagText}>FICHA ATUAL</Text>
              </View>
              <View style={styles.timeTag}>
                <Ionicons name="barbell-outline" size={14} color="#bfdbfe" />
                <Text style={styles.timeText}>O Protocolo</Text>
              </View>
            </View>

            <Text style={styles.heroTitle} numberOfLines={1}>{resumoDia.treinoNome}</Text>
            
            <View style={styles.heroFooter}>
              <Text style={[styles.heroStatus, resumoDia.treinoFeito && {color: '#6ee7b7'}]}>
                {resumoDia.treinoFeito ? "Treino Computado ✅" : "Toque para Iniciar ▶"}
              </Text>
              {!resumoDia.treinoFeito && (
                <Ionicons name="arrow-forward-circle" size={32} color="#fff" />
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 4. WIDGETS: DIETA E ÁGUA */}
        <View style={styles.widgetsRow}>
          <TouchableOpacity style={styles.widgetCard} onPress={irParaDieta}>
            <View style={styles.widgetHeader}>
              <Ionicons name="nutrition" size={20} color="#10b981" />
              <Text style={styles.widgetTitle}>Dieta</Text>
            </View>
            <Text style={styles.widgetValue}>{resumoDia.caloriasMeta - resumoDia.caloriasConsumidas}</Text>
            <Text style={styles.widgetLabel}>kcal restantes</Text>
            <View style={styles.miniProgressBg}>
              <View style={[styles.miniProgressFill, {width: `${progressoCalorias * 100}%`, backgroundColor: '#10b981'}]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.widgetCard} onPress={irParaDieta}>
            <View style={styles.widgetHeader}>
              <Ionicons name="water" size={20} color="#3b82f6" />
              <Text style={styles.widgetTitle}>Água</Text>
            </View>
            <Text style={styles.widgetValue}>{resumoDia.aguaTomada}/{resumoDia.aguaMeta}</Text>
            <Text style={styles.widgetLabel}>copos hoje</Text>
            <View style={styles.miniProgressBg}>
              <View style={[styles.miniProgressFill, {width: `${progressoAgua * 100}%`, backgroundColor: '#3b82f6'}]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. CARD DE EVOLUÇÃO */}
        <Text style={styles.sectionTitle}>Meu Progresso</Text>
        <TouchableOpacity style={styles.evoCard} activeOpacity={0.9} onPress={irParaEvolucao}>
          <LinearGradient
            colors={['#4c1d95', '#581c87']} 
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.evoGradient}
          >
            <View style={styles.evoContent}>
              <View style={styles.evoIconBg}>
                <Ionicons name="body" size={24} color="#d8b4fe" />
              </View>
              <View>
                <Text style={styles.evoTitle}>Comparativo Físico</Text>
                <Text style={styles.evoSubtitle}>
                  Atual: <Text style={{color:'#fff'}}>{userData.pesoAtual}</Text> • Meta: <Text style={{color:'#fff'}}>{userData.pesoMeta}</Text>
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#d8b4fe" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15, borderWidth: 2, borderColor: '#3b82f6' },
  greeting: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#a1a1aa', fontSize: 14 },
  notifButton: { padding: 8, backgroundColor: '#18181b', borderRadius: 12, borderWidth: 1, borderColor: '#27272a' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  content: { paddingHorizontal: 20 },
  alertCard: { flexDirection: 'row', backgroundColor: '#451a03', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#f59e0b', alignItems: 'flex-start' },
  alertText: { color: '#fbbf24', fontSize: 13, flex: 1, paddingRight: 10, fontWeight: '500' },
  streakContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181b', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 50, marginBottom: 25, borderWidth: 1, borderColor: '#27272a' },
  streakText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  heroCard: { height: 160, borderRadius: 24, marginBottom: 25, overflow: 'hidden' },
  heroGradient: { flex: 1, padding: 20, justifyContent: 'space-between' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tagTreino: { backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timeText: { color: '#bfdbfe', fontSize: 12 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatus: { color: '#bfdbfe', fontSize: 14, fontWeight: 'bold' },
  widgetsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  widgetCard: { flex: 1, backgroundColor: '#18181b', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#27272a' },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  widgetTitle: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  widgetValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  widgetLabel: { color: '#52525b', fontSize: 12, marginBottom: 10 },
  miniProgressBg: { height: 4, backgroundColor: '#27272a', borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  evoCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  evoGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  evoContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  evoIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  evoTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  evoSubtitle: { color: '#d8b4fe', fontSize: 13, marginTop: 2 }
});