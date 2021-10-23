import { ChannelType } from "discord-api-types";
import {
  Client,
  CommandInteraction,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageButtonOptions,
  MessageOptions,
  MessagePayload,
  MessageSelectMenu,
  MessageSelectOptionData,
  TextChannel,
} from "discord.js";

export default async function pollCommand(
  client: Client,
  interaction: CommandInteraction
) {
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
      customId: `waarde_${index}_vote`,
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
    let x = await (channel! as TextChannel).send(payload);
    await interaction.editReply(
      ":white_check_mark: Je poll is aangemaakt! Ga naar <#" +
        channel!.id +
        "> om het resultaat te zien."
    );
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
