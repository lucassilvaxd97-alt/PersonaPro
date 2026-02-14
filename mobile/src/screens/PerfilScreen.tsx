import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://github.com/shadcn.png' }} 
            style={styles.avatar} 
          />
          <TouchableOpacity style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>Lucas Nunes</Text>
        <Text style={styles.userEmail}>aluno@personalpro.com</Text>
      </View>

      <View style={styles.menuGroup}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={22} color="#3b82f6" />
          <Text style={styles.menuText}>Dados Pessoais</Text>
          <Ionicons name="chevron-forward" size={20} color="#27272a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color="#3b82f6" />
          <Text style={styles.menuText}>Notificações</Text>
          <Ionicons name="chevron-forward" size={20} color="#27272a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Sair do App</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  profileCard: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#3b82f6' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3b82f6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  userEmail: { color: '#71717a', fontSize: 14 },
  menuGroup: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#27272a' },
  menuText: { flex: 1, color: '#e4e4e7', marginLeft: 12, fontSize: 16, fontWeight: '500' }
});