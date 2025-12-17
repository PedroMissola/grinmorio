# Arquitetura Técnica

## 8. Infraestrutura de Dados: Redis e MongoDB

A arquitetura do sistema é híbrida, visando latência mínima e persistência de dados.

1. **Redis (Cache em Memória):** Atua como memória de curto prazo. Armazena estados voláteis como Sorte Diária, médias atuais e flags de Histerese. Garante respostas em microssegundos.
2. **MongoDB (Banco de Dados Orientado a Documentos):** Atua como armazenamento persistente. Registra o histórico completo de logs para auditoria, análise de longo prazo e geração de estatísticas, sem impactar o tempo de resposta da rolagem.

### 8.1. Separação de Responsabilidades

| Tecnologia | Função no RPED | Tipo de Dado | Latência |
| --- | --- | --- | --- |
| **Redis** | Processamento em Tempo Real | Sorte Atual, Médias (Janela Móvel), Status | Baixa (ms) |
| **MongoDB** | Histórico e *Analytics* | Logs permanentes, Auditoria | Média |

Essa estrutura assegura que a expressão `QTD/DADO+MODIFICADOR` seja instantâneo, enquanto garante a integridade dos dados em caso de reinicialização do sistema.
