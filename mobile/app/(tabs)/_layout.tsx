import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4f46e5",
        headerStyle: { backgroundColor: "#4f46e5" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="forms"
        options={{
          title: "Formulários",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>&#128203;</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>&#128100;</Text>,
        }}
      />
    </Tabs>
  );
}
