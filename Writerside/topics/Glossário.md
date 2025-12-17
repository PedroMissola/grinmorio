# Glossário

Esta seção define os termos técnicos, conceitos estatísticos e tecnologias mencionadas ao longo deste documento, visando facilitar a compreensão da arquitetura do sistema RPED.

### A - C

* **Aleatoriedade Estocástica:** Processo cujo resultado é determinado puramente pelo acaso e por probabilidades, sem memória de eventos passados (ex: jogar uma moeda).
* **Apofenia:** A tendência psicológica humana de perceber conexões ou padrões significativos em dados que são, na verdade, aleatórios.
* **Backend:** A camada de processamento do software que opera no servidor ("nos bastidores"). É onde a lógica, os cálculos e o banco de dados residem, invisíveis ao usuário final.
* **Cache:** Uma camada de armazenamento de dados de alta velocidade (geralmente em memória RAM) que guarda informações temporárias para que possam ser acessadas instantaneamente, evitando consultas demoradas ao banco de dados principal.
* **Clamping (Travamento):** Técnica matemática utilizada para restringir um valor numérico dentro de uma faixa específica. No RPED, garante que nenhum cálculo resulte em números menores que 1 ou maiores que 20.

### D - H

* **Damping (Amortecimento):** Mecanismo utilizado para reduzir a intensidade de oscilações ou picos em um sistema. O Karma atua como um *damping* para a sorte excessiva.
* **Delta (\Delta):** Termo matemático que representa a "diferença" ou variação entre dois valores. No sistema, é a diferença entre a Média Global e a Média Individual.
* **Desvio Padrão:** Medida estatística que indica o quanto os dados se afastam da média. Um desvio padrão alto indica que os resultados estão muito espalhados (instáveis).
* **Engenharia Reversa:** No contexto do RPED, é o processo de calcular o resultado "visual" do dado (input) partindo do resultado "final" desejado (output) que o sistema determinou.
* **Flapping (Oscilação):** Estado indesejado em sistemas de controle onde um estado liga e desliga repetidamente em curtos intervalos de tempo.
* **Flow (Estado de Fluxo):** Conceito da psicologia que descreve um estado mental de imersão total e foco, alcançado quando o nível de desafio de uma atividade está perfeitamente equilibrado com a habilidade do participante.
* **Granularidade:** O nível de detalhe dos dados. "Granularidade fina" refere-se a dados detalhados (jogador individual), enquanto "granularidade grossa" refere-se a dados agregados (servidor inteiro).
* **Histerese:** A dependência do estado atual de um sistema baseada em seu histórico. Na prática, refere-se ao uso de dois pontos de gatilho diferentes (um para ligar e outro para desligar) para evitar o *Flapping*.
* **Homeostase:** A capacidade de um sistema (biológico ou artificial) de regular seu ambiente interno para manter uma condição estável e constante, independentemente de alterações externas.

### I - O

* **Input/Output (E/S):** Refere-se à entrada de dados (o que o usuário envia, como o comando de rolar) e à saída de dados (o que o sistema devolve, como o resultado na tela).
* **Janela Deslizante (Sliding Window):** Técnica de análise de dados que considera apenas um subconjunto recente de informações (ex: as últimas 5 rolagens), descartando dados antigos à medida que novos chegam.
* **Latência:** O tempo de atraso entre uma ação (enviar o comando) e a resposta do sistema. O objetivo é sempre ter latência baixa (resposta rápida).
* **MongoDB:** Um sistema de banco de dados NoSQL orientado a documentos. É utilizado para armazenar grandes volumes de histórico de forma permanente.
* **Outlier (Ponto Fora da Curva):** Um valor que se desvia drasticamente da média da amostra. Pode indicar uma anomalia, erro ou evento excepcional.

### P - Z

* **Probabilidade Ponderada (Weighted Probability):** Um modelo estatístico onde nem todos os resultados têm a mesma chance de ocorrer. Alguns resultados têm "pesos" maiores, tornando-os mais frequentes.
* **Redis:** Um armazenamento de estrutura de dados em memória (RAM), usado como banco de dados e cache. É extremamente rápido, mas volátil (perde dados se desligado sem salvamento).
* **RNG (Random Number Generator):** Sigla para Gerador de Números Aleatórios. É o algoritmo padrão usado em computação para produzir sequências numéricas imprevisíveis.
* **Telemetria:** O processo de coleta e transmissão automática de dados de fontes inacessíveis (como o servidor do jogo) para um sistema de monitoramento central para análise.