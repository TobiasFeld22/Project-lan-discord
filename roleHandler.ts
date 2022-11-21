import { ButtonInteraction, GuildMember } from "discord.js";

export default async function (interaction: ButtonInteraction) {
	try {
		await interaction.deferReply({ fetchReply: true, ephemeral: true });
		switch (interaction.customId.replace("ROLE:", "")) {
			case "GB":
				await addOrTakeRole(interaction, "1044395562843246732");
				break;
			case "CLV_LAN":
				await addOrTakeRole(interaction, "537062265044598787");
				break;
			case "PS":
				await addOrTakeRole(interaction, "378149902288420875");
				break;
			case "PC":
				await addOrTakeRole(interaction, "378149906780520449");
				break;
			case "XBOX":
				await addOrTakeRole(interaction, "378149909229993984");
				break;
			case "SWITCH":
				await addOrTakeRole(interaction, "893124702099345438");
				break;
		}
	} catch (error) {
		console.error(error);
		return interaction.followUp({
			content:
				"Er ging iets mis met het geven van je role, probeer het later opnieuw.",
		});
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

async function getRoleName(interaction: ButtonInteraction, roleID: string) {
	let role = await interaction.guild?.roles.fetch(roleID);
	return role?.name || "";
}

async function addOrTakeRole(interaction: ButtonInteraction, roleID: string) {
	let member = await interaction.guild?.members.fetch(
		interaction.member!.user.id
	)!;
	let roleName = await getRoleName(interaction, roleID);

	if (!(await hasRole(member, roleID))) {
		await addRole(member, roleID);
		interaction.followUp({
			content: "Ik heb je de role **" + roleName + "** gegeven.",
		});
	} else {
		await removeRole(member, roleID);
		interaction.followUp({
			content: "Ik heb je de role **" + roleName + "** afgenomen.",
		});
	}
}
