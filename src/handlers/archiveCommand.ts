import { ChannelType, MessageFlags } from "discord-api-types/v10";
import { _guilds_$_channels, Command } from "discord-hono";
import { factory } from "../init.js";

export const command_archive = factory.command(
	new Command("archive", "archive event"),
	async (c) => {
		const guild = c.interaction.guild;
		if (!guild)
			return c.res({
				content: "This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});

		const channelsRes = await c.rest("GET", _guilds_$_channels, [guild.id]);
		if (!channelsRes.ok)
			return c.res({
				content: `Failed to fetch channels: ${channelsRes.status} ${channelsRes.statusText}`,
				flags: MessageFlags.Ephemeral,
			});
		const channels = await channelsRes.json();

		const eventsCategorys = channels.filter(
			(channel) => channel.name?.includes("events") && channel.type === ChannelType.GuildCategory,
		);
		const archivesCategorys = channels.filter(
			(channel) => channel.name?.includes("archives") && channel.type === ChannelType.GuildCategory,
		);

		let eventsCategory = eventsCategorys[0];
		let archivesCategory = archivesCategorys[0];

		if (!eventsCategory) {
			const createdEventCategoryRes = await c.rest(
				"POST",
				_guilds_$_channels,
				[guild.id],
				{
					name: "events",
					type: ChannelType.GuildCategory,
					position: 0,
				},
			);
			const createdEventCategory = await createdEventCategoryRes.json();
			eventsCategory = createdEventCategory;
		}
		if (!archivesCategory) {
			const createdArchivesCategoryRes = await c.rest(
				"POST",
				_guilds_$_channels,
				[guild.id],
				{
					name: "archives",
					type: ChannelType.GuildCategory,
					position: 1,
				},
			);
			const createdArchivesCategory = await createdArchivesCategoryRes.json();
			archivesCategory = createdArchivesCategory;
		}

		if (
			c.interaction.channel.type === ChannelType.GuildText &&
			c.interaction.channel.parent_id !== eventsCategory.id
		) {
			return c.res({
				content: `This command can only be used in a text channel under the ${eventsCategory.name} category.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const archiveChannels = channels.filter(
			(channel) => channel.type === ChannelType.GuildText && channel.parent_id === archivesCategory.id,
		);

		// YYYY-MM-DD-EventName
		const archivesDate = archiveChannels
		.map(
			(channel) => channel?.name?.split("-").splice(0, 3).join("-"))
		.filter(
			(name): name is string => typeof name === "string",
		).map(
			(name) => new Date(name),
		).sort((a, b) => b.getTime() - a.getTime());

		const targetDate = new Date(
			`${c.interaction.channel.name?.split("-").splice(0, 3).join("-")}T00:00:00`,
		);

		const position = archivesDate.findIndex((date) => targetDate >= date) + 1;

		// move to archives category
		
		await c.rest(
			"PATCH",
			_guilds_$_channels,
			[guild.id],
			[
				{
					id: c.interaction.channel.id,
					parent_id: archivesCategory.id,
					position: position
				},
			],
		);

		return c.res({
			content: `Archived this channel to ${archivesCategory.name} category.`,
			flags: MessageFlags.Ephemeral,
		});
	},
);
