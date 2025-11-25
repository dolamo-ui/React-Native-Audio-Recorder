import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { RecordingItem, Settings } from "../types";

type Props = {
  recordings: RecordingItem[];
  setRecordings: React.Dispatch<React.SetStateAction<RecordingItem[]>>;
  settings: Settings;
};

export default function SavedScreen({ recordings, setRecordings }: Props) {
  const [search, setSearch] = useState("");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const playRecording = async (item: RecordingItem) => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
      }

      const s = new Audio.Sound();
      await s.loadAsync({ uri: item.uri });
      setSound(s);
      setCurrentPlayingId(item.id);
      setCurrentPosition(0);

      s.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setCurrentPosition(Math.floor(status.positionMillis / 1000));
          if (status.didJustFinish) stopPlayback();
        }
      });

      await s.playAsync();
    } catch (e) {
      console.log("Playback error:", e);
    }
  };

  const pausePlayback = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    }
  };

  const stopPlayback = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    setCurrentPlayingId(null);
    setCurrentPosition(0);
    setSound(null);
  };

  const rewindOneSecond = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const newPosition = Math.max(0, status.positionMillis - 1000);
      await sound.setPositionAsync(newPosition);
      setCurrentPosition(Math.floor(newPosition / 1000));
    }
  };

  const deleteRecording = (id: number) => {
    Alert.alert("Delete Recording", "Are you sure you want to delete this recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setRecordings((prev) => prev.filter((r) => r.id !== id));
          if (currentPlayingId === id) stopPlayback();
        },
      },
    ]);
  };

  const startEditing = (rec: RecordingItem) => {
    setEditingId(rec.id);
    setEditingText(rec.title || "Untitled Recording");
  };

  const saveEditing = () => {
    if (editingId === null) return;

    setRecordings((prev) =>
      prev.map((r) =>
        r.id === editingId ? { ...r, title: editingText.trim() || "Untitled Recording" } : r
      )
    );

    setEditingId(null);
    setEditingText("");
  };

  const filtered = recordings.filter((rec) => {
    const name = rec.title || "Untitled Recording";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Saved Recordings</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search recordings..."
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView style={styles.savedList}>
        {filtered.map((rec) => {
          const isPlaying = currentPlayingId === rec.id;
          const isEditing = editingId === rec.id;
          const progress = isPlaying ? currentPosition / rec.duration : 0;

          return (
            <View key={rec.id} style={styles.savedItem}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editingText}
                  onChangeText={setEditingText}
                  onSubmitEditing={saveEditing}
                  blurOnSubmit
                  autoFocus
                />
              ) : (
                <Text style={styles.savedTitle}>{rec.title || "Untitled Recording"}</Text>
              )}

              <Text style={styles.savedMeta}>{formatDateTime(rec.createdAt)}</Text>

              {/* 🎙️ Progress Bar */}
              {isPlaying && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                  <View style={[styles.progressDot, { left: `${progress * 100}%` }]} />
                  <Text style={styles.progressTime}>
                    {formatTime(currentPosition)} / {formatTime(rec.duration)}
                  </Text>
                </View>
              )}

              <View style={styles.savedPlaybackRow}>
                <TouchableOpacity onPress={rewindOneSecond} style={{ marginRight: 12 }}>
                  <Feather name="rotate-ccw" size={22} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => (isPlaying ? pausePlayback() : playRecording(rec))}
                >
                  <Feather name={isPlaying ? "pause" : "play"} size={22} color="#333" />
                </TouchableOpacity>

                {!isPlaying && <Text style={{ marginLeft: 8 }}>{formatTime(rec.duration)}</Text>}

                {isEditing ? (
                  <TouchableOpacity
                    onPress={saveEditing}
                    style={{
                      marginLeft: 16,
                      padding: 6,
                      borderRadius: 20,
                      backgroundColor: "#d1ffd6",
                    }}
                  >
                    <Feather name="check" size={20} color="#0a0" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => startEditing(rec)}
                    style={{
                      marginLeft: 16,
                      padding: 6,
                      borderRadius: 20,
                      backgroundColor: "#eee",
                    }}
                  >
                    <Feather name="edit-2" size={20} color="#333" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => deleteRecording(rec.id)}
                  style={{ marginLeft: 16 }}
                >
                  <Feather name="trash" size={22} color="#ff3b5c" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 50, backgroundColor: "#fefefe" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", flex: 1, textAlign: "center" },
  searchInput: {
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  savedList: { flex: 1 },
  savedItem: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  savedTitle: { fontWeight: "700", fontSize: 16 },
  savedMeta: { color: "#777", marginTop: 2 },
  savedPlaybackRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  editInput: {
    borderBottomWidth: 1,
    borderColor: "#ff3b5c",
    fontWeight: "700",
    fontSize: 16,
  },
  progressContainer: {
    height: 20,
    marginTop: 6,
    justifyContent: "center",
    position: "relative",
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff3b5c",
    position: "absolute",
    top: -3,
  },
  progressTime: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
    textAlign: "right",
  },
});