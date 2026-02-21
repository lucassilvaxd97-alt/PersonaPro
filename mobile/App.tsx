import React from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORTANDO AS TELAS ---
import LoginScreen from './src/screens/LoginScreen'; 
import HomeScreen from './src/screens/HomeScreen'; 
import TreinoScreen from './src/screens/TreinoScreen';
import DietaScreen from './src/screens/DietaScreen';
import AvatarScreen from './src/screens/AvatarScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import SplashScreen from './src/screens/SplashScreen';
import TrainerHomeScreen from './src/screens/TrainerHomeScreen';
import TrainerTabs from './src/navigation/TrainerTabs';
import SignUpScreen from './src/screens/SignUpScreen';
import TemplateEditorScreen from './src/screens/TemplateEditorScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import TrainerStudentsScreen from './src/screens/TrainerStudentsScreen';
import TrainerAddStudentScreen from './src/screens/TrainerAddStudentScreen';
import TrainerStudentDetailScreen from './src/screens/TrainerStudentDetailScreen';
import TrainerDietLibraryScreen from './src/screens/TrainerDietLibraryScreen';
import TrainerDietEditorScreen from './src/screens/TrainerDietEditorScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. Criamos o Menu de Abas separadamente
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#27272a',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#71717a',
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Início') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Treino') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Dieta') iconName = focused ? 'nutrition' : 'nutrition-outline';
          else if (route.name === 'Evolução') iconName = focused ? 'body' : 'body-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';

          return (
            <View style={{
              shadowColor: focused ? '#3b82f6' : 'transparent',
              shadowOpacity: 0.5, shadowRadius: 5, elevation: focused ? 5 : 0 
            }}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Treino" component={TreinoScreen} />
      <Tab.Screen name="Dieta" component={DietaScreen} />
      <Tab.Screen name="Evolução" component={AvatarScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
     
    </Tab.Navigator>
  );
}

// 2. O App agora gerencia a troca do Login para as Abas
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#000" />
      
      {/* initialRouteName agora é 'Splash' */}
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        
        {/* Tela 1: Carregamento */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        
        {/* Tela 2: Login */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="TrainerTabs" component={TrainerTabs} />
        
        {/* Tela 3: App Principal */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Alunos" component={TrainerStudentsScreen} />
        <Stack.Screen name="TrainerDietEditor" component={TrainerDietEditorScreen} />
        <Stack.Screen name="TrainerStudentDetail" component={TrainerStudentDetailScreen} options={{ headerShown: false }} />
        
        {/* 🚀 A Tela de Treino do Aluno fica salva aqui na rota principal! */}
        
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}