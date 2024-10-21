import {
  createStore
} from 'vuex'

import axios from 'axios'
export default createStore({
  state: {
    _auth: null,
    connected: null,
    startChrono: false,
    startTime: null,
    startList: [],
    items: [],
    hostname: null,
    readDelay: 5, //seconds
    events: [],
    selectedSplits: [],
    serial: null
  },
  mutations: {
    _AUTH(state, val) {
      state._auth = val
    },
    _CONNECTED(state, val) {
      state.connected = val
    },
    _SET_EVENTS(state, val) {
      state.events = val
    },
    _SET_SELECTED_SPLITS(state, val) {
      state.selectedSplits = val
    },
    _START_TIME(state, val) {
      state.startTime = val
    },
    _START_CHRONO(state, val) {
      state.startChrono = val
    },
    _SAVE_ITEMS(state, val) {
      state.items.push(val)
    },
    _RESET_ITEMS(state, val) {
      state.items = val
    },
    _SET_START_LIST(state, val) {
      state.startList = val
    },
    _SET_READ_DELAY(state, val) {
      state.readDelay = val
    },
    _SET_HOSTNAME(state, val) {
      state.hostname = val
    },
    _SET_SERIAL_PORT(state, val) {
      state.serial = val
    },
  },
  actions: {
    async _get_events(context) {

      let response = await axios.get("/v1/get-race");
      let events = response.data.data;
      events.forEach((event) => {
        event['start'] = null;
      });
      context.commit("_SET_EVENTS", events);
    },
    async _get_cronos(context) {
      let starts = await axios.get(
        "/v1/get-starts"
      );

      starts = starts.data.data;
      let events = context.state.events;
      events.map((res) => {
        starts.forEach((start) => {
          if (start.unique_id == res.unique_id) {
            res.start = start.start;
          }
        });
      });

      context.commit("_SET_EVENTS", events);
      window.ipc.send("toMain", ["start-time", JSON.stringify(events)]);
    },
    async _get_current_pc_splits(context) {
      axios
        .get("/v1/get-split")
        .then((response) => {
          context.commit("_SET_SELECTED_SPLITS", response.data.data);
        });
    },
    async _get_participants(context) {
      let events = context.state.events;
      axios
        .get("/v1/resultados")
        .then((response) => {
          if (events) {
            events.forEach((split) => {
              response.data.data.resultados.map((res) => {
                if (split.name == res[4]) {
                  res[4] = split;
                }
              });
            });
          }
          context.commit("_SET_START_LIST", response.data.data.resultados);
          window.ipc.send("toMain", [
            "start-list",
            JSON.stringify(response.data.data.resultados),
          ]);
        });
    }
  },
  getters: {
    canInventory (state) {
      let active = false;
      if(state.connected) {
        state.connected.forEach(res => {
          if(res.active) active = true;
        })
      }
      return active;
    }
  },
  modules: {}
})