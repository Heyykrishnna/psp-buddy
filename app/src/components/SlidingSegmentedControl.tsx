import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";

interface SlidingSegmentedControlProps<T extends string> {
  options: readonly T[];
  selectedOption: T;
  onSelect: (option: T) => void;
  formatLabel?: (option: T) => string;
}

export function SlidingSegmentedControl<T extends string>({
  options,
  selectedOption,
  onSelect,
  formatLabel,
}: SlidingSegmentedControlProps<T>) {
  const selectedIndex = options.indexOf(selectedOption);
  const animValue = useRef(
    new Animated.Value(selectedIndex < 0 ? 0 : selectedIndex),
  ).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: selectedIndex < 0 ? 0 : selectedIndex,
      stiffness: 280,
      damping: 24,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex]);

  const numOptions = options.length;

  const leftPosition = animValue.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => `${(i * 100) / numOptions}%`),
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            width: `${100 / numOptions}%`,
            left: leftPosition,
          },
        ]}
      />
      {options.map((opt) => {
        const isActive = selectedOption === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={styles.tab}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {formatLabel ? formatLabel(opt) : opt.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#191a1e",
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
    overflow: "hidden",
    height: 48,
    alignItems: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: "#5451FF",
    borderRadius: 16,
    shadowColor: "#5451FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  tab: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  tabText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  activeTabText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
