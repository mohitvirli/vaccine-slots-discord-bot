# vaccine-slots-discord-bot :eyes: 

Add a bot to know if the covid vaccination slots are available for 18+. I hope this helps in these dire times.

 - If you are brand new to creating discord bot refer this [Sitepoint tutorial](https://www.sitepoint.com/discord-bot-node-js/)
 - If you do know how to create a bot you would just need the discord server credentials.

## Requirements

- [Node.js](http://nodejs.org/)
- [Discord](https://discordapp.com/) Account/Server
- Indian Nationality?

## Installation Steps 

1. Clone repo `git clone https://github.com/mohitvirli/vaccine-slots-discord-bot.git`
2. Run `npm install`
3. Add Discord credentials in a `.env` file. Set `INTERVAL` for polling as well.
   ```sh
        #.env file
        TOKEN=AUTH_TOKEN_FROM_DISCORD
        INTERVAL=10000
   ```
3. Run `node index.js` (Need to run this for the time you need polling for)
4. Go to discord channel to test the bot.

## Usage
Use the `-vaccine` message in the channel you want to recieve the notification in.
#### Normal usage `-vaccine [pincode] [clear]`
- `-vaccine` or `-vaccine help`
- ![image](https://user-images.githubusercontent.com/11966122/116817266-18331b00-ab83-11eb-8875-89c90ede4020.png)
- `vaccine 560103`
- ![image](https://user-images.githubusercontent.com/11966122/116817177-cb4f4480-ab82-11eb-9c9e-d8cabce0bc70.png)
- If you run the command again for the same PIN `-vaccine 560103`
- ![image](https://user-images.githubusercontent.com/11966122/116817340-7829c180-ab83-11eb-9b2e-a88dcca80fbf.png)
- If anything's found (good luck) like `-vaccine 302018`
- ![image](https://user-images.githubusercontent.com/11966122/116817367-a5766f80-ab83-11eb-9988-f40e0f60f484.png)
- Clear the polling if you do not want to. `-vaccine 560103 clear` 
- ![image](https://user-images.githubusercontent.com/11966122/116817406-cd65d300-ab83-11eb-8c37-5d2f0aa1b90e.png)

## Future Notes
Idk what the future holds, let me know if you need any help with setting this up or any new feature that you need etc.
# Thanks.
