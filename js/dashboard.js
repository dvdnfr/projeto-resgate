const totalProdutos = document.querySelector('#total-produtos');
const totalEstoque = document.querySelector('#total-estoque');
const estoqueBaixo = document.querySelector('#estoque-baixo');
const recentEntries = document.querySelector('#recent-entries');
const recentExits = document.querySelector('#recent-exits');
const lowStockList = document.querySelector('#low-stock-list');

function renderMovementsRows(items, emptyText) {
  if (!items.length) {
    return emptyRow(4, emptyText);
  }

  return items.map((item) => `
    <tr>
      <td>${escapeHtml(item.produto_nome)}</td>
      <td>${Number(item.quantidade).toLocaleString('pt-BR')} ${escapeHtml(item.unidade_medida)}</td>
      <td>${escapeHtml(item.origem_motivo)}</td>
      <td>${formatDate(item.data_movimentacao)}</td>
    </tr>
  `).join('');
}

async function loadDashboard() {
  try {
    const data = await apiRequest('/api/dashboard');

    totalProdutos.textContent = data.cards.totalProdutos;
    totalEstoque.textContent = Number(data.cards.totalEstoque).toLocaleString('pt-BR');
    estoqueBaixo.textContent = data.cards.estoqueBaixo;

    recentEntries.innerHTML = renderMovementsRows(data.entradasRecentes, 'Nenhuma entrada registrada.');
    recentExits.innerHTML = renderMovementsRows(data.saidasRecentes, 'Nenhuma saída registrada.');

    lowStockList.innerHTML = data.produtosEstoqueBaixo.length
      ? data.produtosEstoqueBaixo.map((product) => `
        <div class="stack-item">
          <div>
            <strong>${escapeHtml(product.nome)}</strong>
            <span>${escapeHtml(product.categoria)}</span>
          </div>
          <strong>${Number(product.quantidade).toLocaleString('pt-BR')} ${escapeHtml(product.unidade_medida)}</strong>
        </div>
      `).join('')
      : '<p>Nenhum produto com estoque baixo.</p>';
  } catch (error) {
    recentEntries.innerHTML = emptyRow(4, error.message);
    recentExits.innerHTML = emptyRow(4, error.message);
  }
}

loadDashboard();
