<script>
  import { storeUserHIQ, activeProgress } from "src/utils/store.js";
  let active = false;
  export let temp = "dots5";
  activeProgress.subscribe(val => active = val);
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

  {#if temp === 'type'}
    <div class="word">HAPPY&nbsp;NEW&nbsp;YEAR...</div>
    <div class="overlay"/>
  {/if}

  {#if temp === 'circle_square'}
    <div style="z-index:99;position:fixed;" id="circle_square">
      <span />
      <span />
      <span />
      <span />
    </div>
  {/if}
{/if}
