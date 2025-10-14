import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
console.log('Token:', process.env.TOKEN);
console.log('Client ID:', process.env.CLIENT_ID);

(async () => {
  try {
    console.log('🗑️ Limpando todos os comandos globais...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );
    console.log('✅ Comandos globais limpos!');
  } catch (error) {
    console.error(error);
  }
})();
