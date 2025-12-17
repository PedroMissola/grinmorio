# Experiência do Usuário (UX)

## 9. Psicologia do Usuário e Experiência (UX)

O RPED é, fundamentalmente, uma ferramenta de Design de Experiência (*User Experience*). Humanos possuem dificuldade em processar probabilidades intuitivamente e frequentemente identificam padrões inexistentes (apofenia).

Ao suavizar as curvas de probabilidade, o sistema mantém o usuário em estado de "Fluxo" (*Flow*), equilibrando desafio e competência. A intervenção invisível valida a fantasia de poder do jogador sem quebrar as regras fundamentais do jogo.

### 9.1. O Efeito Mártir

O sistema induz um fenômeno social denominado "Efeito Mártir". Um jogador com baixo desempenho estatístico reduz a Média Global, ativando o Modo Resgate. Dessa forma, o "azar" de um indivíduo resulta matematicamente em benefícios para o grupo, criando uma dinâmica de cooperação sistêmica implícita.

### 9.2. Percepção de Justiça

Paradoxalmente, a manipulação algorítmica é percebida como "mais justa" do que a aleatoriedade pura. O sistema elimina sequências de falhas que seriam interpretadas como "erros do jogo" ou "injustiça", mantendo a coerência narrativa e emocional da sessão.

## 10. Conclusão

O Sistema RPED transcende a função de um simples gerador de números, posicionando-se como um gerenciador ativo de narrativa e probabilidade. Através da integração de variáveis como Sorte Diária, Histerese e Clamping, o sistema atua como um "Dungeon Master Digital", assegurando o ritmo e a diversão.

A arquitetura baseada em Redis e MongoDB garante escalabilidade e desempenho. O sistema é robusto, modular e justo, protegendo os jogadores de frustrações estatísticas e o Mestre de desequilíbrios de poder.

### 10.1. Benefícios Chave

* **Consistência:** Mitigação de sequências extremas de falhas ou críticos.
* **Automação:** Ajuste dinâmico de dificuldade, reduzindo a carga cognitiva do Mestre.
* **Retenção:** A mecânica de Sorte Diária incentiva o engajamento recorrente.

### 10.2. Manutenção

Recomenda-se a auditoria mensal dos logs no MongoDB para recalibragem dos gatilhos de Histerese (atualmente 4.3 e 5.5), ajustando-os conforme a evolução dos modificadores dos personagens e o perfil da mesa.
