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
 * Stores the states data for the session.
 */
let statesData;

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
    let [arg1, arg2, ...arg3] = val.split(' ');
    if (arg3) {
      arg3 = arg3.join(' ');
    }
    const date = moment().format('DD-MM-YYYY');
    if (!argCheckValid(val)) {
      msg.channel.send({
        embed: {
          color: 0x81b214,
          description: '-vaccine [clear] | [pincode] | [state] [district]',
          title: '-vaccine Usage',
          fields: [{
              name: 'pincode',
              value: 'The Pincode to check/start polling, \nex - "vaccine 560103"',
            }, {
              name: 'state district',
              value: 'If you want to search for state/district (case insensitive), \nex - "vaccine karnataka bangalore urban"',
            }, {
              name: 'clear',
              value: 'If you want to clear polling for the pin/state,district mentioned, \nex - "vaccine clear 560103"',
            }, {
              name: 'Currently Polling for',
              value: Object.keys(pollIntervals).length ? Object.keys(pollIntervals).join(', ') : 'None',
            }
          ],
        },
      });

      return;
    }

    /**
     * The unique key for identifying what is being polled for.
     */
    let key;
    const params = { date };

    // Generate params, keys from the arguments.
    if (arg2 === 'clear') {
      if (isValidPincode(arg3)) {
        key = arg3;
      } else {
        let [state, ...district] = arg3.split(' ');
        key = `${state}/${district.join(' ')}`;
      }
    } else {
      if (isValidPincode(arg2)) {
        key = arg2;
        params.url = 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin';
        params.pincode = arg2;
      } else {
        key = `${arg2.toLocaleLowerCase()}/${arg3.toLocaleLowerCase()}`;
        params.url = 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict';
      }
    }

    /**
     * Get list of centers available.
     *
     * @param first If its the first time the function is being called.
     */
    const getList = (first) => {
      if (!first) console.log('Polling for', key);
      const pollingStarted = !!pollIntervals[key];

      // Setups polling stats.
      if (first && !pollStats[key]) {
        pollStats[key] = {
          success: 0,
          fail: 0,
        };
        oldPollStats[key] = {...pollStats[key]};
      }

      getRequest(params, (res, err) => {
        const availabilityCheck = a => a.min_age_limit === 45 && a.available_capacity !== 0;
        const availableCenters = (res.centers || []).filter(center => center.sessions.find(availabilityCheck));

        const embedMessage = {
          color: 0x81b214,
          fields: [],
        };

        // Populate polling stats
        if (err) {
          pollStats[key].fail++;
        } else {
          pollStats[key].success++;
        }

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
            value: `${pollStats[key].success} (+${pollStats[key].success - oldPollStats[key].success})`,
            inline: true,
          });

          embedMessage.fields.push({
            name: '❌ Polls',
            value: `${pollStats[key].fail} (+${pollStats[key].fail - oldPollStats[key].fail})`,
            inline: true,
          });

          if (pollingStarted) {
            oldPollStats[key] = {...pollStats[key]};
          }

          embedMessage.color = pollingStarted ? 0x00adb5 : 0xfb3640;
          msg.channel.send({ embed: embedMessage });
        } else if (availableCenters.length !== 0) {
          msg.channel.send({ embed: {
            title: ':warning: GOTDAM VACCINE SLOTS AVAILABLE :warning:',
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
                  value: ses.slots.join(', ') || 'None',
                  inline: true,
                });
              });

            msg.channel.send({ embed: embedMessage });
          });

          // Clear polling if found.
          clearInterval(pollIntervals[key]);
          delete pollIntervals[key];
        }
      });

      // Setup polling.
      if (!pollIntervals[key]) {
        pollIntervals[key] = setInterval(getList, INTERVAL);
      }
    }

    if (!(arg2 === 'clear')) {

      if (params.pincode) {
        getList(true);
      } else {
        // Callback hell ik, we can't use promise based library :(
        getStates(() =>
          getDistricts(arg2,
            function callback(err) {
              params.district_id = findDistrict(arg2, arg3).district_id;

              // Show error message, if any error occurs.
              if (err || !params.district_id) {
                msg.channel.send({embed: {
                  description: `Wrong state or district ${arg2} ${arg3}, wyd even?`,
                }});
                return;
              }

              // GETS THE FINAL LIST.
              getList(true);
            }));
      }
    } else {
      // Clear polling conditionally.
      if (pollIntervals[key]) {
        msg.channel.send({embed: {
          description: `Cleared Polling for ${key}`,
        }});

        clearInterval(pollIntervals[key]);
        delete pollIntervals[key];
      } else {
        msg.channel.send({embed: {
          description: `No polling started for ${key}, wyd even?`,
        }});
      }
    }
  }
});

/**
 * Checks if the arguments passed is valid or not
 *
 * @param message the current message.
 * @returns True, if args are valid.
 */
function argCheckValid(message) {
  const [arg1, arg2, arg3, ...arg4] = message.split(' ');

  if (!arg2) return false;
  if (arg2 === 'clear' && !isValidPincode(arg3) && !arg4) return false;

  return true;
}

/**
 * Checks if the pin is valid or not.
 *
 * @param pin The Pincode to check.
 * @returns True, if pin is valid.
 */
function isValidPincode(pin) {
  return /^[1-9]{1}[0-9]{5}$/.test(pin);
}

/**
 * Gets the list of states.
 *
 * @param cb The callback function.
 */
function getStates(cb) {
  // Early return if statesData exists.
  if (statesData) {
    cb();
    return;
  }

  getRequest({url: 'https://cdn-api.co-vin.in/api/v2/admin/location/states'}, res => {
    statesData = {};
    res.states.forEach(state => {
      statesData[state.state_id] = state;
    });
    cb();
  });
}

/**
 * Gets the list of district for the given state.
 *
 * @param state The state to check
 * @param cb    The callback function
 */
function getDistricts(state, cb){
  const stateId = findState(state).state_id;

  // Return error if not found.
  if (!stateId || !statesData[stateId]) {
    cb(true);
    return;
  }

  // Early return if found.
  if (statesData[stateId].districts) {
    cb();
    return;
  }

  getRequest({url: `https://cdn-api.co-vin.in/api/v2/admin/location/districts/${stateId}` }, d => {
    statesData[stateId].districts = (d || {}).districts;
    cb();
  });
}

/**
 * Find the state object from the statesData.
 *
 * @param state The state to find.
 * @returns The selected state, if any.
 */
function findState(state) {
  return Object.values(statesData).find(s => s.state_name.toLowerCase() === state.toLowerCase()) || {};
}

/**
 * Find the district object from the statesData.
 *
 * @param state    The state of the district.
 * @param district The district to find.
 * @returns The selected district, if any.
 */
function findDistrict(state, district) {
  const stateId = findState(state).state_id;
  if (!stateId) return {};
  return statesData[stateId].districts.find(d => d.district_name.toLowerCase() === district.toLowerCase()) || {};
}

/**
 * Using native https request to get the list of centers.
 *
 * @param params The URL params.
 * @param callback The callback function.
 */
function getRequest(params, callback) {
  const urlObj = new URL(params.url);
  const { url, ...searchParams } = params;

  // Set the url params.
  Object.keys(searchParams).forEach(key => urlObj.searchParams.set(key, params[key]));

  // The request options.
  const options = {
    hostname: urlObj.hostname,
    port: 443,
    path: `${urlObj.pathname}${urlObj.search}`,
    method: 'GET',

    // Add user-agent header to bypass sometimes 403 errors.
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
    }
  };

  // Make the API call.
  const req = https.request(options, res => {
    res.setEncoding('utf8')
    let response = '';

    res.on('data', res => response = response + res);

    res.on('end', d => {
      console.log(res.statusCode, `${urlObj.pathname}${urlObj.search}`);

      if (res.statusCode != 200) {
        callback({}, true);
      } else {
        callback(typeof response === 'string' ? JSON.parse(response) : response);
      }
    })
  });

  req.on('error', error => {
    console.error(error);
  });

  req.end();
}
