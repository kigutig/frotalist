## 📋 Descrição

> Descreva brevemente **o que** foi alterado e **por quê**.

---

## 🔗 Issues Relacionadas

Closes #

---

## 🧪 Como Testar

1. Checkout nesta branch
2. `npm install && npm run dev`
3. Acesse...
4. Verifique que...

---

## ✅ Checklist

### Qualidade
- [ ] Código revisado antes de abrir PR
- [ ] Testes adicionados/atualizados para cobrir as mudanças
- [ ] `npm test` passando localmente
- [ ] `npm run lint` sem erros
- [ ] `npx tsc --noEmit` sem erros

### Segurança (DevSecOps)
- [ ] Nenhuma credencial, token ou secret commitado no código
- [ ] Variáveis de ambiente sensíveis usam `.env` e não estão no repositório
- [ ] Dependências novas verificadas (`npm audit`)
- [ ] Nenhuma dependência com licença GPL/AGPL adicionada
- [ ] Dados de usuário tratados de forma segura (RLS Supabase ativo)

### Banco de Dados
- [ ] Migrações testadas em banco de desenvolvimento antes de abrir PR
- [ ] RLS policies atualizadas se necessário
- [ ] Migration é reversível (ou foi documentado que não é)

### Deploy
- [ ] Build de produção testado (`npm run build`)
- [ ] Preview da Vercel revisado (link no comentário da PR)

---

## 📸 Screenshots (se aplicável)

| Antes | Depois |
|-------|--------|
|       |       |
