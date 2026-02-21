import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Switch, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function NotificationsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Estado das Preferências
  const [prefs, setPrefs] = useState({
    workout_done: true,   // Aluno terminou treino
    feedback: true,       // Aluno mandou feedback
    renewal: true,        // Plano vencendo
    marketing: false,     // Novidades do app
  });

  // --- CARREGAR PREFERÊNCIAS ---
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.preferences) {
        // Mescla com o padrão para garantir que não quebre se faltar alguma chave
        setPrefs(prev => ({ ...prev, ...data.preferences }));
      }
    } catch (error) {
      console.log("Erro ao carregar prefs:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ALTERAR SWITCH ---
  const toggleSwitch = (key: keyof typeof prefs) => {
    setPrefs(previousState => ({
      ...previousState,
      [key]: !previousState[key]
    }));
  };

  // --- SALVAR ---
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: prefs })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert("Sucesso! 🦖", "Suas preferências foram salvas.");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color="#4f46e5" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notificações</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>ESCOLHA O QUE VOCÊ QUER RECEBER</Text>
        
        {/* GRUPO 1: ALUNOS */}
        <View style={styles.section}>
          <NotificationItem 
            icon="barbell" 
            color="#3b82f6"
            title="Conclusão de Treino"
            desc="Saiba na hora quando um aluno finalizar o treino do dia."
            value={prefs.workout_done}
            onValueChange={() => toggleSwitch('workout_done')}
          />
          
          <View style={styles.divider} />

          <NotificationItem 
            icon="chatbubbles" 
            color="#10b981"
            title="Feedbacks e Dúvidas"
            desc="Receba avisos quando o aluno deixar observações no exercício."
            value={prefs.feedback}
            onValueChange={() => toggleSwitch('feedback')}
          />
        </View>

        {/* GRUPO 2: NEGÓCIO */}
        <Text style={styles.subtitle}>GESTÃO E APP</Text>
        <View style={styles.section}>
          <NotificationItem 
            icon="calendar" 
            color="#f59e0b"
            title="Alerta de Renovação"
            desc="Seja avisado 5 dias antes do plano de um aluno vencer."
            value={prefs.renewal}
            onValueChange={() => toggleSwitch('renewal')}
          />

          <View style={styles.divider} />

          <NotificationItem 
            icon="rocket" 
            color="#8b5cf6"
            title="Novidades do Persona"
            desc="Dicas de uso, atualizações e novos recursos do app."
            value={prefs.marketing}
            onValueChange={() => toggleSwitch('marketing')}
          />
        </View>

        <Text style={styles.infoText}>
          Essas configurações afetam as notificações Push no seu celular e os avisos dentro do app.
        </Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SALVAR PREFERÊNCIAS</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// Componente Isolado para o Item (Fica mais limpo)
const NotificationItem = ({ icon, color, title, desc, value, onValueChange }: any) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDesc}>{desc}</Text>
      </View>
    </View>
    <Switch 
      trackColor={{ false: "#27272a", true: color }}
      thumbColor={value ? "#fff" : "#71717a"}
      ios_backgroundColor="#27272a"
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#18181b' },
  backBtn: { padding: 5 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  content: { padding: 20 },
  subtitle: { color: '#52525b', fontSize: 10, fontWeight: 'bold', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
  
  section: { backgroundColor: '#18181b', borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#27272a', marginLeft: 60 },

  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  itemDesc: { color: '#71717a', fontSize: 11, lineHeight: 14 },

  infoText: { color: '#52525b', fontSize: 12, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },

  saveBtn: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
});