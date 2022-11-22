import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ButtonInteraction, Client, Intents, TextChannel } from "discord.js";
import config from "./data/config.json";
import pingCommand from "./pingCommand";
import pollCommand from "./pollCommand";
import pollButtonHandler from "./pollButtonHandler";
import pollResultButtonHandler from "./pollResultButtonHandler";
import setupRoleListener from "./setupRoleListener";
import roleHandler from "./roleHandler";

const rest = new REST({ version: "9" }).setToken(config.token);

const commands = [pingCommand, pollCommand, setupRoleListener];

async function refreshCommands() {
	try {
		console.log("[REFRESH] Start refreshing / commands");

		// voeg commands toe, override meteen oude. Indien een al-bestaand command niet in de lijst staat, zal hij binnen een uur "wegfaden".
		await rest.put(Routes.applicationCommands(config.app_id), {
			body: commands.map((command) => command.manifest.content),
		});
		console.log("[REFRESH] Finished refreshing / commands");
	} catch (error) {
		console.error(error);
		console.error((error as any).rawError);
		throw error;
	}
}

let start = async () => {
	const client = new Client({
		intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
	});
	await refreshCommands();

	client.on("ready", async () => {
		console.log(
			`[CLIENT] Initialization complete. User: ${client.user?.tag}!`
		);
	});

	client.on("interactionCreate", async (interaction) => {
		if (interaction.isButton()) {
			if (interaction.customId.startsWith("ROLE:")) {
				await roleHandler(interaction);
				return;
			}
			return handleButton(client, interaction);
		}

		if (!interaction.isCommand()) return console.log(interaction);

		switch (interaction.commandName) {
			case "ping":
				await pingCommand.execute(client, interaction);
				break;
			case "maakpoll":
				await pollCommand.execute(client, interaction);
				break;
			case "role-setup":
				await setupRoleListener.execute(client, interaction);
		}
	});

	client.login(config.token);
};

start();

async function handleButton(client: Client, interaction: ButtonInteraction) {
	const buttons = [pollButtonHandler, pollResultButtonHandler].filter((i) =>
		i.filter.test(interaction.customId)
	);
	if (buttons.length == 0) {
		return;
	}
	buttons[0].execute(client, interaction);
}

