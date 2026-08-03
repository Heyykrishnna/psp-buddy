import React, { useRef, useEffect, useState } from "react";
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

const PADDING = 5;

export function SlidingSegmentedControl<T extends string>({
  options,
  selectedOption,
  onSelect,
  formatLabel,
}: SlidingSegmentedControlProps<T>) {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const selectedIndex = options.indexOf(selectedOption);
  const animValue = useRef(
    new Animated.Value(selectedIndex < 0 ? 0 : selectedIndex)
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
  const innerTrackWidth = containerWidth > 0 ? containerWidth - PADDING * 2 : 0;
  const itemWidth = innerTrackWidth > 0 ? innerTrackWidth / numOptions : 0;

  const leftPosition = animValue.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => PADDING + i * itemWidth),
  });

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && itemWidth > 0 && (
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: itemWidth,
              left: leftPosition,
            },
          ]}
        />
      )}
      <View style={styles.track}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#191a1e",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
    overflow: "hidden",
    height: 52,
    justifyContent: "center",
    marginVertical: 4,
  },
  track: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    paddingHorizontal: PADDING,
  },
  activeIndicator: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    backgroundColor: "#5451FF",
    borderRadius: 17,
    shadowColor: "#5451FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
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
