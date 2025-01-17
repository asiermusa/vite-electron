const {
  session
} = require('electron')

async function cookies(data) {

  let cmd = data[0];
  let cookieName = data[1];

  if (cmd == 'set-cookies') {

    let twoWeeksInSeconds = 14 * 24 * 3600; // Two weeks in seconds
    let currentObj = data[2];

    try {
      const cookie = {
        url: 'http://denborak.online', // Your domain here
        name: cookieName,
        value: currentObj, // Make sure the value is a string
        expirationDate: Math.floor(Date.now() / 1000) + twoWeeksInSeconds, // 2 aste
      };

      await session.defaultSession.cookies.set(cookie);

      let coo = await session.defaultSession.cookies.get({
        name: cookieName
      });

    } catch (error) {
      console.error(error);
      throw error;
    }
  }


  if (cmd == 'get-cookies') {
    try {
      let cookie = await session.defaultSession.cookies.get({
        name: cookieName
      });

      global.mainWindow.webContents.send('fromMain', ['send-cookies', cookieName, cookie]);

    } catch (error) {
      console.error(error);
    }
  }

  if (cmd == 'remove-cookies') {

    let cookie = {
      url: "http://denborak.online",
      name: cookieName
    };

    try {
      await session.defaultSession.cookies.remove(cookie.url, cookie.name);

      //global.mainWindow.webContents.send('fromMain', ['hostname', COMPUTER_NAME]);
    } catch (error) {
      console.error(error);
    }
  }

}

module.exports = cookies;