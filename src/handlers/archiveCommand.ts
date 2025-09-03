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
			(channel) => channel.name?.includes("events") && channel.type === 4,
		);
		const archivesCategorys = channels.filter(
			(channel) => channel.name?.includes("archives") && channel.type === 4,
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
					type: 4,
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
					type: 4,
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

		await c.rest(
			"PATCH",
			_guilds_$_channels,
			[guild.id],
			[
				{
					id: c.interaction.channel.id,
					parent_id: archivesCategory.id,
					position: 0,
				},
			],
		);

		return c.res({
			content: `Archived this channel to ${archivesCategory.name} category.`,
			flags: MessageFlags.Ephemeral,
		});
	},
);
