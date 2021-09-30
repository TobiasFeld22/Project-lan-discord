import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ButtonInteraction, Client, Intents, TextChannel } from "discord.js";
import config from "./data/config.json";
import pingCommand from "./pingCommand";
import roleCommand from "./roleCommand";
import testCommand from "./testCommand";

const rest = new REST({ version: "9" }).setToken(config.token);
let channelId = "378156957070000139";

const commands = [
  {
    name: "ping",
    description: "Stuurt pong terug!",
  },
  {
    name: "role",
    description: "vraag een bepaalde role aan.",
    options: [
      {
        name: "role",
        description: "Kies de rol die bij je wilt krijgen",
        required: true,
        type: 3,
        choices: [
          {
            name: "GameBattle",
            value: "GB",
          },
          {
            name: "CLV-LAN",
            value: "CLV-LAN",
          },
          {
            name: "Playstation",
            value: "playstation",
          },
          {
            name: "PC",
            value: "pc",
          },
          {
            name: "Xbox",
            value: "xbox",
          },
          {
            name: "Nintendo Switch",
            value: "switch",
          },
        ],
      },
    ],
  },
];
const commandsTest = [
  {
    name: "test",
    description: "test",
  },
];

async function removeCommandMessages(client: Client) {
  let channel = (await client.channels.fetch(channelId)) as TextChannel;
  try {
    let messages = await channel.messages.fetch({
      limit: 20,
      after: "678653356356665418",
    });

    messages
      .filter((message) => {
        return message.createdTimestamp + 10000 < new Date().getTime();
      })
      .forEach((message) => message.delete());
  } catch (error) {
    console.error(error);
  }
}

async function refreshCommands() {
  try {
    console.log("[REFRESH] Start refreshing / commands");

    await rest.put(Routes.applicationCommands("378146092413353985"), {
      body: commands,
    });
    await rest.put(
      Routes.applicationGuildCommands(
        "378146092413353985",
        "237019583972638720"
      ),
      {
        body: commandsTest,
      }
    );
    console.log("[REFRESH] Finished refreshing / commands");
  } catch (error) {
    console.error(error);
    console.error((error as any).rawError);
    throw error;
  }
}

let start = async () => {
  const client = new Client({ intents: [Intents.FLAGS.GUILD_MEMBERS] });
  await refreshCommands();

  client.on("ready", async () => {
    console.log(`[CLIENT] Initialization complete. User: ${client.user?.tag}!`);
    await removeCommandMessages(client);

    // await editInfoMessage(client);

    setInterval(() => {
      refreshCommands();
      removeCommandMessages(client);
    }, 3300000);
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
      return handleButton(client, interaction);
    }

    if (!interaction.isCommand()) return console.log(interaction);

    switch (interaction.commandName) {
      case "ping":
        await pingCommand(client, interaction);
        break;
      case "role":
        await roleCommand(client, interaction);
        break;
      case "test":
        await testCommand(client, interaction);
    }
  });

  client.login(config.token);
};

start();

async function handleButton(client: Client, interaction: ButtonInteraction) {
  switch (interaction.customId) {
    case "button_test":
      interaction.reply({ ephemeral: true, content: "test" });
      break;
  }
}

async function editInfoMessage(client: Client) {
  let x = await client.guilds.fetch("375636201648160768");
  let y = await x.channels.fetch("378156957070000139");
  let z = await (y as TextChannel).messages.fetch("678653356356665418");
  z.edit(
    "> **De bot gebruikt vanaf nu slash (/) commands. **\n > \n > /role <rolenaam> - Krijg de uit de lijst gekozen role.\n\n:warning:  Wij raden aan om dit kanaal te muten!\n\n:grey_exclamation: Berichten worden automatisch verwijderd."
  );
}
