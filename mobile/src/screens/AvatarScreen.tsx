import 'fast-text-encoding'; // 👈 O escudo contra o erro de TextDecoder
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import Slider from '@react-native-community/slider';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';


// @ts-ignore
import { GLTFLoader } from 'three-stdlib'; 

const SCREEN_WIDTH = Dimensions.get('window').width;


const HUMAN_MODEL_URL = 'https://cbzkibbgwfyxrupzhvla.supabase.co/storage/v1/object/public/AVATARSCREEN/base_male_body_meshy.glb';

export default function AvatarScreen() {
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'Graficos' | 'Historico' | '3D'>('3D');
  const [historico, setHistorico] = useState<any[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [novoPeso, setNovoPeso] = useState('');
  const [novaGordura, setNovaGordura] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [pesoSimulado, setPesoSimulado] = useState(70);
  const [gorduraSimulada, setGorduraSimulada] = useState(15);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('evolution_logs')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const formatado = data.map(log => {
          const date = new Date(log.created_at);
          return {
            id: log.id,
            data: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
            peso: Number(log.weight),
            gordura: Number(log.body_fat)
          };
        });
        setHistorico(formatado);
        
        const ultimo = formatado[formatado.length - 1];
        setPesoSimulado(ultimo.peso);
        setGorduraSimulada(ultimo.gordura);
      } else {
        setHistorico([]);
      }
    } catch (error) {
      console.log("Erro ao buscar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchHistorico(); }, []));

  const salvarMedicao = async () => {
    if (!novoPeso || !novaGordura) return Alert.alert("Atenção", "Preenche o peso e a gordura!");
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const p = parseFloat(novoPeso.replace(',', '.'));
      const g = parseFloat(novaGordura.replace(',', '.'));

      const { error: logError } = await supabase.from('evolution_logs').insert({
        student_id: user.id, weight: p, body_fat: g
      });
      if (logError) throw logError;

      await supabase.from('student_trainer').update({ weight: p, body_fat: g }).eq('student_id', user.id);

      Alert.alert("Sucesso! 💪", "Novo físico registado no Protocolo Caverna!");
      setModalVisible(false);
      setNovoPeso('');
      setNovaGordura('');
      fetchHistorico(); 
    } catch (error: any) {
      Alert.alert("Erro ao salvar", error.message);
    } finally {
      setSalvando(false);
    }
  };

  const dadosGraficoAgrupado: any[] = [];
  historico.forEach((h) => {
    dadosGraficoAgrupado.push({ value: h.peso, label: h.data, spacing: 4, labelWidth: 30, labelTextStyle: { color: '#a1a1aa', fontSize: 10 }, frontColor: '#3b82f6', topLabelComponent: () => <Text style={{color: '#3b82f6', fontSize: 9, marginBottom: 2}}>{h.peso}</Text> });
    dadosGraficoAgrupado.push({ value: h.gordura, frontColor: '#ef4444', spacing: 32, topLabelComponent: () => <Text style={{color: '#ef4444', fontSize: 9, marginBottom: 2}}>{h.gordura}%</Text> });
  });

  if (loading) return <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#d8b4fe" /></View>;

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

      {abaAtiva === '3D' && (
        <View style={{flex: 1}}>
          <View style={styles.floatingStats}>
            <View>
              <Text style={styles.statLabel}>PESO SIMULADO</Text>
              <Text style={styles.statValue}>{pesoSimulado.toFixed(1)} kg</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.statLabel}>GORDURA</Text>
              <Text style={styles.statValue}>{gorduraSimulada.toFixed(1)}%</Text>
            </View>
          </View>

          <View style={styles.canvasContainer}>
            <AvatarHumanScene peso={pesoSimulado} gordura={gorduraSimulada} modelUrl={HUMAN_MODEL_URL} />
          </View>
          
          <View style={styles.simulatorContainer}>
            <Text style={styles.simulatorTitle}> Simulador Corporal</Text>
            
            <View style={styles.sliderBox}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Ganho de Massa (Peso)</Text>
                <Text style={styles.sliderValue}>{pesoSimulado.toFixed(1)} kg</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={40}
                maximumValue={150}
                value={pesoSimulado}
                onValueChange={setPesoSimulado}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#27272a"
                thumbTintColor="#3b82f6"
              />
            </View>

            <View style={styles.sliderBox}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Secar (Percentual de Gordura)</Text>
                <Text style={styles.sliderValue}>{gorduraSimulada.toFixed(1)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={50}
                value={gorduraSimulada}
                onValueChange={setGorduraSimulada}
                minimumTrackTintColor="#ef4444"
                maximumTrackTintColor="#27272a"
                thumbTintColor="#ef4444"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateButtonText}>SALVAR MEDIDAS REAIS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- ABA GRÁFICOS --- */}
      {abaAtiva === 'Graficos' && (
        <ScrollView style={styles.contentContainer}>
          <Text style={styles.chartTitle}>Comparativo: Peso vs Gordura</Text>
          <Text style={styles.chartSubtitle}>🔵 Peso (kg)  |  🔴 Gordura (%)</Text>
          <View style={styles.chartBox}>
            {historico.length < 2 ? (
               <View style={{alignItems: 'center', padding: 30, opacity: 0.5}}>
                 <Ionicons name="bar-chart" size={40} color="#71717a" />
                 <Text style={{color: '#71717a', marginTop: 10, textAlign: 'center'}}>Regista pelo menos 2 pesagens para gerar o gráfico.</Text>
               </View>
            ) : (
              <BarChart data={dadosGraficoAgrupado} barWidth={16} noOfSections={4} barBorderTopLeftRadius={4} barBorderTopRightRadius={4} yAxisThickness={0} xAxisThickness={1} xAxisColor="#3f3f46" yAxisTextStyle={{color: '#52525b'}} hideRules height={220} width={SCREEN_WIDTH - 90} isAnimated initialSpacing={20} />
            )}
          </View>
        </ScrollView>
      )}

      {/* --- ABA HISTÓRICO --- */}
      {abaAtiva === 'Historico' && (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, {flex: 1.2, textAlign: 'left'}]}>DATA</Text>
              <Text style={[styles.tableHeadText, {flex: 1, textAlign: 'center'}]}>PESO</Text>
              <Text style={[styles.tableHeadText, {flex: 1, textAlign: 'right'}]}>BF %</Text>
            </View>
            {historico.length === 0 ? (
               <Text style={{color: '#71717a', textAlign: 'center', padding: 20}}>Nenhum registo ainda.</Text>
            ) : (
              historico.slice().reverse().map((item, index, arr) => {
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
              })
            )}
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateButtonText}>NOVA MEDIÇÃO</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualizar Físico Real</Text>
            <Text style={styles.inputLabel}>Peso Atual (kg)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 95.5" placeholderTextColor="#52525b" value={novoPeso} onChangeText={setNovoPeso} />
            <Text style={styles.inputLabel}>Gordura Atual (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 24" placeholderTextColor="#52525b" value={novaGordura} onChangeText={setNovaGordura} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={salvando}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={salvarMedicao} disabled={salvando}>
                {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Salvar</Text>}
              </TouchableOpacity>
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

// --- CENA 3D GLTF (COM MORPH TARGETS INTELIGENTES) ---
function AvatarHumanScene({ peso, gordura, modelUrl }: { peso: number, gordura: number, modelUrl: string }) {
  const modelRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const frameId = useRef<number>(0); 

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.0); 

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const carregarModelo = async () => {
      try {
        const response = await fetch(modelUrl);
        const arrayBuffer = await response.arrayBuffer();
        const loader = new GLTFLoader();

        loader.parse(arrayBuffer, '', (gltf: any) => {
          const model = gltf.scene;
          const foundMeshes: THREE.Mesh[] = [];

          model.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.material = new THREE.MeshStandardMaterial({ 
                color: 0x9ca3af, roughness: 0.4, metalness: 0.5 
              }); 
              
              // 🎯 Captura apenas as partes que têm músculos/gordura
              if (child.morphTargetDictionary && child.morphTargetInfluences) {
                foundMeshes.push(child);
              }
            }
          });

          // Ajustes de Escala e Posição (Enquadramento que arrumamos)
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const baseScale = 3.0 / size.y; 
          model.scale.set(baseScale, baseScale, baseScale);
          model.position.x = -center.x * baseScale;
          model.position.y = -(size.y / 2) * baseScale; 
          model.position.z = -center.z * baseScale;

          // 🚀 SALVANDO AS MALHAS
          meshesRef.current = foundMeshes;
          modelRef.current = model;
          scene.add(model);
          
          console.log(`✅ SCANNER: ${foundMeshes.length} partes do corpo prontas para amassar.`);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Erro no carregamento:', error);
        setIsLoading(false);
      }
    };

    carregarModelo();

    const render = () => {
      frameId.current = requestAnimationFrame(render);
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005; 
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  // 🔥 O NOVO COMANDO DE MUTAÇÃO
  useEffect(() => {
    if (meshesRef.current.length === 0) return;

    // Vamos usar o peso para testar esse morph target "0"
    const influence = Math.max(0, Math.min(1, (peso - 60) / 60));

    console.log(`📏 Testando Morph Target "0" com valor: ${influence}`);

    meshesRef.current.forEach((mesh) => {
      const influences = mesh.morphTargetInfluences;
      if (influences) {
        // 🚨 Mudamos de 'bodyMuscle' para '0' que é o que apareceu no seu LOG
        influences[0] = influence; 
      }
    });

  }, [peso, gordura, isLoading]); // isLoading aqui garante que aplica assim que carregar

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>A forjar o shape do IRONPRO...</Text>
        </View>
      )}
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}

// ... ESTILOS (MANTIDOS INTACTOS)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, backgroundColor: '#000', paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 15 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
  tabBtnActive: { backgroundColor: '#4c1d95', borderColor: '#4c1d95' }, 
  tabText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  floatingStats: { position: 'absolute', top: 20, left: 20, right: 20, zIndex: 10, backgroundColor: 'rgba(24, 24, 27, 0.9)', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  statLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: 'bold' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  divider: { width: 1, height: 30, backgroundColor: '#3f3f46' },
  canvasContainer: { flex: 1, marginTop: 70, marginBottom: 5 },
  simulatorContainer: { paddingHorizontal: 20, marginBottom: 5 },
  simulatorTitle: { color: '#d8b4fe', fontWeight: 'bold', fontSize: 14, marginBottom: 5, textAlign: 'center' },
  sliderBox: { backgroundColor: '#18181b', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', marginBottom: 8 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0 },
  sliderLabel: { color: '#a1a1aa', fontSize: 11, fontWeight: 'bold' },
  sliderValue: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  slider: { width: '100%', height: 35 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  loadingText: { color: '#fff', marginTop: 10 },
  contentContainer: { padding: 20 },
  chartTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
  chartSubtitle: { color: '#a1a1aa', fontSize: 12, marginBottom: 20 },
  chartBox: { backgroundColor: '#18181b', paddingVertical: 25, paddingHorizontal: 10, borderRadius: 16, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#27272a', overflow: 'hidden' },
  tableCard: { backgroundColor: '#18181b', borderRadius: 16, borderWidth: 1, borderColor: '#27272a', overflow: 'hidden', padding: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#3f3f46', paddingBottom: 10, marginBottom: 5, paddingHorizontal: 5 },
  tableHeadText: { color: '#52525b', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, alignItems: 'center', paddingHorizontal: 5 },
  borderBottom: { borderBottomWidth: 1, borderColor: '#27272a' },
  tableCell: { fontSize: 14 },
  updateButton: { marginHorizontal: 20, marginBottom: 15, backgroundColor: '#4c1d95', padding: 14, borderRadius: 12, alignItems: 'center' },
  updateButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#18181b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272a' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: '#a1a1aa', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#09090b', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#27272a', fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 16, backgroundColor: '#27272a', borderRadius: 12, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 16, backgroundColor: '#4c1d95', borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: 'bold' },
  saveText: { color: '#fff', fontWeight: 'bold' }
});