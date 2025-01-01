<template>
  <v-row>
    <v-progress-linear
      :color="color"
      indeterminate
      class="my-3"
    ></v-progress-linear
  ></v-row>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
      required: false,
      default: "primary", // Default to black if no color is passed
    },
  },
};
</script>
