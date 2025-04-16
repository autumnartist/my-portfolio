<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { computePosition, autoPlacement, offset } from "@floating-ui/dom";
  import Bar from "$lib/Bar.svelte";
  import StackedBar from "$lib/StackedBar.svelte";
  import { base } from "$app/paths";
  import CommitScatterplot from "./Scatterplot.svelte";
  import FileLines from "$lib/FileLines.svelte";
  import Scrolly from "svelte-scrolly";

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
  //showing meta data
  let data = [];
  let commits = [];
  let selectedCommits = [];
  let avgFileLength = 0;
  let numFiles = 0;
  let longestLine = 0;
  let mostActiveTime = "Unknown";

  // Filtering UI
  let commitProgress = 100;
  let raceProgress = 100;
  $: timeScale = d3
    .scaleTime()
    .domain(d3.extent(commits.map((d) => d.datetime))) // or d.date if that's what you’re using
    .range([0, 100]);
  $: commitMaxTime = timeScale.invert(commitProgress);
  $: raceMaxTime = timeScale.invert(raceProgress);
  $: filteredCommits = commits.filter(
    (commit) => commit.datetime <= commitMaxTime
  );
  $: filteredLines = data.filter((data) => data.datetime <= commitMaxTime);
  $: raceLines = data.filter((d) => d.datetime <= raceMaxTime);

  onMount(async () => {
    data = await d3.csv(`${base}/loc.csv`, (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + "T00:00" + row.timezone),
      datetime: new Date(row.datetime),
    }));

    // Group by file and calculate average file length
    let files = d3.groups(data, (d) => d.file); // Assuming each row has a 'file' field
    avgFileLength = d3.mean(files, ([, lines]) => lines.length);
    numFiles = files.length; // Number of unique files
    longestLine = d3.max(data, (d) => d.length);
    let timePeriods = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    data.forEach((d) => {
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
    mostActiveTime = Object.entries(timePeriods).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: "https://github.com/vis-society/lab-7/commit/" + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
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
    commits = commits.filter((commit) => !/^0+$/.test(commit.id));
    commits = d3.sort(commits, (d) => -d.totalLines);
    console.log(
      "Commit IDs:",
      commits.map((d) => d.id)
    );
    console.log(commits[0]?.url);
  });

  //Visualization
  let width = 1000,
    height = 600;

  //Bar chart
  $: allTypes = Array.from(new Set(data.map((d) => d.type)));
  $: selectedLines = (
    filteredCommits.length > 0 ? filteredCommits : commits
  ).flatMap((d) => d.lines);
  $: selectedCounts = d3.rollup(
    selectedLines,
    (v) => v.length,
    (d) => d.type
  );
  $: languageBreakdown = allTypes.map((type) => [
    type,
    selectedCounts.get(type) || 0,
  ]);

  // Brushing
  $: selectedLines = (
    selectedCommits.length > 0 ? selectedCommits : commits
  ).flatMap((d) => d.lines);
  $: hasSelection = selectedCommits && selectedCommits.length > 0;
</script>

<svelte:head>
  <title>Meta</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
  <h1>Meta</h1>

  <!-- Stats -->
  <dl class="stats">
    <dt>Total <abbr title="Lines of code">LOC</abbr></dt>
    <dd>{filteredLines.length}</dd>
    <dt>Commits</dt>
    <dd>{filteredCommits.length}</dd>
    <dt>Average File Length</dt>
    <dd>{avgFileLength.toFixed(2)}</dd>
    <dt>Files</dt>
    <dd>{numFiles}</dd>
    <dt>Longest Line</dt>
    <dd>{longestLine}</dd>
    <dt>Most Active Time of Day</dt>
    <dd>{mostActiveTime}</dd>
  </dl>

  <h2>Commits by Time of Day:</h2>
  <Scrolly bind:progress={commitProgress}>
    {#each commits as commit, index}
      <p>
        On {commit.datetime.toLocaleString("en", {
          dateStyle: "full",
          timeStyle: "short",
        })},
        {index === 0
          ? "I made the initial commit, marking the beginning of this development project. "
          : "I pushed a subsequent commit, continuing the iterative progress of the project. "}
        This particular update involved changes to {commit.totalLines} lines across
        {d3.rollups(
          commit.lines,
          (D) => D.length,
          (d) => d.file
        ).length} files. Details of this commit can be viewed
        <a
          href={`https://github.com/autumnartist/my-portfolio/commit/${commit.id}`}
          target="_blank">here</a
        >.
      </p>
    {/each}
    <svelte:fragment slot="viz">
      <CommitScatterplot commits={filteredCommits} bind:selectedCommits />

      <StackedBar data={languageBreakdown} width={width * 0.6} {colorScale} />
    </svelte:fragment>
  </Scrolly>

  <h2>File info:</h2>
  <Scrolly bind:progress={raceProgress} --scrolly-layout="viz-first">
    <!-- STORY COLUMN -->
    {#each commits as commit, index}
      <p>
        On {commit.datetime.toLocaleString("en", {
          dateStyle: "full",
          timeStyle: "short",
        })},
        {index === 0
          ? "I made the initial commit, marking the beginning of this development project. "
          : "I pushed a subsequent commit, continuing the iterative progress of the project. "}
        This particular update involved changes to {commit.totalLines} lines across
        {d3.rollups(
          commit.lines,
          (D) => D.length,
          (d) => d.file
        ).length} files. Details of this commit can be viewed
        <a
          href={`https://github.com/autumnartist/my-portfolio/commit/${commit.id}`}
          target="_blank">here</a
        >.
      </p>
    {/each}

    <!-- VIZ COLUMN -->
    <svelte:fragment slot="viz">
      <FileLines lines={raceLines} svgWidth={0.7 * width} {colorScale} />
    </svelte:fragment>
  </Scrolly>
</body>

<style>
  :global(body) {
    max-width: min(120ch, 80vw);
  }
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
</style>
