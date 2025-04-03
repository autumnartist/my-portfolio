<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import {
    computePosition,
    autoPlacement,
    offset,
  } from '@floating-ui/dom';
  import Bar from '$lib/Bar.svelte';
  import { base } from '$app/paths';


  //showing meta data
  let data = [];
  let commits = [];
  let avgFileLength = 0;
  let numFiles = 0;
  let longestLine = 0;
  let mostActiveTime = "Unknown";

  onMount(async () => {
    data = await d3.csv(`${base}/loc.csv`, row => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + "T00:00" + row.timezone),
      datetime: new Date(row.datetime)
    }));

    // Group by file and calculate average file length
    let files = d3.groups(data, d => d.file); // Assuming each row has a 'file' field
    avgFileLength = d3.mean(files, ([, lines]) => lines.length);
    numFiles = files.length; // Number of unique files
    longestLine = d3.max(data, d => d.length);
    let timePeriods = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    data.forEach(d => {
    let hour = d.datetime.getHours();
      if (hour >= 6 && hour < 12) {
        timePeriods.Morning++;
      } else if (hour >= 12 && hour < 18) {
        timePeriods.Afternoon++;
      } else if (hour >= 18 && hour < 24) {
        timePeriods.Evening++;
      } else {
        timePeriods.Night++;
      }
    });

    // Find the most frequent period
    mostActiveTime = Object.entries(timePeriods).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    
    commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {
      let first = lines[0];
      let {author, date, time, timezone, datetime} = first;
      let ret = {
        id: commit,
        url: "https://github.com/vis-society/lab-7/commit/" + commit,
        author, date, time, timezone, datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length
      };

      // Like ret.lines = lines
      // but non-enumerable so it doesn’t show up in JSON.stringify
      Object.defineProperty(ret, "lines", {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false,
      });

      return ret;
    });
    commits = commits.filter(commit => !/^0+$/.test(commit.id));
    commits = d3.sort(commits, d => -d.totalLines);
  });

  //Visualization
  let width = 1000, height = 600;
  let margin = {top: 10, right: 10, bottom: 30, left: 20};
  let usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left
  };
  usableArea.width = usableArea.right - usableArea.left;
  usableArea.height = usableArea.bottom - usableArea.top;
  let xAxis, yAxis, yAxisGridlines;
  $: {
    d3.select(xAxis).call(d3.axisBottom(xScale));
    d3.select(yAxis).call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, "0") + ":00"));
    d3.select(yAxisGridlines).call(
      d3.axisLeft(yScale)
        .tickFormat("")
        .tickSize(-usableArea.width)
    );
  }

  $: xScale = d3.scaleTime()
              .domain(d3.extent(commits.map(d => d.date)))
              .range([0, width])
              .nice();

  $: yScale = d3.scaleLinear()
              .domain([24, 0])
              .range([height, 0]);

  let hoveredIndex = -1;
  $: hoveredCommit = commits[hoveredIndex] ?? hoveredCommit ?? {};

  //tool tip
  let cursor = {x: 0, y: 0};
  let commitTooltip;
  let tooltipPosition = {x: 0, y: 0};
  let clickedCommits = [];
  async function dotInteraction (index, evt) {
    let hoveredDot = evt.target;
    if (evt.type === "mouseenter") {
      hoveredIndex = index;
      cursor = {x: evt.x, y: evt.y};
      tooltipPosition = await computePosition(hoveredDot, commitTooltip, {
        strategy: "fixed", // because we use position: fixed
        middleware: [
          offset(5), // spacing from tooltip to dot
          autoPlacement() // see https://floating-ui.com/docs/autoplacement
        ],
      });        }
    else if (evt.type === "mouseleave") {
      hoveredIndex = -1
    }
    //clickable commits
    else if (evt.type === "click") {
      let commit = commits[index]
      if (!clickedCommits.includes(commit)) {
        // Add the commit to the clickedCommits array
        clickedCommits = [...clickedCommits, commit];
      }
      else {
          // Remove the commit from the array
          clickedCommits = clickedCommits.filter(c => c !== commit);
      }
      console.log(clickedCommits);
    }
  }

  // Scaling the dots
  // Calculate the min and max values for the total lines of code edited
  // $: rScale = d3.scaleLinear()
  $: rScale = d3.scaleSqrt() //switiching to square root scale
    .domain(d3.extent(commits, d => d.totalLines))  // Get the extent (min, max) of the total lines edited
    .range([2, 30]);  // Map to radius between 2 and 30

  //Bar chart
  $: allTypes = Array.from(new Set(data.map(d => d.type)));
  $: selectedLines = (clickedCommits.length > 0 ? clickedCommits : commits).flatMap(d => d.lines);
  $: selectedCounts = d3.rollup(
      selectedLines,
      v => v.length,
      d => d.type
  );
  $: languageBreakdown = allTypes.map(type => [type, selectedCounts.get(type) || 0]);

  // Brushing
  let svg;
  $: {
    // d3.select(svg).call(d3.brush());
    d3.select(svg).call(d3.brush().on("start brush end", brushed));
    d3.select(svg).selectAll(".dots, .overlay ~ *").raise();
  }
  $: brushSelection = null;
  function brushed (evt) {
    brushSelection = evt.selection;
  }
  function isCommitBrushed (commit) {
    if (!brushSelection) {
      return false;
    }
    let min = {x: brushSelection[0][0], y: brushSelection[0][1]};
    let max = {x: brushSelection[1][0], y: brushSelection[1][1]};
    let x = xScale(commit.date);
    let y = yScale(commit.hourFrac);
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
  }
  $: brushedCommits = brushSelection ? commits.filter(isCommitBrushed) : [];
  $: selectedCommits = Array.from(new Set([...clickedCommits, ...brushedCommits]));
  $: selectedLines = (selectedCommits.length > 0 ? selectedCommits : commits).flatMap(d => d.lines);
  $: hasSelection = selectedCommits && selectedCommits.length > 0;

</script>

<svelte:head>
  <title>Meta</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
    <h1>Meta</h1>
    <p>This page includes states abouyt the code of this website.</p>

    <dl class="stats">
      <dt>Total <abbr title="Lines of code">LOC</abbr></dt>
      <dd>{data.length}</dd>
      <dt>Commits</dt>
      <dd>{commits.length}</dd>
      <dt>Average File Length</dt>
      <dd>{avgFileLength.toFixed(2)}</dd>
      <dt>Files</dt>
      <dd>{numFiles}</dd>
      <dt>Longest Line</dt>
      <dd>{longestLine}</dd>
      <dt>Most Active Time of Day</dt>
      <dd>{mostActiveTime}</dd>
    </dl>

    <svg bind:this={svg} viewBox="0 0 {width} {height}">
      <!-- scatterplot will go here -->
      <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
      <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />   
      <g class="gridlines" transform="translate({usableArea.left}, 0)" bind:this={yAxisGridlines} />   
      <g class="dots">
        {#each commits as commit, index }
          <!-- <circle
            on:mouseenter={evt => {
              hoveredIndex = index;
              cursor = {x: evt.x, y: evt.y};
            }}
            on:mouseleave={evt => hoveredIndex = -1}
            cx={ xScale(commit.datetime) }
            cy={ yScale(commit.hourFrac) }
            r="5"
            fill="steelblue"
          /> -->
          <circle
            class:selected={ selectedCommits.includes(commit) }
            on:click={ evt => dotInteraction(index, evt) }
            on:mouseenter={evt => dotInteraction(index, evt)}
            on:mouseleave={evt => dotInteraction(index, evt)}
            cx={ xScale(commit.datetime) }
            cy={ yScale(commit.hourFrac) }
            r={ rScale(commit.totalLines) }
            fill="steelblue"
            fill-opacity={hoveredIndex === index ? 1 : 0.6}
          />
        {/each}
      </g> 
    </svg>

    <Bar data={languageBreakdown} width={width*0.75} />
    <p>{hasSelection ? selectedCommits.length : "No"} commits selected</p>
    
    <dl class="info tooltip" hidden={hoveredIndex === -1} bind:this={commitTooltip} style="top: {tooltipPosition.y}px; left: {tooltipPosition.x}px">
      <dt>Commit</dt>
      <dd><a href="{ hoveredCommit.url }" target="_blank">{ hoveredCommit.id }</a></dd>
    
      <dt>Date</dt>
      <dd>{ hoveredCommit.datetime?.toLocaleString("en", {dateStyle: "full"}) }</dd>

      <dt>Time</dt>
      <dd>{ hoveredCommit.datetime?.toLocaleTimeString("en", { timeStyle: "short" }) }</dd>
      
      <dt>Author</dt>
      <dd>{ hoveredCommit.author }</dd>
      
      <dt>Lines Edited</dt>
      <dd>{ hoveredCommit.totalLines }</dd>
      
    </dl>

</body>

<style>
  .stats {
    border: 1px solid oklch(50% 10% 200 / 40%);
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    padding: 10px;
    font-family: Tahoma, sans-serif;
  }
  .stats dt {
    grid-row: 1;
    font-weight: bold;
    font-size: x-small;
  }
  .stats dd {
    grid-row: 2;
    margin: 0;
  }
  svg {
		overflow: visible;
	}
  .gridlines {
	  stroke-opacity: .2;
  }
  circle {
    transition: 200ms;
    transform-origin: center;
    transform-box: fill-box;

    &:hover {
      transform: scale(1.5);
    }
  }
  .tooltip{
    position: fixed;
    top: 1em;
    left: 1em;
    background-color: oklch(100% 0% 0 / 80%);
    border-radius: 10%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    padding: 15px;
  }
  dl.info{
    display:grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    transition-duration: 500ms;
    transition-property: opacity, visibility;

    &[hidden]:not(:hover, :focus-within) {
      opacity: 0;
      visibility: hidden;
    }
  }
  dl.info dt{
    font-weight: bold;
    opacity: 0.5;
  }
  dl.info dd{
    margin:0;
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