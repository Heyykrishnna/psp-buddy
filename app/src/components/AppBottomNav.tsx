import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type AppNavKey = "MAP" | "MISSIONS" | "RANK" | "PROFILE";

type AppBottomNavProps = {
  active: AppNavKey;
  onChange: (next: AppNavKey) => void;
};

const TABS: Array<{ key: AppNavKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "MAP", label: "Map", icon: "map" },
  { key: "MISSIONS", label: "Missions", icon: "book-outline" },
  { key: "RANK", label: "Rank", icon: "trophy-outline" },
  { key: "PROFILE", label: "Profile", icon: "person-outline" },
];

const COLORS = {
  ink: "#20253D",
  muted: "#7D879F",
  white: "#FFFFFF",
  canvas: "#F1F5FB",
  purple: "#7366E8",
};

export function AppBottomNav({ active, onChange }: AppBottomNavProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const tabWidth = containerWidth > 0 ? (containerWidth - 14) / TABS.length : 0;
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.key === active));

  useEffect(() => {
    if (!tabWidth) return;
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabWidth,
      stiffness: 190,
      damping: 23,
      mass: 0.78,
      overshootClamping: false,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handlePress = (key: AppNavKey) => {
    Animated.sequence([
      Animated.spring(pressScale, { toValue: 0.985, stiffness: 330, damping: 24, mass: 0.55, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, stiffness: 260, damping: 18, mass: 0.55, useNativeDriver: true }),
    ]).start();
    onChange(key);
  };

  return (
    <View style={styles.shell}>
      <Animated.View style={[styles.nav, { transform: [{ scale: pressScale }] }]} onLayout={handleLayout}>
        {tabWidth > 0 && <Animated.View style={[styles.activePill, { width: tabWidth, transform: [{ translateX: indicatorX }] }]} />}
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => handlePress(tab.key)}
              activeOpacity={0.82}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Ionicons name={tab.icon} size={22} color={isActive ? COLORS.white : COLORS.muted} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  nav: {
    height: 68,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 5,
    flexDirection: "row",
    alignItems: "stretch",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#C7D2E5",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  activePill: {
    position: "absolute",
    left: 5,
    top: 5,
    bottom: 5,
    borderRadius: 20,
    backgroundColor: COLORS.purple,
  },
  tab: {
    flex: 1,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 20,
  },
  tabLabel: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
  },
  tabLabelActive: {
    color: COLORS.white,
  },
});
