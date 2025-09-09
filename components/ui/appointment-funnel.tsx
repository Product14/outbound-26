import React from 'react';
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts';

// Types
interface Stage {
  name: string;
  count: number;
}

interface ConversionRate {
  rate: number;
}

interface FunnelData {
  stages: Stage[];
  conversionRates?: ConversionRate[];
}

interface AppointmentFunnelProps {
  isLoading?: boolean;
  data: FunnelData;
  className?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  graphColor?: string;
  conversionChipColor?: string;
}

// Area Graph Component
interface AreaGraphProps {
  data: { value: number; name: string }[];
  minValue?: number;
  maxValue: number;
  fill?: string;
  stroke?: string;
  animationDelay?: number;
}

const AreaGraph: React.FC<AreaGraphProps> = ({
  data,
  minValue = 0,
  maxValue,
  fill = '#766DE2',
  stroke = 'transparent',
  animationDelay = 0,
}) => {
  return (
    <ResponsiveContainer height={41} width="100%">
      <AreaChart
        data={data}
        margin={{
          bottom: 0,
          left: 0,
          right: 0,
          top: 5,
        }}
        syncMethod="index"
      >
        <YAxis domain={[minValue, maxValue]} hide />
        <Area
          dataKey="value"
          fill={fill}
          stroke={stroke}
          type="monotone"
          isAnimationActive={true}
          animationDuration={500}
          animationBegin={animationDelay}
          animationEasing="linear"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Conversion Chip Component
const ConversionChip: React.FC<{
  value: string;
  index: number;
  color?: string;
}> = ({ value, index, color = '#B3ABF8' }) => {
  return (
    <div
      className="absolute top-[50%] flex translate-y-[50%] items-center justify-center rounded-2xl bg-white p-2 text-xs font-semibold"
      style={{
        left: `${25 + index * 25}%`,
        transform: 'translateX(-50%)',
        boxShadow: `0px 0px 82.11px 0px ${color}`,
      }}
    >
      {value}
    </div>
  );
};

// Shimmer Component
const FunnelShimmer: React.FC<{ cardCount?: number }> = ({ cardCount = 4 }) => {
  return (
    <div className="flex h-full w-full flex-col gap-y-2">
      <div className="relative flex h-full w-full justify-between gap-x-3">
        {/* Shimmer cards */}
        {Array(cardCount)
          .fill(0)
          .map((_, index) => (
            <div
              key={`shimmer-card-${index}`}
              className="flex h-full w-full flex-col justify-between overflow-hidden rounded-lg bg-gray-100 animate-pulse"
            >
              <div className="flex flex-col p-5 pb-8">
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 w-full bg-gray-200"></div>
            </div>
          ))}
        {/* Shimmer conversion chips */}
        {Array(3)
          .fill(0)
          .map((_, index) => (
            <div
              key={`shimmer-chip-${index}`}
              className="absolute top-[50%] flex translate-y-[50%] items-center justify-center rounded-2xl bg-white p-2 animate-pulse"
              style={{
                left: `${25 + index * 25}%`,
                transform: 'translateX(-50%)',
                boxShadow: '0px 0px 82.11px 0px #B3ABF8',
              }}
            >
              <div className="h-3 w-8 bg-gray-200 rounded"></div>
            </div>
          ))}
      </div>
    </div>
  );
};

// Helper function to get conversion rates
const getConversionRates = (data: FunnelData): string[] => {
  return Array.isArray(data?.conversionRates)
    ? data.conversionRates.map((item) => `${item.rate}%`)
    : ['-', '-', '-'];
};

// Main Component
const AppointmentFunnel: React.FC<AppointmentFunnelProps> = ({
  isLoading = false,
  data,
  className = '',
  cardBackgroundColor = '#766DE20F',
  textColor = 'text-gray-700',
  graphColor = '#766DE2',
  conversionChipColor = '#B3ABF8',
}) => {
  const conversionRates = getConversionRates(data);
  const stagesData = Array.isArray(data?.stages) ? data.stages : [];

  // Transform data for AreaGraph
  const getAreaGraphData = (item: Stage, index: number) => {
    const currentCount = item.count;
    const nextCount =
      index < stagesData.length - 1
        ? stagesData[index + 1].count
        : currentCount;
    return [
      { value: currentCount, name: '' },
      { value: nextCount, name: '' },
    ];
  };

  // Calculate real max value from all counts
  const maxValue =
    stagesData.length > 0
      ? Math.max(...stagesData.map((item) => item.count), 1)
      : 1;

  if (isLoading) {
    return <FunnelShimmer cardCount={stagesData.length || 4} />;
  }

  return (
    <div className={`flex h-full w-full flex-col gap-y-2 ${className}`}>
      <div className="relative flex h-full w-full justify-between gap-x-3">
        {stagesData?.map((item: Stage, index: number) => (
          <div
            className="flex h-full w-full flex-col justify-between overflow-hidden rounded-lg"
            key={item.name}
            style={{ backgroundColor: cardBackgroundColor }}
          >
            <div className="flex flex-col p-3">
              <span className={`${textColor} text-xs font-medium`}>
                {item.name}
              </span>
              <span className={`${textColor} text-lg font-semibold`}>
                {item.count.toLocaleString()}
              </span>
            </div>
            <AreaGraph
              data={getAreaGraphData(item, index)}
              maxValue={maxValue}
              animationDelay={index * 500}
              fill={graphColor}
            />
          </div>
        ))}
        {conversionRates.map((rate: string, index: number) => (
          <ConversionChip
            key={`conversion-${index}`}
            value={rate}
            index={index}
            color={conversionChipColor}
          />
        ))}
      </div>
    </div>
  );
};

export default AppointmentFunnel;
