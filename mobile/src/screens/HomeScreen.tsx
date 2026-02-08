import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Cabeçalho Fixo */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Dino 👋</Text>
          <Text style={styles.subGreeting}>Vamos esmagar hoje?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Image 
            source={{ uri: 'https://github.com/shadcn.png' }} 
            style={styles.avatar} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Card Principal: O Treino do Dia */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>TREINO DE HOJE</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>60 min</Text>
            </View>
          </View>
          
          <Text style={styles.workoutTitle}>Costas e Bíceps (Hipertrofia)</Text>
          <Text style={styles.workoutSubtitle}>Foco: Largura e Densidade</Text>

          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => navigation.navigate('Treinos')}
          >
            <Text style={styles.startButtonText}>INICIAR TREINO</Text>
            <Ionicons name="play" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Status Rápidos (Grid 2x2) */}
        <Text style={styles.sectionTitle}>Seu Progresso</Text>
        <View style={styles.statsGrid}>
          {/* Peso */}
          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="scale" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>96.0 kg</Text>
            <Text style={styles.statLabel}>Peso Atual</Text>
          </View>

          {/* Frequência */}
          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="flame" size={24} color="#22c55e" />
            </View>
            <Text style={styles.statValue}>4 Dias</Text>
            <Text style={styles.statLabel}>Sequência</Text>
          </View>
        </View>

        {/* Próxima Refeição */}
        <Text style={styles.sectionTitle}>Próxima Refeição</Text>
        <View style={styles.mealCard}>
          <View style={styles.mealTime}>
            <Text style={styles.mealTimeText}>12:00</Text>
          </View>
          <View style={styles.mealContent}>
            <Text style={styles.mealTitle}>Almoço</Text>
            <Text style={styles.mealDesc}>150g Frango Grelhado + 100g Arroz...</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Dieta')}>
            <Ionicons name="chevron-forward" size={24} color="#52525b" />
          </TouchableOpacity>
        </View>

        {/* Banner Motivacional ou Aviso */}
        <View style={styles.banner}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <Text style={styles.bannerText}>
            Lembre-se de registrar suas cargas hoje para gerar o gráfico de evolução.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: '#a1a1aa' },
  profileButton: { padding: 2, borderWidth: 1, borderColor: '#3b82f6', borderRadius: 25 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Hero Card (Treino do Dia)
  heroCard: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  heroLabel: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#27272a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  workoutTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  workoutSubtitle: { fontSize: 14, color: '#a1a1aa', marginBottom: 20 },
  startButton: {
    backgroundColor: '#3b82f6', // Azul Tech
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#18181b', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  iconBox: { padding: 10, borderRadius: 12, marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#a1a1aa' },

  // Meal Card
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e', // Verde para comida
  },
  mealTime: { marginRight: 15 },
  mealTimeText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  mealContent: { flex: 1 },
  mealTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  mealDesc: { fontSize: 12, color: '#a1a1aa' },

  // Banner
  banner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  bannerText: { flex: 1, color: '#3b82f6', fontSize: 12, lineHeight: 18 },
});