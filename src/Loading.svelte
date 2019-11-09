<script>
  import { storeUserHIQ, activeProgress } from "./utils/store.js";
  let active = false;
  export let temp = "circle1";
  activeProgress.subscribe(val => (active = val));
  // #Ref Loading https://codepen.io/mrsahar/pen/pMxyrE
</script>

<style>

</style>

{#if active}
  {#if temp === 'circle1'}
    <div style="z-index:99;position:fixed;" id="circle1" />
  {/if}

  {#if temp === 'dots5'}
    <div style="z-index:99;position:fixed;" id="dots5">
      <span />
      <span />
      <span />
      <span />
    </div>
  {/if}
{/if}
