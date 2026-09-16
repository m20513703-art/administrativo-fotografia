"use strict";

/* ============================================================
   LUZ & MEMÓRIA — ADMINISTRATIVO
   SISTEMA NOVO
============================================================ */


/* ============================================================
   CONFIGURAÇÃO
============================================================ */

const CONFIG_ADMIN = {

    nome: "Luz & Memória — Fotografia",

    limiteFotos: 1500,

    senhaPadrao: "1234",

    storage: {

        galerias: "luzMemoria_galerias",

        clientes: "luzMemoria_clientes",

        favoritos: "luzMemoria_favoritos",

        whatsapp: "luzMemoria_whatsapp",

        senha: "luzMemoria_senha",

        sessao: "luzMemoria_admin_logado"

    },

    bancoFotos: {

        nome: "luzMemoria_fotos_db",

        versao: 1,

        store: "fotos"

    }

};


/* ============================================================
   ESTADO
============================================================ */

let galerias = [];

let clientes = [];

let favoritos = [];

let fotos = [];

let galeriaEditando = null;


/* ============================================================
   ELEMENTOS
============================================================ */

const $ = (id) => document.getElementById(id);


/* ============================================================
   UTILIDADES
============================================================ */

function gerarId(prefixo = "id") {

    return (
        prefixo +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function salvarJSON(chave, dados) {

    localStorage.setItem(
        chave,
        JSON.stringify(dados)
    );

}


function carregarJSON(chave, padrao = []) {

    try {

        const valor =
            localStorage.getItem(chave);

        if (!valor) {
            return padrao;
        }

        const dados =
            JSON.parse(valor);

        return dados;

    } catch (erro) {

        console.error(
            "Erro ao carregar:",
            chave,
            erro
        );

        return padrao;

    }

}


function mostrarToast(mensagem) {

    const toast = $("toast");

    if (!toast) {
        return;
    }

    toast.textContent = mensagem;

    toast.classList.add("mostrar");

    clearTimeout(
        mostrarToast.timer
    );

    mostrarToast.timer =
        setTimeout(() => {

            toast.classList.remove(
                "mostrar"
            );

        }, 3000);

}


/* ============================================================
   BANCO DE FOTOS — INDEXEDDB
============================================================ */

let bancoFotos = null;


function abrirBancoFotos() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    CONFIG_ADMIN.bancoFotos.nome,
                    CONFIG_ADMIN.bancoFotos.versao
                );


            request.onupgradeneeded =
                function(evento) {

                    const banco =
                        evento.target.result;

                    if (
                        !banco.objectStoreNames.contains(
                            CONFIG_ADMIN.bancoFotos.store
                        )
                    ) {

                        const store =
                            banco.createObjectStore(
                                CONFIG_ADMIN.bancoFotos.store,
                                {
                                    keyPath: "id"
                                }
                            );

                        store.createIndex(
                            "galeriaId",
                            "galeriaId",
                            {
                                unique: false
                            }
                        );

                    }

                };


            request.onsuccess =
                function(evento) {

                    bancoFotos =
                        evento.target.result;

                    resolve(
                        bancoFotos
                    );

                };


            request.onerror =
                function(evento) {

                    reject(
                        evento.target.error
                    );

                };

        }
    );

}


function salvarFotoBanco(foto) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                bancoFotos.transaction(
                    [CONFIG_ADMIN.bancoFotos.store],
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    CONFIG_ADMIN.bancoFotos.store
                );

            const request =
                store.put(foto);

            request.onsuccess =
                () => resolve();

            request.onerror =
                () => reject(
                    request.error
                );

        }
    );

}


function buscarTodasFotosBanco() {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                bancoFotos.transaction(
                    [CONFIG_ADMIN.bancoFotos.store],
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    CONFIG_ADMIN.bancoFotos.store
                );

            const request =
                store.getAll();

            request.onsuccess =
                () => resolve(
                    request.result || []
                );

            request.onerror =
                () => reject(
                    request.error
                );

        }
    );

}


function excluirFotoBanco(id) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                bancoFotos.transaction(
                    [CONFIG_ADMIN.bancoFotos.store],
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    CONFIG_ADMIN.bancoFotos.store
                );

            const request =
                store.delete(id);

            request.onsuccess =
                () => resolve();

            request.onerror =
                () => reject(
                    request.error
                );

        }
    );

}


/* ============================================================
   CONVERSÃO DE IMAGEM
============================================================ */

function arquivoParaDataURL(arquivo) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(
                    reader.result
                );

            reader.onerror =
                () => reject(
                    reader.error
                );

            reader.readAsDataURL(
                arquivo
            );

        }
    );

}


/* ============================================================
   LOGIN
============================================================ */

function obterSenha() {

    const senhaSalva =
        localStorage.getItem(
            CONFIG_ADMIN.storage.senha
        );

    if (senhaSalva) {
        return senhaSalva;
    }

    localStorage.setItem(
        CONFIG_ADMIN.storage.senha,
        CONFIG_ADMIN.senhaPadrao
    );

    return CONFIG_ADMIN.senhaPadrao;

}


function usuarioEstaLogado() {

    return (
        sessionStorage.getItem(
            CONFIG_ADMIN.storage.sessao
        ) === "true"
    );

}


function entrarSistema() {

    sessionStorage.setItem(
        CONFIG_ADMIN.storage.sessao,
        "true"
    );

    $("loginScreen").hidden = true;

    $("adminApp").hidden = false;

    atualizarTudo();

}


function sairSistema() {

    sessionStorage.removeItem(
        CONFIG_ADMIN.storage.sessao
    );

    $("adminApp").hidden = true;

    $("loginScreen").hidden = false;

    $("senhaAdmin").value = "";

}


function configurarLogin() {

    const form =
        $("loginForm");

    form.addEventListener(
        "submit",
        function(evento) {

            evento.preventDefault();

            const senha =
                $("senhaAdmin").value;

            const senhaCorreta =
                obterSenha();

            if (senha === senhaCorreta) {

                $("loginMensagem").textContent =
                    "";

                entrarSistema();

                return;

            }

            $("loginMensagem").textContent =
                "Senha incorreta.";

        }
    );


    $("btnSair")
        .addEventListener(
            "click",
            sairSistema
        );

}


/* ============================================================
   NAVEGAÇÃO
============================================================ */

const nomesSecoes = {

    dashboard: "Dashboard",

    galerias: "Galerias",

    fotos: "Fotos",

    clientes: "Clientes",

    favoritos: "Favoritos",

    configuracoes: "Configurações"

};


function abrirSecao(nome) {

    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(
            (secao) => {

                secao.hidden =
                    secao.id !==
                    "section-" + nome;

            }
        );


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            (botao) => {

                botao.classList.toggle(
                    "ativo",
                    botao.dataset.section === nome
                );

            }
        );


    $("tituloSecao").textContent =
        nomesSecoes[nome] ||
        "Dashboard";


    fecharSidebarMobile();


    if (nome === "dashboard") {
        atualizarDashboard();
    }

    if (nome === "galerias") {
        renderizarGalerias();
    }

    if (nome === "fotos") {
        renderizarFotos();
    }

    if (nome === "clientes") {
        renderizarClientes();
    }

    if (nome === "favoritos") {
        renderizarFavoritos();
    }

}


function configurarNavegacao() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            (botao) => {

                botao.addEventListener(
                    "click",
                    () => {

                        abrirSecao(
                            botao.dataset.section
                        );

                    }
                );

            }
        );

}


/* ============================================================
   SIDEBAR MOBILE
============================================================ */

function abrirSidebarMobile() {

    $("sidebar")
        .classList.add(
            "aberta"
        );

    $("sidebarOverlay")
        .classList.add(
            "ativo"
        );

}


function fecharSidebarMobile() {

    $("sidebar")
        .classList.remove(
            "aberta"
        );

    $("sidebarOverlay")
        .classList.remove(
            "ativo"
        );

}


function configurarSidebar() {

    $("btnAbrirSidebar")
        .addEventListener(
            "click",
            abrirSidebarMobile
        );


    $("btnFecharSidebar")
        .addEventListener(
            "click",
            fecharSidebarMobile
        );


    $("sidebarOverlay")
        .addEventListener(
            "click",
            fecharSidebarMobile
        );

}


/* ============================================================
   GALERIAS
============================================================ */

function inicializarDados() {

    galerias =
        carregarJSON(
            CONFIG_ADMIN.storage.galerias,
            []
        );

    clientes =
        carregarJSON(
            CONFIG_ADMIN.storage.clientes,
            []
        );

    favoritos =
        carregarJSON(
            CONFIG_ADMIN.storage.favoritos,
            []
        );


    if (!galerias.length) {

        galerias = [

            {
                id: "galeria_casamentos",
                nome: "Casamentos",
                descricao:
                    "Momentos especiais de casamentos."
            },

            {
                id: "galeria_familia",
                nome: "Família",
                descricao:
                    "Ensaios e momentos em família."
            },

            {
                id: "galeria_ensaios",
                nome: "Ensaios",
                descricao:
                    "Ensaios fotográficos."
            },

            {
                id: "galeria_eventos",
                nome: "Eventos",
                descricao:
                    "Eventos e comemorações."
            }

        ];

        salvarJSON(
            CONFIG_ADMIN.storage.galerias,
            galerias
        );

    }

}


function renderizarGalerias() {

    const lista =
        $("listaGalerias");

    lista.innerHTML = "";

    if (!galerias.length) {

        lista.innerHTML = `
            <div class="estado-vazio">
                Nenhuma galeria cadastrada.
            </div>
        `;

        return;

    }


    galerias.forEach(
        (galeria) => {

            const quantidade =
                fotos.filter(
                    foto =>
                        foto.galeriaId ===
                        galeria.id
                ).length;


            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "admin-card";


            card.innerHTML = `

                <h3>
                    ${escaparHTML(galeria.nome)}
                </h3>

                <p>
                    ${escaparHTML(
                        galeria.descricao ||
                        "Sem descrição."
                    )}
                </p>

                <span class="card-meta">
                    ${quantidade} foto(s)
                </span>

                <div class="card-acoes">

                    <button
                        type="button"
                        class="btn-pequeno"
                        data-editar-galeria="${galeria.id}"
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        class="btn-pequeno btn-excluir"
                        data-excluir-galeria="${galeria.id}"
                    >
                        Excluir
                    </button>

                </div>

            `;


            lista.appendChild(card);

        }
    );


    lista
        .querySelectorAll(
            "[data-editar-galeria]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        abrirModalGaleria(
                            botao.dataset.editarGaleria
                        );

                    }
                );

            }
        );


    lista
        .querySelectorAll(
            "[data-excluir-galeria]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        excluirGaleria(
                            botao.dataset.excluirGaleria
                        );

                    }
                );

            }
        );

}


function abrirModalGaleria(id = null) {

    galeriaEditando = id;

    $("formGaleria").reset();

    if (id) {

        const galeria =
            galerias.find(
                item =>
                    item.id === id
            );

        if (!galeria) {
            return;
        }

        $("modalGaleriaTitulo")
            .textContent =
            "Editar galeria";

        $("galeriaId").value =
            galeria.id;

        $("galeriaNome").value =
            galeria.nome;

        $("galeriaDescricao").value =
            galeria.descricao || "";

    } else {

        $("modalGaleriaTitulo")
            .textContent =
            "Nova galeria";

        $("galeriaId").value =
            "";

    }


    abrirModal(
        "modalGaleria"
    );

}


function salvarGaleria(evento) {

    evento.preventDefault();


    const nome =
        $("galeriaNome")
            .value
            .trim();

    const descricao =
        $("galeriaDescricao")
            .value
            .trim();


    if (!nome) {
        return;
    }


    if (galeriaEditando) {

        const galeria =
            galerias.find(
                item =>
                    item.id ===
                    galeriaEditando
            );

        if (galeria) {

            galeria.nome =
                nome;

            galeria.descricao =
                descricao;

        }

    } else {

        galerias.push({

            id: gerarId(
                "galeria"
            ),

            nome,

            descricao

        });

    }


    salvarJSON(
        CONFIG_ADMIN.storage.galerias,
        galerias
    );


    fecharTodosModais();

    renderizarGalerias();

    preencherSelectsGalerias();

    atualizarDashboard();

    mostrarToast(
        "Galeria salva com sucesso."
    );

}


async function excluirGaleria(id) {

    const galeria =
        galerias.find(
            item =>
                item.id === id
        );

    if (!galeria) {
        return;
    }


    const possuiFotos =
        fotos.some(
            foto =>
                foto.galeriaId === id
        );


    if (possuiFotos) {

        alert(
            "Esta galeria possui fotos. Exclua as fotos primeiro."
        );

        return;

    }


    if (
        !confirm(
            `Excluir a galeria "${galeria.nome}"?`
        )
    ) {
        return;
    }


    galerias =
        galerias.filter(
            item =>
                item.id !== id
        );


    salvarJSON(
        CONFIG_ADMIN.storage.galerias,
        galerias
    );


    renderizarGalerias();

    preencherSelectsGalerias();

    atualizarDashboard();

    mostrarToast(
        "Galeria excluída."
    );

}


/* ============================================================
   SELECTS DE GALERIAS
============================================================ */

function preencherSelectsGalerias() {

    const filtro =
        $("filtroGaleria");

    const selectFoto =
        $("fotoGaleria");


    filtro.innerHTML = `
        <option value="todas">
            Todas as galerias
        </option>
    `;


    selectFoto.innerHTML = "";


    galerias.forEach(
        galeria => {

            const optionFiltro =
                document.createElement(
                    "option"
                );

            optionFiltro.value =
                galeria.id;

            optionFiltro.textContent =
                galeria.nome;

            filtro.appendChild(
                optionFiltro
            );


            const optionFoto =
                document.createElement(
                    "option"
                );

            optionFoto.value =
                galeria.id;

            optionFoto.textContent =
                galeria.nome;

            selectFoto.appendChild(
                optionFoto
            );

        }
    );

}


/* ============================================================
   FOTOS
============================================================ */

async function carregarFotos() {

    if (!bancoFotos) {
        return;
    }

    try {

        fotos =
            await buscarTodasFotosBanco();

        fotos.sort(
            (a,b) =>
                (b.criadoEm || 0) -
                (a.criadoEm || 0)
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar fotos:",
            erro
        );

        fotos = [];

    }

}


function obterNomeGaleria(id) {

    const galeria =
        galerias.find(
            item =>
                item.id === id
        );

    return galeria
        ? galeria.nome
        : "Galeria não encontrada";

}


function renderizarFotos() {

    const lista =
        $("listaFotos");

    const filtro =
        $("filtroGaleria").value;


    lista.innerHTML = "";


    const fotosFiltradas =
        filtro === "todas"
            ? fotos
            : fotos.filter(
                foto =>
                    foto.galeriaId ===
                    filtro
            );


    $("contadorFotosPagina")
        .textContent =
        fotosFiltradas.length;


    if (!fotosFiltradas.length) {

        lista.innerHTML = `
            <div class="estado-vazio">
                Nenhuma foto cadastrada.
            </div>
        `;

        return;

    }


    fotosFiltradas.forEach(
        foto => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "foto-admin-card";


            const imagem =
                document.createElement(
                    "img"
                );

            imagem.src =
                foto.data;

            imagem.alt =
                foto.nome || "Foto";


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "foto-admin-info";


            info.innerHTML = `

                <strong>
                    ${escaparHTML(
                        foto.nome
                    )}
                </strong>

                <small>
                    ${escaparHTML(
                        obterNomeGaleria(
                            foto.galeriaId
                        )
                    )}
                </small>

                <div class="foto-acoes">

                    <button
                        type="button"
                        class="btn-pequeno btn-excluir"
                        data-excluir-foto="${foto.id}"
                    >
                        Excluir
                    </button>

                </div>

            `;


            card.appendChild(
                imagem
            );

            card.appendChild(
                info
            );

            lista.appendChild(
                card
            );

        }
    );


    lista
        .querySelectorAll(
            "[data-excluir-foto]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        excluirFoto(
                            botao.dataset.excluirFoto
                        );

                    }
                );

            }
        );

}


function atualizarCapacidadeFotos() {

    const total =
        fotos.length;

    const porcentagem =
        Math.min(
            100,
            (
                total /
                CONFIG_ADMIN.limiteFotos
            ) * 100
        );


    $("quantidadeFotosAtual")
        .textContent =
        total;


    $("storageProgress")
        .style.width =
        porcentagem + "%";


    $("totalFotos")
        .textContent =
        total;

}


async function salvarFoto(evento) {

    evento.preventDefault();


    if (
        fotos.length >=
        CONFIG_ADMIN.limiteFotos
    ) {

        alert(
            "O limite de 1.500 fotos foi atingido."
        );

        return;

    }


    const galeriaId =
        $("fotoGaleria").value;

    const nome =
        $("fotoNome")
            .value
            .trim();

    const arquivo =
        $("fotoArquivo")
            .files[0];

    const liberada =
        $("fotoLiberada")
            .checked;


    if (!galeriaId) {

        alert(
            "Selecione uma galeria."
        );

        return;

    }


    if (!arquivo) {

        alert(
            "Selecione uma imagem."
        );

        return;

    }


    if (!arquivo.type.startsWith("image/")) {

        alert(
            "Selecione um arquivo de imagem válido."
        );

        return;

    }


    try {

        const data =
            await arquivoParaDataURL(
                arquivo
            );


        const foto = {

            id: gerarId(
                "foto"
            ),

            galeriaId,

            nome:
                nome ||
                arquivo.name,

            data,

            liberada,

            criadoEm:
                Date.now()

        };


        await salvarFotoBanco(
            foto
        );


        fotos.push(
            foto
        );


        fecharTodosModais();

        renderizarFotos();

        renderizarGalerias();

        atualizarDashboard();

        atualizarCapacidadeFotos();

        mostrarToast(
            "Foto adicionada com sucesso."
        );


    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Não foi possível salvar a foto."
        );

    }

}


async function excluirFoto(id) {

    const foto =
        fotos.find(
            item =>
                item.id === id
        );


    if (!foto) {
        return;
    }


    if (
        !confirm(
            `Excluir a foto "${foto.nome}"?`
        )
    ) {
        return;
    }


    try {

        await excluirFotoBanco(
            id
        );


        fotos =
            fotos.filter(
                item =>
                    item.id !== id
            );


        renderizarFotos();

        renderizarGalerias();

        atualizarDashboard();

        atualizarCapacidadeFotos();

        mostrarToast(
            "Foto excluída."
        );


    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Não foi possível excluir a foto."
        );

    }

}


/* ============================================================
   PREVIEW DA FOTO
============================================================ */

function configurarPreviewFoto() {

    $("fotoArquivo")
        .addEventListener(
            "change",
            function() {

                const arquivo =
                    this.files[0];

                const preview =
                    $("previewFoto");

                preview.innerHTML =
                    "";


                if (!arquivo) {
                    return;
                }


                const imagem =
                    document.createElement(
                        "img"
                    );

                imagem.src =
                    URL.createObjectURL(
                        arquivo
                    );


                preview.appendChild(
                    imagem
                );

            }
        );

}


/* ============================================================
   CLIENTES
============================================================ */

function renderizarClientes() {

    const lista =
        $("listaClientes");

    lista.innerHTML = "";


    if (!clientes.length) {

        lista.innerHTML = `
            <div class="estado-vazio">
                Nenhum cliente cadastrado.
            </div>
        `;

        return;

    }


    clientes.forEach(
        cliente => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "cliente-card";


            card.innerHTML = `

                <strong>
                    ${escaparHTML(
                        cliente.nome
                    )}
                </strong>

                <p>
                    ${escaparHTML(
                        cliente.email ||
                        "Sem e-mail"
                    )}
                </p>

                <p>
                    ${escaparHTML(
                        cliente.telefone ||
                        "Sem telefone"
                    )}
                </p>

                <div class="card-acoes">

                    <button
                        type="button"
                        class="btn-pequeno btn-excluir"
                        data-excluir-cliente="${cliente.id}"
                    >
                        Excluir
                    </button>

                </div>

            `;


            lista.appendChild(
                card
            );

        }
    );


    lista
        .querySelectorAll(
            "[data-excluir-cliente]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        excluirCliente(
                            botao.dataset.excluirCliente
                        );

                    }
                );

            }
        );

}


function salvarCliente(evento) {

    evento.preventDefault();


    const nome =
        $("clienteNome")
            .value
            .trim();

    const email =
        $("clienteEmail")
            .value
            .trim();

    const telefone =
        $("clienteTelefone")
            .value
            .trim();


    if (!nome) {
        return;
    }


    clientes.push({

        id:
            gerarId(
                "cliente"
            ),

        nome,

        email,

        telefone,

        criadoEm:
            Date.now()

    });


    salvarJSON(
        CONFIG_ADMIN.storage.clientes,
        clientes
    );


    fecharTodosModais();

    renderizarClientes();

    atualizarDashboard();

    mostrarToast(
        "Cliente cadastrado."
    );

}


function excluirCliente(id) {

    if (
        !confirm(
            "Excluir este cliente?"
        )
    ) {
        return;
    }


    clientes =
        clientes.filter(
            cliente =>
                cliente.id !== id
        );


    salvarJSON(
        CONFIG_ADMIN.storage.clientes,
        clientes
    );


    renderizarClientes();

    atualizarDashboard();

    mostrarToast(
        "Cliente excluído."
    );

}


/* ============================================================
   FAVORITOS
============================================================ */

function renderizarFavoritos() {

    const lista =
        $("listaFavoritos");

    lista.innerHTML = "";


    if (!favoritos.length) {

        lista.innerHTML = `
            <div class="estado-vazio">
                Nenhum favorito registrado.
            </div>
        `;

        return;

    }


    favoritos.forEach(
        favorito => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "favorito-card";


            card.innerHTML = `

                <strong>
                    ${escaparHTML(
                        favorito.nome ||
                        "Favorito"
                    )}
                </strong>

                <p>
                    Foto:
                    ${escaparHTML(
                        favorito.fotoId ||
                        "-"
                    )}
                </p>

            `;


            lista.appendChild(
                card
            );

        }
    );

}


/* ============================================================
   CONFIGURAÇÕES
============================================================ */

function carregarConfiguracoes() {

    const whatsapp =
        localStorage.getItem(
            CONFIG_ADMIN.storage.whatsapp
        );


    if (whatsapp) {

        $("configWhatsApp")
            .value =
            whatsapp;

    }

}


function salvarWhatsApp() {

    const numero =
        $("configWhatsApp")
            .value
            .trim();


    if (!numero) {

        alert(
            "Digite o número do WhatsApp."
        );

        return;

    }


    localStorage.setItem(
        CONFIG_ADMIN.storage.whatsapp,
        numero
    );


    mostrarToast(
        "WhatsApp salvo."
    );

}


function alterarSenha() {

    const nova =
        $("novaSenha")
            .value;

    const confirmar =
        $("confirmarSenha")
            .value;


    if (!nova || nova.length < 4) {

        alert(
            "A senha deve ter pelo menos 4 caracteres."
        );

        return;

    }


    if (nova !== confirmar) {

        alert(
            "As senhas não são iguais."
        );

        return;

    }


    localStorage.setItem(
        CONFIG_ADMIN.storage.senha,
        nova
    );


    $("novaSenha").value =
        "";

    $("confirmarSenha").value =
        "";


    mostrarToast(
        "Senha alterada com sucesso."
    );

}


/* ============================================================
   MODAIS
============================================================ */

function abrirModal(id) {

    const modal =
        $(id);

    if (!modal) {
        return;
    }

    modal.hidden =
        false;

}


function fecharModal(id) {

    const modal =
        $(id);

    if (!modal) {
        return;
    }

    modal.hidden =
        true;

}


function fecharTodosModais() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal => {

                modal.hidden =
                    true;

            }
        );

}


function configurarModais() {

    document
        .querySelectorAll(
            "[data-fechar-modal]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    fecharTodosModais
                );

            }
        );


    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(
            overlay => {

                overlay.addEventListener(
                    "click",
                    fecharTodosModais
                );

            }
        );


    $("btnNovaGaleria")
        .addEventListener(
            "click",
            () => {

                abrirModalGaleria();

            }
        );


    $("btnNovaFoto")
        .addEventListener(
            "click",
            () => {

                $("formFoto").reset();

                $("previewFoto")
                    .innerHTML =
                    "";

                abrirModal(
                    "modalFoto"
                );

            }
        );


    $("btnNovoCliente")
        .addEventListener(
            "click",
            () => {

                $("formCliente")
                    .reset();

                abrirModal(
                    "modalCliente"
                );

            }
        );

}


/* ============================================================
   DASHBOARD
============================================================ */

function atualizarDashboard() {

    $("totalGalerias")
        .textContent =
        galerias.length;


    $("totalFotos")
        .textContent =
        fotos.length;


    $("totalFavoritos")
        .textContent =
        favoritos.length;


    $("totalClientes")
        .textContent =
        clientes.length;


    atualizarCapacidadeFotos();

}


/* ============================================================
   ATUALIZAÇÃO GERAL
============================================================ */

function atualizarTudo() {

    atualizarDashboard();

    renderizarGalerias();

    renderizarFotos();

    renderizarClientes();

    renderizarFavoritos();

    preencherSelectsGalerias();

    carregarConfiguracoes();

}


/* ============================================================
   EVENTOS
============================================================ */

function configurarEventos() {

    $("formGaleria")
        .addEventListener(
            "submit",
            salvarGaleria
        );


    $("formFoto")
        .addEventListener(
            "submit",
            salvarFoto
        );


    $("formCliente")
        .addEventListener(
            "submit",
            salvarCliente
        );


    $("filtroGaleria")
        .addEventListener(
            "change",
            renderizarFotos
        );


    $("salvarWhatsApp")
        .addEventListener(
            "click",
            salvarWhatsApp
        );


    $("alterarSenha")
        .addEventListener(
            "click",
            alterarSenha
        );


    $("galeriaNome")
        .addEventListener(
            "input",
            () => {}
        );

}


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

async function iniciarAdmin() {

    inicializarDados();

    configurarLogin();

    configurarNavegacao();

    configurarSidebar();

    configurarModais();

    configurarPreviewFoto();

    configurarEventos();


    try {

        await abrirBancoFotos();

        await carregarFotos();

    } catch (erro) {

        console.error(
            "Banco de fotos:",
            erro
        );

        alert(
            "Não foi possível inicializar o banco de fotos."
        );

    }


    preencherSelectsGalerias();

    carregarConfiguracoes();

    atualizarTudo();


    if (usuarioEstaLogado()) {

        entrarSistema();

    } else {

        $("adminApp").hidden =
            true;

        $("loginScreen").hidden =
            false;

    }

}


document.addEventListener(
    "DOMContentLoaded",
    iniciarAdmin
);