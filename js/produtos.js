const productForm = document.querySelector('#product-form');
const productMessage = document.querySelector('#product-message');
const productsTable = document.querySelector('#products-table');
const productFormTitle = document.querySelector('#product-form-title');
const clearProductForm = document.querySelector('#clear-product-form');
const newProductButton = document.querySelector('#new-product-button');
const searchProduct = document.querySelector('#search-product');
const filterCategory = document.querySelector('#filter-category');
const filterOrigin = document.querySelector('#filter-origin');
const summaryProducts = document.querySelector('#summary-products');
const summaryStock = document.querySelector('#summary-stock');
const summaryLowStock = document.querySelector('#summary-low-stock');
const validityAlert = document.querySelector('#validity-alert');

let products = [];

function resetProductForm() {
  productForm.reset();
  productForm.elements.id.value = '';
  productFormTitle.textContent = 'Novo produto';
  productForm.elements.quantidade.min = '0.01';
  showMessage(productMessage, '');
}

function getDaysUntilExpiry(dataValidade) {
  if (!dataValidade) {
    return null;
  }

  const dataTexto = String(dataValidade).substring(0, 10);
  const partes = dataTexto.split('-');

  if (partes.length !== 3) {
    return null;
  }

  const ano = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);

  if (!ano || !mes || !dia) {
    return null;
  }

  const validade = new Date(ano, mes - 1, dia);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diferencaMs = validade - hoje;

  return Math.ceil(
    diferencaMs / (1000 * 60 * 60 * 24)
  );
}

function getValidityStatus(dataValidade) {
  const diasRestantes = getDaysUntilExpiry(dataValidade);

  if (diasRestantes === null) {
    return '';
  }

  if (diasRestantes < 0) {
    return '<span class="validity-badge validity-expired">Vencido</span>';
  }

  if (diasRestantes === 0) {
    return '<span class="validity-badge validity-warning">Vence hoje</span>';
  }

  if (diasRestantes === 1) {
    return '<span class="validity-badge validity-warning">Vence amanhã</span>';
  }

  if (diasRestantes <= 7) {
    return `<span class="validity-badge validity-warning">Vence em ${diasRestantes} dias</span>`;
  }

  return '<span class="validity-badge validity-ok">Dentro da validade</span>';
}

function renderValidityAlert() {
  const productsNearExpiry = products.filter((product) => {
    const diasRestantes = getDaysUntilExpiry(product.data_validade);

    return (
      diasRestantes !== null &&
      diasRestantes >= 0 &&
      diasRestantes <= 7
    );
  });

  const expiredProducts = products.filter((product) => {
    const diasRestantes = getDaysUntilExpiry(product.data_validade);

    return diasRestantes !== null && diasRestantes < 0;
  });

  let messages = [];

  if (expiredProducts.length > 0) {
    messages.push(
      `🔴 <strong>${expiredProducts.length} produto(s) estão vencidos.</strong>`
    );
  }

  if (productsNearExpiry.length > 0) {
    messages.push(
      `🟡 <strong>${productsNearExpiry.length} produto(s) vencem nos próximos 7 dias.</strong>`
    );
  }

  if (messages.length === 0) {
    validityAlert.innerHTML = '';
    return;
  }

  validityAlert.innerHTML = `
    <div class="validity-alert">
      ${messages.join('<br>')}
    </div>
  `;
}

function renderProducts() {
  if (!products.length) {
    productsTable.innerHTML = emptyRow(8, 'Nenhum produto cadastrado.');
    return;
  }

  productsTable.innerHTML = products.map((product) => `
    <tr>
      <td>
        <strong>${escapeHtml(product.nome)}</strong>
        ${Number(product.quantidade) <= 5 ? '<span class="status-badge">Estoque baixo</span>' : ''}
      </td>
      <td>${escapeHtml(product.categoria)}</td>
      <td>${escapeHtml(product.origem)}</td>
      <td>${escapeHtml(product.doador_fornecedor || '-')}</td>
      <td>${Number(product.quantidade).toLocaleString('pt-BR')} ${escapeHtml(product.unidade_medida)}</td>
      <td>${formatDate(product.data_entrada)}</td>
      <td>
          ${product.data_validade ? formatDate(product.data_validade) : '-'}
          ${getValidityStatus(product.data_validade)}
      </td>
        <div class="actions">
          <button class="table-button" type="button" data-edit="${product.id}">Editar</button>
          <button class="danger-button" type="button" data-delete="${product.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function loadSummary() {
  const data = await apiRequest('/api/produtos/resumo');
  summaryProducts.textContent = data.data.totalProdutos;
  summaryStock.textContent = Number(data.data.totalEstoque).toLocaleString('pt-BR');
  summaryLowStock.textContent = data.data.estoqueBaixo || 0;
}

async function loadProducts() {
  const params = new URLSearchParams({
    busca: searchProduct.value.trim(),
    categoria: filterCategory.value,
    origem: filterOrigin.value
  });

  const data = await apiRequest(`/api/produtos?${params.toString()}`);
  products = data.data;
  renderProducts();
  renderValidityAlert();
  await loadSummary();
}

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = readForm(productForm);
  const id = payload.id;
  delete payload.id;

  try {
    const data = await apiRequest(id ? `/api/produtos/${id}` : '/api/produtos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });

    resetProductForm();
    showMessage(productMessage, data.message, true);
    await loadProducts();
  } catch (error) {
    showMessage(productMessage, error.message);
  }
});

productsTable.addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const product = products.find((item) => item.id === Number(editId));
    productForm.elements.id.value = product.id;
    productForm.elements.nome.value = product.nome;
    productForm.elements.categoria.value = product.categoria;
    productForm.elements.origem.value = product.origem;
    productForm.elements.doador_fornecedor.value = product.doador_fornecedor || '';
    productForm.elements.quantidade.value = product.quantidade;
    productForm.elements.quantidade.min = '0';
    productForm.elements.unidade_medida.value = product.unidade_medida;
    productForm.elements.data_entrada.value = toInputDate(product.data_entrada);
    productForm.elements.data_validade.value = toInputDate(product.data_validade);
    productForm.elements.observacoes.value = product.observacoes || '';
    productFormTitle.textContent = 'Editar produto';
    document.querySelector('#product-form-panel').scrollIntoView({ behavior: 'smooth' });
  }

  if (deleteId && confirm('Deseja realmente excluir este produto?')) {
    try {
      await apiRequest(`/api/produtos/${deleteId}`, { method: 'DELETE' });
      await loadProducts();
    } catch (error) {
      alert(error.message);
    }
  }
});

[searchProduct, filterCategory, filterOrigin].forEach((field) => {
  field.addEventListener('input', loadProducts);
});

newProductButton.addEventListener('click', () => {
  resetProductForm();
  document.querySelector('#product-form-panel').scrollIntoView({ behavior: 'smooth' });
});

clearProductForm.addEventListener('click', resetProductForm);
loadProducts();
