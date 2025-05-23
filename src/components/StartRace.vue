<template>
  <v-dialog v-model="editDialog" max-width="400px">
    <v-card>
      <v-card-title>Zehaztu hasiera</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="editedTime"
          variant="outlined"
          density="compact"
          label="Denbora berria (HH:mm:ss:SSS)"
        />

        <div class="text-caption font-weight-medium mt-4" v-if="prevStarts">
          Azken irteerak:
        </div>
        <v-chip-group column>
          <v-chip
            v-for="(prev, i) in prevStarts"
            :key="i"
            @click="selectPrevStart(prev)"
            class="ma-1"
            color="primary"
            variant="outlined"
          >
            {{ prev.pretty }}
          </v-chip>
        </v-chip-group>
        <v-alert v-if="errorMessage" class="my-3" color="red" variant="tonal">
          {{ errorMessage }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="editDialog = false">Itxi</v-btn>
        <v-btn color="primary" @click="_confirmEditStart">Gorde</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-card-item title="Lasterketa abiarazi/geratu"> </v-card-item>
  <div v-if="events" class="start">
    <div class="text-subtitle-2 mb-2">
      Zerbitzariaren ordua: <strong>{{ serverClock }}</strong>
    </div>

    <div v-for="(event, i) in events" :key="i" class="start-button">
      <v-checkbox
        v-model="selectedOptions"
        :label="event.name"
        :value="event.unique_id"
      >
      </v-checkbox>

      <v-icon
        icon="mdi-pencil"
        variant="flat"
        @click="_editStart(event)"
      ></v-icon>
    </div>
    <v-btn
      @click="_start()"
      variant="outlined"
      prepend-icon="mdi-timer-play"
      size="small"
      >Hasi</v-btn
    >
    <v-btn
      @click="_start(false)"
      color="red"
      variant="flat"
      prepend-icon="mdi-timer-off"
      size="small"
      class="mx-2"
      >Geratu</v-btn
    >
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "StartRaceComponent",
  data() {
    return {
      selectedOptions: [],
      start: false,
      editDialog: false,
      editStart: null,
      errorMessage: false,
      serverTime: null,
      prevStarts: null,
      editedTime: "",
      currentServerTime: null, // timestamp dinámico que se irá actualizando
      clockInterval: null,
    };
  },
  props: {
    minimal: {
      type: Boolean,
    },
  },
  mounted() {
    window.ipc.send("toMain", ["server-time-info"]);

    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        async function (event, data) {
          if (data[0] === "server-time-info") {
            that.serverTime = data[1];

            const baseTime = Number(that.serverTime.timestamp);
            that.currentServerTime = baseTime;

            if (that.clockInterval) clearInterval(that.clockInterval);

            that.clockInterval = setInterval(() => {
              that.currentServerTime += 1000;
            }, 1000);

            // Opcional: actualizar editedTime por defecto
            if (that.editDialog && !that.editedTime) {
              const momentTime = moment(baseTime);
              that.editedTime = momentTime.format("HH:mm:ss:SSS");
            }
          }

          if (data[0] === "get-prev-starts") {
            that.prevStarts = data[1];

            const base = moment(that.prevStarts[0].pretty);
            that.editedTime =
              base.diff(base.clone().startOf("day"), "milliseconds") === 0
                ? "00:00:00:000"
                : base.format("HH:mm:ss:SSS");
          }
        }
    );
  },
  computed: {
    events() {
      return this.$store.state.events;
    },
    race() {
      return this.$store.state.race;
    },
    serverClock() {
      return this.currentServerTime
        ? moment(this.currentServerTime).format("HH:mm:ss")
        : "--:--:--";
    },
  },
  methods: {
    _start(start = true) {
      if (!this.selectedOptions.length) return;

      // Asegúrate de mandar solo IDs (no objetos enteros)
      const eventIds = this.selectedOptions.map((id) => id.toString());
      window.ipc.send("toMain", [
        "get-server-time",
        null,
        start,
        eventIds,
        this.race.ID,
      ]);

      const params = {
        start: start,
        options: this.selectedOptions,
      };

      this.$store.commit("_START_SOCKET", params);
    },
    selectPrevStart(prev) {
      const formatted = moment(Number(prev.timestamp)).format("HH:mm:ss:SSS");
      this.editedTime = ""; // limpiar para forzar reactividad
      this.editedTime = formatted;
    },
    _editStart(event) {
      this.editStart = event;
      this.editDialog = true;
      this.editedTime = ""; // o `${horaActualRelativa}` si la conoces
      this.errorMessage = false;

      window.ipc.send("toMain", ["get-prev-starts"]);
    },
    _confirmEditStart() {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]:\d{3}$/;
      if (!timeRegex.test(this.editedTime)) {
        this.errorMessage = "Formatua okerra da. Erabili HH:mm:ss:SSS";
        return;
      }

      if (!this.serverTime || !this.serverTime.timestamp) {
        this.errorMessage = "Zerbitzariaren ordua ez dago eskuragarri.";
        return;
      }

      const timestampNum = Number(this.serverTime.timestamp);
      if (isNaN(timestampNum)) {
        this.errorMessage =
          "Zerbitzariaren timestamp-a ez da zenbaki balioduna.";
        return;
      }

      // 1. Hora base: medianoche del mismo día según hora del servidor
      const base = moment(Number(timestampNum)).startOf("day");

      // 2. Parsear la hora introducida
      const [h, m, s, ms] = this.editedTime.split(":").map(Number);
      const offsetMs = h * 3600000 + m * 60000 + s * 1000 + ms;

      // 3. Sumar a la base
      const fullStart = base.clone().add(offsetMs, "ms");

      // 4. Preparar timestamp y texto legible
      const timestamp = fullStart.valueOf().toString();
      const prettyStart = fullStart.format("YYYY-MM-DD HH:mm:ss.SSS");

      // 5. Aplicar a evento
      this.editStart.start = timestamp;
      this.editStart.pretty_start = prettyStart;

      // 6. Enviar al main y actualizar
      window.ipc.send("toMain", [
        "get-server-time",
        { timestamp, pretty: prettyStart },
        true,
        [this.editStart.unique_id.toString()],
        this.race.ID,
      ]);

      this.$store.commit("_SET_EVENTS", [...this.events]);
      this.editDialog = false;
    },
  },
};
</script>

<style lang="scss">
.start {
  padding: 0 15px !important;
  & > div {
    margin: 0;
    padding: 0;
  }
}

.start-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
