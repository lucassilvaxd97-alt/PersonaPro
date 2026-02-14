import React, { useState } from 'react'; // <--- O segredo tá aqui!
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

 const handleLogin = () => {
  if (email === '' || password === '') {
    Alert.alert("Atenção", "Preencha todos os campos!");
    return;
  }
  // Agora 'MainTabs' existe no App.tsx!
  navigation.navigate('MainTabs'); 
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          
          {/* 1. Área da Logo/Ícone */}
          <View style={styles.logoArea}>
            <View style={styles.iconCircle}>
              <Ionicons name="fitness" size={50} color="#3b82f6" />
            </View>
            <Text style={styles.appName}>PersonaPro</Text>
            <Text style={styles.appTagline}>Área do Aluno</Text>
          </View>

          {/* 2. Formulário */}
          <View style={styles.form}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuário ou E-mail</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#52525b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Seu acesso fornecido pelo personal"
                  placeholderTextColor="#52525b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha Provisória / Pessoal</Text>
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

            {/* 3. Botão de Ação Principal */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>ENTRAR NO SISTEMA</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            {/* 4. Ações Secundárias */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>Ainda não tem acesso?</Text>
              <Text style={styles.helperText}>Peça o cadastro ao seu Personal Trainer.</Text>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000', // Preto absoluto para fundo
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    width: '100%',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Azul bem fraquinho no fundo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f6', // Borda Azul Neon
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 16,
    color: '#3b82f6', // Texto Azul
    fontWeight: '600',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b', // Cinza muito escuro
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3b82f6', // AZUL TECH (Primary)
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  forgotButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  divider: {
    marginTop: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 20,
  },
  dividerText: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  helperText: {
    color: '#52525b',
    fontSize: 12,
  },
});

function alert(arg0: string) {
  throw new Error('Function not implemented.');
}
