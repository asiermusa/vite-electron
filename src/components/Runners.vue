<template>
  <div class="hello">
    <v-row>
      <v-col>
        <v-row align="center" no-gutters>
          <v-col cols="6"><h2 class="main-title">Parte-hartzaileak</h2> </v-col>

          <v-col class="text-right" cols="6">
            <v-icon color="primary" icon="mdi-account-group" size="55"></v-icon>
          </v-col>
        </v-row>

        <v-alert
          text="Datu hauek Google Driveko excel fitxategi batetik ekarri dira eta ezin dira hemen zuzenean editatu."
          type="info"
          icon="mdi-microsoft-excel"
          variant="tonal"
        ></v-alert>

        <v-row class="my-1">
          <v-col cols="4">
            <v-text-field
              placeholder="Dortsala"
              variant="outlined"
              v-model="search"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>

          <v-col cols="4">
            <v-text-field
              placeholder="Izen-abizenak"
              variant="outlined"
              v-model="searchName"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>

          <v-col cols="4">
            <v-text-field
              placeholder="Herria"
              variant="outlined"
              v-model="searchCity"
              class="my-3"
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-table class="rankig" density="compact">
          <tbody>
            <tr>
              <th class="text-left" style="width: 50px">TAG</th>
              <th class="text-left" style="width: 50px">Dorsala</th>
              <th class="text-left">Izena</th>
              <th class="text-left">Herria</th>
              <th class="text-left">Ekintza</th>
            </tr>
            <tr v-for="(item, i) in sortItems" :key="i">
              <td>{{ item[0] }}</td>
              <td @click="_select(i)">{{ item[1] }}</td>
              <td>{{ item[2] }}</td>
              <td>{{ item[3] }}</td>
              <td>{{ _filterColumn(item[4], i) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>

      <v-col cols="4" v-if="selected">
        <v-card class="mx-auto" max-width="100%" hover>
          <v-card-item>
            <v-card-title>{{ selected[1] }} </v-card-title>

            <v-card-subtitle> Card subtitle secondary text </v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <v-text-field
              label="Label"
              variant="underlined"
              v-model="selected[0]"
            ></v-text-field>

            <v-btn @click="_save_tag()" color="primary">Guardar datos</v-btn>

            <v-text-field
              label="Write data"
              variant="underlined"
              v-model="writeData"
            ></v-text-field>

            <v-btn @click="_write_tag()" color="primary">Write data</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-btn
      @click="_get_data()"
      variant="flat"
      class="my-4"
      color="primary"
      prepend-icon="mdi-download"
      >Zerrenda eguneratu
    </v-btn>
  </div>
</template>

<script>
export default {
  name: "RunnersComponent",
  data() {
    return {
      search: null,
      searchCity: null,
      searchName: null,
      header: null,
      selected: null,
      writeData: "",
      tag: null,
    };
  },
  mounted() {
    let items = this.$store.state.startList;

    this.header = items[0];

    //konexioak jaso preloadetik
    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "serial-usb") {
            that.selected[0] = data[1];
          }
        }
    );
  },
  computed: {
    sortItems() {
      let items = this.$store.state.startList;

      if (!items.length) return;
      // if (!this.search) return items;
      // if (!this.searchHerria) return items;

      let response = items;

      // Apply search filter if "search" is defined
      if (this.search) {
        response = response.filter((item) => {
          return item[1].toLowerCase().includes(this.search.toLowerCase());
        });
      }

      // Apply searchHerria filter if "searchHerria" is defined
      if (this.searchName) {
        response = response.filter((item) => {
          return item[2].toLowerCase().includes(this.searchName.toLowerCase());
        });
      }

      // Apply searchHerria filter if "searchHerria" is defined
      if (this.searchCity) {
        response = response.filter((item) => {
          return item[3].toLowerCase().includes(this.searchCity.toLowerCase());
        });
      }

      return response;
    },
    serial() {
      return this.$store.state.serial;
    },
  },
  methods: {
    _select(val) {
      this.selected = this.$store.state.startList[val];
    },
    _filterColumn(col, i) {
      return col.name;
    },
    async _get_data() {
      // hasierako atleta guztien excela montatu
      this.$store.dispatch("_get_participants");
    },
    _save_tag() {
      window.ipc.send("toMain", ["serial-usb", this.serial]);

      // axios
      //   .post("https://denborak.biklik.eus/wp-json/v1/save", {
      //     items: this.$store.state.startList,
      //   })
      //   .then((response) => {
      //     console.log(response.data.data);
      //   });
    },
    _write_tag() {
      window.ipc.send("toMain", ["write-serial", this.serial, this.writeData]);

      // axios
      //   .post("https://denborak.biklik.eus/wp-json/v1/save", {
      //     items: this.$store.state.startList,
      //   })
      //   .then((response) => {
      //     console.log(response.data.data);
      //   });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
