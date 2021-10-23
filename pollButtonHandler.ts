import {
  ButtonInteraction,
  Client,
  Message,
  MessagePayload,
  TextChannel,
} from "discord.js";
import { readFile, writeFile } from "fs-extra";
import path from "path";

export async function execute(client: Client, interaction: ButtonInteraction) {
  if (/\d+/.test(interaction.message.id) == false) {
    return;
  }
  let id = interaction.customId.replace("_vote", "");
  await interaction.deferReply({
    ephemeral: true,
  });

  try {
    let raw_json = await readFile(
      path.join(
        process.cwd(),
        "data",
        "polls",
        interaction.message.id + ".json"
      ),
      "utf8"
    );
    let json = JSON.parse(raw_json);
    let did_add = false;
    if (json[id].votes.includes(interaction.user.id)) {
      json[id].votes = json[id].votes.filter(
        (i: string) => i != interaction.user.id
      );
    } else {
      did_add = true;
      json[id].votes.push(interaction.user.id);
    }
    await updateVoteInfo(interaction, json);
    if (did_add) {
      await interaction.editReply(
        ":white_check_mark: Ik heb je stem __toegevoegd__ voor optie: **" +
          json[id].name +
          "**"
      );
    } else {
      await interaction.editReply(
        ":white_check_mark: Ik heb je stem __weggehaald__ voor optie: **" +
          json[id].name +
          "**"
      );
    }
  } catch (e) {
    console.error(e);
    interaction.editReply(
      ":warning: Er is iets misgegaan bij jouw stem, probeer het later opnieuw"
    );
  }
}

async function updateVoteInfo(interaction: ButtonInteraction, json: any) {
  await writeFile(
    path.join(process.cwd(), "data", "polls", interaction.message.id + ".json"),
    JSON.stringify(json)
  );

  let channel = (await interaction.guild!.channels.fetch(
    json.channelId
  )) as TextChannel;
  if (!channel) {
    await interaction.editReply(":clock3: Deze poll is al afgerond..");
    await interaction.update({
      content: "Deze poll is afgelopen, bedankt voor de stemmen..",
    });
    return;
  }
  let message = (await channel.messages.fetch(json.messageId)) as Message;
  if (!message) {
    await interaction.editReply(":clock3: Deze poll is al afgerond..");
    await interaction.update({
      content: "Deze poll is afgelopen, bedankt voor de stemmen..",
    });
    return;
  }

  let keys = Object.keys(json).filter((i) => i.includes("waarde"));

  let fields = keys.map((i) => {
    return {
      name: json[i].name,
      value: json[i].votes.length + " stem(men)",
      inline: true,
    };
  });
  let embed = message.embeds[0];
  embed.setTimestamp(new Date());
  embed.setFooter("Laatst bijgewerkt op: ");
  embed.fields = fields;
  let payload = MessagePayload.create(channel, {
    content: "Poll resultaten",
    embeds: [embed],
  });

  await message.edit(payload);
}

export default {
  execute,
  filter: /waarde_\d_vote/,
};
