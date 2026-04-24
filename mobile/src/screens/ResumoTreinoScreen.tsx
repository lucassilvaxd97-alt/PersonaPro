import React, { useRef, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ImageBackground, Alert, ActivityIndicator, ScrollView, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

// 📸 BIBLIOTECA DE IMAGENS PADRÃO DO IRONPRO
const IMAGENS_PADRAO = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1469&auto=format&fit=crop'
];

export default function ResumoTreinoScreen({ navigation, route }: any) {
  const dadosTreino = route.params?.treino || {};

  const treinoTitle = dadosTreino.titulo || "TREINO MONSTRO";
  const tempoTreino = dadosTreino.tempo || "00:00";
  const volumeTotal = dadosTreino.volume || "0 kg";
  const musculos = dadosTreino.musculos || "Foco no Shape";

  const [fundo, setFundo] = useState(IMAGENS_PADRAO[0]); // Começa com a primeira imagem padrão
  const [capturing, setCapturing] = useState(false);
  const viewShotRef = useRef<any>(null);

  // 🖼️ ABRIR GALERIA DO CELULAR
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('IRONPRO', 'Libera a galeria aí, monstro!');

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16], 
      quality: 0.8,
    });

    if (!result.canceled) setFundo(result.assets[0].uri);
  };

  // 📷 TIRAR FOTO NA HORA (CÂMERA)
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('IRONPRO', 'Libera a câmera para o pump!');

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) setFundo(result.assets[0].uri);
  };

  // 🚀 COMPARTILHAR NAS REDES
  const shareTreino = async () => {
    try {
      setCapturing(true);
      const uri = await viewShotRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Compartilhar meu treino IRONPRO',
        });
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar.");
    } finally {
      setCapturing(false);
    }
  };

  // ❌ FECHAR E IR PARA O DASHBOARD (OPCIONAL)
  const fecharResumo = () => {
    navigation.navigate('Início'); // Ajuste para o nome exato da sua tela principal
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER (Agora tem um botão "Pular") */}
      <View style={styles.header}>
        <TouchableOpacity onPress={fecharResumo}>
          <Ionicons name="close" size={28} color="#71717a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumo do Treino</Text>
        <TouchableOpacity onPress={fecharResumo}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      {/* 📸 CARD DO STRAVA (O que vai pro print) */}
      <View style={styles.shotContainer}>
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={{ flex: 1 }}>
          <ImageBackground source={{ uri: fundo }} style={styles.cardImage} imageStyle={{ borderRadius: 20 }}>
            <View style={styles.overlay}>
              <View style={styles.statsContainer}>
                <Text style={styles.label}>Treino</Text>
                <Text style={styles.valueTitle}>{treinoTitle}</Text>

                <View style={styles.rowStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.label}>Tempo</Text>
                    <Text style={styles.value}>{tempoTreino}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.label}>Volume (KG)</Text>
                    <Text style={styles.value}>{volumeTotal}</Text>
                  </View>
                </View>

                <Text style={styles.label}>Foco do Dia</Text>
                <Text style={styles.valueSmall}>{musculos}</Text>
              </View>

              <View style={styles.brandContainer}>
                <Ionicons name="barbell" size={24} color="#3b82f6" />
                <Text style={styles.brandText}>IRONPRO</Text>
              </View>
            </View>
          </ImageBackground>
        </ViewShot>
      </View>

      {/* 🛠️ CONTROLES DE IMAGEM (Galeria do App, Câmera e Galeria do Celular) */}
      <View style={styles.imageSelectorContainer}>
        <Text style={styles.selectorTitle}>ESCOLHA O FUNDO</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollImages}>
          
          {/* BOTÃO CÂMERA */}
          <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
            <Ionicons name="camera" size={28} color="#fff" />
          </TouchableOpacity>

          {/* BOTÃO GALERIA DO CELULAR */}
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Ionicons name="images" size={28} color="#fff" />
          </TouchableOpacity>

          {/* IMAGENS PADRÃO DO APP */}
          {IMAGENS_PADRAO.map((img, index) => (
            <TouchableOpacity key={index} onPress={() => setFundo(img)}>
              <Image source={{ uri: img }} style={[styles.miniImage, fundo === img && styles.miniImageActive]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 🚀 BOTÃO DE COMPARTILHAR */}
      <TouchableOpacity style={styles.btnPrimary} onPress={shareTreino} disabled={capturing}>
        {capturing ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="logo-instagram" size={22} color="#000" />
            <Text style={styles.btnPrimaryText}>COMPARTILHAR NO STORY</Text>
          </>
        )}
      </TouchableOpacity>
      
      <View style={{ height: 20 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  skipText: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold' },
  
  shotContainer: { flex: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  cardImage: { flex: 1, justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'space-between', paddingVertical: 40, paddingHorizontal: 20 },
  
  statsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { color: '#e4e4e7', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 },
  valueTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 30, textAlign: 'center', textShadowColor: '#000', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 5 },
  rowStats: { flexDirection: 'row', gap: 40, marginBottom: 30 },
  statItem: { alignItems: 'center' },
  value: { color: '#fff', fontSize: 26, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 4 },
  valueSmall: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 4, textTransform: 'uppercase' },
  
  brandContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  brandText: { color: '#fff', fontSize: 22, fontWeight: '900', fontStyle: 'italic', textShadowColor: '#000', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 4 },

  imageSelectorContainer: { marginBottom: 20 },
  selectorTitle: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  scrollImages: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  iconButton: { width: 60, height: 60, backgroundColor: '#18181b', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  miniImage: { width: 60, height: 60, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  miniImageActive: { borderColor: '#3b82f6' },

  btnPrimary: { flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 10 },
  btnPrimaryText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});