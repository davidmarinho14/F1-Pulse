# Validação real pendente — Etapa 02

Este roteiro não é um relatório de testes concluídos.

1. Executar `setup_supabase.sql` no projeto real e preencher `config.js` com URL/chave pública.
2. No SQL Editor, conferir `pg_policies`, privilégios dos papéis e RLS ativo nas duas tabelas. Como `anon`, verificar que SELECT/INSERT/DELETE de favoritos funcionam, UPDATE de favoritos falha e UPDATE/DELETE de histórico falham. A chave pública deve conseguir executar `estatisticas_favoritos()`.
3. Buscar um piloto, salvar, fechar a aba e reabrir. Conferir o mesmo registro no Table Editor e no frontend. Abrir em outro navegador para comprovar persistência compartilhada.
4. Salvar novamente o mesmo piloto/temporada: deve aparecer mensagem de duplicado. Remover e recarregar: deve continuar ausente.
5. Fazer seis buscas, incluindo uma sem resultado. Conferir somente as cinco mais recentes na interface. Repetir uma busca de outra temporada clicando no histórico.
6. Conferir estatísticas após salvar/remover, inclusive empate de equipes e coleção vazia.
7. Ativar modo offline: a interface deve informar a falha e permitir tentar novamente. Restaurar a conexão e clicar em atualizar.
8. Construir e executar o Dockerfile; repetir os fluxos no endereço local do container. Confirmar estado saudável com `docker ps`.
9. Publicar tags `1.0` e `latest` em repositório público Docker Hub. Em ambiente limpo, executar `docker run` diretamente da imagem remota.
10. Integrar a branch no mesmo repositório e conferir implantação do Pages. Abrir os três links em aba anônima. Só então atualizar o estado e o link da imagem no README para envio ao Moodle.

Não inserir senhas, tokens secretos ou credenciais administrativas nas evidências.
