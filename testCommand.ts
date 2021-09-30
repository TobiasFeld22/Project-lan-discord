import {
  Client,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageButtonOptions,
  MessageOptions,
  MessagePayload,
  TextChannel,
} from "discord.js";

export default async function test(
  client: Client,
  interaction: CommandInteraction
) {
  await interaction.reply("test!");
  let channel = (await client.channels.fetch(
    "237019716546199552"
  )) as TextChannel;

  let button = new MessageButton({
    style: "DANGER",
    customId: "button_test",
    label: "test",
  } as MessageButtonOptions);

  let row = new MessageActionRow();
  row.addComponents(button);
  let payload = MessagePayload.create(channel, {
    components: [row],
    content: "test",
  } as MessageOptions);
  await channel.send(payload);
}
