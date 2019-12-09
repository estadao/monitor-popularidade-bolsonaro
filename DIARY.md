# Diário de dados

## Estado do trabalho de coleta

- Até `09/12/2019`, foram compilados os dados das pesquisas CNI/Ibope entre Dezembro de 2019 e Março de 2018. Não foram compiladas, ainda, as pesquisas Ibope sem dados da CNI.

## Observações sobre comparação histórica

- As pesquisas de Janeiro, Fevereiro e Abril de 2019 não estão no mesmo padrão das demais, e por isso não foram adicionadas. Os dados de ótimo/bom e ruim/péssimo precisam ser desagregados para ficar no mesmo padrão dos demais.

- Os dados de porte do muncípio mudam de padrão a partir de Setembro de 2018. Até então, a segmentação era a seguinte: [ `Até 50 mil habitantes`, `Mais de 50 a 500 mil habitantes`, `Mais de 500 mil habitatnes`]. Anteriormente, era no seguinte formato: [ `Até 50 mil habitantes`, `Mais de 50 a 100 mil habitantes`, `Mais de 100 mil habitantes` ]


## Log das alterações manuais

- A limpeza dp arquivo `data/pesquisa_cni-ibope_dados_estratificados_todos_os_trimestres_setembro2019.xlsx` foi feita no Google Sheets e deu origem ao arquivo `dados-compilados.csv`. O arquivo original pode ser acessado pelo [site da CNI](https://www.portaldaindustria.com.br/estatisticas/pesquisa-cni-ibope-avaliacao-do-governo/).

- O arquivo `Evolutivo por segmentos_Bolsonaro_Divulgadas.xlsx` contém também dados de pesquisas do Ibope que não foram feitas por encomenda da CNI. Da mesma maneira, os dados foram limpos no Google Sheets e agregados ao arquivo `dados-compilados.csv`


