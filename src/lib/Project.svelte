<script>
    export let data = {};
    export let hLevel = 2;
  </script>
  
<article class="indiProject">
    <svelte:element this={"h" + hLevel}>{data.title}</svelte:element>
    <img src={data.image} alt="">
    <p>{data.description}</p>
</article>

<style>
.indiProject{
  margin: 0.5em;
  display:grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
  line-height: 1.1;
  text-wrap:balance;
}
</style>