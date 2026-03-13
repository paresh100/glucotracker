import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface Props {
  value: number; // 0-1 fill
  size: number;
  strokeWidth: number;
  lowColor: string;
  midColor: string;
  highColor: string;
  bgColor: string;
  level: "low" | "normal" | "high";
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const START_ANGLE = -140;
const END_ANGLE = 140;
const TOTAL_ARC = END_ANGLE - START_ANGLE;

export function GaugeRing({ value, size, strokeWidth, lowColor, midColor, highColor, bgColor, level }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;

  const fillAngle = START_ANGLE + Math.min(Math.max(value, 0), 1) * TOTAL_ARC;

  const color = level === "low" ? lowColor : level === "high" ? highColor : midColor;

  const bgPath = arcPath(cx, cy, r, START_ANGLE, END_ANGLE);
  const fillPath = value > 0.01 ? arcPath(cx, cy, r, START_ANGLE, fillAngle) : null;

  // Tick marks
  const ticks = [];
  const tickCount = 36;
  for (let i = 0; i <= tickCount; i++) {
    const angle = START_ANGLE + (i / tickCount) * TOTAL_ARC;
    const rad = ((angle - 90) * Math.PI) / 180;
    const outerR = r + strokeWidth / 2 + 6;
    const innerR = r + strokeWidth / 2 + (i % 6 === 0 ? 14 : 10);
    const x1 = cx + outerR * Math.cos(rad);
    const y1 = cy + outerR * Math.sin(rad);
    const x2 = cx + innerR * Math.cos(rad);
    const y2 = cy + innerR * Math.sin(rad);
    ticks.push({ x1, y1, x2, y2, major: i % 6 === 0 });
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={lowColor} stopOpacity="1" />
            <Stop offset="0.5" stopColor={midColor} stopOpacity="1" />
            <Stop offset="1" stopColor={highColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <Path
            key={i}
            d={`M ${t.x1} ${t.y1} L ${t.x2} ${t.y2}`}
            stroke={bgColor}
            strokeWidth={t.major ? 2 : 1}
            strokeLinecap="round"
            opacity={0.3}
          />
        ))}

        {/* Background arc */}
        <Path
          d={bgPath}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Fill arc */}
        {fillPath && (
          <Path
            d={fillPath}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Needle dot */}
        {value > 0 && (() => {
          const needleAngle = START_ANGLE + Math.min(Math.max(value, 0), 1) * TOTAL_ARC;
          const pos = polarToCartesian(cx, cy, r, needleAngle);
          return (
            <>
              <Circle cx={pos.x} cy={pos.y} r={strokeWidth / 2 + 3} fill={color} opacity={0.4} />
              <Circle cx={pos.x} cy={pos.y} r={strokeWidth / 2 - 1} fill={color} />
            </>
          );
        })()}
      </Svg>
    </View>
  );
}
