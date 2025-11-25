
import React from "react";
import { TextInput, StyleSheet } from "react-native";

type Props = {
  value: string;
  onChange: (t: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <TextInput
      style={styles.searchInput}
      placeholder="Search recordings..."
      value={value}
      onChangeText={onChange}
    />
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginHorizontal: 12,
    marginBottom: 8,
  },
});
