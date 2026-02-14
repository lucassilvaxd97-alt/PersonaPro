import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  Modal, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from "react-native-gifted-charts"; 
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
// IMPORTANTE: Carregador de modelos GLTF/GLB
import { GLTFLoader } from 'three-stdlib'; 

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- DADOS MOCK (Histórico) ---
const HISTORICO_INICIAL = [
  { id: 1, data: '01/01', peso: 98.0, gordura: 28 },
  { id: 2, data: '15/01', peso: 96.5, gordura: 27 },
  { id: 3, data: '01/02', peso: 95.0, gordura: 26 },
  { id: 4, data: '15/02', peso: 94.0, gordura: 25 },
];

// URL pública de um modelo humano simples para exemplo
// (No futuro, você pode trocar isso por um arquivo local ou do seu Supabase)
const HUMAN_MODEL_URL = 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/low-poly-man/model.glb';


export default function AvatarScreen() {
  const [abaAtiva, setAbaAtiva] = useState<'Graficos' | 'Historico' | '3D'>('3D');
  const [historico, setHistorico] = useState(HISTORICO_INICIAL);
  const [modalVisible, setModalVisible] = useState(false);
  const [novoPeso, setNovoPeso] = useState('');
  const [novaGordura, setNovaGordura] = useState('');

  // --- LÓGICA DO GRÁFICO AGRUPADO ---
  const dadosGraficoAgrupado = [];
  historico.forEach((h) => {
    dadosGraficoAgrupado.push({
      value: h.peso,
      label: h.data,
      spacing: 4,
      labelWidth: 30,
      labelTextStyle: { color: '#a1a1aa', fontSize: 10 },
      frontColor: '#3b82f6',
      topLabelComponent: () => <Text style={{color: '#3b82f6', fontSize: 9, marginBottom: 2}}>{h.peso}</Text>
    });
    dadosGraficoAgrupado.push({
      value: h.gordura,
      frontColor: '#ef4444',
      spacing: 32,
      topLabelComponent: () => <Text style={{color: '#ef4444', fontSize: 9, marginBottom: 2}}>{h.gordura}%</Text>
    });
  });

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
    Alert.alert("Sucesso", "Boneco atualizado! 💪");
  };

  const atual = historico[historico.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Evolução</Text>
        <View style={styles.tabContainer}>
          <TabButton title="Avatar 3D" active={abaAtiva === '3D'} onPress={() => setAbaAtiva('3D')} />
          <TabButton title="Gráficos" active={abaAtiva === 'Graficos'} onPress={() => setAbaAtiva('Graficos')} />
          <TabButton title="Histórico" active={abaAtiva === 'Historico'} onPress={() => setAbaAtiva('Historico')} />
        </View>
      </View>

      {/* --- ABA 1: MODELO 3D HUMANO REALISTA --- */}
      {abaAtiva === '3D' && (
        <View style={{flex: 1}}>
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

          <View style={styles.canvasContainer}>
            {/* Passamos a URL do modelo humano */}
            <AvatarHumanScene peso={atual.peso} gordura={atual.gordura} modelUrl={HUMAN_MODEL_URL} />
          </View>
          
          <Text style={styles.hintText}>Toque e arraste para girar</Text>
          
          <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateButtonText}>ATUALIZAR MEDIDAS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- ABA 2: GRÁFICOS (AJUSTADOS) --- */}
      {abaAtiva === 'Graficos' && (
        <ScrollView style={styles.contentContainer}>
          <Text style={styles.chartTitle}>Comparativo: Peso vs Gordura</Text>
          <Text style={styles.chartSubtitle}>🔵 Peso (kg)  |  🔴 Gordura (%)</Text>
          
          <View style={styles.chartBox}>
            <BarChart 
              data={dadosGraficoAgrupado}
              barWidth={16} // Barras um pouco mais finas
              noOfSections={4}
              barBorderTopLeftRadius={4}
              barBorderTopRightRadius={4}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#3f3f46"
              yAxisTextStyle={{color: '#52525b'}}
              hideRules
              height={220}
              // AQUI ESTÁ A CORREÇÃO DE LARGURA:
              width={SCREEN_WIDTH - 90} 
              isAnimated
              initialSpacing={20}
            />
          </View>
        </ScrollView>
      )}

      {/* --- ABA 3: HISTÓRICO (MANTIDO) --- */}
      {abaAtiva === 'Historico' && (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, {flex: 1.2, textAlign: 'left'}]}>DATA</Text>
              <Text style={[styles.tableHeadText, {flex: 1, textAlign: 'center'}]}>PESO</Text>
              <Text style={[styles.tableHeadText, {flex: 1, textAlign: 'right'}]}>BF %</Text>
            </View>
            
            {historico.slice().reverse().map((item, index, arr) => {
              const prevItem = arr[index + 1];
              
              const diffPeso = prevItem ? item.peso - prevItem.peso : 0;
              const iconPeso = diffPeso < 0 ? 'arrow-down' : diffPeso > 0 ? 'arrow-up' : 'remove';
              const colorPeso = diffPeso < 0 ? '#10b981' : diffPeso > 0 ? '#ef4444' : '#52525b';
              
              const diffGord = prevItem ? item.gordura - prevItem.gordura : 0;
              const iconGord = diffGord < 0 ? 'arrow-down' : diffGord > 0 ? 'arrow-up' : 'remove';
              const colorGord = diffGord < 0 ? '#10b981' : diffGord > 0 ? '#ef4444' : '#52525b';

              return (
                <View key={item.id} style={[styles.tableRow, index !== arr.length - 1 && styles.borderBottom]}>
                  <Text style={[styles.tableCell, {flex: 1.2, color: '#a1a1aa'}]}>{item.data}</Text>
                  <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6}}>
                    <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 15}}>{item.peso}</Text>
                    {prevItem && <Ionicons name={iconPeso} size={14} color={colorPeso} />}
                  </View>
                  <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6}}>
                    <Text style={{color: '#fff', fontSize: 14}}>{item.gordura}</Text>
                    {prevItem && <Ionicons name={iconGord} size={12} color={colorGord} />}
                  </View>
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateButtonText}>NOVA MEDIÇÃO</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualizar Físico</Text>
            <Text style={styles.inputLabel}>Peso Atual (kg)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 95.5" placeholderTextColor="#52525b" value={novoPeso} onChangeText={setNovoPeso} />
            <Text style={styles.inputLabel}>Gordura Atual (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 24" placeholderTextColor="#52525b" value={novaGordura} onChangeText={setNovaGordura} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={salvarMedicao}><Text style={styles.saveText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const TabButton = ({ title, active, onPress }: any) => (
  <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} onPress={onPress}>
    <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
  </TouchableOpacity>
);

// --- CENA 3D NOVA: CARREGADOR DE MODELO HUMANO (.GLB) ---
function AvatarHumanScene({ peso, gordura, modelUrl }: { peso: number, gordura: number, modelUrl: string }) {
  const modelRef = useRef<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1, 4); // Câmera mais próxima

    // --- ILUMINAÇÃO DE ESTÚDIO PARA REALÇAR O MODELO ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(2, 3, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.8); // Luz de preenchimento azulada
    fillLight.position.set(-2, 1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff4444, 1); // Luz de recorte vermelha nas costas
    rimLight.position.set(0, 3, -5);
    scene.add(rimLight);

    // --- CARREGAR O MODELO GLB ---
    const loader = new GLTFLoader();
    try {
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          // Ajuste de posição e escala inicial do modelo
          model.position.y = -1; // Descer um pouco para centralizar
          // O modelo pode vir muito grande ou pequeno, ajustamos uma escala base
          model.scale.set(1.2, 1.2, 1.2); 

          // Aplicar um material padrão se o modelo não tiver (opcional)
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              // Se quiser forçar uma cor:
              // (mesh.material as THREE.MeshStandardMaterial).color.set(0x9ca3af);
            }
          });

          scene.add(model);
          modelRef.current = model;
          setIsLoading(false); // Modelo carregado!
        },
        undefined, // onProgress
        (error) => {
          console.error('Erro ao carregar o modelo 3D:', error);
          setIsLoading(false);
          Alert.alert("Erro 3D", "Não foi possível carregar o avatar.");
        }
      );
    } catch (e) {
      console.error("Erro no loader:", e);
    }

    // Loop de Animação
    const render = () => {
      requestAnimationFrame(render);
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.003; // Rotação automática suave
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  // --- EFEITO: ALTERAR A ESCALA DO MODELO BASEADO NO PESO/GORDURA ---
  useEffect(() => {
    if (!modelRef.current) return;

    // Simulação Simplificada:
    // Gordura aumenta a escala no eixo X e Z (largura/profundidade)
    const baseScale = 1.2; // Escala inicial do modelo
    
    // Fator de Gordura: 15% é o padrão (fator 1). 30% aumenta 20%.
    const fatFactor = 1 + Math.max(0, (gordura - 15) / 100) * 1.5;
    
    // Fator de Peso (Massa Global): 70kg é o padrão.
    const weightFactor = Math.max(1, peso / 70);

    // A escala final é uma combinação dos dois fatores
    const finalScaleX = baseScale * fatFactor * weightFactor;
    const finalScaleY = baseScale * weightFactor; // Altura cresce só com peso/músculo
    const finalScaleZ = baseScale * fatFactor * weightFactor;

    modelRef.current.scale.set(finalScaleX, finalScaleY, finalScaleZ);

  }, [peso, gordura, isLoading]);

  return (
    <View style={{flex: 1}}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando Avatar...</Text>
        </View>
      )}
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, backgroundColor: '#000', paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 15 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  tabBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#fff' },

  // 3D
  floatingStats: { position: 'absolute', top: 20, left: 20, right: 20, zIndex: 10, backgroundColor: 'rgba(24, 24, 27, 0.9)', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  statLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: 'bold' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  divider: { width: 1, height: 30, backgroundColor: '#3f3f46' },
  canvasContainer: { flex: 1, marginTop: 80, marginBottom: 10 },
  hintText: { textAlign: 'center', color: '#52525b', fontSize: 12, marginBottom: 10 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  loadingText: { color: '#fff', marginTop: 10 },

  // Gráficos (Ajustados)
  contentContainer: { padding: 20 },
  chartTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
  chartSubtitle: { color: '#a1a1aa', fontSize: 12, marginBottom: 20 },
  chartBox: { 
    backgroundColor: '#18181b', 
    paddingVertical: 25, // Mais padding vertical
    paddingHorizontal: 10,
    borderRadius: 16, 
    marginBottom: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#27272a',
    overflow: 'hidden' // Garante que nada vaze
  },

  // Histórico Novo
  tableCard: { backgroundColor: '#18181b', borderRadius: 16, borderWidth: 1, borderColor: '#27272a', overflow: 'hidden', padding: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#3f3f46', paddingBottom: 10, marginBottom: 5, paddingHorizontal: 5 },
  tableHeadText: { color: '#52525b', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, alignItems: 'center', paddingHorizontal: 5 },
  borderBottom: { borderBottomWidth: 1, borderColor: '#27272a' },
  tableCell: { fontSize: 14 },

  // Geral
  updateButton: { marginVertical: 20, backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  updateButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#18181b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272a' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: '#a1a1aa', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#09090b', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#27272a', fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 16, backgroundColor: '#27272a', borderRadius: 12, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 16, backgroundColor: '#3b82f6', borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: 'bold' },
  saveText: { color: '#fff', fontWeight: 'bold' }
});