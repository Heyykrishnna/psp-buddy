import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, ViewStyle } from 'react-native';

export interface LoaderProps {
  color?: string;
  size?: 'small' | 'medium' | 'large' | number;
  style?: ViewStyle;
}

const BOX_CONFIGS = [
  {
    baseX: 26,
    baseY: 0,
    x: [0, -26, 0, 0, 26, 26, 26, 26, 26, 0, -26, 0],
    y: [0, 0, 0, 0, 0, 26, 26, 26, 0, 0, 0, 0],
  },
  {
    baseX: 26,
    baseY: 0,
    x: [0, 0, 26, 0, 26, 26, 26, 26, 26, 0, 0, 0],
    y: [0, 0, 0, 0, 0, 26, 26, 26, 26, 26, 26, 0],
  },
  {
    baseX: 52,
    baseY: 52,
    x: [0, -26, -26, 0, -26, -26, -26, -26, -26, -26, 0, 0],
    y: [0, 0, 0, 0, 0, 0, 0, 0, 0, -26, -26, 0],
  },
  {
    baseX: 26,
    baseY: 26,
    x: [0, -26, -26, -26, 0, 0, 0, 0, 0, -26, -26, 0],
    y: [0, 0, 0, -26, -26, 0, -26, -26, -26, -26, 0, 0],
  },
  {
    baseX: 26,
    baseY: 26,
    x: [0, 0, 0, 0, 26, 26, 26, 26, 26, 26, 0, 0],
    y: [0, 0, 0, 0, 0, 0, 0, 0, 0, -26, -26, 0],
  },
  {
    baseX: 52,
    baseY: 26,
    x: [0, 0, -26, -26, 0, 0, 0, 0, 0, -26, -26, 0],
    y: [0, 0, 0, 0, 0, 0, 0, 0, 26, 26, 0, 0],
  },
  {
    baseX: 0,
    baseY: 52,
    x: [0, 26, 26, 26, 0, 0, 26, 0, 0, 0, 26, 0],
    y: [0, 0, 0, 0, 0, -26, -26, -26, -26, 0, 0, 0],
  },
  {
    baseX: 26,
    baseY: 52,
    x: [0, 0, -26, -26, 0, 0, 0, 0, 0, 26, 26, 0],
    y: [0, 0, 0, -26, -26, -26, -26, -26, -26, -26, 0, 0],
  },
  {
    baseX: 52,
    baseY: 52,
    x: [0, -26, -26, 0, -26, 0, 0, -26, -26, -52, -26, 0],
    y: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
];

const INPUT_RANGE = [
  0,
  1 / 11,
  2 / 11,
  3 / 11,
  4 / 11,
  5 / 11,
  6 / 11,
  7 / 11,
  8 / 11,
  9 / 11,
  10 / 11,
  1,
];

export const Loader: React.FC<LoaderProps> = ({
  color = '#5451FF',
  size = 'medium',
  style,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const scale =
    typeof size === 'number'
      ? size
      : size === 'small'
      ? 0.35
      : size === 'large'
      ? 1.0
      : 0.7;

  const containerSize = 72 * scale;

  return (
    <View
      style={[
        {
          width: containerSize,
          height: containerSize,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View
        style={{
          width: 72,
          height: 72,
          position: 'relative',
          transform: [{ scale }],
        }}
      >
        {BOX_CONFIGS.map((box, index) => {
          const translateX = progress.interpolate({
            inputRange: INPUT_RANGE,
            outputRange: box.x,
          });
          const translateY = progress.interpolate({
            inputRange: INPUT_RANGE,
            outputRange: box.y,
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: color,
                  left: box.baseX,
                  top: box.baseY,
                  transform: [{ translateX }, { translateY }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 4,
  },
});
