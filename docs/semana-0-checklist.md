# Semana 0 - Checklist Operacional

## Objetivo
Fechar os riscos de ambiente e autenticacao antes da Sprint 1.

## 1. Matriz de Secrets por ambiente
## 1.1 Encore Cloud (staging e production)
1. `ClerkSecretKey` - chave secreta do Clerk do mesmo ambiente do frontend.
2. `StripeSecretKey` - chave secreta da Stripe.
3. `StripeWebhookSigningSecret` - segredo do endpoint webhook.

## 1.2 Vercel (frontend)
1. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. `CLERK_SECRET_KEY`
3. `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
4. `VERCEL_ENV`
5. `NEXT_PUBLIC_VERCEL_ENV`
6. `VERCEL_GIT_PULL_REQUEST_ID` (preview)
7. `NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID` (preview)

## 2. Comandos de vinculacao e secrets (local)
Executar em `backend/`:

```bash
export ENCORE_INSTALL="$HOME/.encore"
export PATH="$ENCORE_INSTALL/bin:$PATH"

encore auth whoami
encore app link odontoflow-fiei

# staging
encore secret set --type dev ClerkSecretKey
encore secret set --type dev StripeSecretKey
encore secret set --type dev StripeWebhookSigningSecret

# production
encore secret set --type prod ClerkSecretKey
encore secret set --type prod StripeSecretKey
encore secret set --type prod StripeWebhookSigningSecret
```

## 3. Smoke test do erro 401 (Clerk token)
Arquivo: `scripts/smoke-auth.sh`

Uso:
```bash
ENCORE_BASE_URL="https://staging-odontoflow-fiei.encr.app" \
CLERK_BEARER_TOKEN="<jwt_token_do_usuario_logado>" \
scripts/smoke-auth.sh
```

Resultado esperado:
1. Endpoint autenticado retorna `200`.
2. Endpoint sem token retorna `401`.

## 4. Runbook rapido para "APIError: could not verify token"
1. Confirmar que Vercel e Encore usam o mesmo projeto Clerk.
2. Regravar `ClerkSecretKey` no ambiente Encore correto (`dev` para staging, `prod` para production).
3. Redeploy do backend Encore.
4. Fazer logout/login no frontend.
5. Rodar `scripts/smoke-auth.sh`.

## 5. Baseline tecnica
Apos checklist concluido:

```bash
git tag -a v0.1.0-foundation -m "Foundation baseline after week-0 stabilization"
git push origin v0.1.0-foundation
```

## 6. Criterio de conclusao da Semana 0
1. Login no frontend sem loop de organizacao.
2. Dashboard carrega sem erro de Server Component.
3. Smoke auth passou.
4. Build/deploy backend e frontend verdes.
5. Baseline tag publicada.
