const stockExitForm = document.querySelector('#stock-exit-form');
const productSelect = document.querySelector('#product-select');
const stockExitMessage = document.querySelector('#stock-exit-message');
const selectedProductName = document.querySelector('#selected-product-name');
const selectedProductStock = document.querySelector('#selected-product-stock');
const selectedProductMeta = document.querySelector('#selected-product-meta');
const movementsTable = document.querySelector('#movements-table');

let products = [];

function getSelectedProduct() {
  return products.find((product) => product.id === Number(productSelect.value));
}

function updateSelectedProduct() {
  const product = getSelectedProduct();

  if (!product) {
    selectedProductName.textContent = 'Nenhum produto selecionado';
    selectedProductStock.textContent = '0';
    selectedProductMeta.textContent = 'Selecione um produto para visualizar categoria, origem e unidade.';
    return;
  }

  selectedProductName.textContent = product.nome;
  selectedProductStock.textContent = `${Number(product.quantidade).toLocaleString('pt-BR')} ${product.unidade_medida}`;
  selectedProductMeta.textContent = `${product.categoria} | origem: ${product.origem}`;
}

async function loadProducts() {
  const data = await apiRequest('/api/produtos');
  products = data.data;

  productSelect.innerHTML = '<option value="">Selecione um produto</option>' + products.map((product) => `
    <option value="${product.id}">
      ${escapeHtml(product.nome)} - ${Number(product.quantidade).toLocaleString('pt-BR')} ${escapeHtml(product.unidade_medida)}
    </option>
  `).join('');

  updateSelectedProduct();
}

async function loadMovements() {
  const data = await apiRequest('/api/movimentacoes');

  if (!data.data.length) {
    movementsTable.innerHTML = emptyRow(6, 'Nenhuma movimentação registrada.');
    return;
  }

  movementsTable.innerHTML = data.data.slice(0, 10).map((movement) => `
    <tr>
      <td>${escapeHtml(movement.produto_nome)}</td>
      <td>${movement.tipo_movimentacao === 'entrada' ? 'Entrada' : 'Saída'}</td>
      <td>${Number(movement.quantidade).toLocaleString('pt-BR')} ${escapeHtml(movement.unidade_medida)}</td>
      <td>${escapeHtml(movement.origem_motivo)}</td>
      <td>${escapeHtml(movement.responsavel)}</td>
      <td>${formatDate(movement.data_movimentacao)}</td>
    </tr>
  `).join('');
}

productSelect.addEventListener('change', updateSelectedProduct);

stockExitForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const product = getSelectedProduct();
  const payload = readForm(stockExitForm);

  if (!product) {
    showMessage(stockExitMessage, 'Selecione um produto.');
    return;
  }

  if (Number(payload.quantidade) > Number(product.quantidade)) {
    showMessage(stockExitMessage, `Estoque insuficiente. Disponível: ${product.quantidade}.`);
    return;
  }

  try {
    const data = await apiRequest(`/api/produtos/${product.id}/saida`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    stockExitForm.reset();
    showMessage(stockExitMessage, data.message, true);
    await loadProducts();
    await loadMovements();
  } catch (error) {
    showMessage(stockExitMessage, error.message);
  }
});

loadProducts();
loadMovements();
