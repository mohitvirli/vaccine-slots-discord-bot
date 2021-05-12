require('dotenv').config();
const Discord = require('discord.js');
const moment = require('moment');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const INTERVAL = process.env.INTERVAL || 5000;
const https = require('https');

/**
 * Maintain the polling interval for each PIN code.
 */
const pollIntervals = {};

/**
 * Statistics for polls.
 */
const pollStats = {};

/**
 * Saving old stats to show the diff, if any.
 */
const oldPollStats = {};

/**
 * Login
 */
bot.login(TOKEN);

/**
 * Init.
 */
bot.once('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

/**
 * On message.
 */
bot.on('message', msg => {
  const val = msg.content;

  if (val.startsWith('-vaccine')) {
    const pincode = val.split(' ')[1];
    const pollClear = val.split(' ')[2];
    const date = moment().format('DD-MM-YYYY');
    if (!argCheckValid(val)) {
      msg.channel.send({
        embed: {
          color: 0x81b214,
          description: '-vaccine [pincode] [clear]',
          title: '-vaccine Usage',
          fields: [{
              name: 'pincode',
              value: 'The Pincode to check/start polling',
            }, {
              name: 'clear',
              value: 'If you want to clear polling for the pin mentioned',
            }, {
              name: 'Currently Polling for',
              value: Object.keys(pollIntervals).length ? Object.keys(pollIntervals).join(', ') : 'None',
            }
          ],
        },
      });

      return;
    }

    const params = { pincode, date };

    /**
     * Get list of centers available.
     * @param first If its the first time the function is being called.
     */
    const getList = (first) => {
      if (!first) console.log('Polling for', pincode);
      const pollingStarted = !!pollIntervals[pincode];

      if (first && !pollingStarted && !pollStats[pincode]) {
        pollStats[pincode] = {
          success: 0,
          fail: 0,
        };
        oldPollStats[pincode] = {...pollStats[pincode]};
      }

      getCenters(params, res => {
        const availabilityCheck = a => a.min_age_limit !== 45 && a.available_capacity !== 0;
        const availableCenters = (res.centers || []).filter(center => center.sessions.find(availabilityCheck));

        const embedMessage = {
          color: 0x81b214,
          fields: [],
        };

        if (availableCenters.length === 0 && first) {
          embedMessage.fields.push({
            name: 'Not available',
            value: 'Search karte raho lmao',
          });

          embedMessage.fields.push({
            name: 'Polling Status',
            value: pollingStarted ? 'Running' : 'Started',
          });

          embedMessage.fields.push({
            name: '✅ Polls',
            value: `${pollStats[pincode].success} (+${pollStats[pincode].success - oldPollStats[pincode].success})`,
            inline: true,
          });

          embedMessage.fields.push({
            name: '❌ Polls',
            value: `${pollStats[pincode].fail} (+${pollStats[pincode].fail - oldPollStats[pincode].fail})`,
            inline: true,
          });

          if (pollingStarted) {
            oldPollStats[pincode] = {...pollStats[pincode]};
          }

          embedMessage.color = pollingStarted ? 0x00adb5 : 0xfb3640;
          msg.channel.send({ embed: embedMessage });
        } else if (availableCenters.length !== 0) {
          msg.channel.send({ embed: {
            title: 'GOTDAM VACCINE SLOTS AVAILABLE',
            description: 'Start booking lmao, what you looking at?',
            color: 0xf8f5f1,
          }});

          availableCenters.forEach(center => {
            embedMessage.fields = [{
              name: center.name,
              value: `${center.state_name}, Fee Type - ${center.fee_type}`,
            }];

            center.sessions
              .filter(availabilityCheck)
              .forEach(ses => {
                embedMessage.fields.push({
                  name: `${moment(ses.date).format('D MMM YYYY')} (${ses.available_capacity} Slots)`,
                  value: ses.slots.join(', '),
                  inline: true,
                });
              });

            msg.channel.send({ embed: embedMessage });
            clearInterval(pollIntervals[pincode]);
            pollIntervals[pincode] = null;
          })
        }
      });
    }

    if (pollClear !== 'clear') {
      getList(true);

      if (!pollIntervals[pincode]) {
        pollIntervals[pincode] = setInterval(getList, INTERVAL);
      }
    } else {
      if (pollIntervals[pincode]) {
        msg.channel.send({embed: {
          description: `Cleared Polling for ${pincode}`,
        }});

        clearInterval(pollIntervals[pincode]);
        pollIntervals[pincode] = null;
      } else {
        msg.channel.send({embed: {
          description: `No polling started for ${pincode}, wyd even?`,
        }});
      }
    }
  }
});

/**
 * Checks if the arguments passed is valid or not
 *
 * @param message the current message.
 */
function argCheckValid(message) {
  const [arg1, arg2, arg3] = message.split(' ');

  if (!arg2) return false;
  if (!/^[1-9]{1}[0-9]{5}$/.test(arg2)) return false; // Match PINCODE
  if (arg3 && arg3 !== 'clear') return false;

  return true;
}

/**
 * Using native https request to get the list of centers.
 *
 * @param params The URL params.
 * @param callback The callback function.
 */
function getCenters(params, callback) {
  const url = new URL('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin');

  // Set the url params.
  Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));

  const options = {
    hostname: url.hostname,
    port: 443,
    path: `${url.pathname}${url.search}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
    }
  };

  // Make the API call.
  const req = https.request(options, res => {
    res.setEncoding('utf8')
    let response;

    res.on('data', res => response = res);

    res.on('end', d => {
      if (res.statusCode != 200) {
        pollStats[params.pincode].fail++;
        console.log('Error', res.statusCode);
        callback({}, true);
      } else {
        pollStats[params.pincode].success++;
        callback(JSON.parse(response));
      }
    })
  });

  req.on('error', error => {
    console.error(error);
  });

  req.end();
}
