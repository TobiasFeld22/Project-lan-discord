import {
	Client,
	CommandInteraction,
	InteractionReplyOptions,
	MessageActionRow,
	MessageButton,
} from "discord.js";
import { MessageButtonStyles } from "discord.js/typings/enums";

export async function execute(client: Client, interaction: CommandInteraction) {
	if (interaction.channel == null) {
		return interaction.reply({
			ephemeral: true,
			content: ":x: Dit command werkt alleen een normaal kanaal.",
		});
	}

	const topRow = new MessageActionRow();
	const bottomRow = new MessageActionRow();
	const buttons = [
		{
			name: "Aanwezig CLV-LAN 38",
			id: "CLV_LAN",
		},
		{
			name: "Aanwezig GameBattle 2023",
			id: "GB",
		},
		{
			name: "Playstation",
			id: "PS",
		},
		{
			name: "PC",
			id: "PC",
		},
		{
			name: "Xbox",
			id: "XBOX",
		},
		{
			name: "Nintendo Switch",
			id: "SWITCH",
		},
	].map((info) => {
		return new MessageButton({
			customId: `ROLE:${info.id}`,
			label: info.name,
			style: ["CLV_LAN", "GB"].includes(info.id)
				? MessageButtonStyles.DANGER
				: MessageButtonStyles.PRIMARY,
		});
	});

	topRow.addComponents(buttons[0], buttons[1]);
	bottomRow.addComponents(buttons[2], buttons[3], buttons[4], buttons[5]);

	try {
		await interaction.channel!.send({
			content:
				"<a:blob_controller:1044384216894427186> **Heyo! Kies hieronder een role om jouw interesses te laten zien.** *(wil je van de role af? Klik er nog een keertje op)* \n<:empty:1044384864243298334>\n<:empty:1044384864243298334>\n<:empty:1044384864243298334>\n<:empty:1044384864243298334>",
			components: [topRow, bottomRow],
		});
		return interaction.reply({
			ephemeral: true,
			content: ":white_check_mark: Toegevoegd!",
		} as InteractionReplyOptions);
	} catch (e) {
		console.error(e);
		return interaction.reply({
			ephemeral: true,
			content: ":warning: Er is iets misgegaan..",
		} as InteractionReplyOptions);
	}
}

export const manifest = {
	permissionType: "CREW",
	content: {
		name: "role-setup",
		description: "Stuurt role selectors in het huidige command",
	},
};

export default {
	execute,
	manifest,
};
