import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface DeliveryIllustrationProps {
  width?: number;
  height?: number;
  mainColor?: string;
  accentColor?: string;
}

const DeliveryIllustration: React.FC<DeliveryIllustrationProps> = ({
  width = 280,
  height = 250,
  mainColor = '#E53935',
  accentColor = '#FF8A65'
}) => {
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 280 250" fill="none">
        {/* Ground */}
        <Path
          d="M30 195 L250 195"
          stroke="#DDDDDD"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Scooter body */}
        <Path
          d="M70 165 C70 165, 110 140, 160 150 C160 150, 180 155, 190 160 C190 160, 200 165, 200 180"
          fill={mainColor}
          stroke="#333333"
          strokeWidth="2"
        />
        
        {/* Wheels */}
        <G>
          <Circle cx="70" cy="180" r="20" fill={accentColor} stroke="#333333" strokeWidth="2" />
          <Circle cx="70" cy="180" r="14" fill="white" stroke="#333333" strokeWidth="1" />
          <Circle cx="70" cy="180" r="7" fill="#333333" />
          <Path
            d="M70 166 L70 194 M56 180 L84 180"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>
        
        <G>
          <Circle cx="210" cy="180" r="20" fill={accentColor} stroke="#333333" strokeWidth="2" />
          <Circle cx="210" cy="180" r="14" fill="white" stroke="#333333" strokeWidth="1" />
          <Circle cx="210" cy="180" r="7" fill="#333333" />
          <Path
            d="M210 166 L210 194 M196 180 L224 180"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>
        
        {/* Handlebar */}
        <Path
          d="M90 140 C90 140, 85 120, 75 115"
          stroke="#333333"
          strokeWidth="2"
          fill="none"
        />
        <Circle cx="75" cy="115" r="6" fill="#333333" />
        
        {/* Seat */}
        <Rect x="130" y="140" width="35" height="10" rx="5" fill="#333333" />
        
        {/* Flag */}
        <Path
          d="M195 110 L195 150"
          stroke="#333333"
          strokeWidth="2"
        />
        <Path
          d="M195 110 L215 120 L195 130"
          fill={accentColor}
          stroke="#333333"
          strokeWidth="1.5"
        />
        
        {/* Driver */}
        <Circle cx="140" cy="110" r="15" fill="#FFD8B5" stroke="#333333" strokeWidth="1" /> {/* Head */}
        <Path
          d="M135 105 C135 105, 132 100, 128 103 C124 106, 125 112, 130 112"
          stroke="#333333"
          strokeWidth="1"
          fill="#FFD8B5"
        /> {/* Ear */}
        <Path
          d="M130 105 L130 108 C130 108, 132 110, 137 108"
          stroke="#333333"
          strokeWidth="1"
          fill="none"
        /> {/* Mouth */}
        <Path
          d="M125 102 C125 102, 127 98, 132 101"
          stroke="#333333"
          strokeWidth="1"
          fill="none"
        /> {/* Eye */}
        <Path
          d="M140 95 C140 95, 137 90, 145 88 C153 86, 157 92, 152 97 C147 102, 140 95, 140 95"
          fill={mainColor}
          stroke="#333333"
          strokeWidth="1"
        /> {/* Hat */}
        <Path
          d="M130 125 C130 125, 125 150, 140 160 C155 150, 150 125, 150 125"
          fill={mainColor}
          stroke="#333333"
          strokeWidth="1"
        /> {/* Body */}
        <Path
          d="M130 140 L115 160 M150 140 L165 160"
          stroke="#333333"
          strokeWidth="1.5"
          fill="none"
        /> {/* Arms */}
        <Path
          d="M140 160 L130 185 M140 160 L150 185"
          stroke="#333333"
          strokeWidth="1.5"
          fill="none"
        /> {/* Legs */}
        
        {/* Food container */}
        <Rect x="180" y="130" width="30" height="25" rx="4" fill={accentColor} stroke="#333333" strokeWidth="1.5" />
        <Path 
          d="M180 135 L210 135" 
          stroke="#333333" 
          strokeWidth="1" 
        />
        <Path 
          d="M190 130 L190 155 M200 130 L200 155" 
          stroke="#333333" 
          strokeWidth="0.5" 
        />
        
        {/* Exhaust smoke */}
        <Circle cx="60" cy="170" r="3" fill="#DDDDDD" />
        <Circle cx="55" cy="165" r="2" fill="#DDDDDD" />
        <Circle cx="50" cy="162" r="1.5" fill="#DDDDDD" />
      </Svg>
    </View>
  );
};

export default DeliveryIllustration; 