import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORTAÇÃO DAS TELAS ---
// Certifique-se que todos esses arquivos existem na pasta src/screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';     // A nova Dashboard
import TreinoScreen from './src/screens/TreinoScreen'; // A lista de exercícios
import DietaScreen from './src/screens/DietaScreen';   // O plano alimentar
import AvatarScreen from './src/screens/AvatarScreen'; // O cubo/boneco 3D

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- CONFIGURAÇÃO DO MENU INFERIOR (ABAS) ---
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Esconde o cabeçalho padrão do React Native
        tabBarActiveTintColor: '#3b82f6', // AZUL TECH (Combinando com o Login)
        tabBarInactiveTintColor: '#71717a', // Cinza escuro para inativos
        tabBarStyle: { 
          backgroundColor: '#18181b', // Fundo quase preto (Zinc 900)
          borderTopColor: '#27272a',  // Borda sutil no topo
          paddingBottom: 5,
          height: 60,
          elevation: 0, // Remove sombra no Android para ficar flat
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 4,
        },
        // Lógica dos Ícones
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'alert';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Treinos') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Dieta') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Evolucao3D') {
            iconName = focused ? 'body' : 'body-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      {/* 1. Dashboard: Onde o aluno cai ao entrar */}
      <Tab.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{ title: 'Início' }}
      />
      
      {/* 2. Treinos: A ficha técnica */}
      <Tab.Screen 
        name="Treinos" 
        component={TreinoScreen} 
      />
      
      {/* 3. Dieta: O plano alimentar */}
      <Tab.Screen 
        name="Dieta" 
        component={DietaScreen} 
      />
      
      {/* 4. Evolução: O Avatar 3D e Gráficos */}
      <Tab.Screen 
        name="Evolucao3D" 
        component={AvatarScreen} 
        options={{ title: 'Evolução' }}
      /> 
    </Tab.Navigator>
  );
}

// --- CONFIGURAÇÃO PRINCIPAL (LOGIN -> APP) ---
export default function App() {
  return (
    <NavigationContainer>
      {/* StatusBar deixa os ícones de bateria/hora brancos no fundo preto */}
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Tela 1: Login (Entrada) */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Tela 2: O App Principal (Com Abas) */}
        <Stack.Screen name="MainTabs" component={AppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}