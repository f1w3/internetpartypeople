import { ChannelType, MessageFlags } from "discord-api-types/v10";
import { _guilds_$_channels, Command } from "discord-hono";
import { factory } from "../init";
import { sortChannelsByDate } from "../utils/sortChannelsByDate";

export const command_archive = factory.command(
	new Command("archive", "archive event"),
	async (c) => {
		const guild = c.interaction.guild;
		if (!guild) {
			return c.res({
				content: "This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const channelsRes = await c.rest("GET", _guilds_$_channels, [guild.id]);
		if (!channelsRes.ok) {
			return c.res({
				content: `Failed to fetch channels: ${channelsRes.status} ${channelsRes.statusText}`,
				flags: MessageFlags.Ephemeral,
			});
		}
		const channels = await channelsRes.json();

		// events / archivesカテゴリを取得
		const eventsCategory = channels.find(
			(ch) => ch.name === "events" && ch.type === ChannelType.GuildCategory,
		);
		let archivesCategory = channels.find(
			(ch) => ch.name === "archives" && ch.type === ChannelType.GuildCategory,
		);

		// 無ければ作成
		if (!archivesCategory) {
			const created = await c.rest("POST", _guilds_$_channels, [guild.id], {
				name: "archives",
				type: ChannelType.GuildCategory,
				position: 1,
			});
			archivesCategory = await created.json();
		}

		// 今いるチャンネルが events 配下か確認
		if (
			c.interaction.channel.type !== ChannelType.GuildText ||
			c.interaction.channel.parent_id !== eventsCategory?.id
		) {
			return c.res({
				content: `This command can only be used in a text channel under the events category.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		// archives内の既存チャンネル + 今回のチャンネルをまとめてソート
		const archiveChannels = channels.filter(
			(ch) =>
				ch.type === ChannelType.GuildText &&
				ch.parent_id === archivesCategory.id,
		);

		const targetChannel = c.interaction.channel;

		const sorted = sortChannelsByDate(archiveChannels, targetChannel, "desc");

		// bulk update で並び替え
		await c.rest(
			"PATCH",
			_guilds_$_channels,
			[guild.id],
			sorted.map((x, idx) => ({
				id: x.ch.id,
				parent_id: archivesCategory.id,
				position: idx,
			})),
		);

		return c.res({
			content: `Archived this channel to ${archivesCategory.name} category.`,
			flags: MessageFlags.Ephemeral,
		});
	},
);
