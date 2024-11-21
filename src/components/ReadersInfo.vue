<template>
  <v-card variant="text">
    <v-card-item v-for="reader in connected">
      <template v-if="reader.active">
        <v-card-title>
          {{ reader.name }}
        </v-card-title>

        <v-card-subtitle v-if="reader.desc">{{ reader.desc }}</v-card-subtitle>

        <div class="ants">
          <template v-for="(ant, i) in reader.ants">
            <div class="ant" :class="{ active: ant }">
              <v-tooltip activator="parent" location="bottom"
                >{{ reader.power[i] }} dBm</v-tooltip
              >
            </div>
          </template>
        </div>
      </template>
    </v-card-item>
  </v-card>
</template>

<script>
export default {
  name: "ReadersInfoComponent",
  data() {
    return {};
  },
  computed: {
    connected() {
      return this.$store.state.connected;
    },
  },
};
</script>

<style lang="scss">
.main-card {
  padding: 10px !important;
}

.ants {
  .ant {
    width: 20px;
    height: 20px;
    border-radius: 20px;
    border: 3px solid rgba(black, 0.14);
    margin-right: 6px;

    &.active {
      border-color: #4caf4f;
      background: rgba(#4caf4f, 0.15);
    }
  }
}
</style>
