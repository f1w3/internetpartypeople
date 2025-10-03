import { Command, Modal, TextInput } from "discord-hono";
import { CONSTANTS } from "../constants.js";
import { factory } from "../init.js";

export const command_create = factory.command(
	new Command("register", "register event"),
	(c) => {
		return c.resModal(
			new Modal(CONSTANTS.MODAL.CREATE.NAME, "イベントを作成")
				.row(
					new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_DATE, `イベント日`)
						.placeholder("yyyy-mm-dd")
						.required(),
				)
				.row(
					new TextInput(
						CONSTANTS.MODAL.CREATE.INPUT.EVENT_NAME,
						`イベントの名前`,
					)
						.placeholder("INTERNET PARTY")
						.required(),
				)
				.row(
					new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_URL, `イベントURL`)
						.placeholder("https://internetparty.fun")
						.required(false),
				),
		);
	},
);
