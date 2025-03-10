<script>
    import projects from "$lib/projects.json";
    import Project from "$lib/Project.svelte";

    let profileData = fetch("https://api.github.com/users/autumnartist");
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
    <h1>Autumn R. Artist</h1>
    <img src="/my-portfolio/images/stitch.jpg" alt="Stitch from Lilo and Stitch" width="500px">
    <p>I am a senior (yay!), majoring in 6-9. I live in New House and have had a great 4 years at MIT. I have 2 pets, a cat named Bruce and a dog named Cocoa. Excited for this class!</p>

    {#await fetch("https://api.github.com/users/autumnartist")}
    <p>Loading...</p>
    {:then response}
    {#await response.json()}
        <p>Decoding...</p>
    {:then data}
        <section>
        <h2>My GitHub Stats</h2>
        <dl class="githubStats">
            <dt>Followers:</dt>
            <dd>{data.followers}</dd>
            <dt>Following:</dt>
            <dd>{data.following}</dd>
            <dt>Public Repositories:</dt>
            <dd>{data.public_repos}</dd>
            <dt>Public Gists:</dt>
            <dd>{data.public_gists}</dd>
            
        </dl>
        </section>
    {:catch error}
        <p class="error">Something went wrong: {error.message}</p>
    {/await}
    {:catch error}
    <p class="error">Something went wrong: {error.message}</p>
    {/await}

    <h2>Latest Projects</h2>
    <div class="projectsHighlights">
        {#each projects.slice(0, 3) as p}
        <Project data={p} hLevel="3" />
        {/each}
    </div>

</body>

<style>
    .githubStats {
    border: 1px solid oklch(50% 10% 200 / 40%);
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 4 equal columns */
    gap: 10px; /* Optional: space between grid items */
    padding: 10px;
    }
    .githubStats dt {
    grid-row: 1; /* All <dt> elements go to the first row */
    font-weight: bold;
    
    }
    .githubStats dd {
    grid-row: 2; /* All <dd> elements go to the second row */
    margin: 0; /* Optional: remove any default margin on <dd> */
    }
</style>