import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator,
  Dimensions // IMPORTAÇÃO QUE FALTOU!
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

// Definindo a largura da tela para o cálculo do pódio
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RankingScreen() {
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'Geral' | 'Desafio'>('Geral');
  const [ranking, setRanking] = useState<any[]>([]);
  const [myPos, setMyPos] = useState<any>(null);

   const fetchRanking = async () => {
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // AQUI: Filtramos estritamente pela role 'student'
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, total_xp, user_type')
      .eq('user_type', 'student') // Só entra quem for aluno de verdade
      .order('total_xp', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (data) {
      setRanking(data);
      
      // Verifica se VOCÊ é aluno para te mostrar no rodapé
      const index = data.findIndex(u => u.id === user?.id);
      if (index !== -1) {
        setMyPos({ ...data[index], position: index + 1 });
      } else {
        // Se o Lucas Trainer abrir a tela, ele vê o ranking mas não se vê nele
        setMyPos(null);
      }
    }
  } catch (error) {
    console.log("Erro ao carregar ranking:", error);
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(useCallback(() => { fetchRanking(); }, []));

  const renderPodium = () => {
    const top3 = ranking.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <View style={styles.podiumContainer}>
        {/* 2º LUGAR */}
        {top3[1] && (
          <View style={[styles.podiumItem, { marginTop: 30 }]}>
            <View style={styles.avatarWrapper}>
               <Image source={{ uri: top3[1].avatar_url || 'https://github.com/shadcn.png' }} style={[styles.podiumAvatar, {borderColor: '#94a3b8'}]} />
               <View style={[styles.rankBadge, {backgroundColor: '#94a3b8'}]}><Text style={styles.rankBadgeText}>2</Text></View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[1].full_name?.split(' ')[0] || 'Atleta'}</Text>
            <Text style={styles.podiumXP}>{top3[1].total_xp || 0} XP</Text>
          </View>
        )}

        {/* 1º LUGAR */}
        {top3[0] && (
          <View style={styles.podiumItem}>
            <Ionicons name="trophy" size={30} color="#f59e0b" style={{marginBottom: -10, zIndex: 1}} />
            <View style={styles.avatarWrapper}>
               <Image source={{ uri: top3[0].avatar_url || 'https://github.com/shadcn.png' }} style={[styles.podiumAvatar, {width: 90, height: 90, borderRadius: 45, borderColor: '#f59e0b', borderWidth: 4}]} />
               <View style={[styles.rankBadge, {backgroundColor: '#f59e0b', width: 28, height: 28}]}><Text style={styles.rankBadgeText}>1</Text></View>
            </View>
            <Text style={[styles.podiumName, {fontSize: 18}]} numberOfLines={1}>{top3[0].full_name?.split(' ')[0] || 'Atleta'}</Text>
            <Text style={[styles.podiumXP, {color: '#f59e0b'}]}>{top3[0].total_xp || 0} XP</Text>
          </View>
        )}

        {/* 3º LUGAR */}
        {top3[2] && (
          <View style={[styles.podiumItem, { marginTop: 40 }]}>
            <View style={styles.avatarWrapper}>
               <Image source={{ uri: top3[2].avatar_url || 'https://github.com/shadcn.png' }} style={[styles.podiumAvatar, {borderColor: '#b45309'}]} />
               <View style={[styles.rankBadge, {backgroundColor: '#b45309'}]}><Text style={styles.rankBadgeText}>3</Text></View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[2].full_name?.split(' ')[0] || 'Atleta'}</Text>
            <Text style={styles.podiumXP}>{top3[2].total_xp || 0} XP</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={['#1e1b4b', '#000']} style={styles.header}>
        <Text style={styles.title}>Hall da Fama</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, abaAtiva === 'Geral' && styles.tabActive]} 
            onPress={() => setAbaAtiva('Geral')}
          >
            <Text style={[styles.tabText, abaAtiva === 'Geral' && styles.tabTextActive]}>GERAL</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, abaAtiva === 'Desafio' && styles.tabActive]} 
            onPress={() => setAbaAtiva('Desafio')}
          >
            <Text style={[styles.tabText, abaAtiva === 'Desafio' && styles.tabTextActive]}>CAMPEONATO</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {abaAtiva === 'Geral' ? (
        <View style={{flex: 1}}>
          {loading ? (
            <ActivityIndicator color="#3b82f6" style={{marginTop: 50}} />
          ) : (
            <FlatList
              data={ranking.slice(3)} 
              keyExtractor={item => item.id}
              ListHeaderComponent={renderPodium}
              contentContainerStyle={{ paddingBottom: 150 }}
              renderItem={({ item, index }) => (
                <View style={[styles.userCard, item.id === myPos?.id && styles.myCard]}>
                  <Text style={styles.rankNumber}>{index + 4}</Text>
                  <Image source={{ uri: item.avatar_url || 'https://github.com/shadcn.png' }} style={styles.userAvatar} />
                  <Text style={styles.userName} numberOfLines={1}>{item.full_name || 'Atleta Anônimo'}</Text>
                  <Text style={styles.userXP}>{item.total_xp || 0} XP</Text>
                </View>
              )}
            />
          )}

          {myPos && (
            <View style={styles.myPosFooter}>
               <Text style={styles.rankNumberFooter}>{myPos.position}</Text>
               <Image source={{ uri: myPos.avatar_url || 'https://github.com/shadcn.png' }} style={styles.userAvatar} />
               <Text style={[styles.userName, {flex: 1}]}>Você ( {myPos.full_name?.split(' ')[0] || 'Eu'} )</Text>
               <Text style={styles.userXPFooter}>{myPos.total_xp || 0} XP</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={80} color="#18181b" />
          <Text style={styles.emptyTitle}>Nenhum Campeonato Ativo</Text>
          <Text style={styles.emptySub}>Aguarde o professor lançar o próximo desafio oficial do Protocolo Caverna.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#18181b', borderRadius: 25, padding: 4, width: '85%' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 21 },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { color: '#71717a', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#fff' },

  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingVertical: 30, marginBottom: 20 },
  podiumItem: { alignItems: 'center', width: SCREEN_WIDTH / 3.2 },
  avatarWrapper: { position: 'relative' },
  podiumAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3 },
  rankBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  rankBadgeText: { color: '#000', fontWeight: 'bold', fontSize: 10 },
  podiumName: { color: '#fff', fontWeight: 'bold', marginTop: 10, fontSize: 14 },
  podiumXP: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },

  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090b', marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#18181b' },
  myCard: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)' },
  rankNumber: { color: '#71717a', fontWeight: 'bold', width: 30, fontSize: 16 },
  rankNumberFooter: { color: '#fff', fontWeight: 'bold', width: 30, fontSize: 18 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  userName: { color: '#fff', flex: 1, fontSize: 15, fontWeight: '500' },
  userXP: { color: '#3b82f6', fontWeight: 'bold' },
  userXPFooter: { color: '#fff', fontWeight: 'bold' },

  myPosFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1e3a8a', flexDirection: 'row', alignItems: 'center', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 45, elevation: 10 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  emptySub: { color: '#71717a', textAlign: 'center', marginTop: 10, fontSize: 14 }
});