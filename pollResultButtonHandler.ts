import { ButtonInteraction, Client } from "discord.js";
import { readFile } from "fs-extra";
import path from "path";

export async function execute(client: Client, interaction: ButtonInteraction) {
  let args = interaction.customId.replace("poll_list_", "").split("_");
  let user = args[1];
  let message = args[0];

  if (user != interaction.user.id) {
    return interaction.reply({
      content:
        ":x: Je hebt geen permissie om deze knop te kunnen gebruiken.\nDeze knop kan alleen gebruikt worden door de maker van de poll.",
      ephemeral: true,
    });
  }
  await interaction.deferReply({ ephemeral: true });
  let votes = new Map();
  try {
    let raw_json = await readFile(
      path.join(process.cwd(), "data", "polls", message + ".json"),
      "utf8"
    );
    let json = JSON.parse(raw_json);
    let keys = Object.keys(json).filter((i) => i.includes("waarde"));
    keys.forEach((key, index) => {
      let content = json[key];

      content.votes.forEach((vote: string) => {
        let data = votes.get(vote) || [];
        data.push(json[key].name + " (" + index + ")");
        votes.set(vote, data);
      });
    });
    if (votes.size == 0) {
      return interaction.editReply(
        ":people_holding_hands: Er heeft nog niemand op deze poll gereageerd."
      );
    } else {
      return interaction.editReply(
        ":people_holding_hands: Poll deelnemers:\n\n" +
          Array.from(votes)
            .map((i) => "<@" + i[0] + "> | " + i[1].join("•"))
            .join("\n")
      );
    }
  } catch (e) {
    console.error(e);
    await interaction.editReply(
      ":warning: Er is iets misgegaan met het ophalen van de lijst"
    );
  }
}

export default {
  execute,
  filter: /poll_list_\d+_\d+/,
};
