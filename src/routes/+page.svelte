<script>
    import projects from "$lib/projects.json";
    import Project from "$lib/Project.svelte";
    import { onMount } from "svelte";

    // let profileData = fetch("https://api.github.com/users/autumnartist");

    let githubData = null;
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            const response = await fetch("https://api.github.com/users/autumnartist");
            githubData = await response.json();
        } catch (err) {
            error = err;
        }
        loading = false;
    });

</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<body style="max-width:100ch; margin-inline: max(1em, (100% - 100ch) / 2)">
    <h1>Autumn R. Artist</h1>
    <img src="/my-portfolio/images/stitch.jpg" alt="Stitch from Lilo and Stitch" width="500px">
    <p>I am a senior (yay!), majoring in 6-9. I live in New House and have had a great 4 years at MIT. I have 2 pets, a cat named Bruce and a dog named Cocoa. Excited for this class!</p>

    {#if loading}
        <p>Loading...</p>
    {:else if error}
        <p class="error">Something went wrong: {error.message}</p>
    {:else}
        <section>
            <h2>My GitHub Stats</h2>
            <dl class="githubStats">
                <dt>Followers</dt>
                <dd>{githubData.followers}</dd>
                <dt>Following</dt>
                <dd>{githubData.following}</dd>
                <dt>Public Repositories</dt>
                <dd>{githubData.public_repos}</dd>
                <dt>Public Gists:</dt>
                <dd>{githubData.public_gists}</dd>
            </dl>
        </section>
    {/if}
    
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
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 10px;
    }
    .githubStats dt {
    grid-row: 1;
    font-weight: bold;
    
    }
    .githubStats dd {
    grid-row: 2;
    margin: 0;
    }
</style>