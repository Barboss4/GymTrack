# GymTrack — site para GitHub Pages

Site pessoal, local-first e responsivo para musculação, progressão de carga, medidas corporais, cardio, suplementos e indicadores de saúde. Ele pode ser aberto diretamente pelo GitHub Pages, sem instalação e sem servidor próprio.

## Recursos

- Cinco treinos iniciais (Push A, Pull A, Legs A, Upper B e Lower B), totalmente editáveis.
- Sessão de treino com pré-preenchimento pela sessão anterior, séries extras, aquecimento, RIR, substituição e reordenação de exercícios.
- Salvamento imediato de cada alteração no IndexedDB e recuperação do treino ativo após fechar o navegador.
- Cronômetro de descanso por timestamp, com pausa, reinício, +15 s, pular e vibração quando disponível.
- Histórico independente do plano, edição posterior, exclusão confirmada e comparação com a sessão anterior.
- Progressão dupla, estimativa de 1RM por Epley, volume, recordes e gráficos por exercício/grupo muscular.
- Medidas parciais, cardio, recuperação, exames e registro neutro de suplementos/medicamentos.
- Relatório mensal imprimível e exportável.
- Backup completo em JSON, restauração validada e exportações CSV.
- Site funcional offline após o primeiro carregamento, usando cache do service worker.

Os registros ficam no IndexedDB do navegador; os arquivos do site ficam no cache offline. Não há conta, backend, sincronização ou envio a terceiros.

## Executar localmente

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Testes e build

```bash
npm test
npm run build
npm run preview
```

O build é gravado em `dist/`.

## Usar no celular

O site precisa ser servido por HTTPS, como acontece automaticamente no GitHub Pages.

- Basta abrir a URL do GitHub Pages no Chrome, Firefox ou Safari.
- Adicionar à tela inicial é opcional; o site funciona normalmente em uma aba.

Depois do primeiro carregamento completo, o service worker guarda os arquivos necessários para uso offline. Faça um backup JSON regularmente em **Mais → Configurações e backup**.

## Publicar gratuitamente

### Cloudflare Pages

1. Envie o projeto para um repositório GitHub.
2. Em Cloudflare Pages, escolha **Create a project → Connect to Git**.
3. Configure o comando de build como `npm run build`.
4. Configure o diretório de saída como `dist`.
5. Use Node.js 20 ou superior e publique.

Não são necessárias variáveis de ambiente nem serviços de banco de dados.

### GitHub Pages — publicação automática

O projeto inclui `.github/workflows/deploy-pages.yml`. Depois de enviar os arquivos para um repositório:

1. Abra **Settings → Pages** no GitHub.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Envie um commit para a branch `main`.
4. A Action fará o build e publicará automaticamente em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

O build usa caminhos relativos, portanto não é necessário informar previamente o nome do repositório.

## Estrutura principal

```text
src/
  components/        layout e elementos reutilizáveis
  data/              programa e perfil iniciais
  pages/             telas do aplicativo
  test/              testes automatizados
  utils/             cálculos, IDs, backup e CSV
  App.tsx             navegação e inicialização
  db.ts               esquema Dexie e migrações
  types.ts            entidades do domínio
public/
  icon.svg            ícone da PWA
```

## Limitações conhecidas

- Os dados são locais ao perfil do navegador e ao dispositivo; não há sincronização entre aparelhos.
- A precisão de 1RM diminui em séries de muitas repetições e o valor é sempre apresentado como estimativa.
- Exercícios com dois halteres registram a carga conforme a convenção definida no cadastro; mantenha a mesma convenção ao longo do histórico.
- Séries indiretas não são somadas ao gráfico muscular para evitar dupla contagem enganosa.
- Alertas sonoros não são usados por padrão; vibração depende de permissão e suporte do navegador.
- O aplicativo não interpreta exames, não diagnostica excesso de treino e não recomenda doses ou protocolos hormonais.
