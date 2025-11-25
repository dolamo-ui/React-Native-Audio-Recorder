
import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
};

export const ModalPanel = ({ visible, onClose, title, children }: Props) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.popupWrap}>
      <View style={styles.popupBox}>
        <Text style={styles.popupTitle}>{title}</Text>
        {children}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  popupWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  popupBox: { width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 15, elevation: 5 },
  popupTitle: { fontSize: 22, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  closeBtn: { backgroundColor: "#222", padding: 12, marginTop: 10, borderRadius: 10, alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 16 },
});
