import { Router } from 'express';
import { rolagensController } from './rolagens.controller.js';

const router = Router();

router.post('/rolar', rolagensController.rolar);

router.post('/iniciativa', rolagensController.adicionarIniciativa);

router.get('/iniciativa/:guildId', rolagensController.obterIniciativas);

router.delete('/iniciativa/:guildId', rolagensController.limparIniciativas);

router.put('/iniciativa', rolagensController.setarIniciativa);

router.delete('/iniciativa/:guildId/:userId', rolagensController.removerIniciativa);

export default router;
