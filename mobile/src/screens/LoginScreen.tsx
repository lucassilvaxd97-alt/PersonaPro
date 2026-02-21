import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importe o serviço do Supabase
import { supabase } from '../services/supabase'; 

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'trainer'>('student');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Validação Básica
    if (email === '' || password === '') {
      Alert.alert("Campos Vazios", "Por favor, digite seu e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      // 2. Tenta Logar no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setLoading(false);
        Alert.alert("Erro no Login", "E-mail ou senha incorretos.");
        return;
      }

      // 3. Se logou, verifica o Perfil (Role) no Banco de Dados
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          setLoading(false);
          Alert.alert("Erro de Perfil", "Usuário encontrado, mas sem perfil definido.");
          return;
        }

        const realRole = profile.role || 'student'; // Se não tiver role, assume aluno

        // 4. Verifica se ele escolheu o botão certo no topo
        if (userType !== realRole) {
          setLoading(false);
          Alert.alert(
            "Acesso Incorreto", 
            `Este login pertence a um ${realRole === 'trainer' ? 'TREINADOR' : 'ALUNO'}. Troque a opção no topo!`
          );
          await supabase.auth.signOut(); // Desloga por segurança
          return;
        }

        // 5. Redireciona para a tela certa
        setLoading(false);
        if (realRole === 'trainer') {
          navigation.replace('TrainerTabs');
        } else {
          navigation.replace('MainTabs');
        }
      }

    } catch (e) {
      setLoading(false);
      Alert.alert("Erro Fatal", "Ocorreu um erro inesperado. Tente novamente.");
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          
          {/* 1. LOGO IRONPRO */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
               <View style={styles.logoIconRow}>
                  <Ionicons name="barbell" size={40} color="#fff" style={styles.iconBack} />
                  <Ionicons name="flash" size={28} color="#3b82f6" style={styles.iconFront} />
               </View>
            </View>
            <Text style={styles.appName}>IRON<Text style={styles.brandSuffix}>PRO</Text></Text>
          </View>

          {/* 2. SELETOR DE PERFIL (TOGGLE) */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, userType === 'student' && styles.toggleActive]}
              onPress={() => setUserType('student')}
              activeOpacity={0.9}
            >
              <Ionicons 
                name="person" 
                size={16} 
                color={userType === 'student' ? '#fff' : '#71717a'} 
              />
              <Text style={[styles.toggleText, userType === 'student' && styles.textActive]}>SOU ALUNO</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleButton, userType === 'trainer' && styles.toggleActive]}
              onPress={() => setUserType('trainer')}
              activeOpacity={0.9}
            >
              <Ionicons 
                name="fitness" 
                size={16} 
                color={userType === 'trainer' ? '#fff' : '#71717a'} 
              />
              <Text style={[styles.toggleText, userType === 'trainer' && styles.textActive]}>SOU PERSONAL</Text>
            </TouchableOpacity>
          </View>

          {/* 3. FORMULÁRIO */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {userType === 'student' ? 'E-mail do Aluno' : 'E-mail Corporativo'}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#52525b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder={userType === 'student' ? "ex: aluno@ironpro.com" : "ex: admin@ironpro.com"}
                  placeholderTextColor="#52525b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#52525b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="••••••"
                  placeholderTextColor="#52525b"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* BOTÃO DE AÇÃO COM LOADING */}
            <TouchableOpacity 
              style={[
                styles.loginButton, 
                userType === 'trainer' && styles.loginButtonTrainer, 
                loading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    {userType === 'student' ? 'ACESSAR TREINOS' : 'ACESSAR PAINEL'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* LINKS SECUNDÁRIOS */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            {/* LINK PARA CADASTRO (SIGN UP) */}
            <View style={styles.divider}>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={{padding: 10}}>
                <Text style={styles.helperText}>
                  {userType === 'student' 
                    ? 'Ainda não tem conta? Toque aqui para criar.' 
                    : 'Quer ser um Treinador IRONPRO? Cadastre-se aqui.'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  keyboardView: { flex: 1, justifyContent: 'center' },
  content: { padding: 24, width: '100%' },
  
  // LOGO
  logoArea: { alignItems: 'center', marginBottom: 30 },
  logoBox: {
    width: 70, height: 70, borderRadius: 14, backgroundColor: '#09090b',
    borderWidth: 1.5, borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center',
    marginBottom: 10, shadowColor: '#3b82f6', shadowOpacity: 0.4, elevation: 8
  },
  logoIconRow: { position: 'relative', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  iconBack: { transform: [{ rotate: '-45deg' }], opacity: 0.9 },
  iconFront: { position: 'absolute', bottom: 0, right: 0 },
  appName: { fontSize: 32, fontWeight: '900', color: '#fff', fontStyle: 'italic', letterSpacing: 1 },
  brandSuffix: { color: '#3b82f6' },

  // TOGGLE
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#27272a'
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46'
  },
  toggleText: {
    color: '#71717a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  textActive: {
    color: '#fff',
  },

  // FORM
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#e4e4e7', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b',
    borderRadius: 12, borderWidth: 1, borderColor: '#27272a',
  },
  inputIcon: { marginLeft: 16, marginRight: 8 },
  input: { flex: 1, color: '#fff', paddingVertical: 16, paddingRight: 16, fontSize: 16 },
  
  loginButton: {
    backgroundColor: '#3b82f6', // Azul (Aluno)
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 18, borderRadius: 12, marginTop: 10,
    shadowColor: '#3b82f6', shadowOpacity: 0.3, elevation: 6,
  },
  loginButtonTrainer: {
    backgroundColor: '#4f46e5', // Roxo (Trainer)
    shadowColor: '#4f46e5',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8, letterSpacing: 0.5 },
  
  forgotButton: { marginTop: 20, alignItems: 'center' },
  forgotText: { color: '#a1a1aa', fontSize: 14 },
  
  divider: { marginTop: 30, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#27272a', paddingTop: 20 },
  helperText: { color: '#3b82f6', fontSize: 14, fontWeight: '600', textAlign: 'center' }, // Link destacado
});