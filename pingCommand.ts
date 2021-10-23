import { Client, CommandInteraction } from "discord.js";

export async function execute(client: Client, interaction: CommandInteraction) {
  return interaction.reply("pong!");
}

export const manifest = {
  permissionType: "ALL",
  content: {
    name: "ping",
    description: "Stuurt pong terug!",
  },
};

export default {
  execute,
  manifest,
};
