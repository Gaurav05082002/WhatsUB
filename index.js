const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const config = require("./config.js");
const { checkSessionAndLoad } = require("./functions/sessions.js");
const cleanup = require("./functions/cleanup.js");

(async () => {
  // clearing up old zip files if any
  await cleanup();

  // check and load old session
  const _oldSessionLoaded = await checkSessionAndLoad();

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: "./WhatsUB",
    }),
    puppeteer: { headless: true, args: ["--no-sandbox"] },
  });

  // load modules
  // https://github.com/tuhinpal/WhatsBot/blob/main/main.js#L18-L27
  client.commands = new Map();
  fs.readdir("./modules", (err, files) => {
    if (err) return console.error(err);
    files.forEach((commandFile) => {
      if (commandFile.endsWith(".js")) {
        let commandName = commandFile.replace(".js", "");
        const command = require(`./modules/${commandName}`);
        client.commands.set(commandName, command);
      }
    });
  });

  client.on("qr", (qr) => {
    console.log("Generating QR Code...");
    console.log("QR RECEIVED", qr);
    console.log(qrcode.generate(qr, { small: true }));
  });

  client.on("authenticated", async () => {
    console.log("Authenticated!");
  });
  client.on("ready", async () => {
    // console.log(get_session);
    // if (await get_session == false) {
    //   await storeSession();
    // }
    console.log(
      "\n\t\tWhatsUB has started!\n\t©️ @xditya < https://xditya.me >"
    );
  });

  client.on("message_create", async (msg) => {
    // https://github.com/tuhinpal/WhatsBot/blob/main/main.js#L18-L27
    if (msg.fromMe && msg.body.startsWith(config.CMD_HANDLER || "!")) {
      let args = msg.body.slice(1).trim().split(/ +/g);
      let command = args.shift().toLowerCase();

      if (client.commands.has(command)) {
        try {
          await client.commands.get(command).execute(client, msg, args);
        } catch (error) {
          console.log(error);
        }
      }
    }
  });

  console.log("Initializing Client...");
  client.initialize();
})().catch((e) => {
  console.error(e);
});
