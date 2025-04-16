<script>
  import * as d3 from "d3";

  export let data = [];
  export let width = 400;
  export let barHeight = 30;
  export let colorScale;

  let selectedIndex = -1;
  let hoveredIndex = -1;

  const MIN_LABEL_WIDTH = 40; // Minimum width to place label inside

  // Direct mapping from flatRollup-like data: [label, count]
  $: barData = data.map(([label, count]) => ({ label, count }));

  // X scale for bar length
  $: xScale = d3
    .scaleLinear()
    .domain([0, d3.max(barData, (d) => d.count) || 1])
    .range([0, width]);
</script>

<div class="container">
  <svg {width} height={barHeight * barData.length}>
    {#each barData as d, i (d.label)}
      <rect
        class:selected={selectedIndex === i}
        class:hovered={hoveredIndex === i}
        x="0"
        y={i * barHeight}
        width={xScale(d.count)}
        height={barHeight - 5}
        fill={colorScale(d.label)}
        on:click={() => (selectedIndex = selectedIndex === i ? -1 : i)}
        on:mouseenter={() => (hoveredIndex = i)}
        on:mouseleave={() => (hoveredIndex = -1)}
      />
      <text
        class="label"
        x={xScale(d.count) > MIN_LABEL_WIDTH
          ? xScale(d.count) - 5
          : xScale(d.count) + 5}
        y={i * barHeight + (barHeight - 5) / 2}
        text-anchor={xScale(d.count) > MIN_LABEL_WIDTH ? "end" : "start"}
        fill={xScale(d.count) > MIN_LABEL_WIDTH ? "white" : "black"}
      >
        {d.label}: {d.count}
      </text>
    {/each}
  </svg>

  <ul class="legend">
    {#each barData as d, i}
      <li
        style="--color: {colorScale(d.label)}"
        class:selected={selectedIndex === i}
        on:click={() => (selectedIndex = selectedIndex === i ? -1 : i)}
      >
        <span class="swatch"></span>
        {d.label} <em>({d.count})</em>
      </li>
    {/each}
  </ul>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  rect {
    transition: all 300ms ease;
    cursor: pointer;
  }

  rect.hovered {
    opacity: 1;
    stroke-width: 2;
  }

  svg:has(rect.hovered) rect:not(.hovered) {
    opacity: 0.3;
  }

  rect.selected {
    stroke-width: 2;
  }

  svg:has(rect.selected) rect:not(.selected) {
    opacity: 0.3;
  }

  rect.selected.hovered {
    stroke-width: 3;
    opacity: 1;
  }

  .label {
    font-size: 0.75em;
    pointer-events: none;
    dominant-baseline: middle;
  }

  .legend {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8em, 1fr));
    gap: 0.5em;
    list-style: none;
    padding: 1em;
    margin: 1em 0;
    border: 1px solid;
    background: transparent;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
  }

  .legend li {
    color: var(--color);
    cursor: pointer;
    font-size: 0.85em;
  }

  .legend li.selected {
    font-weight: bold;
  }

  .legend:has(.selected) li:not(.selected) {
    color: gray;
    opacity: 0.5;
  }

  .legend li .swatch {
    background: var(--color);
    display: inline-block;
    width: 1em;
    height: 1em;
    border-radius: 0.2em;
    margin-right: 0.25em;
  }

  .legend em {
    font-style: normal;
    color: gray;
  }
</style>
