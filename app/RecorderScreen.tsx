
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  TextInput,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Header } from "../components/Header";
import { WaveformTimer } from "../components/Waveform";
import { ModalPanel } from "../components/ModalPanel";
import { RecordingItem, Settings } from "../types";



type Props = {
  recordings: RecordingItem[];
  setRecordings: React.Dispatch<React.SetStateAction<RecordingItem[]>>;
  settings: Settings;
};

export default function RecorderScreen({ recordings, setRecordings, settings }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recDuration, setRecDuration] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const STORAGE_KEYS = { RECORDINGS: "voice_notes_list", FEEDBACKS: "voice_notes_feedbacks" };

  // Load saved recordings
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECORDINGS);
      const saved = raw ? JSON.parse(raw) : [];
      setRecordings(saved);
    })();
  }, []);

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
      if (perm.status !== "granted")
        return Alert.alert("Permission denied", "Microphone required.");

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
  };

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

  const headerTitle = `Record ${String(recordings.length + 1).padStart(3, "0")}`;

  return (
    <View style={styles.page}>
      <Header title={headerTitle} onMenuPress={() => setMenuOpen(true)} />

      <View style={styles.recorderBody}>
       

        <WaveformTimer
          recording={!!recording}
          recDuration={recDuration}
          formatTime={formatTime}
        />

        <TouchableOpacity
          style={[styles.recordBtn, { borderColor: recording ? "#ff4b6e" : "#ff3b5c" }]}
          activeOpacity={0.8}
          onPress={async () => (!recording ? startRecording() : stopRecording())}
        >
          <View
            style={[
              styles.recordInner,
              { backgroundColor: "#ff3b5c", borderRadius: recording ? 4 : 30 },
            ]}
          />
        </TouchableOpacity>
      </View>

     
      <ModalPanel visible={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <TouchableOpacity
          style={{ paddingVertical: 12 }}
          onPress={() => {
            setMenuOpen(false);
            setSettingsModal(true);
          }}
        >
          <Text style={{ fontSize: 18 }}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: 12 }}
          onPress={() => {
            setMenuOpen(false);
            setFeedbackModal(true);
          }}
        >
          <Text style={{ fontSize: 18 }}>Feedback</Text>
        </TouchableOpacity>
      </ModalPanel>

      
      <ModalPanel visible={settingsModal} onClose={() => setSettingsModal(false)} title="Settings">
        <Text>More options coming soon.</Text>
      </ModalPanel>

      
      <ModalPanel visible={feedbackModal} onClose={() => setFeedbackModal(false)} title="Send Feedback">
        <TextInput
          placeholder="Write your feedback…"
          value={feedbackText}
          onChangeText={setFeedbackText}
          multiline
          style={styles.feedbackInput}
        />
        <TouchableOpacity
          style={[styles.feedbackBtn, { backgroundColor: "#ff3b5c", marginBottom: 10 }]}
          onPress={submitFeedback}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Submit</Text>
        </TouchableOpacity>
      </ModalPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 50, backgroundColor: "#fefefe" },
  recorderBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  decorImage: { position: "absolute", top: 0, width: "100%", height: 180 },
  recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: "center", alignItems: "center", marginTop: 20 },
  recordInner: { width: 30, height: 30 },
  feedbackInput: { borderWidth: 1, borderColor: "#aaa", borderRadius: 8, padding: 10, height: 90, marginBottom: 15 },
  feedbackBtn: { padding: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
