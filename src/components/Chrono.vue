<template>
  <div class="chrono-div">
    <div class="chrono" v-html="formattedTime"></div>
  </div>
</template>

<script>
//https://codepen.io/raphael_octau/pen/XxeqRJ
import moment from "moment-timezone";
export default {
  name: "ChronoComponent",
  props: ["time"],
  data() {
    return {
      timeBegan: null,
      timeStopped: null,
      stoppedDuration: 0,
      started: null,
      running: false,
      clock: "00:00:00.0",
      timeDiff: null,
    };
  },
  mounted() {
    let that = this;
    window.ipc.handle(
      "fromMain",
      () =>
        function (event, data) {
          if (data[0] == "real-time") {
            that.timeDiff = data[1];
          }
        }
    );

    this._getTimeServer();

    setInterval(() => {
      this._getTimeServer();
    }, 60000);
  },
  computed: {
    formattedTime() {
      // Split the time into two parts: before and after the decimal point
      const [mainTime, decimal] = this.clock.split(".");
      return `${mainTime}<span class="decimal">.${decimal}</span>`;
    },
  },
  watch: {
    time(val) {
      if (val) {
        this.reset();
        this.start(val);
      } else this.reset();
    },
  },
  methods: {
    _getTimeServer() {
      window.ipc.send("toMain", ["real-time"]);
    },
    _getAccurateTime() {
      let d = moment().add(this.timeDiff, "milliseconds"); // Adjust local time using the offset
      return d;
    },
    start(val) {
      if (this.running) return;

      if (this.timeBegan === null) {
        this.reset();

        this.timeBegan = parseInt(val);

        this._getTimeServer();
      }

      if (this.timeStopped !== null) {
        this.stoppedDuration += new Date() - this.timeStopped;
      }

      this.started = setInterval(this.clockRunning, 20);
      this.running = true;
    },

    stop() {
      this.running = false;
      this.timeStopped = new Date();
      clearInterval(this.started);
    },

    reset() {
      this.clock = "00:00:00.0"; //00:00:00.00
      this.running = false;
      clearInterval(this.started);
      this.stoppedDuration = 0;
      this.timeBegan = null;
      this.timeStopped = null;
    },

    // clockRunning() {
    //   var currentTime = this._getAccurateTime(),
    //     timeElapsed = new Date(
    //       currentTime - this.timeBegan - this.stoppedDuration
    //     ),
    //     hour = timeElapsed.getUTCHours(),
    //     min = timeElapsed.getUTCMinutes(),
    //     sec = timeElapsed.getUTCSeconds(),
    //     ms = Math.round(timeElapsed.getUTCMilliseconds() / 10);

    //   this.clock =
    //     this.zeroPrefix(hour, 2) +
    //     ":" +
    //     this.zeroPrefix(min, 2) +
    //     ":" +
    //     this.zeroPrefix(sec, 2) +
    //     ":" +
    //     this.zeroPrefix(ms, 2);
    // },

    clockRunning() {
      var currentTime = this._getAccurateTime();

      let timeElapsed = currentTime - this.timeBegan;

      // milliseconds
      let milli = timeElapsed / 1000;
      // centésimas
      let centiseconds = Math.floor((timeElapsed % 1000) / 100); // Dividir milisegundos en bloques de 10 y redondear hacia abajo

      let decimalValue = milli.toString().indexOf(".");
      let resultMilli = milli.toString().substring(decimalValue + 1);

      let hour = [];
      hour.push(moment.utc(timeElapsed).format("HH"));
      hour.push(moment.utc(timeElapsed).format("mm"));
      hour.push(moment.utc(timeElapsed).format("ss"));

      // hau aldatu centesimak kentzeko
      hour.push(this.zeroPrefix(centiseconds, 1));

      this.clock = hour[0] + ":" + hour[1] + ":" + hour[2] + "." + hour[3];
    },
    zeroPrefix(num, digit) {
      var zero = "";
      for (var i = 0; i < digit; i++) {
        zero += "0";
      }
      return (zero + num).slice(-digit);
    },
  },
};
</script>

<style lang="scss">
@font-face {
  font-family: "DS-Digital";
  src: url("../assets/fonts/DS-Digital-Bold.woff2") format("woff2"),
    url("../assets/fonts/DS-Digital-Bold.woff") format("woff");
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "DS-Digital";
  src: url("../assets/fonts/DS-Digital.woff2") format("woff2"),
    url("../assets/fonts/DS-Digital.woff") format("woff");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

$digital: "DS-Digital";

.chrono-div {
  display: flex;
  align-items: center;
}

.chrono {
  text-align: center;
  font-size: 40px;
}

.decimal {
  font-size: 30px;
}
</style>
