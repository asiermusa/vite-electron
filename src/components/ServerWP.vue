<template>
  <div class="hello">
    <v-row align="center" no-gutters>
      <v-col cols="6"><h2 class="main-title">WordPress Zerbitzaria</h2> </v-col>
      <v-col class="text-right" cols="6">
        <v-btn
          @click="_logout()"
          icon="mdi-logout"
          variant="tonal"
          class="mx-3"
          color="red"
        ></v-btn>
      </v-col>
    </v-row>

    <Loader v-if="loader" />

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
        <v-col cols="12" class="my-6">
          <h2>{{ item.title }}</h2>
        </v-col>
      </v-row>

      <v-row align="center" no-gutters>
        <v-col cols="3">
          <v-text-field
            v-model="item.otp"
            label="Lasterketaren kodea (6 digitu)"
            variant="outlined"
          ></v-text-field>
        </v-col>

        <v-checkbox
          v-model="deleteUsersSplits"
          label="Ezabatu split guztietako erabiltzaileak"
        />
      </v-row>

      <v-alert
        type="info"
        class="my-8"
        variant="tonal"
        prominent
        border="bottom"
      >
        Zuzeneko emisoa aktibatuta, online jarraipena egingo da cloud bidez
        mongo datu basearekin.
        <v-checkbox
          v-model="item.stream"
          label="Zuzeneko jarraipena"
          class="pa-0 ma-0"
        />
      </v-alert>

      <v-row align="center">
        <v-col cols="6">
          <v-text-field
            v-model="item.google_drive_id"
            label="Google Drive karpeta"
            variant="outlined"
          ></v-text-field>
        </v-col>

        <v-col cols="6">
          <v-text-field
            v-model="item.excel_name"
            label="Excel fitxategiaren izena"
            variant="outlined"
          ></v-text-field>
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
            color="red"
            @click="_removeEvent(index)"
            variant="tonal"
            density="comfortable"
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
            <template v-if="errors[0]">
              <v-col cols="12" class="py-0">
                <v-alert
                  v-if="errors[index][s]"
                  :text="errors[index][s]"
                  color="red"
                  class="my-4"
                  icon="mdi-alert-circle-outline"
                  variant="tonal"
                ></v-alert>
              </v-col>
            </template>
            <v-col cols="4">
              <v-text-field
                label="Splitaren izena"
                v-model="split.name"
                density="compact"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-text-field
                label="Denbora minimoa"
                v-model="split.min_time"
                density="compact"
                variant="outlined"
                placeholder="Adibidez 10 minutu: 00:10:00"
                :error="!!errors[index]?.[s]"
                :error-messages="errors[index]?.[s] || ''"
              ></v-text-field>
            </v-col>

            <v-col cols="3">
              <v-text-field
                label="Denbora maximoa"
                v-model="split.max_time"
                density="compact"
                variant="outlined"
                placeholder="Adibidez irteerako baliogarria da"
                :error="!!errors[index]?.[s]"
                :error-messages="errors[index]?.[s] || ''"
              ></v-text-field>
            </v-col>

            <v-col cols="2">
              <v-btn
                color="default"
                @click="_removeSplit(index, s)"
                variant="flat"
                density="comfortable"
                icon="mdi-close"
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
          <div class="mb-6">
            <Loader v-if="loader" />

            <v-alert
              v-if="error"
              :text="error"
              color="red"
              icon="mdi-alert-circle-outline"
              variant="tonal"
            ></v-alert>

            <v-alert
              v-if="success"
              :text="success"
              type="success"
              variant="tonal"
            ></v-alert>
          </div>

          <v-btn
            color="success"
            variant="flat"
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
            Ebento berria
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-data-table
      v-if="items && !item"
      :headers="headers"
      :items="items"
      color="white"
      class="wp-table"
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
import Loader from "./Loader.vue";
export default {
  name: "ServerWPComponent",
  components: {
    Loader,
  },
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
      errors: [],
      success: false,
      loader: false,
      menu: false,
      deleteUsersSplits: false,
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
    validateTimeInput() {
      this.errors = []; // Reset errors
      const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
      let isValid = true;

      this.item.events.forEach((event, eventIndex) => {
        this.errors[eventIndex] = [];
        event.splits.forEach((split, splitIndex) => {
          if (!timeRegex.test(split.min_time)) {
            isValid = false;
            this.errors[eventIndex][splitIndex] =
              "Denbora formatua HH:MM:SS izan behar da";
          }
        });
      });

      return isValid;
    },
    async _get_races() {
      this.loader = true;
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
        }
      } catch (error) {
        this.loader = false;
      }
    },
    onDragEnd(event) {
      console.log("Drag ended!", event);
    },
    async _editItem(item) {
      this.loader = true;
      this.success = false;
      const params = {
        id: item.id,
      };
      try {
        let res = await axios.get("/v1/get-race-by-id", { params });

        this.loader = false;

        if (res.status === 200) {
          this.item = res.data.data;
        } else {
          this.error = "Sartutako datuak ez dira zuzenak.";
        }
      } catch (error) {
        this.loader = false;
      }
    },

    async _submitForm() {
      this.error = false;
      this.success = false;

      this.errors = this.item.events.map((event) => ({
        splits: event.splits.map((split) => {
          if (!split.min_time) {
            return "Denbora ezin da hutsik egon"; // Cannot be empty
          }
          if (!/^\d{2}:\d{2}:\d{2}$/.test(split.min_time)) {
            return "Denbora formatua HH:MM:SS izan behar da"; // Invalid format
          }
          return ""; // No error
        }),
      }));

      if (!this.validateTimeInput()) return;
      this.loader = true;

      const params = {
        data: this.item,
        deleteSplits: this.deleteUsersSplits,
      };
      try {
        let res = await axios.post("/v1/set-race-by-id", params);
        this.loader = false;

        let race = res.data;

        if (res.status === 200) {
          this.success = "Datuak ondo gorde dira zerbitzarian.";
          this.$store.dispatch("_getCloudData", false);

          race = {
            ID: race.data.ID,
            name: race.data.post_title,
            stream: race.data.stream,
          };

          this.$store.commit("_SET_RACE", race);
        } else {
          this.error = "Errore bat gertatu da datuak gordetzerakoan.";
        }
      } catch (error) {
        this.loader = false;
        console.log(error);
        this.error = error;
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
    padding: 40px 10px 20px 10px;
    background: rgba(grey, 0.08);
    border-radius: 5px !important;
  }
}
.splits {
  &__row {
    padding: 0;
  }
}

.draggable-item {
  border: 1px solid #ccc;
  margin: 4px 0;
  padding: 8px;
  border-radius: 8px;
  background: #f9f9f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.v-messages__message {
  display: block !important;
}

.stream {
  background: rgba(#1867c0, 0.2);
  margin: 30px 0 !important;
}

.wp-table {
  thead th:first-child {
    width: 50px;
  }
}
</style>
