import { ChannelType, MessageFlags } from "discord-api-types/v10";
import { _guilds_$_channels, Modal, TextInput } from "discord-hono";
import { CONSTANTS } from "../constants.js";
import { factory } from "../init.js";
import { isValidDateString } from "../utils/isValidDateString.js";
import { sortChannelsByDate } from "../utils/sortChannelsByDate.js";

const modal = new Modal(CONSTANTS.MODAL.CREATE.NAME, "イベントを作成する")
	.row(
		new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_DATE, "イベント日")
			.placeholder("yyyy-mm-dd")
			.required(true),
	)
	.row(
		new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_NAME, "イベントの名前")
			.placeholder("INTERNET PARTY")
			.required(true),
	)
	.row(
		new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_URL, "イベントURL")
			.placeholder("https://internetparty.fun")
			.required(false),
	);

export const modal_create = factory.modal(modal, async (c) => {
	const eventDate = c.var.eventdate || "";
	const eventName = c.var.eventname || "";
	const eventUrl = c.var.eventurl || "";

	if (!isValidDateString(eventDate)) {
		return c.res({
			content: "Invalid date format. Please use yyyy-mm-dd.",
			flags: MessageFlags.Ephemeral,
		});
	}

	const guild = c.interaction.guild;
	if (!guild) {
		return c.res({
			content: "This command can only be used in a server.",
			flags: MessageFlags.Ephemeral,
		});
	}

	// guild内の全チャンネル取得
	const channelsRes = await c.rest("GET", _guilds_$_channels, [guild.id]);
	if (!channelsRes.ok) {
		return c.res({
			content: `Failed to fetch channels: ${channelsRes.status} ${channelsRes.statusText}`,
			flags: MessageFlags.Ephemeral,
		});
	}
	const channels = await channelsRes.json();

	// eventsカテゴリ取得 or 作成
	let eventsCategory = channels.find(
		(ch) =>
			ch.name?.includes("events") && ch.type === ChannelType.GuildCategory,
	);
	if (!eventsCategory) {
		const created = await c.rest("POST", _guilds_$_channels, [guild.id], {
			name: "events",
			type: ChannelType.GuildCategory,
			position: 0,
		});
		eventsCategory = await created.json();
	}

	// 新規チャンネル作成
	const newChannelRes = await c.rest("POST", _guilds_$_channels, [guild.id], {
		name: `${eventDate}-${eventName}`,
		type: ChannelType.GuildText,
		topic: eventUrl ?? "",
		parent_id: eventsCategory.id,
	});
	const newChannel = await newChannelRes.json();

	// eventsカテゴリ内のチャンネルを集めて日付降順にソート
	const eventChannels = channels.filter(
		(ch) =>
			ch.type === ChannelType.GuildText && ch.parent_id === eventsCategory.id,
	);
	const sorted = sortChannelsByDate(eventChannels, newChannel, "asc");

	// bulk PATCH で順番を反映
	await c.rest(
		"PATCH",
		_guilds_$_channels,
		[guild.id],
		sorted.map((x, idx) => ({
			id: x.ch.id,
			parent_id: eventsCategory.id,
			position: idx,
		})),
	);

	return c.res({
		content: `Created a new event channel in ${eventsCategory.name} category and sorted by date.`,
		flags: MessageFlags.Ephemeral,
	});
});
