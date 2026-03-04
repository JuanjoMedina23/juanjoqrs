import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function PaymentScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>JuanjoQr's está analizando ...</Text>
      <Text>Código escaneado:</Text>
      <Text>{code}</Text>
    </View>
  );
}