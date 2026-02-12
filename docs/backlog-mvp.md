# Backlog MVP - Epicos e Historias

## Epico 1 - Fundacao, Auth e Tenanting
### Historia 1.1
Como profissional, quero autenticar com Clerk para acessar apenas minha organizacao.
Critérios de aceite:
1. Login/logout funcional.
2. Claims com `orgId` validadas no backend.
3. Endpoints retornam `403/401` corretos quando sem permissao.

### Historia 1.2
Como admin, quero gerenciar papeis (Admin, Dentista, Auxiliar).
Critérios de aceite:
1. Papel persistido por usuario da organizacao.
2. Middleware/autorizacao aplicada por endpoint.

## Epico 2 - Pacientes e Prontuario
### Historia 2.1
Como dentista, quero cadastrar e editar pacientes.
Critérios de aceite:
1. CRUD completo com validacao.
2. Busca por nome/CPF.

### Historia 2.2
Como dentista, quero visualizar timeline clinica.
Critérios de aceite:
1. Eventos de anamnese, exame e prescricao ordenados por data.
2. Paginacao e filtros basicos.

## Epico 3 - Anamnese Segura
### Historia 3.1
Como dentista, quero gerar link de anamnese com expiracao.
Critérios de aceite:
1. Token unico por envio.
2. Expiracao configuravel.

### Historia 3.2
Como paciente, quero preencher anamnese sem login.
Critérios de aceite:
1. Formulario com validacao.
2. Salva respostas e bloqueia reenvio indevido.

### Historia 3.3
Como dentista, quero baixar PDF da anamnese.
Critérios de aceite:
1. PDF com layout padronizado.
2. Documento vinculado ao prontuario.

## Epico 4 - Exames, OCR e Curadoria
### Historia 4.1
Como dentista, quero fazer upload de exame em PDF.
Critérios de aceite:
1. Upload validado e armazenado.
2. Status de processamento visivel.

### Historia 4.2
Como sistema, quero extrair marcadores com OCR e parser.
Critérios de aceite:
1. Pipeline assincrono.
2. Estrutura de marcadores persistida.

### Historia 4.3
Como dentista, quero revisar e corrigir marcadores extraidos.
Critérios de aceite:
1. UI de curadoria por exame.
2. Edicao e confirmacao auditadas.

## Epico 5 - Analise Metodologica
### Historia 5.1
Como dentista, quero receber sugestoes diagnosticas explicaveis.
Critérios de aceite:
1. Lista de sugestoes com score.
2. Evidencias que justificam cada sugestao.

### Historia 5.2
Como dentista, quero validar/refutar sugestoes.
Critérios de aceite:
1. Acao de aprovacao/rejeicao.
2. Registro da decisao para auditoria.

## Epico 6 - Prescricao Assistida
### Historia 6.1
Como dentista, quero gerar prescricao a partir do diagnostico.
Critérios de aceite:
1. Templates terapeuticos aplicados.
2. Edicao manual antes de finalizar.

### Historia 6.2
Como dentista, quero emitir PDF da prescricao.
Critérios de aceite:
1. PDF com dados do paciente e itens prescritos.
2. Versionamento de prescricao (draft/final).

## Epico 7 - Billing e Planos
### Historia 7.1
Como admin, quero assinar plano e gerenciar faturamento.
Critérios de aceite:
1. Checkout Stripe funcional.
2. Billing portal acessivel no dashboard.

### Historia 7.2
Como sistema, quero bloquear recursos por plano.
Critérios de aceite:
1. Regras de acesso por assinatura.
2. Sincronizacao por webhooks Stripe.

## Epico 8 - Compliance, Qualidade e Operacao
### Historia 8.1
Como admin, quero rastrear alteracoes criticas no prontuario.
Critérios de aceite:
1. Audit log por usuario/acao/data.
2. Consulta por filtros.

### Historia 8.2
Como operador, quero monitorar erros e latencia.
Critérios de aceite:
1. Dashboards de logs e traces.
2. Alertas para erros de autenticacao e falha de OCR.

### Historia 8.3
Como titular de dados, quero exportar dados pessoais.
Critérios de aceite:
1. Exportacao por paciente em formato estruturado.
2. Registro de solicitacao e atendimento.
