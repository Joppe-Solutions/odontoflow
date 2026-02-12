# Setup do Board de Execucao (GitHub Projects)

## Objetivo
Criar um board unico para controlar o MVP com os 8 epicos e suas historias.

## Estrutura recomendada
1. Projeto: `OdontoFlow MVP Delivery`.
2. Colunas:
   1. `Backlog`
   2. `Ready`
   3. `In Progress`
   4. `Review`
   5. `Blocked`
   6. `Done`
3. Campos customizados:
   1. `Epic` (texto)
   2. `Sprint` (S1, S2, S3, S4)
   3. `Estimate` (numero)
   4. `Priority` (P0, P1, P2)

## Importacao rapida
1. Crie o projeto no GitHub.
2. Crie labels no repositorio:
   1. `epic`
   2. `story`
   3. `backend`
   4. `frontend`
   5. `infra`
   6. `security`
   7. `billing`
   8. `ocr`
3. Use o arquivo `docs/board-import.csv` para criar as issues em lote (via importador de issues da sua ferramenta de board).
4. Vincule todas as issues ao projeto.
5. Atribua sprint inicial:
   1. Sprint 1: Fundacao, Auth, RBAC, Patients, Observabilidade.
   2. Sprint 2: Anamnese.
   3. Sprint 3: Exames/OCR.
   4. Sprint 4: Diagnostico, Prescricao, Billing, Hardening.

## Convencoes de trabalho
1. Toda issue deve conter criterio de aceite testavel.
2. Todo PR deve referenciar issue do board.
3. Nenhuma issue entra em `Done` sem passar quality gates.
