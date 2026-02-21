import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, TextInput, StatusBar, Image, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function TrainerRankingScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [pendingXP, setPendingXP] = useState<any[]>([]);
  const [monthlyRanking, setMonthlyRanking] = useState<any[]>([]);
  const [challengeRanking, setChallengeRanking] = useState<any[]>([]);
  const [activeCompetition, setActiveCompetition] = useState<any>(null);

  // Controle de Abas (Agora com 'aprovar')
  const [activeTab, setActiveTab] = useState<'aprovar' | 'mes' | 'desafio'>('mes');

  // Modal Novo Desafio
  const [modalVisible, setModalVisible] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [challengeDays, setChallengeDays] = useState<number>(30);
  const [creating, setCreating] = useState(false);

  // --- BUSCA DE DADOS ---
  const fetchRankingData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca XP Pendente
      const { data: pending } = await supabase
        .from('xp_logs')
        .select(`id, amount, created_at, student:profiles!student_id(id, full_name, avatar_url)`)
        .eq('trainer_id', user.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });
      
      setPendingXP(pending || []);

      // 2. Busca Desafio Ativo
      const { data: comp } = await supabase
        .from('competitions')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('is_active', true)
        .single();
      
      setActiveCompetition(comp);

      // 3. Busca TODO o XP aprovado do treinador (Para matemática)
      const { data: allApproved } = await supabase
        .from('xp_logs')
        .select(`amount, created_at, student:profiles!student_id(id, full_name, avatar_url)`)
        .eq('trainer_id', user.id)
        .eq('status', 'aprovado');

      if (allApproved) {
        // --- Matemática do Mês Atual ---
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthlyLogs = allApproved.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= firstDayOfMonth && logDate <= lastDayOfMonth;
        });
        setMonthlyRanking(aggregateXP(monthlyLogs));

        // --- Matemática do Desafio ---
        if (comp) {
          const start = new Date(comp.start_date);
          const end = new Date(comp.end_date);
          const challengeLogs = allApproved.filter(log => {
            const logDate = new Date(log.created_at);
            return logDate >= start && logDate <= end;
          });
          setChallengeRanking(aggregateXP(challengeLogs));
        }
      }

    } catch (error) {
      console.log("Erro ao buscar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchRankingData(); }, []));

  const aggregateXP = (logs: any[]) => {
    const map: any = {};
    logs.forEach(log => {
      const student = Array.isArray(log.student) ? log.student[0] : log.student;
      if (!student) return;

      const sId = student.id;
      if (!map[sId]) {
        map[sId] = { id: sId, name: student.full_name, avatar: student.avatar_url, xp: 0 };
      }
      map[sId].xp += log.amount;
    });
    return Object.values(map).sort((a: any, b: any) => b.xp - a.xp);
  };

  // --- AÇÕES DO TREINADOR ---
  const handleReviewXP = async (logId: string, status: 'aprovado' | 'recusado') => {
    try {
      await supabase.from('xp_logs').update({ status }).eq('id', logId);
      
      // Remove da lista pendente localmente para ficar mais rápido na tela, depois recarrega
      setPendingXP(prev => prev.filter(item => item.id !== logId));
      fetchRankingData(); 
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o XP.");
    }
  };

  const handleCreateChallenge = async () => {
    if (!challengeName) return Alert.alert("Atenção", "Dê um nome ao desafio!");
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + challengeDays);

      if (activeCompetition) {
        await supabase.from('competitions').update({ is_active: false }).eq('id', activeCompetition.id);
      }

      const { error } = await supabase.from('competitions').insert({
        trainer_id: user?.id,
        name: challengeName,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        is_active: true
      });

      if (error) throw error;
      Alert.alert("Sucesso! 🔥", "O desafio começou. XP valendo a partir de AGORA!");
      setModalVisible(false);
      setChallengeName('');
      setActiveTab('desafio');
      fetchRankingData();
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar desafio.");
    } finally {
      setCreating(false);
    }
  };

  const handleEndChallenge = () => {
    Alert.alert("Encerrar Desafio", "Tem certeza? O ranking vai ser congelado.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Encerrar", style: "destructive", onPress: async () => {
        await supabase.from('competitions').update({ is_active: false }).eq('id', activeCompetition.id);
        setActiveTab('mes');
        fetchRankingData();
      }}
    ]);
  };

  // Renderizador do Ranking
  const renderRankingItem = ({ item, index }: any) => {
    let positionColor = '#27272a'; 
    let positionText = '#fff';
    if (index === 0) { positionColor = '#fbbf24'; positionText = '#000'; } 
    if (index === 1) { positionColor = '#94a3b8'; positionText = '#000'; } 
    if (index === 2) { positionColor = '#b45309'; positionText = '#fff'; } 

    return (
      <View key={item.id} style={styles.rankingCard}>
        <View style={[styles.positionBadge, { backgroundColor: positionColor }]}>
          <Text style={[styles.positionText, { color: positionText }]}>{index + 1}º</Text>
        </View>
        
        <View style={styles.avatarBox}>
          {item.avatar ? (
             <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
             <Text style={styles.avatarLetter}>{item.name ? item.name.charAt(0) : 'A'}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.studentName}>{item.name}</Text>
        </View>

        <View style={styles.xpBox}>
          <Text style={styles.xpText}>{item.xp}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>
    );
  };

  const currentList = activeTab === 'mes' ? monthlyRanking : challengeRanking;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GAMIFICAÇÃO & RANKING</Text>
      </View>

      {/* 3 ABAS AGORA */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'aprovar' && styles.tabActive]} onPress={() => setActiveTab('aprovar')}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={[styles.tabText, activeTab === 'aprovar' && {color: '#fff'}]}>APROVAR</Text>
            {pendingXP.length > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingXP.length}</Text></View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tab, activeTab === 'mes' && styles.tabActive]} onPress={() => setActiveTab('mes')}>
          <Text style={[styles.tabText, activeTab === 'mes' && {color: '#fff'}]}>MÊS ATUAL</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tab, activeTab === 'desafio' && styles.tabActive]} onPress={() => setActiveTab('desafio')}>
          <Text style={[styles.tabText, activeTab === 'desafio' && {color: '#fff'}]}>DESAFIO</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* CONTEÚDO DA ABA: APROVAR */}
        {activeTab === 'aprovar' && (
          <View style={{paddingHorizontal: 20}}>
            {pendingXP.length === 0 ? (
               <View style={styles.emptyState}>
                 <Ionicons name="checkmark-done-circle-outline" size={60} color="#27272a" />
                 <Text style={styles.emptyText}>Tudo em dia! Nenhum XP pendente.</Text>
               </View>
            ) : (
              pendingXP.map(log => {
                const student = Array.isArray(log.student) ? log.student[0] : log.student;
                return (
                  <View key={log.id} style={styles.pendingRowCard}>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName}>{student?.full_name}</Text>
                      <Text style={styles.pendingDesc}>Concluiu um treino</Text>
                    </View>
                    <Text style={styles.pendingXPText}>+{log.amount} XP</Text>
                    
                    <View style={styles.pendingBtnGroup}>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReviewXP(log.id, 'recusado')}>
                        <Ionicons name="close" size={20} color="#ef4444" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => handleReviewXP(log.id, 'aprovado')}>
                        <Ionicons name="checkmark" size={20} color="#10b981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}

        {/* CONTEÚDO DA ABA: RANKINGS (MÊS E DESAFIO) */}
        {(activeTab === 'mes' || activeTab === 'desafio') && (
          <View>
            {activeTab === 'desafio' && (
              <View style={styles.challengeBanner}>
                {activeCompetition ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <View>
                      <Text style={styles.challengeName}>{activeCompetition.name}</Text>
                      <Text style={styles.challengeStatus}>🔥 Valendo XP!</Text>
                    </View>
                    <TouchableOpacity style={styles.endBtn} onPress={handleEndChallenge}>
                      <Text style={styles.endBtnText}>Encerrar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{alignItems: 'center'}}>
                    <Text style={styles.noChallengeText}>Nenhum desafio rolando.</Text>
                    <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                      <Ionicons name="trophy" size={18} color="#000" style={{marginRight: 8}}/>
                      <Text style={styles.createBtnText}>CRIAR COMPETIÇÃO</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {loading ? (
              <ActivityIndicator color="#4f46e5" size="large" style={{marginTop: 50}} />
            ) : (
              <View style={{paddingHorizontal: 20}}>
                 {currentList.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="podium-outline" size={60} color="#27272a" />
                      <Text style={styles.emptyText}>Ninguém pontuou ainda.</Text>
                    </View>
                 ) : (
                    currentList.map((item, index) => renderRankingItem({item, index}))
                 )}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* MODAL CRIAR DESAFIO */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Desafio 🏆</Text>
            <Text style={styles.modalSub}>Inicie uma nova corrida de XP. O ranking de quem pontuar nesse período será separado.</Text>
            
            <Text style={styles.inputLabel}>NOME DO DESAFIO</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Seca Caverna 30 Dias" 
              placeholderTextColor="#52525b"
              value={challengeName}
              onChangeText={setChallengeName}
            />

            <Text style={styles.inputLabel}>DURAÇÃO</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 25}}>
               {[30, 60, 90].map(dias => (
                 <TouchableOpacity 
                   key={dias} 
                   style={[styles.dayCard, challengeDays === dias && styles.dayCardActive]}
                   onPress={() => setChallengeDays(dias)}
                 >
                    <Text style={[styles.dayText, challengeDays === dias && {color: '#fff'}]}>{dias} Dias</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <View style={{flexDirection: 'row', gap: 15}}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateChallenge} disabled={creating}>
                {creating ? <ActivityIndicator color="#000"/> : <Text style={styles.confirmText}>LANÇAR DESAFIO</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#09090b', borderBottomWidth: 1, borderColor: '#18181b' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },

  // ABAS
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: '#18181b' },
  tabActive: { borderColor: '#4f46e5' },
  tabText: { color: '#71717a', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // LINHA DE APROVAÇÃO (NOVO LAYOUT VERTICAL)
  pendingRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272a' },
  pendingInfo: { flex: 1 },
  pendingName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  pendingDesc: { color: '#a1a1aa', fontSize: 12, marginTop: 2 },
  pendingXPText: { color: '#f59e0b', fontSize: 18, fontWeight: '900', marginRight: 15 },
  pendingBtnGroup: { flexDirection: 'row', gap: 8 },
  rejectBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' },
  acceptBtn: { padding: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#10b981' },

  // BANNER DESAFIO
  challengeBanner: { marginHorizontal: 20, marginBottom: 20, padding: 20, backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: 16, borderWidth: 1, borderColor: '#4f46e5' },
  challengeName: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  challengeStatus: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  endBtn: { backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  endBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  noChallengeText: { color: '#a1a1aa', marginBottom: 15 },
  createBtn: { flexDirection: 'row', backgroundColor: '#fbbf24', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: '#000', fontWeight: '900' },

  // RANKING CARD
  rankingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#27272a' },
  positionBadge: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  positionText: { fontWeight: '900', fontSize: 14 },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarLetter: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  studentName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  xpBox: { alignItems: 'flex-end' },
  xpText: { color: '#4f46e5', fontSize: 20, fontWeight: '900' },
  xpLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { color: '#71717a', marginTop: 10 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#18181b', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#27272a' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 5 },
  modalSub: { color: '#a1a1aa', fontSize: 12, marginBottom: 25 },
  inputLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  input: { backgroundColor: '#09090b', color: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', marginBottom: 20 },
  dayCard: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', alignItems: 'center' },
  dayCardActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  dayText: { color: '#71717a', fontWeight: 'bold' },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#27272a', borderRadius: 12 },
  cancelText: { color: '#fff', fontWeight: 'bold' },
  confirmBtn: { flex: 2, padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbbf24', borderRadius: 12 },
  confirmText: { color: '#000', fontWeight: '900' },
});