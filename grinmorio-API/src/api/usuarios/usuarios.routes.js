import { Router } from 'express';
import { usuariosController } from './usuarios.controller.js';

const router = Router();

router.post('/ban', usuariosController.ban);

router.post('/unban', usuariosController.unban);

router.get('/:userId/status', usuariosController.getStatus);

router.get('/list', usuariosController.listBanned);

export default router;
