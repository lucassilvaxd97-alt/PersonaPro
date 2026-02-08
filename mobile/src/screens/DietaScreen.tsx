import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const DIETA_DO_DIA = [
  { horario: "07:00", nome: "Café da Manhã", itens: ["3 Ovos Mexidos", "1 Banana", "Café Preto"] },
  { horario: "12:00", nome: "Almoço", itens: ["150g Frango Grelhado", "100g Arroz Branco", "Salada Verde"] },
  { horario: "16:00", nome: "Lanche da Tarde", itens: ["1 Scoop Whey", "30g Aveia", "1 Maçã"] },
  { horario: "20:00", nome: "Jantar", itens: ["150g Patinho Moído", "100g Batata Doce"] },
];

export default function DietaScreen() {
  return (
    <View style={styles.container}>
       <View style={styles.header}>
        <Text style={styles.headerTitle}>Dieta Atual 🥗</Text>
        <Text style={styles.headerSubtitle}>2.400 Kcal / dia</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {DIETA_DO_DIA.map((ref, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{ref.horario}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.refTitle}>{ref.nome}</Text>
              {ref.itens.map((item, idx) => (
                <Text key={idx} style={styles.itemText}>• {item}</Text>
              ))}
            </View>
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
  headerSubtitle: { fontSize: 16, color: '#00e676', marginTop: 4, fontWeight: 'bold' },
  list: { padding: 20 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  timeBadge: { marginRight: 15, justifyContent: 'flex-start', paddingTop: 2 },
  timeText: { fontWeight: 'bold', color: '#71717a' },
  content: { flex: 1 },
  refTitle: { fontSize: 18, fontWeight: 'bold', color: '#27272a', marginBottom: 5 },
  itemText: { fontSize: 14, color: '#52525b', lineHeight: 20 }
});