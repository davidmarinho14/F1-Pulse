# Roteiro de validação — Etapa 02

Este arquivo é um roteiro para repetir verificações, não uma declaração de que todos os cenários abaixo foram executados. Os resultados efetivamente observados estão na seção Testes do README.

1. Em um projeto novo, executar setup_supabase.sql e configurar URL/chave pública.
2. Conferir RLS e grants administrativamente; com a chave pública, validar operações permitidas e negação de UPDATE em favoritos e UPDATE/DELETE de histórico.
3. Salvar um piloto, recarregar e consultar em outro navegador. Remover o registro e conferir sua ausência após nova recarga.
4. Tentar duplicar o mesmo piloto/temporada e conferir a mensagem amigável.
5. Fazer seis buscas incluindo ausência de resultado; conferir as últimas cinco, repetir uma de outra temporada e conferir restauração da temporada.
6. Conferir estatísticas com coleção vazia, múltiplas equipes e empate na equipe mais frequente.
7. Simular falta de rede, restaurar conexão e usar Atualizar dados salvos.
8. Construir/executar o Dockerfile ou Compose e abrir localhost:8080.
9. Em ambiente sem imagem local e sem login, executar docker run -d -p 8080:80 davidmarinho14/f1-pulse:1.0.
10. Abrir repositório, Pages e Docker Hub sem autenticação. Conferir tags e atualizar a documentação após futuras publicações.

Publicação validada nesta entrega: https://github.com/davidmarinho14/F1-Pulse/actions/runs/39190206085

Nunca incluir tokens secretos, senhas ou credenciais administrativas em evidências.
