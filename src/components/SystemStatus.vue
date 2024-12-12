<template>
  <v-stepper class="mb-5" value="4" non-linear outlined>
    <v-stepper-header>
      <template v-for="(item, k) in status" :key="k">
        <v-stepper-item v-if="item" value="1" complete color="success">{{
          _statusNames(k)
        }}</v-stepper-item>
        <v-stepper-item v-else value="1" :rules="[() => false]">{{
          _statusNames(k)
        }}</v-stepper-item>
        <v-divider></v-divider>
      </template>
    </v-stepper-header>
  </v-stepper>
</template>

<script>
export default {
  computed: {
    status() {
      return this.$store.state.status;
    },
  },
  methods: {
    _statusNames(name) {
      switch (name) {
        case "wp":
          return "WordPress Zerbitzaria";
        case "socket":
          return "WebSocket Zerbitzaria";
        case "mongo":
          return "Mongo Datu-Basea";
        case "drive":
          return "Google Drive API";
      }
    },
  },
};
</script>

<style lang="scss">
.v-stepper.v-sheet {
  box-shadow: none !important;
}
</style>
