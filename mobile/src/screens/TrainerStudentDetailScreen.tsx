import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Alert, Modal, ActivityIndicator, StatusBar, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function TrainerStudentDetailScreen({ route, navigation }: any) {
  const { studentId } = route.params;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Controle de Modais
  const [strategyModalVisible, setStrategyModalVisible] = useState(false);
  const [strategyMode, setStrategyMode] = useState<'selection' | 'template'>('selection');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [savingStrategy, setSavingStrategy] = useState(false);

  // --- ESTADOS PARA EDIÇÃO DE PERFIL ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    weight: '',
    body_fat: '',
    objective: '',
    restrictions: '',
    internal_notes: ''
  });

  // --- BUSCAR DADOS ---
  const fetchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('student_trainer')
        .select(`*, student:profiles!student_id (*)`)
        .eq('student_id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);

      // Preenche o formulário com os dados que estão na SUA FICHA (student_trainer)
      setEditForm({
        weight: data.weight?.toString() || '',
        body_fat: data.body_fat?.toString() || '',
        objective: data.objective || '',
        restrictions: data.restrictions || '',
        internal_notes: data.internal_notes || ''
      });

      const { data: tmps } = await supabase
        .from('workout_templates')
        .select('id, name')
        .eq('trainer_id', data.trainer_id);
      
      setTemplates(tmps || []);

    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível carregar o aluno.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDetails(); }, []));

  // --- SALVAR EDIÇÃO DO PERFIL ---
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // Salva TUDO direto na tabela de vínculo (onde o professor tem permissão total)
      // O ".replace(',', '.')" garante que se você digitar 80,5 ele salve direitinho no banco
      const { error } = await supabase.from('student_trainer').update({
        weight: editForm.weight ? parseFloat(editForm.weight.replace(',', '.')) : null,
        body_fat: editForm.body_fat ? parseFloat(editForm.body_fat.replace(',', '.')) : null,
        objective: editForm.objective,
        restrictions: editForm.restrictions,
        internal_notes: editForm.internal_notes
      }).eq('student_id', studentId);

      if (error) throw error;

      Alert.alert("Sucesso! 🦖", "Dados do aluno atualizados.");
      setEditModalVisible(false);
      fetchDetails(); // Recarrega a tela para mostrar os dados novos
    } catch (error: any) {
      Alert.alert("Erro ao salvar", error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // --- AÇÕES DE ESTRATÉGIA ---
  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    setSavingStrategy(true);
    try {
      const { error } = await supabase.from('student_trainer').update({ plan_name: selectedTemplate.name }).eq('student_id', studentId);
      if (error) throw error;
      Alert.alert("Sucesso!", `Template "${selectedTemplate.name}" aplicado.`);
      setStrategyModalVisible(false);
      fetchDetails(); 
    } catch (error) { Alert.alert("Erro", "Falha ao aplicar template."); } 
    finally { setSavingStrategy(false); }
  };

  const handleSetCustom = async () => {
    setSavingStrategy(true);
    try {
      const { error } = await supabase.from('student_trainer').update({ plan_name: 'Personalizado' }).eq('student_id', studentId);
      if (error) throw error;
      Alert.alert("Modo Personalizado", "Agora você pode montar o treino do zero.");
      setStrategyModalVisible(false);
      fetchDetails();
    } catch (error) { Alert.alert("Erro", "Falha ao definir modo personalizado."); } 
    finally { setSavingStrategy(false); }
  };

  const handleUnlink = () => {
    Alert.alert("Desvincular Aluno", "Tem certeza? Ele perderá o acesso aos seus treinos.", [
      { text: "Cancelar" },
      { text: "Sim, remover", style: 'destructive', onPress: async () => {
          await supabase.from('student_trainer').delete().eq('student_id', studentId);
          navigation.goBack();
      }}
    ]);
  };

  if (loading) return <View style={styles.loadingBox}><ActivityIndicator color="#3b82f6" /></View>;

  const profile = student?.student || {};
  const hasRestriction = student?.restrictions && student.restrictions.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FICHA TÉCNICA</Text>
        
        {/* BOTÃO DE EDITAR */}
        <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editBtnTop}>
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* PERFIL */}
        <View style={styles.profileCard}>
          <Image source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          <View>
            <Text style={styles.name}>{student.nickname || profile.full_name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <View style={styles.statusBadge}>
               <View style={styles.dot} />
               <Text style={styles.statusText}>ATIVO</Text>
            </View>
          </View>
        </View>

        {/* STATS (Puxando de 'student' e não mais de 'profile') */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>PESO</Text>
            <Text style={styles.statValue}>{student.weight ? `${student.weight}kg` : '--'}</Text> 
          </View>
          <View style={[styles.statItem, {borderLeftWidth:1, borderRightWidth:1, borderColor:'#27272a'}]}>
            <Text style={styles.statLabel}>GORDURA</Text>
            <Text style={styles.statValue}>{student.body_fat ? `${student.body_fat}%` : '--'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>OBJETIVO</Text>
            <Text style={styles.statValue}>{student.objective || '--'}</Text>
          </View>
        </View>

        {/* ALERTA DE RESTRIÇÃO MÉDICA */}
        {hasRestriction && (
          <View style={styles.alertBox}>
            <View style={{flexDirection:'row', alignItems:'center', marginBottom: 5}}>
              <Ionicons name="medkit" size={18} color="#ef4444" />
              <Text style={styles.alertTitle}>RESTRIÇÃO MÉDICA</Text>
            </View>
            <Text style={styles.alertText}>{student.restrictions}</Text>
          </View>
        )}

        {/* ANOTAÇÕES SECRETAS */}
        {student.internal_notes ? (
          <View style={styles.notesBox}>
            <View style={{flexDirection:'row', alignItems:'center', marginBottom: 5}}>
              <Ionicons name="lock-closed" size={14} color="#f59e0b" />
              <Text style={styles.notesTitle}>OBSERVAÇÕES INTERNAS (PRIVADO)</Text>
            </View>
            <Text style={styles.notesText}>{student.internal_notes}</Text>
          </View>
        ) : null}

        {/* ESTRATÉGIA ATUAL */}
        <Text style={styles.sectionTitle}>ESTRATÉGIA ATUAL</Text>
        <View style={styles.planCard}>
          <View style={{flex:1}}>
             <Text style={styles.planLabel}>TREINO VIGENTE</Text>
             <Text style={styles.planName}>{student.plan_name || 'Nenhum'}</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={() => { setStrategyMode('selection'); setStrategyModalVisible(true); }}>
             <Text style={styles.changeBtnText}>ALTERAR</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.unlinkBtn} onPress={handleUnlink}>
          <Text style={styles.unlinkText}>Desvincular Aluno</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- MODAL DE EDITAR INFORMAÇÕES DO ALUNO --- */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Editar Aluno</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peso (kg)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={editForm.weight} onChangeText={t => setEditForm({...editForm, weight: t})} placeholder="Ex: 80,5" placeholderTextColor="#52525b" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gordura (%)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={editForm.body_fat} onChangeText={t => setEditForm({...editForm, body_fat: t})} placeholder="Ex: 15" placeholderTextColor="#52525b" />
                </View>
              </View>

              <Text style={styles.inputLabel}>Objetivo Principal</Text>
              <TextInput style={styles.input} value={editForm.objective} onChangeText={t => setEditForm({...editForm, objective: t})} placeholder="Ex: Hipertrofia, Emagrecimento..." placeholderTextColor="#52525b" />

              <Text style={[styles.inputLabel, {color: '#ef4444'}]}>Restrições Médicas / Lesões</Text>
              <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline value={editForm.restrictions} onChangeText={t => setEditForm({...editForm, restrictions: t})} placeholder="Ex: Hérnia lombar, evitar sobrecarga axial." placeholderTextColor="#52525b" />

              <Text style={[styles.inputLabel, {color: '#f59e0b'}]}>Anotações Internas (Só você vê 🔒)</Text>
              <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top', borderColor: '#f59e0b', borderWidth: 1}]} multiline value={editForm.internal_notes} onChangeText={t => setEditForm({...editForm, internal_notes: t})} placeholder="Anotações privadas sobre o aluno..." placeholderTextColor="#52525b" />

              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#fff"/> : <Text style={styles.confirmText}>SALVAR INFORMAÇÕES</Text>}
              </TouchableOpacity>
            </ScrollView>

          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL ESTRATÉGIA --- */}
      <Modal visible={strategyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlayDark}>
          <View style={styles.modalContentBox}>
            <Text style={styles.modalTitleCenter}>{strategyMode === 'selection' ? 'Alterar Estratégia' : 'Selecionar Template'}</Text>
            
            {strategyMode === 'selection' && (
              <View>
                <Text style={styles.modalSub}>Como você quer definir o novo treino?</Text>
                <View style={styles.selectionRow}>
                  <TouchableOpacity style={styles.selectionCard} onPress={handleSetCustom} disabled={savingStrategy}>
                    <View style={styles.iconCircle}><Ionicons name="construct" size={24} color="#fff" /></View>
                    <Text style={styles.selectionTitle}>Do Zero</Text>
                    <Text style={styles.selectionDesc}>Personalizado</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.selectionCard} onPress={() => setStrategyMode('template')}>
                    <View style={[styles.iconCircle, {backgroundColor:'#3b82f6'}]}><Ionicons name="copy" size={24} color="#fff" /></View>
                    <Text style={styles.selectionTitle}>Usar Template</Text>
                    <Text style={styles.selectionDesc}>Sua biblioteca</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setStrategyModalVisible(false)}>
                   <Text style={styles.cancelText}>CANCELAR</Text>
                </TouchableOpacity>
              </View>
            )}

            {strategyMode === 'template' && (
              <View>
                <Text style={styles.modalSub}>Escolha um treino da sua biblioteca:</Text>
                <ScrollView style={{maxHeight: 250}}>
                  {templates.map(t => (
                    <TouchableOpacity key={t.id} style={[styles.templateOption, selectedTemplate?.id === t.id && styles.templateActive]} onPress={() => setSelectedTemplate(t)}>
                      <Text style={[styles.templateText, selectedTemplate?.id === t.id && {color: '#fff'}]}>{t.name}</Text>
                      {selectedTemplate?.id === t.id && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.backSmallBtn} onPress={() => setStrategyMode('selection')}>
                    <Ionicons name="arrow-back" size={20} color="#71717a" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmBtnFull, !selectedTemplate && {opacity:0.5}]} onPress={handleApplyTemplate} disabled={!selectedTemplate || savingStrategy}>
                    {savingStrategy ? <ActivityIndicator color="#fff"/> : <Text style={styles.confirmText}>APLICAR TREINO</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingBox: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#18181b' },
  backBtn: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  editBtnTop: { padding: 8, backgroundColor: '#27272a', borderRadius: 8 },

  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 20, borderWidth: 2, borderColor: '#3b82f6' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  email: { color: '#71717a', fontSize: 12, marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  statusText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },

  statsGrid: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 16, padding: 20, marginBottom: 20, justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  alertBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 15, marginBottom: 15 },
  alertTitle: { color: '#ef4444', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },
  alertText: { color: '#fca5a5', fontSize: 14, marginTop: 4 },

  notesBox: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 12, padding: 15, marginBottom: 25 },
  notesTitle: { color: '#f59e0b', fontWeight: 'bold', fontSize: 10, marginLeft: 5, letterSpacing: 1 },
  notesText: { color: '#fcd34d', fontSize: 14, marginTop: 4, fontStyle: 'italic' },

  sectionTitle: { color: '#52525b', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 20, borderRadius: 16, marginBottom: 40, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  planLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  planName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  changeBtn: { backgroundColor: '#27272a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#3f3f46' },
  changeBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  unlinkBtn: { alignItems: 'center', padding: 15 },
  unlinkText: { color: '#ef4444', fontWeight: 'bold' },

  // MODAL DE EDIÇÃO
  modalOverlay: { flex: 1, backgroundColor: '#09090b', paddingTop: 40 },
  modalContent: { flex: 1, padding: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  row: { flexDirection: 'row', gap: 15 },
  inputGroup: { flex: 1 },
  inputLabel: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#18181b', color: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', fontSize: 16 },

  confirmBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // MODAL ESTRATÉGIA DARK
  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContentBox: { backgroundColor: '#18181b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272a' },
  modalTitleCenter: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSub: { color: '#71717a', fontSize: 14, marginBottom: 25, textAlign: 'center' },
  selectionRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  selectionCard: { flex: 1, backgroundColor: '#09090b', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  selectionTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  selectionDesc: { color: '#71717a', fontSize: 10 },
  templateOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, backgroundColor: '#09090b', marginBottom: 10, borderWidth: 1, borderColor: '#27272a' },
  templateActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  templateText: { color: '#71717a', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 20 },
  backSmallBtn: { padding: 15, backgroundColor: '#27272a', borderRadius: 12, justifyContent:'center', alignItems:'center' },
  cancelBtn: { padding: 15, alignItems: 'center', width: '100%' },
  cancelText: { color: '#71717a', fontWeight: 'bold' },
  confirmBtnFull: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 15 },
});