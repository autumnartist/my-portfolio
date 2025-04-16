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

  $: dataForStack = [Object.fromEntries(data)];
  $: keys = data.map((d) => d[0]);
  $: stackedData = d3.stack().keys(keys)(dataForStack);

  $: total = d3.max(stackedData, (series) => d3.max(series, (d) => d[1])) || 1;

  // X scale for bar length
  $: xScale = d3
    .scaleLinear()
    // .domain([0, d3.max(barData, (d) => d.count) || 1])
    .domain([0, total])
    .range([0, width]);
</script>

<div class="container">
  <svg {width} height={barHeight}>
    {#each stackedData as series, i (series.key)}
      {#each series as d, j}
        <rect
          class:selected={selectedIndex === i}
          class:hovered={hoveredIndex === i}
          x={xScale(d[0])}
          y="0"
          width={xScale(d[1]) - xScale(d[0])}
          height={barHeight - 5}
          fill={colorScale(series.key)}
          on:click={() => (selectedIndex = selectedIndex === i ? -1 : i)}
          on:mouseenter={() => (hoveredIndex = i)}
          on:mouseleave={() => (hoveredIndex = -1)}
        />
        {#if xScale(d[1]) - xScale(d[0]) > MIN_LABEL_WIDTH}
          <text
            class="label"
            x={(xScale(d[0]) + xScale(d[1])) / 2}
            y={barHeight / 2}
            text-anchor="middle"
            fill="white"
            dominant-baseline="middle"
          >
            {series.key}: {d[1] - d[0]}
          </text>
        {/if}
      {/each}
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
  /* ---------- Container Layout ---------- */
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ---------- Bars ---------- */
  rect {
    /*stroke: white;*/
    transition: all 300ms ease;
    cursor: pointer;
  }

  /* Hover effect */
  rect.hovered {
    opacity: 1;
    /*stroke: black;*/
    stroke-width: 2;
  }

  /* Dim others when hovering */
  svg:has(rect.hovered) rect:not(.hovered) {
    opacity: 0.3;
  }

  /* Selection effect */
  rect.selected {
    /*stroke: black;*/
    stroke-width: 2;
  }

  /* Dim others when selected */
  svg:has(rect.selected) rect:not(.selected) {
    opacity: 0.3;
  }

  /* Combined hover + select */
  rect.selected.hovered {
    /*stroke: black;*/
    stroke-width: 3;
    opacity: 1;
  }

  /* ---------- Labels ---------- */
  .label {
    font-size: 0.75em;
    pointer-events: none;
    dominant-baseline: middle;
    /* Fill is dynamically set */
  }

  /* ---------- Legend ---------- */
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

  /* Legend items */
  .legend li {
    color: var(--color);
    cursor: pointer;
    font-size: 0.85em;
  }

  /* Highlight selected */
  .legend li.selected {
    font-weight: bold;
  }

  /* Dim unselected when one selected */
  .legend:has(.selected) li:not(.selected) {
    color: gray;
    opacity: 0.5;
  }

  /* Swatch */
  .legend li .swatch {
    background: var(--color);
    display: inline-block;
    width: 1em;
    height: 1em;
    border-radius: 0.2em;
    margin-right: 0.25em;
  }

  /* Count formatting */
  .legend em {
    font-style: normal;
    color: gray;
  }
</style>
