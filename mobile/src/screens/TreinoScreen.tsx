import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// Dados simulados (O que viria do Backend)
const TREINO_ATUAL = [
  {
    id: 1,
    nome: "Supino Reto com Halteres",
    series: 4,
    reps: "10-12",
    carga: "24kg",
    descanso: "90s"
  },
  {
    id: 2,
    nome: "Puxada Alta (Polia)",
    series: 4,
    reps: "12",
    carga: "50kg",
    descanso: "60s"
  },
  {
    id: 3,
    nome: "Elevação Lateral",
    series: 3,
    reps: "15",
    carga: "10kg",
    descanso: "45s"
  },
  {
    id: 4,
    nome: "Agachamento Livre",
    series: 4,
    reps: "8-10",
    carga: "80kg",
    descanso: "120s"
  }
];

export default function TreinoScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Treino A - Hipertrofia</Text>
        <Text style={styles.headerSubtitle}>Foco: Peito e Costas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {TREINO_ATUAL.map((exercicio) => (
          <View key={exercicio.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.exNome}>{exercicio.nome}</Text>
              <Text style={styles.carga}>{exercicio.carga}</Text>
            </View>
            
            <View style={styles.cardBottom}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{exercicio.series} Séries</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{exercicio.reps} Reps</Text>
              </View>
              <Text style={styles.descanso}>⏳ {exercicio.descanso}</Text>
            </View>

            <TouchableOpacity style={styles.checkButton}>
              <Text style={styles.checkText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { padding: 20, backgroundColor: '#fff', paddingTop: 60, borderBottomWidth: 1, borderColor: '#e4e4e7' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#18181b' },
  headerSubtitle: { fontSize: 16, color: '#71717a', marginTop: 4 },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exNome: { fontSize: 18, fontWeight: 'bold', color: '#27272a', flex: 1 },
  carga: { fontSize: 18, fontWeight: 'bold', color: '#00e676' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { backgroundColor: '#f4f4f5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#52525b' },
  descanso: { fontSize: 12, color: '#a1a1aa', marginLeft: 'auto' },
  checkButton: { marginTop: 15, backgroundColor: '#18181b', padding: 12, borderRadius: 8, alignItems: 'center' },
  checkText: { color: '#fff', fontWeight: 'bold' }
});