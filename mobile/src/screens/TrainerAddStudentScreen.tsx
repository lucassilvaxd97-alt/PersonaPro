import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function TrainerAddStudentScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Formulário
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [restrictions, setRestrictions] = useState(''); // <--- NOVO CAMPO
  const [trainingMode, setTrainingMode] = useState<'custom' | 'template'>('custom');
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  // Carregar Templates para o Select
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('workout_templates')
        .select('id, name')
        .eq('trainer_id', user.id);
      
      setTemplates(data || []);
    };
    fetchTemplates();
  }, []);

  const handleLinkStudent = async () => {
    if (!email) {
      Alert.alert("Opa!", "Preciso do e-mail do aluno.");
      return;
    }
    if (trainingMode === 'template' && !selectedTemplate) {
      Alert.alert("Atenção", "Selecione um template de treino.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Achar o aluno
      const { data: student, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (searchError || !student) {
        Alert.alert("Não encontrado", "Este e-mail não tem conta no Persona Pro ainda.");
        setLoading(false);
        return;
      }

      // 2. Definir nome do plano
      let planName = "Personalizado";
      if (trainingMode === 'template' && selectedTemplate) {
        planName = selectedTemplate.name;
      }

      // 3. Vincular (Com a Restrição Médica)
      const { error: insertError } = await supabase
        .from('student_trainer')
        .insert({
          trainer_id: user?.id,
          student_id: student.id,
          nickname: nickname,
          restrictions: restrictions, // <--- SALVANDO AQUI
          plan_name: planName,
          status: 'active'
        });

      if (insertError) throw insertError;

      Alert.alert("Sucesso! 🦖", "Aluno vinculado e ficha médica salva!");
      navigation.goBack(); // Volta para a lista

    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Aluno</Text>
        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.content}>
          
          <Text style={styles.sectionTitle}>DADOS DO ALUNO</Text>
          
          <Text style={styles.label}>E-MAIL (Conta do Aluno)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="exemplo@email.com" 
            placeholderTextColor="#52525b"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>APELIDO (Como você quer chamar)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: Carlinhos Monstro" 
            placeholderTextColor="#52525b"
            value={nickname}
            onChangeText={setNickname}
          />

          {/* ÁREA DE RESTRIÇÃO MÉDICA */}
          <Text style={[styles.label, {color: '#ef4444'}]}>⚠️ RESTRIÇÕES MÉDICAS / LESÕES</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Ex: Condromalácia patelar grau 2, evitar impacto..." 
            placeholderTextColor="#52525b"
            multiline
            numberOfLines={3}
            value={restrictions}
            onChangeText={setRestrictions}
          />

          <Text style={styles.sectionTitle}>ESTRATÉGIA INICIAL</Text>
          <View style={styles.strategyRow}>
            <TouchableOpacity 
              style={[styles.strategyCard, trainingMode === 'custom' && styles.strategyActive]} 
              onPress={() => { setTrainingMode('custom'); setSelectedTemplate(null); }}
            >
              <Ionicons name="construct" size={20} color={trainingMode === 'custom' ? '#fff' : '#71717a'} />
              <Text style={[styles.strategyText, trainingMode === 'custom' && {color: '#fff'}]}>Do Zero</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.strategyCard, trainingMode === 'template' && styles.strategyActive]} 
              onPress={() => setTrainingMode('template')}
            >
              <Ionicons name="copy" size={20} color={trainingMode === 'template' ? '#fff' : '#71717a'} />
              <Text style={[styles.strategyText, trainingMode === 'template' && {color: '#fff'}]}>Usar Template</Text>
            </TouchableOpacity>
          </View>

          {trainingMode === 'template' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
              {templates.map(t => (
                <TouchableOpacity 
                  key={t.id} 
                  style={[styles.chip, selectedTemplate?.id === t.id && styles.chipActive]}
                  onPress={() => setSelectedTemplate(t)}
                >
                  <Text style={[styles.chipText, selectedTemplate?.id === t.id && {color: '#fff'}]}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleLinkStudent} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>VINCULAR E SALVAR</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#18181b' },
  backBtn: { padding: 5 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 24, paddingBottom: 50 },
  
  sectionTitle: { color: '#3b82f6', fontSize: 12, fontWeight: '900', marginBottom: 15, marginTop: 10, letterSpacing: 1 },
  label: { color: '#71717a', fontSize: 11, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#09090b', color: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', fontSize: 14 },
  textArea: { height: 100, textAlignVertical: 'top', borderColor: 'rgba(239, 68, 68, 0.3)' }, // Borda avermelhada para alerta
  
  strategyRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  strategyCard: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a' },
  strategyActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  strategyText: { color: '#71717a', fontSize: 12, fontWeight: 'bold' },
  
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#09090b', borderWidth: 1, borderColor: '#27272a', marginRight: 8 },
  chipActive: { borderColor: '#3b82f6', backgroundColor: '#3b82f6' },
  chipText: { color: '#71717a', fontSize: 12, fontWeight: 'bold' },

  saveBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});