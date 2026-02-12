# Plano de Implementacao MVP - OdontoFlow

## 1. Objetivo
Entregar um MVP B2B de alta confiabilidade para odontologia integrativa, cobrindo o fluxo completo:
1. Cadastro e gestao de pacientes.
2. Anamnese via link seguro.
3. Upload e leitura de exames com curadoria.
4. Apoio ao diagnostico com motor metodologico.
5. Prescricao assistida com geracao de PDF.
6. Assinatura/planos (Stripe) e controle de acesso por organizacao (Clerk).

## 2. Premissas de Execucao
1. Arquitetura base atual: `backend/` (Encore.ts) e `frontend/` (Next.js + Clerk + Stripe starter).
2. Banco de dados: PostgreSQL via Encore SQLDatabase (sem Prisma no MVP inicial).
3. Deploy: backend em Encore Cloud e frontend em Vercel.
4. Qualidade alvo: zero blocker em producao, SLO inicial de disponibilidade >= 99.5%.

## 3. Escopo MVP (Go-Live)
### 3.1 Incluido no MVP
1. Multi-tenant por organizacao (Clerk Organization).
2. RBAC basico (Admin, Dentista, Auxiliar) com autorizacao no backend.
3. CRUD completo de pacientes com timeline.
4. Anamnese padronizada com token expirable, formulario dinamico e PDF.
5. Upload de exames (PDF), extracao OCR, parser de marcadores e tela de curadoria.
6. Evolucao clinica por marcador (tabela + grafico temporal).
7. Motor de analise metodologica baseado em regras (com trilha de justificativas).
8. Prescricao assistida (templates + edicao + PDF final).
9. Stripe subscription (Starter/Professional/Enterprise) + portal de faturamento.
10. Auditoria de eventos criticos e logs estruturados.

### 3.2 Fora do MVP (Fase 2+)
1. Mobile app nativo.
2. Integracoes laboratoriais diretas.
3. Telemedicina.
4. ML adaptativo em producao (manter inicialmente regras deterministicas + observacao).

## 4. Arquitetura Alvo do MVP
## 4.1 Backend (Encore services)
1. `auth` - validacao Clerk token, claims e papel.
2. `patients` - cadastro, timeline, status.
3. `anamnesis` - formularios, tokens, respostas, PDF.
4. `exams` - upload, OCR pipeline, parsing, curadoria.
5. `diagnosis` - motor de regras e evidencias.
6. `prescription` - biblioteca terapeutica, draft/final, PDF.
7. `billing` - sincronizacao Stripe e status de assinatura.
8. `compliance` - exportacao/anonimizacao LGPD (escopo minimo no MVP).

## 4.2 Frontend (Next.js App Router)
1. Area autenticada: dashboard, pacientes, anamneses, exames, diagnostico, prescricoes, assinatura.
2. Area publica: formulario de anamnese por token.
3. Componentes base: tabelas, formularios, graficos, PDF actions, feedback/error states.

## 4.3 Dados (PostgreSQL)
Entidades minimas:
1. `organizations`, `organization_users`, `roles`.
2. `patients`, `patient_timeline`.
3. `anamnesis_forms`, `anamnesis_tokens`, `anamnesis_answers`.
4. `exam_files`, `exam_extractions`, `exam_markers`, `exam_reviews`.
5. `diagnosis_runs`, `diagnosis_suggestions`, `diagnosis_evidence`.
6. `prescriptions`, `prescription_items`.
7. `subscriptions`, `stripe_events`.
8. `audit_logs`.

## 5. Plano por Fase (8 semanas MVP + 8 semanas estabilizacao)
## Fase 1 - MVP (Semanas 1-8)
### Sprint 1 (Semanas 1-2) - Fundacao
1. Hardening de auth (Clerk + Encore) e RBAC.
2. Modelagem inicial de banco + migrations.
3. Modulo de pacientes (API + UI lista + detalhe).
4. Observabilidade base (logs, tracing, erros frontend/backend).

Entregaveis:
1. Login estavel com org ativa.
2. CRUD pacientes com testes.
3. Pipeline CI com quality gate.

### Sprint 2 (Semanas 3-4) - Anamnese
1. Builder/formulario de anamnese padrao.
2. Geração de links tokenizados com expiracao.
3. Pagina publica de preenchimento sem login.
4. Persistencia de respostas e PDF de anamnese.

Entregaveis:
1. Fluxo end-to-end: gerar link -> paciente responde -> prontuario atualizado.
2. PDF anexado ao historico.

### Sprint 3 (Semanas 5-6) - Exames + OCR
1. Upload de PDF com storage.
2. OCR + parser de marcadores.
3. Tela de curadoria/ajuste humano.
4. Timeline e visualizacao por marcador.

Entregaveis:
1. Exame processado e revisado.
2. Grafico de evolucao por marcador.

### Sprint 4 (Semanas 7-8) - Diagnostico + Prescricao + Billing
1. Motor metodologico v1 (rule-based + evidencias).
2. Prescricao assistida com templates e PDF final.
3. Stripe subscriptions + portal + bloqueio por plano.
4. Fechamento de seguranca/LGPD minima para go-live.

Entregaveis:
1. Fluxo completo clinico funcionando em producao.
2. Publicacao do MVP.

## Fase 2 - Estabilizacao (Semanas 9-16)
1. Correcao de bugs reais de uso.
2. Otimizacao de performance (queries e rendering).
3. Ajustes UX com base em telemetria e suporte.
4. Refino de OCR/parsing e regras diagnosticas.
5. Preparacao de analytics administrativo.

## 6. Quality Gates (obrigatorios)
1. Typecheck 100% (`tsc --noEmit`) em backend e frontend.
2. Lint sem erros.
3. Testes:
   1. Unitarios (servicos e utilitarios).
   2. Integracao (APIs Encore + DB).
   3. E2E (login, pacientes, anamnese, exames, prescricao).
4. Cobertura minima:
   1. Backend: 80% em servicos criticos.
   2. Frontend: 60% em fluxos principais.
5. SAST + dependency audit sem critical.
6. Revisao de seguranca para endpoints com dados sensiveis.

## 7. Seguranca e LGPD no MVP
1. Criptografia em transito (TLS) e at-rest (managed infra).
2. Segregacao por organizationId em todas as consultas.
3. Auditoria de acesso a prontuario e prescricao.
4. Soft delete para prontuario e trilha de alteracoes.
5. Politica de retencao de arquivos e logs.
6. Endpoint minimo de exportacao de dados por paciente.

## 8. SLOs e Metricas de Produto
## 8.1 Tecnicas
1. API p95 < 400ms para endpoints de leitura.
2. OCR assíncrono com SLA de processamento < 3 min por exame (PDF padrao).
3. Disponibilidade mensal >= 99.5%.

## 8.2 Produto
1. Tempo medio cadastro+anamnese < 10 min.
2. Taxa de sucesso no preenchimento da anamnese >= 80%.
3. Reducao de tempo de transcricao de exames >= 60%.
4. Taxa de falha de prescricoes geradas < 1%.

## 9. Riscos e Mitigacao
1. **Falha de token Clerk/Encore**: checklist de secrets por ambiente + healthcheck de auth.
2. **Qualidade OCR variavel**: curadoria obrigatoria + biblioteca de regex/normalizacao por laboratorio.
3. **Escopo excessivo no MVP**: controle por gate de sprint e backlog priorizado MoSCoW.
4. **Dados sensiveis**: RBAC estrito, auditoria e revisão de permissao por endpoint.
5. **Dependencias externas (Stripe/Clerk/Vercel)**: runbooks e fallback operacional.

## 10. Plano Operacional de Semana 0 (imediato)
1. Consolidar secrets por ambiente:
   1. Encore staging/prod: `ClerkSecretKey`, `StripeSecretKey`, `StripeWebhookSigningSecret`.
   2. Vercel: chaves Clerk public/secret + variaveis de ambiente de deploy.
2. Fechar incidente atual de auth 401 com smoke test automatizado.
3. Congelar stack base e publicar baseline tag `v0.1.0-foundation`.
4. Criar board de execucao com epicos e milestones por sprint.

## 11. Definition of Done (DoD)
Uma funcionalidade so e considerada pronta quando:
1. Passa em testes automatizados e code review.
2. Possui tratamento de erro, estados de loading e empty state.
3. Possui logs e metricas minimas de observabilidade.
4. Possui validacao de autorizacao por papel e organizacao.
5. Possui documentacao curta de uso e operacao.
