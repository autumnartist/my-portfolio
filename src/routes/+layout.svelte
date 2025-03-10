<script>
    import { page } from "$app/stores";

    let pages = [
        {url: "./", title: "Home"},
        {url: "/projects", title: "My Projects"},
        {url: "/contact", title: "Contact Me"},
        {url: "https://github.com/autumnartist", title: "GitHub"},
        {url: "/resume", title: "Resume"}
    ];
    let colorScheme = "light dark";

    // let pages = [
    //     { url: "/my-portfolio/",         title: "Home" },
    //     { url: "/my-portfolio/projects", title: "My Projects" },
    //     { url: "/my-portfolio/contact",  title: "Contact Me" },
    //     { url: "https://github.com/autumnartist", title: "GitHub" },
    //     { url: "/my-portfolio/resume",   title: "Resume" }
    //   ];
</script>

<body>
    {
        JSON.stringify($page)
    }

    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
      
    <nav class="navBar">
        {#each pages as p}
        <a
            href={p.url}
            class:current={$page.route.id === p.url}
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
  /* padding: 0.5em; */
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
