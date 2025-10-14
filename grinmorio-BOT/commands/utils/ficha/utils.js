// helpers/ficha/utils.js

export function calcularModificador(valor) {
  return Math.floor((valor - 10) / 2);
}

export function obterBonusProficiencia(nivel) {
  if (nivel <= 4) return 2;
  if (nivel <= 8) return 3;
  if (nivel <= 12) return 4;
  if (nivel <= 16) return 5;
  return 6;
}

// NOVAS FUNÇÕES ADICIONADAS:

export function migrarFichaAntiga(personagem) {
  // Migra estrutura de aparência de objeto para string
  if (personagem.aparencia && typeof personagem.aparencia === 'object') {
    const { idade, altura, peso, olhos, pele, cabelos } = personagem.aparencia;
    personagem.aparencia = `Idade: ${idade || ''}\nAltura: ${altura || ''}\nPeso: ${peso || ''}\nOlhos: ${olhos || ''}\nPele: ${pele || ''}\nCabelo: ${cabelos || ''}`;
  }

  // Migra estrutura de magias
  if (personagem.magias && personagem.magias.truques) {
    const novaEstrutura = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
    
    // Migra truques
    if (Array.isArray(personagem.magias.truques)) {
      novaEstrutura[0] = personagem.magias.truques;
    }

    // Migra magias de níveis 1-9
    for (let i = 1; i <= 9; i++) {
      const nivel = personagem.magias[`nivel${i}`];
      if (nivel && nivel.preparadas && Array.isArray(nivel.preparadas)) {
        novaEstrutura[i] = nivel.preparadas;
      }
    }
    
    personagem.magias = novaEstrutura;
  }

  return personagem;
}

export function garantirEstruturaCompativel(personagem) {
  // Garante que magias existe e está no formato correto
  if (!personagem.magias || typeof personagem.magias !== 'object') {
    personagem.magias = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []
    };
  }

  // Converte estrutura antiga de magias se necessário
  if (personagem.magias.truques && Array.isArray(personagem.magias.truques)) {
    const novaEstrutura = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
    novaEstrutura[0] = personagem.magias.truques;
    
    // Migra outras magias se existirem
    for (let i = 1; i <= 9; i++) {
      const nivel = personagem.magias[`nivel${i}`];
      if (nivel && nivel.preparadas && Array.isArray(nivel.preparadas)) {
        novaEstrutura[i] = nivel.preparadas;
      }
    }
    
    personagem.magias = novaEstrutura;
  }

  // Garante estruturas básicas
  personagem.caracteristicasETracos = Array.isArray(personagem.caracteristicasETracos) 
    ? personagem.caracteristicasETracos 
    : [];
  personagem.equipamentos = Array.isArray(personagem.equipamentos) 
    ? personagem.equipamentos 
    : [];
  
  return personagem;
}