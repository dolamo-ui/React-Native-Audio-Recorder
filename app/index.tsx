import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import RecorderScreen from "./RecorderScreen";
import SavedScreen from "./SavedScreen";
import { RecordingItem, Settings } from "../types";

const STORAGE_KEYS = {
  RECORDINGS: "voice_notes_v2",
  SETTINGS: "voice_notes_settings_v1",
};

export default function App() {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [settings, setSettings] = useState<Settings>({ highQuality: true, autoSave: true });
  const [activeTab, setActiveTab] = useState<"recorder" | "saved">("recorder");

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS);
      if (raw) setRecordings(JSON.parse(raw));
      const sraw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (sraw) setSettings(JSON.parse(sraw));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(recordings));
  }, [recordings]);

  return (
    <View style={styles.root}>
      <View style={styles.screenContainer}>
        {activeTab === "recorder" ? (
          <RecorderScreen recordings={recordings} setRecordings={setRecordings} settings={settings} />
        ) : (
          <SavedScreen recordings={recordings} setRecordings={setRecordings} settings={settings} />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab("recorder")}>
          <Feather name="mic" size={22} color={activeTab === "recorder" ? "#ff3b5c" : "#888"} />
          <Text style={[styles.tabText, activeTab === "recorder" && { color: "#ff3b5c" }]}>Recorder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setActiveTab("saved")}>
          <Feather name="folder" size={22} color={activeTab === "saved" ? "#ff3b5c" : "#888"} />
          <Text style={[styles.tabText, activeTab === "saved" && { color: "#ff3b5c" }]}>Saved</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fefefe" },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  tabBtn: { alignItems: "center" },
  tabText: { fontSize: 12, color: "#333", marginTop: 2 },
});
