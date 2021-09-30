import { APIInteractionGuildMember } from "discord-api-types";
import { Client, CommandInteraction, GuildMember } from "discord.js";

export default async function role(
  client: Client,
  interaction: CommandInteraction
) {
  if (!interaction.member) {
    return;
  }

  try {
    switch (interaction.options.getString("role", true)) {
      case "GB":
        await addOrTakeRole(interaction, "679705218497118225");
        break;
      case "CLV-LAN":
        await addOrTakeRole(interaction, "679705140382400558");
        break;
      case "playstation":
        await addOrTakeRole(interaction, "378149902288420875");
        break;
      case "pc":
        await addOrTakeRole(interaction, "378149906780520449");
        break;
      case "xbox":
        await addOrTakeRole(interaction, "378149909229993984");
        break;
      case "switch":
        await addOrTakeRole(interaction, "893124702099345438");
        break;
    }
  } catch (error) {
    console.error(error);
    return interaction.reply(
      "Er ging iets mis met het geven van je role, probeer het later opnieuw."
    );
  }
}

async function addOrTakeRole(interaction: CommandInteraction, role: string) {
  let member = await interaction.guild?.members.fetch(
    interaction.member!.user.id
  )!;

  if (!(await hasRole(member, role))) {
    await addRole(member, role);
    interaction.reply("Ik heb je de role gegeven.");
  } else {
    await removeRole(member, role);
    interaction.reply("Ik de role van je afgenomen.");
  }
}

function addRole(member: GuildMember, role: string) {
  return member.roles.add(role);
}

async function removeRole(member: GuildMember, role: string) {
  try {
    let x = await member.roles.remove(role);
  } catch (e) {
    console.error(e);
  }
}

async function hasRole(member: GuildMember, role: string) {
  let fetchedRole = await member.guild.roles.fetch(role);
  if (!fetchedRole) {
    return false;
  }
  return fetchedRole?.members.has(member.id);
}
