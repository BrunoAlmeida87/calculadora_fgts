# Simulador de Rescisão a partir do Extrato do FGTS

A ferramenta inteira está em `index.html`. Abra com duplo clique em qualquer navegador moderno — não precisa de servidor, instalação ou cadastro. Publicada no GitHub Pages, ela também pode ser **instalada no celular como aplicativo** (veja a seção 0).

O PDF é lido dentro do próprio navegador pela biblioteca pdf.js. Nenhum byte do extrato sai do aparelho — as únicas requisições externas são o download da biblioteca e da fonte. A biblioteca só é baixada quando você vai importar um PDF, então a página abre mais rápido. Sem internet, cole o texto do extrato no campo alternativo e tudo continua funcionando.

---

## 0. Usar no celular (app instalável)

A página é um PWA: quando aberta pelo endereço do GitHub Pages, dá para instalá-la na tela inicial e ela passa a abrir em tela cheia, como um aplicativo, **inclusive sem internet**.

- **Android (Chrome, Edge, Samsung Internet):** aparece o aviso *Instalar app* no topo da página; ou use o menu ⋮ → *Instalar aplicativo* / *Adicionar à tela inicial*.
- **iPhone e iPad (Safari):** toque em *Compartilhar* → *Adicionar à Tela de Início*. A página mostra essa instrução na primeira visita.
- **Compartilhar o PDF direto para o app (Android):** depois de instalado, baixe o extrato no app FGTS, toque em *Compartilhar* e escolha *Rescisão FGTS*. O app abre já lendo o arquivo.

O layout se adapta à largura da tela: no celular os campos ficam em uma coluna, com fonte de 16 px (o iPhone não dá zoom ao tocar no campo), botões largos, tabelas com rolagem lateral própria e o gráfico redesenhado na largura da tela. O CSV de lançamentos abre a folha de compartilhamento do celular, para salvar ou mandar por mensagem.

Arquivos do app:

| Arquivo | Função |
|---|---|
| `index.html` | a ferramenta inteira (HTML, CSS e JavaScript) |
| `manifest.webmanifest` | nome, ícones, cores e o atalho de compartilhamento de PDF |
| `sw.js` | service worker: guarda a página, os ícones e o pdf.js para funcionar offline e recebe o PDF compartilhado |
| `icons/` | ícones do app (`favicon.svg` é a fonte; os PNG são gerados a partir dele) |

Aberta direto do disco (`file://`), a página funciona igual, só não oferece instalação nem modo offline — isso é limitação do navegador.

---

## 1. O que ele lê do extrato

### Cabeçalho
Nome, empregador, data de admissão, tipo de conta, data de afastamento (se houver), data de emissão e o campo **valor para fins rescisórios** — a base oficial da multa.

O casamento entre rótulo e valor é feito por coordenada horizontal: a ferramenta localiza o rótulo na página e procura, na linha seguinte, o item alinhado à mesma coluna. Isso evita o erro clássico de pegar o valor da coluna vizinha quando algum campo do extrato vem vazio.

### Lançamentos
Cada linha do histórico vira um registro com data, descrição, valor, saldo acumulado e um tipo:

| Tipo | O que captura | Entra na base da multa? |
|---|---|---|
| `depósito` | `115-DEPOSITO`, inclusive os marcados como **em atraso** | sim |
| `juros` | `CREDITO DE JAM` e `JAM RECOLHIDO EMPRESA` | sim |
| `resultado` | `AC CRED DIST RESULTADO ANO BASE` | **não** |
| `saque` | `SAQUE JAM - COD …` | não reduz a base |
| `ajuste` | reposições, regularizações, créditos da Caixa | conforme o sinal |

A distinção do `resultado` é o ponto mais importante da leitura. A distribuição de resultados entra no saldo, mas **não** na base dos 40%. É por isso que o valor para fins rescisórios costuma ser bem menor que o saldo total.

### Reconciliação
O extrato da Caixa às vezes reexibe o mesmo lançamento quando houve reprocessamento. Linhas idênticas em data, descrição e valor são contadas uma vez só, e a ferramenta compara a soma de tudo com o saldo impresso, mostrando a diferença se ela existir. É um teste de consistência: se fechar, a classificação está certa.

### O que ele deriva sozinho
- **Salário estimado** — mediana dos depósitos normais dos últimos 14 meses dividida por 0,08. Ignora depósitos em atraso e a distorção do 13º.
- **Rendimento mensal** — média das últimas 12 taxas de JAM creditadas, lidas do próprio texto do lançamento.
- **Competências sem depósito** — meses faltantes na sequência, que podem indicar afastamento ou recolhimento não feito.

---

## 2. O que você precisa informar

A etapa 2 marca cada campo com uma etiqueta e uma barra amarela na lateral:

| Etiqueta | Significado |
|---|---|
| **do extrato** | lido do PDF, sem barra amarela |
| **confira** | estimado pelos depósitos — o valor está lá, mas revise |
| **você informa** | o extrato não tem como saber |

Campos que dependem de você:

- **Data da demissão e motivo** — sem justa causa, acordo do art. 484-A, pedido de demissão ou justa causa.
- **Salário base** *(vem estimado)* — é o número que mais mexe no resultado. O depósito de 8% não captura verbas sem incidência de FGTS, então a estimativa pode ficar abaixo do real. Como o FGTS incide sobre a remuneração inteira, a estimativa **já inclui** as variáveis habituais.
- **Média de variáveis** — horas extras, adicionais e comissões habituais. Entram na base de aviso, 13º e férias. Se o salário veio estimado do extrato, só preencha aqui se trocar o salário pelo valor da carteira, para não contar duas vezes.
- **Aviso prévio** — indenizado ou trabalhado (dispensa e acordo).
- **Aviso prévio do pedido** — só no pedido de demissão: cumprir os 30 dias, não cumprir (a empresa desconta 30 dias) ou a empresa dispensou o cumprimento (sem desconto).
- **Dias de férias vencidas a gozar** — em dias, não em períodos, contando só os períodos já completos **na data da demissão**. Um período inteiro são 30 dias; se você tirou 25 e sobraram 5, informe 5. O período que se fecha durante o aviso entra sozinho no cálculo (veja *Férias*). Quando o campo é maior que zero, aparece logo abaixo a opção de pagamento em dobro, para o caso de o prazo de concessão de 12 meses já ter vencido (art. 137 da CLT).
- **13º do ano da demissão** — nada recebido, só a 1ª parcela (adiantamento) ou o 13º inteiro já pago em dezembro.
- **Dependentes** — cada um deduz R$ 189,59 da base do IRRF.
- **Modalidade do FGTS** — saque-rescisão ou saque-aniversário.
- **Pedidos anteriores de seguro-desemprego** — define o número de parcelas.

Se você não tiver o PDF, o botão *Preencher tudo à mão* libera todos os campos e marca cada um como responsabilidade sua.

---

## 3. Como cada verba é calculada

### Aviso prévio — Lei 12.506/2011
30 dias + 3 dias por ano completo de casa, teto de 90 dias. O prazo começa no dia seguinte à comunicação (Súmula 380 do TST). Quando indenizado, o contrato é **projetado** até o fim do aviso (art. 487, §1º da CLT), e essa projeção conta avos de 13º e de férias — inclusive virando o ano, caso em que dois 13º são calculados.

- **Aviso trabalhado:** os 30 dias são cumpridos e os dias excedentes são indenizados.
- **Acordo (art. 484-A):** só a parte indenizada é paga pela metade. Com 33 dias devidos, são 16,5 dias; com aviso trabalhado, são 30 dias trabalhados e metade do excedente indenizada.
- **Pedido de demissão:** o empregado deve 30 dias, sem o acréscimo por ano de casa (ele só favorece o empregado).

### Saldo de salário
Dias trabalhados no último mês × (remuneração ÷ 30), em mês comercial: o dia 31 não soma e o mês trabalhado inteiro vale 30 dias, inclusive fevereiro. Se a admissão foi no mesmo mês, conta a partir dela.

### 13º proporcional
Meses-calendário do ano com 15 dias ou mais trabalhados, × (remuneração ÷ 12). Se o 13º do ano da demissão já foi pago inteiro, ele não entra de novo. A 1ª parcela já recebida (metade da remuneração, Lei 4.749/1965) é descontada; na justa causa, que não tem 13º proporcional, ela é compensada nas outras verbas (art. 3º da mesma lei).

### Férias
- **Vencidas**: dias informados × (remuneração ÷ 30), dobrados se o período concessivo venceu.
- **Integrais fechadas no aviso**: se um período aquisitivo se completa **depois** da data da demissão, durante o aviso trabalhado ou projetado, ele é pago inteiro (12/12). Na data da demissão esse período ainda estava aberto, então não daria para informá-lo como vencido — antes da revisão ele simplesmente sumia da conta.
- **Proporcionais**: meses aquisitivos — contados a partir da data-base, não do calendário — com 15 dias ou mais, × (remuneração ÷ 12).
- Todas somam o terço constitucional.

### FGTS
```
FGTS rescisório  = 8% × (saldo de salário + aviso indenizado + 13º)
Base da multa    = valor para fins rescisórios (projetado) + FGTS rescisório
Multa            = base × 40% (20% no acordo, 0% em pedido e justa causa)
Saque            = (saldo projetado + FGTS rescisório) × percentual + multa
```
O saldo e a base são atualizados a partir da posição do extrato: rendimento mensal informado, mais 8% da remuneração para cada competência de salário cheio que ainda não aparece depositada, até o mês anterior à saída (o mês da saída já está no FGTS rescisório). Como o depósito vence no dia 20 do mês seguinte, o extrato quase sempre está um ou dois meses atrás — a ferramenta usa a última competência depositada que aparece no próprio extrato para saber de onde partir. O 13º pago na folha de dezembro gera um depósito extra; o 13º pago na rescisão já está no FGTS rescisório e não é contado duas vezes.

Nota: o FGTS não incide sobre férias indenizadas (proporcionais, vencidas e respectivos terços).

### Descontos
- **INSS** — tabela progressiva de 2026 (7,5% a 14%, teto de contribuição sobre R$ 8.475,55, desconto máximo de R$ 988,09). O 13º é calculado em separado.
- **IRRF** — base = rendimento menos a maior entre as deduções legais (INSS + dependentes) e o desconto simplificado de R$ 607,20. Sobre a base, a tabela progressiva; sobre o imposto, o redutor da Lei 15.270/2025: isenção total até R$ 5.000 e redução decrescente de `978,62 − 0,133145 × rendimento` até zerar em R$ 7.350. O redutor vale também para o 13º, que é tributado em separado (§3º incluído no art. 3º-A da Lei 9.250/1995).
- Aviso prévio indenizado e férias indenizadas **não** sofrem INSS nem IRRF.
- Se os descontos passarem dos proventos, o relatório avisa: a compensação na rescisão é limitada a um mês de remuneração (art. 477, §5º da CLT) e o total geral considera a rescisão como zero.

### Seguro-desemprego
Tabela do MTE vigente desde 11/01/2026:

| Média dos 3 últimos salários | Parcela |
|---|---|
| até R$ 2.222,17 | média × 0,8 |
| R$ 2.222,18 a R$ 3.703,99 | R$ 1.777,74 + 50% do excedente |
| acima de R$ 3.703,99 | R$ 2.518,65 (teto) |

Piso de R$ 1.621,00. Número de parcelas conforme o tempo de vínculo e a quantidade de solicitações anteriores; a fração de 15 dias ou mais conta como mês inteiro (art. 4º, §3º da Lei 7.998/1990). Só há direito na dispensa sem justa causa.

---

## 4. O relatório

Um total geral no topo, dividido em três pilares — rescisão líquida, FGTS liberado e seguro-desemprego —, a composição dos proventos em barra, a lista de verbas e descontos com a fórmula de cada linha, o detalhamento do FGTS, uma tabela mostrando de onde veio cada dado usado e a memória de cálculo.

Botões para imprimir (ou salvar em PDF) e para exportar todos os lançamentos classificados em CSV.

---

## 5. O que ele não faz

- Não substitui o TRCT. Convenção coletiva, verbas próprias da categoria, plano de saúde, vale-transporte, empréstimo consignado e pensão alimentícia mudam o resultado e não estão no cálculo.
- Não trata rescisão indireta, contrato de experiência, aposentadoria, estabilidade, contribuição sindical nem abono pecuniário (venda de 1/3 das férias).
- A projeção de saldo futuro assume salário e taxa constantes; a taxa real do FGTS varia com a TR.
- As tabelas de INSS, IRRF e seguro-desemprego estão fixas nos valores de 2026. Em janeiro de cada ano elas mudam — os números ficam no objeto `TAB`, no início do script, prontos para atualização. Se a demissão ou o fim do aviso cair em outro ano, o relatório mostra um alerta.

---

## 6. Manutenção

Todo o código está inline no HTML. As partes principais:

| Trecho | Função |
|---|---|
| `TAB` | tabelas de INSS, IRRF, redutor e seguro-desemprego |
| `REGRA` | o que cada motivo de saída gera (aviso, multa, saque, seguro) |
| `lerPdf` / `linhasDeTexto` | extração do texto, com reconstrução de linhas por coordenada |
| `parseExtrato` | cabeçalho, classificação dos lançamentos e estatísticas |
| `calcular` | todas as verbas, descontos e o FGTS |
| `renderRelatorio` | montagem do relatório |

Para atualizar as tabelas do ano seguinte, basta editar `TAB` (inclusive `TAB.ano`). Para acrescentar uma verba, adicione uma linha com `add(P, nome, valor, explicação)` dentro de `calcular` — ela aparece automaticamente no relatório e no gráfico de composição.

Ao publicar uma mudança, aumente `VERSAO` no topo de `sw.js`. A página em si sempre é buscada na rede primeiro (quem está online recebe a versão nova na hora), mas a troca de versão renova a cópia guardada para uso offline. Se mudar o desenho do ícone, edite `icons/favicon.svg` e gere de novo os PNG (192, 512, maskable 512 e apple-touch 180).
