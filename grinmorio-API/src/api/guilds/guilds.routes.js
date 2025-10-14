import { Router } from 'express';
import { guildsController } from './guilds.controller.js';

const router = Router();

router.get('/:guildId/settings', guildsController.getSettings);

router.put('/:guildId/settings', guildsController.updateSettings);

export default router;