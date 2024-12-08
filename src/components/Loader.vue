<template>
  <v-row>
    <v-col>
      <v-progress-linear
        :color="color"
        indeterminate
      ></v-progress-linear> </v-col
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
