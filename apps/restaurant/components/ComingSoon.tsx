import { StyleSheet, Text, View } from "react-native";

import { brand } from "@/constants/brand";

/**
 * Placeholder for drawer screens that haven't been ported from the web admin
 * yet. Keeps the navigation skeleton honest so the drawer reflects the full
 * roadmap without lying about what's implemented.
 */
export function ComingSoon({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.flex}>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          {hint ?? "Available on the web admin for now. Coming to the phone soon."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: brand.offwhite },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  title: {
    color: brand.navy,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  sub: {
    color: brand.stoneMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
