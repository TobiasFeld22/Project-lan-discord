import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ButtonInteraction, Client, Intents, TextChannel } from "discord.js";
import config from "./data/config.json";
import pingCommand from "./pingCommand";
import roleCommand from "./roleCommand";
import pollCommand from "./pollCommand";

const rest = new REST({ version: "9" }).setToken(config.token);

const APP_ID = "378146092413353985";
let channelId = "378156957070000139";

let crewApps = new Map();
crewApps.set("maakpoll", {
  id: "489483634571739166",
  type: 1,
  permission: true,
});

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
  {
    name: "maakpoll",
    description: "Maak een nieuwe poll aan. Alleen voor Project:Lan crew",
    options: [
      {
        name: "titel",
        description: "Het bericht dat boven de poll komt te staan.",
        required: true,
        type: 3,
      },
      {
        name: "kanaal",
        description: "Het kanaal waar de poll naar wordt verstuurd.",
        required: true,
        type: 7,
      },
      {
        name: "waarde-1",
        description: "Optie 1 voor de poll",
        required: true,
        type: 3,
      },
      {
        name: "waarde-2",
        description: "Optie 2 voor de poll",
        required: true,
        type: 3,
      },
      {
        name: "waarde-3",
        description: "Optie 3 voor de poll",
        required: false,
        type: 3,
      },
      {
        name: "waarde-4",
        description: "Optie 4 voor de poll",
        required: false,
        type: 3,
      },
      {
        name: "waarde-5",
        description: "Optie 5 voor de poll",
        required: false,
        type: 3,
      },
    ],
    default_permission: false,
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

    // voeg commands toe, override meteen oude. Indien een al-bestaand command niet in de lijst staat, zal hij binnen een uur "wegfaden".
    await rest.put(Routes.applicationCommands(APP_ID), {
      body: commands,
    });

    // Krijg een lijstje met alle huidige actieve commands
    let curr_commands = (await rest.get(
      Routes.applicationCommands(APP_ID)
    )) as any[];
    let permission_data: { id: string; permissions: any }[] = [];

    // Filter commands die nieuwe permission overwrites nodig hebben
    curr_commands.forEach((command: any) => {
      if (crewApps.has(command.name)) {
        permission_data.push({
          id: command.id,
          permissions: [crewApps.get(command.name)],
        });
      }
    });
    // indien permission overwrites nodig zijn, voeg die toe aan de globale lijst.
    if (permission_data.length > 0) {
      await rest.put(
        Routes.guildApplicationCommandsPermissions(
          APP_ID,
          "375636201648160768"
        ),
        {
          body: permission_data,
        }
      );

      // Pas de globale permissions ook toe op de owner van de bot :)
      permission_data.forEach((i) => {
        i.permissions[0].id = "218459651098935297";
        i.permissions[0].type = 2;
      });

      await rest.put(
        Routes.guildApplicationCommandsPermissions(
          APP_ID,
          "237019583972638720"
        ),
        {
          body: permission_data,
        }
      );
    }

    console.log("[REFRESH] Finished refreshing / commands");
  } catch (error) {
    console.error(error);
    console.error((error as any).rawError);
    throw error;
  }
}

let start = async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
  });
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
      case "maakpoll":
        await pollCommand(client, interaction);
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
