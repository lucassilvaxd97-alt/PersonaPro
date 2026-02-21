import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; // <--- A MÁGICA ESTÁ AQUI
import { supabase } from '../services/supabase';

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.log('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- ABRIR GALERIA ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Precisamos acessar sua galeria.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // <--- IMPORTANTE: Pedimos a foto em texto também
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Passamos o base64 junto
      uploadImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  // --- UPLOAD BLINDADO (VIA BASE64) ---
  const uploadImage = async (uri: string, base64: string | null | undefined) => {
    try {
      setUploading(true);

      if (!base64) {
        throw new Error("Falha ao processar imagem (base64 vazio).");
      }

      // Nome do arquivo com timestamp para não cachear velho
      const fileName = `${userId}/${Date.now()}.png`;

      // A Mágica: Converte texto Base64 para ArrayBuffer (Binário Real)
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/png', // Forçamos o tipo para garantir
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Pega o Link Público
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // Força atualização visual adicionando um numero aleatorio no final da URL
      // (Isso evita que o app mostre a foto velha do cache)
      setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`);

    } catch (error: any) {
      Alert.alert("Erro no Upload", error.message);
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updates = {
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      Alert.alert("Sucesso! 🦖", "Perfil atualizado.");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Erro ao salvar", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color="#4f46e5" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <View style={{width: 24}} /> 
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <View style={styles.content}>
          <View style={styles.avatarArea}>
            <TouchableOpacity onPress={pickImage} disabled={uploading}>
              <View style={styles.avatarContainer}>
                {uploading ? (
                  <ActivityIndicator color="#4f46e5" />
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <Text style={{fontSize: 40}}>🦖</Text>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="images" size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Toque para abrir a galeria</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>NOME COMPLETO</Text>
            <TextInput 
              style={styles.input} 
              value={fullName} 
              onChangeText={setFullName} 
              placeholder="Seu nome"
              placeholderTextColor="#52525b"
            />
            <Text style={styles.label}>E-MAIL (Fixo)</Text>
            <View style={[styles.input, styles.disabledInput]}>
               <Text style={{color: '#71717a'}}>{email}</Text>
               <Ionicons name="lock-closed" size={16} color="#52525b" />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SALVAR ALTERAÇÕES</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderColor: '#18181b' },
  backBtn: { padding: 5 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 24, flex: 1 },
  avatarArea: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatarContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#18181b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#4f46e5', position: 'relative' },
  avatar: { width: 114, height: 114, borderRadius: 57 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4f46e5', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  changePhotoText: { color: '#3b82f6', marginTop: 15, fontWeight: 'bold', fontSize: 14 },
  form: { gap: 20 },
  label: { color: '#71717a', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  input: { backgroundColor: '#09090b', color: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', fontSize: 16 },
  disabledInput: { backgroundColor: '#18181b', borderColor: '#27272a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveBtn: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
});