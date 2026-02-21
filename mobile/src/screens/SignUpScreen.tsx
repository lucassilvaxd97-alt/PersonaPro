import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, StatusBar, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function SignUpScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'trainer'>('student');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // 1. Validações
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Campos Vazios", "Preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Senha Fraca", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // 2. Criar Conta no Supabase
      // O 'options.data' envia os metadados que nosso Trigger no banco vai usar
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
            role: userType // 'student' ou 'trainer'
          }
        }
      });

      if (error) throw error;

      // 3. Sucesso!
      Alert.alert(
        "Conta Criada! 🦖",
        "Seu cadastro foi realizado com sucesso! Faça login para entrar.",
        [{ text: "OK", onPress: () => navigation.navigate('Login') }]
      );

    } catch (error: any) {
      Alert.alert("Erro no Cadastro", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Header com Botão Voltar */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerArea}>
              <Text style={styles.title}>Crie sua conta</Text>
              <Text style={styles.subtitle}>Junte-se à elite do IRONPRO</Text>
            </View>

            {/* SELETOR DE PERFIL */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, userType === 'student' && styles.toggleActive]}
                onPress={() => setUserType('student')}
              >
                <Ionicons name="person" size={16} color={userType === 'student' ? '#fff' : '#71717a'} />
                <Text style={[styles.toggleText, userType === 'student' && styles.textActive]}>QUERO TREINAR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.toggleButton, userType === 'trainer' && styles.toggleActive]}
                onPress={() => setUserType('trainer')}
              >
                <Ionicons name="fitness" size={16} color={userType === 'trainer' ? '#fff' : '#71717a'} />
                <Text style={[styles.toggleText, userType === 'trainer' && styles.textActive]}>SOU PERSONAL</Text>
              </TouchableOpacity>
            </View>

            {/* FORMULÁRIO */}
            <View style={styles.form}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: Carlos Silva" 
                  placeholderTextColor="#52525b" 
                  value={name} 
                  onChangeText={setName} 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="seu@email.com" 
                  placeholderTextColor="#52525b" 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                  value={email} 
                  onChangeText={setEmail} 
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="******" 
                    placeholderTextColor="#52525b" 
                    secureTextEntry 
                    value={password} 
                    onChangeText={setPassword} 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Confirmar</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="******" 
                    placeholderTextColor="#52525b" 
                    secureTextEntry 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.signupButton, loading && { opacity: 0.7 }]} 
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>CRIAR CONTA</Text>}
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  keyboardView: { flex: 1 },
  content: { padding: 24, paddingBottom: 50 },
  backButton: { marginBottom: 20 },
  
  headerArea: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitle: { color: '#a1a1aa', fontSize: 16 },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 12, padding: 4, marginBottom: 30, borderWidth: 1, borderColor: '#27272a' },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
  toggleActive: { backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46' },
  toggleText: { color: '#71717a', fontWeight: 'bold', fontSize: 12 },
  textActive: { color: '#fff' },

  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#e4e4e7', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#18181b', color: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', fontSize: 16 },

  signupButton: { backgroundColor: '#3b82f6', alignItems: 'center', paddingVertical: 18, borderRadius: 12, marginTop: 10, shadowColor: '#3b82f6', shadowOpacity: 0.3, elevation: 6 },
  signupButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});