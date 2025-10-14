import axios from 'axios';

// A nossa cache que será acessada por outros ficheiros.
export const autocompleteCache = {
  magia: [],
  feature: [],
  item: [],
};

/**
 * Busca e armazena em cache as listas da dnd5eapi.co.
 * Esta função será chamada na inicialização do bot.
 */
export async function populateAutocompleteCache() {
  try {
    console.log('A popular a cache de autocomplete...');
    const [spells, features, items] = await Promise.all([
      axios.get('https://www.dnd5eapi.co/api/spells'),
      axios.get('https://www.dnd5eapi.co/api/features'),
      axios.get('https://www.dnd5eapi.co/api/equipment'),
    ]);

    autocompleteCache.magia = spells.data.results.map(s => ({ name: s.name, value: s.index }));
    autocompleteCache.feature = features.data.results.map(f => ({ name: f.name, value: f.index }));
    autocompleteCache.item = items.data.results.map(i => ({ name: i.name, value: i.index }));
    
    console.log('Cache de autocomplete populada com sucesso!');
  } catch (error) {
    console.log('Falha ao popular a cache de autocomplete:', error.message);
  }
}