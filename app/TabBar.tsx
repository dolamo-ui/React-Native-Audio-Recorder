// TabBar.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  activeTab: "recorder" | "saved";
  setActiveTab: (tab: "recorder" | "saved") => void;
};

export default function TabBar({ activeTab, setActiveTab }: Props) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab("recorder")}>
        <Feather name="mic" size={22} color={activeTab === "recorder" ? "#ff3b5c" : "#888"} />
        <Text style={styles.tabText}>Recorder</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab("saved")}>
        <Feather name="folder" size={22} color={activeTab === "saved" ? "#ff3b5c" : "#888"} />
        <Text style={styles.tabText}>Saved</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderColor: "#eee", paddingVertical: 6 },
  tabBtn: { alignItems: "center" },
  tabText: { fontSize: 12, color: "#333", marginTop: 2 },
});
