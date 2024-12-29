<template>
  <div class="hello">
    <v-row align="center" no-gutters v-if="!minimal">
      <v-col cols="6"><h2 class="main-title">Sistemaren egoera</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-icon color="primary" icon="mdi-cogs" size="55"></v-icon>
      </v-col>
    </v-row>

    <v-row class="mb-5">
      <v-col lg="4" md="12" sm="12">
        <v-card variant="outlined">
          <v-list nav>
            <v-list-item> <h3 class="main-title-2">Cloud</h3> </v-list-item>
            <v-list-item v-for="(item, k) in status" :key="k">
              <template v-slot:prepend>
                <v-icon
                  v-if="!item"
                  icon="mdi-close-circle"
                  color="error"
                ></v-icon>

                <v-icon
                  v-else
                  icon="mdi-check-circle"
                  color="success"
                  style="opacity: 1"
                ></v-icon>
              </template>

              <v-list-item-title>{{ _statusNames(k) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col lg="4" md="12" sm="12" v-for="(reader, r) in connected" :key="r">
        <!-- <template v-if="reader.active"> -->

        <v-card variant="outlined" v-if="reader.active">
          <v-list nav density="compact">
            <v-list-item>
              <h3 class="main-title-2">{{ reader.name }}</h3>
              <p>{{ reader.desc }}</p>
            </v-list-item>
            <v-list-item v-for="(ant, i) in reader.ants" :key="i">
              <template v-slot:prepend>
                <v-icon v-if="!ant" icon="mdi-close-circle" color="grey">
                </v-icon>

                <v-icon
                  v-else
                  icon="mdi-check-circle"
                  color="success"
                  style="opacity: 1"
                ></v-icon>
              </template>

              <v-list-item-title
                >Antena {{ i + 1 }} ({{
                  reader.power[i]
                }}
                dBm)</v-list-item-title
              >
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: "SystemStatusComponent",
  computed: {
    status() {
      return this.$store.state.status;
    },
    connected() {
      return this.$store.state.connected;
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
