import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordingItem, Settings } from "../types";

type Props = {
  recordings: RecordingItem[];
  setRecordings: React.Dispatch<React.SetStateAction<RecordingItem[]>>;
  settings: Settings;
};

const LOCAL_IMG_1 = "file:///mnt/data/Screenshot 2025-11-24 203342 - Copy.png";

export default function RecorderScreen({ recordings, setRecordings, settings }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recDuration, setRecDuration] = useState(0);
  const timerRef = useRef<number | null>(null);

  const waveAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const STORAGE_KEYS = { RECORDINGS: "voice_notes_list", FEEDBACKS: "voice_notes_feedbacks" };

  
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS);
      const saved = raw ? JSON.parse(raw) : [];
      setRecordings(saved);
    })();
  }, []);

  
  useEffect(() => {
    Animated.loop(
      Animated.timing(waveAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    blinkAnim.stopAnimation();
    blinkAnim.setValue(1);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

 
  const saveRecordingList = async (list: RecordingItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to save recordings", e);
    }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") return Alert.alert("Permission denied", "Microphone required.");

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const rec = new Audio.Recording();
      const options = settings.highQuality
        ? Audio.RecordingOptionsPresets.HIGH_QUALITY
        : Audio.RecordingOptionsPresets.MINIMAL;

      await rec.prepareToRecordAsync(options);
      await rec.startAsync();

      setRecording(rec);
      setRecDuration(0);
      timerRef.current = setInterval(() => setRecDuration((p) => p + 1), 1000) as unknown as number;

      startPulse();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    const duration = Math.floor((status.durationMillis ?? 0) / 1000);

    if (uri) {
      const newRec: RecordingItem = {
        id: Date.now(),
        uri,
        duration,
        createdAt: new Date().toISOString(),
        title: `Record ${String(recordings.length + 1).padStart(3, "0")}`,
      };
      const updatedList = [newRec, ...recordings];
      setRecordings(updatedList);
      saveRecordingList(updatedList); 
    }

    setRecording(null);
    setRecDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);

    stopPulse();
  };

  const deleteRecording = async (id: number) => {
    Alert.alert("Delete Recording", "Are you sure you want to delete this recording?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = recordings.filter((r) => r.id !== id);
          setRecordings(updated);
          saveRecordingList(updated);
        },
      },
    ]);
  };

  const Waveform = ({ small = false }: { small?: boolean }) => {
    const scale = waveAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.9, 1.15, 0.9],
    });
    const bars = new Array(small ? 16 : 22).fill(0);
    return (
      <View style={[styles.waveRow, small && { height: 40 }]}>
        {bars.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waveBar,
              small && { width: 6, marginHorizontal: 4 },
              { transform: [{ scaleY: Animated.multiply(scale, (i % 5) / 5 + 0.7) }] },
            ]}
          />
        ))}
      </View>
    );
  };

  const nextRecNumber = recordings.length + 1;
  const headerTitle = `Record ${String(nextRecNumber).padStart(3, "0")}`;

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return Alert.alert("Empty", "Please type some feedback.");
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift({ id: Date.now(), text: feedbackText.trim(), createdAt: new Date().toISOString() });
      await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(arr));
      setFeedbackText("");
      setFeedbackModal(false);
      Alert.alert("Thanks", "Feedback submitted — thank you!");
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Could not save feedback.");
    }
  };

  return (
    <View style={styles.page}>
     
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.menuBtnLeft} onPress={() => setMenuOpen(true)}>
          <Feather name="menu" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      <View style={styles.recorderBody}>
        <Image source={{ uri: LOCAL_IMG_1 }} style={styles.decorImage} resizeMode="cover" />
        <View style={styles.waveContainer}>
          <Waveform />
          <View style={styles.timerRow}>
            <Animated.View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "red",
                marginRight: 8,
                opacity: recording ? blinkAnim : 1,
              }}
            />
            <Text style={styles.timerText}>{recording ? formatTime(recDuration) : "00:00"}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.recordBtn, { borderColor: recording ? "#ff4b6e" : "#ff3b5c" }]}
          onPress={async () => (!recording ? startRecording() : stopRecording())}
        >
          <Animated.View
            style={[
              styles.recordInner,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: "#ff3b5c",
                borderRadius: recording ? 4 : 30,
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      
      <Modal visible={menuOpen} transparent animationType="slide">
        <View style={styles.menuOverlay}>
          <View style={styles.menuPanel}>
            <TouchableOpacity onPress={() => setMenuOpen(false)}>
              <Feather name="x" size={28} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                setSettingsModal(true);
              }}
            >
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                setFeedbackModal(true);
              }}
            >
              <Text style={styles.menuText}>Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal visible={settingsModal} transparent animationType="fade">
        <View style={styles.popupWrap}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>Settings</Text>
            <Text style={{ marginBottom: 20 }}>More options coming soon.</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSettingsModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal visible={feedbackModal} transparent animationType="fade">
        <View style={styles.popupWrap}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>Send Feedback</Text>

            <TextInput
              placeholder="Write your feedback…"
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              style={styles.feedbackInput}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity
                style={[styles.feedbackBtn, { backgroundColor: "#ff3b5c", flex: 1, marginRight: 8 }]}
                onPress={submitFeedback}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.feedbackBtn, { backgroundColor: "#eee", flex: 1 }]}
                onPress={() => setFeedbackModal(false)}
              >
                <Text style={{ color: "#333", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 50, backgroundColor: "#fefefe" },
  headerRow: { flexDirection: "row", justifyContent: "center", paddingHorizontal: 12, marginBottom: 8, alignItems: "center", position: "relative" },
  headerTitle: { fontSize: 24, fontWeight: "700", marginTop: 20 },
  menuBtnLeft: { position: "absolute", left: 20, top: 20 },
  recorderBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  decorImage: { position: "absolute", top: 0, width: "100%", height: 180 },
  waveContainer: { marginVertical: 90, alignItems: "center" },
  waveRow: { flexDirection: "row", alignItems: "flex-end", height: 60 },
  waveBar: { width: 10, height: 20, backgroundColor: "#ff3b5c", marginHorizontal: 2, borderRadius: 3 },
  timerRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  timerText: { fontSize: 24, fontWeight: "700" },
  recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: "center", alignItems: "center" },
  recordInner: { width: 60, height: 60 },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", flexDirection: "row", justifyContent: "flex-start" },
  menuPanel: { width: "60%", backgroundColor: "#fff", padding: 20, height: "100%", elevation: 10 },
  menuItem: { paddingVertical: 15 },
  menuText: { fontSize: 20 },
  popupWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  popupBox: { width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 15, elevation: 5 },
  popupTitle: { fontSize: 22, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  closeBtn: { backgroundColor: "#222", padding: 12, marginTop: 10, borderRadius: 10, alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 16 },
  feedbackInput: { borderWidth: 1, borderColor: "#aaa", borderRadius: 8, padding: 10, height: 90, marginBottom: 15 },
  feedbackBtn: { padding: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});