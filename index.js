require('dotenv').config();
const Discord = require('discord.js');
const moment = require('moment');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const INTERVAL = process.env.INTERVAL;
const axios = require('axios');

/**
 * Maintain the polling interval for each PIN code.
 */
const pollIntervals = {};

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
            },
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

      axios.get("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin", { params })
        .then(res => res.data)
        .then(res => {
          const ageLimitCheck = a => a.min_age_limit !== 45;
          const availableCenters = res.centers.filter(center => center.sessions.find(ageLimitCheck));

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
                .filter(ageLimitCheck)
                .forEach(ses => {
                  embedMessage.fields.push({
                    name: moment(ses.date).format('D MMM YYYY'),
                    value: ses.slots.join(', '),
                    inline: true,
                  });
                });

              msg.channel.send({ embed: embedMessage });
              clearInterval(pollIntervals[pincode]);
              pollIntervals[pincode] = null;
            })
          }
        })
        .catch(err => console.log(err));
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