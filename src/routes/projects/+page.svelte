<script>
  import projects from "$lib/projects.json";
  import Project from "$lib/Project.svelte";
  import Pie from "$lib/Pie.svelte";
  import * as d3 from "d3";

  let selectedYearIndex = -1;
  let selectedYear;
  $: selectedYear =
    selectedYearIndex > -1 ? pieData[selectedYearIndex].label : null;

  // Make sure the variable definition is *outside* the block
  let pieData;
  $: {
    // Initialize to an empty object every time this runs
    pieData = {};

    // Calculate rolledData and pieData based on filteredProjects here
    let rolledData = d3.rollups(
      filteredProjects,
      (v) => v.length,
      (d) => d.year
    );

    // We don't need 'let' anymore since we already defined pieData
    pieData = rolledData.map(([year, count]) => {
      return { value: count, label: year };
    });
  }

  let query = "";
  $: filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query.toLowerCase());
  });
  $: filteredByYear = filteredProjects.filter((project) => {
    if (selectedYear) {
      return project.year === selectedYear;
    }

    return true;
  });
</script>

<svelte:head>
  <title>My Projects</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
  <h1>{projects.length} Projects</h1>
  <Pie data={pieData} bind:selectedIndex={selectedYearIndex} />
  <div class="search-wrapper">
    <span aria-hidden="true" class="emoji">🔍</span>
    <input
      type="search"
      bind:value={query}
      aria-label="Search projects"
      placeholder="Search projects…"
      style="width:100%"
    />
  </div>
  <div class="projects">
    {#each filteredByYear as p}
      <Project data={p} />
    {/each}
  </div>
</body>

<style>
  .search-wrapper {
    position: relative;
  }
  .emoji {
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 1rem;
  }
  input[type="search"] {
    padding-left: 2rem; /* gives space for the emoji */
    width: 100%;
  }
</style>
