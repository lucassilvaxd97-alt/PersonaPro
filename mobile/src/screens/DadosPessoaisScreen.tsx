import React, { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, Image, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker'; 
// 🚀 Importante para converter a imagem no mobile
import { decode } from 'base64-arraybuffer'; 

export default function DadosPessoaisScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [sexo, setSexo] = useState("");
  const [email, setEmail] = useState(""); 
  // Estado para a foto (agora buscará do banco)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [uploading, setUploading] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || ""); 

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, gender, avatar_url') // ✅ Busca avatar_url
        .eq('id', user.id)
        .single();

      if (profile) {
        setNome(profile.full_name || "");
        setSexo(profile.gender || "");
        setAvatarUrl(profile.avatar_url || null); // ✅ Carrega a foto existente
      }
    } catch (error) { console.log(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUserData(); }, []);

  // --- 📸 FUNÇÃO DE UPLOAD REAL PARA O SUPABASE STORAGE ---
  const uploadAvatar = async (uri: string) => {
  try {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Gerar nome de arquivo único (Evita cache antigo)
    const fileExt = uri.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    // 2. LER A IMAGEM COMO BASE64 (Onde dava o erro de FileSystem)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. ENVIAR PARA O SUPABASE STORAGE
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 4. PEGAR A URL PÚBLICA
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // 5. ATUALIZAR A TABELA PROFILES
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) throw updateError;

    setAvatarUrl(publicUrl);
    Alert.alert("IRONPRO 🦾", "Foto blindada no seu perfil!");

  } catch (error: any) {
    console.error("Erro no Processo:", error);
    Alert.alert("Erro no Upload", "Certifique-se de que o bucket 'avatars' é público no Supabase.");
  } finally {
    setUploading(false);
  }
};

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("IRONPRO", "Precisamos de permissão para acessar suas fotos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Quadrada
      quality: 0.3, // Qualidade baixa para upload rápido
    });

    if (!result.canceled) {
      // 🚀 Chama a função de upload real
      uploadAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Mantém o salvamento de Nome e Sexo que já tínhamos
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('profiles').upsert({
        id: user?.id,
        full_name: nome,
        gender: sexo,
        updated_at: new Date()
      });
      Alert.alert("IRONPRO", "Dados salvos.");
      navigation.goBack(); 
    } catch (error) { Alert.alert("Erro", "Falha ao salvar."); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{padding: 20}} showsVerticalScrollIndicator={false}>
        {/* ... (Header mantido) ... */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
      </View>

      {/* SEÇÃO DA FOTO REAL */}
      <View style={styles.photoSection}>
        <View style={styles.avatarWrapper}>
          {/* Mostra a foto real do banco OU a foto padrão */}
          {uploading ? (
            <View style={[styles.avatar, styles.avatarLoading]}><ActivityIndicator color="#3b82f6" /></View>
          ) : (
            <Image 
              source={{ uri: avatarUrl || 'https://github.com/shadcn.png' }} 
              style={styles.avatar} 
            />
          )}
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage} disabled={uploading}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.photoTip}>{uploading ? "Subindo..." : "Toque na câmera para mudar"}</Text>
      </View>

      {/* ... (Inputs mantidos) ... */}
       <View style={styles.inputGroup}>
        <Text style={styles.label}>E-MAIL (NÃO ALTERÁVEL)</Text>
        <TextInput style={[styles.input, {color: '#71717a'}]} value={email} editable={false} />

        <Text style={styles.label}>NOME NO APP</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome maromba" placeholderTextColor="#52525b" />

        <Text style={styles.label}>SEXO</Text>
        <View style={styles.genderRow}>
          {['Masculino', 'Feminino'].map((item) => (
            <TouchableOpacity key={item} style={[styles.genderBtn, sexo === item && styles.genderBtnActive]} onPress={() => setSexo(item)}>
              <Text style={[styles.genderText, sexo === item && {color: '#000'}]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading || uploading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>CONFIRMAR MUDANÇAS</Text>}
      </TouchableOpacity>

      <View style={{height: 40}} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (Estilos mantidos, adicionando o loading do avatar)
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 40, marginBottom: 25 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  photoSection: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#3b82f6' },
  avatarLoading: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181b' },
  cameraBtn: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#3b82f6', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  photoTip: { color: '#71717a', fontSize: 12, marginTop: 8 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#3b82f6', fontSize: 11, fontWeight: 'bold', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#18181b', color: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#27272a' },
  genderRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  genderBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', alignItems: 'center', backgroundColor: '#18181b' },
  genderBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  genderText: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});