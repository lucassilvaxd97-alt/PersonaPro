import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, 
  ActivityIndicator, Alert, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { supabase } from '../services/supabase';
// 🚀 Importante para atualizar quando voltar
import { useFocusEffect } from '@react-navigation/native'; 

// Configuração PT-BR do Calendário (Mantenha se já tiver)
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

export default function PerfilScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});
  // Estados para Nome e E-mail dinâmicos
  const [userName, setUserName] = useState("Dino Maromba");
  const [userEmail, setUserEmail] = useState("");

  // --- 🔄 FUNÇÃO BLINDADA PARA BUSCAR DADOS (ATUALIZAÇÃO) ---
  const fetchProfileData = async () => {
    // Não damos loading aqui para não piscar a tela ao voltar
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || ""); // 📧 Adiciona o E-mail

      // Busca o nome salvo na tabela 'profiles'
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile && profile.full_name) {
        setUserName(profile.full_name); // ✅ Atualiza o Nome
      } else {
        // Se não tem nome, usa o início do e-mail como fallback
        setUserName(user.email?.split('@')[0] || "Dino Maromba");
      }

      // Busca os logs para o calendário
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('created_at')
        .eq('student_id', user.id);

      if (logs) {
        let marked: any = {};
        logs.forEach(log => {
          const date = log.created_at.split('T')[0];
          marked[date] = { selected: true, selectedColor: '#3b82f6' };
        });
        setMarkedDates(marked);
      }
    } catch (error) {
      console.log("Erro ao buscar dados do perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 O SEGREDO: useFocusEffect faz buscar os dados toda vez que a tela aparece
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('Login'); 
      }}
    ]);
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      {/* CARD DE PERFIL COM DADOS DINÂMICOS */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://github.com/shadcn.png' }} style={styles.avatar} />
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      {/* CALENDÁRIO (Design Mantido) */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>Frequência de Treinos</Text>
        <View style={styles.calendarWrapper}>
          <Calendar
            theme={{
              backgroundColor: '#18181b',
              calendarBackground: '#18181b',
              textSectionTitleColor: '#3b82f6',
              dayTextColor: '#fff',
              todayTextColor: '#3b82f6',
              monthTextColor: '#fff',
              arrowColor: '#3b82f6',
              textMonthFontWeight: 'bold',
            }}
            markedDates={markedDates}
          />
        </View>
      </View>

      {/* MENU DE OPÇÕES (Design Mantido) */}
      <View style={styles.menuGroup}>
        <Text style={styles.sectionTitle}>Ajustes</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DadosPessoais')}>
          <Ionicons name="person-outline" size={22} color="#3b82f6" />
          <Text style={styles.menuText}>Dados Pessoais</Text>
          <Ionicons name="chevron-forward" size={20} color="#27272a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color="#3b82f6" />
          <Text style={styles.menuText}>Notificações</Text>
          <Ionicons name="chevron-forward" size={20} color="#27272a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Sair do App</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  profileCard: { alignItems: 'center', marginBottom: 25 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#3b82f6' },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 15, textTransform: 'capitalize' },
  userEmail: { color: '#71717a', fontSize: 14 },
  calendarSection: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { color: '#71717a', fontSize: 13, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  calendarWrapper: { backgroundColor: '#18181b', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#27272a' },
  menuGroup: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#27272a' },
  menuText: { flex: 1, color: '#e4e4e7', marginLeft: 12, fontSize: 16, fontWeight: '500' }
});