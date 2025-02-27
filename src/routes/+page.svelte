<script>
    import projects from "$lib/projects.json";
    import Project from "$lib/Project.svelte";
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
    <h1>Autumn R. Artist</h1>
    <img src="/my-portfolio/images/stitch.jpg" alt="Stitch from Lilo and Stitch" width="500px">
    <p>I am a senior (yay!), majoring in 6-9. I live in New House and have had a great 4 years at MIT. I have 2 pets, a cat named Bruce and a dog named Cocoa. Excited for this class!</p>
    <h2>Latest Projects</h2>
    <div class="projectsHighlights">
        {#each projects.slice(0, 3) as p}
        <Project data={p} hLevel="3" />
        {/each}
    </div>

</body>