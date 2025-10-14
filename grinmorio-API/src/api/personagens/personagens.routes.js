import { Router } from 'express';
// Importa cada função do controller individualmente para maior clareza
import {
  create,
  getById,
  update,
  deleteById,
  addItem,
  getCharacterPdf
} from './personagens.controller.js';

const router = Router();

// Rota para criar uma nova ficha
router.post('/', create);

// Rota para buscar uma ficha específica
router.get('/:guildId/:userId', getById);

// Rota para atualizar uma ficha
router.put('/:guildId/:userId', update);

// Rota para deletar uma ficha
router.delete('/:guildId/:userId', deleteById);

// Rota para adicionar um item/magia/feature
router.post('/:guildId/:userId/adicionar-item', addItem);

// Rota para gerar o backup em PDF
router.get('/:guildId/:userId/pdf', getCharacterPdf);

export default router;