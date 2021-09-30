import { Client, CommandInteraction } from "discord.js";

export default async function ping(
  client: Client,
  interaction: CommandInteraction
) {
  return interaction.reply("pong!");
}
