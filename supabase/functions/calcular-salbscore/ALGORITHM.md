# Algoritmo SalbScore — Especificação fechada

Versão 1.0 · Atualizado em 2026-04-27

## Escala
- **Saída**: inteiro entre **0 e 1000**.
- **Faixas**:
  - 0–299: `iniciante`
  - 300–499: `desenvolvimento`
  - 500–699: `estabelecido`
  - 700–849: `premium`
  - 850–1000: `elite`

## Componentes (7) e pesos
Soma dos pesos = 100. Cada componente é normalizado em `[0, 1]` (clamp01)
e multiplicado por seu peso. O resultado final é multiplicado por 1000.

| Componente | Peso | Métrica base | Normalização (100% =) | Teto |
|---|---|---|---|---|
| `tempo_atividade` | 15 | meses desde `profile.created_at` | 24 meses | 1.0 |
| `consistencia_atendimentos` | 20 | nº de meses únicos com ≥1 atendimento nos últimos 12m | 12 meses | 1.0 |
| `volume_pacientes` | 15 | pacientes únicos (patient_id ou nome) com status ≠ cancelled | 150 pacientes | 1.0 |
| `recebimentos_comprovados` | 20 | média mensal de `financial_transactions.income` nos últimos 12m | R$ 15.000/mês | 1.0 |
| `conformidade_regulatoria` | 10 | conselho preenchido (70 pts) + não suspenso (30 pts) | 100 pontos | 1.0 |
| `organizacao_financeira` | 10 | tem receita (35) + tem despesa (35) + categorias usadas (≥3 = 30, ≥1 = 15) | 100 pontos | 1.0 |
| `retencao_pacientes` | 10 | pacientes com 2+ visitas / total de pacientes | taxa de 60% | 1.0 |

## Fórmula final
```
score_final = round(
  ( Σ (componente_norm_i * peso_i) ) / 100   // resultado em [0,1]
  * 1000                                      // re-escala para [0,1000]
)
```
Onde `componente_norm_i = clamp01(score_componente_i / teto_i)`.

## Tratamento de dados faltantes / zero
- **Sem perfil**: edge function devolve `404 profile_not_found` (não calcula).
- **Sem atendimentos**: `consistencia_atendimentos = 0`, `volume_pacientes = 0`,
  `retencao_pacientes` usa `total_pacientes = 1` para evitar divisão por zero,
  resultando em `0`.
- **Sem transações financeiras**: `recebimentos_comprovados = 0` e
  `organizacao_financeira` perde os 70 pts de receita+despesa (sobra 0–30 conforme categorias).
- **Sem conselho preenchido**: `conformidade_regulatoria` perde os 70 pts.
- **Conta suspensa** (`profile.suspended_until > now()`):
  `conformidade_regulatoria` perde os 30 pts adicionais.
- **`amount` nulo**: convertido para 0 via `Number(t.amount || 0)`.
- **`patient_id` nulo**: usa `patient_name` como chave; se ambos nulos, paciente é descartado.

## Snapshot histórico
- Insere em `salbscore_historico` apenas se o último snapshot tem mais de **6 horas**.
- Evita spam de registros e mantém granularidade suficiente para evolução mensal.

## Tetos por componente (limites superiores)
Cada `componente.score` está em `[0, 100]` (`teto = 100`).
A normalização usa `score / teto`, então o componente nunca contribui acima do seu peso.

## Reproducibilidade
- Os componentes são determinísticos a partir dos dados em:
  `profiles`, `appointments`, `financial_transactions`.
- `now()` é fixado no início da execução; um mesmo input em uma janela curta produz o mesmo score.

## Limites de bloqueio
- Score visível apenas para profissionais autenticados.
- Score, componentes e dicas são **embaçados** no client (`blur-md`) para usuários não-pagos.
- Emissão de comprovantes oficiais exige `has_active_paid_plan(user_id) = true` (validado tanto no edge `gerar-documento-salbscore` quanto na RLS de `salbscore_documentos`).
