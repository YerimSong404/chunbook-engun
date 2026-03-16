import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMember } from '../../context/MemberContext';
import { Text, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const { currentMemberId, nickname, setCurrentMemberId } = useMember();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0070f3',
        tabBarInactiveTintColor: '#888',
        headerStyle: {
          backgroundColor: '#FAFAFA',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        },
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () => (
          currentMemberId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
              <TouchableOpacity onPress={() => setCurrentMemberId(null)}>
                <Text style={{ color: '#0070f3', fontSize: 13, fontWeight: '600' }}>나 바꾸기</Text>
              </TouchableOpacity>
            </View>
          ) : null
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="past-meetings"
        options={{
          title: '이전 모임',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="history" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="presenters"
        options={{
          title: '발제자',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '서기기록',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="notebook" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: '관리',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
