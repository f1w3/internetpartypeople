import { Command, register } from "discord-hono";

const commands = [
	new Command("create", "あなたのお家はどこですか?"),
	new Command("archive", "私の家は岐阜にあります。"),
];

register(
	commands,
	process.env.DISCORD_APPLICATION_ID,
	process.env.DISCORD_TOKEN,
	// process.env.DISCORD_TEST_GUILD_ID,
);
