import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ButtonInteraction, Client, Intents, TextChannel } from "discord.js";
import config from "./data/config.json";
import pingCommand from "./pingCommand";
import roleCommand from "./roleCommand";
import pollCommand from "./pollCommand";
import pollButtonHandler from "./pollButtonHandler";
import pollResultButtonHandler from "./pollResultButtonHandler";

const rest = new REST({ version: "9" }).setToken(config.token);

const commands = [pingCommand, pollCommand, roleCommand];

async function removeCommandMessages(client: Client) {
  let channel = (await client.channels.fetch(
    config.clear_channel_id
  )) as TextChannel;
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
    await rest.put(Routes.applicationCommands(config.app_id), {
      body: commands.map((command) => command.manifest.content),
    });

    // Krijg een lijstje met alle huidige actieve commands
    let curr_commands = (await rest.get(
      Routes.applicationCommands(config.app_id)
    )) as any[];
    let permission_data: { id: string; permissions: any }[] = [];

    // Filter commands die nieuwe permission overwrites nodig hebben
    curr_commands.forEach((command: { id: string; name: string }) => {
      let filtered = commands.filter(
        (c) => c.manifest.content.name == command.name
      );
      if (filtered.length > 0) {
        switch (filtered[0].manifest.permissionType) {
          case "ALL":
            return;
          case "CREW":
            permission_data.push({
              id: command.id,
              permissions: [
                {
                  id: config.crew_role,
                  type: 1,
                  permission: true,
                },
                {
                  id: config.bot_owner_id,
                  type: 2,
                  permission: true,
                },
              ],
            });
            break;
          default:
            throw (
              "Onbekend permission type: " + filtered[0].manifest.permissionType
            );
        }
      }
    });
    // indien permission overwrites nodig zijn, voeg die toe aan de globale lijst.
    if (permission_data.length > 0) {
      await rest.put(
        Routes.guildApplicationCommandsPermissions(
          config.app_id,
          "375636201648160768"
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
        await pingCommand.execute(client, interaction);
        break;
      case "role":
        await roleCommand.execute(client, interaction);
        break;
      case "maakpoll":
        await pollCommand.execute(client, interaction);
    }
  });

  client.login(config.token);
};

start();

async function handleButton(client: Client, interaction: ButtonInteraction) {
  const buttons = [pollButtonHandler, pollResultButtonHandler].filter((i) =>
    i.filter.test(interaction.customId)
  );
  if (buttons.length == 0) {
    return;
  }
  buttons[0].execute(client, interaction);
}

async function editInfoMessage(client: Client) {
  let x = await client.guilds.fetch("375636201648160768");
  let y = await x.channels.fetch("378156957070000139");
  let z = await (y as TextChannel).messages.fetch("678653356356665418");
  z.edit(
    "> **De bot gebruikt vanaf nu slash (/) commands. **\n > \n > /role <rolenaam> - Krijg de uit de lijst gekozen role.\n\n:warning:  Wij raden aan om dit kanaal te muten!\n\n:grey_exclamation: Berichten worden automatisch verwijderd."
  );
}
