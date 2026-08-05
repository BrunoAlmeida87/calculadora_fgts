# Simulador de Rescisão a partir do Extrato do FGTS

Arquivo único: `calculadora-rescisao-fgts.html`. Abra com duplo clique em qualquer navegador moderno. Não precisa de servidor, instalação ou cadastro.

O PDF é lido dentro do próprio navegador pela biblioteca pdf.js. Nenhum byte do extrato sai da máquina — a única requisição externa é o download da biblioteca e da fonte. Sem internet, cole o texto do extrato no campo alternativo e tudo continua funcionando.

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
- **Salário base** *(vem estimado)* — é o número que mais mexe no resultado. O depósito de 8% não captura verbas sem incidência de FGTS, então a estimativa pode ficar abaixo do real.
- **Média de variáveis** — horas extras, adicionais e comissões habituais. Entram na base de aviso, 13º e férias.
- **Aviso prévio** — indenizado ou trabalhado.
- **Dias de férias vencidas a gozar** — em dias, não em períodos. Um período inteiro são 30 dias; se você tirou 25 e sobraram 5, informe 5. Quando o campo é maior que zero, aparece a opção de pagamento em dobro, para o caso de o prazo de concessão de 12 meses já ter vencido (art. 137 da CLT).
- **Dependentes** — cada um deduz R$ 189,59 da base do IRRF.
- **Modalidade do FGTS** — saque-rescisão ou saque-aniversário.
- **Pedidos anteriores de seguro-desemprego** — define o número de parcelas.
- **Adiantamento do 13º** — se a primeira parcela já foi paga neste ano.

Se você não tiver o PDF, o botão *Preencher tudo à mão* libera todos os campos e marca cada um como responsabilidade sua.

---

## 3. Como cada verba é calculada

### Aviso prévio — Lei 12.506/2011
30 dias + 3 dias por ano completo de casa, teto de 90 dias. Quando indenizado, o contrato é **projetado** até o fim do aviso (art. 487, §1º da CLT), e essa projeção conta avos de 13º e de férias — inclusive virando o ano, caso em que dois 13º são calculados.

Aviso trabalhado: os 30 dias são cumpridos e os dias excedentes são indenizados.

### Saldo de salário
Dias trabalhados no último mês × (remuneração ÷ 30).

### 13º proporcional
Meses-calendário do ano com 15 dias ou mais trabalhados, × (remuneração ÷ 12).

### Férias
- **Vencidas**: dias informados × (remuneração ÷ 30), dobrados se o período concessivo venceu.
- **Proporcionais**: meses aquisitivos — contados a partir da data-base, não do calendário — com 15 dias ou mais, × (remuneração ÷ 12).
- Ambas somam o terço constitucional.

### FGTS
```
FGTS rescisório  = 8% × (saldo de salário + aviso indenizado + 13º)
Base da multa    = valor para fins rescisórios (projetado) + FGTS rescisório
Multa            = base × 40% (20% no acordo, 0% em pedido e justa causa)
Saque            = (saldo projetado + FGTS rescisório) × percentual + multa
```
Se a data da demissão for futura, o saldo e a base são projetados mês a mês, aplicando o rendimento informado e somando 8% da remuneração por mês, com depósito extra em dezembro pelo 13º.

Nota: o FGTS não incide sobre férias indenizadas (proporcionais, vencidas e respectivos terços).

### Descontos
- **INSS** — tabela progressiva de 2026 (7,5% a 14%, teto de contribuição sobre R$ 8.475,55, desconto máximo de R$ 988,09). O 13º é calculado em separado.
- **IRRF** — base = rendimento menos a maior entre as deduções legais (INSS + dependentes) e o desconto simplificado de R$ 607,20. Sobre a base, a tabela progressiva; sobre o imposto, o redutor da Lei 15.270/2025: isenção total até R$ 5.000 e redução decrescente de `978,62 − 0,133145 × rendimento` até zerar em R$ 7.350.
- Aviso prévio indenizado e férias indenizadas **não** sofrem INSS nem IRRF.

### Seguro-desemprego
Tabela do MTE vigente desde 11/01/2026:

| Média dos 3 últimos salários | Parcela |
|---|---|
| até R$ 2.222,17 | média × 0,8 |
| R$ 2.222,18 a R$ 3.703,99 | R$ 1.777,74 + 50% do excedente |
| acima de R$ 3.703,99 | R$ 2.518,65 (teto) |

Piso de R$ 1.621,00. Número de parcelas conforme o tempo de vínculo e a quantidade de solicitações anteriores. Só há direito na dispensa sem justa causa.

---

## 4. O relatório

Um total geral no topo, dividido em três pilares — rescisão líquida, FGTS liberado e seguro-desemprego —, a composição dos proventos em barra, a lista de verbas e descontos com a fórmula de cada linha, o detalhamento do FGTS, uma tabela mostrando de onde veio cada dado usado e a memória de cálculo.

Botões para imprimir (ou salvar em PDF) e para exportar todos os lançamentos classificados em CSV.

---

## 5. O que ele não faz

- Não substitui o TRCT. Convenção coletiva, verbas próprias da categoria, plano de saúde, vale-transporte, empréstimo consignado e pensão alimentícia mudam o resultado e não estão no cálculo.
- Não trata rescisão indireta, contrato de experiência, aposentadoria, estabilidade, contribuição sindical nem abono pecuniário (venda de 1/3 das férias).
- A projeção de saldo futuro assume salário e taxa constantes; a taxa real do FGTS varia com a TR.
- As tabelas de INSS, IRRF e seguro-desemprego estão fixas nos valores de 2026. Em janeiro de cada ano elas mudam — os números ficam no objeto `TAB`, no início do script, prontos para atualização.

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

Para atualizar as tabelas do ano seguinte, basta editar `TAB`. Para acrescentar uma verba, adicione uma linha com `add(P, nome, valor, explicação)` dentro de `calcular` — ela aparece automaticamente no relatório e no gráfico de composição.
