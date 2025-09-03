import { MessageFlags } from "discord-api-types/v10";
import { _guilds_$_channels, Modal, TextInput } from "discord-hono";
import { CONSTANTS } from "../constants.js";
import { factory } from "../init.js";

const modal = new Modal(CONSTANTS.MODAL.CREATE.NAME, "イベントを作成する")
	.row(
		new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_DATE, `イベント日`)
			.placeholder("yyyy-mm-dd")
			.required(true),
	)
	.row(
		new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_NAME, `イベントの名前`)
			.placeholder("INTERNET PARTY")
			.required(true),
	)
	.row(
		new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_URL, `イベントURL`)
			.placeholder("https://internetparty.fun")
			.required(false),
	);

export const modal_create = factory.modal(modal, async (c) => {
	const eventDate = c.var.eventdate;
	const eventName = c.var.eventname;
	const eventUrl = c.var.eventurl;

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

	let eventsCategory = eventsCategorys[0];

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

	await c.rest("POST", _guilds_$_channels, [guild.id], {
		name: `${eventName}-${eventDate}`,
		type: 0,
		topic: eventUrl ?? "",
		parent_id: eventsCategory.id,
	});

	return c.res({
		content: `Created a new event channel in ${eventsCategory.name} category.`,
		flags: MessageFlags.Ephemeral,
	});
});
