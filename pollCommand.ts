import {
  Client,
  CommandInteraction,
  GuildMember,
  MessageActionRow,
  MessageButton,
  MessageButtonOptions,
  MessageEmbed,
  MessageOptions,
  MessagePayload,
  TextChannel,
  User,
} from "discord.js";

import path from "path";
import { mkdir, readdir, writeFile } from "fs-extra";

export async function execute(client: Client, interaction: CommandInteraction) {
  let guild = await client.guilds.fetch("375636201648160768");
  let member = (await guild.members.fetch(interaction.user.id)) as GuildMember;
  if (!member) {
    return noPerm(interaction);
  }
  let role = member.roles.resolve("489483634571739166");
  if (!role) {
    return noPerm(interaction);
  }
  if (!interaction.guild) {
    return interaction.reply(":x: Deze actie werkt alleen in servers.");
  }
  let channel = interaction.options.getChannel("kanaal");
  if (!channel) {
    return;
  } else if (channel.type != "GUILD_TEXT") {
    return interaction.reply(
      ":x: Je hebt geen tekstkanaal geselecteerd. Kies een ander kanaal en probeer het opnieuw."
    );
  }
  await interaction.deferReply();
  let waardes = [];

  for (let i = 1; i <= 5; i++) {
    let waarde = interaction.options.getString("waarde-" + i);
    if (waarde) {
      waardes.push(waarde);
    }
  }
  let rows: MessageActionRow[] = [];

  waardes.forEach((waarde, index) => {
    let row = new MessageActionRow();
    let button = new MessageButton({
      style: "DANGER",
      customId: `waarde_${index + 1}_vote`,
      label: waarde,
    } as MessageButtonOptions);
    row.addComponents(button);
    rows.push(row);
  });

  let payload = MessagePayload.create(
    channel as TextChannel,
    {
      components: rows,
      content: interaction.options.getString("titel") || "[POLL]",
    } as MessageOptions
  );

  try {
    let json: any = {};
    let fields = waardes.map((i, n) => {
      json["waarde_" + (n + 1)] = {
        name: i,
        votes: [],
      };
      return {
        name: i,
        value: "0 stem(men)",
        inline: true,
      };
    });
    let pollMessage = await (channel! as TextChannel).send(payload);

    let url =
      "https://discord.com/channels/" +
      pollMessage.guildId +
      "/" +
      pollMessage.channelId +
      "/" +
      pollMessage.id;
    let resultsRow = new MessageActionRow({
      components: [
        new MessageButton({
          customId: "poll_list_" + pollMessage.id + "_" + interaction.user.id,
          style: "SECONDARY",
          label: "Krijg lijst met namen",
          emoji: "🧑‍🤝‍🧑",
        }),
      ],
    });

    let resultsPayload = MessagePayload.create(
      interaction.channel as TextChannel,
      {
        components: [resultsRow],
        content:
          ":white_check_mark: Je poll is aangemaakt! Ga naar <#" +
          channel!.id +
          "> om het resultaat te zien.",
        embeds: [
          new MessageEmbed({
            title: "Poll resultaten",
            description: interaction.options.getString("titel") || "[POLL]",
            timestamp: new Date(),
            color: 0xff0000,
            fields,
            footer: { text: "Gemaakt op: " },
            author: {
              name: interaction.member!.user.username,
              icon_url:
                (interaction.member!.user as User).avatarURL() || undefined,
              url,
            },
          }),
        ],
      }
    );
    let message = await interaction.editReply(resultsPayload);
    json["messageId"] = message.id;
    json["channelId"] = channel.id;

    try {
      try {
        await readdir(path.join(process.cwd(), "data", "polls"));
      } catch (e: any) {
        if (e.code == "ENOENT") {
          await mkdir(path.join(process.cwd(), "data", "polls"));
        } else {
          throw e;
        }
      }
      await writeFile(
        path.join(process.cwd(), "data", "polls", pollMessage.id + ".json"),
        JSON.stringify(json)
      );
    } catch (e) {
      pollMessage.delete();
      throw e;
    }
  } catch (e) {
    console.error(e);
    interaction.editReply(
      ":warning: Er is iets fout gegeaan met het aanmaken van je poll."
    );
  }
}

function noPerm(interaction: CommandInteraction) {
  return interaction.reply(
    ":warning: Je hebt geen permissie om dit command uit te voeren.\n Je moet **Crew** zijn om dit command uit te kunnen voeren."
  );
}

export const manifest = {
  permissionType: "CREW",
  content: {
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
};

export default {
  execute,
  manifest,
};
