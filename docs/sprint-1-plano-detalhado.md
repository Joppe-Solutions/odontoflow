# Sprint 1 - Plano Tecnico Detalhado (2 semanas)

## Objetivo da Sprint
Entregar a base de producao do MVP:
1. Auth estavel e sem 401 indevido.
2. RBAC inicial por papel.
3. Modulo de pacientes (MVP funcional).
4. Observabilidade e quality gates ativos.

## Escopo comprometido
1. Epico 1 - Historias 1.1 e 1.2.
2. Epico 2 - Historia 2.1 (core) e inicio da 2.2.
3. Epico 8 - Historias 8.1 e 8.2 (baseline).

## Planejamento por trilha
## Backend
1. Definir schema inicial:
   1. `patients`
   2. `patient_timeline`
   3. `organization_users` (papel por usuario)
2. Criar service `patients` com endpoints:
   1. `createPatient`
   2. `listPatients`
   3. `getPatient`
   4. `updatePatient`
   5. `archivePatient`
3. Criar middleware/helper de autorizacao por papel.
4. Incluir audit log basico (acoes criticas de paciente).

## Frontend
1. Tela `/dashboard/patients` com:
   1. tabela
   2. busca
   3. filtros de status
2. Tela detalhe `/dashboard/patients/[id]`.
3. Formulario criar/editar paciente com validacao.
4. Estados de erro/carregamento para chamadas de API.

## Plataforma e Qualidade
1. Pipeline CI:
   1. `pnpm lint`
   2. `pnpm exec tsc --noEmit`
   3. testes backend/frontend
2. Smoke auth automatizado com `scripts/smoke-auth.sh`.
3. Checklist de secrets por ambiente executado.

## Estimativa (story points)
1. H1.1 Auth por organizacao: 5
2. H1.2 RBAC: 5
3. H2.1 CRUD pacientes: 8
4. H8.1 Audit log baseline: 3
5. H8.2 Monitoramento baseline: 3
Total: 24 pontos

## Sequencia sugerida (ordem de implementacao)
1. Fechar Semana 0 (auth/secrets/smoke).
2. Modelagem DB + migrations.
3. Endpoints `patients`.
4. Telas de pacientes.
5. RBAC e auditoria.
6. Testes + hardening + release notes.

## Criterios de aceite da Sprint
1. Usuario autenticado lista e gerencia pacientes da propria organizacao.
2. Usuario sem permissao recebe 403.
3. Acoes criticas registradas em audit log.
4. Dashboards e endpoints principais com logs/traces.
5. CI verde e deploy em staging aprovado.

## Riscos da Sprint
1. Falha de secrets entre ambientes.
2. Escopo de UI crescer alem do necessario.
3. Ausencia de dados de teste representativos.

## Mitigacoes
1. Rodar smoke auth em toda release de staging.
2. Tratar timeline completa como parcial nesta sprint (somente base de eventos).
3. Criar seeds de dados para testes manuais.
