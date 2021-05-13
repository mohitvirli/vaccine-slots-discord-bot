# vaccine-slots-discord-bot :eyes: 

Add a bot to know if the covid vaccination slots are available for 18+ with simple commands like `-vaccine 560103` or `-vaccine karnataka udupi`. I hope this helps in these dire times. 

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
4. Go to your discord channel to test the bot.

## Usage
Use the `-vaccine` message in the channel you want to recieve the notification in.
#### Normal usage `-vaccine [clear] | [pincode] | [state district]`
- `-vaccine`
<br /><img src="https://user-images.githubusercontent.com/11966122/118185312-04789600-b45a-11eb-94c8-f52444f77188.png" width="400">
- `-vaccine 560103` or `-vaccine karnataka bbmp` or `-vaccine rajasthan jaipur`
<br /><img src="https://user-images.githubusercontent.com/11966122/118185916-b7e18a80-b45a-11eb-8d0b-dff11d8eb884.png" width="350">
- If anything's found (good luck) like `-vaccine 560034`
<br /><img src="https://user-images.githubusercontent.com/11966122/118186303-35a59600-b45b-11eb-8b8c-9f2246da2c55.png" width="400">
- Clear the polling if you do not want to. `-vaccine clear 560103` or `-vaccine clear karnataka bangalore urban` 
<br />![image](https://user-images.githubusercontent.com/11966122/116817406-cd65d300-ab83-11eb-8c37-5d2f0aa1b90e.png)

## Future Notes
Idk what the future holds, let me know if you need any help with setting this up or any new feature that you need etc.
# Thanks.
