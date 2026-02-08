import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  Modal, 
  TextInput,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-gifted-charts";
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

// --- CONFIGURAÇÕES ---
const SCREEN_WIDTH = Dimensions.get('window').width;

// --- DADOS MOCK (Histórico) ---
const HISTORICO_INICIAL = [
  { id: 1, data: '01/01', peso: 96.0, gordura: 27 },
  { id: 2, data: '15/01', peso: 94.5, gordura: 26 },
  { id: 3, data: '01/02', peso: 93.0, gordura: 25 },
  { id: 4, data: '15/02', peso: 91.5, gordura: 23 },
];

export default function AvatarScreen() {
  const [abaAtiva, setAbaAtiva] = useState<'Graficos' | 'Historico' | '3D'>('3D');
  const [historico, setHistorico] = useState(HISTORICO_INICIAL);
  
  // Estado para Modal de Nova Medição
  const [modalVisible, setModalVisible] = useState(false);
  const [novoPeso, setNovoPeso] = useState('');
  const [novaGordura, setNovaGordura] = useState('');

  // --- DADOS PARA O GRÁFICO ---
  const dadosPeso = historico.map(h => ({ value: h.peso, label: h.data }));
  const dadosGordura = historico.map(h => ({ value: h.gordura, label: h.data }));

  // --- FUNÇÃO: Adicionar Medição ---
  const salvarMedicao = () => {
    if (!novoPeso || !novaGordura) return Alert.alert("Erro", "Preencha todos os campos!");
    
    const nova = {
      id: Math.random(),
      data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      peso: parseFloat(novoPeso),
      gordura: parseFloat(novaGordura)
    };
    
    setHistorico([...historico, nova]);
    setModalVisible(false);
    setNovoPeso('');
    setNovaGordura('');
    Alert.alert("Sucesso", "Dados atualizados! Veja o boneco mudar.");
  };

  // Pega a medição mais recente para controlar o boneco
  const atual = historico[historico.length - 1];

  return (
    <View style={styles.container}>
      
      {/* 1. Header Navigation (Abas) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Evolução</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, abaAtiva === '3D' && styles.tabBtnActive]} 
            onPress={() => setAbaAtiva('3D')}
          >
            <Text style={[styles.tabText, abaAtiva === '3D' && styles.tabTextActive]}>Avatar 3D</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, abaAtiva === 'Graficos' && styles.tabBtnActive]} 
            onPress={() => setAbaAtiva('Graficos')}
          >
            <Text style={[styles.tabText, abaAtiva === 'Graficos' && styles.tabTextActive]}>Gráficos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, abaAtiva === 'Historico' && styles.tabBtnActive]} 
            onPress={() => setAbaAtiva('Historico')}
          >
            <Text style={[styles.tabText, abaAtiva === 'Historico' && styles.tabTextActive]}>Histórico</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- CONTEÚDO DAS ABAS --- */}
      
      {/* ABA 1: MODELO 3D (A "ARMA NUCLEAR") */}
      {abaAtiva === '3D' && (
        <View style={{flex: 1}}>
          {/* Card Flutuante com Dados Atuais */}
          <View style={styles.floatingStats}>
            <View>
              <Text style={styles.statLabel}>PESO ATUAL</Text>
              <Text style={styles.statValue}>{atual.peso} kg</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.statLabel}>GORDURA</Text>
              <Text style={styles.statValue}>{atual.gordura}%</Text>
            </View>
          </View>

          {/* O COMPONENTE 3D */}
          <View style={styles.canvasContainer}>
            <Avatar3DScene peso={atual.peso} gordura={atual.gordura} />
          </View>
          
          <Text style={styles.hintText}>Gire o modelo para ver em 360º</Text>
          
          <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateButtonText}>ATUALIZAR MEDIDAS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ABA 2: GRÁFICOS */}
      {abaAtiva === 'Graficos' && (
        <ScrollView style={styles.contentContainer}>
          <Text style={styles.chartTitle}>Evolução de Peso (kg)</Text>
          <View style={styles.chartBox}>
            <LineChart 
              data={dadosPeso}
              color="#3b82f6"
              thickness={3}
              dataPointsColor="#3b82f6"
              startFillColor="rgba(59, 130, 246, 0.3)"
              endFillColor="rgba(59, 130, 246, 0.01)"
              startOpacity={0.9}
              endOpacity={0.1}
              areaChart
              yAxisTextStyle={{color: '#a1a1aa'}}
              xAxisLabelTextStyle={{color: '#a1a1aa', fontSize: 10}}
              hideRules
              height={200}
              width={SCREEN_WIDTH - 60}
              spacing={60}
              initialSpacing={20}
            />
          </View>

          <Text style={styles.chartTitle}>Percentual de Gordura (%)</Text>
          <View style={styles.chartBox}>
            <LineChart 
              data={dadosGordura}
              color="#ef4444"
              thickness={3}
              dataPointsColor="#ef4444"
              startFillColor="rgba(239, 68, 68, 0.3)"
              endFillColor="rgba(239, 68, 68, 0.01)"
              areaChart
              yAxisTextStyle={{color: '#a1a1aa'}}
              xAxisLabelTextStyle={{color: '#a1a1aa', fontSize: 10}}
              hideRules
              height={200}
              width={SCREEN_WIDTH - 60}
              spacing={60}
              initialSpacing={20}
            />
          </View>
        </ScrollView>
      )}

      {/* ABA 3: HISTÓRICO (TABELA) */}
      {abaAtiva === 'Historico' && (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeadText, {flex: 1}]}>DATA</Text>
            <Text style={[styles.tableHeadText, {flex: 1, textAlign: 'center'}]}>PESO</Text>
            <Text style={[styles.tableHeadText, {flex: 1, textAlign: 'right'}]}>BF %</Text>
          </View>
          
          {historico.slice().reverse().map((item, index) => (
            <View key={item.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowZebra]}>
              <Text style={[styles.tableCell, {flex: 1}]}>{item.data}</Text>
              <Text style={[styles.tableCell, {flex: 1, textAlign: 'center', color: '#fff'}]}>{item.peso} kg</Text>
              <Text style={[styles.tableCell, {flex: 1, textAlign: 'right', color: '#ef4444'}]}>{item.gordura}%</Text>
            </View>
          ))}
          
          <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateButtonText}>NOVA MEDIÇÃO</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* MODAL DE ATUALIZAR DADOS */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualizar Físico</Text>
            
            <Text style={styles.inputLabel}>Peso Atual (kg)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              placeholder="Ex: 95.5" 
              placeholderTextColor="#52525b"
              value={novoPeso}
              onChangeText={setNovoPeso}
            />

            <Text style={styles.inputLabel}>Gordura Atual (%)</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              placeholder="Ex: 24" 
              placeholderTextColor="#52525b"
              value={novaGordura}
              onChangeText={setNovaGordura}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={salvarMedicao}>
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// --- SUB-COMPONENTE: CENA 3D (Lógica do Boneco) ---
function Avatar3DScene({ peso, gordura }: { peso: number, gordura: number }) {
  const onContextCreate = async (gl: any) => {
    // 1. Configuração Básica do Three.js
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000); // Fundo Preto

    const scene = new THREE.Scene();
    
    // Câmera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1, 5);

    // Luzes (Estilo Studio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x3b82f6, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // --- O BONECO (PLACEHOLDER) ---
    // Enquanto não temos o .glb, usamos uma Cápsula para simular o corpo humano
    // Geometria: Raio, Comprimento, Segmentos
    const geometry = new THREE.CapsuleGeometry(1, 4, 4, 8); 
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6, // Azul Tech
      roughness: 0.3,
      metalness: 0.8
    });
    const avatar = new THREE.Mesh(geometry, material);
    scene.add(avatar);

    // --- LÓGICA DE MUDANÇA DE CORPO ---
    // Aqui acontece a mágica. O Loop de animação atualiza a escala baseado no peso.
    const render = () => {
      requestAnimationFrame(render);
      
      // Rotação automática lenta
      avatar.rotation.y += 0.01;

      // ESCALA DINÂMICA:
      // Se peso = 100kg, escala X (largura) = 1.2
      // Se peso = 70kg, escala X (largura) = 0.8
      // Fórmula simples: (peso / 80) é o fator base
      const fatorLargura = peso / 80; 
      avatar.scale.set(fatorLargura, 1, fatorLargura); 

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  header: { paddingTop: 60, backgroundColor: '#000', paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 15 },
  
  tabContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#18181b' },
  tabBtnActive: { backgroundColor: '#3b82f6' },
  tabText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#fff' },

  // ABA 3D
  floatingStats: { 
    position: 'absolute', top: 20, left: 20, right: 20, zIndex: 10,
    backgroundColor: 'rgba(24, 24, 27, 0.8)', padding: 16, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'
  },
  statLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: 'bold' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  divider: { width: 1, height: 30, backgroundColor: '#3f3f46' },
  
  canvasContainer: { flex: 1, marginTop: 80, marginBottom: 20 }, // Espaço para o boneco
  hintText: { textAlign: 'center', color: '#52525b', fontSize: 12, marginBottom: 10 },

  // ABA GRÁFICOS
  contentContainer: { padding: 20 },
  chartTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  chartBox: { backgroundColor: '#18181b', padding: 10, borderRadius: 16, marginBottom: 20, alignItems: 'center' },

  // ABA HISTÓRICO
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#3f3f46', paddingBottom: 10, marginBottom: 10 },
  tableHeadText: { color: '#52525b', fontWeight: 'bold', fontSize: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#27272a' },
  tableRowZebra: { backgroundColor: '#18181b' },
  tableCell: { color: '#a1a1aa', fontSize: 14 },

  // BOTÕES E MODAL
  updateButton: { margin: 20, backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  updateButtonText: { color: '#fff', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#18181b', padding: 20, borderRadius: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: '#a1a1aa', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#09090b', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#27272a' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 16, backgroundColor: '#27272a', borderRadius: 12, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 16, backgroundColor: '#3b82f6', borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#fff' },
  saveText: { color: '#fff', fontWeight: 'bold' }
});