import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, 
  Image, ScrollView, Linking, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function TrainerConfigScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- BUSCAR DADOS DO TREINADOR ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(data);
        }
      } catch (error) {
        console.log("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);
  
  // --- LOGOUT ---
  const handleLogout = () => {
    Alert.alert("Desconectar", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair Agora", 
        style: "destructive", 
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('Login'); 
        } 
      }
    ]);
  };

  // --- ABRIR WHATSAPP (SUPORTE) ---
  const openSupport = () => {
      Linking.openURL('https://wa.me/5512982776902'); 
  };

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
        <ActivityIndicator size="large" color="#4f46e5"/>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 1. CABEÇALHO COM PERFIL */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={{fontSize: 40}}>🦖</Text>
          )}
        <TouchableOpacity style={styles.editIcon} onPress={() => navigation.navigate('EditProfile')}>
   <Ionicons name="camera" size={14} color="#fff" />
</TouchableOpacity>
        </View>
        
        <Text style={styles.name}>{profile?.full_name || 'Treinador Elite'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#fff" />
          <Text style={styles.roleText}>PERSONAL TRAINER</Text>
        </View>
      </View>

      {/* 2. MENU DE OPÇÕES */}
      <ScrollView contentContainerStyle={styles.menuContainer}>
        
        <Text style={styles.sectionTitle}>CONTA</Text>
        <MenuOption 
         icon="person-outline" 
        label="Editar Perfil" 
        sub="Nome, foto e dados"
       onPress={() => navigation.navigate('EditProfile')} // <--- Navega para a tela nova
/>
        
        <MenuOption 
          icon="notifications-outline" 
          label="Notificações" 
          sub="Avisos de alunos"
          onPress={() => navigation.navigate('Notifications')}
        />

        <Text style={styles.sectionTitle}>SOBRE O APP</Text>
        <MenuOption 
          icon="help-buoy-outline" 
          label="Suporte / Ajuda" 
          sub="Fale com a gente no WhatsApp"
          onPress={openSupport} 
        />
        <MenuOption 
          icon="document-text-outline" 
          label="Termos de Uso" 
          onPress={() => {}} 
        />

        {/* BOTÃO SAIR */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </View>
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versão 1.0.0 • IRONPRO</Text>

      </ScrollView>
    </View>
  );
}

// Componente de Item do Menu
const MenuOption = ({ icon, label, sub, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconBox}>
      <Ionicons name={icon} size={22} color="#a1a1aa" />
    </View>
    <View style={{flex: 1}}>
      <Text style={styles.menuLabel}>{label}</Text>
      {sub && <Text style={styles.menuSub}>{sub}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#27272a" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // Header
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, backgroundColor: '#09090b', borderBottomWidth: 1, borderColor: '#18181b' },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#18181b', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#4f46e5', marginBottom: 15, position: 'relative' },
  avatarImage: { width: 94, height: 94, borderRadius: 47 },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4f46e5', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#09090b' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { color: '#71717a', fontSize: 14, marginBottom: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  // Menu
  menuContainer: { padding: 20 },
  sectionTitle: { color: '#52525b', fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 10, marginLeft: 10, letterSpacing: 1 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 16, borderRadius: 16, marginBottom: 10 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  menuSub: { color: '#71717a', fontSize: 12 },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 16, marginTop: 30, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  logoutIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },

  versionText: { color: '#27272a', textAlign: 'center', marginTop: 30, fontSize: 12, fontWeight: 'bold' }
});