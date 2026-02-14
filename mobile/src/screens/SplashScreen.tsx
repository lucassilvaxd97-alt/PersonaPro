import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  StatusBar,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const [podeEntrar, setPodeEntrar] = useState(false);

  // Valores animados
  const fadeAnim = useRef(new Animated.Value(0)).current;  
  const scaleAnim = useRef(new Animated.Value(1)).current; 

  useEffect(() => {
    // 1. Entrada Triunfal
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 2. Loop do Coração (Batida)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }), // Tum...
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),    // ...volta
        Animated.delay(100),
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }), // Tum...
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),    // ...volta
        Animated.delay(1200), // Pausa dramática
      ])
    ).start();

    // 3. Libera o clique
    const timer = setTimeout(() => {
      setPodeEntrar(true);
    }, 1500); // 1.5s para garantir que ele viu a marca

    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    if (podeEntrar) {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Área clicável gigante para facilitar */}
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePress}
        style={styles.touchableArea}
      >
        <Animated.View 
          style={{ 
            opacity: fadeAnim, 
            alignItems: 'center',
            transform: [{ scale: scaleAnim }] 
          }}
        >
          {/* O Ícone Pulsante */}
          <View style={styles.iconCircle}>
            <Ionicons name="fitness" size={90} color="#3b82f6" />
          </View>
        </Animated.View>

        {/* Textos (Fora da escala para não tremer, mas com Fade) */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', marginTop: 40 }}>
          
          {/* TÍTULO NEON */}
          <Text style={styles.title}>PersonaPro</Text>
          
          {/* SUBTÍTULO ESPAÇADO */}
          <Text style={styles.subtitle}>Sua evolução começa aqui</Text>

          {/* Dica visual discreta */}
          <View style={[styles.hintContainer, { opacity: podeEntrar ? 1 : 0 }]}>
            <Text style={styles.hintText}>Toque para iniciar</Text>
            <Ionicons name="chevron-forward" size={14} color="#52525b" />
          </View>

        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Preto Absoluto
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableArea: {
    flex: 1,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(9, 9, 11, 1)', // Fundo quase preto
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6', 
    // Efeito Neon Global
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30, 
    elevation: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '900', // Extra Bold
    color: '#fff',
    letterSpacing: 1,
    // Sombra Neon no Texto
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#3b82f6', // Azul Tech
    fontWeight: 'bold',
    letterSpacing: 4, // Espaçamento estilo cinema
    textTransform: 'uppercase',
  },
  hintContainer: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hintText: {
    color: '#52525b',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});