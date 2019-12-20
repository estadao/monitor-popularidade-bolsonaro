# Monitor da popularidade de Bolsonaro

Este repositório contém o código JavaScript e os dados que [alimentam esta matéria](https://arte.estadao.com.br/politica/jair-bolsonaro/monitor-popularidade/).

No diretório `data`, o arquivo `evolucao-ibobe-limpo.csv` contém os dados de pesquisa que aparecem nos gráficos da reportagem. Em `annotations.json`, estão as respectivas anotações.

Já no diretório `viz`, o arquivo `dual-comparison.js` é o script que desenha os gráfico. Ele usa duas dependências: *d3.js v5* e *d3 annotations*.

Por fim, o diretório `media` contém as imagens decorativas exibidas no material.