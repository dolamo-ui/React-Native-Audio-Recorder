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

  
    <View style={{ width: 28 }} />
  </View>
);

const styles = StyleSheet.create({
  headerRow: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  menuBtnLeft: {
    padding: 10,
  },
});
