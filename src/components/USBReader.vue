<template>
  <div class="hello">
    <!-- serial port -->

    <v-card class="main-card mb-6" variant="outlined">
      <v-card-text class="py-3">
        <v-row align="center" no-gutters>
          <v-col class="main-title" cols="6">USB Reader</v-col>

          <v-col class="text-right" cols="6">
            <v-icon color="primary" icon="mdi-usb-port" size="55"></v-icon>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-item title="USB konexioak arakatu">
        <v-btn
          @click="_get_serial()"
          variant="outlined"
          color="primary"
          class="my-3"
          prepend-icon="mdi-usb-c-port"
          >Arakatu</v-btn
        >
      </v-card-item>
    </v-card>

    <div v-if="serials" class="pa-3">
      <v-select
        label="Serial Port"
        :items="serials"
        v-model="serial"
        variant="outlined"
      ></v-select>
      <v-btn @click="_set_serial()" color="primary" class="my-3" variant="flat"
        >USBa zehaztu</v-btn
      >
    </div>

    <v-card class="mx-auto mt-8" max-width="100%" variant="solo">
      <v-card-item>
        <div class="main-title" cols="6">TAG grabatzailea</div>
        <v-card-subtitle>
          Modu automatikoan Tag berriak idazteko erabili azpiko formularioa.
          Adibidez, TAG hauek honako formatua izango dute:
          123400000000000000000045</v-card-subtitle
        >
      </v-card-item>
    </v-card>

    <v-btn
      @click="_read_tag()"
      color="primary"
      variant="tonal"
      class="mx-3"
      prepend-icon="mdi-tag-edit"
      >Tag berriak grabatu</v-btn
    >

    <v-btn
      @click="_assign_tag()"
      color="primary"
      variant="tonal"
      class="mx-3"
      prepend-icon="mdi-tag-edit"
      >Asignatu</v-btn
    >

    <!-- dialog 1 -->
    <v-dialog v-model="dialog1">
      <v-card class="mx-auto pa-8" width="750">
        <v-row align="center" no-gutters>
          <v-col class="main-title2" cols="10">Txipak EPC Grabatu</v-col>

          <v-col class="text-right" cols="2">
            <v-btn
              density="comfortable"
              icon="mdi-close"
              variant="flat"
              @click="dialog1 = null"
            ></v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="message"
          class="my-5"
          color="success"
          variant="tonal"
          closable
          border="start"
        >
          TAGa ondo grabatu da.
        </v-alert>

        <v-row class="my-5 pa-3">
          <v-text-field
            label="Prefijoa"
            v-model="prefix"
            variant="underlined"
          ></v-text-field>

          <v-text-field
            label="Zenbatzailea zehaztu"
            v-model="counter"
            variant="underlined"
            class="mx-2"
          ></v-text-field>

          <v-btn
            @click="_set_prefix()"
            color="primary"
            variant="flat"
            class="mx-3"
            >BALIOAK ZEHAZTU</v-btn
          >
        </v-row>

        <template v-if="read">
          <p><small>Momentuko TAG zenbakia:</small></p>
          <div class="tag-title mb-8">{{ read }}</div>
        </template>
        <v-alert
          v-else
          class="my-5"
          color="error"
          variant="tonal"
          closable
          border="start"
        >
          Ez da TAG bat bera ere ez irakurri
        </v-alert>

        <v-row>
          <v-col cols="12">
            <p><small>Gordeko den TAG zenbakia:</small></p>
            <input type="text" v-model="writeTag" class="bib-input" />
          </v-col>
          <v-col cols="12">
            <v-btn
              @click="_read_tag()"
              color="grey-lighten-3"
              size="large"
              variant="flat"
              class="mb-2"
              block
            >
              Irakurri
            </v-btn>
            <v-btn
              @click="_write_tag()"
              color="primary"
              variant="flat"
              block
              size="large"
              :disabled="disabledSave"
              >Gorde</v-btn
            >
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <!-- dialog 2 -->
    <v-dialog v-model="dialog2">
      <v-card class="mx-auto pa-8" width="600">
        <v-row align="center" no-gutters>
          <v-col class="main-title2" cols="10">Dortsalak asignatu</v-col>

          <v-col class="text-right" cols="2">
            <v-btn
              density="comfortable"
              icon="mdi-close"
              variant="flat"
              @click="dialog2 = null"
            ></v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="message"
          class="my-5"
          color="success"
          variant="tonal"
          border="start"
        >
          {{ this.message }}
        </v-alert>

        <v-alert
          class="my-5"
          color="error"
          variant="tonal"
          border="start"
          v-model="error"
        >
          {{ error }}
        </v-alert>

        <template v-if="read">
          <p><small>Momentuko TAG zenbakia:</small></p>
          <div class="tag-title mb-8">{{ read }}</div>
        </template>
        <v-alert
          v-else
          class="my-5"
          color="error"
          variant="tonal"
          border="start"
        >
          Ez da TAG bat bera ere ez irakurri
        </v-alert>

        <v-row>
          <v-col cols="12">
            <p><small>Asignaziorako dortsala:</small></p>
            <input type="text" v-model="bibNumber" class="bib-input" />
          </v-col>
          <v-col cols="12">
            <v-btn
              @click="_assign_tag()"
              color="grey-lighten-3"
              size="large"
              variant="flat"
              class="mb-2"
              block
            >
              Irakurri
            </v-btn>
            <v-btn
              @click="_save_items_tag()"
              color="primary"
              variant="flat"
              block
              size="large"
              >Gorde</v-btn
            >
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "SettingsUSBComponent",
  data() {
    return {
      serials: null,
      serial: null,
      writeTag: null,
      read: null,
      prefix: "0",
      counter: 0,
      message: false,
      disabledSave: false,
      bibNumber: 1,
      assign: false,
      dialog1: false,
      dialog2: false,
      error: false,
    };
  },
  mounted() {
    this.serial = this._serial;

    this.prefix = this._tags.prefix;
    this.counter = parseInt(this._tags.counter);

    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "send-serials") {
            console.log(JSON.parse(data[1]));
            that.serials = JSON.parse(data[1]);
          }

          // usb tag irakurri
          if (data[0] == "serial-usb") {
            that.read = data[1];

            that.disabledSave = false;

            if (data[2] || !that.read) {
              that.disabledSave = true;
            }
          }

          // usb tag idatzi
          if (data[0] == "serial-usb-write") {
            let response = data[1];

            if (response) {
              that.disabledSave = true;

              //mantener disabled
              that._read_tag(true);

              that.message = true;

              that.counter = parseInt(that.counter) + 1;

              const tag = {
                prefix: that.prefix,
                counter: that.counter,
                currentTag: that.writeTag,
              };
              that.$store.commit("_SET_TAG", tag);
            }
          }
        }
    );
  },
  computed: {
    _serial() {
      return this.$store.state.serial;
    },
    _tags() {
      return this.$store.state.tags;
    },
    _items() {
      return this.$store.state.startList;
    },
  },
  methods: {
    _get_serial() {
      window.ipc.send("toMain", ["get-serial"]);
    },
    _set_serial() {
      window.ipc.send("toMain", ["set-cookies", "serial", this.serial]);
      this.$store.commit("_SET_SERIAL_PORT", this.serial);
    },
    _set_read_delay() {
      this.$store.commit("_SET_READ_DELAY", this.readDelay);
      this.$store.commit("_SET_BEEP", this.beep);
    },
    _set_prefix() {
      const tag = {
        prefix: this.prefix,
        counter: parseInt(this.counter),
        currentTag: this._tags.currentTag,
      };
      this.$store.commit("_SET_TAG", tag);
    },
    generateEPC(prefix, counter) {
      const counterString = counter.toString().padStart(12, "0"); // Convierte el contador a un string de 12 dígitos
      const paddedPrefix = prefix.padEnd(12, "0"); // Completa el prefijo con ceros hasta 12 caracteres
      return paddedPrefix + counterString; // Combina el prefijo y el contador
    },
    _read_tag(disabled = false) {
      this.dialog1 = true;
      window.ipc.send("toMain", ["read-tag", this.serial, disabled]);
      this.writeTag = this.generateEPC(this.prefix, this._tags.counter + 1);
      this.message = false;
    },
    _write_tag() {
      window.ipc.send("toMain", ["write-tag", this.serial, this.writeTag]);
    },
    _assign_tag(disabled = false) {
      this.dialog2 = true;
      this.error = false;
      this.message = false;

      window.ipc.send("toMain", ["read-tag", this.serial, disabled]);
      this.message = false;
    },
    async _save_items_tag() {
      let items = this._items;
      let exist = false;
      let success = false;
      this.message = false;

      items.filter((res) => {
        if (res[0] == this.read) exist = true;
      });

      if (exist) {
        this.error = "Txip hau beste dortsal bati asignatuta dago.";
        return true;
      }

      items.map((res) => {
        if (res[1] == this.bibNumber) {
          res[0] = this.read;
          success = "Txip hau ondo asignatu da.";
        }
      });

      if (success) {
        this.$store.commit("_SET_START_LIST", items);
        this.message = success;
        this.bibNumber++;
      }
      // items.map((res) => {
      //   if (res[1] == this.bibNumber) res[0] = this.read;
      // });

      // this.$store.commit("_SET_START_LIST", items);

      // const response = await axios.post("/v1/save", {
      //   items: JSON.stringify(items),
      // });

      // console.log("response", response);
    },
  },
};
</script>

<style lang="scss">
.main-card {
  padding: 10px !important;
}

.tag-title {
  font-weight: 500;
  font-size: 22px;
  background: #111;
  text-align: center;
  padding: 15px;
  color: rgb(0, 255, 170);
  border-radius: 3px;
}

.main-title2 {
  font-size: 20px;
  font-weight: 300;
}

.bib-input {
  font-size: 22px;
  text-align: center;
  width: 100%;
  text-align: center;
  padding: 10px;
  border: 2px solid rgba(black, 0.1);
  border-radius: 3px;
  outline: 0;
}
</style>
