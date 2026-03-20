import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMember } from '../../context/MemberContext';
import { Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const { currentMemberId } = useMember();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A4238',
        tabBarInactiveTintColor: '#C1B7A7',
        tabBarStyle: {
          backgroundColor: '#FDFBF7',
          borderTopWidth: 1,
          borderTopColor: '#EBE5D9',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: '#FDFBF7',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#EBE5D9',
        },
        headerTitle: '천북인권',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: '#2C2724',
          fontWeight: '700',
          fontSize: 18,
        },
        headerRight: () =>
          currentMemberId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
              <TouchableOpacity onPress={() => router.push('/mypage')}>
                <Text style={{ color: '#8C7D6B', fontSize: 14, fontWeight: '600', padding: 4 }}>마이페이지</Text>
              </TouchableOpacity>
            </View>
          ) : null,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="past-meetings"
        options={{
          title: '기록',
          tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="presenters"
        options={{
          title: '멤버',
          tabBarIcon: ({ color }) => <Feather name="users" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '서기',
          tabBarIcon: ({ color }) => <Feather name="edit-2" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <Feather name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
