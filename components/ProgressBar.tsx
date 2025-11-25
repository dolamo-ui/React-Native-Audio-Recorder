
import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  position: number;
  duration: number;
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function ProgressBar({ position, duration }: Props) {
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: `${progress * 100}%` }]} />
      <View style={[styles.dot, { left: `${progress * 100}%` }]} />
      <Text style={styles.time}>
        {formatTime(position)} / {formatTime(duration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 20,
    marginTop: 6,
    justifyContent: "center",
    position: "relative",
    marginBottom: 4,
  },
  bar: {
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff3b5c",
    position: "absolute",
    top: -3,
  },
  time: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
    textAlign: "right",
  },
});
