<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ name: string; budget: number; archived?: boolean }>();
const label = computed(() => (props.archived ? "Archived" : "Active"));
</script>

<template>
  <article class="card" :class="{ 'is-muted': archived }" @click="$emit('select', name)">
    <h3>{{ name }}</h3>
    <p v-if="budget > 0">{{ budget.toLocaleString() }} EUR</p>
    <StatusBadge :label="label" />
  </article>
</template>

<style scoped>
.card {
  padding: 1rem;
}
</style>
