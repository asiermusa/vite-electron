<template>
  <div class="chrono-div">
    <div class="chrono">{{ clock }}</div>
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
      clock: "00:00:00",
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

      console.log("vali", val);

      if (this.timeBegan === null) {
        this.reset();

        this.timeBegan = parseInt(val);

        this._getTimeServer();

        console.log(
          "acu",
          this.timeBegan,
          moment().format("x"),
          this._getAccurateTime().format("x")
        );
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
      this.clock = "00:00:00"; //00:00:00.00
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
      let decimalValue = milli.toString().indexOf(".");
      let resultMilli = milli.toString().substring(decimalValue + 1);

      let hour = [];
      hour.push(moment.utc(timeElapsed).format("HH"));
      hour.push(moment.utc(timeElapsed).format("mm"));
      hour.push(moment.utc(timeElapsed).format("ss"));
      hour.push(this.zeroPrefix(resultMilli, 2));

      this.clock = hour[0] + ":" + hour[1] + ":" + hour[2];
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
  font-size: 22px;
}
</style>
