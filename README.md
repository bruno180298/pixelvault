# PixelVault

Landing page de uma loja fictícia, com catálogo, carrinho de demonstração e chat de apoio.

## GitHub Pages

Publicar a raiz da branch `main`. No repositório, em **Settings → Pages**, escolher **Deploy from a branch**, selecionar `main` e `/(root)` e gravar. A página ficará em https://bruno180298.github.io/pixelvault/.

## Chat de apoio no n8n

1. No nó **Webhook**, selecionar **POST**. Em **Allowed Origins (CORS)**, colocar `https://bruno180298.github.io`. O valor é a origem do site, sem `/pixelvault/`.
2. Configurar **Respond** como **Using 'Respond to Webhook' node** e ligar o fluxo de apoio ao nó **Respond to Webhook**.
3. O chat envia `message`, `sessionId` e `source` como formulário URL-encoded. No nó Webhook, a mensagem está em `$json.body.message` e o identificador da conversa está em `$json.body.sessionId`.
4. Em **Respond to Webhook**, selecionar **JSON** e devolver um objeto como `{"reply":"Olá! Em que posso ajudar?"}`. O site também aceita texto no campo `output`.
5. Publicar o workflow e confirmar que `config.js` contém a **Production URL**. Para testar com a **Test URL**, trocar temporariamente o URL na cópia local e iniciar **Listen for test event** no n8n antes de cada teste.

Se o webhook falhar ou a configuração estiver vazia, o chat oferece respostas locais assinaladas como demonstração. O URL configurado fica visível no código público. Guarda as credenciais e chaves no n8n.

[Documentação do Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) · [Documentação do Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
