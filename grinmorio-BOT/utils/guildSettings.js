import { Collection } from 'discord.js';
import { getGuildSettings as fetchGuildSettings, updateGuildSettings as updateGuildSettingsAPI } from '#utils/analytics';
import log from '#utils/logger';

// This cache will be attached to the client object in index.js
let guildSettingsCache = new Collection();

export function initializeGuildSettingsCache(client) {
    if (!client.guildSettings) {
        client.guildSettings = new Collection();
        guildSettingsCache = client.guildSettings;
        log.info('Cache de configurações de servidor inicializado.');
    }
}

const DEFAULT_PREFIX = '!';

/**
 * Gets the prefix for a specific guild, using a cache.
 * @param {import('discord.js').Client} client The Discord client instance.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<string>} The prefix for the guild.
 */
export async function getGuildPrefix(client, guildId) {
    if (!guildId) return DEFAULT_PREFIX;

    // Ensure cache is initialized
    if (!client.guildSettings) {
        initializeGuildSettingsCache(client);
    }

    // Check cache first
    if (client.guildSettings.has(guildId)) {
        const settings = client.guildSettings.get(guildId);
        return settings.prefix || DEFAULT_PREFIX;
    }

    // If not in cache, fetch from API
    const settings = await fetchGuildSettings(guildId);
    if (settings) {
        client.guildSettings.set(guildId, settings);
        return settings.prefix || DEFAULT_PREFIX;
    }

    return DEFAULT_PREFIX;
}

/**
 * Updates the prefix for a guild in the API and cache.
 * @param {import('discord.js').Client} client The Discord client instance.
 * @param {string} guildId The ID of the guild.
 * @param {string} newPrefix The new prefix.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function updateGuildPrefix(client, guildId, newPrefix) {
    try {
        // Update via API
        await updateGuildSettingsAPI(guildId, { prefix: newPrefix });

        // Ensure cache is initialized
        if (!client.guildSettings) {
            initializeGuildSettingsCache(client);
        }

        // Update cache
        const currentSettings = client.guildSettings.get(guildId) || {};
        currentSettings.prefix = newPrefix;
        client.guildSettings.set(guildId, currentSettings);

        log.info(`Prefixo para o servidor ${guildId} atualizado para "${newPrefix}"`);
        return true;
    } catch (error) {
        log.error(`Falha ao atualizar o prefixo para o servidor ${guildId}:`, error);
        return false;
    }
}
