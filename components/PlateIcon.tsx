import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface PlateIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const PlateIcon: React.FC<PlateIconProps> = ({ 
  width = 30, 
  height = 30, 
  color = '#E53935' 
}) => {
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        {/* Plate - an improved plate icon with more detail */}
        <G>
          <Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.5" />
          <Path
            d="M7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Path
            d="M12 12L12 15"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Path
            d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12"
            stroke={color}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="1 2"
          />
          <Path
            d="M5.5 5.5L7 7 M18.5 5.5L17 7 M12 3.5V5 M6 18.5L7.5 17 M18 18.5L16.5 17"
            stroke={color}
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </G>
      </Svg>
    </View>
  );
};

export default PlateIcon; 