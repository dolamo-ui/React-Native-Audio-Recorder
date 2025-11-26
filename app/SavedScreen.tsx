import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

import SearchBar from "../components/SearchBar";
import RecordingItemCard from "../components/RecordingItemCard";
import { RecordingItem } from "../types";

const STORAGE_KEY = "recordings";

export default function SavedScreen({ recordings, setRecordings }: any) {
  const [search, setSearch] = useState("");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  // ------------------------------
  // Load recordings on mount
  // ------------------------------
  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setRecordings(JSON.parse(saved));
    } catch (e) {
      console.log("Failed to load recordings:", e);
    }
  };

  // ------------------------------
  // Stop playback on unmount
  // ------------------------------
  useEffect(() => {
    return () => void stopPlayback();
  }, []);

  // ------------------------------
  // Play recording
  // ------------------------------
  const play = async (rec: RecordingItem) => {
    try {
      await stopPlayback();

      const newSound = new Audio.Sound();
      await newSound.loadAsync({ uri: rec.uri });

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setCurrentPosition(Math.floor(status.positionMillis / 1000));

        if (status.didJustFinish) void stopPlayback();
      });

      await newSound.playAsync();
      setSound(newSound);
      setCurrentPlayingId(rec.id);
    } catch (e) {
      console.log("Playback error:", e);
    }
  };

  // ------------------------------
  // Pause
  // ------------------------------
  const pause = async () => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (st.isLoaded) await sound.pauseAsync();
  };

  // ------------------------------
  // Rewind 1 second
  // ------------------------------
  const rewind = async () => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return;

    const newPos = Math.max(0, st.positionMillis - 1000);
    await sound.setPositionAsync(newPos);
    setCurrentPosition(Math.floor(newPos / 1000));
  };

  // ------------------------------
  // Stop playback
  // ------------------------------
  const stopPlayback = async () => {
    if (!sound) return;
    try {
      const st = await sound.getStatusAsync();
      if (st.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch (e) {
      console.log("Stop error:", e);
    }

    setSound(null);
    setCurrentPlayingId(null);
    setCurrentPosition(0);
  };

  // ------------------------------
  // Delete recording
  // ------------------------------
  const remove = (id: number) => {
    Alert.alert("Delete", "Remove this recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = recordings.filter((x: RecordingItem) => x.id !== id);
          setRecordings(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          if (currentPlayingId === id) void stopPlayback();
        },
      },
    ]);
  };

  // ------------------------------
  // Save edited title
  // ------------------------------
  const saveEditing = async (rec: RecordingItem) => {
    const updatedList = recordings.map((item: RecordingItem) =>
      item.id === rec.id ? { ...item, title: editingText } : item
    );
    setRecordings(updatedList);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    setEditingId(null);
  };

  // ------------------------------
  // Filter recordings
  // ------------------------------
  const filtered = recordings.filter((r: RecordingItem) =>
    (r.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.page}>
      <Text style={styles.header}>Saved Recordings</Text>

      <SearchBar value={search} onChange={setSearch} />

      <ScrollView>
        {filtered.map((rec: RecordingItem) => {
          const isPlaying = currentPlayingId === rec.id;
          const isEditing = editingId === rec.id;

          return (
            <RecordingItemCard
              key={rec.id}
              rec={rec}
              isPlaying={isPlaying}
              currentPosition={currentPosition}
              isEditing={isEditing}
              editingText={editingText}
              onChangeEditingText={setEditingText}
              onPlay={() => play(rec)}
              onPause={pause}
              onRewind={rewind}
              onStartEditing={() => {
                setEditingId(rec.id);
                setEditingText(rec.title || "");
              }}
              onSaveEditing={() => saveEditing(rec)}
              onDelete={() => remove(rec.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 50, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: { textAlign: "center", fontSize: 24, fontWeight: "700", marginBottom: 10 },
});
