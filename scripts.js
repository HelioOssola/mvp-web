const apiUrl = 'http://127.0.0.1:5000';

let editandoId = null;
let todosConsumos = [];
let idParaExcluir = null;

document.getElementById('consumoForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  let data = document.getElementById('data').value;
  const quantidade = document.getElementById('quantidade').value;

  try {
    let url = `${apiUrl}/consumos`;
    let method = 'POST';
    let msgSucesso = 'Registro adicionado com sucesso!';

    if (editandoId) {
      url = `${apiUrl}/consumos/${editandoId}`;
      method = 'PUT';
      msgSucesso = 'Registro atualizado com sucesso!';
    }

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, quantidade })
    });

    if (!response.ok) throw new Error('Erro ao salvar consumo.');

    mostrarToast(msgSucesso);
    document.getElementById('consumoForm').reset();
    editandoId = null;
    carregarConsumos();
  } catch (error) {
    console.error(error);
    mostrarToast('Erro ao salvar consumo.', true);
  }
});

async function carregarConsumos() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('mensagem-erro').style.display = 'none';
  try {
    const res = await fetch(`${apiUrl}/consumos`);
    if (!res.ok) throw new Error('Erro ao buscar registros.');

    todosConsumos = await res.json();
    todosConsumos.sort((a, b) => b.data.localeCompare(a.data));

    renderizarConsumos(todosConsumos);
  } catch (error) {
    console.error(error);
    mostrarToast('Erro ao carregar consumos.', true);
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
}

function renderizarConsumos(lista, mostrarTotal = false) {
  const listaElement = document.getElementById('consumoList');
  listaElement.innerHTML = '';

  let totalDia = 0;

  lista.forEach(consumo => {
    const dataFormatada = formatarData(consumo.data);
    totalDia += parseInt(consumo.quantidade);

    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';
    item.setAttribute('data-original', consumo.data);
    item.innerHTML = `
      <div class="mb-2 mb-md-0">
        <strong>Data:</strong> ${dataFormatada}<br>
        <strong>Quantidade:</strong> ${consumo.quantidade} ml
      </div>
      <div class="d-flex flex-shrink-0 gap-2">
        <button class="btn btn-secondary btn-sm btn-custom" onclick="editarConsumo(${consumo.id}, '${consumo.data}', ${consumo.quantidade})">Editar</button>
        <button class="btn btn-danger btn-sm btn-custom" onclick="abrirModalExcluir(${consumo.id})">Excluir</button>
      </div>
    `;
    listaElement.appendChild(item);
  });

  if (mostrarTotal && lista.length > 0) {
    const totalItem = document.createElement('li');
    totalItem.className = 'list-group-item text-center fw-bold';
    totalItem.innerText = `Total consumido no dia: ${totalDia} ml`;
    listaElement.appendChild(totalItem);

    if (totalDia >= 2000) {
      const msgItem = document.createElement('li');
      msgItem.className = 'list-group-item text-center text-success fw-bold';
      if (totalDia > 2000) {
        msgItem.innerText = '🥳 Uau! Você bebeu mais de 2000 ml de água hoje! Seu corpo agradece. Continue assim! 💙';
      } else {
        msgItem.innerText = '🥳 Uau! Você bebeu 2000 ml de água hoje! Seu corpo agradece. Continue assim! 💙';
      }
      listaElement.appendChild(msgItem);
    }
  }

  if (mostrarTotal && lista.length === 0) {
    const vazioItem = document.createElement('li');
    vazioItem.className = 'list-group-item text-center fw-bold';
    vazioItem.innerText = 'Nesse dia não foi registrado nenhum consumo de água.';
    listaElement.appendChild(vazioItem);
  }
}

function editarConsumo(id, data, quantidade) {
  document.getElementById('data').value = data;
  document.getElementById('quantidade').value = quantidade;
  editandoId = id;

  document.getElementById('quantidade').focus();
}

function abrirModalExcluir(id) {
  idParaExcluir = id;
  const modal = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
  modal.show();
}

document.getElementById('btnConfirmarExclusao').addEventListener('click', async function() {
  if (!idParaExcluir) return;

  try {
    const res = await fetch(`${apiUrl}/consumos/${idParaExcluir}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir.');

    mostrarToast('Registro excluído com sucesso!');
    carregarConsumos();
  } catch (error) {
    console.error(error);
    mostrarToast('Erro ao excluir consumo.', true);
  } finally {
    idParaExcluir = null;
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarExclusao'));
    modal.hide();
  }
});

function aplicarFiltro() {
  const termo = document.getElementById('busca').value.trim();
  const mensagemErro = document.getElementById('mensagem-erro');
  mensagemErro.style.display = 'none';

  if (termo === '') {
    renderizarConsumos(todosConsumos);
    return;
  }

  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = termo.match(regex);

  if (!match) {
    renderizarConsumos([]);
    mensagemErro.style.display = 'block';
    return;
  }

  const diaBusca = match[1];
  const mesBusca = match[2];
  const anoBusca = match[3];

  const hoje = new Date();
  const dataBusca = new Date(`${anoBusca}-${mesBusca}-${diaBusca}`);

  if (dataBusca > hoje) {
    renderizarConsumos([]);
    mensagemErro.style.display = 'block';
    return;
  }

  const filtrados = todosConsumos.filter(consumo => {
    const [ano, mes, dia] = consumo.data.split('-');
    return dia === diaBusca && mes === mesBusca && ano === anoBusca;
  });

  renderizarConsumos(filtrados, true);
}

function formatarData(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function setMaxDateToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const maxDate = `${yyyy}-${mm}-${dd}`;
  document.getElementById('data').setAttribute('max', maxDate);
}

function mostrarToast(mensagem, erro = false) {
  const toastEl = document.getElementById('toastMensagem');
  const toastTexto = document.getElementById('toastTexto');

  toastTexto.innerText = mensagem;

  if (erro) {
    toastEl.classList.remove('text-bg-success');
    toastEl.classList.add('text-bg-danger');
  } else {
    toastEl.classList.remove('text-bg-danger');
    toastEl.classList.add('text-bg-success');
  }

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

window.onload = () => {
  setMaxDateToday();
  carregarConsumos();
};
