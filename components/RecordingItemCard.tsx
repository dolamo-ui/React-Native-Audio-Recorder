
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import ProgressBar from "./ProgressBar";
import { RecordingItem } from "../types";

type Props = {
  rec: RecordingItem;
  isPlaying: boolean;
  currentPosition: number;
  isEditing: boolean;
  editingText: string;
  onChangeEditingText: (t: string) => void;

  onPlay: () => void;
  onPause: () => void;
  onRewind: () => void;
  onStartEditing: () => void;
  onSaveEditing: () => void;
  onDelete: () => void;
};

export default function RecordingItemCard({
  rec,
  isPlaying,
  currentPosition,
  isEditing,
  editingText,
  onChangeEditingText,
  onPlay,
  onPause,
  onRewind,
  onStartEditing,
  onSaveEditing,
  onDelete,
}: Props) {
  return (
    <View style={styles.container}>
      {isEditing ? (
        <TextInput
          style={styles.editInput}
          value={editingText}
          onChangeText={onChangeEditingText}
          onSubmitEditing={onSaveEditing}
          autoFocus
        />
      ) : (
        <Text style={styles.title}>{rec.title || "Untitled Recording"}</Text>
      )}

      <Text style={styles.meta}>
        {new Date(rec.createdAt).toLocaleDateString()}{" "}
        {new Date(rec.createdAt).toLocaleTimeString()}
      </Text>

      {isPlaying && (
        <ProgressBar
          position={currentPosition}
          duration={rec.duration}
        />
      )}

      <View style={styles.row}>
        <TouchableOpacity onPress={onRewind}>
          <Feather name="rotate-ccw" size={22} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity onPress={isPlaying ? onPause : onPlay} style={{ marginLeft: 15 }}>
          <Feather name={isPlaying ? "pause" : "play"} size={22} color="#333" />
        </TouchableOpacity>

        {!isPlaying && (
          <Text style={{ marginLeft: 10 }}>
            {Math.floor(rec.duration / 60)
              .toString()
              .padStart(2, "0")}
            :
            {(rec.duration % 60).toString().padStart(2, "0")}
          </Text>
        )}

        {isEditing ? (
          <TouchableOpacity onPress={onSaveEditing} style={styles.saveBtn}>
            <Feather name="check" size={20} color="#0a0" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onStartEditing} style={styles.editBtn}>
            <Feather name="edit-2" size={20} color="#333" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onDelete} style={{ marginLeft: 16 }}>
          <Feather name="trash" size={22} color="#ff3b5c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
  },
  meta: {
    color: "#777",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  editInput: {
    borderBottomWidth: 1,
    borderColor: "#ff3b5c",
    fontWeight: "700",
    fontSize: 16,
  },
  saveBtn: {
    marginLeft: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#d1ffd6",
  },
  editBtn: {
    marginLeft: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
}); 
