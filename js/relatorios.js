const reportTotalEntries = document.querySelector('#report-total-entries');
const reportTotalExits = document.querySelector('#report-total-exits');
const reportTotalStock = document.querySelector('#report-total-stock');
const mostMovedProducts = document.querySelector('#most-moved-products');
const latestMovements = document.querySelector('#latest-movements');

async function loadReports() {
  try {
    const data = await apiRequest('/api/relatorios');

    reportTotalEntries.textContent = data.entradas.totalEntradas;
    reportTotalExits.textContent = data.saidas.totalSaidas;
    reportTotalStock.textContent = Number(data.estoque.totalItensEstoque).toLocaleString('pt-BR');

    mostMovedProducts.innerHTML = data.produtosMaisMovimentados.length
      ? data.produtosMaisMovimentados.map((item) => `
        <div class="stack-item">
          <div>
            <strong>${escapeHtml(item.nome)}</strong>
            <span>${item.total_movimentacoes} movimentações</span>
          </div>
          <strong>${Number(item.quantidade_movimentada).toLocaleString('pt-BR')} ${escapeHtml(item.unidade_medida)}</strong>
        </div>
      `).join('')
      : '<p>Nenhum produto movimentado ainda.</p>';

    latestMovements.innerHTML = data.historicoMovimentacoes.length
      ? data.historicoMovimentacoes.map((item) => `
        <div class="stack-item">
          <div>
            <strong>${escapeHtml(item.produto_nome)}</strong>
            <span>${item.tipo_movimentacao === 'entrada' ? 'Entrada' : 'Saída'} - ${escapeHtml(item.origem_motivo)}</span>
          </div>
          <span>${Number(item.quantidade).toLocaleString('pt-BR')} ${escapeHtml(item.unidade_medida)} em ${formatDate(item.data_movimentacao)}</span>
        </div>
      `).join('')
      : '<p>Nenhuma movimentação cadastrada.</p>';
  } catch (error) {
    mostMovedProducts.innerHTML = `<p>${error.message}</p>`;
  }
}

loadReports();
