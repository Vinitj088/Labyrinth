'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';

// Define chart colors
const CHART_COLORS = [
  { line: '#22c55e', area: 'rgba(34, 197, 94, 0.15)' },   // green
  { line: '#3b82f6', area: 'rgba(59, 130, 246, 0.15)' },  // blue
  { line: '#f59e0b', area: 'rgba(245, 158, 11, 0.15)' },  // amber
  { line: '#8b5cf6', area: 'rgba(139, 92, 246, 0.15)' },  // purple
  { line: '#ec4899', area: 'rgba(236, 72, 153, 0.15)' },  // pink
];

const getSeriesColor = (index: number) => {
  return CHART_COLORS[index % CHART_COLORS.length];
};

// Define the props interface for the stock chart data
export interface StockChartProps {
  data: {
    title: string;
    stock_symbols: string[];
    interval: string;
    chart: {
      type: string;
      x_label: string;
      y_label: string;
      x_scale: string;
      elements: Array<{ 
        label: string; 
        points: Array<[string, number]> 
      }>;
    };
  };
}

// Helper function to format stock symbols
const formatStockSymbol = (symbol: string) => {
  const suffixes = ['.US', '.NYSE', '.NASDAQ'];
  let formatted = symbol;
  
  suffixes.forEach(suffix => {
    formatted = formatted.replace(suffix, '');
  });

  if (formatted.endsWith('USD')) {
    formatted = formatted.replace('USD', '');
    return `${formatted} / USD`;
  }

  return formatted;
};

// Helper function to determine date format based on interval and screen size
const getDateFormat = (interval: string, date: Date, isMobile: boolean = false) => {
  // Simplified formats for mobile view
  if (isMobile) {
    const formats: Record<string, Intl.DateTimeFormatOptions> = {
      '1d': { hour: 'numeric' },
      '5d': { weekday: 'short' },
      '1mo': { day: 'numeric' },
      '3mo': { month: 'short' },
      '6mo': { month: 'short' },
      '1y': { month: 'short' },
      '2y': { month: 'short' },
      '5y': { year: 'numeric' },
      '10y': { year: 'numeric' },
      'ytd': { month: 'short' },
      'max': { year: 'numeric' }
    };
    return date.toLocaleDateString('en-US', formats[interval] || { month: 'short' });
  }

  // Regular formats for desktop view
  const formats: Record<string, Intl.DateTimeFormatOptions> = {
    '1d': { hour: 'numeric' },
    '5d': { weekday: 'short', hour: 'numeric' },
    '1mo': { month: 'short', day: 'numeric' },
    '3mo': { month: 'short', day: 'numeric' },
    '6mo': { month: 'short', day: 'numeric' },
    '1y': { month: 'short', day: 'numeric' },
    '2y': { month: 'short', year: '2-digit' },
    '5y': { month: 'short', year: '2-digit' },
    '10y': { month: 'short', year: '2-digit' },
    'ytd': { month: 'short', day: 'numeric' },
    'max': { month: 'short', year: '2-digit' }
  };

  return date.toLocaleDateString('en-US', formats[interval] || { month: 'short', day: 'numeric' });
};

// Main component
export function StockChart({ data }: StockChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e5e5e5' : '#171717';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const tooltipBg = isDark ? '#171717' : '#ffffff';
  
  // Track if we're in mobile view
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile view on component mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Add null checks for data and its properties
  if (!data || !data.chart || !data.chart.elements || !Array.isArray(data.chart.elements)) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md">
        <h3 className="text-red-600 dark:text-red-400 font-medium">Invalid Chart Data</h3>
        <p className="text-sm text-red-500 dark:text-red-300">
          The chart data is missing or has an invalid format.
        </p>
        <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-red-100 dark:bg-red-900/30 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }
  
  const { title, stock_symbols, interval, chart } = data;

  // Process the chart data
  const processedData = useMemo(() => {
    if (!chart.elements || !Array.isArray(chart.elements) || !stock_symbols) {
      return [];
    }
    
    return chart.elements.map((element, index) => {
      if (!element.points || !Array.isArray(element.points) || element.points.length === 0) {
        return {
          label: formatStockSymbol(stock_symbols[index] || 'Unknown'),
          points: [],
          firstPrice: 0,
          lastPrice: 0,
          priceChange: 0,
          percentChange: '0.00',
          color: getSeriesColor(index)
        };
      }
      
      const points = element.points.map(([dateStr, price]) => {
        const date = new Date(dateStr);
        return {
          date,
          value: Number(price),
          label: stock_symbols[index]
        };
      }).sort((a, b) => a.date.getTime() - b.date.getTime());

      const firstPrice = points[0]?.value || 0;
      const lastPrice = points[points.length - 1]?.value || 0;
      const priceChange = lastPrice - firstPrice;
      const percentChange = firstPrice === 0 ? '0.00' : ((priceChange / firstPrice) * 100).toFixed(2);

      const seriesColor = getSeriesColor(index);

      return {
        label: formatStockSymbol(stock_symbols[index] || 'Unknown'),
        points,
        firstPrice,
        lastPrice,
        priceChange,
        percentChange,
        color: seriesColor
      };
    });
  }, [chart?.elements, stock_symbols]);

  // Prepare chart options
  const options = useMemo(() => {
    const chartOptions: EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        top: 20,
        right: 35,
        bottom: isMobile ? 60 : 25,
        left: 8,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderWidth: 0,
        textStyle: {
          color: textColor
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          
          const param = params[0];
          const date = new Date(param.value[0]);
          const formattedDate = getDateFormat(interval || '1mo', date, isMobile);
          
          let tooltipContent = `<div style="font-weight: bold; margin-bottom: 4px;">${formattedDate}</div>`;
          
          params.forEach((item: any) => {
            const value = item.value[1];
            const symbol = item.seriesName || 'Unknown';
            const color = item.color || '#22c55e';
            tooltipContent += `<div style="display: flex; justify-content: space-between; margin: 2px 0;">
              <span style="color: ${color}; margin-right: 12px;">● ${symbol}</span>
              <span style="font-weight: bold;">$${value.toFixed(2)}</span>
            </div>`;
          });
          
          return tooltipContent;
        }
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: gridColor
          }
        },
        axisLabel: {
          color: textColor,
          formatter: (value: number) => {
            const date = new Date(value);
            return getDateFormat(interval || '1mo', date, isMobile);
          },
          rotate: isMobile ? 30 : 0
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLine: {
          lineStyle: {
            color: gridColor
          }
        },
        axisLabel: {
          color: textColor,
          formatter: (value: number) => `$${value.toFixed(0)}`
        },
        splitLine: {
          lineStyle: {
            color: gridColor
          }
        }
      },
      series: processedData.map((series, index) => {
        if (!series || !series.points || series.points.length === 0) {
          return {
            name: series?.label || 'Unknown',
            type: 'line',
            data: [],
            showSymbol: false,
            lineStyle: {
              color: series?.color?.line || getSeriesColor(index).line
            },
            areaStyle: {
              color: series?.color?.area || getSeriesColor(index).area
            }
          };
        }
        
        return {
          name: series.label,
          type: 'line',
          data: series.points.map(point => [point.date, point.value]),
          showSymbol: false,
          lineStyle: {
            color: series.color.line
          },
          areaStyle: {
            color: series.color.area
          }
        };
      })
    };
    
    return chartOptions;
  }, [processedData, interval, textColor, gridColor, tooltipBg, isMobile]);

  return (
    <div className="w-full">
      <div className="flex flex-col mb-4">
        <h3 className="text-lg font-medium">{title || 'Stock Chart'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {processedData && processedData.length > 0 ? processedData.map((series) => (
            <div 
              key={series.label} 
              className="flex flex-col p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{series.label}</span>
                <span className="text-lg font-semibold">
                  ${series.lastPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <span 
                  className={`text-sm ${parseFloat(series.percentChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {parseFloat(series.percentChange) >= 0 ? '+' : ''}
                  {series.priceChange.toFixed(2)} ({parseFloat(series.percentChange) >= 0 ? '+' : ''}
                  {series.percentChange}%)
                </span>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-3 rounded-md border border-border bg-muted/50">
              <p className="text-sm text-muted-foreground">No price data available</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full h-[250px] sm:h-[400px]">
        <ReactECharts 
          option={options} 
          style={{ height: '100%', width: '100%' }} 
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
} 