import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Dimensions, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function TrainerHomeScreen({ navigation }: any) {
  // Dados
  const [students, setStudents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [trainerProfile, setTrainerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal Aluno
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [trainingMode, setTrainingMode] = useState<'custom' | 'template' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);

  // Modal Aviso Geral
  const [announceModalVisible, setAnnounceModalVisible] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [savingAnnounce, setSavingAnnounce] = useState(false);

  // --- BUSCAR DADOS ---
  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Perfil do Treinador (Foto + Aviso Atual)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setTrainerProfile(profile);
      if (profile?.announcement) setAnnouncementText(profile.announcement);

      // 2. Alunos
      const { data: studentsData } = await supabase
        .from('student_trainer')
        .select(`
          id, status, plan_name, nickname,
          student:profiles!student_id (email, full_name, avatar_url)
        `)
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false });

      setStudents(studentsData || []);

      // 3. Templates
      const { data: templatesData } = await supabase
        .from('workout_templates')
        .select('id, name, category')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false });
      
      setTemplates(templatesData || []);

    } catch (error: any) {
      console.error('Erro:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, []);

  // --- SALVAR AVISO GERAL ---
  const handleSaveAnnouncement = async () => {
    if (!trainerProfile?.id) return;
    setSavingAnnounce(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ announcement: announcementText })
        .eq('id', trainerProfile.id);

      if (error) throw error;
      
      Alert.alert("Enviado! 📢", "O aviso aparecerá no topo do app dos alunos.");
      setAnnounceModalVisible(false);
      fetchData(); // Atualiza local
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar aviso.");
    } finally {
      setSavingAnnounce(false);
    }
  };

  // --- VINCULAR ALUNO ---
  const handleAddStudent = async () => {
    if (!newEmail || !trainingMode) return;
    if (trainingMode === 'template' && !selectedTemplate) {
      Alert.alert("Atenção", "Selecione um template.");
      return;
    }
    setSavingStudent(true);
    try {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newEmail.toLowerCase().trim())
        .single();

      if (!studentProfile) {
        Alert.alert("Não encontrado", "Aluno precisa criar conta no app primeiro.");
        setSavingStudent(false);
        return;
      }

      let finalPlanName = "Personalizado";
      if (trainingMode === 'template' && selectedTemplate) finalPlanName = selectedTemplate.name;

      const { error } = await supabase.from('student_trainer').insert({
          trainer_id: trainerProfile.id,
          student_id: studentProfile.id,
          status: 'active',
          plan_name: finalPlanName,
          nickname: newName
        });

      if (error) throw error;
      Alert.alert("Sucesso!", "Aluno vinculado.");
      setStudentModalVisible(false);
      setNewName(''); setNewEmail(''); setTrainingMode(null); setSelectedTemplate(null);
      fetchData(); 
    } catch (error) {
      Alert.alert("Erro", "Falha ao vincular.");
    } finally {
      setSavingStudent(false);
    }
  };

  const activeStudents = students.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* HEADER TECH */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>PAINEL DE COMANDO</Text>
          <Text style={styles.profName}>
            {trainerProfile?.full_name ? trainerProfile.full_name.toUpperCase() : 'TREINADOR'}
          </Text>
          {/* Badge Online */}
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>ONLINE</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Config')}>
          <View style={styles.avatarContainer}>
             {trainerProfile?.avatar_url ? (
               <Image source={{ uri: trainerProfile.avatar_url }} style={styles.avatarImage} />
             ) : (
               <Ionicons name="person" size={24} color="#fff" />
             )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
        
        {/* AVISO GERAL WIDGET */}
        <TouchableOpacity style={styles.announceCard} onPress={() => setAnnounceModalVisible(true)}>
          <View style={styles.announceIcon}>
            <Ionicons name="megaphone" size={22} color="#000" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.announceTitle}>MURAL DE AVISOS</Text>
            <Text numberOfLines={1} style={styles.announceText}>
              {trainerProfile?.announcement || "Nenhum aviso ativo. Toque para escrever..."}
            </Text>
          </View>
          <View style={styles.editBadge}><Ionicons name="pencil" size={12} color="#fff" /></View>
        </TouchableOpacity>

        {/* STATS */}
        <ScrollView horizontal style={styles.statsScroll} contentContainerStyle={{gap: 12, paddingRight: 20}} showsHorizontalScrollIndicator={false}>
          <StatCard label="Alunos" value={activeStudents.toString()} icon="people" color="#3b82f6" />
          <StatCard label="Receita" value={`R$ ${activeStudents * 150}`} icon="cash" color="#10b981" />
          <StatCard label="Biblioteca" value={templates.length.toString()} icon="layers" color="#8b5cf6" />
        </ScrollView>

        {/* --- AÇÕES RÁPIDAS (AGORA COM OS 3 BOTÕES) --- */}
        <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>
        <View style={styles.actionGrid}>
          
          <TouchableOpacity style={[styles.actionCard, { borderColor: '#3b82f6' }]} onPress={() => setStudentModalVisible(true)}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}><Ionicons name="person-add" size={22} color="#3b82f6" /></View>
            <Text style={styles.actionTitle}>Aluno</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionCard, { borderColor: '#8b5cf6' }]} onPress={() => navigation.navigate('Biblioteca')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}><Ionicons name="layers" size={22} color="#8b5cf6" /></View>
            <Text style={styles.actionTitle}>Treino</Text>
          </TouchableOpacity>

          {/* NOVO BOTÃO DE DIETA */}
          <TouchableOpacity style={[styles.actionCard, { borderColor: '#10b981' }]} onPress={() => navigation.navigate('TrainerDietLibrary')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}><Ionicons name="restaurant" size={22} color="#10b981" /></View>
            <Text style={styles.actionTitle}>Dieta</Text>
          </TouchableOpacity>

        </View>

        {/* LISTA DE ALUNOS */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>LISTA DE ATLETAS ({activeStudents})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Alunos')}><Text style={styles.seeAll}>VER TODOS</Text></TouchableOpacity>
        </View>
        
        {students.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Sem alunos ativos.</Text></View>
        ) : (
          students.map((item) => {
            const studentData = item.student || {};
            const displayName = item.nickname || studentData.full_name || 'Aluno';
            return (
              <View key={item.id} style={styles.studentRow}>
                <View style={[styles.studentAvatarSmall, { borderColor: item.status === 'active' ? '#10b981' : '#71717a' }]}>
                  {studentData.avatar_url ? (
                    <Image source={{ uri: studentData.avatar_url }} style={{width: 32, height: 32, borderRadius: 16}} />
                  ) : (
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>{displayName.charAt(0)}</Text>
                  )}
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.rowName}>{displayName}</Text>
                  <Text style={styles.rowInfo}>{item.plan_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#52525b" />
              </View>
            );
          })
        )}
      </ScrollView>

      {/* --- MODAL 1: AVISO GERAL --- */}
      <Modal visible={announceModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📢 Comunicado Geral</Text>
              <TouchableOpacity onPress={() => setAnnounceModalVisible(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Isso aparecerá no topo da tela de TODOS os seus alunos.</Text>
            
            <TextInput 
              style={styles.textArea} 
              multiline 
              numberOfLines={4} 
              placeholder="Ex: Galera, feriado a academia fecha!" 
              placeholderTextColor="#52525b"
              value={announcementText}
              onChangeText={setAnnouncementText}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAnnouncement} disabled={savingAnnounce}>
              {savingAnnounce ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>ENVIAR COMUNICADO</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL 2: VINCULAR ALUNO --- */}
      <Modal visible={studentModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vincular Novo Aluno</Text>
              <TouchableOpacity onPress={() => setStudentModalVisible(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            
            <ScrollView>
              <Text style={styles.inputLabel}>E-MAIL DO ALUNO</Text>
              <TextInput style={styles.input} placeholder="email@exemplo.com" placeholderTextColor="#52525b" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" />
              
              <Text style={styles.inputLabel}>APELIDO (Opcional)</Text>
              <TextInput style={styles.input} placeholder="Ex: Carlinhos Monstro" placeholderTextColor="#52525b" value={newName} onChangeText={setNewName} />

              <Text style={styles.inputLabel}>TIPO DE TREINO</Text>
              <View style={styles.strategyRow}>
                <TouchableOpacity style={[styles.strategyCard, trainingMode === 'custom' && styles.strategyActive]} onPress={() => setTrainingMode('custom')}>
                  <Text style={[styles.strategyText, trainingMode === 'custom' && {color: '#fff'}]}>Começar do Zero</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.strategyCard, trainingMode === 'template' && styles.strategyActive]} onPress={() => setTrainingMode('template')}>
                  <Text style={[styles.strategyText, trainingMode === 'template' && {color: '#fff'}]}>Usar Template</Text>
                </TouchableOpacity>
                
              </View>

              {trainingMode === 'template' && (
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                    {templates.map(t => (
                      <TouchableOpacity key={t.id} style={[styles.chip, selectedTemplate?.id === t.id && styles.chipActive]} onPress={() => setSelectedTemplate(t)}>
                        <Text style={[styles.chipText, selectedTemplate?.id === t.id && {color: '#fff'}]}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                 </ScrollView>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddStudent} disabled={savingStudent}>
                {savingStudent ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>VINCULAR AGORA</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// Estilos
const StatCard = ({ label, value, icon, color }: any) => (
  <View style={[styles.statBox, { borderTopColor: color }]}>
    <View style={styles.statHeader}><Ionicons name={icon} size={16} color={color} /><Text style={styles.statValue}>{value}</Text></View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  
  // HEADER TECH
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerInfo: { flex: 1 },
  greeting: { color: '#71717a', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  profName: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 4, shadowColor: '#10b981', shadowOpacity: 1, shadowRadius: 5 },
  onlineText: { color: '#10b981', fontSize: 9, fontWeight: 'bold' },

  // AVATAR TECH
  avatarContainer: { 
    width: 54, height: 54, borderRadius: 27, 
    borderWidth: 2, borderColor: '#3b82f6', 
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181b',
    shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },

  // AVISO GERAL
  announceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fbbf24', padding: 12, borderRadius: 12, marginBottom: 25, shadowColor: '#fbbf24', shadowOpacity: 0.2, shadowRadius: 5 },
  announceIcon: { backgroundColor: '#fff', padding: 8, borderRadius: 8, marginRight: 12 },
  announceTitle: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  announceText: { color: '#000', fontSize: 13, fontWeight: 'bold', width: '85%' },
  editBadge: { backgroundColor: '#000', padding: 4, borderRadius: 4, marginLeft: 'auto' },

  // STATS
  statsScroll: { marginBottom: 30, flexGrow: 0 },
  statBox: { width: 110, backgroundColor: '#18181b', padding: 12, borderRadius: 12, borderTopWidth: 3, marginRight: 10 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold' },

  // LISTAS & MODAIS
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAll: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  
  // AÇÕES RÁPIDAS (Atualizado para caberem 3 itens)
  actionGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  actionCard: { flex: 1, backgroundColor: '#18181b', paddingVertical: 14, paddingHorizontal: 5, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  actionIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },

  studentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090b', padding: 12, borderRadius: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#18181b' },
  studentAvatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, overflow: 'hidden' },
  rowName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  rowInfo: { color: '#52525b', fontSize: 11 },
  emptyState: { alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#52525b', fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181b', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalSub: { color: '#71717a', fontSize: 12, marginBottom: 20 },
  textArea: { backgroundColor: '#09090b', color: '#fff', padding: 15, borderRadius: 12, height: 100, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#27272a' },
  input: { backgroundColor: '#09090b', color: '#fff', padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#27272a' },
  inputLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  strategyRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  strategyCard: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', alignItems: 'center' },
  strategyActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  strategyText: { color: '#71717a', fontSize: 12, fontWeight: 'bold' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', marginRight: 8 },
  chipActive: { borderColor: '#3b82f6', backgroundColor: '#3b82f6' },
  chipText: { color: '#71717a', fontSize: 12 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});