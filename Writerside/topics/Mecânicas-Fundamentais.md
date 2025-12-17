# Mecânicas Fundamentais

## 2. Conceito de Sorte Diária e Probabilidade Ponderada

A inicialização do sistema ocorre ciclicamente (a cada 24 horas) através da distribuição do atributo oculto **Sorte Diária**. Variando em uma escala de 0 a 10, este valor não atua como um somador aritmético simples, mas como um modificador de peso probabilístico (*Weighted Probability Modifier*).

Semelhante a uma roleta com setores de tamanhos variáveis, a Sorte Diária ajusta a área de probabilidade de cada número.

* **Sorte 10:** A probabilidade de obter um "20" é expandida (ex: de 5% para 15%), enquanto os números baixos têm sua probabilidade reduzida.
* **Sorte 0:** A distribuição permanece linear ("honesta") ou levemente inclinada para valores médios-baixos.

Isso gera uma dinâmica variável, onde o jogador deve adaptar suas estratégias baseando-se na percepção empírica de sua "sorte" atual.

### 2.1. Analogia da Distribuição de Probabilidade

Imagine os 20 resultados possíveis de um dado dispostos em um gráfico de pizza.

* **Sistema Linear:** Cada fatia possui exatos 18 graus.
* **Sistema RPED (Sorte Alta):** A fatia do número "20" pode ser expandida para 45 graus, comprimindo a fatia do número "1" para apenas 2 graus. Estatisticamente, o ponteiro tende a parar na área maior, mas o risco de falha crítica (a área menor) permanece existente.

### 2.2. Tabela de Influência da Sorte

Abaixo detalha-se o impacto da Sorte Diária na probabilidade e na experiência do usuário.

| Nível de Sorte | Classificação | Comportamento do Algoritmo                 | Percepção do Usuário |
| --- | --- |--------------------------------------------| --- |
| **0 - 2** | Azarado / Neutro | Distribuição padrão ou levemente punitiva. | "Dificuldade elevada, baixa taxa de sucesso." |
| **3 - 6** | Médio | Leve favorecimento a números >= 8.         | "Equilíbrio justo entre sucessos e falhas." |
| **7 - 8** | Sortudo | Alta probabilidade no intervalo 10-17.     | "Tendência positiva, encoraja riscos." |
| **9 - 10** | O Escolhido | Críticos (18-20) com frequência dobrada.   | "Sensação de invencibilidade." |

> **Nota de Distribuição:** A atribuição é aleatória, porém valores extremos (7 e 10) possuem ocorrência rara, limitados a aproximadamente 2% a 7% dos casos para preservar a exclusividade. O ciclo diário impede que um usuário permaneça em um estado desfavorável indefinidamente.

## 3. Mecânica de Rolagem e Integração de Modificadores

O fluxo de processamento de uma rolagem é linear, mas envolve múltiplas etapas de validação. O usuário fornece a intenção (`QTD/DADO`) e seu modificador fixo (ex: `+5`).

O sistema **não** executa a operação simples `RNG + Modificador`. O processo ocorre da seguinte maneira:

1. **Cálculo do Total Desejado:** O sistema gera um resultado base influenciado pela Sorte Diária.
2. **Aplicação de Lógica de Equilíbrio:** Regras de Karma e Ajuda incidem sobre o valor total.
3. **Engenharia Reversa:** O sistema subtrai o modificador do usuário do "Total Desejado" para determinar qual face do dado deve ser exibida.

O modificador do jogador é tratado como uma constante imutável, pois reflete a evolução do personagem. A variável de ajuste é sempre o valor do dado (d20).

### 3.1. Fluxo de Dados (Input/Output)

A informação percorre um pipeline unidirecional. O input é processado por geradores de números, filtrado por validadores de equilíbrio e formatado para exibição em milissegundos. Não há re-rolagem visível; o ajuste é prévio à resposta da interface.

### 3.2. A Integridade da Constante do Modificador

Para preservar a sensação de progresso ("sense of achievement"), o sistema jamais altera o modificador de habilidade. Se uma punição é necessária, ela é aplicada reduzindo o valor sorteado no dado.

**Algoritmo Simplificado:**

```text
Entrada: Qtd/Dado+Modificador
Processamento:
  1. Total_Provisório = (RNG_Ponderado) + Modificador
  2. Total_Final = Aplicar_Regras_Karma_Ajuda(Total_Provisório)
Saída:
  Dado_Visual = Total_Final - Modificador

```