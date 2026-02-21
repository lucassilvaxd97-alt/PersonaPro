import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TrainerHomeScreen from '../screens/TrainerHomeScreen';
import TrainerStudentsScreen from '../screens/TrainerStudentsScreen';
import TrainerLibraryScreen from '../screens/TrainerLibraryScreen';
import TrainerRankingScreen from '../screens/TrainerRankingScreen';
import TrainerConfigScreen from '../screens/TrainerConfigScreen';
import TrainerDietLibraryScreen from '../screens/TrainerDietLibraryScreen'; 

const Tab = createBottomTabNavigator();

export default function TrainerTabs() {
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
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#71717a',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 4 },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dash') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Alunos') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Biblioteca') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Dietas') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Ranking') iconName = focused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'Config') iconName = focused ? 'settings' : 'settings-outline';

          return (
            <View style={{
              shadowColor: focused ? '#4f46e5' : 'transparent',
              shadowOpacity: 0.5, shadowRadius: 8, elevation: focused ? 5 : 0 
            }}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dash" component={TrainerHomeScreen} />
      <Tab.Screen name="Alunos" component={TrainerStudentsScreen} />
      <Tab.Screen name="Biblioteca" component={TrainerLibraryScreen} />
      <Tab.Screen name="Dietas" component={TrainerDietLibraryScreen} />
      <Tab.Screen name="Ranking" component={TrainerRankingScreen} />
      <Tab.Screen name="Config" component={TrainerConfigScreen} />
    </Tab.Navigator>
  );
}