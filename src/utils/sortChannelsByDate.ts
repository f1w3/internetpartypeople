import type { APIChannel } from "discord-api-types/v10";
import { extractDateFromName } from "./extractDateFromName";

type SentChannel = Partial<APIChannel> & Pick<APIChannel, "id" | "type">;

export function sortChannelsByDate(
	channels: APIChannel[],
	extraChannel?: SentChannel,
	order: "asc" | "desc" = "desc",
): { ch: APIChannel; date: Date }[] {
	const arr = channels
		.map((ch) => ({ ch, date: extractDateFromName(ch.name ?? "") }))
		.filter((x): x is { ch: APIChannel; date: Date } => x.date !== null);

	if (extraChannel) {
		const extraDate = extractDateFromName(extraChannel.name ?? "");
		if (extraDate)
			arr.push({
				ch: {
					...extraChannel,
				} as APIChannel,
				date: extraDate,
			});
	}

	return arr.sort((a, b) =>
		order === "asc"
			? a.date.getTime() - b.date.getTime()
			: b.date.getTime() - a.date.getTime(),
	);
}
