import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors } from "@/constants/colors";
import { GlucoseReading } from "@/hooks/useApi";
import { toMgdl, formatTime, formatDate } from "@/utils/glucose";
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LOW = 70;
const HIGH = 180;
const TARGET_LOW = 80;
const TARGET_HIGH = 140;

interface Props {
  readings: GlucoseReading[];
  period: "day" | "week" | "month" | "year";
}

export function GlucoseLineChart({ readings, period }: Props) {
  const chartWidth = SCREEN_WIDTH - 48;
  const chartHeight = 180;
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingLeft = 44;
  const paddingRight = 16;

  const data = useMemo(() => {
    return readings
      .map(r => ({
        ...r,
        mgdl: toMgdl(r.value, r.unit),
        time: new Date(r.recordedAt).getTime(),
      }))
      .sort((a, b) => a.time - b.time)
      .slice(-50); // cap at 50 points
  }, [readings]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height: chartHeight + paddingTop + paddingBottom }]}>
        <Text style={styles.emptyText}>No readings yet</Text>
      </View>
    );
  }

  const minTime = data[0].time;
  const maxTime = data[data.length - 1].time;
  const timeRange = maxTime - minTime || 1;

  const allValues = data.map(d => d.mgdl);
  const minVal = Math.min(...allValues, LOW - 20);
  const maxVal = Math.max(...allValues, HIGH + 20);
  const valRange = maxVal - minVal || 1;

  const innerW = chartWidth - paddingLeft - paddingRight;
  const innerH = chartHeight - paddingTop - paddingBottom;

  function xPos(time: number) {
    return paddingLeft + ((time - minTime) / timeRange) * innerW;
  }
  function yPos(val: number) {
    return paddingTop + (1 - (val - minVal) / valRange) * innerH;
  }

  const lowY = yPos(LOW);
  const highY = yPos(HIGH);

  let pathD = "";
  data.forEach((d, i) => {
    const x = xPos(d.time);
    const y = yPos(d.mgdl);
    pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  // Y axis labels
  const yLabels = [LOW, 100, HIGH];

  return (
    <View style={{ width: chartWidth }}>
      <Svg width={chartWidth} height={chartHeight + paddingTop + paddingBottom}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Target range band */}
        <Rect
          x={paddingLeft}
          y={yPos(TARGET_HIGH)}
          width={innerW}
          height={yPos(TARGET_LOW) - yPos(TARGET_HIGH)}
          fill={Colors.primary}
          opacity={0.07}
        />

        {/* Low threshold */}
        <Line
          x1={paddingLeft} y1={lowY}
          x2={paddingLeft + innerW} y2={lowY}
          stroke={Colors.danger} strokeWidth={1} strokeDasharray="4,4" opacity={0.6}
        />
        {/* High threshold */}
        <Line
          x1={paddingLeft} y1={highY}
          x2={paddingLeft + innerW} y2={highY}
          stroke={Colors.warning} strokeWidth={1} strokeDasharray="4,4" opacity={0.6}
        />

        {/* Fill area under line */}
        {data.length > 1 && (
          <Path
            d={`${pathD} L ${xPos(data[data.length - 1].time)} ${paddingTop + innerH} L ${xPos(data[0].time)} ${paddingTop + innerH} Z`}
            fill="url(#lineGrad)"
          />
        )}

        {/* Main line */}
        {data.length > 1 && (
          <Path d={pathD} stroke={Colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Data points */}
        {data.map((d, i) => {
          const color = d.mgdl < LOW ? Colors.danger : d.mgdl > HIGH ? Colors.warning : Colors.primary;
          return (
            <Circle
              key={i}
              cx={xPos(d.time)}
              cy={yPos(d.mgdl)}
              r={data.length > 20 ? 2.5 : 4}
              fill={color}
              stroke={Colors.background}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Y axis labels */}
        {yLabels.map(val => (
          <React.Fragment key={val}>
            <Text
              style={{
                position: "absolute",
                left: 0,
                top: yPos(val) + paddingTop - 8,
                fontSize: 10,
                color: Colors.textMuted,
                fontFamily: "Inter_400Regular",
                width: 40,
                textAlign: "right",
              }}
            />
          </React.Fragment>
        ))}
      </Svg>

      {/* Y axis labels overlay */}
      <View style={{ position: "absolute", left: 0, top: 0, height: chartHeight + paddingTop + paddingBottom }}>
        {yLabels.map(val => (
          <Text
            key={val}
            style={[styles.yLabel, { top: yPos(val) + paddingTop - 8 }]}
          >
            {val}
          </Text>
        ))}
      </View>

      {/* X axis labels */}
      {data.length > 0 && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: paddingLeft, marginTop: -paddingBottom + 4 }}>
          {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]]
            .filter((d, i, arr) => arr.indexOf(d) === i)
            .map((d, i) => (
              <Text key={i} style={styles.xLabel}>
                {period === "day" ? formatTime(d.recordedAt) : formatDate(d.recordedAt)}
              </Text>
            ))}
        </View>
      )}
    </View>
  );
}

export function GlucoseHistogram({ readings, period }: Props) {
  const chartWidth = SCREEN_WIDTH - 48;
  const barMaxHeight = 100;

  // Build buckets
  const buckets = useMemo(() => {
    const ranges = [
      { label: "<54", min: 0, max: 54 },
      { label: "54-70", min: 54, max: 70 },
      { label: "70-100", min: 70, max: 100 },
      { label: "100-140", min: 100, max: 140 },
      { label: "140-180", min: 140, max: 180 },
      { label: "180-250", min: 180, max: 250 },
      { label: ">250", min: 250, max: 9999 },
    ];

    const counts = ranges.map(r => ({
      ...r,
      count: readings.filter(rr => {
        const mgdl = toMgdl(rr.value, rr.unit);
        return mgdl >= r.min && mgdl < r.max;
      }).length,
    }));

    const max = Math.max(...counts.map(c => c.count), 1);
    return counts.map(c => ({ ...c, pct: c.count / max }));
  }, [readings]);

  const getBarColor = (min: number) => {
    if (min < 54) return "#FF2D55";
    if (min < 70) return Colors.danger;
    if (min < 140) return Colors.primary;
    if (min < 180) return Colors.warning;
    return "#FF4D00";
  };

  return (
    <View style={{ width: chartWidth }}>
      <View style={styles.histogram}>
        {buckets.map((b, i) => (
          <View key={i} style={styles.barCol}>
            <Text style={styles.barCount}>{b.count > 0 ? b.count : ""}</Text>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(b.pct * barMaxHeight, b.count > 0 ? 4 : 0),
                    backgroundColor: getBarColor(b.min),
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  yLabel: {
    position: "absolute",
    left: 0,
    width: 38,
    textAlign: "right",
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  xLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  histogram: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    paddingTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    height: 100,
    justifyContent: "flex-end",
    width: "100%",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 0,
  },
  barCount: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
    height: 12,
  },
  barLabel: {
    fontSize: 7.5,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    textAlign: "center",
  },
});
