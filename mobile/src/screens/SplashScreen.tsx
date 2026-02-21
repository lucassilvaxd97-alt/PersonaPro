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

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;  
  const scaleAnim = useRef(new Animated.Value(0.8)).current; 
  const barAnim = useRef(new Animated.Value(0)).current; 

  useEffect(() => {
    // 1. Entrada Triunfal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // 2. Barra de Carregamento Fake (Enche em 2.5s)
    Animated.timing(barAnim, {
      toValue: 1, 
      duration: 2500,
      useNativeDriver: false, 
    }).start();

    // 3. Libera o clique
    const timer = setTimeout(() => {
      setPodeEntrar(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    if (podeEntrar) {
      navigation.replace('Login');
    }
  };

  // Interpolação da largura da barra (0% -> 100%)
  const widthInterpolated = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handlePress}
        style={styles.touchableArea}
      >
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
          
          {/* LOGO BOX - ÍCONE DE FORÇA */}
          <View style={styles.logoBox}>
            <View style={styles.logoIconRow}>
              {/* Haltere inclinado para dar movimento */}
              <Ionicons name="barbell" size={60} color="#fff" style={styles.iconBack} />
              {/* Raio azul indicando energia/pro */}
              <Ionicons name="flash" size={40} color="#3b82f6" style={styles.iconFront} />
            </View>
          </View>

          {/* NOME DA MARCA ATUALIZADO */}
          <Text style={styles.brandName}>IRON<Text style={styles.brandSuffix}>PRO</Text></Text>
          <Text style={styles.tagline}>PROFESSIONAL TRAINING</Text>

        </Animated.View>

        {/* BARRA DE PROGRESSO */}
        <View style={styles.loadingContainer}>
          {/* Fundo da barra */}
          <View style={styles.progressBarBg}>
            {/* Preenchimento animado */}
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { width: widthInterpolated }
              ]} 
            />
          </View>
          
          {/* Texto de Status */}
          <Text style={styles.loadingText}>
            {podeEntrar ? "TAP TO START" : "SYSTEM LOADING..."}
          </Text>
        </View>

      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Preto Puro
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableArea: {
    flex: 1,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  
  // --- ESTILO DO LOGO ---
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 24, // Quadrado arredondado (App Icon style)
    backgroundColor: '#09090b', // Cinza muito escuro
    borderWidth: 2,
    borderColor: '#3b82f6', // Borda Azul Neon
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    // Glow Neon
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  logoIconRow: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBack: {
    transform: [{ rotate: '-45deg' }], 
    opacity: 0.9
  },
  iconFront: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    textShadowColor: 'rgba(0,0,0,1)', // Sombra preta para destacar o raio
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },

  // --- TIPOGRAFIA ---
  brandName: {
    fontSize: 48, // Aumentei um pouco
    fontWeight: '900', // Extra Bold
    color: '#fff',
    letterSpacing: 1,
    fontStyle: 'italic', // Itálico = Velocidade
  },
  brandSuffix: {
    color: '#3b82f6', // "PRO" em Azul
  },
  tagline: {
    color: '#52525b', // Cinza escuro
    fontSize: 10,
    letterSpacing: 4, // Espaçamento cinematográfico
    marginTop: 5,
    fontWeight: 'bold',
  },

  // --- BARRA DE LOADING ---
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  progressBarBg: {
    width: 180,
    height: 4,
    backgroundColor: '#27272a', // Trilho cinza escuro
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6', // Enchimento Azul
  },
  loadingText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    opacity: 0.9
  }
});