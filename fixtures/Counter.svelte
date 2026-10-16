<script lang="ts">
  let { start = 0 }: { start?: number } = $props();
  let count = $state(start);
  const doubled = $derived(count * 2);
</script>

<button class="counter" onclick={() => (count += 1)}>
  {#if count > 0}
    Clicked {count} times ({doubled} doubled)
  {:else}
    Click me
  {/if}
</button>

<style>
  .counter {
    border-radius: 0.5rem;
  }
</style>
