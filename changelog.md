# Dorios’ Insight — Changelog de Release

Este documento descreve, com o máximo de transparência possível, as mudanças recentes do addon **Dorios’ Insight**. Ele começa pelo que você percebe jogando e vai, aos poucos, para os detalhes técnicos (UI, comandos, persistência e arquitetura interna).

> Data deste registro: **2026-04-19**

## [Unreleased] — Manifest v3 + posição configurável do display + indicador de durabilidade + inventário no HUD estilizado + HUD Elements

### O que mudou
- O `RP/manifest.json` foi atualizado para **format_version 3** (semver em `version` e `min_engine_version`).
- Foi adicionada uma configuração de pack em **settings**:
  - `doriosinsight:display_position` (dropdown)
  - Opções: `top_left`, `top_middle`, `top_right`, `left_middle`, `right_middle`
- O `hud_actionbar_text` agora lê essa configuração e ajusta o posicionamento usando:
  - `anchor_from`
  - `anchor_to`
  - `offset`

### Novo: Indicador de Durabilidade
- Exibe a durabilidade da ferramenta equipada no lado direito da hotbar.
- Mostra porcentagem (ex: `75%`) e valor absoluto (ex: `1200/1600`).
- Aparece automaticamente quando o item na mão principal possui durabilidade e já sofreu dano.
- Suporta os três modos de layout: Desktop, Touch e Pocket.

### Novo: Inventário no HUD
- Foi adicionada uma opção para exibir o inventário do jogador diretamente no HUD.
- O painel mostra os itens em uma visualização compacta, com pilhas e barras de durabilidade.
- A visualização pode ser ativada ou desativada pelo novo menu **HUD Elements** do Dorios' Insight.
- Agora a quantidade das pilhas aparece corretamente em cada slot.
- O inventário no HUD agora pode alternar entre os modos **Full**, **Hotbar Only** e **Inventory Only**.
- O painel também pode alternar entre as orientações **Horizontal** e **Vertical**.
- Um novo stack central mostra o item selecionado, a quantidade atual na mão e o total disponível desse item em todo o inventário.
- O painel ganhou opções de posição: **Centro (padrão)**, **Superior Direito**, **Meio Direito**, **Inferior Direito** e **Inferior Esquerdo**.
- O painel acompanha os três modos de layout: Desktop, Touch e Pocket.

### Novo: HUD Elements
- As opções do **Inventário no HUD** e da **exibição de ferramentas** foram agrupadas em uma nova categoria localizada chamada **HUD Elements**.
- A categoria reúne o toggle do inventário, a posição do painel, o modo de exibição, a orientação e os ajustes do modo de ferramenta no HUD.

### Novo: WAILA Configurável
- O painel WAILA agora pode alternar entre os temas **Default**, **Dark**, **Copper**, **Magenta**, **Cyan**, **Blood** e **Ascane**.
- O WAILA voltou para a posição original no topo da tela, removendo os presets de ancoragem para manter a leitura mais consistente.
- A nova personalização visual continua integrada ao próprio menu do addon.

### Correções de HUD
- A exibição da durabilidade da ferramenta equipada ficou mais confiável, evitando casos em que o indicador não aparecia corretamente.
- A porcentagem da durabilidade deixou de arredondar para cima perto do valor máximo, evitando números inconsistentes em ferramentas quase novas.
- O indicador de durabilidade voltou a renderizar os números corretamente, evitando o caso em que só a barra `/` aparecia.
- Os indicadores numéricos de vida e fome agora reaparecem corretamente quando habilitados.
- A barra de armadura extra volta a acompanhar o crescimento das linhas de vida.
- A quantidade dos itens do inventário no HUD voltou a aparecer corretamente.
- A exibição das ferramentas ganhou melhor separação visual no modo com ícones.

### Arquivos alterados
- `RP/manifest.json`
- `RP/subpacks/default/ui/hud_screen.json`
- `RP/subpacks/dark/ui/hud_screen.json`
- `RP/subpacks/copper/ui/hud_screen.json`
- `BP/scripts/display/hudDataCollector.js`
- `BP/scripts/display/config.js`
- `BP/scripts/display/menu.js`
- `BP/scripts/display/uiChannels.js`
- `RP/ui/insight_hud_data.json`
- `RP/ui/insight_hud_bars.json`
- `RP/ui/insight_waila.json`
- `RP/texts/*.lang`

### Resultado prático
- Jogadores podem reposicionar o display do Dorios' Insight diretamente nas configurações do pack, sem precisar trocar subpack ou editar arquivo manualmente.
- Jogadores também podem habilitar um inventário compacto no HUD para acompanhar itens, pilhas e durabilidade sem abrir a mochila.
- Agora também dá para escolher se esse inventário aparece completo, só com a hotbar ou só com a mochila, além de alternar entre layout horizontal e vertical.
- O stack central ajuda a saber rapidamente quanto do item selecionado ainda existe no inventário inteiro.
- Os ajustes de inventário no HUD e de ferramentas ficam reunidos em **HUD Elements**, deixando a configuração mais fácil de encontrar.

## [1.1.0] — States/Traits Injection + Conditions/System + Display Expansion

### Destaques
- Versão dos packs atualizada para **1.1.0**.
- Novo módulo addon-side para transformar states/traits em runtime:
  - API global: `globalThis.InsightStateTraits`
  - Suporte a: renomear, ocultar, substituir valores, mesclar states e injetar linhas sintéticas.
- Split de comandos com aliases dedicados:
  - `/utilitycraft:insightmenu`
  - `/utilitycraft:insightmode`
  - `/utilitycraft:insightactivate`
  - `/utilitycraft:insightglobal`
  - `/utilitycraft:insightnamespace`
- Menu com novas telas:
  - **Conditions**
  - **System Settings**

### Exibição (Actionbar)
- Novos modos de nome de entidade:
  - Nickname First, Mob Name First,
  - Nickname After Mob Name, Mob Name After Nickname,
  - Nickname Only, Mob Name Only.
- Novo modo de resolução de nome de entidade:
  - `Translation Keys` (default)
  - `Translate Id to Text`.
- Campo de profissão de villager configurável:
  - After Name, Below Name, Hidden.
- Indicador de tier de ferramenta configurável:
  - Hidden, Boolean, Tier (Color), Tier (Ore), Text.
- Expansão de estilos para campos baseados em ícone:
  - Icons,
  - Text Type 1 (x/y),
  - Text Type 2 (x%),
  - Hybrid Type 1,
  - Hybrid Type 2.
- Layout com colunas configuráveis para:
  - states,
  - tags,
  - famílias de entidade.
- Ícone adicionado para efeito `health_boost`.

### Documentação
- Novo guia técnico:
  - `BP/scripts/display/STATE_TRAIT_INJECTORS.md`

## [Unreleased / Beta] — Estabilização de UI + Aliases de Namespace

### 1) O que mudou (bem simples)
- O menu do Insight ficou **mais estável** (corrige um crash nativo que acontecia ao abrir certas telas / dropdowns).
- Agora dá para **dar um “nome de exibição” para namespaces** que não estavam listados no registro de addons/conteúdo.
  - Ex.: fazer `cc:black_pillar` aparecer como **Cube Craft** (ou o nome que você escolher).

### 2) Novidades para quem joga (sem termos técnicos)
#### 2.1 Identificação de addon por namespace (quando o bloco não está listado)
Quando um bloco/entidade não tem mapeamento detalhado no registro existente, o Insight pode usar um *atalho*: o **namespace**.

Você pode cadastrar um alias do namespace por:
- **Menu (in-game):** um novo botão “Namespaces” aparece no menu principal do Insight.
- **Comando:**
  - `/insight namespace add <namespace> <displayName>`
  - Exemplo:
    - `/insight namespace add cc "Cube Craft"`

Resultado esperado:
- Qualquer conteúdo com namespace `cc:*` pode passar a mostrar “Cube Craft” como origem/assinatura do addon quando não houver um match mais específico.

#### 2.2 Menu principal com nova opção
- Foi adicionado um novo botão no menu principal do Insight para gerenciamento de namespaces.

### 3) Correções importantes (que evitam crash)
#### 3.1 Correção do crash “Native variant type conversion failed”
Havia um cenário em que labels de dropdown eram construídas de um jeito que causava crash nativo com a mensagem (ou equivalente):
- **“Native variant type conversion failed”**

Causa raiz (em termos simples):
- O jogo não gostava quando certos textos de UI eram montados “misturando formatos” dentro de argumentos de tradução.

O que foi feito:
- A construção das labels do dropdown foi alterada para gerar **um único objeto `rawtext`** consistente, em vez de tentar passar objetos complexos como placeholders dentro de um `translate`.
- Foi introduzida uma chave nova de texto para exibir a linha de “Atual/Current” sem depender de placeholders complexos.

### 4) Textos/Traduções (visível para o usuário)
#### 4.1 Nova chave para o “Current/Atual” nos componentes
Adicionada a chave:
- `ui.dorios.insight.components.current`

Ela foi adicionada nas linguagens:
- `RP/texts/en_US.lang`
- `RP/texts/pt_BR.lang`
- `RP/texts/pt_PT.lang`
- `RP/texts/es_ES.lang`
- `RP/texts/es_MX.lang`

#### 4.2 Novas chaves para o menu de namespaces
Foram adicionadas chaves para:
- Botão no menu principal
- Título e campos do formulário
- Mensagens de sucesso/erro/validação

Arquivos:
- `RP/texts/en_US.lang`
- `RP/texts/pt_BR.lang`
- `RP/texts/pt_PT.lang`
- `RP/texts/es_ES.lang`
- `RP/texts/es_MX.lang`

### 5) Mudanças de UI (Resource Pack)
#### 5.1 Ajuste em `RP/ui/server_form.json`
- Foi removida uma sobreposição específica de padding (`line_padding`) que estava forçando um comportamento visual.

Transparência: houve uma tentativa de refatorar o arquivo para um formato com `"modifiers"`, porém o schema/validador do UI JSON acusou erro:
- **“Property modifiers is not allowed.”**

Então:
- A mudança para `modifiers` foi **revertida** e o arquivo permanece no formato aceito pelo schema atual.

### 6) Comandos (o que dá para fazer agora)
#### 6.1 Novo conjunto: `insight namespace ...`
- Foi adicionado suporte ao action `namespace` dentro do comando raiz `/insight`.
- Comportamento implementado:
  - `namespace add <namespace> <displayName>`
  - `namespace set <namespace> <displayName>` (equivalente/alias de comportamento)

Notas práticas:
- `displayName` deve ser passado como um único argumento (use aspas quando tiver espaços).
  - Ex.: `/insight namespace add cc "Cube Craft"`

### 7) Persistência (mais avançado, mas importante)
#### 7.1 Onde o alias fica salvo
Os aliases de namespace são persistidos em **Dynamic Properties do mundo**.

Chave usada:
- `insight:namespace_registry`

Implicações:
- Os aliases são por-mundo (não por jogador).
- Ao copiar o mundo, os aliases vão junto (porque ficam no mundo).

### 8) Detalhes técnicos (para devs/maintainers)
#### 8.1 Arquitetura do “namespace alias registry”
O sistema de namespace alias foi integrado ao mecanismo existente que resolve “de onde vem” um bloco/entidade (por tags e por registro de conteúdo).

Agora a resolução segue (em alto nível) uma ordem equivalente a:
1. Match por tag (quando existe e é confiável)
2. Match por registro detalhado de conteúdo (`typeId`/conteúdo conhecido)
3. Match por alias de namespace (fallback)

Isso evita que o namespace sobrescreva um match mais específico.

#### 8.2 Normalização/validação de entrada
- O namespace é normalizado para minúsculas.
- Aceita entradas como:
  - `cc`
  - `cc:qualquer_coisa` (o sistema extrai apenas `cc`)
- Validação de caracteres permitidos foi aplicada para reduzir chance de registros “quebrados”.

#### 8.3 API exposta em runtime
O registro é exposto via um objeto global para integração interna:
- `globalThis.InsightNamespaceRegistry`

Ele inclui helpers para registrar alias e consultar o que já está salvo.

### 9) Arquivos alterados (para auditoria)
Behavior Pack:
- `BP/scripts/display/menu.js`
  - Novo botão no menu principal
  - Novo formulário de cadastro de namespace
  - Ajuste de labels de dropdown para evitar crash nativo
- `BP/scripts/display/commands.js`
  - Novo action `namespace`
  - Novo parâmetro adicional para suportar `displayName` completo
  - Handler para `namespace add/set`
- `BP/scripts/display/namespaceInjection.js`
  - Persistência do registry em dynamic property
  - Merge/rebuild do registry com alias por namespace
  - Fallback de resolução por namespace

Resource Pack:
- `RP/ui/server_form.json`
  - Remoção de override de `line_padding`
- `RP/texts/en_US.lang`
- `RP/texts/pt_BR.lang`
- `RP/texts/pt_PT.lang`
- `RP/texts/es_ES.lang`
- `RP/texts/es_MX.lang`
  - Novas chaves de UI para “Current/Atual” e menu de namespaces

### 10) Compatibilidade, riscos e limitações (sem maquiagem)
- A tentativa de adotar `modifiers` em `server_form.json` **não é suportada** pelo schema atual e foi revertida.
- A funcionalidade de “autocomplete/completions” de comandos depende da infraestrutura de comandos (DoriosAPI) e de como os parâmetros são definidos (ex.: `enum`). Houve tentativa de embasar isso em documentação, mas:
  - As buscas feitas não retornaram uma referência oficial clara para esse sistema custom.
  - Portanto, renomes/aliases/completions adicionais ficaram **pendentes** de uma especificação objetiva do que deve ser renomeado e quais valores antigos devem continuar funcionando.

### 11) Como testar (checklist rápido)
1. Entrar no mundo com o addon.
2. Abrir `/insight menu` (ou o caminho atual que abre o menu do Insight).
3. Confirmar que existe o botão **Namespaces**.
4. Cadastrar um alias (menu ou comando), ex.: `cc` → `Cube Craft`.
5. Verificar em um bloco/entidade `cc:*` que antes não aparecia com origem clara.
6. Abrir os menus de componentes que tinham dropdowns e confirmar que não ocorre mais crash.

---

## Histórico de contexto (o que foi tentado e por quê)
- “Usar modifiers” no UI JSON foi tentado porque parecia o caminho desejado para modularidade, mas o validador rejeita a propriedade. O projeto, no estado atual, precisa de uma referência de schema/engine que realmente aceite `modifiers` para que essa mudança volte a fazer sentido.

## Próximos passos sugeridos (se você quiser seguir evoluindo)
- Definir uma lista explícita de:
  - nomes antigos → nomes novos
  - quais valores devem continuar aceitos como alias
  - quais parâmetros devem virar `enum` (para autocomplete) vs quais devem continuar livres (string)
- Se existir um schema oficial/arquivo de exemplo que use `modifiers` no UI JSON, anexar esse exemplo para que a refatoração seja feita de forma compatível.
