<template>
  <div>
    <v-row align="center" no-gutters v-if="!minimal">
      <v-col cols="6"><h2 class="main-title">Irakurketa tasa</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-icon color="primary" icon="mdi-percent-circle" size="55"></v-icon>
      </v-col>
    </v-row>

    <template v-if="eventsSplitsHosts">
      <div v-for="(event, i) in eventsSplitsHosts" :key="i">
        <v-card variant="text">
          <!-- <v-card-item :title="event.name"> </v-card-item> -->

          <v-card-item :title="event.name"> </v-card-item>

          <template v-if="!_checkSplitsActive(event.splits)">
            <v-alert
              text="Ez duzu split bat bera ere ez ekintza honi lotuta. Joan Lasterketaren konfiguraziora hau aldatzeko."
              color="red"
              variant="tonal"
              class="my-1 mx-3"
              icon="mdi-alert-circle-outline"
            ></v-alert>
          </template>
          <div v-for="(s, index) in event.splits" :key="index">
            <v-card-item v-if="s.active">
              <div class="percent-name">
                {{ s.name }}

                <span class="percent-number">{{ s.percent }}%</span>

                <div class="readed">
                  <span class="readed__totals">Guztira: {{ s.total }}</span>
                  <span>Irakurrita: {{ s.readed }}</span>
                </div>
              </div>

              <v-progress-linear
                color="primary"
                height="12"
                v-model="s.percent"
                striped
              ></v-progress-linear>
            </v-card-item>
          </div>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: "PercentsComponent",
  data() {
    return {};
  },
  props: {
    minimal: {
      type: Boolean,
    },
  },
  mounted() {
    window.ipc.send("toMain", ["get-read-percents"]);

    // grafikoak vuen erakusteko beharrezkoa da
    let eventsQty = [];

    this.startList.forEach((res) => {
      if (!res.event) return;

      if (!eventsQty.length) {
        eventsQty.push({
          name: res.event.name,
          id: res.event.unique_id,
          count: 1,
        });
      } else {
        let exist = "no";
        eventsQty.forEach((p, i) => {
          if (p.id == res.event.unique_id) exist = i;
        });

        if (exist == "no") {
          eventsQty.push({
            name: res.event.name,
            id: res.event.unique_id,
            count: 1,
          });
        } else {
          eventsQty[exist].count = parseInt(eventsQty[exist].count) + 1;
        }
      }
    });
    // grafikoak vuen erakusteko beharrezkoa da
    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          // percents
          if (data[0] == "percents") {
            let percents = data[1];
            let current = that.eventsSplitsHosts;
            console.log(77, percents)
            if (percents.length) {
              current.map((res) => {
                res.splits.map((s) => {
                  percents.forEach((d) => {
                    eventsQty.forEach((qt) => {
                      if (qt.name == res.name) {
                        if (d.group == s.unique_id) {
                          let readed = parseInt(d.count);
                          let total = qt.count;
                          s.readed = readed;
                          s.total = total;
                          s.percent = ((readed * 100) / total).toFixed(1);
                        }
                      }
                    });
                  });
                });
              });
            } else {
              current.map((res) => {
                res.splits.map((s) => {
                  s.percent = 0;
                  s.readed = 0;
                  s.total = 0;
                });
              });
            }

            that.$store.commit("_SET_EVENTS_SPLITS_HOSTS", current);
          }
        }
    );
  },
  computed: {
    eventsSplitsHosts() {
      return this.$store.state.eventsSplitsHosts;
    },
    startList() {
      return this.$store.state.startList;
    },
  },
  methods: {
    _checkSplitsActive(splits) {
      let active = false;
      splits.forEach((s) => {
        if (s.active) active = true;
      });

      return active;
    },
  },
};
</script>

<style lang="scss">
.main-card {
  padding: 10px !important;
}

.readed {
  font-size: 14px;
  &__totals {
    font-weight: bold;
    margin-right: 10px;
  }
}
</style>
