import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// --- IMPORTAÇÃO DAS TELAS ---
// Certifique-se que esses arquivos existem na pasta src/screens
import LoginScreen from './src/screens/LoginScreen';
import TreinoScreen from './src/screens/TreinoScreen';
import DietaScreen from './src/screens/DietaScreen';
import AvatarScreen from './src/screens/AvatarScreen';

// Se der erro de "File not found", comente as linhas acima e descomente as linhas abaixo para testar:
/*
const TreinoScreen = () => <React.Fragment><Text>Treino</Text></React.Fragment>;
const DietaScreen = () => <React.Fragment><Text>Dieta</Text></React.Fragment>;
const AvatarScreen = () => <React.Fragment><Text>Avatar</Text></React.Fragment>;
*/

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- CONFIGURAÇÃO DO MENU INFERIOR (ABAS) ---
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão
        tabBarActiveTintColor: '#00e676', // Cor do ícone ativo (Verde Neon)
        tabBarStyle: { 
          backgroundColor: '#18181b', // Fundo escuro
          borderTopColor: '#27272a',
          paddingBottom: 5,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold'
        }
      }}
    >
      <Tab.Screen name="Treinos" component={TreinoScreen} />
      <Tab.Screen name="Dieta" component={DietaScreen} />
      <Tab.Screen name="Evolucao3D" component={AvatarScreen} /> 
    </Tab.Navigator>
  );
}

// --- CONFIGURAÇÃO PRINCIPAL (LOGIN -> APP) ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 1. Primeira tela que aparece é o Login */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* 2. Se logar, vai para o Menu Principal (AppTabs) */}
        <Stack.Screen name="MainTabs" component={AppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}