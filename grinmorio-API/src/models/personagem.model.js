/**
 * Define a estrutura de dados completa para uma ficha de personagem de D&D 5e,
 * alinhada com a ficha oficial.
 */
export const templatePersonagem = {
  // === Página 1: Principal ===
  nome: "",
  classe: "",
  nivel: 1,
  antecedente: "",
  raca: "",
  alinhamento: "",
  pontosDeExperiencia: 0,
  nomeDoJogador: "", // NOVO

  atributos: {
    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    carisma: 10
  },

  inspiracao: false,
  proficienciaBonus: 2,

  salvaguardas: { // Proficiência em Salvaguardas
    forca: false, destreza: false, constituicao: false,
    inteligencia: false, sabedoria: false, carisma: false
  },

  pericias: { // Proficiência em Perícias
    acrobacia: false, animais: false, arcanismo: false, atletismo: false,
    atuacao: false, enganacao: false, furtividade: false, historia: false,
    intuicao: false, intimidacao: false, investigacao: false, medicina: false,
    natureza: false, percepcao: false, persuasao: false, prestidigitacao: false,
    religiao: false, sobrevivencia: false
  },

  sabedoriaPassiva: 10, // NOVO: Sabedoria (Percepção) Passiva

  pvMaximos: 0,
  pvAtuais: 0,
  pvTemporarios: 0, // NOVO
  
  dadosDeVida: "", // Ex: "5d10"
  salvaguardaMorte: { // NOVO
    sucessos: 0,
    falhas: 0,
  },

  ca: 10, // Classe de Armadura
  iniciativa: 0, // NOVO: Apenas o bônus, calculado a partir da Destreza
  deslocamento: "", // NOVO: Ex: "9m"

  personalidade: {
    tracos: "",
    ideais: "",
    ligacoes: "", // Vínculos na ficha em PT-BR
    fraquezas: "" // Fraquezas na ficha em PT-BR (era 'defeitos')
  },
  
  caracteristicasETracos: [], // Features & Traits
  ataquesEMagias: [], // Lista de ataques definidos
  
  equipamentos: "", // Alterado para string para comportar moedas (PC, PP, PE, PO, PL)
  outrasProficienciasEIdiomas: "", // NOVO: Campo de texto para proficiências com armas, ferramentas, etc.

  // === Página 2: História e Aparência ===
  aparencia: { // NOVO: Estrutura de objeto
    idade: "",
    altura: "",
    peso: "",
    olhos: "",
    pele: "",
    cabelo: ""
  },
  historia: "",
  aliadosEOrganizacoes: "", // NOVO
  tesouros: "", // NOVO

  // === Página 3: Magia ===
  magiaInfo: { // NOVO: Agrupa informações de conjuração
    classeConjuradora: "",
    atributo: "", // Ex: "Inteligência"
    cdDasMagias: 0,
    bonusDeAtaqueMagico: 0
  },
  slotsMagias: [ // NOVO: Estrutura em array, mais fácil de gerenciar
    { nivel: 1, total: 0, gastos: 0 },
    { nivel: 2, total: 0, gastos: 0 },
    { nivel: 3, total: 0, gastos: 0 },
    { nivel: 4, total: 0, gastos: 0 },
    { nivel: 5, total: 0, gastos: 0 },
    { nivel: 6, total: 0, gastos: 0 },
    { nivel: 7, total: 0, gastos: 0 },
    { nivel: 8, total: 0, gastos: 0 },
    { nivel: 9, total: 0, gastos: 0 },
  ],
  magias: { // Magias conhecidas/preparadas
    0: [], 1: [], 2: [], 3: [], 4: [],
    5: [], 6: [], 7: [], 8: [], 9: []
  },

  // === Metadados ===
  criadoEm: new Date(),
  ultimaAtualizacao: new Date()
};