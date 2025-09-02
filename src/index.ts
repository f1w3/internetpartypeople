import { ChannelType, MessageFlags } from "discord-api-types/v10";
import { _channels_$_messages, _guilds_$_channels, Button, Components, DiscordHono, Modal, TextInput } from "discord-hono";

const CONSTANTS = {
    MODAL: {
        CREATE: {
            NAME: "create",

            INPUT: {
                EVENT_DATE: "eventdate",
                EVENT_NAME: "eventname",
                EVENT_URL: "eventurl",
            }
        }
    }
}

const app = new DiscordHono()
    .command("create", (c) => {
        return c.resModal(
            new Modal(CONSTANTS.MODAL.CREATE.NAME, 'イベントを作成')
                .row(
                    new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_DATE, `イベント日`).placeholder("yyyy-mm-dd").required()
                )
                .row(
                    new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_NAME, `イベントの名前`).placeholder("INTERNET PARTY").required()
                )
                .row(
                    new TextInput(CONSTANTS.MODAL.CREATE.INPUT.EVENT_URL, `イベントURL`).placeholder("https://internetparty.fun").required(false)
                )
        );
    })
    .command("archive", async (c) => {

        const guild = c.interaction.guild;
        if (!guild) return c.res({
            content: "This command can only be used in a server.",
            flags: MessageFlags.Ephemeral,
        });

        const channelsRes = await c.rest('GET', _guilds_$_channels, [guild.id])
        if (!channelsRes.ok) return c.res({
            content: `Failed to fetch channels: ${channelsRes.status} ${channelsRes.statusText}`,
            flags: MessageFlags.Ephemeral,
        })
        const channels = await channelsRes.json()

        const eventsCategorys = channels.filter(channel => channel.name?.includes("events") && channel.type === 4);
        const archivesCategorys = channels.filter(channel => channel.name?.includes("archives") && channel.type === 4);

        let eventsCategory = eventsCategorys[0];
        let archivesCategory = archivesCategorys[0];

        if (!eventsCategory) {
            const createdEventCategoryRes = await c.rest('POST', _guilds_$_channels, [guild.id], {
                name: "events",
                type: 4,
                position: 0,
            })
            const createdEventCategory = await createdEventCategoryRes.json();
            eventsCategory = createdEventCategory;
        }
        if (!archivesCategory) {
            const createdArchivesCategoryRes = await c.rest('POST', _guilds_$_channels, [guild.id], {
                name: "archives",
                type: 4,
                position: 1,
            })
            const createdArchivesCategory = await createdArchivesCategoryRes.json();
            archivesCategory = createdArchivesCategory;
        }

        if (c.interaction.channel.type === ChannelType.GuildText && c.interaction.channel.parent_id !== eventsCategory.id) {
            return c.res({
                content: `This command can only be used in a text channel under the ${eventsCategory.name} category.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        await c.rest('PATCH', _guilds_$_channels, [guild.id], [{
            id: c.interaction.channel.id,
            parent_id: archivesCategory.id,
            position: 0,
        }])

        return c.res({
            content: `Archived this channel to ${archivesCategory.name} category.`,
            flags: MessageFlags.Ephemeral,
        });
    })
    .modal(CONSTANTS.MODAL.CREATE.NAME, async (c) => {

        const eventDate = c.var.eventdate as string
        const eventName = c.var.eventname as string
        const eventUrl = c.var.eventurl as string | undefined

        const guild = c.interaction.guild;
        if (!guild) return c.res({
            content: "This command can only be used in a server.",
            flags: MessageFlags.Ephemeral,
        });

        const channelsRes = await c.rest('GET', _guilds_$_channels, [guild.id])
        if (!channelsRes.ok) return c.res({
            content: `Failed to fetch channels: ${channelsRes.status} ${channelsRes.statusText}`,
            flags: MessageFlags.Ephemeral,
        })
        const channels = await channelsRes.json()

        const eventsCategorys = channels.filter(channel => channel.name?.includes("events") && channel.type === 4);

        let eventsCategory = eventsCategorys[0];

        if (!eventsCategory) {
            const createdEventCategoryRes = await c.rest('POST', _guilds_$_channels, [guild.id], {
                name: "events",
                type: 4,
                position: 0,
            })
            const createdEventCategory = await createdEventCategoryRes.json();
            eventsCategory = createdEventCategory;
        }

        await c.rest('POST', _guilds_$_channels, [guild.id], {
            name: `${eventName}-${eventDate}`,
            type: 0,
            topic: eventUrl ?? "",
            parent_id: eventsCategory.id,
        })

        return c.res({
            content: `Created a new event channel in ${eventsCategory.name} category.`,
            flags: MessageFlags.Ephemeral,
        });
    });

export default app;
