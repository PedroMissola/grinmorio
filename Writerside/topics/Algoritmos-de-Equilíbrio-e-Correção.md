# Algoritmos de Equilíbrio e Correção

## 1. O Grande Observador: Monitoramento de Médias

O módulo de monitoramento, denominado "O Grande Observador", é responsável pela telemetria em tempo real. Ele opera em dois níveis de granularidade para fundamentar as decisões algorítmicas.

1. **Nível Micro (Jogador):** Mantém uma janela deslizante das últimas 5 a 10 rolagens. Isso permite identificar tendências de curto prazo e desvios padrão anômalos.
2. **Nível Macro (Global):** Calcula a média agregada de todas as rolagens do servidor. A "Média Global" serve como linha de base (baseline) para a saúde do jogo.

A intervenção do sistema é disparada pela discrepância (Delta) entre a Média Individual e a Média Global.

### 1.1. Desvio Padrão e Detecção de Anomalias

O sistema busca *outliers*. Se a média do servidor é 15 e um usuário sustenta uma média de 25, o sistema identifica uma anomalia que ameaça o equilíbrio, independentemente da origem (sorte ou bônus), e prepara uma correção.

### 1.2. Exemplo de Rastreamento de Dados

| Entidade | Histórico Recente (Janela Móvel) | Média Calculada | Status do Sistema |
| --- | --- | --- | --- |
| **Jogador A** | `[12, 8, 5, 9, 4]` | 7.6 | **Crítico** (Requer Ajuda) |
| **Jogador B** | `[15, 17, 14, 16, 15]` | 15.4 | **Neutro** (Saudável) |
| **Jogador C** | `[22, 25, 23, 20, 24]` | 22.8 | **Alvo** (Karma/Punição) |
| **Servidor** | *(Agregado dos acima)* | 15.2 | **Estável** |

## 2. Sistema de Karma: Controle de Inflação

O Sistema de Karma atua como um mecanismo de *damping* (amortecimento). Sua função é evitar que um jogador monopolize a narrativa através de sorte excessiva. O gatilho é ativado quando:
`Média Individual >> Média Global e Média Individual << 22.5` **E** `Nova Rolagem == Alta`.

Diferente de sistemas convencionais, o RPED não trata o "20 Natural" como um valor inviolável. Se a integridade matemática do equilíbrio estiver ameaçada, o algoritmo reduzirá um sucesso crítico para um sucesso padrão (ex: 15 ou 16), evitando picos de poder incontroláveis.

### 2.1. A Dessacralização do Crítico

Esta decisão de design prioriza o equilíbrio coletivo. A redução suave garante que o jogador ainda obtenha sucesso na ação, mas remove o excesso que poderia quebrar a curva de dificuldade planejada pelo Mestre.

### 2.2. Algoritmo de Punição

1. **Detecção:** Identificação de Total Alto por um usuário com Média excessiva.
2. **Cálculo do Delta:** Comparação percentual entre Média Pessoal e Global.
3. **Definição da Taxa:** Estabelecimento de um valor de subtração proporcional ao desvio.
4. **Aplicação:** `Total_Final = Total_Rolado - Taxa_Correção`.
5. **Consequência:** A redução força a média pessoal do jogador em direção à linha de base nas rodadas subsequentes.

## 3. Modo Resgate e Histerese

O Modo Resgate é o mecanismo de auxílio sistêmico. Quando a Média Global cai abaixo de um limiar crítico, o sistema injeta bônus artificiais em todas as rolagens para evitar falhas em massa.

Para prevenir oscilações rápidas entre os estados "Ligado" e "Desligado" (fenômeno conhecido como *flapping*), implementa-se um controle por **Histerese**. Isso define pontos de gatilho distintos para ativação e desativação.

### 3.1. Ciclo de Feedback Positivo

Durante o Modo Resgate, a magnitude da ajuda é escalonada pela Sorte Diária do jogador. Usuários com sorte alta recebem bônus maiores, atuando como alavancas para recuperar a Média Global mais rapidamente.

### 3.2. Pontos de Gatilho da Histerese

| Média Global | Estado do Sistema | Comportamento do Bot |
| --- | --- | --- |
| **> 5.5** | Normal / Estável | Nenhuma ajuda extra. Karma ativo. |
| **5.5 a 4.3 (Descendo)** | Alerta | Observação passiva. Karma ativo. |
| **< 4.3** | **CRÍTICO (Trigger)** | **Ativação do Modo Resgate.** Injeção de bônus. |
| **4.3 a 5.5 (Subindo)** | Recuperação | Mantém Modo Resgate ativo até cruzar 5.5. |

O *gap* entre 4.3 e 5.5 garante que a ajuda permaneça ativa tempo suficiente para estabilizar a sessão, evitando intermitência.

## 4. Engenharia Reversa e Validação de Limites (Clamping)

Após os ajustes de Karma ou Resgate, o sistema deve calcular o valor visual do dado. Se o `Total_Final` desejado é 18 e o modificador é +4, o dado deve mostrar 14.

Entretanto, ajustes matemáticos podem gerar valores impossíveis (ex: dado negativo ou maior que 20). Para corrigir isso, utiliza-se o **Clamping** (Travamento de Limites), forçando o resultado a respeitar as restrições físicas do dado (1 a 20).

### 4.1. O Processo de Clamping

O Clamping atua como uma barreira lógica final. Se o cálculo exigir um dado 25, o sistema exibe 20. Se exigir -2, exibe 1. A consistência visual tem prioridade sobre o ajuste fino do equilíbrio para manter a verossimilhança.

### 4.2. Algoritmo de Reconstrução Visual

```python
Dado_Visual = Total_Ajustado - Modificador_Jogador

# Validação Inferior
Se Dado_Visual < 1:
    Dado_Visual = 1
    Total_Final = 1 + Modificador_Jogador  # Recálculo do total real

# Validação Superior
Se Dado_Visual > 20:
    Dado_Visual = 20
    Total_Final = 20 + Modificador_Jogador # Recálculo do total real

Retornar (Dado_Visual, Total_Final)

```
