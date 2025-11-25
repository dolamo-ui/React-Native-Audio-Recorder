
import React, { FC, useRef, useEffect } from "react";
import { View, Animated, StyleSheet, Text, Easing } from "react-native";

type Props = {
  recording: boolean;
  recDuration: number;
  formatTime: (seconds: number) => string;
};

export const WaveformTimer: FC<Props> = ({ recording, recDuration, formatTime }) => {
  
  const bars = Array.from({ length: 22 }, () => useRef(new Animated.Value(0.5)).current);

  const blinkAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  
  const animateBars = () => {
    const animations = bars.map((bar) =>
      Animated.sequence([
        Animated.timing(bar, {
          toValue: Math.random() * 1.2 + 0.3,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(bar, {
          toValue: Math.random() * 1.2 + 0.3,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start(() => {
      if (recording) animateBars();
    });
  };

  useEffect(() => {
    if (recording) {
      animateBars();

      
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

    
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      
      bars.forEach((bar) => bar.setValue(0.5));
      pulseAnim.setValue(1);
      blinkAnim.setValue(1);
    }
  }, [recording]);

  return (
    <View style={{ alignItems: "center", marginVertical: 90 }}>
      
      <View style={styles.waveRow}>
        {bars.map((bar, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waveBar,
              { transform: [{ scaleY: bar }] },
            ]}
          />
        ))}
      </View>

      
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

     
      <Animated.View
        style={{
          width: 60,
          height: 60,
          borderRadius: recording ? 4 : 30,
          backgroundColor: "#ff3b5c",
          transform: [{ scale: pulseAnim }],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  waveRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 60,
    marginBottom: 20,
  },
  waveBar: {
    width: 8,
    height: 30,
    backgroundColor: "#ff3b5c",
    marginHorizontal: 2,
    borderRadius: 50,
  },
  timerRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  timerText: { fontSize: 24, fontWeight: "700" },
});
