<script>
    import projects from "$lib/projects.json";
    import Project from "$lib/Project.svelte";
  </script>

<svelte:head>
  <title>My Projects</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
    <h1>{ projects.length } Projects</h1>
    <div class="projects">
        {#each projects as p}
            <!-- <article class="indiProject">
                <h2>{p.title}</h2>
                <img src={p.image} alt="">
                <p>{p.description}</p>
            </article> -->
            <Project data={p} />
        {/each}
    </div>
    
</body>