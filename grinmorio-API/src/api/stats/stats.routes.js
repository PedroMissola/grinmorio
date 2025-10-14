import { Router } from 'express';
import { statsController } from './stats.controller.js';

const router = Router();

// Rota para registrar um novo evento de estatística (ex: uso de comando)
router.post('/record', statsController.recordEvent);

// Rota para obter estatísticas gerais
router.get('/summary', statsController.getSummary);

export default router;