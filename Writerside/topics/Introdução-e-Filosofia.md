# Visão Geral e Filosofia

## 1. Introdução e Filosofia do Sistema

O principal objetivo de qualquer sistema de RPG (*Role-Playing Game*) é incentivar a narrativa e o entretenimento. Contudo, sistemas fundamentados puramente em aleatoriedade estocástica (RNG Linear) apresentam uma falha crítica: a ocorrência de extremos estatísticos que prejudicam a experiência. A possibilidade de sequências de falhas consecutivas ou sucessos ininterruptos pode comprometer tanto a imersão do jogador quanto de seu grupo e ainda o planejamento do Mestre.

O **Sistema de Rolagem Ponderada e Equilíbrio Dinâmico (RPED)** foi desenvolvido para mitigar essa variância indesejada. Diferente de um dado físico, que não possui memória de eventos passados, o RPED atua como um gerenciador de estado. O sistema monitora o histórico, o presente e as tendências do servidor para intervir sutilmente nos resultados.

A premissa não é invalidar a sorte, mas gerenciar a experiência. Se o sistema detecta uma sequência de fracassos estatisticamente improvável, ele intervém positivamente. Reciprocamente, se um jogador apresenta uma taxa de sucesso que trivializa os desafios, o sistema aplica limitações probabilísticas. O objetivo é a homeostase: um equilíbrio onde o risco é percebido como real, mas controlado por uma rede de segurança algorítmica.

### 1.1. O Problema da Aleatoriedade Estocástica

A aleatoriedade pura é indiferente ao contexto. Em modelos tradicionais, obter três falhas críticas ("1") consecutivas é um evento possível, ainda que raro. Para a máquina, é apenas um dado; para o usuário, é uma frustração problematica a longo prazo. O RPED parte do princípio de que a "percepção de aleatoriedade" é tão vital quanto a aleatoriedade matemática em si.

### 1.2. A Solução: Intervenção Invisivel (Invisible Backend)

A metodologia do RPED baseia-se na invisibilidade. Correções, bônus e penalidades são processados no *backend*, milissegundos antes da renderização do resultado. Para o usuário final, a interface exibe apenas o resultado do dado, preservando a imersão.

**Pilares do Sistema:**

* **Narrativa:** Prioriza a fluidez da história sobre a rigidez matemática, evitando estagnação por falhas repetitivas.
* **Desafio:** Impede a trivialização do conteúdo, assegurando que antagonistas não sejam derrotados apenas por sorte excessiva.
* **Comunidade:** Promove o equilíbrio entre jogadores, evitando que um único usuário monopolize os sucessos.


