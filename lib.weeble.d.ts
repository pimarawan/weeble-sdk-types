/**
 * Events, commands, and the guild's channels, members, roles, and messages.
 * `discord` is a global, so there is nothing to import.
 *
 * ### Events
 * Register handlers with `discord.on()`. When an event arrives from the Discord
 * gateway, Weeble runs its handlers one at a time, in the order you registered
 * them. See `discord.events` for the full list.
 *
 * ### Event data and fetches
 * Objects in an event, such as the message or the member, arrive with their data
 * filled in. Methods named `fetch*()`, such as `fetchGuild()` or `fetchMember()`,
 * ask Discord for data the event didn't include. Use what the event gave you
 * first: every fetch is another request.
 *
 * ```ts
 * discord.on(discord.events.MESSAGE_CREATE, async (msg) => {
 *   if (msg.content === '!ping') {
 *     await msg.reply('pong');
 *   }
 * });
 * ```
 *
 * ### Changing things
 * Scripts can't call the Discord REST API directly. To send a message, edit a
 * role, or ban a member, call the method on that object. Requests go through
 * Weeble's rate limiter and can wait before they are sent.
 *
 * ```ts
 * discord.on(discord.events.GUILD_MEMBER_ADD, async (member) => {
 *   const channel = await discord.fetchGuildTextChannel('welcome-channel-id');
 *   if (!channel) return console.warn('Welcome channel is missing or is not a text channel.');
 *   await channel.send(`Welcome ${member.toMention()}`);
 * });
 * ```
 *
 * @see https://docs.discord.com/developers/events/gateway
 * @see https://docs.discord.com/developers/reference
 */
declare namespace discord {
  //#region Basics

  /**
   * A Discord ID, such as `'1504537312841961583'`. Keep IDs as strings:
   * JavaScript numbers can't hold every ID exactly.
   *
   * @see https://docs.discord.com/developers/reference#snowflakes
   */
  type Snowflake = string;

  /** Translations keyed by Discord locale, such as `"en-US"`, `"fr"` or `"ar"`. */
  type LocaleMap = Record<string, string>;

  /** A permission from {@link PermissionFlags}. Combine permissions with `|`. */
  type PermissionFlag = bigint;

  /**
   * Something that can be mentioned in message content.
   *
   * @see https://docs.discord.com/developers/reference#message-formatting
   */
  interface Mentionable {
    /**
     * Returns the mention for this object: `<@id>` for a user, `<#id>` for a
     * channel, `<@&id>` for a role.
     */
    toMention(): string;
  }

  /**
   * A Discord API request that failed. SDK methods that call Discord throw
   * this. Methods typed to return `null` return it for a 404 instead of
   * throwing.
   *
   * ```ts
   * try {
   *   await member.ban();
   * } catch (error) {
   *   if (error instanceof discord.ApiError && error.status === 403) {
   *     await message.reply("I don't have permission to ban them.");
   *   } else {
   *     throw error;
   *   }
   * }
   * ```
   */
  class ApiError extends Error {
    readonly name: "ApiError";
    /** HTTP status Discord answered with, such as 403 or 404. */
    readonly status: number;
    /**
     * Discord's JSON error code, or `0` when Discord didn't send one.
     * @see https://docs.discord.com/developers/topics/opcodes-and-status-codes#json
     */
    readonly code: number;
    /** Seconds to wait before retrying, for a 429 response. `null` otherwise. */
    readonly retryAfter: number | null;
  }

  /**
   * Controls which mentions in a message are delivered as notifications.
   * If omitted, the endpoint's Discord defaults apply. A role or user type
   * cannot appear in `parse` when explicit IDs for that type are supplied.
   *
   * #### Example
   * ```ts
   * if (!message.author) return;
   * await message.reply({
   *   content: `Hello ${message.author.toMention()}`,
   *   allowedMentions: { users: [message.author.id], parse: [] },
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/resources/message#allowed-mentions-object
   */
  type AllowedMentions = { repliedUser?: boolean } & (
    | {
        parse?: "everyone"[];
        roles?: Snowflake[];
        users?: Snowflake[];
      }
    | {
        parse: Array<"roles" | "everyone">;
        roles?: never;
        users?: Snowflake[];
      }
    | {
        parse: Array<"users" | "everyone">;
        roles?: Snowflake[];
        users?: never;
      }
    | {
        parse: Array<"roles" | "users" | "everyone">;
        roles?: never;
        users?: never;
      }
  );

  /** An emoji in a reaction or a component: a custom emoji, or a Unicode one by its character. */
  interface EmojiData {
    /** Whether this custom emoji is animated. */
    animated?: boolean;

    /** ID of the custom emoji, or `null` for a Unicode emoji. */
    id?: string | null;

    /** Name of the custom emoji, or the Unicode emoji itself. */
    name: string;
  }

  /** A file attached to a message. To upload a file, use {@link AttachmentInput}. */
  interface Attachment {
    /** MIME type of the file, or `null` when unknown. */
    contentType: string | null;

    /** Alternative text shown for this attachment, or `null` when unset. */
    description: string | null;

    /** Whether this attachment is ephemeral (only visible to the interaction user). */
    ephemeral: boolean;

    /** Bitfield of {@link AttachmentFlags}. */
    flags: number;

    /** Name of the file. */
    filename: string;

    /** Height in pixels, or `null` if the file isn't an image or video. */
    height: number | null;

    /** ID of the attachment. */
    id: Snowflake;

    /** Whether the file is hidden behind a spoiler. */
    isSpoiler: boolean;

    /** Proxied URL of the file. */
    proxyUrl: string;

    /** Size of the file in bytes. */
    size: number;

    /** URL of the file. */
    url: string;

    /** Width in pixels, or `null` if the file isn't an image or video. */
    width: number | null;
  }

  /** A file to upload with a message. */
  interface AttachmentInput {
    /** MIME type of the file. Discord detects it when omitted. */
    contentType?: string;

    /** Contents of the file. */
    data: ArrayBuffer;

    /** Name of the file, as shown in Discord. */
    fileName: string;

    /** Whether to hide the file behind a spoiler. */
    spoiler?: boolean;
  }

  /** An attachment to keep when editing a message, with any changes to it. */
  interface AttachmentEdit {
    /** ID of an attachment already on the message. */
    id: Snowflake;
    /** New alt text, or `null` to remove it. */
    description?: string | null;
    /** Whether to hide the attachment behind a spoiler. */
    isSpoiler?: boolean;
  }

  /** A file to upload, or an attachment already on Discord. */
  type AttachmentLike = AttachmentInput | Attachment;

  //#endregion

  //#region Constants

  /**
   * Permission flags represented as `bigint` bit values.
   * Combine flags with `|`, and test a permission with `member.can(...)` or a
   * bitwise `&` check. `ADMINISTRATOR` implicitly grants every permission.
   *
   * @see https://docs.discord.com/developers/topics/permissions
   */
  const PermissionFlags: {
    readonly ADD_REACTIONS: bigint;
    readonly ADMINISTRATOR: bigint;
    readonly ATTACH_FILES: bigint;
    readonly BAN_MEMBERS: bigint;
    readonly BYPASS_SLOWMODE: bigint;
    readonly CHANGE_NICKNAME: bigint;
    readonly CONNECT: bigint;
    readonly CREATE_EVENTS: bigint;
    readonly CREATE_GUILD_EXPRESSIONS: bigint;
    readonly CREATE_INSTANT_INVITE: bigint;
    readonly CREATE_PRIVATE_THREADS: bigint;
    readonly CREATE_PUBLIC_THREADS: bigint;
    readonly DEAFEN_MEMBERS: bigint;
    readonly EMBED_LINKS: bigint;
    readonly KICK_MEMBERS: bigint;
    readonly MANAGE_CHANNELS: bigint;
    readonly MANAGE_EVENTS: bigint;
    readonly MANAGE_GUILD: bigint;
    readonly MANAGE_GUILD_EXPRESSIONS: bigint;
    readonly MANAGE_EMOJIS_AND_STICKERS: bigint;
    readonly MANAGE_MESSAGES: bigint;
    readonly MANAGE_NICKNAMES: bigint;
    readonly MANAGE_ROLES: bigint;
    readonly MANAGE_THREADS: bigint;
    readonly MANAGE_WEBHOOKS: bigint;
    readonly MENTION_EVERYONE: bigint;
    readonly MODERATE_MEMBERS: bigint;
    readonly MOVE_MEMBERS: bigint;
    readonly MUTE_MEMBERS: bigint;
    readonly NONE: 0n;
    readonly PIN_MESSAGES: bigint;
    readonly PRIORITY_SPEAKER: bigint;
    readonly READ_MESSAGE_HISTORY: bigint;
    readonly REQUEST_TO_SPEAK: bigint;
    readonly SEND_MESSAGES: bigint;
    readonly SEND_MESSAGES_IN_THREADS: bigint;
    readonly SEND_POLLS: bigint;
    readonly SEND_TTS_MESSAGES: bigint;
    readonly SEND_VOICE_MESSAGES: bigint;
    readonly SET_VOICE_CHANNEL_STATUS: bigint;
    readonly SPEAK: bigint;
    readonly STREAM: bigint;
    readonly USE_APPLICATION_COMMANDS: bigint;
    readonly USE_EMBEDDED_ACTIVITIES: bigint;
    readonly USE_EXTERNAL_EMOJIS: bigint;
    readonly USE_EXTERNAL_SOUNDS: bigint;
    readonly USE_EXTERNAL_APPS: bigint;
    readonly USE_EXTERNAL_STICKERS: bigint;
    readonly USE_SOUNDBOARD: bigint;
    readonly USE_VAD: bigint;
    readonly VIEW_AUDIT_LOG: bigint;
    readonly VIEW_CHANNEL: bigint;
    readonly VIEW_GUILD_INSIGHTS: bigint;
    readonly VIEW_CREATOR_MONETIZATION_ANALYTICS: bigint;
  };

  /**
   * Channel types. Compare with {@link Channel.type}, or use a check such as
   * {@link isGuildTextChannel} to narrow the channel's type.
   *
   * @see https://docs.discord.com/developers/resources/channel#channel-object-channel-types
   */
  const ChannelType: {
    readonly ANNOUNCEMENT_THREAD: 10;
    readonly GUILD_ANNOUNCEMENT: 5;
    readonly GUILD_CATEGORY: 4;
    readonly GUILD_DIRECTORY: 14;
    readonly GUILD_FORUM: 15;
    readonly GUILD_MEDIA: 16;
    readonly GUILD_STAGE_VOICE: 13;
    readonly GUILD_TEXT: 0;
    readonly GUILD_VOICE: 2;
    readonly PRIVATE_THREAD: 12;
    readonly PUBLIC_THREAD: 11;
  };

  /** A value of {@link ChannelType}. */
  type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

  /**
   * Message types: a normal message, a reply, or a system message such as a boost.
   *
   * @see https://docs.discord.com/developers/resources/message#message-object-message-types
   */
  const MessageType: {
    readonly AUTO_MODERATION_ACTION: 24;
    readonly CALL: 3;
    readonly CHANNEL_FOLLOW_ADD: 12;
    readonly CHANNEL_ICON_CHANGE: 5;
    readonly CHANNEL_NAME_CHANGE: 4;
    readonly CHANNEL_PINNED_MESSAGE: 6;
    readonly CHAT_INPUT_COMMAND: 20;
    readonly CONTEXT_MENU_COMMAND: 23;
    readonly DEFAULT: 0;
    readonly GUILD_APPLICATION_PREMIUM_SUBSCRIPTION: 32;
    readonly GUILD_BOOST: 8;
    readonly GUILD_BOOST_TIER_1: 9;
    readonly GUILD_BOOST_TIER_2: 10;
    readonly GUILD_BOOST_TIER_3: 11;
    readonly GUILD_DISCOVERY_DISQUALIFIED: 14;
    readonly GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING: 17;
    readonly GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING: 16;
    readonly GUILD_DISCOVERY_REQUALIFIED: 15;
    readonly GUILD_INCIDENT_ALERT_MODE_DISABLED: 37;
    readonly GUILD_INCIDENT_ALERT_MODE_ENABLED: 36;
    readonly GUILD_INCIDENT_REPORT_FALSE_ALARM: 39;
    readonly GUILD_INCIDENT_REPORT_RAID: 38;
    readonly GUILD_INVITE_REMINDER: 22;
    readonly INTERACTION_PREMIUM_UPSELL: 26;
    readonly RECIPIENT_ADD: 1;
    readonly RECIPIENT_REMOVE: 2;
    readonly REPLY: 19;
    readonly ROLE_SUBSCRIPTION_PURCHASE: 25;
    readonly STAGE_END: 28;
    readonly STAGE_RAISE_HAND: 30;
    readonly STAGE_SPEAKER: 29;
    readonly STAGE_START: 27;
    readonly STAGE_TOPIC: 31;
    readonly THREAD_CREATED: 18;
    readonly THREAD_STARTER_MESSAGE: 21;
    readonly USER_JOIN: 7;
  };

  /** A value of {@link MessageType}. */
  type MessageType = (typeof MessageType)[keyof typeof MessageType];

  /**
   * Message flags. Combine them with `|`.
   *
   * @see https://docs.discord.com/developers/resources/message#message-object-message-flags
   */
  const MessageFlags: {
    readonly CROSSPOSTED: 1;
    readonly EPHEMERAL: 64;
    readonly FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 256;
    readonly HAS_THREAD: 32;
    readonly IS_COMPONENTS_V2: 32768;
    readonly IS_CROSSPOST: 2;
    readonly IS_VOICE_MESSAGE: 8192;
    readonly LOADING: 128;
    readonly SOURCE_MESSAGE_DELETED: 8;
    readonly SUPPRESS_EMBEDS: 4;
    readonly SUPPRESS_NOTIFICATIONS: 4096;
    readonly URGENT: 16;
  };

  /** A value of {@link MessageFlags}. */
  type MessageFlags = (typeof MessageFlags)[keyof typeof MessageFlags];

  /** Attachment flags. */
  const AttachmentFlags: {
    readonly IS_CLIP: 1;
    readonly IS_THUMBNAIL: 2;
    readonly IS_REMIX: 4;
    readonly IS_SPOILER: 8;
    readonly IS_ANIMATED: 32;
  };

  /** A value of {@link AttachmentFlags}. */
  type AttachmentFlags = (typeof AttachmentFlags)[keyof typeof AttachmentFlags];

  /**
   * Interaction types.
   *
   * @see https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-object-interaction-type
   */
  const InteractionType: {
    readonly APPLICATION_COMMAND: 2;
    readonly APPLICATION_COMMAND_AUTOCOMPLETE: 4;
    readonly MESSAGE_COMPONENT: 3;
    readonly MODAL_SUBMIT: 5;
    readonly PING: 1;
  };

  /** A value of {@link InteractionType}. */
  type InteractionType = (typeof InteractionType)[keyof typeof InteractionType];

  /**
   * Component types. Some only work in messages and some only in modals.
   *
   * @see https://docs.discord.com/developers/components/reference
   */
  const ComponentType: {
    readonly ACTION_ROW: 1;
    readonly BUTTON: 2;
    readonly CHANNEL_SELECT: 8;
    readonly CHECKBOX: 23;
    readonly CHECKBOX_GROUP: 22;
    readonly CONTAINER: 17;
    readonly FILE: 13;
    readonly FILE_UPLOAD: 19;
    readonly LABEL: 18;
    readonly MEDIA_GALLERY: 12;
    readonly MENTIONABLE_SELECT: 7;
    readonly RADIO_GROUP: 21;
    readonly ROLE_SELECT: 6;
    readonly SECTION: 9;
    readonly SEPARATOR: 14;
    readonly STRING_SELECT: 3;
    readonly TEXT_DISPLAY: 10;
    readonly TEXT_INPUT: 4;
    readonly THUMBNAIL: 11;
    readonly USER_SELECT: 5;
  };

  /** A value of {@link ComponentType}. */
  type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];

  /** Button styles. */
  const ButtonStyle: {
    readonly DANGER: 4;
    readonly LINK: 5;
    readonly PRIMARY: 1;
    readonly SECONDARY: 2;
    readonly SUCCESS: 3;
  };

  /** A value of {@link ButtonStyle}. */
  type ButtonStyle = (typeof ButtonStyle)[keyof typeof ButtonStyle];

  /** Text input styles. */
  const TextInputStyle: {
    readonly PARAGRAPH: 2;
    readonly SHORT: 1;
  };

  /** A value of {@link TextInputStyle}. */
  type TextInputStyle = (typeof TextInputStyle)[keyof typeof TextInputStyle];

  /**
   * Activity types, such as playing or listening.
   *
   * @see https://docs.discord.com/developers/events/gateway-events#activity-object-activity-types
   */
  const ActivityType: {
    readonly COMPETING: 5;
    readonly CUSTOM: 4;
    readonly LISTENING: 2;
    readonly PLAYING: 0;
    readonly STREAMING: 1;
    readonly WATCHING: 3;
  };

  /** A value of {@link ActivityType}. */
  type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

  /** Whether a permission overwrite is for a role or a member. */
  const PermissionOverwriteType: {
    readonly MEMBER: 1;
    readonly ROLE: 0;
  };

  /** A value of {@link PermissionOverwriteType}. */
  type PermissionOverwriteType =
    (typeof PermissionOverwriteType)[keyof typeof PermissionOverwriteType];

  /** Webhook types. */
  const WebhookType: {
    readonly APPLICATION: 3;
    readonly CHANNEL_FOLLOWER: 2;
    readonly INCOMING: 1;
  };

  /** A value of {@link WebhookType}. */
  type WebhookType = (typeof WebhookType)[keyof typeof WebhookType];

  /** Sticker file formats. */
  const StickerFormatType: {
    readonly APNG: 2;
    readonly GIF: 4;
    readonly LOTTIE: 3;
    readonly PNG: 1;
  };

  /** A value of {@link StickerFormatType}. */
  type StickerFormatType =
    (typeof StickerFormatType)[keyof typeof StickerFormatType];

  /**
   * Audit log actions. {@link AuditLogEntry.actionType} is one of these.
   *
   * @see https://docs.discord.com/developers/resources/audit-log#audit-log-entry-object-audit-log-events
   */
  const AuditLogActionType: {
    readonly APPLICATION_COMMAND_PERMISSION_UPDATE: 121;
    readonly AUTO_MODERATION_BLOCK_MESSAGE: 143;
    readonly AUTO_MODERATION_FLAG_TO_CHANNEL: 144;
    readonly AUTO_MODERATION_QUARANTINE_USER: 146;
    readonly AUTO_MODERATION_RULE_CREATE: 140;
    readonly AUTO_MODERATION_RULE_DELETE: 142;
    readonly AUTO_MODERATION_RULE_UPDATE: 141;
    readonly AUTO_MODERATION_USER_COMMUNICATION_DISABLED: 145;
    readonly BOT_ADD: 28;
    readonly CHANNEL_CREATE: 10;
    readonly CHANNEL_DELETE: 12;
    readonly CHANNEL_OVERWRITE_CREATE: 13;
    readonly CHANNEL_OVERWRITE_DELETE: 15;
    readonly CHANNEL_OVERWRITE_UPDATE: 14;
    readonly CHANNEL_UPDATE: 11;
    readonly CREATOR_MONETIZATION_REQUEST_CREATED: 150;
    readonly CREATOR_MONETIZATION_TERMS_ACCEPTED: 151;
    readonly EMOJI_CREATE: 60;
    readonly EMOJI_DELETE: 62;
    readonly EMOJI_UPDATE: 61;
    readonly GUILD_SCHEDULED_EVENT_CREATE: 100;
    readonly GUILD_SCHEDULED_EVENT_DELETE: 102;
    readonly GUILD_SCHEDULED_EVENT_UPDATE: 101;
    readonly GUILD_UPDATE: 1;
    readonly HOME_SETTINGS_CREATE: 190;
    readonly HOME_SETTINGS_UPDATE: 191;
    readonly INTEGRATION_CREATE: 80;
    readonly INTEGRATION_DELETE: 82;
    readonly INTEGRATION_UPDATE: 81;
    readonly INVITE_CREATE: 40;
    readonly INVITE_DELETE: 42;
    readonly INVITE_UPDATE: 41;
    readonly MEMBER_BAN_ADD: 22;
    readonly MEMBER_BAN_REMOVE: 23;
    readonly MEMBER_DISCONNECT: 27;
    readonly MEMBER_KICK: 20;
    readonly MEMBER_MOVE: 26;
    readonly MEMBER_PRUNE: 21;
    readonly MEMBER_ROLE_UPDATE: 25;
    readonly MEMBER_UPDATE: 24;
    readonly MESSAGE_BULK_DELETE: 73;
    readonly MESSAGE_DELETE: 72;
    readonly MESSAGE_PIN: 74;
    readonly MESSAGE_UNPIN: 75;
    readonly ONBOARDING_CREATE: 166;
    readonly ONBOARDING_PROMPT_CREATE: 163;
    readonly ONBOARDING_PROMPT_DELETE: 165;
    readonly ONBOARDING_PROMPT_UPDATE: 164;
    readonly ONBOARDING_UPDATE: 167;
    readonly ROLE_CREATE: 30;
    readonly ROLE_DELETE: 32;
    readonly ROLE_UPDATE: 31;
    readonly SOUNDBOARD_SOUND_CREATE: 130;
    readonly SOUNDBOARD_SOUND_UPDATE: 131;
    readonly SOUNDBOARD_SOUND_DELETE: 132;
    readonly STAGE_INSTANCE_CREATE: 83;
    readonly STAGE_INSTANCE_DELETE: 85;
    readonly STAGE_INSTANCE_UPDATE: 84;
    readonly STICKER_CREATE: 90;
    readonly STICKER_DELETE: 92;
    readonly STICKER_UPDATE: 91;
    readonly THREAD_CREATE: 110;
    readonly THREAD_DELETE: 112;
    readonly THREAD_UPDATE: 111;
    readonly VOICE_CHANNEL_STATUS_CREATE: 192;
    readonly VOICE_CHANNEL_STATUS_DELETE: 193;
    readonly WEBHOOK_CREATE: 50;
    readonly WEBHOOK_DELETE: 52;
    readonly WEBHOOK_UPDATE: 51;
  };

  /** A value of {@link AuditLogActionType}. */
  type AuditLogActionType =
    (typeof AuditLogActionType)[keyof typeof AuditLogActionType];

  /** Events that trigger an auto moderation rule. */
  const AutoModEventType: {
    readonly MESSAGE_SEND: 1;
  };

  /** A value of {@link AutoModEventType}. */
  type AutoModEventType =
    (typeof AutoModEventType)[keyof typeof AutoModEventType];

  /** What an auto moderation rule looks for. */
  const AutoModTriggerType: {
    readonly HARMFUL_LINK: 2;
    readonly KEYWORD: 1;
    readonly KEYWORD_PRESET: 4;
    readonly MEMBER_PROFILE: 6;
    readonly MENTION_SPAM: 5;
    readonly SPAM: 3;
  };

  /** A value of {@link AutoModTriggerType}. */
  type AutoModTriggerType =
    (typeof AutoModTriggerType)[keyof typeof AutoModTriggerType];

  /** What an auto moderation rule does when it triggers. */
  const AutoModActionType: {
    readonly BLOCK_MEMBER_INTERACTION: 4;
    readonly BLOCK_MESSAGE: 1;
    readonly SEND_ALERT_MESSAGE: 2;
    readonly TIMEOUT: 3;
  };

  /** A value of {@link AutoModActionType}. */
  type AutoModActionType =
    (typeof AutoModActionType)[keyof typeof AutoModActionType];

  /** Where a scheduled event takes place. */
  const ScheduledEventEntityType: {
    readonly EXTERNAL: 3;
    readonly STAGE_INSTANCE: 1;
    readonly VOICE: 2;
  };

  /** A value of {@link ScheduledEventEntityType}. */
  type ScheduledEventEntityType =
    (typeof ScheduledEventEntityType)[keyof typeof ScheduledEventEntityType];

  /** Scheduled event privacy levels. */
  const ScheduledEventPrivacyLevel: {
    readonly GUILD_ONLY: 2;
  };

  /** A value of {@link ScheduledEventPrivacyLevel}. */
  type ScheduledEventPrivacyLevel =
    (typeof ScheduledEventPrivacyLevel)[keyof typeof ScheduledEventPrivacyLevel];

  /** Scheduled event statuses. */
  const ScheduledEventStatus: {
    readonly ACTIVE: 2;
    readonly CANCELED: 4;
    readonly COMPLETED: 3;
    readonly SCHEDULED: 1;
  };

  /** A value of {@link ScheduledEventStatus}. */
  type ScheduledEventStatus =
    (typeof ScheduledEventStatus)[keyof typeof ScheduledEventStatus];

  /** Stage instance privacy levels. */
  const StageInstancePrivacyLevel: {
    readonly GUILD_ONLY: 2;
    readonly PUBLIC: 1;
  };

  /** A value of {@link StageInstancePrivacyLevel}. */
  type StageInstancePrivacyLevel =
    (typeof StageInstancePrivacyLevel)[keyof typeof StageInstancePrivacyLevel];

  //#endregion

  //#region Messages

  /**
   * A Discord message. It holds the message as it was when the event or request
   * arrived; call {@link Message.fetch} for its current state.
   *
   * #### Example
   * ```ts
   * discord.on(discord.events.MESSAGE_CREATE, async (message) => {
   *   if (!message.author || message.author.bot || message.content !== '!ping') return;
   *   await message.reply('pong');
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/resources/message#message-object
   */
  class Message {
    /** Files attached to the message. */
    readonly attachments: Attachment[];

    /** User or webhook that sent the message, or `null` when Discord left it out. */
    readonly author: User | null;

    /**
     * The channel the message was sent in. It can send and show typing without
     * fetching the channel: `await message.channel.send("Hello")`.
     */
    readonly channel: MessageChannel;

    /** ID of the channel where this message was sent. */
    readonly channelId: Snowflake;

    /**
     * Text of the message. Empty in guilds unless the bot has the Message Content
     * intent, the message mentions the bot, or the bot sent it.
     */
    readonly content: string;

    /** When this message was created. */
    readonly createdAt: Date;

    /** When this message was created, in milliseconds since the Unix epoch. */
    readonly createdTimestamp: number;

    /** When this message was last edited, or `null` if it never was. */
    readonly editedAt: Date | null;

    /** {@link Message.editedAt} in milliseconds since the Unix epoch. */
    readonly editedTimestamp: number | null;

    /** Embeds in the message. */
    readonly embeds: Embed[];

    /** Bitfield of {@link MessageFlags}. */
    readonly flags: number;

    /** ID of the guild the message was sent in, or `null` outside a guild. */
    readonly guildId: Snowflake | null;

    /** ID of the message. */
    readonly id: Snowflake;

    /** The member who sent the message, or `null` outside a guild. */
    readonly member: GuildMember | null;

    /** Whether the message mentions `@everyone` or `@here`. */
    readonly mentionEveryone: boolean;

    /** IDs of the roles mentioned in the message. */
    readonly mentionRoles: Snowflake[];

    /** Users mentioned in the message's text. Mentions in embeds don't count. */
    readonly mentions: User[];

    /** Whether the message is pinned. */
    readonly pinned: boolean;

    /** The message's poll, or `null` if it has none. */
    readonly poll: Poll | null;

    /** Reactions on the message. */
    readonly reactions: MessageReaction[];

    /** The message this one replies to, forwards or crossposts, or `null`. */
    readonly reference: MessageReference | null;

    /** The message this one replies to, or `null` if it isn't a reply or was deleted. */
    readonly referencedMessage: Message | null;

    /** Whether this is a normal message, a reply, or a system message. */
    readonly type: MessageType;

    /** Link to the message in Discord. */
    readonly url: string;

    /** ID of the webhook that sent the message, or `null`. */
    readonly webhookId: Snowflake | null;

    /**
     * Replies to this message.
     *
     * @returns The reply.
     */
    reply(content: string | SendMessageOptions): Promise<Message>;

    /** Edits this message. Only messages the bot sent can be edited. */
    edit(content: string | EditMessageOptions): Promise<Message>;

    /**
     * Deletes this message.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Fetches this message again, with any edits, reactions and votes since the event. */
    fetch(): Promise<Message>;

    /** Fetches the channel this message was sent in. */
    fetchChannel(): Promise<TextChannel>;

    /** Fetches the guild this message was sent in, or returns `null` outside a guild. */
    fetchGuild(): Promise<Guild | null>;

    /**
     * Reacts to this message.
     *
     * @param emoji A Unicode emoji such as `"🔥"`, or a custom emoji as `"name:id"`.
     */
    react(emoji: string): Promise<void>;

    /**
     * Removes a reaction from this message.
     *
     * @param emoji The reaction's emoji, as in {@link Message.react}.
     * @param userId Whose reaction to remove. Defaults to the bot's own.
     */
    removeReaction(emoji: string, userId?: Snowflake): Promise<void>;

    /**
     * Removes every reaction with one emoji, or every reaction when no emoji is given.
     */
    clearReactions(emoji?: string): Promise<void>;

    /**
     * Fetches the users who reacted with an emoji, up to 100 per request.
     */
    fetchReactionUsers(
      emoji: string,
      options?: {
        after?: Snowflake;
        limit?: number;
      },
    ): Promise<User[]>;

    /**
     * Pins this message.
     *
     * @param reason Reason shown in the audit log.
     */
    pin(reason?: string): Promise<void>;

    /**
     * Unpins this message.
     *
     * @param reason Reason shown in the audit log.
     */
    unpin(reason?: string): Promise<void>;

    /** Publishes this message to the servers following its announcement channel. */
    crosspost(): Promise<Message>;

    /** Forwards this message to another channel. */
    forward(channelId: Snowflake): Promise<Message>;

    /** Starts a thread from this message. */
    createThread(
      options: ThreadFromMessageCreateOptions,
    ): Promise<ThreadChannel>;

    /** Ends this message's poll now. */
    endPoll(): Promise<Message>;

    /** @deprecated Use {@link Message.clearReactions} with no emoji. */
    removeAllReactions(): Promise<void>;

    /** @deprecated Use {@link Message.removeReaction} without a user ID. */
    unreact(emoji: string): Promise<void>;
  }

  /** A message a member sent in a guild, so its author, member and guild ID are set. */
  class GuildMemberMessage extends Message {
    /** User who sent the message. */
    readonly author: User;

    /** ID of the guild the message was sent in. */
    readonly guildId: Snowflake;

    /** Member who sent the message. */
    readonly member: GuildMember;

    /** Fetches the guild the message was sent in. */
    fetchGuild(): Promise<Guild>;
  }

  /**
   * The channel a message was sent in, as {@link Message.channel}. It holds only
   * the ID; {@link MessageChannel.fetch} returns the full channel.
   */
  class MessageChannel {
    /** ID of the channel. */
    readonly id: Snowflake;

    /** Sends a message to this channel. */
    send(content: string | SendMessageOptions): Promise<Message>;

    /** Shows the bot as typing in this channel for about 10 seconds, or until it sends a message. */
    typing(): Promise<void>;

    /** Fetches the full channel. */
    fetch(): Promise<TextChannel>;
  }

  /**
   * A message being replied to. `channelId` and `guildId` can be left out for a
   * message in the same channel.
   */
  interface MessageReference {
    /** ID of the message's channel. */
    channelId?: Snowflake;

    /** Whether to fail if the message was deleted, instead of sending without the reply. */
    failIfNotExists?: boolean;

    /** ID of the message's guild. */
    guildId?: Snowflake;

    /** ID of the referenced message. */
    messageId: Snowflake;
  }

  /** One emoji's reactions on a message. */
  class MessageReaction {
    /** How many users reacted with this emoji. */
    readonly count: number;

    /** The emoji. */
    readonly emoji: EmojiData;

    /** Whether the bot reacted with this emoji. */
    readonly me: boolean;

    /** Removes the bot's reaction. */
    remove(): Promise<void>;

    /** Fetches the users who reacted with this emoji, up to 100 per request. */
    users(options?: { after?: Snowflake; limit?: number }): Promise<User[]>;
  }

  /** A message to send. */
  interface SendMessageOptions {
    /** Which mentions in the message notify people. */
    allowedMentions?: AllowedMentions;

    /** Attachments already on Discord to include. */
    attachments?: Attachment[];

    /** Buttons, menus and other components. */
    components?: Component[];

    /** Text of the message, up to 2000 characters. */
    content?: string;

    /** Embeds, up to 10. */
    embeds?: EmbedLike[];

    /**
     * New files to upload, up to 10. Supported by `channel.send()` and
     * `message.reply()`; webhooks, follow-ups and forum posts throw if given files.
     */
    files?: AttachmentInput[];

    /**
     * Bitfield of {@link MessageFlags}. With `IS_COMPONENTS_V2`, the message is
     * laid out with components only: `content` and `embeds` aren't allowed, and
     * the flag can't be removed later.
     */
    flags?: number;

    /** A poll to send with the message. */
    poll?: PollCreateOptions;

    /** The message to reply to. */
    reply?: MessageReference;

    /** IDs of stickers to send, up to 3. */
    stickerIds?: Snowflake[];

    /** Whether Discord reads the message aloud. */
    tts?: boolean;
  }

  /** Changes to a message. Fields left out stay as they are. */
  interface EditMessageOptions {
    /** Which mentions in the message notify people. */
    allowedMentions?: AllowedMentions;

    /** Attachments to keep. Ones left out are removed. */
    attachments?: AttachmentEdit[];

    /** Buttons, menus and other components. */
    components?: Component[];

    /** Text of the message, up to 2000 characters. */
    content?: string;

    /** Embeds, up to 10. */
    embeds?: EmbedLike[];

    /**
     * Bitfield of {@link MessageFlags}. `IS_COMPONENTS_V2` can't be removed once
     * set, and such a message can't have `content` or `embeds`.
     */
    flags?: number;
  }

  /** Which messages to fetch. Use at most one of `after`, `around` and `before`. */
  interface FetchMessagesOptions {
    /** Fetch messages newer than this message ID. */
    after?: Snowflake;

    /** Fetch messages around this message ID. */
    around?: Snowflake;

    /** Fetch messages older than this message ID. */
    before?: Snowflake;

    /** How many messages to fetch, from 1 to 100. Defaults to 50. */
    limit?: number;
  }

  /** A pinned message and when it was pinned. */
  interface PinnedMessage {
    /** When the message was pinned. */
    pinnedAt: Date;
    /** The message. */
    message: Message;
  }

  /** A page of pinned messages, from {@link GuildTextChannel.fetchPins}. */
  interface PinPage {
    /** Pinned messages, most recently pinned first. */
    items: PinnedMessage[];
    /** Whether there are more pins after this page. */
    hasMore: boolean;
    /** Value to pass as `before` to fetch the next page, or `null` on the last page. */
    nextBefore: string | null;
  }

  /**
   * Filters for `guild.searchMessages()`. Every filter you set must match.
   * Array filters match any of their values.
   */
  interface GuildMessageSearchOptions {
    /** Words to look for in the message text. */
    content?: string;
    /** Only messages in these channels. */
    channelIds?: Snowflake[];
    /** Only messages from these users. */
    authorIds?: Snowflake[];
    /** Only messages from these kinds of author. A leading `-` excludes the kind instead. */
    authorTypes?: Array<
      "user" | "bot" | "webhook" | "-user" | "-bot" | "-webhook"
    >;
    /** Only messages that mention one of these users. */
    mentions?: Snowflake[];
    /** Only messages that mention one of these roles. */
    mentionRoleIds?: Snowflake[];
    /** Whether the message mentions `@everyone`. */
    mentionEveryone?: boolean;
    /** Only replies to these users. */
    repliedToUserIds?: Snowflake[];
    /** Only replies to these messages. */
    repliedToMessageIds?: Snowflake[];
    /** Whether the message is pinned. */
    pinned?: boolean;
    /** Only messages that contain one of these kinds of content. */
    has?: GuildMessageSearchHas[];
    /** Only messages with an embed of one of these types. */
    embedTypes?: Array<"image" | "video" | "gif" | "sound" | "article">;
    /** Only messages with an embed from one of these providers, such as `"YouTube"`. */
    embedProviders?: string[];
    /** Only messages that link to one of these hosts, such as `"github.com"`. */
    linkHostnames?: string[];
    /** Only messages with an attachment of one of these extensions, without the dot. */
    attachmentExtensions?: string[];
    /** Only messages with an attachment of one of these file names. */
    attachmentFilenames?: string[];
    /** Order by time or by relevance to `content`. Defaults to `"timestamp"`. */
    sortBy?: "timestamp" | "relevance";
    /** `"asc"` for oldest or least relevant first. Defaults to `"desc"`. */
    sortOrder?: "asc" | "desc";
    /** Whether to include messages from age-restricted channels. Defaults to `false`. */
    includeNsfw?: boolean;
    /** Only messages older than this message ID. */
    maxId?: Snowflake;
    /** Only messages newer than this message ID. */
    minId?: Snowflake;
    /** How many words may appear between the words of `content`. Discord defaults to 2. */
    slop?: number;
    /** Results per page, from 1 to 25. */
    limit?: number;
    /** Number of results to skip, for paging. */
    offset?: number;
  }

  /**
   * Content a message must contain. Prefix a value with `-` to exclude messages
   * that contain it.
   */
  type GuildMessageSearchHas =
    | "image"
    | "sound"
    | "video"
    | "file"
    | "sticker"
    | "embed"
    | "link"
    | "poll"
    | "snapshot"
    | "-image"
    | "-sound"
    | "-video"
    | "-file"
    | "-sticker"
    | "-embed"
    | "-link"
    | "-poll"
    | "-snapshot";

  /** Results of {@link Guild.searchMessages}. Check `status` before reading them. */
  type GuildMessageSearchResult =
    | GuildMessageSearchReadyResult
    | GuildMessageSearchIndexingResult;

  /** Messages that matched a search. */
  interface GuildMessageSearchReadyResult {
    status: "ready";
    /** Total matches across all pages. */
    totalResults: number;
    /** Matching messages, grouped as Discord returns them. */
    groups: Message[][];
    /** `true` while Discord is still indexing older messages, so results may be incomplete. */
    doingDeepHistoricalIndex: boolean;
    /** How many messages are indexed so far, when Discord reports it. */
    documentsIndexed: number | null;
  }

  /** Discord has not finished indexing the server yet. Retry after `retryAfter` seconds. */
  interface GuildMessageSearchIndexingResult {
    status: "indexing";
    totalResults: null;
    groups: [];
    doingDeepHistoricalIndex: true;
    /** How many messages are indexed so far. */
    documentsIndexed: number;
    /** Seconds to wait before searching again. */
    retryAfter: number;
  }

  //#endregion

  //#region Embeds

  /**
   * Builds an embed. Pass the builder to `embeds` when sending or editing a message.
   *
   * ```ts
   * const embed = new discord.EmbedBuilder()
   *   .setTitle('Server status')
   *   .setDescription('All systems operational.')
   *   .setColor(0x57f287);
   * await message.reply({ embeds: [embed] });
   * ```
   *
   * @see https://docs.discord.com/developers/resources/message#embed-object
   */
  class EmbedBuilder {
    /** Creates a builder from what {@link EmbedBuilder.toJSON} returned, to change a saved embed. */
    static from(data: Record<string, unknown>): EmbedBuilder;

    /** Sets the title, up to 256 characters. */
    setTitle(title: string): EmbedBuilder;

    /** Sets the description, up to 4096 characters of Markdown. */
    setDescription(description: string): EmbedBuilder;

    /** Sets the link opened by clicking the title. */
    setURL(url: string): EmbedBuilder;

    /** Sets the color of the left border, such as `0xff0000` for red. */
    setColor(color: number): EmbedBuilder;

    /** Sets the author shown above the title. */
    setAuthor(author: EmbedAuthorData): EmbedBuilder;

    /** Sets the footer. */
    setFooter(footer: EmbedFooterData): EmbedBuilder;

    /** Sets the large image below the fields. */
    setImage(image: string | EmbedMediaData): EmbedBuilder;

    /** Sets the small image in the top right corner. */
    setThumbnail(thumbnail: string | EmbedMediaData): EmbedBuilder;

    /**
     * Sets the time shown in the footer.
     *
     * @param timestamp A date or milliseconds since the Unix epoch. Defaults to now.
     */
    setTimestamp(timestamp?: Date | number): EmbedBuilder;

    /**
     * Adds a field. An embed can have up to 25.
     *
     * @param inline Whether to show the field beside other inline fields.
     */
    addField(name: string, value: string, inline?: boolean): EmbedBuilder;

    /** Adds fields. An embed can have up to 25. */
    addFields(...fields: EmbedFieldData[]): EmbedBuilder;

    /** Removes every field. */
    clearFields(): EmbedBuilder;

    /** Returns the embed as Discord's JSON object. */
    toJSON(): Record<string, unknown>;
  }

  /** An embed in a received message. Use {@link EmbedBuilder} to make one. */
  class Embed {
    /** The author shown above the title, or `null`. */
    readonly author: {
      iconUrl: string | null;
      name: string;
      url: string | null;
    } | null;

    /** Color of the left border, or `null`. */
    readonly color: number | null;

    /** The description, or `null`. */
    readonly description: string | null;

    /** The fields. */
    readonly fields: Array<{
      inline: boolean;
      name: string;
      value: string;
    }>;

    /** The footer, or `null`. */
    readonly footer: {
      iconUrl: string | null;
      text: string;
    } | null;

    /** The large image, or `null`. */
    readonly image: {
      height: number | null;
      proxyUrl: string | null;
      url: string;
      width: number | null;
    } | null;

    /** The small image in the top right corner, or `null`. */
    readonly thumbnail: {
      height: number | null;
      proxyUrl: string | null;
      url: string;
      width: number | null;
    } | null;

    /** The time shown in the footer, or `null`. */
    readonly timestamp: Date | null;

    /** The title, or `null`. */
    readonly title: string | null;

    /** The link opened by clicking the title, or `null`. */
    readonly url: string | null;
  }

  /** An embed as a plain object. {@link EmbedBuilder} builds the same thing. */
  interface EmbedData {
    /** The author shown above the title. */
    author?: EmbedAuthorData;

    /** Color of the left border, such as `0xff0000` for red. */
    color?: number;

    /** The description, up to 4096 characters of Markdown. */
    description?: string;

    /** Fields, up to 25. */
    fields?: EmbedFieldData[];

    /** The footer. */
    footer?: EmbedFooterData;

    /** The large image below the fields. */
    image?: EmbedMediaData;

    /** The small image in the top right corner. */
    thumbnail?: EmbedMediaData;

    /** The time shown in the footer, as a date or an ISO 8601 string. */
    timestamp?: string | Date;

    /** The title, up to 256 characters. */
    title?: string;

    /** The link opened by clicking the title. */
    url?: string;
  }

  /** An embed to send: a builder or a plain object. */
  type EmbedLike = EmbedBuilder | EmbedData;

  /** The author of an embed, shown above the title. */
  interface EmbedAuthorData {
    /** URL of the small image beside the name. */
    iconUrl?: string;

    /** Name of the author, up to 256 characters. */
    name: string;

    /** Link opened by clicking the name. */
    url?: string;
  }

  /** The footer of an embed. */
  interface EmbedFooterData {
    /** URL of the small image beside the text. */
    iconUrl?: string;

    /** Text of the footer, up to 2048 characters. */
    text: string;
  }

  /** An image in an embed. */
  interface EmbedMediaData {
    /** Height in pixels. */
    height?: number;

    /** URL of the image. */
    url: string;

    /** Width in pixels. */
    width?: number;
  }

  /** A field in an embed. */
  interface EmbedFieldData {
    /** Whether to show the field beside other inline fields. */
    inline?: boolean;

    /** Name of the field, up to 256 characters. */
    name: string;

    /** Value of the field, up to 1024 characters of Markdown. */
    value: string;
  }

  //#endregion

  //#region Polls

  /** A poll on a message. */
  class Poll {
    /** ID of the poll's channel, or `null` if it isn't on a message yet. */
    readonly channelId: Snowflake | null;

    /** ID of the poll's message, or `null` if it isn't on a message yet. */
    readonly messageId: Snowflake | null;

    /** Whether voters can pick more than one answer. */
    readonly allowMultiselect: boolean;

    /** The answers, with their vote counts. */
    readonly answers: Array<{
      answerId: number;
      count: number;
      meVoted: boolean;
      text: string;
    }>;

    /** When voting ends, or `null` if it doesn't. */
    readonly expiration: Date | null;

    /** Discord's layout type. Always `1` for now. */
    readonly layoutType: number;

    /** The question. */
    readonly question: {
      text: string;
    };

    /** Vote counts, or `null` when Discord left them out. */
    readonly results: {
      answerCounts: Array<{ id: number; count: number }>;
      isFinalized: boolean;
    } | null;

    /** Returns the total number of votes, or `null` when Discord left the results out. */
    getTotalVotes(): number | null;

    /** Returns an answer's vote count, or `null` when Discord left the results out. */
    getVoteCount(answerId: number): number | null;

    /** Fetches the users who voted for an answer, up to 100 per request. */
    fetchVoters(
      answerId: number,
      options?: { after?: Snowflake; limit?: number },
    ): Promise<User[]>;

    /** Returns whether voting has ended and the counts are final. */
    isFinalized(): boolean;
  }

  /** A poll to send with a message. */
  interface PollCreateOptions {
    /** Whether voters can pick more than one answer. */
    allowMultiselect?: boolean;

    /** The answers, from 2 to 10, each up to 55 characters. */
    answers: string[];

    /** How many hours voting lasts, from 1 to 768 (32 days). */
    duration: number;

    /** The question, up to 300 characters. */
    question: string;
  }

  //#endregion

  //#region Users and members

  /**
   * A Discord user. It holds the user as they were when the event or request
   * arrived; call {@link User.fetch} for their current profile.
   *
   * @see https://docs.discord.com/developers/resources/user#user-object
   */
  class User implements Mentionable {
    /** The user's banner color, or `null`. */
    readonly accentColor: number | null | undefined;

    /** Hash of the user's avatar, or `null` for the default one. */
    readonly avatar: string | null | undefined;

    /** Hash of the user's banner, or `null`. */
    readonly banner: string | null | undefined;

    /** Whether the user is a bot. `undefined` when Discord left it out. */
    readonly bot: boolean | null | undefined;

    /** When the account was created. */
    readonly createdAt: Date;

    /**
     * The four digits after the name on older accounts, such as `"1234"`. `"0"`
     * for accounts with a unique username.
     */
    readonly discriminator: string | undefined;

    /** The user's display name if they set one, otherwise their username. */
    readonly displayName: string;

    /** The user's display name, or `null` if they haven't set one. */
    readonly globalName: string | null | undefined;

    /** ID of the user. */
    readonly id: Snowflake;

    /** Bitfield of the badges on the user's profile, or `null`. */
    readonly publicFlags: number | null | undefined;

    /** The server tag the user shows beside their name, or `null`. */
    readonly primaryGuild: UserPrimaryGuild | null | undefined;

    /** The user's unique username. */
    readonly username: string;

    /** Returns the URL of the user's avatar, or of the default avatar if they have none. */
    displayAvatarURL(options?: {
      format?: "png" | "jpg" | "webp" | "gif";
      size?: number;
    }): string;

    /** Fetches the user again. */
    fetch(): Promise<User>;

    /** Returns `username#discriminator`, which is `username#0` for most accounts. */
    getTag(): string;

    /** Returns the user's mention, `<@id>`. */
    toMention(): string;
  }

  /** The server tag a user shows beside their name. */
  interface UserPrimaryGuild {
    /** ID of the server the tag is from, or `null`. */
    identityGuildId: Snowflake | null;
    /** Whether the user shows the tag. */
    identityEnabled: boolean;
    /** The tag's text, up to 4 characters, or `null`. */
    tag: string | null;
    /** Hash of the tag's badge image, or `null`. */
    badge: string | null;
  }

  /**
   * A user in a guild: their roles, nickname and timeout. {@link GuildMember.user}
   * is the account itself.
   *
   * @see https://docs.discord.com/developers/resources/guild#guild-member-object
   */
  class GuildMember implements Mentionable {
    /** When the member's timeout ends, or `null` if they aren't timed out. */
    readonly communicationDisabledUntil: Date | null | undefined;

    /** When the account was created. */
    readonly createdAt: Date;

    /** The member's nickname, display name or username, whichever is set first. */
    readonly displayName: string;

    /** ID of the member's guild. */
    readonly guildId: Snowflake;

    /** ID of the user. */
    readonly id: Snowflake;

    /** Whether the member is timed out. */
    readonly isTimedOut: boolean;

    /** When the member joined the guild. `undefined` when Discord left it out. */
    readonly joinedAt: Date | undefined;

    /** The member's nickname in this guild, or `null`. */
    readonly nick: string | null | undefined;

    /** Whether the member still has to accept the guild's rules. */
    readonly pending: boolean | undefined;

    /**
     * The member's permissions from their roles. Discord only includes them in
     * interactions; use {@link GuildMember.resolvePermissions} elsewhere.
     */
    readonly permissions: bigint | undefined;

    /** When the member started boosting the guild, or `null`. */
    readonly premiumSince: Date | null | undefined;

    /** IDs of the member's roles, not counting `@everyone`. */
    readonly roles: Snowflake[] | undefined;

    /** The member's user account. */
    readonly user: User;

    /**
     * Adds a role to the member.
     *
     * @param reason Reason shown in the audit log.
     */
    addRole(roleId: Snowflake, reason?: string): Promise<void>;

    /**
     * Removes a role from the member.
     *
     * @param reason Reason shown in the audit log.
     */
    removeRole(roleId: Snowflake, reason?: string): Promise<void>;

    /** Returns whether the member has a role. */
    hasRole(roleId: Snowflake): boolean;

    /** Fetches the member's roles. */
    fetchRoles(): Promise<Role[]>;

    /** Fetches the member's highest role, or returns `null` if they only have `@everyone`. */
    highestRole(): Promise<Role | null>;

    /**
     * Returns whether {@link GuildMember.permissions} includes a permission.
     * Always `false` outside interactions, where Discord leaves the permissions
     * out; use {@link GuildMember.canIn} there.
     */
    can(permission: PermissionFlag): boolean;

    /**
     * Returns whether the member has a permission in a channel, counting the
     * channel's overwrites.
     */
    canIn(channelId: Snowflake, permission: PermissionFlag): Promise<boolean>;

    /**
     * Works out the member's permissions from the guild's roles, and from a
     * channel's overwrites when `channelId` is given. The owner and
     * administrators get every permission.
     */
    resolvePermissions(channelId?: Snowflake): Promise<bigint>;

    /**
     * Changes the member.
     *
     * @returns The updated member.
     */
    edit(options: GuildMemberEditOptions): Promise<GuildMember>;

    /**
     * Sets the member's nickname, or removes it with `null`. Needs Manage Nicknames.
     *
     * @param reason Reason shown in the audit log.
     */
    setNickname(nickname: string | null, reason?: string): Promise<void>;

    /**
     * Times the member out, or ends their timeout with `null`.
     *
     * @param durationMs How long, in milliseconds, up to 28 days.
     * @param reason Reason shown in the audit log.
     */
    timeout(durationMs: number | null, reason?: string): Promise<void>;

    /**
     * Kicks the member.
     *
     * @param reason Reason shown in the audit log.
     */
    kick(reason?: string): Promise<void>;

    /**
     * Bans the member.
     *
     * @param options.deleteMessageSeconds Delete their messages from this many seconds back, up to 604800 (7 days).
     * @param options.reason Reason shown in the audit log.
     */
    ban(options?: {
      deleteMessageSeconds?: number;
      reason?: string;
    }): Promise<void>;

    /** Fetches the member again. */
    fetch(): Promise<GuildMember>;

    /** Fetches the member's guild. */
    fetchGuild(): Promise<Guild>;

    /**
     * Reads a presence from Weeble's cache: this member's, or another user's in
     * the same guild. Returns `null` when the cache has none.
     */
    getCachedPresence(userId?: Snowflake): Promise<Presence | null>;

    /** Reads the member's voice state from Weeble's cache, or returns `null` if they aren't in voice. */
    getVoiceState(): Promise<VoiceState | null>;

    /** Returns the URL of the member's guild avatar, or of their user avatar if they have none. */
    displayAvatarURL(options?: {
      format?: "png" | "jpg" | "webp" | "gif";
      size?: number;
    }): string;

    /** Returns the member's mention, `<@id>`. */
    toMention(): string;

    /** @deprecated Use {@link GuildMember.fetchRoles}. */
    roleObjects(): Promise<Role[]>;
  }

  /** Changes to a guild member. Fields left out stay as they are. */
  interface GuildMemberEditOptions {
    /** Voice channel to move the member to, or `null` to disconnect them. */
    channelId?: Snowflake | null;
    /** When the member's timeout ends, or `null` to end it now. */
    communicationDisabledUntil?: Date | null;
    /** Whether the member is deafened in voice. */
    deaf?: boolean;
    /** Bitfield of guild member flags. */
    flags?: number;
    /** Whether the member is muted in voice. */
    mute?: boolean;
    /** The member's nickname, or `null` to remove it. */
    nick?: string | null;
    /** Reason shown in the audit log. */
    reason?: string;
    /** IDs of every role the member should have. Roles left out are removed. */
    roles?: Snowflake[];
  }

  /** Which members to fetch. */
  interface FetchMembersOptions {
    /** Fetch members whose user ID is above this one. */
    after?: Snowflake;

    /** How many members to fetch, up to 1000. */
    limit?: number;
  }

  /**
   * A user's status and activities in a guild. Weeble keeps presences from the
   * gateway, which needs the Presence intent; a user has none until Discord
   * sends an update for them.
   *
   * @see https://docs.discord.com/developers/events/gateway-events#presence-update
   */
  class Presence {
    /** What the user is doing, such as playing a game or a custom status. */
    readonly activities: PresenceActivity[];

    /** The user's status on each kind of device. */
    readonly clientStatus: ClientStatus;

    /** ID of the guild. */
    readonly guildId: Snowflake;

    /** The presence as Discord sent it. */
    readonly raw: Record<string, unknown>;

    /** The user's status. */
    readonly status: PresenceStatus;

    /** The user, or `null` when the presence only has their ID. */
    readonly user: User | null;

    /** ID of the user. */
    readonly userId: Snowflake;

    /** Returns the user's custom status, or `null`. */
    getCustomStatus(): PresenceActivity | null;

    /** Returns the user's first activity other than a custom status, or `null`. */
    getPrimaryActivity(): PresenceActivity | null;

    /** Returns whether the user is online. */
    isOnline(): boolean;

    /** Returns whether the user is idle. */
    isIdle(): boolean;

    /** Returns whether the user is on Do Not Disturb. */
    isDnd(): boolean;

    /** Returns whether the user is offline or invisible. */
    isOffline(): boolean;

    /** Fetches the user. */
    fetchUser(): Promise<User>;

    /** Fetches the user's member, or returns `null` if they left. */
    fetchMember(): Promise<GuildMember | null>;

    /** Fetches the guild. */
    fetchGuild(): Promise<Guild>;
  }

  /** A user's status. */
  type PresenceStatus =
    | "online"
    | "idle"
    | "dnd"
    | "offline"
    | "invisible"
    | string;

  /** Something a user is doing, as Discord sends it. */
  interface PresenceActivity {
    /** ID of the application, for a game or app. */
    application_id?: Snowflake;

    /** Images for the activity. */
    assets?: Record<string, unknown>;

    /** Buttons on the activity. */
    buttons?: unknown[];

    /** When the activity started showing, in milliseconds since the Unix epoch. */
    created_at?: number;

    /** What the user is doing, such as the current level, or `null`. */
    details?: string | null;

    /** Emoji of a custom status, or `null`. */
    emoji?: EmojiData | null;

    /** Bitfield of activity flags. */
    flags?: number;

    /** Whether the activity is a game session. */
    instance?: boolean;

    /** Name of the activity, such as the game. */
    name?: string;

    /** The party the user is in. */
    party?: Record<string, unknown>;

    /** Secrets for joining or spectating. */
    secrets?: Record<string, unknown>;

    /** The user's state, such as "In a match", or the text of a custom status. */
    state?: string | null;

    /** When the activity started and ends. */
    timestamps?: Record<string, unknown>;

    /** The kind of activity, such as playing or listening. */
    type?: ActivityType;

    /** Stream URL, for streaming. */
    url?: string | null;
  }

  /** A user's status on each kind of device. Devices they aren't using are left out. */
  interface ClientStatus {
    /** Status on desktop. */
    desktop?: PresenceStatus;

    /** Status on mobile. */
    mobile?: PresenceStatus;

    /** Status on the web. */
    web?: PresenceStatus;
  }

  /** A user's voice connection in a guild. */
  class VoiceState {
    /** ID of the voice channel, or `null` if the user isn't in one. */
    readonly channelId: Snowflake | null | undefined;

    /** Whether the user is deafened by a moderator. */
    readonly deaf: boolean | undefined;

    /** ID of the guild. */
    readonly guildId: Snowflake;

    /** The user's member, or `null`. */
    readonly member: GuildMember | null;

    /** Whether the user is muted by a moderator. */
    readonly mute: boolean | undefined;

    /** Whether the user deafened themselves. */
    readonly selfDeaf: boolean | undefined;

    /** Whether the user muted themselves. */
    readonly selfMute: boolean | undefined;

    /** Whether the user is streaming. */
    readonly selfStream: boolean | undefined;

    /** Whether the user's camera is on. */
    readonly selfVideo: boolean | undefined;

    /** ID of the voice session. */
    readonly sessionId: string;

    /** Whether the user is in the audience of a stage, unable to speak. */
    readonly suppress: boolean | undefined;

    /** When the user asked to speak in a stage, in milliseconds since the Unix epoch, or `null`. */
    readonly requestToSpeakTimestamp: number | null;

    /** ID of the user. */
    readonly userId: Snowflake;
  }

  //#endregion

  //#region Channels

  /**
   * A channel of any type. Narrow it with a check such as
   * {@link isGuildTextChannel}, or by comparing {@link Channel.type}, before
   * using methods of a particular kind of channel.
   *
   * @see https://docs.discord.com/developers/resources/channel#channel-object
   */
  class Channel implements Mentionable {
    /** When the channel was created. */
    readonly createdAt: Date | null;

    /** ID of the channel. */
    readonly id: Snowflake;

    /** The type of the channel. */
    readonly type: ChannelType;

    /**
     * Deletes the channel.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Fetches the channel again. */
    fetch(): Promise<AnyChannel>;

    /** Returns the channel's mention, `<#id>`. */
    toMention(): string;
  }

  /** A channel in a guild. Every guild channel class extends it. */
  class GuildChannel extends Channel {
    /** ID of the channel's guild. */
    readonly guildId: Snowflake;

    /** Name of the channel. */
    readonly name: string | undefined;

    /** ID of the channel's category, or `null` if it has none. */
    readonly parentId: Snowflake | null | undefined;

    /**
     * The channel's permission overwrites. `allow` and `deny` are permission
     * bitfields as decimal strings.
     */
    readonly permissionOverwrites:
      | Array<{
          allow: string;
          deny: string;
          id: Snowflake;
          type: PermissionOverwriteType;
        }>
      | undefined;

    /** Changes the channel's permission overwrites. */
    readonly permissions: ChannelPermissionManager;

    /** Position of the channel in the channel list. */
    readonly position: number | undefined;

    /** Link to the channel in Discord. */
    readonly url: string;

    /** Returns whether a member has a permission in this channel. */
    canMember(
      permission: PermissionFlag,
      member: GuildMember,
    ): Promise<boolean>;

    /** Returns whether a role has a permission in this channel. */
    canRole(permission: PermissionFlag, role: Role): Promise<boolean>;

    /**
     * Works out a member's permissions in this channel from Weeble's cache,
     * counting their roles and the channel's overwrites.
     */
    getMemberPermissions(member: GuildMember): Promise<bigint>;

    /** Works out a role's permissions in this channel, counting the channel's overwrites. */
    getRolePermissions(role: Role): Promise<bigint>;

    /**
     * Fetches a member's permissions in this channel from Discord. Use
     * {@link GuildChannel.getMemberPermissions} to work them out without a request.
     */
    fetchMemberPermissions(userId: Snowflake): Promise<bigint>;

    /** Fetches a role's permissions in this channel from Discord. */
    fetchRolePermissions(roleId: Snowflake): Promise<bigint>;

    /**
     * Creates a copy of the channel, with its category, position, overwrites and
     * settings. Messages and threads aren't copied.
     *
     * @param options.name Name of the copy. Defaults to this channel's name.
     * @param options.reason Reason shown in the audit log.
     */
    clone(options?: { name?: string; reason?: string }): Promise<AnyGuildChannel>;

    /** Creates an invite to the channel. */
    createInvite(options?: InviteCreateOptions): Promise<Invite>;

    /** Fetches the channel's invites. */
    fetchInvites(): Promise<Invite[]>;

    /** Fetches the channel's guild. */
    fetchGuild(): Promise<Guild>;

    /** Returns the channel's mention, `<#id>`. */
    toMention(): string;
  }

  /**
   * A text channel in a guild. Announcement channels are text channels too.
   *
   * ```ts
   * const channel = await discord.fetchGuildTextChannel('1504537312841961583');
   * if (channel) await channel.send('Deployment finished.');
   * ```
   */
  class GuildTextChannel extends GuildChannel {
    readonly type:
      | typeof ChannelType.GUILD_TEXT
      | typeof ChannelType.GUILD_ANNOUNCEMENT;

    /** Whether the channel is age-restricted. */
    readonly nsfw: boolean | undefined;

    /** Slowmode, in seconds. `0` when off. */
    readonly rateLimitPerUser: number | undefined;

    /** The channel's topic, or `null`. */
    readonly topic: string | null | undefined;

    /** Sends a message to the channel. */
    send(content: string | SendMessageOptions): Promise<Message>;

    /** Shows the bot as typing in the channel for about 10 seconds, or until it sends a message. */
    typing(): Promise<void>;

    /**
     * Fetches a message.
     *
     * @returns The message, or `null` if it doesn't exist. Other failures, such
     * as missing Read Message History, throw.
     */
    fetchMessage(messageId: Snowflake): Promise<Message | null>;

    /** Fetches up to 100 messages, newest first. */
    fetchMessages(options?: FetchMessagesOptions): Promise<Message[]>;

    /**
     * Deletes 2 to 100 messages at once. Discord refuses messages older than 14 days.
     *
     * @param reason Reason shown in the audit log.
     */
    bulkDelete(messageIds: Snowflake[], reason?: string): Promise<void>;

    /** Fetches a page of pinned messages, most recently pinned first. */
    fetchPins(options?: {
      before?: string | Date;
      limit?: number;
    }): Promise<PinPage>;

    /**
     * Sends a poll.
     *
     * @param duration How many hours voting lasts, from 1 to 768.
     * @param allowMultiselect Whether voters can pick more than one answer.
     */
    createPoll(
      question: string,
      answers: string[],
      duration: number,
      allowMultiselect?: boolean,
    ): Promise<Message>;

    /** Creates a thread without a starter message. */
    createThread(options: ThreadCreateOptions): Promise<ThreadChannel>;

    /** Creates a thread from a message. */
    createThreadFromMessage(
      messageId: Snowflake,
      options: ThreadFromMessageCreateOptions,
    ): Promise<ThreadChannel>;

    /** Fetches the channel's active threads. */
    fetchActiveThreads(): Promise<ThreadChannel[]>;

    /**
     * Fetches a page of archived threads, newest first. Private threads need
     * `type: "private"` and Manage Threads. Pass `nextBefore` back as `before`
     * for the next page:
     *
     * ```ts
     * let page = await channel.fetchArchivedThreads({ limit: 50 });
     * while (page.nextBefore) {
     *   page = await channel.fetchArchivedThreads({ limit: 50, before: page.nextBefore });
     * }
     * ```
     */
    fetchArchivedThreads(
      options?: ArchivedThreadsOptions,
    ): Promise<ArchivedThreadPage>;

    /**
     * Fetches a page of archived private threads the bot joined, newest first.
     * Needs only Read Message History, unlike
     * `fetchArchivedThreads({ type: "private" })`.
     *
     * @param options.before ID of a thread; fetch threads archived before it.
     * @param options.limit How many threads to fetch, from 2 to 100.
     */
    fetchJoinedPrivateArchivedThreads(options?: {
      before?: Snowflake;
      limit?: number;
    }): Promise<ArchivedThreadPage>;

    /**
     * Creates a webhook in the channel.
     *
     * @param options.avatar Avatar image as a data URI.
     * @param options.reason Reason shown in the audit log.
     */
    createWebhook(options: {
      avatar?: string;
      name: string;
      reason?: string;
    }): Promise<Webhook>;

    /** Fetches the channel's webhooks. */
    fetchWebhooks(): Promise<Webhook[]>;

    /** Changes the channel. */
    edit(options: GuildTextChannelEditOptions): Promise<GuildTextChannel>;

    /** Sets whether the channel is age-restricted. */
    setNsfw(nsfw: boolean): Promise<GuildTextChannel>;

    /** Sets slowmode, in seconds from 0 (off) to 21600. */
    setSlowmode(seconds: number): Promise<GuildTextChannel>;

    /** Sets the topic, or removes it with `null`. */
    setTopic(topic: string | null): Promise<GuildTextChannel>;

    /** @deprecated Use {@link GuildTextChannel.fetchPins}, which pages through every pin. */
    fetchPinnedMessages(): Promise<Message[]>;
  }

  /** A channel whose messages other servers can follow. */
  class GuildAnnouncementChannel extends GuildTextChannel {
    readonly type: typeof ChannelType.GUILD_ANNOUNCEMENT;

    /**
     * Follows the channel, so its published messages are copied to another channel.
     *
     * @param targetChannelId The channel to copy messages to.
     * @param reason Reason shown in the audit log.
     */
    follow(targetChannelId: Snowflake, reason?: string): Promise<void>;

    /** Publishes a message to the channels that follow this one. */
    publishMessage(messageId: Snowflake): Promise<Message>;
  }

  /** A voice channel. */
  class GuildVoiceChannel extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_VOICE;

    /** Audio bitrate, in bits per second. */
    readonly bitrate: number | undefined;

    /** How many users can join, or `0` for no limit. */
    readonly userLimit: number | undefined;

    /** Reads the voice states of the users in the channel from Weeble's cache. */
    getVoiceStates(): Promise<VoiceState[]>;

    /** Sets the status shown under the channel's name. */
    setStatus(status: string, reason?: string): Promise<void>;

    /** Removes the channel's status. */
    clearStatus(reason?: string): Promise<void>;

    /**
     * Plays a soundboard sound in the channel. The bot must be in the channel,
     * and needs Speak and Use Soundboard.
     *
     * @param sourceGuildId The sound's server, if it isn't this one. Needs Use External Sounds.
     */
    sendSoundboardSound(soundId: Snowflake, sourceGuildId?: Snowflake): Promise<void>;

    /** Changes the channel. */
    edit(options: GuildVoiceChannelEditOptions): Promise<GuildVoiceChannel>;
  }

  /** A stage channel, where speakers talk to an audience. */
  class GuildStageVoiceChannel extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_STAGE_VOICE;

    /** Audio bitrate, in bits per second. */
    readonly bitrate: number | undefined;

    /** The stage's topic, or `null`. */
    readonly topic: string | null | undefined;

    /** Reads the voice states of the users in the channel from Weeble's cache. */
    getVoiceStates(): Promise<VoiceState[]>;

    /**
     * Makes someone a speaker or moves them to the audience. Needs Mute Members,
     * or Request to Speak to move the bot itself.
     *
     * @param userId The user, or `"@me"` for the bot.
     */
    setSpeaker(userId: Snowflake | "@me", speaker: boolean): Promise<void>;

    /** Raises the bot's hand. The bot must be in the channel, and needs Request to Speak. */
    requestToSpeak(): Promise<void>;

    /** Sets the status shown under the channel's name. */
    setStatus(status: string, reason?: string): Promise<void>;

    /** Removes the channel's status. */
    clearStatus(reason?: string): Promise<void>;

    /** Changes the channel. */
    edit(
      options: GuildStageVoiceChannelEditOptions,
    ): Promise<GuildStageVoiceChannel>;
  }

  /** A category that groups channels in the channel list. */
  class GuildCategory extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_CATEGORY;

    /** Always `null`: categories can't be nested. */
    readonly parentId: null;

    /** Changes the category. */
    edit(options: {
      name?: string;
      position?: number;
      reason?: string;
    }): Promise<GuildCategory>;
  }

  /** A forum channel, where each post is a thread. */
  class GuildForumChannel extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_FORUM;

    /** Tags that posts can have. */
    readonly availableTags: ForumTag[];

    /** Creates a post. */
    createPost(options: ForumPostCreateOptions): Promise<ThreadChannel>;

    /** Fetches the channel's active posts. */
    fetchActiveThreads(): Promise<ThreadChannel[]>;

    /** Fetches a page of archived posts, newest first, as {@link GuildTextChannel.fetchArchivedThreads} does. */
    fetchArchivedThreads(
      options?: ArchivedThreadsOptions,
    ): Promise<ArchivedThreadPage>;

    /**
     * Searches posts by title, active and archived. Check `status` first:
     * Discord may still be indexing the channel.
     *
     * ```ts
     * const found = await forum.searchPosts({ name: "refund", sortBy: "last_message_time" });
     * if (found.status === "ready") {
     *   for (const post of found.threads) console.log(post.name);
     * }
     * ```
     */
    searchPosts(options?: ForumPostSearchOptions): Promise<ForumPostSearchResult>;

    /**
     * Changes the channel. `availableTags` replaces every tag, so pass the
     * existing ones, with their `id`, to keep them:
     *
     * ```ts
     * await forum.edit({
     *   availableTags: [...forum.availableTags, { name: "Solved", emojiName: "✅" }],
     * });
     * ```
     */
    edit(options: ForumChannelEditOptions): Promise<GuildForumChannel>;
  }

  /** A media channel: a forum where every post starts with an image or video. */
  class GuildMediaChannel extends GuildChannel {
    readonly type: typeof ChannelType.GUILD_MEDIA;

    /** Tags that posts can have. */
    readonly availableTags: ForumTag[];

    /** Creates a post. */
    createPost(options: ForumPostCreateOptions): Promise<ThreadChannel>;

    /** Fetches the channel's active posts. */
    fetchActiveThreads(): Promise<ThreadChannel[]>;

    /** Fetches a page of archived posts, newest first, as {@link GuildTextChannel.fetchArchivedThreads} does. */
    fetchArchivedThreads(
      options?: ArchivedThreadsOptions,
    ): Promise<ArchivedThreadPage>;

    /** Searches posts by title, as {@link GuildForumChannel.searchPosts} does. */
    searchPosts(options?: ForumPostSearchOptions): Promise<ForumPostSearchResult>;

    /** Changes the channel. `availableTags` replaces every tag. */
    edit(options: ForumChannelEditOptions): Promise<GuildMediaChannel>;
  }

  /** A thread, or a post in a forum or media channel. */
  class ThreadChannel extends Channel {
    readonly type:
      | typeof ChannelType.ANNOUNCEMENT_THREAD
      | typeof ChannelType.PUBLIC_THREAD
      | typeof ChannelType.PRIVATE_THREAD;

    /** IDs of the tags on a forum or media post. */
    readonly appliedTags: Snowflake[];

    /** ID of the thread's guild. */
    readonly guildId: Snowflake;

    /** ID of the user who started the thread, or `null`. */
    readonly ownerId: Snowflake | null | undefined;

    /** ID of the channel the thread is in, or `null`. */
    readonly parentId: Snowflake | null | undefined;

    /** Name of the thread. */
    readonly name: string | undefined;

    /** Whether the thread is archived. */
    readonly archived: boolean | undefined;

    /** Whether the thread is locked, so only members with Manage Threads can unarchive it. */
    readonly locked: boolean | undefined;

    /** Minutes without activity before Discord archives the thread. */
    readonly autoArchiveDuration: number | null | undefined;

    /** About how many messages the thread has, not counting the first. */
    readonly messageCount: number | null | undefined;

    /** About how many members the thread has. Discord stops counting at 50. */
    readonly memberCount: number | null | undefined;

    /** How many messages were ever sent in the thread, counting deleted ones. */
    readonly totalMessageSent: number | null | undefined;

    /** Slowmode, in seconds. */
    readonly rateLimitPerUser: number | null | undefined;

    /** Sends a message to the thread. */
    send(content: string | SendMessageOptions): Promise<Message>;

    /** Shows the bot as typing in the thread for about 10 seconds, or until it sends a message. */
    typing(): Promise<void>;

    /**
     * Fetches a message.
     *
     * @returns The message, or `null` if it doesn't exist. Other failures, such
     * as missing Read Message History, throw.
     */
    fetchMessage(messageId: Snowflake): Promise<Message | null>;

    /** Fetches up to 100 messages, newest first. */
    fetchMessages(options?: FetchMessagesOptions): Promise<Message[]>;

    /** Fetches a page of pinned messages, most recently pinned first. */
    fetchPins(options?: {
      before?: string | Date;
      limit?: number;
    }): Promise<PinPage>;

    /** Adds the bot to the thread. */
    join(): Promise<void>;

    /** Removes the bot from the thread. */
    leave(): Promise<void>;

    /** Adds a member to the thread. */
    addThreadMember(userId: Snowflake): Promise<void>;

    /** Removes a member from the thread. */
    removeThreadMember(userId: Snowflake): Promise<void>;

    /** Fetches a member of the thread, or returns `null` if the user isn't in it. */
    fetchThreadMember(userId: Snowflake): Promise<{
      id: Snowflake;
      joinedAt: Date | null;
      userId: Snowflake;
    } | null>;

    /** Fetches the thread's members. */
    fetchThreadMembers(): Promise<
      Array<{
        id: Snowflake;
        joinedAt: Date | null;
        userId: Snowflake;
      }>
    >;

    /**
     * Archives the thread.
     *
     * @param reason Reason shown in the audit log.
     */
    archive(reason?: string): Promise<ThreadChannel>;

    /**
     * Unarchives the thread.
     *
     * @param reason Reason shown in the audit log.
     */
    unarchive(reason?: string): Promise<ThreadChannel>;

    /** Changes the thread. */
    edit(options: ThreadChannelEditOptions): Promise<ThreadChannel>;
  }

  /** Any channel class. */
  type AnyChannel = AnyGuildChannel | ThreadChannel;

  /** Any guild channel class. Threads aren't included. */
  type AnyGuildChannel =
    | GuildTextChannel
    | GuildVoiceChannel
    | GuildCategory
    | GuildAnnouncementChannel
    | GuildForumChannel
    | GuildMediaChannel
    | GuildStageVoiceChannel;

  /** A channel that messages can be sent to. */
  type TextChannel =
    | GuildTextChannel
    | GuildAnnouncementChannel
    | ThreadChannel;

  /** Changes a guild channel's permission overwrites, as {@link GuildChannel.permissions}. */
  class ChannelPermissionManager {
    /**
     * Sets the overwrite for a role or member, replacing the one it has.
     * Permissions left out of `allow` and `deny` are inherited.
     *
     * @param overwriteId ID of the role or member.
     */
    set(
      overwriteId: Snowflake,
      options: PermissionOverwriteSetOptions,
    ): Promise<void>;

    /**
     * Deletes the overwrite for a role or member.
     *
     * @param overwriteId ID of the role or member.
     */
    delete(overwriteId: Snowflake): Promise<void>;

    /** Works out a member's or role's permissions in the channel. */
    for(target: GuildMember | Role): Promise<bigint>;
  }

  /** A permission overwrite for a role or member. */
  interface PermissionOverwriteSetOptions {
    /** Permissions to allow, as a bitfield in a decimal string. */
    allow?: string;
    /** Permissions to deny, as a bitfield in a decimal string. */
    deny?: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** Whether the overwrite is for a role or a member. */
    type: PermissionOverwriteType;
  }

  /** Where to move a channel, for {@link Guild.editChannelPositions}. */
  interface ChannelPosition {
    /** ID of the channel. */
    id: Snowflake;
    /** The channel's new position. */
    position?: number | null;
    /** Category to move the channel into, or `null` to take it out of its category. */
    parentId?: Snowflake | null;
    /** Whether to replace the channel's overwrites with its new category's. */
    lockPermissions?: boolean;
  }

  /** A channel to create. */
  interface GuildChannelCreateOptions {
    /** Name of the channel, up to 100 characters. */
    name: string;
    /** Audio bitrate of a voice channel, in bits per second. */
    bitrate?: number;
    /** Whether the channel is age-restricted. */
    nsfw?: boolean;
    /** ID of the category to put the channel in. */
    parentId?: Snowflake | null;
    /** The channel's permission overwrites. */
    permissionOverwrites?: Array<{
      allow?: string;
      deny?: string;
      id: Snowflake;
      type: PermissionOverwriteType;
    }>;
    /** Position of the channel in the channel list. */
    position?: number;
    /** Slowmode, in seconds from 0 to 21600. */
    rateLimitPerUser?: number;
    /** Reason shown in the audit log. */
    reason?: string;
    /** The channel's topic. */
    topic?: string;
    /** The type of channel. Defaults to a text channel. */
    type?: ChannelType;
    /** How many users can join a voice channel, or `0` for no limit. */
    userLimit?: number;
  }

  /** Changes to a text channel. Fields left out stay as they are. */
  interface GuildTextChannelEditOptions {
    /** Name of the channel. */
    name?: string;
    /** Whether the channel is age-restricted. */
    nsfw?: boolean;
    /** Slowmode, in seconds from 0 to 21600. */
    rateLimitPerUser?: number;
    /** Reason shown in the audit log. */
    reason?: string;
    /** The channel's topic, or `null` to remove it. */
    topic?: string | null;
  }

  /** Changes to a voice channel. Fields left out stay as they are. */
  interface GuildVoiceChannelEditOptions {
    /** Audio bitrate, in bits per second. */
    bitrate?: number;
    /** Name of the channel. */
    name?: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** How many users can join, or `0` for no limit. */
    userLimit?: number;
  }

  /** Changes to a stage channel. Fields left out stay as they are. */
  interface GuildStageVoiceChannelEditOptions {
    /** Audio bitrate, in bits per second. */
    bitrate?: number;
    /** Name of the channel. */
    name?: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** The stage's topic. */
    topic?: string;
  }

  /** Changes to a forum or media channel. Fields left out stay as they are. */
  interface ForumChannelEditOptions {
    /** Name of the channel. */
    name?: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** The guidelines shown above the posts, or `null` to remove them. */
    topic?: string | null;
    /** Every tag the channel should have, up to 20. */
    availableTags?: ForumTagInput[];
  }

  /** A tag that forum and media posts can have. */
  interface ForumTag {
    /** ID of the tag. */
    id: Snowflake;
    /** Name of the tag. */
    name: string;
    /** Whether only members with Manage Threads can add the tag to a post. */
    moderated: boolean;
    /** ID of the tag's custom emoji, or `null`. */
    emojiId: Snowflake | null;
    /** The tag's Unicode emoji, or `null`. */
    emojiName: string | null;
  }

  /** A tag in {@link ForumChannelEditOptions.availableTags}. */
  interface ForumTagInput {
    /** ID of a tag to keep. Leave it out to create a tag. */
    id?: Snowflake;
    /** Name of the tag, up to 20 characters. */
    name: string;
    /** Whether only members with Manage Threads can add the tag to a post. */
    moderated?: boolean;
    /** ID of a custom emoji for the tag. Set this or `emojiName`, not both. */
    emojiId?: Snowflake | null;
    /** A Unicode emoji for the tag. */
    emojiName?: string | null;
  }

  /** A post to create in a forum or media channel. */
  interface ForumPostCreateOptions {
    /** The post's first message. */
    message: SendMessageOptions;
    /** Title of the post. */
    name: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** IDs of the tags to add to the post, up to 5. */
    tags?: Snowflake[];
  }

  /** What to search for with {@link GuildForumChannel.searchPosts}. */
  interface ForumPostSearchOptions {
    /** Words to look for in titles, up to 100 characters. */
    name?: string;
    /** `true` for archived posts only, `false` for active ones only. Leave it out for both. */
    archived?: boolean;
    /** What to sort by. Defaults to relevance when `name` is set. */
    sortBy?: "relevance" | "creation_time" | "last_message_time" | "archive_time";
    /** `"asc"` for oldest or least relevant first. Defaults to `"desc"`. */
    sortOrder?: "asc" | "desc";
    /** Posts per page, from 1 to 25. */
    limit?: number;
    /** How many posts to skip, to get later pages. */
    offset?: number;
  }

  /** Results of {@link GuildForumChannel.searchPosts}. Check `status` before reading `threads`. */
  type ForumPostSearchResult =
    | {
        status: "ready";
        threads: ThreadChannel[];
        /** How many posts match, across every page. */
        totalResults: number;
        /** Whether there are more pages. */
        hasMore: boolean;
      }
    | {
        /** Discord is still indexing the channel. Search again later. */
        status: "indexing";
        threads: [];
        totalResults: null;
        hasMore: false;
        /** Seconds to wait before searching again. */
        retryAfter: number;
      };

  /** A thread to create without a starter message. */
  interface ThreadCreateOptions extends ThreadFromMessageCreateOptions {
    /** Whether members without Manage Threads can add people to a private thread. */
    invitable?: boolean;
    /** The type of thread. Defaults to a private thread. */
    type?: ChannelType;
  }

  /** A thread to create from a message. */
  interface ThreadFromMessageCreateOptions {
    /** Minutes without activity before the thread is archived: 60, 1440, 4320 or 10080. */
    autoArchiveDuration?: number;
    /** Name of the thread, up to 100 characters. */
    name: string;
    /** Slowmode, in seconds from 0 to 21600. */
    rateLimitPerUser?: number;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** Changes to a thread. Fields left out stay as they are. */
  interface ThreadChannelEditOptions {
    /** IDs of every tag a forum or media post should have. */
    appliedTags?: Snowflake[];
    /** Whether the thread is archived. */
    archived?: boolean;
    /** Minutes without activity before the thread is archived: 60, 1440, 4320 or 10080. */
    autoArchiveDuration?: number;
    /** Whether members without Manage Threads can add people to a private thread. */
    invitable?: boolean;
    /** Whether the thread is locked. */
    locked?: boolean;
    /** Name of the thread. */
    name?: string;
    /** Slowmode, in seconds from 0 to 21600. */
    rateLimitPerUser?: number;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** Which archived threads to fetch. */
  interface ArchivedThreadsOptions {
    /** Whether to fetch public or private threads. Defaults to `"public"`. */
    type?: "public" | "private";
    /** Fetch threads archived before this time. */
    before?: Date | string;
    /** How many threads to fetch. */
    limit?: number;
  }

  /** A page of archived threads. */
  interface ArchivedThreadPage {
    /** The threads. */
    threads: ThreadChannel[];
    /** Whether there are older threads. */
    hasMore: boolean;
    /** Value to pass as `before` to fetch the next page, or `null` on the last page. */
    nextBefore: string | null;
  }

  //#endregion

  //#region Guilds

  /**
   * A Discord server.
   *
   * Fields are `undefined` when Discord didn't send them. A guild from
   * {@link fetchGuild} can come from Weeble's cache, and then only has `id`,
   * `name` and `ownerId`; call {@link Guild.fetch} for the rest.
   *
   * ```ts
   * const guild = await message.fetchGuild();
   * const member = guild && message.author
   *   ? await guild.fetchMember(message.author.id)
   *   : null;
   * ```
   *
   * @see https://docs.discord.com/developers/resources/guild#guild-object
   */
  class Guild {
    /** ID of the guild. */
    readonly id: Snowflake;

    /** Name of the guild. */
    readonly name: string;

    /** The guild's description, or `null`. */
    readonly description: string | null | undefined;

    /** ID of the owner. */
    readonly ownerId: Snowflake | null | undefined;

    /** When the guild was created. */
    readonly createdAt: Date;

    /** When the guild was created, in milliseconds since the Unix epoch. */
    readonly createdTimestamp: number;

    /** Hash of the guild's icon, or `null`. Use {@link Guild.iconURL} for its URL. */
    readonly icon: string | null | undefined;

    /** Hash of the guild's banner, or `null`. Use {@link Guild.bannerURL} for its URL. */
    readonly banner: string | null | undefined;

    /** Hash of the invite background image, or `null`. */
    readonly splash: string | null | undefined;

    /** Hash of the Server Discovery background image, or `null`. */
    readonly discoverySplash: string | null | undefined;

    /** How many members the guild has. */
    readonly memberCount: number | undefined;

    /** About how many members the guild has, when fetched with counts. */
    readonly approximateMemberCount: number | null | undefined;

    /** About how many members are online, when fetched with counts. */
    readonly approximatePresenceCount: number | null | undefined;

    /** The most members the guild can have. */
    readonly maxMembers: number | null | undefined;

    /** The most members that can be online, or `null` for no limit. */
    readonly maxPresences: number | null | undefined;

    /** The most users in a video call in a voice channel. */
    readonly maxVideoChannelUsers: number | null | undefined;

    /** The most users in a video call in a stage channel. */
    readonly maxStageVideoChannelUsers: number | null | undefined;

    /** The guild's roles, by ID, when Discord sent them. */
    readonly roles: Map<Snowflake, Role> | undefined;

    /** The guild's custom emojis, by ID, when Discord sent them. */
    readonly emojis: Map<Snowflake, Emoji> | undefined;

    /** The guild's stickers, by ID, when Discord sent them. */
    readonly stickers: Map<Snowflake, Sticker> | undefined;

    /** Features the guild has, such as `"COMMUNITY"`. */
    readonly features: Guild.Feature[] | undefined;

    /** The guild's language, such as `"en-US"`. */
    readonly preferredLocale: string | undefined;

    /** The guild's boost level. */
    readonly premiumTier: Guild.PremiumTier | undefined;

    /** How many boosts the guild has. */
    readonly premiumSubscriptionCount: number | undefined;

    /** Whether the boost progress bar is shown. */
    readonly premiumProgressBarEnabled: boolean | undefined;

    /** The code of the guild's vanity invite, or `null`. */
    readonly vanityUrlCode: string | null | undefined;

    /** When invites resume, or `null` if they aren't paused. See {@link Guild.pauseInvites}. */
    readonly invitesPausedUntil: Date | null;

    /** What members must have before they can send messages. */
    readonly verificationLevel: Guild.VerificationLevel | undefined;

    /** Whose messages Discord scans for explicit images. */
    readonly explicitContentFilter: Guild.ExplicitContentFilterLevel | undefined;

    /** Whether members are notified of every message or only mentions, by default. */
    readonly defaultMessageNotifications: Guild.NotificationsLevel | undefined;

    /** `1` when moderators need two-factor authentication, `0` otherwise. */
    readonly mfaLevel: number | undefined;

    /** The guild's age-restriction level. */
    readonly nsfwLevel: number | undefined;

    /** ID of the AFK voice channel, or `null`. */
    readonly afkChannelId: Snowflake | null | undefined;

    /** Seconds of inactivity before a member is moved to the AFK channel. */
    readonly afkTimeout: number | undefined;

    /** ID of the channel for join and boost messages, or `null`. */
    readonly systemChannelId: Snowflake | null | undefined;

    /** Bitfield of the system messages that are turned off. */
    readonly systemChannelFlags: number | undefined;

    /** ID of the rules channel of a community guild, or `null`. */
    readonly rulesChannelId: Snowflake | null | undefined;

    /** ID of the channel where Discord sends notices to moderators, or `null`. */
    readonly publicUpdatesChannelId: Snowflake | null | undefined;

    /** ID of the channel for raid and spam alerts, or `null`. */
    readonly safetyAlertsChannelId: Snowflake | null | undefined;

    /** Whether the server widget is on. */
    readonly widgetEnabled: boolean | undefined;

    /** ID of the channel the widget invites to, or `null`. */
    readonly widgetChannelId: Snowflake | null | undefined;

    /** ID of the application that created the guild, or `null`. */
    readonly applicationId: Snowflake | null | undefined;

    /** Fetches the guild again. */
    fetch(): Promise<Guild>;

    /** Fetches a preview of the guild, as people see it before joining. */
    fetchPreview(): Promise<GuildPreview>;

    /**
     * Changes the guild.
     *
     * @returns The updated guild.
     */
    edit(options: GuildEditOptions): Promise<Guild>;

    /** Returns the URL of the guild's icon, or `null` if it has none. */
    iconURL(options?: {
      format?: "png" | "jpg" | "webp" | "gif";
      size?: number;
    }): string | null;

    /** Returns the URL of the guild's banner, or `null` if it has none. */
    bannerURL(options?: {
      format?: "png" | "jpg" | "webp";
      size?: number;
    }): string | null;

    /** Fetches the bot's member. */
    me(): Promise<GuildMember>;

    /**
     * Fetches a member.
     *
     * @returns The member, or `null` if the user isn't in the guild. Other failures throw.
     */
    fetchMember(userId: Snowflake): Promise<GuildMember | null>;

    /**
     * Reads a member from Weeble's cache, or fetches them if they aren't cached.
     * A cached member has `user`, `nick`, `roles` and `joinedAt`, which is
     * enough for role checks and names, but not their avatar, timeout or boost.
     *
     * ```ts
     * const member = await guild.getMember(message.author.id);
     * if (member?.hasRole(modRoleId)) await message.reply("Hi, mod.");
     * ```
     */
    getMember(userId: Snowflake): Promise<GuildMember | null>;

    /** Fetches every member, 1000 per request, yielding them one at a time. */
    iterMembers(
      options?: FetchMembersOptions,
    ): AsyncIterableIterator<GuildMember>;

    /**
     * Fetches the members whose username or nickname starts with `query`.
     *
     * @param options.limit How many members to fetch, from 1 to 1000. Defaults to 1.
     */
    searchMembers(
      query: string,
      options?: {
        limit?: number;
      },
    ): Promise<GuildMember[]>;

    /**
     * Adds a role to a member.
     *
     * @param reason Reason shown in the audit log.
     */
    addRole(
      userId: Snowflake,
      roleId: Snowflake,
      reason?: string,
    ): Promise<void>;

    /**
     * Removes a role from a member.
     *
     * @param reason Reason shown in the audit log.
     */
    removeRole(
      userId: Snowflake,
      roleId: Snowflake,
      reason?: string,
    ): Promise<void>;

    /**
     * Kicks a member.
     *
     * @param reason Reason shown in the audit log.
     */
    kick(userId: Snowflake, reason?: string): Promise<void>;

    /**
     * Bans a user. They don't have to be in the guild.
     *
     * @param options.deleteMessageSeconds Delete their messages from this many seconds back, up to 604800 (7 days).
     * @param options.reason Reason shown in the audit log.
     */
    ban(
      userId: Snowflake,
      options?: {
        deleteMessageSeconds?: number;
        reason?: string;
      },
    ): Promise<void>;

    /**
     * Unbans a user.
     *
     * @param reason Reason shown in the audit log.
     */
    unban(userId: Snowflake, reason?: string): Promise<void>;

    /**
     * Bans up to 200 users at once. Needs Ban Members and Manage Server. Users
     * who are already banned or can't be banned are returned in `failedUsers`.
     *
     * ```ts
     * const { bannedUsers, failedUsers } = await guild.bulkBan(raiderIds, {
     *   deleteMessageSeconds: 3600,
     *   reason: "Raid",
     * });
     * ```
     */
    bulkBan(
      userIds: Snowflake[],
      options?: BulkBanOptions,
    ): Promise<BulkBanResult>;

    /**
     * Fetches a user's ban.
     *
     * @returns The ban, or `null` if the user isn't banned. Other failures, such
     * as missing Ban Members, throw.
     */
    fetchBan(userId: Snowflake): Promise<GuildBan | null>;

    /** Fetches the guild's bans. */
    fetchBans(): Promise<GuildBan[]>;

    /** Returns how many members a prune would kick, without kicking anyone. */
    previewPrune(options?: {
      days?: number;
      includeRoles?: Snowflake[];
    }): Promise<{
      pruned: number | null;
    }>;

    /**
     * Kicks members who haven't been active for a number of days. Use
     * {@link Guild.previewPrune} first to see how many that would be.
     */
    beginPrune(options?: GuildPruneOptions): Promise<{
      pruned: number | null;
    }>;

    /**
     * Reads a user's presence from Weeble's cache, or returns `null` if the
     * cache has none.
     */
    getCachedPresence(userId: Snowflake): Promise<Presence | null>;

    /**
     * Fetches a member's voice state. {@link GuildVoiceChannel.getVoiceStates}
     * reads them from Weeble's cache without a request.
     *
     * @param userId The member. Defaults to the bot.
     * @returns The voice state, or `null` if they aren't in a voice channel.
     */
    fetchVoiceState(userId?: Snowflake): Promise<VoiceState | null>;

    /**
     * Fetches a member's guild-wide permissions from Discord, from all their
     * roles. Channel overwrites aren't counted.
     *
     * ```ts
     * const permissions = await guild.fetchMemberPermissions(member.id);
     * const canBan = (permissions & discord.PermissionFlags.BAN_MEMBERS) !== 0n;
     * ```
     */
    fetchMemberPermissions(userId: Snowflake): Promise<bigint>;

    /** Fetches the guild-wide permissions a role grants from Discord. */
    fetchRolePermissions(roleId: Snowflake): Promise<bigint>;

    /**
     * Fetches a role.
     *
     * @returns The role, or `null` if the guild has no role with that ID. Other failures throw.
     */
    fetchRole(roleId: Snowflake): Promise<Role | null>;

    /** Fetches the guild's roles. */
    fetchRoles(): Promise<Role[]>;

    /** Reads a role from Weeble's cache, as {@link Guild.getRoles} does. */
    getRole(roleId: Snowflake): Promise<Role | null>;

    /**
     * Reads the guild's roles from Weeble's cache, or fetches them if the cache
     * is empty. A cached role has its name, permissions and position, which is
     * enough for permission and hierarchy checks, but not its color or icon.
     */
    getRoles(): Promise<Role[]>;

    /** Creates a role. */
    createRole(options: RoleCreateOptions): Promise<Role>;

    /**
     * Moves roles in the role list.
     *
     * @param reason Reason shown in the audit log.
     * @returns Every role, in its new position.
     */
    editRolePositions(
      positions: Array<{
        id: Snowflake;
        position: number;
      }>,
      reason?: string,
    ): Promise<Role[]>;

    /**
     * Counts the members with each role, in one request. `@everyone` isn't counted.
     *
     * ```ts
     * const counts = await guild.fetchRoleMemberCounts();
     * console.log(`${counts.get(role.id) ?? 0} members have ${role.name}`);
     * ```
     */
    fetchRoleMemberCounts(): Promise<Map<Snowflake, number>>;

    /**
     * Fetches a channel.
     *
     * @returns The channel, or `null` if it doesn't exist or is in another guild.
     * Other failures throw.
     */
    fetchChannel(channelId: Snowflake): Promise<AnyGuildChannel | null>;

    /** Fetches the guild's channels. Threads aren't included. */
    fetchChannels(): Promise<AnyGuildChannel[]>;

    /**
     * Reads the guild's channels from Weeble's cache, or fetches them if the
     * cache is empty. A cached channel has its name, type, category, `nsfw` and
     * overwrites, but not its topic, position or slowmode.
     */
    getChannels(): Promise<AnyGuildChannel[]>;

    /** Creates a channel. */
    createChannel(options: GuildChannelCreateOptions): Promise<AnyGuildChannel>;

    /**
     * Moves channels. Only the fields you set change.
     *
     * ```ts
     * await guild.editChannelPositions([
     *   { id: rulesId, position: 0 },
     *   { id: logsId, parentId: staffCategoryId, lockPermissions: true },
     * ]);
     * ```
     */
    editChannelPositions(positions: ChannelPosition[]): Promise<void>;

    /** Fetches every active thread in the guild. */
    fetchActiveThreads(): Promise<ThreadChannel[]>;

    /**
     * Searches the guild's messages. Discord may still be indexing a guild the
     * bot just joined, so check `status` first.
     *
     * ```ts
     * const result = await guild.searchMessages({ content: "refund", limit: 10 });
     * if (result.status === "ready") console.log(result.totalResults);
     * ```
     */
    searchMessages(
      options: GuildMessageSearchOptions,
    ): Promise<GuildMessageSearchResult>;

    /** Fetches the guild's invites. */
    fetchInvites(): Promise<Invite[]>;

    /**
     * Pauses joining through invites until `until`, up to 24 hours ahead, or
     * resumes it with `null`. Needs Manage Server.
     */
    pauseInvites(until: Date | null, reason?: string): Promise<void>;

    /** Fetches the vanity invite's code and how often it was used. Needs Manage Server. */
    fetchVanityUrl(): Promise<GuildVanityUrl>;

    /** Fetches the guild's webhooks. */
    fetchWebhooks(): Promise<Webhook[]>;

    /**
     * Fetches a custom emoji.
     *
     * @returns The emoji, or `null` if the guild has none with that ID. Other failures throw.
     */
    fetchEmoji(emojiId: Snowflake): Promise<Emoji | null>;

    /** Fetches the guild's custom emojis. */
    fetchEmojis(): Promise<Emoji[]>;

    /** Creates a custom emoji. */
    createEmoji(options: EmojiCreateOptions): Promise<Emoji>;

    /**
     * Fetches a sticker.
     *
     * @returns The sticker, or `null` if the guild has none with that ID.
     */
    fetchSticker(stickerId: Snowflake): Promise<Sticker | null>;

    /** Fetches the guild's stickers. */
    fetchStickers(): Promise<Sticker[]>;

    /** Creates a sticker. */
    createSticker(options: StickerCreateOptions): Promise<Sticker>;

    /**
     * Fetches a soundboard sound.
     *
     * @returns The sound, or `null` if the guild has none with that ID.
     */
    fetchSoundboardSound(soundId: Snowflake): Promise<SoundboardSound | null>;

    /** Fetches the guild's soundboard sounds. Discord's default sounds aren't included. */
    fetchSoundboardSounds(): Promise<SoundboardSound[]>;

    /**
     * Adds a sound to the guild's soundboard.
     *
     * ```ts
     * const sound = await guild.createSoundboardSound({
     *   name: "airhorn",
     *   sound: `data:audio/mpeg;base64,${base64Mp3}`,
     *   emojiName: "📯",
     * });
     * ```
     */
    createSoundboardSound(
      options: SoundboardSoundCreateOptions,
    ): Promise<SoundboardSound>;

    /**
     * Fetches a scheduled event.
     *
     * @param options.withUserCount Whether to include how many users are interested.
     * @returns The event, or `null` if the guild has none with that ID.
     */
    fetchScheduledEvent(
      eventId: Snowflake,
      options?: { withUserCount?: boolean },
    ): Promise<ScheduledEvent | null>;

    /**
     * Fetches the guild's scheduled events.
     *
     * @param options.withUserCount Whether to include how many users are interested.
     */
    fetchScheduledEvents(options?: {
      withUserCount?: boolean;
    }): Promise<ScheduledEvent[]>;

    /** Creates a scheduled event. */
    createScheduledEvent(
      options: ScheduledEventCreateOptions,
    ): Promise<ScheduledEvent>;

    /**
     * Fetches the stage instance of a stage channel.
     *
     * @returns The stage instance, or `null` if nothing is live in the channel.
     * Other failures throw.
     */
    fetchStageInstance(channelId: Snowflake): Promise<StageInstance | null>;

    /** Starts a stage instance in a stage channel. */
    createStageInstance(
      options: StageInstanceCreateOptions,
    ): Promise<StageInstance>;

    /**
     * Ends the stage instance of a stage channel.
     *
     * @param reason Reason shown in the audit log.
     */
    deleteStageInstance(channelId: Snowflake, reason?: string): Promise<void>;

    /**
     * Fetches an auto moderation rule. Needs Manage Server.
     *
     * @returns The rule, or `null` if the guild has none with that ID.
     */
    fetchAutoModRule(ruleId: Snowflake): Promise<AutoModRule | null>;

    /** Fetches the guild's auto moderation rules. Needs Manage Server. */
    fetchAutoModRules(): Promise<AutoModRule[]>;

    /** Creates an auto moderation rule. Needs Manage Server. */
    createAutoModRule(options: AutoModRuleCreateOptions): Promise<AutoModRule>;

    /**
     * Fetches a page of the audit log. Needs View Audit Log.
     *
     * @see https://docs.discord.com/developers/resources/audit-log
     */
    fetchAuditLogs(options?: AuditLogFetchOptions): Promise<AuditLog>;

    /** Fetches audit log entries, newest first, yielding them one at a time. Needs View Audit Log. */
    iterAuditLogs(options?: {
      userId?: Snowflake;
      actionType?: AuditLogActionType;
      limit?: number;
    }): AsyncIterableIterator<AnyAuditLogEntry>;

    /** Fetches the guild's onboarding: the questions new members answer. */
    fetchOnboarding(): Promise<GuildOnboarding>;

    /**
     * Changes the guild's onboarding. `prompts` replaces every question, so pass
     * the existing ones, with their `id`, to keep them. Needs Manage Server and
     * Manage Roles.
     */
    editOnboarding(options: GuildOnboardingEditOptions): Promise<GuildOnboarding>;

    /** Fetches the welcome screen of a community guild. */
    fetchWelcomeScreen(): Promise<WelcomeScreen>;

    /** Changes the welcome screen. Needs Manage Server. */
    editWelcomeScreen(options: WelcomeScreenEditOptions): Promise<WelcomeScreen>;

    /**
     * Fetches the welcome message, suggested actions and resource channels that
     * new members of a community guild see.
     *
     * @returns The settings, or `null` if the guild hasn't set them up.
     */
    fetchNewMemberWelcome(): Promise<GuildNewMemberWelcome | null>;

    /**
     * Fetches requests to join, for a guild that reviews new members. Up to 100
     * per request.
     *
     * ```ts
     * const { requests } = await guild.fetchJoinRequests({ status: "SUBMITTED" });
     * for (const request of requests) {
     *   await guild.reviewJoinRequest(request.id, "APPROVED");
     * }
     * ```
     */
    fetchJoinRequests(options?: FetchJoinRequestsOptions): Promise<GuildJoinRequestPage>;

    /**
     * Approves or rejects a request to join.
     *
     * @param rejectionReason Shown to the user when rejecting, up to 160 characters.
     * @returns The request after the decision.
     */
    reviewJoinRequest(
      requestId: Snowflake,
      action: "APPROVED" | "REJECTED",
      rejectionReason?: string,
    ): Promise<GuildJoinRequest>;

    /** Fetches the server widget's settings. */
    fetchWidgetSettings(): Promise<GuildWidgetSettings>;

    /** Changes the server widget's settings. Needs Manage Server. */
    editWidgetSettings(
      options: GuildWidgetSettingsEditOptions,
    ): Promise<GuildWidgetSettings>;

    /**
     * Fetches what the server widget shows: its invite, voice channels and
     * online members. Throws if the widget is off.
     */
    fetchWidget(): Promise<GuildWidget>;

    /** Fetches the voice regions the guild's voice channels can use. */
    fetchVoiceRegions(): Promise<VoiceRegion[]>;

    /** Fetches the guild's integrations, such as bots and Twitch or YouTube links. Needs Manage Server. */
    fetchIntegrations(): Promise<GuildIntegration[]>;

    /**
     * Deletes an integration. Deleting a bot's integration removes the bot.
     * Needs Manage Server.
     *
     * @param reason Reason shown in the audit log.
     */
    deleteIntegration(integrationId: Snowflake, reason?: string): Promise<void>;

    /** Fetches the guild's templates. */
    fetchTemplates(): Promise<GuildTemplate[]>;

    /** Creates a template from the guild. */
    createTemplate(options: {
      description?: string;
      name: string;
    }): Promise<GuildTemplate>;
  }

  /** Types used by {@link Guild}. */
  namespace Guild {
    /** Whose messages are scanned for explicit images: `0` nobody's, `1` members without roles, `2` everyone's. */
    type ExplicitContentFilterLevel = 0 | 1 | 2;

    /** A guild feature. Discord adds features over time, so any string is allowed. */
    type Feature =
      | "ANIMATED_BANNER"
      | "ANIMATED_ICON"
      | "APPLICATION_COMMAND_PERMISSIONS_V2"
      | "AUTO_MODERATION"
      | "BANNER"
      | "COMMUNITY"
      | "CREATOR_MONETIZABLE_PROVISIONAL"
      | "CREATOR_STORE_PAGE"
      | "DEVELOPER_SUPPORT_SERVER"
      | "DISCOVERABLE"
      | "FEATURABLE"
      | "INVITES_DISABLED"
      | "INVITE_SPLASH"
      | "MEMBER_VERIFICATION_GATE_ENABLED"
      | "MORE_STICKERS"
      | "NEWS"
      | "PARTNERED"
      | "PREVIEW_ENABLED"
      | "PRIVATE_THREADS"
      | "RAID_ALERTS_DISABLED"
      | "ROLE_ICONS"
      | "ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE"
      | "ROLE_SUBSCRIPTIONS_ENABLED"
      | "SEVEN_DAY_THREAD_ARCHIVE"
      | "THREE_DAY_THREAD_ARCHIVE"
      | "TICKETED_EVENTS_ENABLED"
      | "VANITY_URL"
      | "VERIFIED"
      | "VIP_REGIONS"
      | "WELCOME_SCREEN_ENABLED"
      | (string & {});

    /** Default notifications: `0` for every message, `1` for mentions only. */
    type NotificationsLevel = 0 | 1;

    /** Boost level, from `0` to `3`. */
    type PremiumTier = 0 | 1 | 2 | 3;

    /** Verification level, from `0` (none) to `4` (verified phone number). */
    type VerificationLevel = 0 | 1 | 2 | 3 | 4;
  }

  /** Changes to a guild. Fields left out stay as they are. */
  interface GuildEditOptions {
    /** ID of the AFK voice channel, or `null` to remove it. */
    afkChannelId?: Snowflake | null;
    /** Seconds of inactivity before a member is moved to the AFK channel. */
    afkTimeout?: number;
    /** The banner as a data URI, or `null` to remove it. */
    banner?: string | null;
    /** A {@link Guild.NotificationsLevel}. */
    defaultMessageNotifications?: number;
    /** The guild's description, or `null` to remove it. */
    description?: string | null;
    /** A {@link Guild.ExplicitContentFilterLevel}. */
    explicitContentFilter?: number;
    /** The icon as a data URI, or `null` to remove it. */
    icon?: string | null;
    /** Name of the guild. */
    name?: string;
    /** The guild's language, such as `"en-US"`. */
    preferredLocale?: string;
    /** Whether the boost progress bar is shown. */
    premiumProgressBarEnabled?: boolean;
    /** ID of the channel for Discord's notices to moderators, or `null`. */
    publicUpdatesChannelId?: Snowflake | null;
    /** Reason shown in the audit log. */
    reason?: string;
    /** ID of the rules channel, or `null`. */
    rulesChannelId?: Snowflake | null;
    /** ID of the channel for join and boost messages, or `null`. */
    systemChannelId?: Snowflake | null;
    /** A {@link Guild.VerificationLevel}. */
    verificationLevel?: number;
  }

  /** What anyone can see of a server before joining it. */
  interface GuildPreview {
    id: Snowflake;
    name: string;
    description: string | null;
    /** Icon hash, or `null` when the server has no icon. */
    icon: string | null;
    /** Invite splash hash, or `null` when the server has none. */
    splash: string | null;
    /** Discovery splash hash, or `null` when the server has none. */
    discoverySplash: string | null;
    /** Enabled server features, such as `"COMMUNITY"`. */
    features: string[];
    approximateMemberCount: number;
    /** Roughly how many members are online. */
    approximatePresenceCount: number;
    emojis: Emoji[];
    stickers: Sticker[];
  }

  /** Who to prune, for {@link Guild.beginPrune}. */
  interface GuildPruneOptions {
    /** Whether to return how many members were kicked. Slow in large guilds. */
    computePruneCount?: boolean;
    /** Kick members inactive for this many days, from 1 to 30. Defaults to 7. */
    days?: number;
    /** IDs of roles whose members can be pruned too. By default only members without roles are. */
    includeRoles?: Snowflake[];
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** A ban. */
  class GuildBan {
    /** ID of the guild. */
    readonly guildId: Snowflake;

    /** Why the user was banned, or `null`. */
    readonly reason: string | null;

    /** The banned user. */
    readonly user: User;

    /**
     * Unbans the user.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Fetches the guild. */
    fetchGuild(): Promise<Guild>;
  }

  /** Options for {@link Guild.bulkBan}. */
  interface BulkBanOptions {
    /** Delete the users' messages from this many seconds back, up to 604800 (7 days). */
    deleteMessageSeconds?: number;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** Result of {@link Guild.bulkBan}. */
  interface BulkBanResult {
    /** IDs of the users that were banned. */
    bannedUsers: Snowflake[];
    /** IDs that could not be banned, such as users who were already banned. */
    failedUsers: Snowflake[];
  }

  /** The server's onboarding flow. */
  interface GuildOnboarding {
    guildId: Snowflake;
    prompts: GuildOnboardingPrompt[];
    /** Channels every new member is shown. */
    defaultChannelIds: Snowflake[];
    enabled: boolean;
    /** `0` counts only default channels toward Discord's requirements; `1` also counts prompt answers. */
    mode: 0 | 1;
  }

  /** A question in the onboarding flow. */
  interface GuildOnboardingPrompt {
    id?: Snowflake;
    /** `0` for multiple choice, `1` for a dropdown. */
    type: 0 | 1;
    title: string;
    options: GuildOnboardingPromptOption[];
    /** Whether members can pick only one option. */
    singleSelect: boolean;
    /** Whether members must answer before finishing onboarding. */
    required: boolean;
    /** Whether the prompt appears during onboarding, rather than only in Channels & Roles. */
    inOnboarding: boolean;
  }

  /** One answer in an onboarding prompt. */
  interface GuildOnboardingPromptOption {
    id?: Snowflake;
    title: string;
    description?: string | null;
    /** Channels the member is shown when they pick this option. */
    channelIds?: Snowflake[];
    /** Roles the member gets when they pick this option. */
    roleIds?: Snowflake[];
    emojiId?: Snowflake | null;
    emojiName?: string | null;
    emojiAnimated?: boolean;
  }

  /** Changes to a guild's onboarding. Fields left out stay as they are. */
  interface GuildOnboardingEditOptions {
    /** The questions new members answer. Replaces the whole list. */
    prompts?: GuildOnboardingPrompt[];
    /** Channels every new member is added to. Replaces the whole list. */
    defaultChannelIds?: Snowflake[];
    /** Whether onboarding is turned on. */
    enabled?: boolean;
    /**
     * `0` counts only default channels towards Discord's onboarding requirements, `1` also
     * counts channels reached through prompts.
     */
    mode?: 0 | 1;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** The welcome screen shown to new members of a community guild. */
  interface WelcomeScreen {
    description: string | null;
    welcomeChannels: WelcomeScreenChannel[];
  }

  /** A channel suggested on the welcome screen. */
  interface WelcomeScreenChannel {
    channelId: Snowflake;
    description: string;
    emojiId: Snowflake | null;
    emojiName: string | null;
  }

  /** Changes to a welcome screen. Fields left out stay as they are. */
  interface WelcomeScreenEditOptions {
    /** Whether the welcome screen is shown to new members. */
    enabled?: boolean;
    /** The server description on the welcome screen, or `null` to clear it. */
    description?: string | null;
    /** Channels linked from the welcome screen, up to 5. Replaces the whole list. */
    welcomeChannels?: WelcomeScreenChannel[];
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** What new members of a community server are shown. */
  interface GuildNewMemberWelcome {
    enabled: boolean;
    /** The welcome message and the members it is signed by, or `null` when none is set. */
    welcomeMessage: { authorIds: Snowflake[]; message: string } | null;
    newMemberActions: GuildNewMemberAction[];
    resourceChannels: GuildResourceChannel[];
  }

  /** Something a new member is prompted to do first. */
  interface GuildNewMemberAction {
    /** The channel the action happens in. */
    channelId: Snowflake;
    /** `0` to view the channel, `1` to talk in it. */
    actionType: 0 | 1;
    title: string;
    description: string;
    emoji: GuildWelcomeEmoji | null;
  }

  /** A channel recommended to new members as a resource. */
  interface GuildResourceChannel {
    channelId: Snowflake;
    title: string;
    description: string;
    emoji: GuildWelcomeEmoji | null;
  }

  /** An emoji in a server's welcome settings. */
  interface GuildWelcomeEmoji {
    /** The custom emoji's ID, or `null` for a Unicode emoji. */
    id: Snowflake | null;
    /** The emoji's name, or the character itself for a Unicode emoji. */
    name: string | null;
    animated: boolean;
  }

  /** What a server's public widget shows. */
  interface GuildWidget {
    id: Snowflake;
    name: string;
    /** Invite URL for the widget's invite channel, or `null` when none is set. */
    instantInvite: string | null;
    /** Voice and stage channels everyone can see. */
    channels: Array<{ id: Snowflake; name: string; position: number }>;
    /** Online members, up to 100. */
    members: GuildWidgetMember[];
    /** How many members are online. */
    presenceCount: number;
  }

  /** A member as the widget shows them. The widget hides real user IDs. */
  interface GuildWidgetMember {
    /** A position in the list, not the user's ID. */
    id: string;
    username: string;
    /** `"online"`, `"idle"` or `"dnd"`. */
    status: string;
    avatarUrl: string;
    /** What they are playing, or `null`. */
    activityName: string | null;
    /** The voice channel they are in, or `null`. */
    channelId: Snowflake | null;
    /** `true` when muted, by themselves or by the server. */
    mute: boolean;
    /** `true` when deafened, by themselves or by the server. */
    deaf: boolean;
  }

  /** Server widget settings. */
  interface GuildWidgetSettings {
    enabled: boolean;
    /** Channel the widget's invite points to. */
    channelId: Snowflake | null;
  }

  /** Changes to the server widget. Fields left out stay as they are. */
  interface GuildWidgetSettingsEditOptions {
    /** Whether the widget is turned on. */
    enabled?: boolean;
    /** The channel the widget's invite leads to, or `null` for no invite. */
    channelId?: Snowflake | null;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** An application to join a server that reviews its members. */
  interface GuildJoinRequest {
    id: Snowflake;
    userId: Snowflake;
    /** The applicant, when Discord includes them. */
    user: User | null;
    status: GuildJoinRequestStatus | null;
    /** When the application was created, in Unix milliseconds. */
    createdTimestamp: number;
    /** When it was approved or rejected, in Unix milliseconds, or `null` while it waits. */
    reviewedTimestamp: number | null;
    /** Why it was rejected. Only set when `status` is `"REJECTED"`. */
    rejectionReason: string | null;
    /** Who approved or rejected it, when Discord includes them. */
    reviewedBy: User | null;
    /** The applicant's answers to the server's questions, as Discord sends them. */
    formResponses: unknown[];
  }

  /**
   * Where an application to join a server stands: `"STARTED"` before the
   * applicant submits it, `"SUBMITTED"` while it waits for review, then
   * `"APPROVED"` or `"REJECTED"`.
   */
  type GuildJoinRequestStatus = "STARTED" | "SUBMITTED" | "REJECTED" | "APPROVED";

  /** A page of {@link Guild.fetchJoinRequests}. */
  interface GuildJoinRequestPage {
    /** How many applications match in total, across all pages. */
    total: number;
    requests: GuildJoinRequest[];
  }

  /** Which requests to join to fetch. */
  interface FetchJoinRequestsOptions {
    /** Only applications in this state. */
    status?: GuildJoinRequestStatus;
    /** Applications per page, from 1 to 100. */
    limit?: number;
    /** Only applications with IDs lower than this. */
    before?: Snowflake;
    /** Only applications with IDs higher than this. */
    after?: Snowflake;
  }

  /** The server's vanity invite. */
  interface GuildVanityUrl {
    /** The code in `discord.gg/<code>`, or `null` when the server has none. */
    code: string | null;
    uses: number;
  }

  /** A bot, application, or external account connected to the server. */
  interface GuildIntegration {
    id: Snowflake;
    name: string;
    /** `"discord"` for bots and apps, or a service such as `"twitch"` or `"youtube"`. */
    type: string;
    enabled: boolean;
    account: { id: string; name: string };
    /** The application, for bot and app integrations. */
    application: { id: Snowflake; name: string; bot?: { id: Snowflake } } | null;
  }

  /** A voice server location a voice or stage channel can be pinned to. */
  interface VoiceRegion {
    /** The value to use as a channel's `rtcRegion`. */
    id: string;
    name: string;
    /** `true` for the region closest to the bot. */
    optimal: boolean;
    /** `true` when Discord advises against choosing this region. */
    deprecated: boolean;
    /** `true` for a region reserved for events and similar. */
    custom: boolean;
  }

  /** A copy of a guild's channels, roles and settings, for creating new guilds. */
  class GuildTemplate {
    /** The template's code, as in `discord.new/<code>`. */
    readonly code: string;

    /** When the template was created. */
    readonly createdAt: Date;

    /** ID of the user who created the template, or `null`. */
    readonly creatorId: Snowflake | null;

    /** The template's description, or `null`. */
    readonly description: string | null;

    /** ID of the guild the template is from. */
    readonly guildId: Snowflake;

    /** Whether the guild has changed since the template was last synced, or `null`. */
    readonly isDirty: boolean | null;

    /** Name of the template. */
    readonly name: string;

    /** ID of the guild the template is from, or `null`. */
    readonly sourceGuildId: Snowflake | null;

    /** When the template was last changed. */
    readonly updatedAt: Date;

    /** How many guilds were created from the template. */
    readonly usageCount: number;

    /**
     * Deletes the template.
     *
     * @returns The deleted template.
     */
    delete(): Promise<GuildTemplate>;

    /** Changes the template's name or description. */
    edit(options: {
      description?: string | null;
      name?: string;
    }): Promise<GuildTemplate>;

    /** Updates the template to match the guild as it is now. */
    sync(): Promise<GuildTemplate>;
  }

  //#endregion

  //#region Roles

  /** A role in a guild. */
  class Role implements Mentionable {
    /** ID of the role. The `@everyone` role has the guild's ID. */
    readonly id: Snowflake;

    /** Name of the role. */
    readonly name: string;

    /** ID of the role's guild. */
    readonly guildId: Snowflake;

    /** When the role was created. */
    readonly createdAt: Date;

    /** The role's permissions. */
    readonly permissions: bigint | undefined;

    /** Position of the role in the role list. Higher roles outrank lower ones. */
    readonly position: number | undefined;

    /** Color of the role, or `0` for none. Gradient roles have their first color here. */
    readonly color: number | undefined;

    /** The role's colors, including a gradient's. */
    readonly colors: RoleColors | undefined;

    /** Whether members with the role are listed separately. */
    readonly hoist: boolean | undefined;

    /** Whether anyone can mention the role. */
    readonly mentionable: boolean | undefined;

    /** Whether an integration, such as a bot, manages the role. Such roles can't be given to members. */
    readonly managed: boolean | undefined;

    /** Hash of the role's icon, or `null`. */
    readonly icon: string | null | undefined;

    /** The role's Unicode emoji icon, or `null`. */
    readonly unicodeEmoji: string | null | undefined;

    /** Fetches the members with the role. */
    fetchMembers(options?: FetchMembersOptions): Promise<GuildMember[]>;

    /** Changes the role. */
    edit(options: RoleEditOptions): Promise<Role>;

    /**
     * Deletes the role.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Returns the role's mention, `<@&id>`. */
    toMention(): string;
  }

  /** A role's colors. A role with `secondary` set shows a gradient. */
  interface RoleColors {
    /** The first color. */
    primary: number;
    /** The second color of a gradient, or `null`. */
    secondary: number | null;
    /** The third color of the holographic style, or `null`. */
    tertiary: number | null;
  }

  /** A role to create. */
  interface RoleCreateOptions {
    /** Color of the role, such as `0xff0000` for red. */
    color?: number;
    /** Whether members with the role are listed separately. */
    hoist?: boolean;
    /** Whether anyone can mention the role. */
    mentionable?: boolean;
    /** Name of the role. */
    name: string;
    /** The role's permissions. */
    permissions?: PermissionFlag;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** Changes to a role. Fields left out stay as they are. */
  interface RoleEditOptions {
    /** Color of the role, such as `0xff0000` for red. */
    color?: number;
    /** Whether members with the role are listed separately. */
    hoist?: boolean;
    /** The role's icon as a data URI. Needs boost level 2. */
    icon?: string;
    /** Whether anyone can mention the role. */
    mentionable?: boolean;
    /** Name of the role. */
    name?: string;
    /** The role's permissions. */
    permissions?: PermissionFlag;
    /** Reason shown in the audit log. */
    reason?: string;
    /** A Unicode emoji as the role's icon. Needs boost level 2. */
    unicodeEmoji?: string;
  }

  //#endregion

  //#region Emojis, stickers and sounds

  /** A custom emoji. */
  class Emoji implements Mentionable {
    /** ID of the emoji. */
    readonly id: Snowflake | null | undefined;

    /** Name of the emoji, as in `:name:`. */
    readonly name: string | null | undefined;

    /** ID of the emoji's guild. */
    readonly guildId: Snowflake;

    /** When the emoji was created. */
    readonly createdAt: Date | null;

    /** Whether the emoji is animated. */
    readonly animated: boolean | undefined;

    /** Whether the emoji can be used. Emojis become unavailable when a guild loses boosts. */
    readonly available: boolean | undefined;

    /** Whether an integration, such as Twitch, manages the emoji. */
    readonly managed: boolean | undefined;

    /** Whether the emoji has to be wrapped in colons. */
    readonly requireColons: boolean | null | undefined;

    /** IDs of the roles that can use the emoji, or `null` for everyone. */
    readonly roles: Snowflake[] | null | undefined;

    /** Who uploaded the emoji, when Discord includes it. */
    readonly user: User | null | undefined;

    /** Returns the URL of the emoji's image. */
    imageURL(options?: {
      format?: "png" | "jpg" | "webp" | "gif";
      size?: number;
    }): string | null;

    /** Changes the emoji. */
    edit(options: EmojiEditOptions): Promise<Emoji>;

    /**
     * Deletes the emoji.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Returns the emoji's mention, `<:name:id>` or `<a:name:id>`, which shows the emoji. */
    toMention(): string;

    /** @deprecated Use {@link Emoji.imageURL}. */
    getURL(size?: number): string | null;
  }

  /** A custom emoji to create. */
  interface EmojiCreateOptions {
    /** The image as a data URI, up to 256 KB. */
    image: string;
    /** Name of the emoji, from 2 to 32 letters, digits and underscores. */
    name: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** IDs of the roles that can use the emoji. Everyone can by default. */
    roles?: Snowflake[];
  }

  /** Changes to a custom emoji. Fields left out stay as they are. */
  interface EmojiEditOptions {
    /** Name of the emoji. */
    name?: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** IDs of the roles that can use the emoji. */
    roles?: Snowflake[];
  }

  /** A sticker. */
  class Sticker {
    /** ID of the sticker. */
    readonly id: Snowflake;

    /** Name of the sticker. */
    readonly name: string;

    /** Description of the sticker, or `null`. */
    readonly description: string | null;

    /** Name of the emoji Discord suggests the sticker for. */
    readonly tags: string;

    /** ID of the sticker's guild, or `null` for Discord's own stickers. */
    readonly guildId: Snowflake | null;

    /** When the sticker was created. */
    readonly createdAt: Date;

    /** The sticker's file format. */
    readonly formatType: StickerFormatType;

    /** Whether the sticker can be used, or `null`. Stickers become unavailable when a guild loses boosts. */
    readonly available: boolean | null;

    /** Changes the sticker. */
    edit(options: StickerEditOptions): Promise<Sticker>;

    /**
     * Deletes the sticker.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;
  }

  /** A sticker to create. */
  interface StickerCreateOptions {
    /** Description of the sticker, up to 100 characters. */
    description?: string;
    /** The image as a data URI: PNG, APNG, GIF or Lottie JSON, up to 512 KB. */
    image: string;
    /** Name of the sticker, from 2 to 30 characters. */
    name: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** Name of the emoji Discord suggests the sticker for. */
    tags: string;
  }

  /** Changes to a sticker. Fields left out stay as they are. */
  interface StickerEditOptions {
    /** Description of the sticker. */
    description?: string;
    /** Name of the sticker. */
    name?: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** Name of the emoji Discord suggests the sticker for. */
    tags?: string;
  }

  /** A sound on a guild's soundboard. */
  class SoundboardSound {
    /** ID of the sound. */
    readonly id: Snowflake;

    /** Name of the sound. */
    readonly name: string;

    /** ID of the sound's guild. */
    readonly guildId: Snowflake;

    /** When the sound was uploaded. */
    readonly createdAt: Date;

    /** Volume, from 0 to 1. */
    readonly volume: number;

    /** ID of the sound's custom emoji, or `null`. */
    readonly emojiId: Snowflake | null;

    /** The sound's Unicode emoji, or `null`. */
    readonly emojiName: string | null;

    /** Whether the sound can be played. Sounds become unavailable when a guild loses boosts. */
    readonly available: boolean;

    /** Who uploaded the sound. Only set when the bot has Create Expressions or Manage Expressions. */
    readonly user: User | null;

    /** Changes the sound. */
    edit(options: SoundboardSoundEditOptions): Promise<SoundboardSound>;

    /**
     * Deletes the sound.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;
  }

  /** A soundboard sound to create. */
  interface SoundboardSoundCreateOptions {
    /** Name of the sound, from 2 to 32 characters. */
    name: string;
    /**
     * The audio as a data URI, such as `data:audio/mpeg;base64,...`: MP3 or OGG,
     * up to 512 KB and 5.2 seconds.
     */
    sound: string;
    /** Volume, from 0 to 1. Defaults to 1. */
    volume?: number;
    /** ID of a custom emoji for the sound. */
    emojiId?: Snowflake | null;
    /** A Unicode emoji for the sound. */
    emojiName?: string | null;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** Changes to a soundboard sound. Fields left out stay as they are. */
  interface SoundboardSoundEditOptions {
    /** Name of the sound, from 2 to 32 characters. */
    name?: string;
    /** Volume, from 0 to 1. */
    volume?: number;
    /** ID of a custom emoji for the sound, or `null` to remove it. */
    emojiId?: Snowflake | null;
    /** A Unicode emoji for the sound, or `null` to remove it. */
    emojiName?: string | null;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  //#endregion

  //#region Invites

  /**
   * An invite. Which fields are set depends on how it was fetched: counts need
   * {@link fetchInvite} with counts, and the inviter and expiry come with the
   * guild's own invites.
   *
   * @see https://docs.discord.com/developers/resources/invite#invite-object
   */
  class Invite {
    /** The invite's code, as in `discord.gg/<code>`. */
    readonly code: string;

    /** ID of the invite's guild, or `null`. */
    readonly guildId: Snowflake | null;

    /** The invite's guild, or `null`. */
    readonly guild: InviteGuild | null;

    /** ID of the invite's channel, or `null`. */
    readonly channelId: Snowflake | null;

    /** The invite's channel, or `null`. */
    readonly channel: InviteChannel | null;

    /** Who created the invite, or `null`. */
    readonly inviter: User | null;

    /** When the invite was created, or `null`. */
    readonly createdAt: Date | null;

    /** When the invite expires, or `null` if it doesn't or Discord left it out. */
    readonly expiresAt: Date | null;

    /** Seconds the invite lasts, `0` for forever, or `null`. */
    readonly maxAge: number | null;

    /** How many times the invite can be used, `0` for no limit, or `null`. */
    readonly maxUses: number | null;

    /** How many times the invite was used, or `null`. */
    readonly uses: number | null;

    /** Whether members who join with it are removed when they go offline without a role, or `null`. */
    readonly temporary: boolean | null;

    /** About how many members the guild has, or `null`. */
    readonly approximateMemberCount: number | null;

    /** About how many members are online, or `null`. */
    readonly approximatePresenceCount: number | null;

    /** `1` for an invite to watch a stream, `2` for an activity, or `null` for a normal invite. */
    readonly targetType: number | null;

    /** Whose stream the invite is for, or `null`. */
    readonly targetUser: User | null;

    /** The activity the invite is for, or `null`. */
    readonly targetApplication: Record<string, unknown> | null;

    /** Fetches the invite again. */
    fetch(): Promise<Invite>;

    /**
     * Fetches the invite's channel, or returns `null` for an invite to another
     * guild, whose public details are in {@link Invite.channel}.
     */
    fetchChannel(): Promise<GuildTextChannel | GuildVoiceChannel | null>;

    /**
     * Fetches the invite's guild, or returns `null` for an invite to another
     * guild, whose public details are in {@link Invite.guild}.
     */
    fetchGuild(): Promise<Guild | null>;

    /**
     * Deletes the invite.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;
  }

  /** The public details of an invite's guild. */
  class InviteGuild {
    /** ID of the guild. */
    readonly id: Snowflake;
    /** Name of the guild. */
    readonly name: string;
    /** Hash of the guild's icon, or `null`. */
    readonly icon: string | null;
    /** The guild's description, or `null`. */
    readonly description: string | null;
    /** The guild's features. */
    readonly features: string[];
    /** The guild's {@link Guild.VerificationLevel}, or `null`. */
    readonly verificationLevel: number | null;
    /** Code of the guild's vanity invite, or `null`. */
    readonly vanityUrlCode: string | null;
    /** When the guild was created, in milliseconds since the Unix epoch. */
    readonly createdTimestamp: number;
    /** When the guild was created. */
    readonly createdAt: Date;

    /**
     * Returns the URL of the guild's icon, or `null` if it has none.
     *
     * @param options.size A power of two from 16 to 4096. Defaults to 256.
     * @param options.format Defaults to `"gif"` for an animated icon and `"png"` otherwise.
     */
    iconURL(options?: {
      size?: number;
      format?: "png" | "jpg" | "webp" | "gif";
    }): string | null;
  }

  /** The public details of an invite's channel. */
  class InviteChannel {
    /** ID of the channel. */
    readonly id: Snowflake;
    /** Name of the channel, or `null`. */
    readonly name: string | null;
    /** The type of the channel. */
    readonly type: number;
    /** When the channel was created, in milliseconds since the Unix epoch. */
    readonly createdTimestamp: number;
    /** When the channel was created. */
    readonly createdAt: Date;

    /** Returns the channel's mention, `<#id>`. */
    toMention(): string;
  }

  /** An invite to create. */
  interface InviteCreateOptions {
    /** Seconds the invite lasts, up to 604800 (7 days), or `0` for forever. Defaults to 86400 (1 day). */
    maxAge?: number;
    /** How many times it can be used, up to 100, or `0` for no limit. Defaults to 0. */
    maxUses?: number;
    /** Reason shown in the audit log. */
    reason?: string;
    /** Whether members who join with it are removed when they go offline without a role. */
    temporary?: boolean;
    /** Whether to always create a new invite, instead of returning a matching one. */
    unique?: boolean;
  }

  //#endregion

  //#region Webhooks

  /**
   * A webhook: a way to post messages to a channel under any name and avatar.
   *
   * @see https://docs.discord.com/developers/resources/webhook
   */
  class Webhook {
    /** ID of the channel the webhook posts to, or `null`. */
    readonly channelId: Snowflake | null;

    /** When the webhook was created. */
    readonly createdAt: Date;

    /** ID of the webhook's guild, or `null`. */
    readonly guildId: Snowflake | null;

    /** ID of the webhook. */
    readonly id: Snowflake;

    /** Default name of the webhook, or `null`. */
    readonly name: string | null;

    /**
     * The webhook's token, or `null`. Anyone with it can post as the webhook,
     * so don't log it or store it in KV.
     */
    readonly token: string | null;

    /** The type of webhook. */
    readonly type: WebhookType;

    /**
     * Deletes this webhook.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Deletes a message the webhook sent. */
    deleteMessage(messageId: Snowflake): Promise<void>;

    /** Changes the webhook. */
    edit(options: WebhookEditOptions): Promise<Webhook>;

    /** Edits a message the webhook sent. */
    editMessage(
      messageId: Snowflake,
      body: EditMessageOptions,
    ): Promise<Message>;

    /** Fetches the webhook again. */
    fetch(): Promise<Webhook>;

    /**
     * Fetches a message the webhook sent.
     *
     * @returns The message, or `null` if it doesn't exist. Other failures throw.
     */
    fetchMessage(messageId: Snowflake): Promise<Message | null>;

    /** Sends a message through the webhook. */
    send(content: string | WebhookExecuteOptions): Promise<Message>;
  }

  /** Changes to a webhook. Fields left out stay as they are. */
  interface WebhookEditOptions {
    /** Default avatar as a data URI, or `null` to remove it. */
    avatar?: string | null;
    /** ID of a channel to move the webhook to. */
    channelId?: Snowflake;
    /** Default name of the webhook. */
    name?: string;
    /** Reason shown in the audit log. */
    reason?: string;
  }

  /** A message to send through a webhook, optionally under another name and avatar. */
  interface WebhookExecuteOptions extends SendMessageOptions {
    /** URL of the avatar to show for this message. */
    avatarUrl?: string;

    /** Name to show for this message. */
    username?: string;
  }

  //#endregion

  //#region Scheduled events and stages

  /** An event scheduled in a guild, in a voice or stage channel or somewhere else. */
  class ScheduledEvent {
    /** ID of the event's voice or stage channel, or `null` for an event elsewhere. */
    readonly channelId: Snowflake | null;

    /** When the event was created. */
    readonly createdAt: Date | null;

    /** ID of the user who created the event, or `null`. */
    readonly creatorId: Snowflake | null;

    /** The event's description, or `null`. */
    readonly description: string | null;

    /** Whether the event is in a stage channel, a voice channel or elsewhere. */
    readonly entityType: ScheduledEventEntityType;

    /** ID of the event's guild. */
    readonly guildId: Snowflake;

    /** ID of the event. */
    readonly id: Snowflake;

    /** Name of the event. */
    readonly name: string;

    /** Who can see the event. Always guild members only for now. */
    readonly privacyLevel: ScheduledEventPrivacyLevel;

    /** When the event ends, or `null`. */
    readonly scheduledEndTime: Date | null;

    /** When the event starts. */
    readonly scheduledStartTime: Date;

    /** Whether the event is scheduled, live, finished or canceled. */
    readonly status: ScheduledEventStatus;

    /** How the event repeats, or `null` for a one-off event. */
    readonly recurrenceRule: ScheduledEventRecurrenceRule | null;

    /**
     * Deletes this event.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Changes the event. */
    edit(options: ScheduledEventEditOptions): Promise<ScheduledEvent>;

    /**
     * Fetches the users interested in the event, up to 100 per request, by user
     * ID. Pass the last user's ID as `after` for the next page.
     *
     * ```ts
     * const users = await event.fetchUsers({ limit: 100, withMember: true });
     * ```
     */
    fetchUsers(
      options?: FetchScheduledEventUsersOptions,
    ): Promise<ScheduledEventUser[]>;

    /**
     * Counts the users interested in the event. For a recurring event,
     * `exceptions` has the count for each changed occurrence.
     */
    fetchUserCounts(): Promise<ScheduledEventUserCounts>;

    /**
     * Changes or cancels one occurrence of a recurring event, leaving the rest
     * as they are.
     *
     * ```ts
     * // Skip the occurrence on the 14th.
     * await event.createException({
     *   originalStartTime: "2026-05-14T18:00:00Z",
     *   canceled: true,
     * });
     * ```
     */
    createException(options: ScheduledEventExceptionCreateOptions): Promise<ScheduledEventException>;

    /** Changes an occurrence that already has an exception. */
    editException(
      exceptionId: Snowflake,
      options: ScheduledEventExceptionEditOptions,
    ): Promise<ScheduledEventException>;

    /** Deletes an exception, so its occurrence goes back to the event's schedule. */
    deleteException(exceptionId: Snowflake): Promise<void>;

    /** Fetches the users interested in a changed occurrence, as {@link ScheduledEvent.fetchUsers} does. */
    fetchExceptionUsers(
      exceptionId: Snowflake,
      options?: FetchScheduledEventUsersOptions,
    ): Promise<ScheduledEventUser[]>;
  }

  /** A scheduled event to create. */
  interface ScheduledEventCreateOptions {
    /** ID of the voice or stage channel. Leave it out for an event elsewhere. */
    channelId?: Snowflake;
    /** The event's description. */
    description?: string;
    /** Where an event outside Discord takes place. Required for those events. */
    entityMetadata?: {
      location?: string;
    };
    /** Whether the event is in a stage channel, a voice channel or elsewhere. */
    entityType: ScheduledEventEntityType;
    /** Name of the event. */
    name: string;
    /** Who can see the event. Defaults to guild members only. */
    privacyLevel?: ScheduledEventPrivacyLevel;
    /** Reason shown in the audit log. */
    reason?: string;
    /** How the event repeats. */
    recurrenceRule?: ScheduledEventRecurrenceRule | null;
    /** When the event ends. Required for an event elsewhere. */
    scheduledEndTime?: Date;
    /** When the event starts. */
    scheduledStartTime: Date;
  }

  /** Changes to a scheduled event. Fields left out stay as they are. */
  interface ScheduledEventEditOptions {
    /** ID of the voice or stage channel, or `null` for an event elsewhere. */
    channelId?: Snowflake | null;
    /** The event's description. */
    description?: string;
    /** Where an event outside Discord takes place. */
    entityMetadata?: {
      location?: string;
    };
    /** Whether the event is in a stage channel, a voice channel or elsewhere. */
    entityType?: ScheduledEventEntityType;
    /** Name of the event. */
    name?: string;
    /** Who can see the event. */
    privacyLevel?: ScheduledEventPrivacyLevel;
    /** Reason shown in the audit log. */
    reason?: string;
    /** How the event repeats, or `null` to stop it repeating. */
    recurrenceRule?: ScheduledEventRecurrenceRule | null;
    /** When the event ends. */
    scheduledEndTime?: Date;
    /** When the event starts. */
    scheduledStartTime?: Date;
    /** Set to start, end or cancel the event. */
    status?: ScheduledEventStatus;
  }

  /**
   * How a scheduled event repeats. Discord supports a limited set of patterns:
   * daily (optionally on chosen weekdays), weekly or every other week on one
   * weekday, monthly on the nth weekday (such as the second Tuesday), and
   * yearly on a date.
   *
   * ```ts
   * // Every Friday
   * recurrenceRule: { start, frequency: "weekly", interval: 1, byWeekday: [4] }
   * ```
   */
  interface ScheduledEventRecurrenceRule {
    /** When the first occurrence starts. Must match the event's start time. */
    start: Date;
    /** When the event stops repeating. Leave it out to repeat forever. */
    end?: Date | null;
    /** How often the event repeats. */
    frequency: "yearly" | "monthly" | "weekly" | "daily";
    /** Repeat every `interval` periods. Weekly events allow 1 or 2; others must be 1. */
    interval: number;
    /** Weekdays, where 0 is Monday and 6 is Sunday. */
    byWeekday?: number[];
    /** For monthly events: the week of the month (`n`, 1-5) and weekday (0 is Monday). */
    byNWeekday?: Array<{ n: number; day: number }>;
    /** For yearly events: months, where 1 is January. */
    byMonth?: number[];
    /** For yearly events: days of the month. */
    byMonthDay?: number[];
    /** Number of occurrences before stopping. */
    count?: number | null;
  }

  /** A user interested in a scheduled event. */
  interface ScheduledEventUser {
    /** The user. */
    user: User;
    /** The member, when requested with `withMember` and the user is still in the server. */
    member: GuildMember | null;
  }

  /** Result of {@link ScheduledEvent.fetchUserCounts}. */
  interface ScheduledEventUserCounts {
    /** Users interested in the event as a whole. */
    total: number;
    /** Users interested in each changed occurrence, keyed by exception ID. */
    exceptions: Map<Snowflake, number>;
  }

  /** Which interested users to fetch. */
  interface FetchScheduledEventUsersOptions {
    /** Users per page, from 1 to 100. Defaults to 100. */
    limit?: number;
    /** Only users with IDs lower than this. */
    before?: Snowflake;
    /** Only users with IDs higher than this. */
    after?: Snowflake;
    /** Include each user's guild member. */
    withMember?: boolean;
  }

  /** An occurrence of a recurring event that was changed or canceled. */
  interface ScheduledEventException {
    /** ID of the exception. */
    id: Snowflake;
    /** ID of the event. */
    eventId: Snowflake;
    /** The occurrence's new start, in Unix milliseconds, or `null` when unchanged. */
    scheduledStartTimestamp: number | null;
    /** The occurrence's new end, in Unix milliseconds, or `null` when unchanged. */
    scheduledEndTimestamp: number | null;
    /** `true` when this occurrence will not happen. */
    canceled: boolean;
  }

  /** A change to one occurrence of a recurring event. */
  interface ScheduledEventExceptionCreateOptions extends ScheduledEventExceptionEditOptions {
    /** When the occurrence would start according to the series. This picks the occurrence. */
    originalStartTime: Date | number | string;
  }

  /** Changes to an exception. Fields left out stay as they are. */
  interface ScheduledEventExceptionEditOptions {
    /** New start for this occurrence. `null` goes back to the series' time. */
    startTime?: Date | number | string | null;
    /** New end for this occurrence. `null` goes back to the series' time. */
    endTime?: Date | number | string | null;
    /** `true` to cancel this occurrence. */
    canceled?: boolean;
  }

  /** A live stage: a stage channel while someone is speaking in it. */
  class StageInstance {
    /** ID of the stage channel. */
    readonly channelId: Snowflake;

    /** When the stage started. */
    readonly createdAt: Date | null;

    /** ID of the guild. */
    readonly guildId: Snowflake;

    /** ID of the stage instance. */
    readonly id: Snowflake;

    /** Who can see the stage. */
    readonly privacyLevel: StageInstancePrivacyLevel;

    /** What the stage is about. */
    readonly topic: string;

    /**
     * Ends the stage.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Changes the stage instance. */
    edit(options: StageInstanceEditOptions): Promise<StageInstance>;
  }

  /** A stage to start. */
  interface StageInstanceCreateOptions {
    /** ID of the stage channel. */
    channelId: Snowflake;
    /** Who can see the stage. */
    privacyLevel?: StageInstancePrivacyLevel;
    /** Reason shown in the audit log. */
    reason?: string;
    /** What the stage is about, up to 120 characters. */
    topic: string;
  }

  /** Changes to a stage. Fields left out stay as they are. */
  interface StageInstanceEditOptions {
    /** Who can see the stage. */
    privacyLevel?: StageInstancePrivacyLevel;
    /** Reason shown in the audit log. */
    reason?: string;
    /** What the stage is about. */
    topic?: string;
  }

  //#endregion

  //#region Auto moderation

  /**
   * An auto moderation rule: what Discord blocks or flags, and what it does then.
   *
   * @see https://docs.discord.com/developers/resources/auto-moderation
   */
  class AutoModRule {
    /** What the rule does when it triggers. */
    readonly actions: AutoModAction[];

    /** When the rule was created. */
    readonly createdAt: Date;

    /** Whether the rule is on. */
    readonly enabled: boolean;

    /** When the rule is checked. */
    readonly eventType: AutoModEventType;

    /** IDs of the channels the rule ignores. */
    readonly exemptChannels: Snowflake[];

    /** IDs of the roles the rule ignores. */
    readonly exemptRoles: Snowflake[];

    /** ID of the rule's guild. */
    readonly guildId: Snowflake;

    /** ID of the rule. */
    readonly id: Snowflake;

    /** Name of the rule. */
    readonly name: string;

    /** Settings for the rule's trigger, such as its keywords. */
    readonly triggerMetadata: AutoModTriggerMetadata;

    /** What the rule looks for. */
    readonly triggerType: AutoModTriggerType;

    /**
     * Deletes the rule.
     *
     * @param reason Reason shown in the audit log.
     */
    delete(reason?: string): Promise<void>;

    /** Changes the rule. */
    edit(options: AutoModRuleEditOptions): Promise<AutoModRule>;
  }

  /** An auto moderation rule to create. */
  interface AutoModRuleCreateOptions {
    /** What the rule does when it triggers. */
    actions: AutoModAction[];
    /** Whether the rule is on. Defaults to `false`. */
    enabled?: boolean;
    /** When the rule is checked. */
    eventType: AutoModEventType;
    /** IDs of channels the rule ignores, up to 50. */
    exemptChannels?: Snowflake[];
    /** IDs of roles the rule ignores, up to 20. */
    exemptRoles?: Snowflake[];
    /** Name of the rule. */
    name: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** Settings for the trigger, such as its keywords. */
    triggerMetadata?: AutoModTriggerMetadata;
    /** What the rule looks for. */
    triggerType: AutoModTriggerType;
  }

  /** Changes to an auto moderation rule. Fields left out stay as they are. */
  interface AutoModRuleEditOptions {
    /** What the rule does when it triggers. */
    actions?: AutoModAction[];
    /** Whether the rule is on. */
    enabled?: boolean;
    /** IDs of channels the rule ignores. */
    exemptChannels?: Snowflake[];
    /** IDs of roles the rule ignores. */
    exemptRoles?: Snowflake[];
    /** Name of the rule. */
    name?: string;
    /** Reason shown in the audit log. */
    reason?: string;
    /** Settings for the trigger, such as its keywords. */
    triggerMetadata?: AutoModTriggerMetadata;
  }

  /** Settings for an auto moderation trigger. Each applies to some trigger types only. */
  interface AutoModTriggerMetadata {
    /** Words the rule lets through even when they match. */
    allowList?: string[];

    /** Words to block. `*` matches any characters at the start or end of a word. */
    keywordFilter?: string[];

    /** Whether to detect mention raids, for a mention spam rule. */
    mentionRaidProtectionEnabled?: boolean;

    /** The most mentions a message can have, up to 50, for a mention spam rule. */
    mentionTotalLimit?: number;

    /** Discord's word lists: `1` profanity, `2` sexual content, `3` slurs. */
    presets?: number[];

    /** Regular expressions to block, in Rust syntax, up to 10. */
    regexPatterns?: string[];
  }

  /** Something an auto moderation rule does when it triggers. */
  interface AutoModAction {
    /** Settings for the action. */
    metadata?: AutoModActionMetadata;

    /** What to do. */
    type: AutoModActionType;
  }

  /** Settings for an auto moderation action. */
  interface AutoModActionMetadata {
    /** ID of the channel to send alerts to, for `SEND_ALERT_MESSAGE`. */
    channelId?: Snowflake;

    /** Message shown to the user whose message was blocked, up to 150 characters. */
    customMessage?: string;

    /** How long to time the user out, in seconds up to 2419200 (4 weeks), for `TIMEOUT`. */
    durationSeconds?: number;
  }

  //#endregion

  //#region Audit log

  /**
   * A page of a guild's audit log. Besides the entries, it has the users,
   * webhooks and other things they refer to.
   */
  class AuditLog {
    /** The entries, newest first. */
    readonly entries: AnyAuditLogEntry[];

    /** Users the entries refer to. */
    readonly users: User[];

    /** Webhooks the entries refer to. */
    readonly webhooks: Webhook[];

    /** Threads the entries refer to. */
    readonly threads: Channel[];

    /** Scheduled events the entries refer to. */
    readonly guildScheduledEvents: ScheduledEvent[];

    /** Auto moderation rules the entries refer to. */
    readonly autoModerationRules: AutoModRule[];

    /** Application commands the entries refer to, as Discord sent them. */
    readonly applicationCommands: unknown[];

    /** Integrations the entries refer to, as Discord sent them. */
    readonly integrations: unknown[];

    /** The page as Discord sent it. */
    readonly raw: unknown;
  }

  /**
   * An entry in the audit log. Compare `actionType` with
   * {@link AuditLogActionType} to narrow it to an entry class with typed `changes`.
   */
  class AuditLogEntry {
    /** ID of the entry. */
    readonly id: Snowflake;

    /** What happened. */
    readonly actionType: AuditLogActionType;

    /** ID of the user, channel, role or other thing it happened to, or `null`. */
    readonly targetId: Snowflake | null;

    /** Who did it, or `null`. */
    readonly user: User | null;

    /** ID of who did it, or `null`. */
    readonly userId: Snowflake | null;

    /** The reason they gave, or `null`. */
    readonly reason: string | null;

    /** What changed, by field. */
    readonly changes: Record<
      string,
      { readonly oldValue?: unknown; readonly newValue?: unknown }
    >;

    /** Extra details for some actions, such as the channel of a deleted message, or `null`. */
    readonly options: Record<string, unknown> | null;

    /** Creates the entry class that matches the data's `action_type`. */
    static create(data: Record<string, unknown>): AnyAuditLogEntry;
  }

  /** Any audit log entry class. */
  type AnyAuditLogEntry =
    | MemberKickEntry
    | MemberPruneEntry
    | MemberBanAddEntry
    | MemberBanRemoveEntry
    | MemberUpdateEntry
    | MemberRoleUpdateEntry
    | MemberMoveEntry
    | MemberDisconnectEntry
    | BotAddEntry
    | RoleCreateEntry
    | RoleUpdateEntry
    | RoleDeleteEntry
    | ChannelCreateEntry
    | ChannelUpdateEntry
    | ChannelDeleteEntry
    | ChannelPermissionOverwriteCreateEntry
    | ChannelPermissionOverwriteUpdateEntry
    | ChannelPermissionOverwriteDeleteEntry
    | EmojiCreateEntry
    | EmojiUpdateEntry
    | EmojiDeleteEntry
    | GuildUpdateEntry
    | InviteCreateEntry
    | InviteUpdateEntry
    | InviteDeleteEntry
    | WebhookCreateEntry
    | WebhookUpdateEntry
    | WebhookDeleteEntry
    | MessageDeleteEntry
    | MessageBulkDeleteEntry
    | MessagePinEntry
    | MessageUnpinEntry
    | IntegrationCreateEntry
    | IntegrationUpdateEntry
    | IntegrationDeleteEntry
    | AutoModRuleCreateEntry
    | AutoModRuleUpdateEntry
    | AutoModRuleDeleteEntry
    | AuditLogEntry;

  /** Which audit log entries to fetch. */
  interface AuditLogFetchOptions {
    /** Only entries of this action. */
    actionType?: AuditLogActionType;
    /** Fetch entries newer than this entry ID. */
    after?: Snowflake;
    /** Fetch entries older than this entry ID. */
    before?: Snowflake;
    /** How many entries to fetch, from 1 to 100. Defaults to 50. */
    limit?: number;
    /** Only entries by this user. */
    userId?: Snowflake;
  }

  /** A field that changed: its value before and after. */
  interface AuditLogChange<T> {
    /** The value after the change. */
    readonly newValue: T;

    /** The value before the change. */
    readonly oldValue?: T;
  }

  /** A field of something that was deleted: its last value. */
  interface AuditLogOldValue<T> {
    /** The value before it was deleted. */
    readonly oldValue: T;
  }

  /** A field of something that was created: its first value. */
  interface AuditLogNewValue<T> {
    /** The value it was created with. */
    readonly newValue: T;
  }

  /** @deprecated Renamed to {@link AuditLogChange}. */
  type IActionChange<T> = AuditLogChange<T>;

  /** @deprecated Renamed to {@link AuditLogOldValue}. */
  type IActionChangeOldValue<T> = AuditLogOldValue<T>;

  /** @deprecated Renamed to {@link AuditLogNewValue}. */
  type IActionChangeNewValue<T> = AuditLogNewValue<T>;

  /** A member was kicked. */
  class MemberKickEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_KICK;

    readonly changes: Record<string, never>;
  }

  /** Inactive members were pruned. `options` holds how many and after how many days. */
  class MemberPruneEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_PRUNE;

    readonly changes: Record<string, never>;
  }

  /** A user was banned. */
  class MemberBanAddEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_BAN_ADD;

    readonly changes: Record<string, never>;
  }

  /** A user was unbanned. */
  class MemberBanRemoveEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_BAN_REMOVE;

    readonly changes: Record<string, never>;
  }

  /** A member was changed, such as their nickname or timeout. */
  class MemberUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_UPDATE;

    readonly changes: {
      readonly communicationDisabledUntil?: AuditLogChange<string>;
      readonly deaf?: AuditLogChange<boolean>;
      readonly mute?: AuditLogChange<boolean>;
      readonly nick?: AuditLogChange<string>;
      readonly roles?: AuditLogChange<string[]>;
    };
  }

  /** A member was given or lost roles. */
  class MemberRoleUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_ROLE_UPDATE;

    readonly changes: {
      readonly $add?: AuditLogNewValue<
        {
          id: Snowflake;
          name: string;
        }[]
      >;
      readonly $remove?: AuditLogOldValue<
        {
          id: Snowflake;
          name: string;
        }[]
      >;
    };
  }

  /** Members were moved to another voice channel. `options` holds the channel and how many. */
  class MemberMoveEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_MOVE;
    readonly changes: Record<string, never>;
  }

  /** Members were disconnected from voice. `options` holds how many. */
  class MemberDisconnectEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MEMBER_DISCONNECT;
    readonly changes: Record<string, never>;
  }

  /** A bot was added. `targetId` is the bot. */
  class BotAddEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.BOT_ADD;
    readonly changes: Record<string, never>;
  }

  /** A role was created. */
  class RoleCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.ROLE_CREATE;

    readonly changes: {
      readonly color: AuditLogNewValue<number>;
      readonly hoist: AuditLogNewValue<boolean>;
      readonly mentionable: AuditLogNewValue<boolean>;
      readonly name: AuditLogNewValue<string>;
      readonly permissions: AuditLogNewValue<bigint>;
    };
  }

  /** A role was changed. */
  class RoleUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.ROLE_UPDATE;

    readonly changes: {
      readonly color?: AuditLogChange<number>;
      readonly hoist?: AuditLogChange<boolean>;
      readonly mentionable?: AuditLogChange<boolean>;
      readonly name?: AuditLogChange<string>;
      readonly permissions?: AuditLogChange<bigint>;
    };
  }

  /** A role was deleted. */
  class RoleDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.ROLE_DELETE;

    readonly changes: {
      readonly color: AuditLogOldValue<number>;
      readonly hoist: AuditLogOldValue<boolean>;
      readonly mentionable: AuditLogOldValue<boolean>;
      readonly name: AuditLogOldValue<string>;
      readonly permissions: AuditLogOldValue<bigint>;
    };
  }

  /** A channel was created. */
  class ChannelCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_CREATE;

    readonly changes: {
      readonly bitrate?: AuditLogNewValue<number>;
      readonly name: AuditLogNewValue<string>;
      readonly nsfw?: AuditLogNewValue<boolean>;
      readonly rateLimitPerUser?: AuditLogNewValue<number>;
      readonly topic?: AuditLogNewValue<string>;
      readonly type: AuditLogNewValue<number>;
    };
  }

  /** A channel was changed. */
  class ChannelUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_UPDATE;

    readonly changes: {
      readonly bitrate?: AuditLogChange<number>;
      readonly name?: AuditLogChange<string>;
      readonly nsfw?: AuditLogChange<boolean>;
      readonly rateLimitPerUser?: AuditLogChange<number>;
      readonly topic?: AuditLogChange<string>;
    };
  }

  /** A channel was deleted. */
  class ChannelDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_DELETE;

    readonly changes: {
      readonly bitrate?: AuditLogOldValue<number>;
      readonly name: AuditLogOldValue<string>;
      readonly nsfw?: AuditLogOldValue<boolean>;
      readonly rateLimitPerUser?: AuditLogOldValue<number>;
      readonly topic?: AuditLogOldValue<string>;
      readonly type: AuditLogOldValue<number>;
    };
  }

  /** A permission overwrite was added to a channel. */
  class ChannelPermissionOverwriteCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_OVERWRITE_CREATE;
    readonly changes: {
      readonly id: AuditLogNewValue<Snowflake>;
      readonly type: AuditLogNewValue<number>;
      readonly allow: AuditLogNewValue<string>;
      readonly deny: AuditLogNewValue<string>;
    };
  }

  /** A channel's permission overwrite was changed. */
  class ChannelPermissionOverwriteUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_OVERWRITE_UPDATE;
    readonly changes: {
      readonly id?: AuditLogChange<Snowflake>;
      readonly type?: AuditLogChange<number>;
      readonly allow?: AuditLogChange<string>;
      readonly deny?: AuditLogChange<string>;
    };
  }

  /** A permission overwrite was removed from a channel. */
  class ChannelPermissionOverwriteDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.CHANNEL_OVERWRITE_DELETE;
    readonly changes: {
      readonly id: AuditLogOldValue<Snowflake>;
      readonly type: AuditLogOldValue<number>;
      readonly allow: AuditLogOldValue<string>;
      readonly deny: AuditLogOldValue<string>;
    };
  }

  /** An emoji was created. */
  class EmojiCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.EMOJI_CREATE;

    readonly changes: {
      readonly name: AuditLogNewValue<string>;
    };
  }

  /** An emoji was changed. */
  class EmojiUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.EMOJI_UPDATE;

    readonly changes: {
      readonly name?: AuditLogChange<string>;
    };
  }

  /** An emoji was deleted. */
  class EmojiDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.EMOJI_DELETE;

    readonly changes: {
      readonly name?: AuditLogOldValue<string>;
    };
  }

  /** The guild was changed. */
  class GuildUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.GUILD_UPDATE;

    readonly changes: {
      readonly afkChannelId?: AuditLogChange<string>;
      readonly afkTimeout?: AuditLogChange<number>;
      readonly defaultMessageNotification?: AuditLogChange<number>;
      readonly explicitContentFilter?: AuditLogChange<number>;
      readonly iconHash?: AuditLogChange<string>;
      readonly mfaLevel?: AuditLogChange<number>;
      readonly name?: AuditLogChange<string>;
      readonly ownerId?: AuditLogChange<Snowflake>;
      readonly region?: AuditLogChange<string>;
      readonly splashHash?: AuditLogChange<string>;
      readonly systemChannelId?: AuditLogChange<string>;
      readonly vanityUrlCode?: AuditLogChange<string>;
      readonly verificationLevel?: AuditLogChange<number>;
      readonly widgetChannelId?: AuditLogChange<string>;
      readonly widgetEnabled?: AuditLogChange<boolean>;
    };
  }

  /** An invite was created. */
  class InviteCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INVITE_CREATE;

    readonly changes: {
      readonly channelId: AuditLogNewValue<Snowflake>;
      readonly code: AuditLogNewValue<string>;
      readonly inviterId: AuditLogNewValue<Snowflake>;
      readonly maxAge: AuditLogNewValue<number>;
      readonly maxUses: AuditLogNewValue<number>;
      readonly temporary: AuditLogNewValue<boolean>;
      readonly uses: AuditLogNewValue<number>;
    };
  }

  /** An invite was changed. */
  class InviteUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INVITE_UPDATE;

    readonly changes: {
      readonly channelId?: AuditLogChange<Snowflake>;
      readonly code?: AuditLogChange<string>;
      readonly inviterId?: AuditLogChange<Snowflake>;
      readonly maxAge?: AuditLogChange<number>;
      readonly maxUses?: AuditLogChange<number>;
      readonly temporary?: AuditLogChange<boolean>;
      readonly uses?: AuditLogChange<number>;
    };
  }

  /** An invite was deleted. */
  class InviteDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INVITE_DELETE;

    readonly changes: {
      readonly channelId: AuditLogOldValue<Snowflake>;
      readonly code: AuditLogOldValue<string>;
      readonly inviterId: AuditLogOldValue<Snowflake>;
      readonly maxAge: AuditLogOldValue<number>;
      readonly maxUses: AuditLogOldValue<number>;
      readonly temporary: AuditLogOldValue<boolean>;
      readonly uses: AuditLogOldValue<number>;
    };
  }

  /** A webhook was created. */
  class WebhookCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.WEBHOOK_CREATE;

    readonly changes: {
      readonly avatarHash?: AuditLogNewValue<string>;
      readonly channelId: AuditLogNewValue<Snowflake>;
      readonly name: AuditLogNewValue<string>;
      readonly type: AuditLogNewValue<number>;
    };
  }

  /** A webhook was changed. */
  class WebhookUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.WEBHOOK_UPDATE;

    readonly changes: {
      readonly avatarHash?: AuditLogChange<string>;
      readonly channelId?: AuditLogChange<Snowflake>;
      readonly name?: AuditLogChange<string>;
      readonly type?: AuditLogChange<number>;
    };
  }

  /** A webhook was deleted. */
  class WebhookDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.WEBHOOK_DELETE;

    readonly changes: {
      readonly avatarHash?: AuditLogOldValue<string>;
      readonly channelId: AuditLogOldValue<Snowflake>;
      readonly name: AuditLogOldValue<string>;
      readonly type: AuditLogOldValue<number>;
    };
  }

  /** A moderator deleted someone's message. `options` holds the channel and count. */
  class MessageDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_DELETE;

    readonly changes: Record<string, never>;
  }

  /** Messages were deleted at once. `options` holds the count. */
  class MessageBulkDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_BULK_DELETE;

    readonly changes: Record<string, never>;
  }

  /** A message was pinned. `options` holds the channel and message. */
  class MessagePinEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_PIN;

    readonly changes: Record<string, never>;
  }

  /** A message was unpinned. `options` holds the channel and message. */
  class MessageUnpinEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.MESSAGE_UNPIN;

    readonly changes: Record<string, never>;
  }

  /** An integration was added. */
  class IntegrationCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INTEGRATION_CREATE;

    readonly changes: {
      readonly enableEmoticons?: AuditLogNewValue<boolean>;
      readonly expireBehavior: AuditLogNewValue<number>;
      readonly expireGracePeriod: AuditLogNewValue<number>;
      readonly name: AuditLogNewValue<string>;
      readonly type: AuditLogNewValue<"twitch" | "youtube">;
    };
  }

  /** An integration was changed. */
  class IntegrationUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INTEGRATION_UPDATE;

    readonly changes: {
      readonly enableEmoticons?: AuditLogChange<boolean>;
      readonly expireBehavior?: AuditLogChange<number>;
      readonly expireGracePeriod?: AuditLogChange<number>;
      readonly name?: AuditLogChange<string>;
      readonly type?: AuditLogChange<"twitch" | "youtube">;
    };
  }

  /** An integration was removed. */
  class IntegrationDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.INTEGRATION_DELETE;

    readonly changes: {
      readonly enableEmoticons?: AuditLogOldValue<boolean>;
      readonly expireBehavior: AuditLogOldValue<number>;
      readonly expireGracePeriod: AuditLogOldValue<number>;
      readonly name: AuditLogOldValue<string>;
      readonly type: AuditLogOldValue<"twitch" | "youtube">;
    };
  }

  /** An auto moderation rule was created. */
  class AutoModRuleCreateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.AUTO_MODERATION_RULE_CREATE;

    readonly changes: {
      readonly enabled: AuditLogNewValue<boolean>;
      readonly eventType: AuditLogNewValue<number>;
      readonly name: AuditLogNewValue<string>;
      readonly triggerType: AuditLogNewValue<number>;
    };
  }

  /** An auto moderation rule was changed. */
  class AutoModRuleUpdateEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.AUTO_MODERATION_RULE_UPDATE;

    readonly changes: {
      readonly enabled?: AuditLogChange<boolean>;
      readonly name?: AuditLogChange<string>;
      readonly triggerMetadata?: AuditLogChange<AutoModTriggerMetadata>;
    };
  }

  /** An auto moderation rule was deleted. */
  class AutoModRuleDeleteEntry extends AuditLogEntry {
    readonly actionType: typeof AuditLogActionType.AUTO_MODERATION_RULE_DELETE;

    readonly changes: Record<string, never>;
  }

  //#endregion

  //#region Interactions

  /**
   * A slash command, button press, menu choice, autocomplete request or modal
   * submission. Check its kind with an `is*()` method first. Discord needs a
   * reply, defer or update within 3 seconds.
   *
   * ```ts
   * discord.on(discord.events.INTERACTION_CREATE, async (interaction) => {
   *   if (!interaction.isButton() || interaction.customId !== 'refresh') return;
   *   await interaction.update({ content: 'Refreshed.' });
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/interactions/receiving-and-responding
   */
  class Interaction {
    /** ID of the interaction. */
    readonly id: Snowflake;

    /** The type of interaction. */
    readonly type: InteractionType;

    /** ID of the guild it happened in, or `null` outside a guild. */
    readonly guildId: Snowflake | null;

    /** ID of the channel it happened in, or `null`. */
    readonly channelId: Snowflake | null;

    /** The member who triggered it, or `null` outside a guild. */
    readonly member: GuildMember | null;

    /** The user who triggered it, or `null`. */
    readonly user: User | null;

    /** Name of the command, or `null` if it isn't a command. */
    readonly commandName: string | null;

    /** ID of the user or message a context menu command was used on, or `null`. */
    readonly targetId: Snowflake | null;

    /** Custom ID of the component or modal, or `null`. */
    readonly customId: string | null;

    /** The type of component, or `null` if it isn't a component. */
    readonly componentType: ComponentType | null;

    /** Values picked in a select menu. */
    readonly values: string[];

    /** The message of the button or menu, or `null`. */
    readonly message: Message | null;

    /** The user's language, such as `"en-US"`, or `null`. */
    readonly locale: string | null;

    /** The guild's language, or `null`. */
    readonly guildLocale: string | null;

    /** The bot's permissions in the channel, as a bitfield in a decimal string, or `null`. */
    readonly appPermissions: string | null;

    /** What the user has bought from the bot. */
    readonly entitlements: Entitlement[];

    /**
     * Token for replying to the interaction, valid for 15 minutes. Anyone with
     * it can reply as the bot, so don't log or store it.
     */
    readonly token: string;

    /** Returns whether it's a slash or context menu command. */
    isCommand(): this is this & {
      commandName: string;
    };

    /** Returns whether it's a user context menu command. */
    isUserContextMenu(): this is this & {
      commandName: string;
      targetId: Snowflake;
      type: typeof InteractionType.APPLICATION_COMMAND;
    };

    /** Returns whether it's a message context menu command. */
    isMessageContextMenu(): this is this & {
      commandName: string;
      targetId: Snowflake;
      type: typeof InteractionType.APPLICATION_COMMAND;
    };

    /** Returns whether it's an autocomplete request. */
    isAutocomplete(): this is this & {
      type: typeof InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE;
    };

    /** Returns whether it came from a component in a message. */
    isComponent(): this is this & {
      componentType: ComponentType;
      customId: string;
    };

    /** Returns whether it came from a button. */
    isButton(): this is this & {
      componentType: typeof ComponentType.BUTTON;
      customId: string;
      message: Message | null;
    };

    /** Returns whether it came from a string select menu. */
    isStringSelect(): this is this & {
      componentType: typeof ComponentType.STRING_SELECT;
      customId: string;
    };

    /** Returns whether it came from a user select menu. */
    isUserSelect(): this is this & {
      componentType: typeof ComponentType.USER_SELECT;
      customId: string;
    };

    /** Returns whether it came from a role select menu. */
    isRoleSelect(): this is this & {
      componentType: typeof ComponentType.ROLE_SELECT;
      customId: string;
    };

    /** Returns whether it came from a user and role select menu. */
    isMentionableSelect(): this is this & {
      componentType: typeof ComponentType.MENTIONABLE_SELECT;
      customId: string;
    };

    /** Returns whether it came from a channel select menu. */
    isChannelSelect(): this is this & {
      componentType: typeof ComponentType.CHANNEL_SELECT;
      customId: string;
    };

    /** Returns whether it's a modal being submitted. */
    isModalSubmit(): this is this & {
      customId: string;
    };

    /** Returns the command's options. */
    getOptions(): InteractionOptionParser;

    /** Returns the text a modal's text input was filled with, or `null`. */
    getTextInput(customId: string): string | null;

    /** Returns whether a modal's checkbox is checked. */
    getCheckbox(customId: string): boolean;

    /** Returns the values of the checked boxes in a modal's checkbox group. */
    getCheckboxValues(customId: string): string[];

    /** Returns the value picked in a modal's radio group, or `null`. */
    getRadioValue(customId: string): string | null;

    /** Returns the first file uploaded in a modal's file upload, or `null`. */
    getFile(customId: string): Attachment | null;

    /** Returns the files uploaded in a modal's file upload. */
    getFiles(customId: string): Attachment[];

    /**
     * Replies to the interaction. Use {@link Interaction.followup} to send more
     * messages after this.
     */
    reply(
      body:
        | string
        | (InteractionReplyOptions & {
            wait?: false;
          }),
    ): Promise<void>;

    /** Replies to the interaction and returns the reply. */
    reply(
      body:
        | string
        | (InteractionReplyOptions & {
            wait: true;
          }),
    ): Promise<Message>;

    /**
     * Shows the user that the bot is thinking, so it has 15 minutes to reply
     * instead of 3 seconds. Reply with {@link Interaction.editReply} afterwards.
     */
    defer(options?: { ephemeral?: boolean }): Promise<void>;

    /** Edits the message of the button or menu that was used. */
    update(body: string | InteractionReplyOptions): Promise<void>;

    /**
     * Answers a button or menu without changing its message yet. Edit it later
     * with {@link Interaction.editReply}.
     */
    deferUpdate(): Promise<void>;

    /** Shows a modal. Must be the first response to the interaction. */
    showModal(modal: {
      components: Component[];
      customId: string;
      title: string;
    }): Promise<void>;

    /** Answers an autocomplete request with up to 25 choices. */
    autocompleteReply(choices: CommandChoice[]): Promise<void>;

    /**
     * Fetches the reply.
     *
     * @param messageId A follow-up to fetch instead.
     */
    fetchReply(messageId?: Snowflake): Promise<Message>;

    /**
     * Edits the reply.
     *
     * @param messageId A follow-up to edit instead.
     */
    editReply(
      body: string | EditMessageOptions,
      messageId?: Snowflake,
    ): Promise<Message>;

    /**
     * Deletes the reply.
     *
     * @param messageId A follow-up to delete instead.
     */
    deleteReply(messageId?: Snowflake): Promise<void>;

    /** Sends another message after the reply. */
    followup(
      body:
        | string
        | (SendMessageOptions & {
            ephemeral?: boolean;
          }),
    ): Promise<Message>;

    /** Deletes a follow-up message. */
    deleteFollowup(messageId: Snowflake): Promise<void>;
  }

  /** A command's options, from {@link Interaction.getOptions}. Each getter returns `null` for an option the user left out. */
  class InteractionOptionParser {
    /** Returns a string option. */
    getString(name: string): string | null;

    /** Returns an integer option. */
    getInteger(name: string): number | null;

    /** Returns a number option. */
    getNumber(name: string): number | null;

    /** Returns a boolean option. */
    getBoolean(name: string): boolean | null;

    /** Returns a user option. */
    getUser(name: string): User | null;

    /** Returns a user option's member, or `null` if they aren't in the guild. */
    getMember(name: string): GuildMember | null;

    /** Returns a role option. */
    getRole(name: string): Role | null;

    /** Returns a channel option. */
    getChannel(name: string): AnyGuildChannel | null;

    /** Returns an attachment option. */
    getAttachment(name: string): Attachment | null;

    /** Returns what the user has typed so far in the option being autocompleted. */
    getFocused(): string | null;
  }

  /** A reply to an interaction. */
  interface InteractionReplyOptions {
    /** Which mentions in the message notify people. */
    allowedMentions?: AllowedMentions;

    /** Buttons, menus and other components. */
    components?: Component[];

    /** Text of the message, up to 2000 characters. */
    content?: string;

    /** Embeds, up to 10. */
    embeds?: EmbedLike[];

    /** Whether only the user who triggered the interaction can see the reply. */
    ephemeral?: boolean;

    /** A poll to send with the reply. */
    poll?: PollCreateOptions;

    /** Whether Discord reads the message aloud. */
    tts?: boolean;
  }

  /** A suggestion returned by an option's autocomplete handler. */
  interface AutocompleteChoice<T extends string | number = string | number> {
    /** The text shown in the list, up to 100 characters. */
    name: string;
    /** What the option is set to when the user picks this choice. */
    value: T;
  }

  /** A fixed choice for a command option. */
  interface OptionChoice<T extends string | number = string | number> {
    /** The text shown in the list, up to 100 characters. */
    name: string;
    /** What the handler receives when the user picks this choice. */
    value: T;
    /** Translations of `name`, keyed by locale. */
    nameLocalizations?: LocaleMap;
  }

  /** A choice for {@link Interaction.autocompleteReply}. */
  interface CommandChoice {
    /** The text shown in the list, up to 100 characters. */
    name: string;

    /** Translations of `name`, keyed by locale. */
    nameLocalizations?: LocaleMap;

    /** What the option is set to when the user picks this choice. */
    value: string | number;
  }

  //#endregion

  //#region Commands

  /**
   * Slash, prefix and context menu commands, and handlers for buttons, menus
   * and modals. Create an application with {@link commands.create} and register
   * everything at the top level of the script.
   *
   * ```ts
   * const app = discord.commands.create();
   *
   * app.slash(
   *   { name: 'echo', description: 'Repeats what you say', options: (o) => ({ text: o.string('What to say') }) },
   *   async (interaction, { text }) => interaction.reply(text),
   * );
   * ```
   */
  namespace commands {
    /** Declares a slash command's options. Each method's argument is the description shown in Discord. */
    interface OptionBuilder {
      /** A text option. */
      string(description: string): CommandOption<string, false, "string">;
      /** A whole-number option. */
      integer(description: string): CommandOption<number, false, "integer">;
      /** A number option, decimals allowed. */
      number(description: string): CommandOption<number, false, "number">;
      /** A true-or-false option. */
      boolean(description: string): CommandOption<boolean, false, "boolean">;
      /** A user option. */
      user(description: string): CommandOption<User, false, "user">;
      /** A user option that gives the handler their member. */
      member(description: string): CommandOption<GuildMember, false, "member">;
      /** A channel option. */
      channel(
        description: string,
      ): CommandOption<AnyGuildChannel, false, "channel">;
      /** A role option. */
      role(description: string): CommandOption<Role, false, "role">;
      /** A file option. */
      attachment(
        description: string,
      ): CommandOption<Attachment, false, "attachment">;
    }

    type OptionMap = Record<string, CommandOption<any, any, any>>;
    type InferOptions<TSchema extends OptionMap> = {
      [TKey in keyof TSchema]: TSchema[TKey] extends CommandOption<
        infer TValue,
        infer TOptional,
        any
      >
        ? TOptional extends true
          ? TValue | null
          : TValue
        : never;
    };

    /** Declares a prefix command's arguments, which are read in order. */
    interface ArgumentBuilder {
      /** One word, or several in quotes. */
      string(description: string): CommandArgument<string>;
      /** A whole number. */
      integer(description: string): CommandArgument<number>;
      /** A number, decimals allowed. */
      number(description: string): CommandArgument<number>;
      /** A duration such as `10m` or `1.5h`, in milliseconds. Units are `ms`, `s`, `m`, `h`, `d` and `w`. */
      duration(description: string): CommandArgument<number>;
      /** Everything left in the message. Must be the last argument. */
      rest(description: string): CommandArgument<string>;
      /** A user, as a mention or ID. */
      user(description: string): CommandArgument<User>;
      /** A member, as a mention or ID. */
      member(description: string): CommandArgument<GuildMember>;
      /** A channel, as a mention or ID. */
      channel(description: string): CommandArgument<AnyGuildChannel>;
      /** A role, as a mention or ID. */
      role(description: string): CommandArgument<Role>;
      /** A value read by your own parser. */
      custom<TValue>(
        description: string,
        parser: CustomArgumentParser<TValue>,
      ): CommandArgument<TValue>;
    }

    type ArgumentMap = Record<string, CommandArgument<any, any>>;
    type InferArguments<TSchema extends ArgumentMap> = {
      [TKey in keyof TSchema]: TSchema[TKey] extends CommandArgument<
        infer TValue,
        infer TOptional
      >
        ? TOptional extends true
          ? TValue | null
          : TValue
        : never;
    };

    /** A slash command. */
    interface SlashConfig<TSchema extends OptionMap = Record<never, never>> {
      /** Command name: 1 to 32 lowercase characters without spaces. */
      name: string;
      /** Shown under the name in Discord's command list, up to 100 characters. */
      description: string;
      /** Translations of `name`, keyed by locale. */
      nameLocalizations?: LocaleMap;
      /** Translations of `description`, keyed by locale. */
      descriptionLocalizations?: LocaleMap;
      /**
       * Hides the command from members without these permissions. Server admins can still
       * change who sees it under Server Settings > Integrations.
       */
      defaultMemberPermissions?: PermissionFlag | null;
      /** Marks the command as age-restricted. */
      nsfw?: boolean;
      /** Declares the command's options. The handler receives them parsed and typed. */
      options?: (option: OptionBuilder) => TSchema;
      /** Checks that run before the handler, in order. */
      filters?: CommandFilter[];
      /** Permissions the member, the bot, or both must have, checked when the command runs. */
      permissions?: CommandPermissions;
      /** How long a user, channel or server must wait between uses. */
      cooldown?: CommandCooldown;
    }

    /** A command run by a message starting with a prefix, such as `!ban`. */
    interface PrefixConfig<TSchema extends ArgumentMap = Record<never, never>> {
      /** The word after the prefix that runs the command. */
      name: string;
      /** Other words that run the same command. */
      aliases?: string[];
      /**
       * Extra prefixes for this command, on top of the application's. The application's default
       * to `"!"`.
       */
      prefixes?: string[];
      /** A summary for your own help command. Discord does not show it. */
      description?: string;
      /** Declares the command's arguments. The handler receives them parsed and typed. */
      args?: (argument: ArgumentBuilder) => TSchema;
      /** Checks that run before the handler, in order. */
      filters?: CommandFilter[];
      /** Permissions the member, the bot, or both must have, checked when the command runs. */
      permissions?: CommandPermissions;
      /** How long a user, channel or server must wait between uses. */
      cooldown?: CommandCooldown;
    }

    /** Settings for a button, select menu, or modal handler. */
    interface ComponentConfig {
      /**
       * The custom ID to handle, 1 to 100 characters. It matches a component
       * whose custom ID is exactly this value, or starts with this value
       * followed by `:`. Anything after that colon is split on `:` and passed
       * to the handler as `params`.
       */
      customId: string;
      /** Checks that run before the handler, in order. */
      filters?: CommandFilter[];
      /** Permissions the member, the bot, or both must have, checked when the component is used. */
      permissions?: CommandPermissions;
      /** How long a user, channel or server must wait between uses. */
      cooldown?: CommandCooldown;
    }

    /**
     * Handles a button click, select menu choice, or modal submission.
     * `params` holds the custom ID segments after the registered ID; for
     * `"poll:vote"` receiving `"poll:vote:12:yes"` it is `["12", "yes"]`.
     */
    type ComponentHandler = (
      interaction: Interaction,
      params: string[],
    ) => Promise<unknown>;

    /** A slash command group. */
    interface GroupConfig {
      /** Group name: 1 to 32 lowercase characters without spaces. */
      name: string;
      /** Shown in Discord's command list, up to 100 characters. */
      description: string;
      /** Translations of `name`, keyed by locale. */
      nameLocalizations?: LocaleMap;
      /** Translations of `description`, keyed by locale. */
      descriptionLocalizations?: LocaleMap;
      /**
       * Hides the group and all its subcommands from members without these
       * permissions, for example `discord.PermissionFlags.MANAGE_THREADS`. Server
       * admins can still change who sees it under Server Settings > Integrations.
       * Top-level groups only.
       */
      defaultMemberPermissions?: PermissionFlag | null;
      /** Marks the group as age-restricted. Top-level groups only. */
      nsfw?: boolean;
      /** Checks that run before every subcommand's handler, in order. */
      filters?: CommandFilter[];
      /** Permissions checked before every subcommand in the group. */
      permissions?: CommandPermissions;
    }

    /**
     * A slash command with subcommands, such as `/settings view`. Groups can be
     * nested once, matching Discord's single subcommand-group level. Filters
     * and permissions set on a group apply to every subcommand in it.
     */
    interface Group {
      /** Registers a slash command, or a subcommand in a group. */
      slash<TSchema extends OptionMap = Record<never, never>>(
        config: SlashConfig<TSchema>,
        handler: (
          interaction: Interaction,
          args: InferOptions<TSchema>,
        ) => Promise<unknown>,
      ): { name: string; description: string };
      /** Registers a group of subcommands. */
      group(config: GroupConfig): Group;
    }

    /**
     * A script's commands, from {@link commands.create}. Slash and context menu
     * commands are sent to Discord when the script is published.
     */
    interface CommandApplication extends Group {
      /** Registers a prefix command. */
      prefix<TSchema extends ArgumentMap = Record<never, never>>(
        config: PrefixConfig<TSchema>,
        handler: (
          message: GuildMemberMessage,
          args: InferArguments<TSchema>,
        ) => Promise<unknown>,
      ): { name: string };
      /** Registers context menu commands, shown when right-clicking a user or a message. */
      readonly menu: {
        user(
          name: string,
          handler: (
            interaction: Interaction,
            target: User | GuildMember | null,
          ) => Promise<unknown>,
        ): void;
        user(
          config: {
            name: string;
            nameLocalizations?: LocaleMap;
            defaultMemberPermissions?: PermissionFlag | null;
            nsfw?: boolean;
            filters?: CommandFilter[];
            permissions?: CommandPermissions;
            cooldown?: CommandCooldown;
          },
          handler: (
            interaction: Interaction,
            target: User | GuildMember | null,
          ) => Promise<unknown>,
        ): void;
        message(
          name: string,
          handler: (
            interaction: Interaction,
            target: Message | null,
          ) => Promise<unknown>,
        ): void;
        message(
          config: {
            name: string;
            nameLocalizations?: LocaleMap;
            defaultMemberPermissions?: PermissionFlag | null;
            nsfw?: boolean;
            filters?: CommandFilter[];
            permissions?: CommandPermissions;
            cooldown?: CommandCooldown;
          },
          handler: (
            interaction: Interaction,
            target: Message | null,
          ) => Promise<unknown>,
        ): void;
      };
      /**
       * Handles clicks on buttons with a matching custom ID. Link and premium
       * buttons have no custom ID and never reach a handler.
       *
       * Filters, permissions, and cooldowns work as they do for commands. Their
       * failure messages are sent as ephemeral replies, so only the person who
       * clicked sees them.
       *
       * @example
       * ```ts
       * commands.button("ticket:close", async (interaction, [ticketId]) => {
       *   await closeTicket(ticketId);
       *   await interaction.update({ content: "Ticket closed.", components: [] });
       * });
       * ```
       */
      button(customId: string, handler: ComponentHandler): void;
      button(config: ComponentConfig, handler: ComponentHandler): void;

      /**
       * Handles string, user, role, mentionable, and channel select menus with a
       * matching custom ID. The chosen values are in `interaction.values`.
       */
      select(customId: string, handler: ComponentHandler): void;
      select(config: ComponentConfig, handler: ComponentHandler): void;

      /**
       * Handles submissions of modals with a matching custom ID. Read the fields
       * with `interaction.getTextInput()` and the other modal getters.
       */
      modal(customId: string, handler: ComponentHandler): void;
      modal(config: ComponentConfig, handler: ComponentHandler): void;

      /** Returns the registered commands, for a help command. */
      list(): Array<{
        kind: "slash" | "prefix" | "menu";
        name: string;
        path: string[];
        description?: string;
        aliases: string[];
      }>;
    }

    /**
     * Creates the script's command application.
     *
     * @param options.prefixes Prefixes for prefix commands. Defaults to `["!"]`.
     * @param options.mentionPrefix Whether mentioning the bot works as a prefix too.
     * @param options.filters Filters that run before every command's own.
     * @param options.permissions Permissions checked before every command's own.
     * @param options.onError Called when a handler, filter or autocomplete throws.
     * @param options.onInputError Called when a prefix command's arguments are wrong.
     */
    function create(options?: {
      prefixes?: string[];
      mentionPrefix?: boolean;
      filters?: CommandFilter[];
      permissions?: CommandPermissions;
      onError?: CommandErrorHandler;
      onInputError?: CommandInputErrorHandler;
    }): CommandApplication;
  }

  /**
   * A slash command option, from {@link commands.OptionBuilder}. Its key in
   * `options` is the name the handler gets it by.
   */
  class CommandOption<
    TValue,
    TOptional extends boolean = false,
    TKind extends string = string,
  > {
    /** The type of option. */
    readonly kind: TKind;
    /** Makes the option optional. The handler gets `null` when it's left out. */
    optional(): CommandOption<TValue, true, TKind>;
    /**
     * Sets the name users see in Discord. Defaults to the key in kebab case:
     * `userId` becomes `user-id`. Up to 32 lowercase letters, digits, `-` and `_`.
     */
    discordName(name: string): CommandOption<TValue, TOptional, TKind>;
    /** Sets the shortest text allowed, from 0 to 6000 characters. */
    minLength(
      this: CommandOption<TValue, TOptional, "string">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    /** Sets the longest text allowed, from 1 to 6000 characters. */
    maxLength(
      this: CommandOption<TValue, TOptional, "string">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    /** Sets the smallest number allowed. */
    minValue(
      this: CommandOption<TValue, TOptional, "integer" | "number">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    /** Sets the largest number allowed. */
    maxValue(
      this: CommandOption<TValue, TOptional, "integer" | "number">,
      value: number,
    ): CommandOption<TValue, TOptional, TKind>;
    /**
     * Sets which types of channel can be picked.
     *
     * ```ts
     * channel: option.channel("Where to post").channelTypes([
     *   discord.ChannelType.GUILD_TEXT,
     *   discord.ChannelType.GUILD_ANNOUNCEMENT,
     * ]),
     * ```
     */
    channelTypes(
      this: CommandOption<TValue, TOptional, "channel">,
      types: ChannelType[],
    ): CommandOption<TValue, TOptional, TKind>;
    /**
     * Limits the option to up to 25 values. Pass a value, or `{ name, value }`
     * to show a different label. Can't be combined with autocomplete.
     */
    choices(
      this: CommandOption<TValue, TOptional, "string" | "integer" | "number">,
      ...choices: Array<TValue | OptionChoice<Extract<TValue, string | number>>>
    ): CommandOption<TValue, TOptional, TKind>;
    /** Sets translations of the option's name and description, keyed by locale. */
    localizations(values: {
      name?: LocaleMap;
      description?: LocaleMap;
    }): CommandOption<TValue, TOptional, TKind>;
    /**
     * Suggests values as the user types. The provider gets what they typed as
     * `value` and returns up to 25 suggestions. Discord waits 3 seconds at most,
     * so avoid slow requests. Can't be combined with choices.
     */
    autocomplete(
      this: CommandOption<TValue, TOptional, "string" | "integer" | "number">,
      provider: TValue extends string | number
        ? (context: {
            interaction: Interaction;
            value: TValue;
          }) =>
            | Array<TValue | AutocompleteChoice<TValue>>
            | Promise<Array<TValue | AutocompleteChoice<TValue>>>
        : never,
    ): CommandOption<TValue, TOptional, TKind>;
  }

  /** A prefix command argument, from {@link commands.ArgumentBuilder}. */
  class CommandArgument<TValue, TOptional extends boolean = false> {
    /** Makes the argument optional. The handler gets `defaultValue`, or `null`, when it's left out. */
    optional(defaultValue?: TValue | null): CommandArgument<TValue, true>;
  }

  /** Reads a custom argument. Return the value, or call `context.fail()` to reject the input. */
  type CustomArgumentParser<TValue> = (
    input: string,
    context: CustomArgumentContext,
  ) => TValue | Promise<TValue>;

  /** What a custom argument parser gets besides the input. */
  interface CustomArgumentContext {
    /** The message that invoked the command. */
    readonly message: GuildMemberMessage;
    /** The command being run. */
    readonly commandName: string;
    /** The name of the argument being parsed. */
    readonly argument: string;
    /**
     * Rejects the input. The command stops and `onInputError` receives a
     * `CommandInputError` with code `"custom"` and this message.
     */
    fail(message: string): never;
  }

  /** Permissions a command needs, checked before its arguments are read. */
  interface CommandPermissions {
    /** Permissions the invoking member needs in the channel. */
    user?: CommandPermissionRequirement;
    /** Permissions the bot needs in the channel. */
    bot?: CommandPermissionRequirement;
  }

  /**
   * Permissions a user or the bot must hold. An array requires every flag.
   * The object form requires every flag in `allOf` and at least one flag in
   * `anyOf`. Administrator passes every check. When a check fails, Weeble
   * replies with the missing permission names.
   */
  type CommandPermissionRequirement =
    | readonly PermissionFlag[]
    | {
        allOf?: readonly PermissionFlag[];
        anyOf?: readonly PermissionFlag[];
      };

  /**
   * How long to wait between uses, up to 24 hours. A number is milliseconds
   * per user. Weeble tells users how long is left.
   */
  type CommandCooldown =
    | number
    | {
        durationMs: number;
        scope: CommandCooldownScope;
      };

  /** Who shares a cooldown: each user, everyone in a channel, or the whole server. */
  type CommandCooldownScope = "user" | "channel" | "guild";

  /** A check that runs before a command's permissions and arguments. See {@link filters} for common ones. */
  interface CommandFilter {
    /**
     * Decides whether the command runs. `context.kind` says what kind of
     * command or component it is.
     *
     * @returns `true` or nothing to continue, `false` to stop without a reply,
     * or a string to stop and reply with it.
     */
    check(
      context:
        | {
            kind: "slash";
            commandName: string;
            commandPath: readonly string[];
            interaction: Interaction;
            reply(body: string | Record<string, unknown>): Promise<unknown>;
          }
        | {
            kind: "prefix";
            commandName: string;
            commandPath: readonly string[];
            message: GuildMemberMessage;
            reply(body: string | Record<string, unknown>): Promise<unknown>;
          }
        | {
            kind: "menu";
            commandName: string;
            commandPath: readonly string[];
            interaction: Interaction;
            reply(body: string | Record<string, unknown>): Promise<unknown>;
          }
        | {
            /** A button, select menu, or modal handler. `commandName` is its registered custom ID. */
            kind: "component";
            commandName: string;
            commandPath: readonly string[];
            interaction: Interaction;
            reply(body: string | Record<string, unknown>): Promise<unknown>;
          },
    ): boolean | string | void | Promise<boolean | string | void>;
  }

  /**
   * Common command filters. They run in order, and the first that fails stops
   * the command.
   *
   * ```ts
   * filters: [discord.filters.or(discord.filters.hasRole(modRoleId), discord.filters.allowUsers(ownerId))],
   * ```
   */
  const filters: {
    /** Creates a filter from a check function. */
    readonly custom: (check: CommandFilter["check"]) => CommandFilter;
    /** Rejects use outside a server, replying with `message` or a default. */
    readonly guildOnly: (message?: string) => CommandFilter;
    /** Requires the member to have this role. */
    readonly hasRole: (roleId: Snowflake) => CommandFilter;
    /** Requires the member to have at least one of these roles. */
    readonly hasAnyRole: (...roleIds: Snowflake[]) => CommandFilter;
    /** Requires the member to have every one of these roles. */
    readonly hasAllRoles: (...roleIds: Snowflake[]) => CommandFilter;
    /** Allows only these user IDs. */
    readonly allowUsers: (...userIds: Snowflake[]) => CommandFilter;
    /** Passes when every filter passes; replies with the first failure. */
    readonly and: (...items: CommandFilter[]) => CommandFilter;
    /** Passes when any filter passes; replies with the last failure. */
    readonly or: (...items: CommandFilter[]) => CommandFilter;
    /** Inverts a filter. A failure caused by `not` is silent. */
    readonly not: (item: CommandFilter) => CommandFilter;
    /** Replaces a filter's failure reply with `message`. */
    readonly withMessage: (
      item: CommandFilter,
      message: string,
    ) => CommandFilter;
    /** Stops the command without replying when the filter fails. */
    readonly silent: (item: CommandFilter) => CommandFilter;
  };

  /** Wrong arguments to a prefix command, passed to `onInputError`. */
  class CommandInputError extends Error {
    /** What was wrong. */
    readonly code: CommandInputErrorCode;
    /** Name of the command. */
    readonly commandName: string;
    /** Key of the argument that was wrong, or `"input"` when the whole input couldn't be read. */
    readonly argument: string;
    /** The raw text that was rejected, when there was any. */
    readonly received?: string;
    /** How to use the command, such as `!ban <member> [reason]`. */
    readonly usage?: string;
  }

  /**
   * Why a prefix command's input was rejected:
   *
   * - `required`: a required argument is missing.
   * - `invalid_syntax`: the input could not be split into arguments, for example an unclosed quote.
   * - `unexpected_argument`: extra words were left after the last argument.
   * - `invalid_integer`, `invalid_number`, `invalid_duration`: the value has the wrong format.
   * - `invalid_reference`: a user, member, channel, or role argument is not a mention or ID.
   * - `not_found`: the mentioned user, member, channel, or role does not exist.
   * - `custom`: a custom parser called `context.fail()`.
   */
  type CommandInputErrorCode =
    | "required"
    | "invalid_syntax"
    | "unexpected_argument"
    | "invalid_integer"
    | "invalid_number"
    | "invalid_duration"
    | "invalid_reference"
    | "not_found"
    | "custom";

  /** Called when a handler, filter or autocomplete provider throws. */
  type CommandErrorHandler = (
    error: unknown,
    context: Parameters<CommandFilter["check"]>[0],
  ) => void | Promise<void>;

  /** Called when a prefix command's arguments are wrong. Reply to explain the usage. */
  type CommandInputErrorHandler = (
    error: CommandInputError,
    context: Parameters<CommandFilter["check"]>[0],
  ) => void | Promise<void>;

  //#endregion

  //#region Components

  /**
   * Builds message components and modal fields. Put buttons and menus in
   * action rows; show modals with {@link Interaction.showModal}.
   *
   * ```ts
   * await interaction.reply({
   *   content: 'Choose an action.',
   *   components: [
   *     discord.components.actionRow(
   *       discord.components.button({
   *         customId: 'confirm',
   *         label: 'Confirm',
   *         style: discord.ButtonStyle.SUCCESS,
   *       }),
   *     ),
   *   ],
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/components/reference
   * @see https://docs.discord.com/developers/platform/components
   */
  namespace components {
    /** Creates an action row: up to 5 buttons, or one select menu. A message can have 5 rows. */
    function actionRow(...components: Component[]): ActionRowComponent;

    /** Creates a button. */
    function button(options: ButtonOptions): ButtonComponent;

    /** Creates a button that opens a link. */
    function linkButton(
      label: string,
      url: string,
      emoji?: EmojiData,
    ): ButtonComponent;

    /** Creates a select menu of your own options. */
    function stringSelect(options: StringSelectOptions): StringSelectComponent;

    /** Creates an option for {@link components.stringSelect}. */
    function selectOption(options: SelectOption): SelectOption;

    /** Creates a select menu of the guild's members. */
    function userSelect(options: SelectOptions): Component;

    /** Creates a select menu of the guild's roles. */
    function roleSelect(options: SelectOptions): Component;

    /** Creates a select menu of the guild's members and roles. */
    function mentionableSelect(options: SelectOptions): Component;

    /** Creates a select menu of the guild's channels. */
    function channelSelect(options: ChannelSelectOptions): Component;

    /** Creates a modal, to show with {@link Interaction.showModal}. */
    function modal(options: {
      components: Component[];
      customId: string;
      title: string;
    }): ModalComponent;

    /** Creates a text field for a modal. */
    function textInput(options: TextInputOptions): TextInputComponent;

    /** Puts a label, and optionally a description, above a modal field. */
    function label(
      label: string,
      component: Component,
      description?: string,
    ): Component;

    /** Creates a checkbox for a modal. */
    function checkbox(options: CheckboxOptions): Component;

    /** Creates a group of checkboxes for a modal. */
    function checkboxGroup(options: CheckboxGroupOptions): Component;

    /** Creates a group of radio buttons for a modal, of which one can be picked. */
    function radioGroup(options: RadioGroupOptions): Component;

    /** Creates a file upload field for a modal. */
    function fileUpload(options: {
      customId: string;
      label?: string;
      required?: boolean;
    }): Component;

    /**
     * Creates a block of Markdown text. Needs the `IS_COMPONENTS_V2` message flag,
     * as do the other layout components below.
     */
    function textDisplay(content: string): TextDisplayComponent;

    /** Creates text with a thumbnail or button beside it. */
    function section(options: {
      accessory?: Component;
      component: Component;
      description?: string;
      label: string;
    }): Component;

    /** Creates a small image, for beside a section's text. */
    function thumbnail(options: {
      height?: number;
      url: string;
      width?: number;
    }): Component;

    /** Creates a gallery of up to 10 images or videos. */
    function mediaGallery(
      items: Array<{
        height?: number;
        url: string;
        width?: number;
      }>,
    ): Component;

    /** Shows an attached file. `url` is `attachment://<filename>`. */
    function file(options: { spoiler?: boolean; url: string }): Component;

    /**
     * Creates space between components.
     *
     * @param options.divider Whether to draw a line. Defaults to `true`.
     * @param options.spacing `1` for a small gap, `2` for a large one.
     */
    function separator(options?: {
      divider?: boolean;
      spacing?: number;
    }): Component;

    /** Groups components in a box, like an embed. */
    function container(...components: Component[]): Component;
  }

  /** A component in a message or modal. */
  type Component =
    | ActionRowComponent
    | ButtonComponent
    | StringSelectComponent
    | TextInputComponent
    | TextDisplayComponent
    | GenericComponent;

  /** A component as Discord's JSON. The {@link components} builders make these. */
  interface GenericComponent {
    /** The type of component. */
    type: number;
    [key: string]: unknown;
  }

  /** An action row, from {@link components.actionRow}. */
  interface ActionRowComponent {
    type: typeof ComponentType.ACTION_ROW;
    /** The row's buttons or select menu. */
    components: Component[];
  }

  /** A button, from {@link components.button}. */
  interface ButtonComponent {
    type: typeof ComponentType.BUTTON;
    /** A {@link ButtonStyle}. Link buttons have `url`, the others `custom_id`. */
    style: number;
    /** Text on the button, up to 80 characters. */
    label?: string;
    /** Emoji shown before the label. */
    emoji?: EmojiData;
    /** ID sent back when the button is clicked. Required unless the button is a link. */
    custom_id?: string;
    /** Where a link button goes. */
    url?: string;
    /** Whether the button is greyed out. */
    disabled?: boolean;
  }

  /** A string select menu, from {@link components.stringSelect}. */
  interface StringSelectComponent {
    type: typeof ComponentType.STRING_SELECT;
    /** ID sent back when the user chooses. */
    custom_id: string;
    /** The choices, up to 25. */
    options: SelectOption[];
    /** Text shown while nothing is chosen, up to 150 characters. */
    placeholder?: string;
    /** Fewest choices the user must pick, from 0 to 25. Defaults to 1. */
    min_values?: number;
    /** Most choices the user may pick, up to 25. Defaults to 1. */
    max_values?: number;
    /** Whether the menu is greyed out. */
    disabled?: boolean;
  }

  /** A modal text field, from {@link components.textInput}. */
  interface TextInputComponent {
    type: typeof ComponentType.TEXT_INPUT;
    /** ID the submitted value is reported under. */
    custom_id: string;
    /** Label above the field, up to 45 characters. */
    label: string;
    /** `1` for a single line, `2` for a paragraph. */
    style: number;
    /** Whether the field must be filled in. */
    required: boolean;
    /** Fewest characters accepted, from 0 to 4000. */
    min_length?: number;
    /** Most characters accepted, from 1 to 4000. */
    max_length?: number;
    /** Text the field starts with. */
    value?: string;
    /** Text shown while the field is empty, up to 100 characters. */
    placeholder?: string;
  }

  /** A block of text, from {@link components.textDisplay}. */
  interface TextDisplayComponent {
    type: typeof ComponentType.TEXT_DISPLAY;
    /** The text, in Markdown. */
    content: string;
  }

  /** A modal, from {@link components.modal}. */
  interface ModalComponent {
    /** ID sent back when the modal is submitted. */
    custom_id: string;
    /** Title of the modal, up to 45 characters. */
    title: string;
    /** The modal's fields, up to 5. */
    components: Component[];
  }

  /** A button for {@link components.button}: a link button or one with a custom ID. */
  type ButtonOptions = LinkButtonOptions | CustomButtonOptions;

  /** A button that opens a link. */
  type LinkButtonOptions = {
    /** Whether the button is greyed out. */
    disabled?: boolean;
    /** Emoji shown before the label. */
    emoji?: EmojiData;
    /** Text on the button, up to 80 characters. */
    label?: string;
    style: typeof ButtonStyle.LINK;
    /** The link. */
    url: string;
  };

  /** A button the bot handles. */
  type CustomButtonOptions = {
    /** ID sent back when the button is clicked, up to 100 characters. */
    customId: string;
    /** Whether the button is greyed out. */
    disabled?: boolean;
    /** Emoji shown before the label. */
    emoji?: EmojiData;
    /** Text on the button, up to 80 characters. */
    label?: string;
    /** The button's color. Defaults to `PRIMARY`. */
    style?: Exclude<ButtonStyle, typeof ButtonStyle.LINK>;
  };

  /** A select menu. */
  interface SelectOptions {
    /** ID sent back when the user chooses, up to 100 characters. */
    customId: string;

    /** Whether the menu is greyed out. */
    disabled?: boolean;

    /** Most choices the user may pick, up to 25. Defaults to 1. */
    maxValues?: number;

    /** Fewest choices the user must pick, from 0 to 25. Defaults to 1. */
    minValues?: number;

    /** Text shown while nothing is chosen, up to 150 characters. */
    placeholder?: string;
  }

  /** A choice in a string select menu. */
  interface SelectOption {
    /** Whether the choice starts selected. */
    default?: boolean;

    /** Text under the label, up to 100 characters. */
    description?: string;

    /** Emoji shown before the label. */
    emoji?: EmojiData;

    /** Text of the choice, up to 100 characters. */
    label: string;

    /** What the bot gets in {@link Interaction.values} when the choice is picked. */
    value: string;
  }

  /** A string select menu. */
  interface StringSelectOptions extends SelectOptions {
    /** The choices, up to 25. */
    options: SelectOption[];
  }

  /** A channel select menu. */
  interface ChannelSelectOptions extends SelectOptions {
    /** Which types of channel can be picked. */
    channelTypes?: ChannelType[];
  }

  /** A modal text field. */
  interface TextInputOptions {
    /** ID the submitted text is reported under. */
    customId: string;

    /** Label above the field, up to 45 characters. */
    label: string;

    /** Most characters accepted, from 1 to 4000. */
    maxLength?: number;

    /** Fewest characters accepted, from 0 to 4000. */
    minLength?: number;

    /** Text shown while the field is empty, up to 100 characters. */
    placeholder?: string;

    /** Whether the field must be filled in. Defaults to `true`. */
    required?: boolean;

    /** One line or a paragraph. Defaults to one line. */
    style?: TextInputStyle;

    /** Text the field starts with. */
    value?: string;
  }

  /** A group of radio buttons in a modal. */
  interface RadioGroupOptions {
    /** ID the picked value is reported under. */
    customId: string;

    /** Text under the label. */
    description?: string;

    /** Label above the group. */
    label?: string;

    /** The radio buttons. */
    options: Array<{
      /** @deprecated Use `default`. */
      checked?: boolean;
      customId?: string;
      /** Whether the button starts picked. */
      default?: boolean;
      /** Text under the button's label. */
      description?: string;
      /** Emoji shown before the label. */
      emoji?: EmojiData;
      /** Text of the button. */
      label: string;
      /** What {@link Interaction.getRadioValue} returns when the button is picked. */
      value?: string;
    }>;

    /** Whether a button must be picked. */
    required?: boolean;
  }

  /** A group of checkboxes in a modal. */
  interface CheckboxGroupOptions {
    /** ID the checked values are reported under. */
    customId: string;

    /** Text under the label. */
    description?: string;

    /** Label above the group. */
    label?: string;

    /** The most boxes that can be checked. */
    maxValues?: number;

    /** The fewest boxes that must be checked. */
    minValues?: number;

    /** The checkboxes. */
    options: CheckboxOptions[];

    /** Whether a box must be checked. */
    required?: boolean;
  }

  /** A checkbox in a modal, on its own or in a group. */
  interface CheckboxOptions {
    /** @deprecated Use `default`. */
    checked?: boolean;

    /** ID of a checkbox on its own, for {@link Interaction.getCheckbox}. */
    customId?: string;

    /** Whether the box starts checked. */
    default?: boolean;

    /** Text under the label. */
    description?: string;

    /** Emoji shown before the label. */
    emoji?: EmojiData;

    /** Text beside the box. Required in a group. */
    label?: string;

    /** Whether the box must be checked. */
    required?: boolean;

    /** Value of a box in a group, for {@link Interaction.getCheckboxValues}. */
    value?: string;
  }

  //#endregion

  //#region Events

  /**
   * Names of the events to pass to {@link on}. Some events need an intent
   * turned on for the bot, which their description says.
   *
   * @see https://docs.discord.com/developers/events/gateway-events
   * @see https://docs.discord.com/developers/events/gateway#gateway-intents
   */
  namespace events {
    /** A channel was created. */
    const CHANNEL_CREATE: "CHANNEL_CREATE";
    /** A channel was changed. */
    const CHANNEL_UPDATE: "CHANNEL_UPDATE";
    /** A channel was deleted. */
    const CHANNEL_DELETE: "CHANNEL_DELETE";
    /** A message was pinned or unpinned. */
    const CHANNEL_PINS_UPDATE: "CHANNEL_PINS_UPDATE";
    /** A thread was created, or the bot was added to a private thread. */
    const THREAD_CREATE: "THREAD_CREATE";
    /** A thread was changed. */
    const THREAD_UPDATE: "THREAD_UPDATE";
    /** A thread was deleted. */
    const THREAD_DELETE: "THREAD_DELETE";
    /** The bot gained access to a channel and got its active threads. */
    const THREAD_LIST_SYNC: "THREAD_LIST_SYNC";
    /** The bot's membership of a thread changed. */
    const THREAD_MEMBER_UPDATE: "THREAD_MEMBER_UPDATE";
    /** Members joined or left a thread. */
    const THREAD_MEMBERS_UPDATE: "THREAD_MEMBERS_UPDATE";
    /** A command's permissions were changed in the guild's settings. */
    const APPLICATION_COMMAND_PERMISSIONS_UPDATE: "APPLICATION_COMMAND_PERMISSIONS_UPDATE";
    /** A user bought something from the bot. */
    const ENTITLEMENT_CREATE: "ENTITLEMENT_CREATE";
    /** A purchase was renewed or changed. */
    const ENTITLEMENT_UPDATE: "ENTITLEMENT_UPDATE";
    /** A purchase was refunded or removed. */
    const ENTITLEMENT_DELETE: "ENTITLEMENT_DELETE";
    /** The guild became available to the bot, such as after an outage. */
    const GUILD_CREATE: "GUILD_CREATE";
    /** The guild was changed. */
    const GUILD_UPDATE: "GUILD_UPDATE";
    /** The guild became unavailable, or the bot was removed. */
    const GUILD_DELETE: "GUILD_DELETE";
    /** A user was banned. */
    const GUILD_BAN_ADD: "GUILD_BAN_ADD";
    /** A user was unbanned. */
    const GUILD_BAN_REMOVE: "GUILD_BAN_REMOVE";
    /** The guild's emojis changed. */
    const GUILD_EMOJIS_UPDATE: "GUILD_EMOJIS_UPDATE";
    /** The guild's stickers changed. */
    const GUILD_STICKERS_UPDATE: "GUILD_STICKERS_UPDATE";
    /** The guild's integrations changed. */
    const GUILD_INTEGRATIONS_UPDATE: "GUILD_INTEGRATIONS_UPDATE";
    /** A member joined. Needs the Server Members intent. */
    const GUILD_MEMBER_ADD: "GUILD_MEMBER_ADD";
    /** A member was changed, such as their roles or nickname. Needs the Server Members intent. */
    const GUILD_MEMBER_UPDATE: "GUILD_MEMBER_UPDATE";
    /** A member left, or was kicked or banned. Needs the Server Members intent. */
    const GUILD_MEMBER_REMOVE: "GUILD_MEMBER_REMOVE";
    /** Members Weeble requested arrived. */
    const GUILD_MEMBERS_CHUNK: "GUILD_MEMBERS_CHUNK";
    /** A role was created. */
    const GUILD_ROLE_CREATE: "GUILD_ROLE_CREATE";
    /** A role was changed. */
    const GUILD_ROLE_UPDATE: "GUILD_ROLE_UPDATE";
    /** A role was deleted. */
    const GUILD_ROLE_DELETE: "GUILD_ROLE_DELETE";
    /** A scheduled event was created. */
    const GUILD_SCHEDULED_EVENT_CREATE: "GUILD_SCHEDULED_EVENT_CREATE";
    /** A scheduled event was changed, started or ended. */
    const GUILD_SCHEDULED_EVENT_UPDATE: "GUILD_SCHEDULED_EVENT_UPDATE";
    /** A scheduled event was deleted. */
    const GUILD_SCHEDULED_EVENT_DELETE: "GUILD_SCHEDULED_EVENT_DELETE";
    /** A user became interested in a scheduled event. */
    const GUILD_SCHEDULED_EVENT_USER_ADD: "GUILD_SCHEDULED_EVENT_USER_ADD";
    /** A user stopped being interested in a scheduled event. */
    const GUILD_SCHEDULED_EVENT_USER_REMOVE: "GUILD_SCHEDULED_EVENT_USER_REMOVE";
    /** A soundboard sound was added. */
    const GUILD_SOUNDBOARD_SOUND_CREATE: "GUILD_SOUNDBOARD_SOUND_CREATE";
    /** A soundboard sound was changed. */
    const GUILD_SOUNDBOARD_SOUND_UPDATE: "GUILD_SOUNDBOARD_SOUND_UPDATE";
    /** A soundboard sound was deleted. */
    const GUILD_SOUNDBOARD_SOUND_DELETE: "GUILD_SOUNDBOARD_SOUND_DELETE";
    /** Several soundboard sounds changed at once. */
    const GUILD_SOUNDBOARD_SOUNDS_UPDATE: "GUILD_SOUNDBOARD_SOUNDS_UPDATE";
    /** An integration was added. */
    const INTEGRATION_CREATE: "INTEGRATION_CREATE";
    /** An integration was changed. */
    const INTEGRATION_UPDATE: "INTEGRATION_UPDATE";
    /** An integration was removed. */
    const INTEGRATION_DELETE: "INTEGRATION_DELETE";
    /** An invite was created. */
    const INVITE_CREATE: "INVITE_CREATE";
    /** An invite was deleted or ran out. */
    const INVITE_DELETE: "INVITE_DELETE";
    /** A message was sent. */
    const MESSAGE_CREATE: "MESSAGE_CREATE";
    /** A message was edited. */
    const MESSAGE_UPDATE: "MESSAGE_UPDATE";
    /** A message was deleted. */
    const MESSAGE_DELETE: "MESSAGE_DELETE";
    /** Several messages were deleted at once. */
    const MESSAGE_DELETE_BULK: "MESSAGE_DELETE_BULK";
    /** Someone reacted to a message. */
    const MESSAGE_REACTION_ADD: "MESSAGE_REACTION_ADD";
    /** Someone removed a reaction. */
    const MESSAGE_REACTION_REMOVE: "MESSAGE_REACTION_REMOVE";
    /** Every reaction was removed from a message. */
    const MESSAGE_REACTION_REMOVE_ALL: "MESSAGE_REACTION_REMOVE_ALL";
    /** Every reaction with one emoji was removed from a message. */
    const MESSAGE_REACTION_REMOVE_EMOJI: "MESSAGE_REACTION_REMOVE_EMOJI";
    /** Someone voted in a poll. */
    const MESSAGE_POLL_VOTE_ADD: "MESSAGE_POLL_VOTE_ADD";
    /** Someone removed their vote from a poll. */
    const MESSAGE_POLL_VOTE_REMOVE: "MESSAGE_POLL_VOTE_REMOVE";
    /** Someone used a command, button, menu or modal. */
    const INTERACTION_CREATE: "INTERACTION_CREATE";
    /** A member's status or activity changed. Needs the Presence intent. */
    const PRESENCE_UPDATE: "PRESENCE_UPDATE";
    /** A stage started. */
    const STAGE_INSTANCE_CREATE: "STAGE_INSTANCE_CREATE";
    /** A stage was changed. */
    const STAGE_INSTANCE_UPDATE: "STAGE_INSTANCE_UPDATE";
    /** A stage ended. */
    const STAGE_INSTANCE_DELETE: "STAGE_INSTANCE_DELETE";
    /** A user subscribed to the bot. */
    const SUBSCRIPTION_CREATE: "SUBSCRIPTION_CREATE";
    /** A subscription was renewed or changed. */
    const SUBSCRIPTION_UPDATE: "SUBSCRIPTION_UPDATE";
    /** A subscription ended. */
    const SUBSCRIPTION_DELETE: "SUBSCRIPTION_DELETE";
    /** Someone started typing. */
    const TYPING_START: "TYPING_START";
    /** The bot's user was changed. */
    const USER_UPDATE: "USER_UPDATE";
    /** Someone joined, left or moved voice channels, or muted or deafened. */
    const VOICE_STATE_UPDATE: "VOICE_STATE_UPDATE";
    /** The bot's voice server changed. */
    const VOICE_SERVER_UPDATE: "VOICE_SERVER_UPDATE";
    /** A voice channel's status was set or cleared. */
    const VOICE_CHANNEL_STATUS_UPDATE: "VOICE_CHANNEL_STATUS_UPDATE";
    /** A voice channel became active or empty. */
    const VOICE_CHANNEL_START_TIME_UPDATE: "VOICE_CHANNEL_START_TIME_UPDATE";
    /** Someone sent an emoji reaction or soundboard sound in voice. */
    const VOICE_CHANNEL_EFFECT_SEND: "VOICE_CHANNEL_EFFECT_SEND";
    /** A channel's webhooks changed. */
    const WEBHOOKS_UPDATE: "WEBHOOKS_UPDATE";
    /** An auto moderation rule was created. */
    const AUTO_MODERATION_RULE_CREATE: "AUTO_MODERATION_RULE_CREATE";
    /** An auto moderation rule was changed. */
    const AUTO_MODERATION_RULE_UPDATE: "AUTO_MODERATION_RULE_UPDATE";
    /** An auto moderation rule was deleted. */
    const AUTO_MODERATION_RULE_DELETE: "AUTO_MODERATION_RULE_DELETE";
    /** An auto moderation rule acted on a message. */
    const AUTO_MODERATION_ACTION_EXECUTION: "AUTO_MODERATION_ACTION_EXECUTION";
    /** Something was added to the audit log. Needs View Audit Log. */
    const AUDIT_LOG_ENTRY_CREATE: "AUDIT_LOG_ENTRY_CREATE";
    /** Discord's name for {@link events.AUDIT_LOG_ENTRY_CREATE}. */
    const GUILD_AUDIT_LOG_ENTRY_CREATE: "GUILD_AUDIT_LOG_ENTRY_CREATE";
  }

  /**
   * Runs a handler whenever an event happens. Update events also pass the
   * object as it was before, when Weeble had it.
   *
   * Register handlers at the top level of the script. Handlers for an event
   * run one at a time, in the order they were registered. An error thrown by a
   * handler is shown in the script's logs.
   *
   * ```ts
   * discord.on(discord.events.GUILD_MEMBER_ADD, async (member) => {
   *   const channel = await discord.fetchGuildTextChannel('1504537312841961583');
   *   if (channel) await channel.send(`Welcome ${member.toMention()}`);
   * });
   * ```
   *
   * @see https://docs.discord.com/developers/events/gateway-events
   */
  function on(
    event: typeof events.CHANNEL_CREATE,
    handler: (channel: AnyGuildChannel) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.CHANNEL_UPDATE,
    handler: (
      channel: AnyGuildChannel,
      old: AnyGuildChannel | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.CHANNEL_DELETE,
    handler: (channel: AnyGuildChannel) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.CHANNEL_PINS_UPDATE,
    handler: (event: ChannelPinsUpdateEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.THREAD_CREATE,
    handler: (thread: ThreadChannel) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.THREAD_UPDATE,
    handler: (
      thread: ThreadChannel,
      old: ThreadChannel | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.THREAD_DELETE,
    handler: (thread: ThreadChannel) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.THREAD_LIST_SYNC,
    handler: (event: ThreadListSyncEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.THREAD_MEMBER_UPDATE,
    handler: (event: ThreadMemberUpdateEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.THREAD_MEMBERS_UPDATE,
    handler: (event: ThreadMembersUpdateEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.APPLICATION_COMMAND_PERMISSIONS_UPDATE,
    handler: (
      event: ApplicationCommandPermissionsUpdateEvent,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.ENTITLEMENT_CREATE,
    handler: (event: Entitlement) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.ENTITLEMENT_UPDATE,
    handler: (event: Entitlement) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.ENTITLEMENT_DELETE,
    handler: (event: Entitlement) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_CREATE,
    handler: (guild: Guild) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_UPDATE,
    handler: (guild: Guild, old: Guild | null) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_DELETE,
    handler: (guild: Guild) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_BAN_ADD,
    handler: (event: GuildBanEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_BAN_REMOVE,
    handler: (event: GuildBanEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_EMOJIS_UPDATE,
    handler: (
      event: GuildEmojisUpdateEvent,
      old: GuildEmojisUpdateEvent | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_STICKERS_UPDATE,
    handler: (
      event: GuildStickersUpdateEvent,
      old: GuildStickersUpdateEvent | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_INTEGRATIONS_UPDATE,
    handler: (event: GuildIdEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_MEMBER_ADD,
    handler: (member: GuildMember) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_MEMBER_UPDATE,
    handler: (member: GuildMember, old: GuildMember | null) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_MEMBER_REMOVE,
    handler: (
      event: GuildMemberRemoveEvent,
      member: GuildMember | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_MEMBERS_CHUNK,
    handler: (event: Record<string, unknown>) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_ROLE_CREATE,
    handler: (event: GuildRoleEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_ROLE_UPDATE,
    handler: (event: GuildRoleEvent, old: Role | null) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_ROLE_DELETE,
    handler: (
      event: GuildRoleDeleteEvent,
      old: Role | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_CREATE,
    handler: (event: ScheduledEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_UPDATE,
    handler: (
      event: ScheduledEvent,
      old: ScheduledEvent | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_DELETE,
    handler: (event: ScheduledEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_USER_ADD,
    handler: (event: GuildScheduledEventUserEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SCHEDULED_EVENT_USER_REMOVE,
    handler: (event: GuildScheduledEventUserEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUND_CREATE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUND_UPDATE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUND_DELETE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_SOUNDBOARD_SOUNDS_UPDATE,
    handler: (event: unknown) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.INTEGRATION_CREATE,
    handler: (event: Record<string, unknown>) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.INTEGRATION_UPDATE,
    handler: (event: Record<string, unknown>) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.INTEGRATION_DELETE,
    handler: (event: Record<string, unknown>) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.INVITE_CREATE,
    handler: (invite: Invite) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.INVITE_DELETE,
    handler: (event: InviteDeleteEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.MESSAGE_CREATE,
    handler: (message: Message | GuildMemberMessage) => Promise<unknown>,
  ): void;

  /**
   * A message was edited. Discord also sends this when a link preview loads;
   * only real edits have `message.editedAt` set.
   *
   * `old` is the message as it was before, or `null` when the bot never saw
   * it: Weeble keeps copies of a server's messages for 7 days, the newest
   * 200 per channel, from when a script in that server first handles edits
   * or deletes.
   */
  function on(
    event: typeof events.MESSAGE_UPDATE,
    handler: (
      message: Message | GuildMemberMessage,
      old: Message | null,
    ) => Promise<unknown>,
  ): void;

  /**
   * A message was deleted. Discord only sends its ID.
   *
   * `old` is the message as it was, or `null` when the bot never saw it, for
   * example because it was sent before the script started handling deletes.
   * See MESSAGE_UPDATE for how long copies are kept.
   */
  function on(
    event: typeof events.MESSAGE_DELETE,
    handler: (
      event: MessageDeleteEvent,
      old: Message | null,
    ) => Promise<unknown>,
  ): void;

  /**
   * Several messages were deleted at once, such as by a purge command.
   *
   * `old` holds a copy of each deleted message the bot saw, oldest first.
   * Messages it never saw are missing from it, so it can be shorter than
   * `event.ids`, or empty.
   *
   * @example
   * ```ts
   * discord.on(discord.events.MESSAGE_DELETE_BULK, async (event, old) => {
   *   const lines = old.map((message) => `${message.author?.username}: ${message.content}`);
   *   console.log(`${event.ids.length} deleted, ${old.length} saved:\n${lines.join("\n")}`);
   * });
   * ```
   */
  function on(
    event: typeof events.MESSAGE_DELETE_BULK,
    handler: (event: MessageDeleteBulkEvent, old: Message[]) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.MESSAGE_REACTION_ADD,
    handler: (event: MessageReactionEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.MESSAGE_REACTION_REMOVE,
    handler: (event: MessageReactionEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.MESSAGE_REACTION_REMOVE_ALL,
    handler: (event: MessageReactionRemoveAllEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.MESSAGE_REACTION_REMOVE_EMOJI,
    handler: (event: MessageReactionRemoveEmojiEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.MESSAGE_POLL_VOTE_ADD,
    handler: (event: MessagePollVoteEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.MESSAGE_POLL_VOTE_REMOVE,
    handler: (event: MessagePollVoteEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.INTERACTION_CREATE,
    handler: (interaction: Interaction) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.PRESENCE_UPDATE,
    handler: (event: PresenceUpdateEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.STAGE_INSTANCE_CREATE,
    handler: (event: StageInstance) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.STAGE_INSTANCE_UPDATE,
    handler: (event: StageInstance) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.STAGE_INSTANCE_DELETE,
    handler: (event: StageInstance) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.SUBSCRIPTION_CREATE,
    handler: (event: Subscription) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.SUBSCRIPTION_UPDATE,
    handler: (event: Subscription) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.SUBSCRIPTION_DELETE,
    handler: (event: Subscription) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.TYPING_START,
    handler: (event: TypingStartEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.USER_UPDATE,
    handler: (event: User) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.VOICE_STATE_UPDATE,
    handler: (event: VoiceState, old: VoiceState | null) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.VOICE_SERVER_UPDATE,
    handler: (event: VoiceServerUpdateEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.VOICE_CHANNEL_STATUS_UPDATE,
    handler: (event: VoiceChannelStatusUpdateEvent) => void | Promise<unknown>,
  ): void;

  function on(
    event: typeof events.VOICE_CHANNEL_START_TIME_UPDATE,
    handler: (
      event: VoiceChannelStartTimeUpdateEvent,
    ) => void | Promise<unknown>,
  ): void;

  function on(
    event: typeof events.VOICE_CHANNEL_EFFECT_SEND,
    handler: (event: VoiceChannelEffectSendEvent) => void | Promise<unknown>,
  ): void;

  function on(
    event: typeof events.WEBHOOKS_UPDATE,
    handler: (event: WebhooksUpdateEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.AUTO_MODERATION_RULE_CREATE,
    handler: (event: AutoModRuleEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.AUTO_MODERATION_RULE_UPDATE,
    handler: (
      event: AutoModRuleEvent,
      old: AutoModRuleEvent | null,
    ) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.AUTO_MODERATION_RULE_DELETE,
    handler: (event: AutoModRuleDeleteEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.AUTO_MODERATION_ACTION_EXECUTION,
    handler: (event: AutoModActionExecutionEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.AUDIT_LOG_ENTRY_CREATE,
    handler: (event: AuditLogEntryEvent) => Promise<unknown>,
  ): void;

  function on(
    event: typeof events.GUILD_AUDIT_LOG_ENTRY_CREATE,
    handler: (event: AuditLogEntryEvent) => Promise<unknown>,
  ): void;

  function on(
    event: string,
    handler: (payload: unknown) => void | Promise<void>,
  ): void;

  /** An event that only names its guild. */
  interface GuildIdEvent {
    /** ID of the guild. */
    guildId: Snowflake;
  }

  /** Data for {@link events.GUILD_BAN_ADD} and {@link events.GUILD_BAN_REMOVE}. */
  interface GuildBanEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** The user who was banned or unbanned. */
    user: User;
  }

  /** Data for {@link events.GUILD_MEMBER_REMOVE}. */
  interface GuildMemberRemoveEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** The user who left, or was kicked or banned. */
    user: User;
  }

  /** Data for {@link events.GUILD_ROLE_CREATE} and {@link events.GUILD_ROLE_UPDATE}. */
  interface GuildRoleEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** The role. */
    role: Role;
  }

  /** Data for {@link events.GUILD_ROLE_DELETE}. */
  interface GuildRoleDeleteEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** ID of the deleted role. */
    roleId: Snowflake;
  }

  /** Data for {@link events.GUILD_EMOJIS_UPDATE}. */
  interface GuildEmojisUpdateEvent {
    /** Every emoji the guild has now. */
    emojis: Emoji[];

    /** ID of the guild. */
    guildId: Snowflake;
  }

  /** Data for {@link events.GUILD_STICKERS_UPDATE}. */
  interface GuildStickersUpdateEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** Every sticker the guild has now. */
    stickers: Sticker[];
  }

  /** Data for {@link events.GUILD_SCHEDULED_EVENT_USER_ADD} and {@link events.GUILD_SCHEDULED_EVENT_USER_REMOVE}. */
  interface GuildScheduledEventUserEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** ID of the scheduled event. */
    guildScheduledEventId: Snowflake;

    /** ID of the user. */
    userId: Snowflake;
  }

  /** Data for {@link events.MESSAGE_DELETE}. */
  interface MessageDeleteEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** ID of the guild, or `null` outside a guild. */
    guildId: Snowflake | null;

    /** ID of the deleted message. */
    id: Snowflake;
  }

  /** Data for {@link events.MESSAGE_DELETE_BULK}. */
  interface MessageDeleteBulkEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** ID of the guild, or `null` outside a guild. */
    guildId: Snowflake | null;

    /** IDs of the deleted messages. */
    ids: Snowflake[];
  }

  /** Data for {@link events.MESSAGE_REACTION_ADD} and {@link events.MESSAGE_REACTION_REMOVE}. */
  interface MessageReactionEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** The reaction's emoji. */
    emoji: {
      animated: boolean;
      id: Snowflake | null;
      name: string | null;
    };

    /** ID of the guild, or `null` outside a guild. */
    guildId: Snowflake | null;

    /** The member who reacted, or `null`. Discord only sends it when a reaction is added. */
    member: GuildMember | null;

    /** ID of the message. */
    messageId: Snowflake;

    /** ID of the user who reacted. */
    userId: Snowflake;
  }

  /** Data for {@link events.MESSAGE_REACTION_REMOVE_ALL}. */
  interface MessageReactionRemoveAllEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** ID of the guild, or `null` outside a guild. */
    guildId: Snowflake | null;

    /** ID of the message. */
    messageId: Snowflake;
  }

  /** Data for {@link events.MESSAGE_REACTION_REMOVE_EMOJI}. */
  interface MessageReactionRemoveEmojiEvent extends MessageReactionRemoveAllEvent {
    /** The emoji whose reactions were removed. */
    emoji: {
      animated: boolean;
      id: Snowflake | null;
      name: string | null;
    };
  }

  /** Data for {@link events.MESSAGE_POLL_VOTE_ADD} and {@link events.MESSAGE_POLL_VOTE_REMOVE}. */
  interface MessagePollVoteEvent {
    /** ID of the user who voted. */
    userId: Snowflake;
    /** ID of the channel. */
    channelId: Snowflake;
    /** ID of the poll's message. */
    messageId: Snowflake;
    /** ID of the guild, or `null` outside a guild. */
    guildId: Snowflake | null;
    /** ID of the answer. */
    answerId: number;
  }

  /** Data for {@link events.CHANNEL_PINS_UPDATE}. */
  interface ChannelPinsUpdateEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** ID of the guild, or `null` outside a guild. */
    guildId: Snowflake | null;

    /** When the latest pinned message was pinned, or `null` if none are left. */
    lastPinTimestamp: Date | null;
  }

  /** Data for {@link events.THREAD_LIST_SYNC}. */
  interface ThreadListSyncEvent {
    /** IDs of the channels whose threads are included. Empty means every channel. */
    channelIds: Snowflake[];

    /** ID of the guild. */
    guildId: Snowflake;

    /** The bot's memberships of the threads. */
    members: Array<{
      id: Snowflake;
      joinedAt: Date | null;
      userId: Snowflake;
    }>;

    /** The active threads. */
    threads: ThreadChannel[];
  }

  /** Data for {@link events.THREAD_MEMBER_UPDATE}. */
  interface ThreadMemberUpdateEvent {
    /** Bitfield of the bot's notification settings for the thread. */
    flags: number;

    /** ID of the guild. */
    guildId: Snowflake;

    /** ID of the thread. */
    id: Snowflake;

    /** When the bot joined the thread. */
    joinedAt: Date | null;

    /** ID of the bot's user. */
    userId: Snowflake;
  }

  /** Data for {@link events.THREAD_MEMBERS_UPDATE}. */
  interface ThreadMembersUpdateEvent {
    /** Members who joined. */
    addedMembers: Array<{
      joinedAt: Date | null;
      userId: Snowflake;
    }>;

    /** ID of the guild. */
    guildId: Snowflake;

    /** ID of the thread. */
    id: Snowflake;

    /** About how many members the thread has. Discord stops counting at 50. */
    memberCount: number;

    /** IDs of the members who left. */
    removedMemberIds: Snowflake[];
  }

  /** Data for {@link events.INVITE_DELETE}. */
  interface InviteDeleteEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** The invite's code. */
    code: string;

    /** ID of the guild. */
    guildId: Snowflake;
  }

  /** Data for {@link events.TYPING_START}. */
  interface TypingStartEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** ID of the guild, or `null` outside a guild. */
    guildId: Snowflake | null;

    /** The member who is typing, or `null` outside a guild. */
    member: GuildMember | null;

    /** When they started typing. */
    timestamp: Date;

    /** ID of the user who is typing. */
    userId: Snowflake;
  }

  /** Data for {@link events.PRESENCE_UPDATE}. */
  type PresenceUpdateEvent = Presence;

  /** Data for {@link events.VOICE_SERVER_UPDATE}. */
  interface VoiceServerUpdateEvent {
    /** Host of the voice server. */
    endpoint: string;

    /** ID of the guild. */
    guildId: Snowflake;

    /** Token for connecting to the voice server. Don't log it. */
    token: string;
  }

  /** Data for {@link events.VOICE_CHANNEL_STATUS_UPDATE}. */
  interface VoiceChannelStatusUpdateEvent {
    /** ID of the voice channel. */
    id: Snowflake;
    /** ID of the guild. */
    guildId: Snowflake;
    /** The new status, or `null` if it was cleared. */
    status: string | null;
  }

  /** Data for {@link events.VOICE_CHANNEL_START_TIME_UPDATE}. */
  interface VoiceChannelStartTimeUpdateEvent {
    /** ID of the voice channel. */
    id: Snowflake;
    /** ID of the guild. */
    guildId: Snowflake;
    /** When the channel became active, or `null` if it's empty now. */
    voiceStartTime: Date | null;
  }

  /** Data for {@link events.VOICE_CHANNEL_EFFECT_SEND}. */
  interface VoiceChannelEffectSendEvent {
    /** ID of the voice channel. */
    channelId: Snowflake;
    /** ID of the guild. */
    guildId: Snowflake;
    /** ID of the user who sent the effect. */
    userId: Snowflake;
    /** The emoji sent, or `null`. */
    emoji?: EmojiData | null;
    /** `0` for a premium animation, `1` for a basic one. */
    animationType?: number | null;
    /** ID of the emoji animation. */
    animationId?: number | null;
    /** ID of the soundboard sound, for a sound. */
    soundId?: Snowflake | null;
    /** Volume of the sound, from 0 to 1. */
    soundVolume?: number | null;
  }

  /** Data for {@link events.WEBHOOKS_UPDATE}. */
  interface WebhooksUpdateEvent {
    /** ID of the channel. */
    channelId: Snowflake;

    /** ID of the guild. */
    guildId: Snowflake;
  }

  /** Data for {@link events.AUTO_MODERATION_RULE_CREATE} and {@link events.AUTO_MODERATION_RULE_UPDATE}. */
  interface AutoModRuleEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** The rule. */
    rule: AutoModRule;
  }

  /** Data for {@link events.AUTO_MODERATION_RULE_DELETE}. */
  interface AutoModRuleDeleteEvent {
    /** ID of the guild. */
    guildId: Snowflake;

    /** ID of the deleted rule. */
    ruleId: Snowflake;
  }

  /**
   * Data for {@link events.AUTO_MODERATION_ACTION_EXECUTION}. `matchedContent`
   * needs the Message Content intent.
   */
  interface AutoModActionExecutionEvent {
    /** What the rule did. */
    action: AutoModAction;

    /** ID of the alert message the rule sent, or `null`. */
    alertSystemMessage: Snowflake | null;

    /** ID of the channel, or `null`. */
    channelId: Snowflake | null;

    /** ID of the guild. */
    guildId: Snowflake;

    /** The part of the message that matched, or `null`. */
    matchedContent: string | null;

    /** The keyword or pattern that matched, or `null`. */
    matchedKeyword: string | null;

    /** ID of the message, or `null` if it was blocked before being sent. */
    messageId: Snowflake | null;

    /** ID of the rule. */
    ruleId: Snowflake;

    /** ID of the user who sent the message. */
    userId: Snowflake;
  }

  /** Data for {@link events.AUDIT_LOG_ENTRY_CREATE}. */
  interface AuditLogEntryEvent {
    /** The new entry. */
    entry: AuditLogEntry;

    /** ID of the guild. */
    guildId: Snowflake;
  }

  /** Data for {@link events.APPLICATION_COMMAND_PERMISSIONS_UPDATE}. */
  interface ApplicationCommandPermissionsUpdateEvent {
    /** ID of the command, or the bot's ID for permissions of every command. */
    id: Snowflake;
    /** ID of the bot's application. */
    applicationId: Snowflake;
    /** ID of the guild. */
    guildId: Snowflake;
    /** Who can use the command, and where. */
    permissions: ApplicationCommandPermission[];
  }

  /** Whether a role, user or channel can use a command. */
  interface ApplicationCommandPermission {
    /** ID of the role, user or channel. */
    id: Snowflake;
    /** `1` for a role, `2` for a user, `3` for a channel. */
    type: number;
    /** Whether the command is allowed. */
    permission: boolean;
  }

  /** Something a user or guild bought from the bot. */
  interface Entitlement {
    /** ID of the entitlement. */
    id: Snowflake;
    /** ID of the product. */
    skuId: Snowflake;
    /** ID of the bot's application. */
    applicationId: Snowflake;
    /** ID of the user who has it. */
    userId?: Snowflake;
    /** ID of the guild that has it. */
    guildId?: Snowflake;
    /** How it was obtained, such as a purchase or a test. */
    type: number;
    /** Whether it was deleted. */
    deleted: boolean;
    /** When it starts, as an ISO 8601 string. */
    startsAt?: string | null;
    /** When it ends, as an ISO 8601 string. */
    endsAt?: string | null;
    /** Whether a one-time purchase was used up. */
    consumed?: boolean;
    /** ID of the subscription it belongs to. */
    subscriptionId?: Snowflake;
  }

  /** A user's subscription to the bot. */
  interface Subscription {
    /** ID of the subscription. */
    id: Snowflake;
    /** ID of the user. */
    userId: Snowflake;
    /** IDs of the products subscribed to. */
    skuIds: Snowflake[];
    /** IDs of the entitlements it grants. */
    entitlementIds: Snowflake[];
    /** IDs of the products it renews to. */
    renewalSkuIds?: Snowflake[];
    /** When the current period started, as an ISO 8601 string. */
    currentPeriodStart: string;
    /** When the current period ends, as an ISO 8601 string. */
    currentPeriodEnd: string;
    /** `0` active, `1` ending at the period's end, `2` inactive. */
    status: number;
    /** When it was canceled, as an ISO 8601 string. */
    canceledAt?: string | null;
    /** Country code of the payment. */
    country?: string;
  }

  //#endregion

  //#region Lookups

  /** Returns the ID of the bot running the script. */
  function getBotId(): Snowflake;

  /**
   * Returns the ID of the script's guild. It's always the same guild, whatever
   * event is being handled.
   */
  function getGuildId(): Snowflake;

  /** Fetches the bot's user. */
  function fetchBotUser(): Promise<User>;

  /**
   * Fetches a user, or returns `null` if they don't exist.
   *
   * ```ts
   * const user = await discord.fetchUser('123456789012345678');
   * if (user) console.log(user.displayName);
   * ```
   */
  function fetchUser(userId: Snowflake): Promise<User | null>;

  /**
   * Reads the script's guild from Weeble's cache, or fetches it if it isn't
   * cached. A cached guild only has `id`, `name` and `ownerId`, but its methods
   * all work.
   *
   * ```ts
   * const guild = await discord.getGuild();
   * const member = await guild?.getMember(userId);
   * ```
   */
  function getGuild(): Promise<Guild | null>;

  /** Fetches the script's guild, or returns `null` if the bot was removed from it. */
  function fetchGuild(): Promise<Guild | null>;

  /**
   * Reads a channel of the script's guild from Weeble's cache, or fetches it if
   * it isn't cached. A cached channel has its name, type, category, `nsfw` and
   * overwrites, but not its topic, position or slowmode. Returns `null` for a
   * channel in another guild.
   */
  function getChannel(channelId: Snowflake): Promise<AnyGuildChannel | null>;

  /**
   * Fetches a channel of any type, or returns `null` if it can't be fetched.
   * The `fetchGuild*Channel()` functions return a channel of one type.
   */
  function fetchChannel(channelId: Snowflake): Promise<AnyChannel | null>;

  /** Fetches a channel that messages can be sent to, or returns `null` for any other channel. */
  function fetchTextChannel(channelId: Snowflake): Promise<TextChannel | null>;

  /** Fetches a guild channel, or returns `null` for a thread or a missing channel. */
  function fetchGuildChannel(
    channelId: Snowflake,
  ): Promise<AnyGuildChannel | null>;

  /**
   * Fetches a text or announcement channel, or returns `null` for any other channel.
   *
   * ```ts
   * const channel = await discord.fetchGuildTextChannel('123456789012345678');
   * if (!channel) return console.warn('Invalid logs channel.');
   * await channel.send('Ready.');
   * ```
   */
  function fetchGuildTextChannel(
    channelId: Snowflake,
  ): Promise<GuildTextChannel | null>;

  /** Fetches an announcement channel, or returns `null` for any other channel. */
  function fetchGuildAnnouncementChannel(
    channelId: Snowflake,
  ): Promise<GuildAnnouncementChannel | null>;

  /** Fetches a voice channel, or returns `null` for any other channel. */
  function fetchGuildVoiceChannel(
    channelId: Snowflake,
  ): Promise<GuildVoiceChannel | null>;

  /** Fetches a stage channel, or returns `null` for any other channel. */
  function fetchGuildStageVoiceChannel(
    channelId: Snowflake,
  ): Promise<GuildStageVoiceChannel | null>;

  /** Fetches a category, or returns `null` for any other channel. */
  function fetchGuildCategory(
    channelId: Snowflake,
  ): Promise<GuildCategory | null>;

  /** Fetches a forum channel, or returns `null` for any other channel. */
  function fetchGuildForumChannel(
    channelId: Snowflake,
  ): Promise<GuildForumChannel | null>;

  /** Fetches a media channel, or returns `null` for any other channel. */
  function fetchGuildMediaChannel(
    channelId: Snowflake,
  ): Promise<GuildMediaChannel | null>;

  /** Fetches a thread, or returns `null` for any other channel. */
  function fetchThreadChannel(
    channelId: Snowflake,
  ): Promise<ThreadChannel | null>;

  /**
   * Fetches an invite, or returns `null` if it's invalid or expired.
   *
   * @param code The part after `discord.gg/`, such as `"hTKzmak"`.
   * @param options.withCounts Whether to include the guild's member counts.
   * @param options.withExpiration Whether to include when the invite expires.
   * @param options.guildScheduledEventId A scheduled event to include.
   */
  function fetchInvite(
    code: string,
    options?: {
      guildScheduledEventId?: Snowflake;
      withCounts?: boolean;
      withExpiration?: boolean;
    },
  ): Promise<Invite | null>;

  /**
   * Fetches a webhook, or returns `null` if it doesn't exist.
   *
   * @param token The webhook's token, for a webhook the bot can't see otherwise.
   */
  function fetchWebhook(
    webhookId: Snowflake,
    token?: string,
  ): Promise<Webhook | null>;

  //#endregion

  //#region Channel type checks

  /** Returns whether messages can be sent to a channel, and narrows its type. */
  function isTextChannel(channel: Channel): channel is TextChannel;

  /** Returns whether a channel is a guild channel rather than a thread, and narrows its type. */
  function isGuildChannel(channel: Channel): channel is AnyGuildChannel;

  /** Returns whether a channel is a text or announcement channel, and narrows its type. */
  function isGuildTextChannel(channel: Channel): channel is GuildTextChannel;

  /** Returns whether a channel is an announcement channel, and narrows its type. */
  function isGuildAnnouncementChannel(
    channel: Channel,
  ): channel is GuildAnnouncementChannel;

  /** Returns whether a channel is a guild voice channel, and narrows its type. */
  function isGuildVoiceChannel(channel: Channel): channel is GuildVoiceChannel;

  /** Returns whether a channel is a guild stage channel, and narrows its type. */
  function isGuildStageVoiceChannel(
    channel: Channel,
  ): channel is GuildStageVoiceChannel;

  /** Returns whether a channel is a guild category, and narrows its type. */
  function isGuildCategory(channel: Channel): channel is GuildCategory;

  /** Returns whether a channel is a guild forum channel, and narrows its type. */
  function isGuildForumChannel(channel: Channel): channel is GuildForumChannel;

  /** Returns whether a channel is a guild media channel, and narrows its type. */
  function isGuildMediaChannel(channel: Channel): channel is GuildMediaChannel;

  /** Returns whether a channel is a thread, and narrows its type. */
  function isThreadChannel(channel: Channel): channel is ThreadChannel;

  //#endregion
}
