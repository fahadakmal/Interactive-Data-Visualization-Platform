import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ChartData, ChartOptions, Dataset, DataPoint } from '../../types/visualization';

interface D3LineChartProps {
  data: ChartData;
  options: ChartOptions;
  svgRef: (element: SVGSVGElement | null) => void;
}

const D3LineChart: React.FC<D3LineChartProps> = ({ data, options, svgRef }) => {
  const chartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      svgRef(chartRef.current);
    }
  }, [svgRef]);

  useEffect(() => {
    if (!data || !data.datasets || data.datasets.length === 0) return;

    // Clear existing chart
    if (chartRef.current) {
      d3.select(chartRef.current).selectAll('*').remove();
    }

    // Chart dimensions and margins
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const svgWidth = options.chartWidth || chartRef.current?.parentElement?.clientWidth || 800;
    const svgHeight = options.chartHeight || 500;
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select(chartRef.current)
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    // Add a clipPath for the chart area
    svg.append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);

    // Add a group for chart content (not clipped)
    let contentNode = svg.select('g.chart-content').node();
    if (contentNode) {
      d3.select(contentNode).remove();
    }
    const content = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add a group for plot area (clipped)
    let plotAreaNode = content.select('g.plot-area').node();
    if (plotAreaNode) {
      d3.select(plotAreaNode).remove();
    }
    const plotArea = content.append('g')
      .attr('class', 'plot-area')
      .attr('clip-path', 'url(#chart-clip)');

    // Find min and max values for scales
    const allPoints = data.datasets.flatMap(dataset => dataset.data);
    let xMin = d3.min(allPoints, d => d.x) || 0;
    let xMax = d3.max(allPoints, d => d.x) || 100;
    let yMin = d3.min(allPoints, d => d.y) || 0;
    let yMax = d3.max(allPoints, d => d.y) || 100;
    // Add padding to the ranges
    const xPadding = (xMax - xMin) * 0.05;
    const yPadding = (yMax - yMin) * 0.05;
    if (!options.axisConfig.x.autoScale && options.axisConfig.x.min !== undefined && options.axisConfig.x.max !== undefined) {
      xMin = options.axisConfig.x.min;
      xMax = options.axisConfig.x.max;
    } else {
      xMin = xMin - xPadding;
      xMax = xMax + xPadding;
    }
    if (!options.axisConfig.y.autoScale && options.axisConfig.y.min !== undefined && options.axisConfig.y.max !== undefined) {
      yMin = options.axisConfig.y.min;
      yMax = options.axisConfig.y.max;
    } else {
      yMin = yMin - yPadding;
      yMax = yMax + yPadding;
    }
    const hasDateX = data.datasets.some(ds => ds.isDateXAxis);
    const hasDateY = data.datasets.some(ds => ds.isDateYAxis);
    // Initial scales
    const xScale = hasDateX
      ? d3.scaleTime().domain([xMin, xMax].map(d => new Date(d))).range([0, width])
      : d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
    const yScale = hasDateY
      ? d3.scaleTime().domain([yMin, yMax].map(d => new Date(d))).range([height, 0])
      : d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

    // Draw chart content (axes, lines, points, legend, etc.)
    function drawChart(
      xS: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>,
      yS: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>
    ) {
      content.selectAll('.x-axis, .y-axis, .x-axis-label, .y-axis-label, .chart-title, .legend').remove();
      plotArea.selectAll('*').remove();
      // Axes
      const xAxis = hasDateX
        ? d3.axisBottom(xS).tickFormat((d) => {
            const date = new Date(d as number);
            const formatMillisecond = d3.timeFormat('%H:%M:%S.%L');
            const formatSecond = d3.timeFormat('%H:%M:%S');
            const formatMinute = d3.timeFormat('%H:%M');
            const formatHour = d3.timeFormat('%H:%M');
            const formatDay = d3.timeFormat('%b %d');
            const formatMonth = d3.timeFormat('%Y %b');
            const formatYear = d3.timeFormat('%Y');
            return (d3.timeSecond(date) < date ? formatMillisecond
                : d3.timeMinute(date) < date ? formatSecond
                : d3.timeHour(date) < date ? formatMinute
                : d3.timeDay(date) < date ? formatHour
                : d3.timeMonth(date) < date ? formatDay
                : d3.timeYear(date) < date ? formatMonth
                : formatYear)(date);
          })
        : d3.axisBottom(xS);
      const yAxis = hasDateY
        ? d3.axisLeft(yS).tickFormat((d) => d3.timeFormat('%Y-%m-%d')(new Date(d as number)))
        : d3.axisLeft(yS);
      const xAxisGroup = content.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);
      if (hasDateX) {
        const rotation = options.axisConfig.x.tickRotation !== undefined ? options.axisConfig.x.tickRotation : -45;
        xAxisGroup.selectAll('text')
          .attr('transform', `rotate(${rotation})`)
          .style('text-anchor', rotation > 0 ? 'start' : 'end')
          .attr('dx', rotation > 0 ? '0.8em' : '-0.8em')
          .attr('dy', rotation > 0 ? '0.15em' : '0.15em');
      }
      content.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);
      // Axis labels
      content.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text(options.axisConfig.x.label);
      content.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .text(options.axisConfig.y.label);
      // Chart title
      content.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2 + 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text(options.title);
      // Grid lines (draw in plotArea so they are clipped)
      if (options.showGrid) {
        plotArea.append('g')
          .attr('class', 'grid x-grid')
          .attr('transform', `translate(0,${height})`)
          .call(
            d3.axisBottom(xS)
              .tickSize(-height)
              .tickFormat(() => '')
          )
          .selectAll('line')
          .style('stroke', '#e0e0e0')
          .style('stroke-opacity', 0.7);
        plotArea.append('g')
          .attr('class', 'grid y-grid')
          .call(
            d3.axisLeft(yS)
              .tickSize(-width)
              .tickFormat(() => '')
          )
          .selectAll('line')
          .style('stroke', '#e0e0e0')
          .style('stroke-opacity', 0.7);
      }
      // Line generator
      const line = d3.line<DataPoint>()
        .x(d => xS(d.x))
        .y(d => yS(d.y))
        .curve(d3.curveMonotoneX);
      // Draw lines and points in plotArea
      const getDashArray = (lineStyle: string): string => {
        switch (lineStyle) {
          case 'dashed': return '5,5';
          case 'dotted': return '2,2';
          default: return '';
        }
      };
      const getPointSymbol = (pointStyle: string) => {
        switch (pointStyle) {
          case 'square': return d3.symbol().type(d3.symbolSquare).size(60);
          case 'triangle': return d3.symbol().type(d3.symbolTriangle).size(80);
          case 'circle':
          default: return d3.symbol().type(d3.symbolCircle).size(60);
        }
      };
      data.datasets.forEach(dataset => {
        const { style } = dataset;
        if (style.showLine) {
          plotArea.append('path')
            .datum(dataset.data)
            .attr('fill', 'none')
            .attr('stroke', style.color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', getDashArray(style.lineStyle))
            .attr('d', line)
            .attr('class', `line-${dataset.id}`)
            .style('opacity', 0)
            .transition()
            .duration(1000)
            .style('opacity', 1);
        }
        if (style.showPoints && style.pointStyle !== 'none') {
          const pointSymbol = getPointSymbol(style.pointStyle);
          plotArea.selectAll(`.point-${dataset.id}`)
            .data(dataset.data)
            .enter()
            .append('path')
            .attr('class', `point-${dataset.id}`)
            .attr('d', pointSymbol)
            .attr('transform', d => `translate(${xS(d.x)},${yS(d.y)})`)
            .attr('fill', style.color)
            .style('opacity', 0)
            .transition()
            .delay((_, i) => i * 50)
            .duration(500)
            .style('opacity', 1);
        }
      });
      // Legend (not clipped)
      if (options.showLegend) {
        const legend = content.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${width + 10}, 0)`);
        data.datasets.forEach((dataset, i) => {
          const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
          legendItem.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', dataset.style.color);
          legendItem.append('text')
            .attr('x', 24)
            .attr('y', 12)
            .text(dataset.label)
            .style('font-size', '12px')
            .style('fill', dataset.style.color);
          legendItem.on('click', () => {
            const isVisible = d3.select(`.line-${dataset.id}`).style('display') !== 'none';
            d3.select(`.line-${dataset.id}`).style('display', isVisible ? 'none' : '');
            d3.selectAll(`.point-${dataset.id}`).style('display', isVisible ? 'none' : '');
            legendItem.select('text')
              .style('fill', isVisible ? '#ccc' : dataset.style.color);
          });
        });
      }
      // Tooltip (clipped)
      const tooltip = d3.select('body').append('div')
        .attr('class', 'd3-tooltip')
        .style('position', 'absolute')
        .style('background-color', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0);
      data.datasets.forEach(dataset => {
        plotArea.selectAll(`.tooltip-circle-${dataset.id}`)
          .data(dataset.data)
          .enter()
          .append('circle')
          .attr('class', `tooltip-circle-${dataset.id}`)
          .attr('cx', d => xS(d.x))
          .attr('cy', d => yS(d.y))
          .attr('r', 5)
          .attr('fill', 'transparent')
          .on('mouseover', (event, d) => {
            const xValue = dataset.isDateXAxis ? d3.timeFormat('%Y-%m-%d %H:%M:%S')(new Date(d.x)) : d.x.toFixed(2);
            const yValue = d.y.toFixed(2);
            tooltip.html(`X: ${xValue}<br/>${dataset.label}: ${yValue}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 20) + 'px')
              .transition()
              .duration(200)
              .style('opacity', 0.9);
          })
          .on('mouseout', () => {
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);
          });
      });
    }

    // Initial draw
    drawChart(xScale, yScale);

   
  }, [data, options, chartRef]);

  return (
    <svg ref={chartRef}></svg>
  );
};

export default D3LineChart;