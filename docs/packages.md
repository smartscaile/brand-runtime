# Pacotes e ferramentas

O pacote não possui dependências npm de produção nem de desenvolvimento. O
runtime usa APIs nativas do Node.js e assets incorporados ao plugin.

| Ferramenta | Escopo | Finalidade |
| --- | --- | --- |
| Node.js `>=22.20.0` | obrigatório | CLI, testes, contratos e manipulação de arquivos |
| Chrome/Chromium com CDP | render local | Inspeção e captura de apresentações |
| Poppler | opcional | QA de PDF somente quando `--pdf` é solicitado |

`package-lock.json` permanece para instalação determinística e deve refletir o
manifest raiz sem dependências transitivas desnecessárias.
