import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import styles from './PageViewChart.module.css';

const PageViewChart = ({ data, sidebarCollapsed }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate stats before early return
  const maxValue = data && data.length > 0 ? Math.max(...data.map(d => d.views || 0)) : 0;
  const total = data && data.length > 0 ? data.reduce((sum, d) => sum + (d.views || 0), 0) : 0;
  const average = data && data.length > 0 ? Math.round(total / data.length) : 0;

  // Calculate actual day period from date range
  const daysPeriod = data && data.length > 1 ?
    Math.ceil((new Date(data[data.length - 1].date) - new Date(data[0].date)) / (1000 * 60 * 60 * 24)) + 1 :
    data?.length || 0;

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);

    // Clear previous content
    svg.selectAll("*").remove();

    // Get container width dynamically for responsive edge-to-edge
    const currentWidth = svgRef.current.parentElement.clientWidth;

    // Skip rendering if width is 0 or invalid
    if (currentWidth <= 0) {
      return;
    }

    // Set dimensions
    const margin = { top: 0, right: 0, bottom: 30, left: 0 };
    const width = currentWidth;
    const height = 300;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Update SVG dimensions to match container
    svg.attr("width", width).attr("height", height);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.views || 0)])
      .nice()
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.views || 0))
      .curve(d3.curveMonotoneX);

    // Create area generator
    const area = d3.area()
      .x(d => xScale(new Date(d.date)))
      .y0(innerHeight)
      .y1(d => yScale(d.views || 0))
      .curve(d3.curveMonotoneX);

    // Main group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add gradient definition
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", 0).attr("y2", innerHeight);

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "var(--terminal-output-color-dark)")
      .attr("stop-opacity", 0.3);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "var(--terminal-output-color-dark)")
      .attr("stop-opacity", 0.05);

    // Add grid lines
    const yTicks = yScale.ticks(5);
    g.selectAll(".grid-line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "rgba(0, 255, 65, 0.1)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    // Add area under curve
    g.append("path")
      .datum(data)
      .attr("fill", "url(#area-gradient)")
      .attr("d", area);

    // Add the line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "var(--terminal-output-color-dark)")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", line);

    // Add invisible overlay for mouse tracking
    const overlay = g.append("rect")
      .attr("class", "overlay")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .style("fill", "none")
      .style("pointer-events", "all");

    // Add dots
    const dots = g.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(new Date(d.date)))
      .attr("cy", d => yScale(d.views || 0))
      .attr("r", 4)
      .attr("fill", "var(--terminal-output-color-dark)")
      .attr("stroke", "#0a1812")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // Add vertical cursor line (initially hidden)
    const cursorLine = g.append("line")
      .attr("class", "cursor-line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "rgba(var(--terminal-output-color-dark-rgb), 0.8)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "5,5")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // Bisector for finding closest data point
    const bisect = d3.bisector(d => new Date(d.date)).left;

    // Mouse move handler
    const mousemove = (event) => {
      const [mouseX] = d3.pointer(event, g.node());
      const x0 = xScale.invert(mouseX);
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0 - new Date(d0?.date || 0) > new Date(d1?.date || 0) - x0 ? d1 : d0;

      if (!d) return;

      // Get the exact x position for the selected data point
      const exactX = xScale(new Date(d.date));

      // Show and position the cursor line
      cursorLine
        .attr("x1", exactX)
        .attr("x2", exactX)
        .style("opacity", 1);

      // Get chart container position
      const chartRect = svgRef.current.getBoundingClientRect();
      const [, mouseYRelative] = d3.pointer(event, svgRef.current);

      // Calculate tooltip position - use data point position but with better bounds checking
      const tooltipWidth = 120;
      const tooltipHeight = 60;
      const dataPointScreenX = exactX + margin.left; // Screen position of data point

      let tooltipX, tooltipY;

      // Horizontal positioning: prefer right side, but switch to left if too close to edge
      if (dataPointScreenX + 15 + tooltipWidth < chartRect.width) {
        tooltipX = dataPointScreenX + 15; // Right of the line
      } else {
        tooltipX = dataPointScreenX - tooltipWidth - 15; // Left of the line
      }

      // Ensure tooltip doesn't go off the left edge
      if (tooltipX < 0) {
        tooltipX = 10; // Small margin from left edge
      }

      // Vertical positioning
      if (mouseYRelative - 15 - tooltipHeight > 0) {
        tooltipY = mouseYRelative - 15 - tooltipHeight; // Above cursor
      } else {
        tooltipY = mouseYRelative + 25; // Below cursor
      }

      tooltip
        .style("display", "block")
        .style("left", tooltipX + "px")
        .style("top", tooltipY + "px")
        .html(`
          <div class="${styles.tooltipContent}">
            <div class="${styles.tooltipValue}">${(d.views || 0).toLocaleString()}</div>
            <div class="${styles.tooltipDate}">
              ${new Date(d.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
            </div>
          </div>
        `);

      // Highlight active dot
      dots.attr("r", 4).attr("fill", "var(--terminal-output-color-dark)");
      dots.filter(dot => dot.date === d.date)
        .attr("r", 6)
        .attr("fill", "var(--terminal-output-color)");
    };

    // Mouse leave handler
    const mouseleave = () => {
      tooltip.style("display", "none");
      cursorLine.style("opacity", 0);
      dots.attr("r", 4).attr("fill", "var(--terminal-output-color-dark)");
    };

    // Add event listeners
    overlay.on("mousemove", mousemove).on("mouseleave", mouseleave);
    dots.on("mouseover", function (event, d) {
      // Get the exact x position for this data point
      const exactX = xScale(new Date(d.date));

      // Show and position the cursor line
      cursorLine
        .attr("x1", exactX)
        .attr("x2", exactX)
        .style("opacity", 1);

      // Get chart container position and mouse position
      const chartRect = svgRef.current.getBoundingClientRect();
      const [, mouseYRelative] = d3.pointer(event, svgRef.current);

      // Calculate tooltip position - use data point position but with better bounds checking
      const tooltipWidth = 120;
      const tooltipHeight = 60;
      const dataPointScreenX = exactX + margin.left; // Screen position of data point

      let tooltipX, tooltipY;

      // Horizontal positioning: prefer right side, but switch to left if too close to edge
      if (dataPointScreenX + 15 + tooltipWidth < chartRect.width) {
        tooltipX = dataPointScreenX + 15; // Right of the line
      } else {
        tooltipX = dataPointScreenX - tooltipWidth - 15; // Left of the line
      }

      // Ensure tooltip doesn't go off the left edge
      if (tooltipX < 0) {
        tooltipX = 10; // Small margin from left edge
      }

      // Vertical positioning
      if (mouseYRelative - 15 - tooltipHeight > 0) {
        tooltipY = mouseYRelative - 15 - tooltipHeight; // Above cursor
      } else {
        tooltipY = mouseYRelative + 25; // Below cursor
      }

      tooltip
        .style("display", "block")
        .style("left", tooltipX + "px")
        .style("top", tooltipY + "px")
        .html(`
          <div class="${styles.tooltipContent}">
            <div class="${styles.tooltipValue}">${(d.views || 0).toLocaleString()}</div>
            <div class="${styles.tooltipDate}">
              ${new Date(d.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
            </div>
          </div>
        `);

      d3.select(this).attr("r", 6).attr("fill", "var(--terminal-output-color)");
    }).on("mouseout", function () {
      tooltip.style("display", "none");
      cursorLine.style("opacity", 0);
      d3.select(this).attr("r", 4).attr("fill", "var(--terminal-output-color-dark)");
    });

    // Smart tick selection - show every date for small datasets, every other for larger ones
    const tickValues = data.length <= 7 ?
      data.map(d => new Date(d.date)) :
      data.filter((d, i) => i % 2 === 0).map(d => new Date(d.date));

    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat("%b %d"))
      .tickValues(tickValues); // Use selected data points for better alignment

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("fill", "rgba(var(--terminal-output-color-rgb), 0.7)")
      .style("font-size", "12px")
      .style("font-family", "JetBrains Mono, monospace");

    // Style axis lines
    g.selectAll(".domain")
      .style("stroke", "rgba(var(--terminal-output-color-rgb), 0.3)");

    // Add resize handler for responsiveness
    const handleResize = () => {
      // Update container width state to trigger re-render
      const newWidth = svgRef.current?.parentElement?.clientWidth;
      if (newWidth && newWidth !== containerWidth) {
        setContainerWidth(newWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
      
  }, [data, containerWidth, sidebarCollapsed]);

  // Force width recalculation when sidebar state changes
  useEffect(() => {
    const updateWidth = () => {
      if (svgRef.current?.parentElement) {
        const newWidth = svgRef.current.parentElement.clientWidth;
        if (newWidth > 0 && newWidth !== containerWidth) {
          setContainerWidth(newWidth);
        }
      }
    };

    // Try multiple times with increasing delays to catch the layout change
    const timeouts = [10, 50, 150, 300].map(delay =>
      setTimeout(updateWidth, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [sidebarCollapsed, containerWidth]);

  // Add ResizeObserver for more reliable width detection
  useEffect(() => {
    if (!svgRef.current?.parentElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0 && newWidth !== containerWidth) {
          setContainerWidth(newWidth);
        }
      }
    });

    resizeObserver.observe(svgRef.current.parentElement);

    return () => resizeObserver.disconnect();
  }, [containerWidth]);

  // Early return for no data after hooks
  if (!data || data.length === 0) {
    return (
      <div className={styles.noData}>
        <span className={styles.noDataIcon}>📈</span>
        <p>No chart data available</p>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h4 className={styles.chartTitle}>Page Views Over Time</h4>
        <div className={styles.chartStats}>
          <span className={styles.statItem}>
            <span className={styles.statLabel}>peak:</span>
            <span className={styles.statValue}>{maxValue.toLocaleString()}</span>
          </span>
          <span className={styles.statItem}>
            <span className={styles.statLabel}>avg:</span>
            <span className={styles.statValue}>{average.toLocaleString()}</span>
          </span>
          <span className={styles.statItem}>
            <span className={styles.statLabel}>total:</span>
            <span className={styles.statValue}>{total.toLocaleString()}</span>
          </span>
          <span className={styles.statItem}>
            <span className={styles.statLabel}>{daysPeriod} day{daysPeriod !== 1 ? 's' : ''}</span>
          </span>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <div className={styles.chartArea}>
          <svg
            ref={svgRef}
            className={styles.lineChart}
            width="100%"
            height="300"
            preserveAspectRatio="xMidYMid meet"
          />
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 1000 }}
          />
        </div>
      </div>
    </div>
  );
};

export default PageViewChart;