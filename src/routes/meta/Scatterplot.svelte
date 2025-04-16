<script>
  import * as d3 from "d3";
  import { computePosition, autoPlacement, offset } from "@floating-ui/dom";
  import { onMount } from "svelte";

  export let commits = [];
  export let selectedCommits = [];

  let width = 1000,
    height = 600;
  let margin = { top: 10, right: 10, bottom: 30, left: 20 };
  let usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
  };
  usableArea.width = usableArea.right - usableArea.left;
  usableArea.height = usableArea.bottom - usableArea.top;

  let xAxis, yAxis, yAxisGridlines;
  let xScale, yScale;
  $: {
    xScale = d3
      .scaleTime()
      .domain(d3.extent(commits.map((d) => d.date)))
      .range([0, width])
      .nice();

    yScale = d3.scaleLinear().domain([24, 0]).range([height, 0]);
  }

  $: {
    d3.select(xAxis).call(d3.axisBottom(xScale));
    d3.select(yAxis).call(
      d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00")
    );
    d3.select(yAxisGridlines).call(
      d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
    );
  }

  let hoveredIndex = -1;
  $: hoveredCommit = commits[hoveredIndex] ?? hoveredCommit ?? {};
  let cursor = { x: 0, y: 0 };
  let commitTooltip;
  let tooltipPosition = { x: 0, y: 0 };

  let svg;
  $: {
    d3.select(svg).call(d3.brush().on("start brush end", brushed));
    d3.select(svg).selectAll(".dots, .overlay ~ *").raise();
  }
  let brushSelection = null;
  function brushed(evt) {
    brushSelection = evt.selection;
  }

  function isCommitBrushed(commit) {
    if (!brushSelection) return false;
    let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
    let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
    let x = xScale(commit.date);
    let y = yScale(commit.hourFrac);
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
  }

  $: brushedCommits = brushSelection ? commits.filter(isCommitBrushed) : [];
  $: selectedCommits = Array.from(
    new Set([...selectedCommits, ...brushedCommits])
  );

  async function dotInteraction(index, evt) {
    let hoveredDot = evt.target;
    if (evt.type === "mouseenter") {
      hoveredIndex = index;
      cursor = { x: evt.x, y: evt.y };
      tooltipPosition = await computePosition(hoveredDot, commitTooltip, {
        strategy: "fixed",
        middleware: [offset(5), autoPlacement()],
      });
    } else if (evt.type === "mouseleave") {
      hoveredIndex = -1;
    } else if (evt.type === "click") {
      let commit = commits[index];
      if (!selectedCommits.includes(commit)) {
        selectedCommits = [...selectedCommits, commit];
      } else {
        selectedCommits = selectedCommits.filter((c) => c !== commit);
      }
    }
  }

  $: rScale = d3
    .scaleSqrt()
    .domain(d3.extent(commits, (d) => d.totalLines))
    .range([2, 30]);
</script>

<svg bind:this={svg} viewBox="0 0 {width} {height}">
  <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
  <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
  <g
    class="gridlines"
    transform="translate({usableArea.left}, 0)"
    bind:this={yAxisGridlines}
  />
  <g class="dots">
    {#each commits as commit, index (commit.id)}
      <circle
        class:selected={selectedCommits.includes(commit)}
        on:click={(evt) => dotInteraction(index, evt)}
        on:mouseenter={(evt) => dotInteraction(index, evt)}
        on:mouseleave={(evt) => dotInteraction(index, evt)}
        cx={xScale(commit.datetime)}
        cy={yScale(commit.hourFrac)}
        r={rScale(commit.totalLines)}
        fill="steelblue"
        fill-opacity={hoveredIndex === index ? 1 : 0.6}
      />
    {/each}
  </g>
</svg>

<dl
  class="info tooltip"
  hidden={hoveredIndex === -1}
  bind:this={commitTooltip}
  style="top: {tooltipPosition.y}px; left: {tooltipPosition.x}px"
>
  <dt>Commit</dt>
  <dd>
    <a
      href={`https://github.com/autumnartist/my-portfolio/commit/${hoveredCommit.id}`}
      target="_blank">{hoveredCommit.id}</a
    >
  </dd>

  <dt>Date</dt>
  <dd>{hoveredCommit.datetime?.toLocaleString("en", { dateStyle: "full" })}</dd>

  <dt>Time</dt>
  <dd>
    {hoveredCommit.datetime?.toLocaleTimeString("en", { timeStyle: "short" })}
  </dd>

  <dt>Author</dt>
  <dd>{hoveredCommit.author}</dd>

  <dt>Lines Edited</dt>
  <dd>{hoveredCommit.totalLines}</dd>
</dl>

<style>
  svg {
    overflow: visible;
  }
  .gridlines {
    stroke-opacity: 0.2;
  }
  circle {
    transition: 200ms;
    transform-origin: center;
    transform-box: fill-box;

    &:hover {
      transform: scale(1.5);
    }
    @starting-style {
      r: 0;
    }
  }
  .tooltip {
    position: fixed;
    top: 1em;
    left: 1em;
    background-color: oklch(100% 0% 0 / 80%);
    border-radius: 10%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    padding: 15px;
  }
  dl.info {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    transition-duration: 500ms;
    transition-property: opacity, visibility;

    &[hidden]:not(:hover, :focus-within) {
      opacity: 0;
      visibility: hidden;
    }
  }
  dl.info dt {
    font-weight: bold;
    opacity: 0.5;
  }
  dl.info dd {
    margin: 0;
  }
  .selected {
    fill: var(--color-accent);
  }
  @keyframes marching-ants {
    to {
      stroke-dashoffset: -8; /* 5 + 3 */
    }
  }

  svg :global(.selection) {
    fill-opacity: 10%;
    stroke: black;
    stroke-opacity: 70%;
    stroke-dasharray: 5 3;
    animation: marching-ants 2s linear infinite;
  }
</style>
