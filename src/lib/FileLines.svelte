<script>
  import * as d3 from "d3";
  export let lines = [];
  export let colorScale;
  export let svgWidth;

  let svg;
  let previousDotCounts = new Map();

  const firstColumnWidth = 150;
  const fileInfoMargin = 100;
  const dotsColumnX = 350;
  const approxDotWidth = 20;
  const linesPerDot = 1;
  const baseY = 10;
  const totalLinesOffset = 20;
  const fileInfoHeight = baseY + totalLinesOffset;
  const dotRowHeight = 20;

  function generateDots(file) {
    const totalDots = Math.ceil(file.lines.length / linesPerDot);
    const availableWidth = svgWidth - dotsColumnX;
    const maxDotsPerRow =
      Math.floor(availableWidth / approxDotWidth) || totalDots;
    const dotRows = Math.ceil(totalDots / maxDotsPerRow);

    let tspans = "";
    let globalIdx = 0; // ← unique index per dot

    for (let r = 0; r < dotRows; r++) {
      const rowLines = file.lines.slice(
        r * maxDotsPerRow,
        (r + 1) * maxDotsPerRow
      );

      const rowDots = rowLines
        .map((line) => {
          const html = `<tspan class="dot"
                              data-index="${globalIdx}"
                              style="fill:${colorScale(line.type)}">•</tspan>`;
          globalIdx += 1;
          return html;
        })
        .join("");

      tspans += `<tspan x="${dotsColumnX}"
                      dy="${r === 0 ? 0 : dotRowHeight}px">${rowDots}</tspan>`;
    }
    return tspans;
  }

  $: files = d3
    .groups(lines, (d) => d.file) // [{file, lines: [...]}, …]
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  $: filesWithHeights = files.map((f) => {
    const totalDots = Math.ceil(f.lines.length / linesPerDot);
    const availableWidth = svgWidth - dotsColumnX;
    const maxDotsPerRow =
      Math.floor(availableWidth / approxDotWidth) || totalDots;
    const dotRows = Math.ceil(totalDots / maxDotsPerRow);
    return { ...f, groupHeight: fileInfoHeight + dotRows * dotRowHeight };
  });

  $: positions = (() => {
    let y = 0,
      out = [];
    for (const f of filesWithHeights) {
      out.push(y);
      y += f.groupHeight;
    }
    return out;
  })();

  $: if (svg) {
    const totalHeight = positions.length
      ? positions[positions.length - 1] +
        filesWithHeights[filesWithHeights.length - 1].groupHeight
      : 0;

    d3.select(svg)
      .attr("width", svgWidth)
      .attr("height", totalHeight)
      .style("overflow", "hidden");

    const groups = d3
      .select(svg)
      .selectAll("g.file")
      .data(filesWithHeights, (d) => d.name);

    groups.exit().remove();

    const enterGroups = groups.enter().append("g").attr("class", "file");

    enterGroups
      .append("text")
      .attr("class", "filename")
      .attr("x", 10)
      .attr("y", 25)
      .text((d) => d.name);

    enterGroups
      .append("text")
      .attr("class", "linecount")
      .attr("x", 10)
      .attr("y", 25 + totalLinesOffset)
      .text((d) => `${d.lines.length} lines`);

    enterGroups
      .append("text")
      .attr("class", "unit-dots")
      .attr("dominant-baseline", "mathematical")
      .attr("fill", "#1f77b4");

    const merged = enterGroups.merge(groups);

    enterGroups.attr("transform", (d, i) => `translate(0, ${positions[i]})`);
    merged
      .transition()
      .duration(function (d, i) {
        const currentTransform =
          this.getAttribute("transform") || "translate(0,0)";
        const match = currentTransform.match(
          /translate\(\s*0\s*,\s*([0-9.]+)\s*\)/
        );
        const oldY = match ? +match[1] : 0;
        const newY = positions[i];
        const distance = Math.abs(newY - oldY);
        return distance * 2;
      })

      .ease(d3.easeCubicOut)
      .attr("transform", (d, i) => `translate(0, ${positions[i]})`);

    merged
      .select("text.unit-dots")
      .attr("x", dotsColumnX)
      .attr("y", baseY - 2)
      .html((d) => generateDots(d));

    groups.each(function (d) {
      const groupSel = d3.select(this);
      // We check here if a transition is running.
      if (groupSel.attr("data-transition-running") === "true") {
        return; // If a transition is running, we skip this group for now.
      }
      const unitDotsSel = groupSel.select("text.unit-dots");
      const oldCount = previousDotCounts.get(d.name) || 0;
      unitDotsSel.html(generateDots(d, svgWidth));
      const newCount = Math.ceil(d.lines.length / linesPerDot);
      if (newCount > oldCount) {
        // Here we set flag to prevent overlapping transitions.
        groupSel.attr("data-transition-running", "true");
        unitDotsSel
          .selectAll("tspan.dot")
          .filter(function () {
            return +this.getAttribute("data-index") >= oldCount;
          })
          .style("opacity", 0)
          .transition()
          .duration(1000)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .on("end", function () {
            // When the transition is finished, we clear the flag.
            groupSel.attr("data-transition-running", "false");
          });
      } else {
        groupSel.attr("data-transition-running", "false");
      }
      previousDotCounts.set(d.name, newCount);
    });
  }
</script>

<svg bind:this={svg}></svg>

<style>
  :global(.filename) {
    font-weight: 600;
    font-size: 1rem;
  }
  :global(.linecount) {
    font-size: 0.75rem;
    fill: gray;
  }
  :global(.unit-dots) {
    font-size: 2.2rem;
  }
</style>
