<script>
    import { page } from "$app/stores";

    let pages = [
        {url: "./", title: "Home"},
        {url: "./projects", title: "My Projects"},
        {url: "./contact", title: "Contact Me"},
        {url: "./meta", title: "Meta"},
        {url: "https://github.com/autumnartist", title: "GitHub"},
        {url: "./resume", title: "Resume"}
    ];

    let localStorage = globalThis.localStorage ?? {};
    let colorScheme = localStorage.colorScheme ?? "light dark";

    let root = globalThis?.document?.documentElement;
    $: root?.style.setProperty("color-scheme", colorScheme);
    $: localStorage.colorScheme = colorScheme;
</script>

<body>
    <label class="color-scheme">
        Theme:
        <select bind:value={ colorScheme }>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>

      
    <nav class="navBar">
        {#each pages as p}
        <a
            href={p.url}
            class:current={"." + $page.route.id === p.url}
            target={p.url.startsWith("http") ? "_blank" : null}
        >
            {p.title}
        </a>
        {/each}
    </nav>

    
</body>

<style>
.color-scheme{
  position:absolute;
  top: 1rem;
  right: 1rem;
  display: inline-flex;
  gap: 4px;
  font-family: inherit;
  font-size: 80%;
}
.navBar {
  display: flex;
  margin-bottom: 1cm;
  margin-right: 4cm;
  margin-left: 4cm;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: var(--border-color);
  text-align: center;
}
.navBar a {
  text-decoration: none;
  color: inherit;
  flex: 1;
  text-align: center;
  padding: 0.5em;
  transition: color 0.3s;
}

.navBar a:hover {
  border-bottom-width: 0.4em;
  border-bottom-style: solid;
  border-bottom-color: var(--color-accent);
  background-color: color-mix(in oklch, var(--color-accent), canvas 85%);
}

.current{
  font-weight: bold;
  border-bottom-width: 0.4em;
  border-bottom-style: solid;
  border-bottom-color: var(--border-color);;
}
</style>
<slot />
