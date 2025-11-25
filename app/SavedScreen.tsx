import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import SearchBar from "../components/SearchBar";
import RecordingItemCard from "../components/RecordingItemCard";
import { RecordingItem, Settings } from "../types";

export default function SavedScreen({ recordings, setRecordings }: any) {
  const [search, setSearch] = useState("");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  
  
  
  useEffect(() => {
    return () => {
      void stopPlayback(); 
    };
  }, []);

  const play = async (rec: RecordingItem) => {
    try {
      if (sound) {
        const s = await sound.getStatusAsync();
        if (s.isLoaded) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      }

      const newSound = new Audio.Sound();
      await newSound.loadAsync({ uri: rec.uri });

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setCurrentPosition(Math.floor(status.positionMillis / 1000));

          if (status.didJustFinish) {
            void stopPlayback();
          }
        }
      });

      await newSound.playAsync();
      setSound(newSound);
      setCurrentPlayingId(rec.id);
    } catch (e) {
      console.log("Playback error:", e);
    }
  };

  const pause = async () => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (st.isLoaded) await sound.pauseAsync();
  };

  const rewind = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const newPos = Math.max(0, status.positionMillis - 1000);
      await sound.setPositionAsync(newPos);
      setCurrentPosition(Math.floor(newPos / 1000));
    }
  };

  const stopPlayback = async () => {
    try {
      if (!sound) return;
      const st = await sound.getStatusAsync();
      if (st.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      setSound(null);
      setCurrentPlayingId(null);
      setCurrentPosition(0);
    } catch (e) {
      console.log("Stop error:", e);
    }
  };

  const remove = (id: number) => {
    Alert.alert("Delete", "Remove this recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setRecordings((prev: RecordingItem[]) =>
            prev.filter((x) => x.id !== id)
          );
          if (currentPlayingId === id) void stopPlayback();
        },
      },
    ]);
  };

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
              onSaveEditing={() => {
                setRecordings((prev: RecordingItem[]) =>
                  prev.map((x) =>
                    x.id === rec.id ? { ...x, title: editingText } : x
                  )
                );
                setEditingId(null);
              }}
              onDelete={() => remove(rec.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 50, backgroundColor: "#fff" },
  header: { textAlign: "center", fontSize: 24, fontWeight: "700", marginBottom: 10 },
});
