
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  title: string;
  onMenuPress: () => void;
};

export const Header = ({ title, onMenuPress }: Props) => (
  <View style={styles.headerRow}>
    <TouchableOpacity style={styles.menuBtnLeft} onPress={onMenuPress}>
      <Feather name="menu" size={28} color="#222" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "center", paddingHorizontal: 12, marginBottom: 8, alignItems: "center", position: "relative" },
  headerTitle: { fontSize: 24, fontWeight: "700", marginTop: 20 },
  menuBtnLeft: { position: "absolute", left: 20, top: 90 },
});
