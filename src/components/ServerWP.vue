<template>
  <div class="server">
    <v-row align="center" no-gutters v-if="!minimal">
      <v-col cols="6"><h2 class="main-title">WordPress Zerbitzaria</h2> </v-col>

      <v-col class="text-right" cols="6">
        <v-btn
          @click="_logout()"
          prepend-icon="mdi-logout"
          variant="tonal"
          class="mx-3"
          size="small"
          >Saioa itxi</v-btn
        >
        <v-icon color="primary" icon="mdi-server-network" size="55"></v-icon>
      </v-col>
    </v-row>

    <div v-if="item" class="events">
      <v-btn
        @click="item = null"
        prepend-icon="mdi-arrow-left"
        variant="tonal"
        class="my-3"
        size="small"
        >Atzera joan</v-btn
      >

      <v-row>
        <v-col cols="12">
          <h2>{{ item.name }}</h2>
        </v-col>
      </v-row>

      <!-- Repeatable Forms -->
      <v-row
        v-for="(event, index) in item.events"
        :key="index"
        class="my-4 events__row"
      >
        <v-col cols="4">
          <v-text-field
            v-model="event.name"
            label="Deskribapena"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="2">
          <v-text-field
            label="Distantzia"
            v-model="event.distance"
            variant="outlined"
          ></v-text-field>
        </v-col>

        <v-col cols="4">
          <v-text-field
            label="Hasiera data"
            v-model="event.start_date"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="2">
          <v-btn
            color="error"
            @click="_removeEvent(index)"
            variant="tonal"
            density="comfortable"
            size="x-large"
            icon="mdi-delete"
          >
          </v-btn>
        </v-col>

        <v-col cols="12" class="splits">
          <v-row
            v-for="(split, s) in event.splits"
            :key="s"
            class="splits__row"
          >
            <v-col cols="4">
              <v-text-field
                label="Splitaren izena"
                v-model="split.name"
                density="compact"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Denbora minimoa"
                v-model="split.min_time"
                density="compact"
                variant="outlined"
              ></v-text-field>
            </v-col>

            <v-col cols="2">
              <v-btn
                color="error"
                @click="_removeSplit(index, s)"
                variant="tonal"
                density="comfortable"
                icon="mdi-delete"
              >
              </v-btn>
            </v-col>
          </v-row>

          <v-btn
            @click="_addSplit(index)"
            prepend-icon="mdi-plus-circle"
            variant="tonal"
            class="my-3"
            size="small"
          >
            Split berria
          </v-btn>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-btn
            color="success"
            @click="_submitForm()"
            prepend-icon="mdi-cloud-upload"
            >Datuak gorde</v-btn
          >

          <v-btn
            color="primary"
            @click="_addEvent()"
            prepend-icon="mdi-plus-circle"
            variant="tonal"
            class="mx-3"
          >
            Lasterketa berria
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-data-table
      v-if="items && !item"
      :headers="headers"
      :items="items"
      color="white"
    >
      <template v-slot:item.actions="{ item }" slot="end">
        <div class="d-flex justify-end">
          <v-icon class="me-2" size="default" @click="_editItem(item)">
            mdi-pencil
          </v-icon>
        </div>
      </template>
      <template v-slot:no-data>
        <v-btn color="primary" @click="initialize"> Reset </v-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script>
// @ is an alias to /src
import axios from "axios";
export default {
  name: "ServerWPComponent",
  data() {
    return {
      headers: [
        { title: "ID", key: "id" },
        { title: "Ekitaldia", key: "name" },
        { title: null, key: "actions" },
      ],
      items: null,
      item: null,
      error: false,
      loader: false,
      menu: false,
    };
  },
  mounted() {
    // document.title = "Hasiera - Loraldia QR aplikazioa";
    if (!this._auth) this.$router.push("/login");

    this._get_races();
  },

  computed: {
    _auth() {
      return this.$store.state._auth;
    },
  },
  methods: {
    async _get_races() {
      try {
        let res = await axios.get("/v1/get-races");
        this.loader = false;

        if (res.status === 200) {
          this.items = [];
          res.data.data.forEach((r) => {
            this.items.push({
              id: r.ID,
              name: r.post_title,
            });
          });
        } else {
          this.error = "Sartutako datuak ez dira zuzenak.";
        }
      } catch (error) {
        this.error = "Sartutako datuak ez dira zuzenak.";
        console.log(99, error);
        setTimeout(() => {
          this.error = false;
        }, 3500);

        this.loader = false;
      }
    },
    async _editItem(item) {
      const params = {
        id: item.id,
      };
      try {
        let res = await axios.get("/v1/get-race-by-id", { params });

        if (res.status === 200) {
          this.item = res.data.data;
        } else {
          this.error = "Sartutako datuak ez dira zuzenak.";
        }
      } catch (error) {
        console.log(33, error);
      }
    },

    async _submitForm() {
      const params = {
        id: this.item.id,
        events: this.item.events,
      };
      try {
        let res = await axios.post("/v1/set-race-by-id", params);

        if (res.status === 200) {
          console.log(res.data.data);
        } else {
          this.error = "Sartutako datuak ez dira zuzenak.";
        }
      } catch (error) {
        console.log(33, error);
      }
    },
    _addEvent() {
      this.item.events.push({
        name: null,
        distance: null,
        start_date: null,
        unique_id: this._generateRandomString(14),
        splits: [],
      });
    },
    _removeEvent(index) {
      this.item.events.splice(index, 1);
    },
    _addSplit(index) {
      this.item.events[index].splits.push({
        name: null,
        min_time: null,
        unique_id: this._generateRandomString(14),
      });
    },
    _removeSplit(index, s) {
      this.item.events[index].splits.splice(s, 1);
    },
    _generateRandomString(length) {
      const characters = "0123456789abcdef"; // Hexadecimal characters
      let result = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
      }

      return result;
    },
    _logout() {
      this.$store.commit("_AUTH", null);
      window.ipc.send("toMain", ["remove-cookies", "auth"]);
      this.$router.push("/login");
    },
    async login(e) {
      e.preventDefault();

      if (!this.username || !this.password) return;

      this.loader = true;
      this.error = null;
      let params = {
        username: this.username,
        password: this.password,
      };
      setTimeout(async () => {
        try {
          let res = await axios.post("/jwt-auth/v1/token", params);
          this.loader = false;

          if (res.status === 200) {
            let authObject = {
              token: res.data.token,
              ID: res.data.ID,
              user: res.data.user_nicename,
            };

            window.ipc.send("toMain", [
              "set-cookies",
              "auth",
              JSON.stringify(authObject),
            ]);
            this.$store.commit("_AUTH", authObject);
            this.$router.push("/home");

            setTimeout(() => {
              this.error = false;
            }, 3500);

            return true;
          } else {
            this.error = "Sartutako datuak ez dira zuzenak.";
          }
        } catch (error) {
          this.error = "Sartutako datuak ez dira zuzenak.";

          setTimeout(() => {
            this.error = false;
          }, 3500);

          this.loader = false;
        }
      }, 0);
    },
  },
};
</script>

<style lang="scss">
.server {
  overflow-y: auto;
}
.events {
  &__row:nth-child(odd) {
    background: rgba(white, 0.2);
  }
}
.splits {
  &__row {
    padding: 0;
  }
}
</style>
