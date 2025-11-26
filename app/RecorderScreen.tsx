
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Header } from "../components/Header";
import { WaveformTimer } from "../components/Waveform";
import { RecordingItem, Settings } from "../types";

type Props = {
  recordings: RecordingItem[];
  setRecordings: React.Dispatch<React.SetStateAction<RecordingItem[]>>;
  settings: Settings;
};

const STORAGE_KEY = "recordings";

export default function RecorderScreen({
  recordings,
  setRecordings,
  settings,
}: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recDuration, setRecDuration] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const timerRef = useRef<number | null>(null);

  // Load saved recordings on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setRecordings(JSON.parse(raw));
      } catch (e) {
        console.warn("Failed to load recordings", e);
      }
    })();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const saveRecordingList = async (list: RecordingItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to save recordings", e);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") {
        return Alert.alert("Permission denied", "Microphone access required.");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      const options = settings.highQuality
        ? Audio.RecordingOptionsPresets.HIGH_QUALITY
        : Audio.RecordingOptionsPresets.MINIMAL;

      await rec.prepareToRecordAsync(options);
      await rec.startAsync();

      setRecording(rec);
      setRecDuration(0);

      timerRef.current = setInterval(
        () => setRecDuration((p) => p + 1),
        1000
      ) as unknown as number;
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

      const updated = [newRec, ...recordings];
      setRecordings(updated);
      await saveRecordingList(updated);
    }

    setRecording(null);
    setRecDuration(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const submitFeedback = () => {
    Alert.alert("Thank you!", "Feedback submitted.");
    setFeedbackText("");
    setFeedbackModal(false);
  };

  const headerTitle = `Record ${String(recordings.length + 1).padStart(3, "0")}`;

  return (
    <SafeAreaView style={styles.page}>
      <Header title={headerTitle} onMenuPress={() => setMenuOpen(true)} />

      <View style={styles.recorderBody}>
        <WaveformTimer
          recording={!!recording}
          recDuration={recDuration}
          formatTime={formatTime}
        />

        <TouchableOpacity
          style={[
            styles.recordBtn,
            { borderColor: recording ? "#ff4b6e" : "#ff3b5c" },
          ]}
          activeOpacity={0.8}
          onPress={() =>
            !recording ? startRecording() : stopRecording()
          }
        >
          <View
            style={[
              styles.recordInner,
              {
                backgroundColor: "#ff3b5c",
                borderRadius: recording ? 4 : 30,
              },
            ]}
          />
        </TouchableOpacity>
      </View>

      
      <MenuModal
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSettings={() => {
          setMenuOpen(false);
          setSettingsModal(true);
        }}
        onOpenFeedback={() => {
          setMenuOpen(false);
          setFeedbackModal(true);
        }}
      />

     
      <Modal
        visible={settingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModal(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setSettingsModal(false)}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Settings</Text>
            <Text style={{ marginBottom: 12 }}>
              More options coming soon.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSettingsModal(false)}
            >
              <Text style={{ fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---------- Feedback Modal ---------- */}
      <Modal
        visible={feedbackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackModal(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setFeedbackModal(false)}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Send Feedback</Text>

            <TextInput
              placeholder="Write your feedback…"
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              style={styles.feedbackInput}
            />

            <TouchableOpacity
              style={[styles.feedbackBtn, { backgroundColor: "#ff3b5c" }]}
              onPress={submitFeedback}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Submit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setFeedbackModal(false)}
            >
              <Text style={{ fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


function MenuModal({
  visible,
  onClose,
  onOpenSettings,
  onOpenFeedback,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenFeedback: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 300,
      duration: visible ? 250 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      {/* Slide-up panel */}
      <Animated.View
        style={[
          styles.menuPanel,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.menuTitle}>Menu</Text>

        <TouchableOpacity style={styles.menuItem} onPress={onOpenSettings}>
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onOpenFeedback}>
          <Text style={styles.menuItemText}>Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { marginTop: 8 }]}
          onPress={onClose}
        >
          <Text style={[styles.menuItemText, { color: "#666" }]}>
            Close
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fefefe" },
  recorderBody: { flex: 1, alignItems: "center", justifyContent: "center" },

  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  recordInner: { width: 30, height: 30 },

 
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  menuPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  menuTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  menuItem: { paddingVertical: 12 },
  menuItemText: { fontSize: 18, color: "#000" },

 
  centeredModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
  },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  modalButton: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },

  feedbackInput: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    textAlignVertical: "top",
  },
  feedbackBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 8,
  },
});

