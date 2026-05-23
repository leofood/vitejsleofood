import { useState, useCallback } from "react";

// ── SAMPLE DATA ──────────────────────────────────────────────────────────────
const SAMPLE_INSUMOS = [
  { id: 1, nome: "Salmão Fresco", unidadeCompra: "kg", precoCompra: 89.9, qtdEmbalagem: 1000, unidadeUso: "g" },
  { id: 2, nome: "Arroz para Sushi", unidadeCompra: "kg", precoCompra: 18.5, qtdEmbalagem: 1000, unidadeUso: "g" },
  { id: 3, nome: "Vinagre de Arroz", unidadeCompra: "L", precoCompra: 12.0, qtdEmbalagem: 1000, unidadeUso: "ml" },
  { id: 4, nome: "Alga Nori", unidadeCompra: "un", precoCompra: 0.8, qtdEmbalagem: 1, unidadeUso: "un" },
  { id: 5, nome: "Cream Cheese", unidadeCompra: "kg", precoCompra: 32.0, qtdEmbalagem: 1000, unidadeUso: "g" },
  { id: 6, nome: "Gergelim", unidadeCompra: "kg", precoCompra: 22.0, qtdEmbalagem: 1000, unidadeUso: "g" },
  { id: 7, nome: "Molho Shoyu", unidadeCompra: "L", precoCompra: 9.5, qtdEmbalagem: 1000, unidadeUso: "ml" },
  { id: 8, nome: "Açúcar Refinado", unidadeCompra: "kg", precoCompra: 5.8, qtdEmbalagem: 1000, unidadeUso: "g" },
];

const SAMPLE_FICHAS = [
  {
    id: 1, nome: "Temaki Salmão", rendimento: 1, cmv: 40,
    ingredientes: [
      { insumoId: 1, qtdLiquida: 80, fatorCorrecao: 1.1 },
      { insumoId: 4, qtdLiquida: 1, fatorCorrecao: 1.0 },
      { insumoId: 2, qtdLiquida: 100, fatorCorrecao: 1.0 },
      { insumoId: 5, qtdLiquida: 30, fatorCorrecao: 1.0 },
    ],
    embalagens: [
      { nome: "Cone de Papel", custo: 0.35 },
      { nome: "Sachê Shoyu", custo: 0.15 },
    ],
  },
  {
    id: 2, nome: "Combinado 10 Peças", rendimento: 1, cmv: 35,
    ingredientes: [
      { insumoId: 1, qtdLiquida: 120, fatorCorrecao: 1.1 },
      { insumoId: 4, qtdLiquida: 2, fatorCorrecao: 1.0 },
      { insumoId: 2, qtdLiquida: 200, fatorCorrecao: 1.0 },
      { insumoId: 6, qtdLiquida: 10, fatorCorrecao: 1.0 },
    ],
    embalagens: [
      { nome: "Bandeja Plástica", custo: 0.9 },
      { nome: "Filme Plástico", custo: 0.1 },
      { nome: "Sachê Shoyu x2", custo: 0.3 },
    ],
  },
];

const SAMPLE_CARDAPIO = [
  { fichaId: 1, qtdVendida: 120, precoVenda: 22.9 },
  { fichaId: 2, qtdVendida: 85, precoVenda: 48.5 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const calcCustoUso = (i) => i.qtdEmbalagem > 0 ? i.precoCompra / i.qtdEmbalagem : 0;

const calcCustoFicha = (ficha, insumos) => {
  const custoIngredientes = ficha.ingredientes.reduce((acc, ing) => {
    const insumo = insumos.find((x) => x.id === ing.insumoId);
    if (!insumo) return acc;
    return acc + calcCustoUso(insumo) * ing.qtdLiquida * ing.fatorCorrecao;
  }, 0);
  const custoEmbalagens = ficha.embalagens.reduce((acc, e) => acc + e.custo, 0);
  return (custoIngredientes + custoEmbalagens) / (ficha.rendimento || 1);
};

const fmt = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
const pct = (n) => `${Number(n).toFixed(1)}%`;

const downloadCSV = (filename, rows) => {
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  box:      "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  clipboard:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  chart:    "M18 20V10M12 20V4M6 20v-6",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  plus:     "M12 5v14M5 12h14",
  trash:    "M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2",
  check:    "M20 6L9 17l-5-5",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z",
};

// ── SCREEN 1: INSUMOS ─────────────────────────────────────────────────────────
function TelaInsumos({ insumos, setInsumos }) {
  const empty = { nome: "", unidadeCompra: "kg", precoCompra: "", qtdEmbalagem: "", unidadeUso: "g" };
  const [form, setForm] = useState(empty);
  const [saved, setSaved] = useState(false);

  const add = () => {
    if (!form.nome || !form.precoCompra || !form.qtdEmbalagem) return;
    setInsumos((p) => [...p, { ...form, id: Date.now(), precoCompra: +form.precoCompra, qtdEmbalagem: +form.qtdEmbalagem }]);
    setForm(empty);
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  const remove = (id) => setInsumos((p) => p.filter((i) => i.id !== id));

  const exportCSV = () => {
    const rows = [["Nome", "Un. Compra", "Preço (R$)", "Qtd Embalagem", "Un. Uso", "Custo/Un. Uso (R$)"],
      ...insumos.map((i) => [i.nome, i.unidadeCompra, i.precoCompra.toFixed(2), i.qtdEmbalagem, i.unidadeUso, calcCustoUso(i).toFixed(4)])];
    downloadCSV("insumos.csv", rows);
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Registo de Insumos</h2>
        <p className="subtitle">Cadastre seus ingredientes e veja o custo por unidade</p>
      </div>

      <div className="card form-card">
        <h3 className="card-title">Novo Insumo</h3>
        <div className="field">
          <label>Nome do Insumo</label>
          <input value={form.nome} onChange={set("nome")} placeholder="Ex: Salmão Fresco" />
        </div>
        <div className="row-2">
          <div className="field">
            <label>Un. Compra</label>
            <select value={form.unidadeCompra} onChange={set("unidadeCompra")}>
              {["kg","L","un"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Preço (R$)</label>
            <input type="number" value={form.precoCompra} onChange={set("precoCompra")} placeholder="0,00" />
          </div>
        </div>
        <div className="row-2">
          <div className="field">
            <label>Qtd na Embalagem</label>
            <input type="number" value={form.qtdEmbalagem} onChange={set("qtdEmbalagem")} placeholder="Ex: 1000" />
          </div>
          <div className="field">
            <label>Un. de Uso</label>
            <select value={form.unidadeUso} onChange={set("unidadeUso")}>
              {["g","ml","un"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        {form.precoCompra && form.qtdEmbalagem && (
          <div className="calc-preview">
            <span>Custo por {form.unidadeUso}:</span>
            <strong>{fmt(+form.precoCompra / +form.qtdEmbalagem)}</strong>
          </div>
        )}
        <button className={`btn-primary ${saved ? "btn-success" : ""}`} onClick={add}>
          {saved ? <><Icon d={ICONS.check} size={18}/> Guardado!</> : <><Icon d={ICONS.plus} size={18}/> Adicionar Insumo</>}
        </button>
      </div>

      <div className="section-header">
        <h3>Insumos Registados ({insumos.length})</h3>
        <button className="btn-export" onClick={exportCSV}>
          <Icon d={ICONS.download} size={16}/> Excel
        </button>
      </div>

      <div className="list">
        {insumos.map((i) => (
          <div className="list-item" key={i.id}>
            <div className="list-item-info">
              <span className="item-name">{i.nome}</span>
              <div className="item-meta">
                <span className="badge">{i.unidadeCompra}</span>
                <span>{fmt(i.precoCompra)} / {i.unidadeCompra}</span>
              </div>
            </div>
            <div className="list-item-right">
              <div className="cost-box">
                <span className="cost-label">/{i.unidadeUso}</span>
                <span className="cost-value">{fmt(calcCustoUso(i))}</span>
              </div>
              <button className="btn-icon btn-danger" onClick={() => remove(i.id)}>
                <Icon d={ICONS.trash} size={16}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SCREEN 2: FICHAS TÉCNICAS ─────────────────────────────────────────────────
function TelaFichas({ insumos, fichas, setFichas }) {
  const [view, setView] = useState("list"); // list | edit
  const [current, setCurrent] = useState(null);
  const [ingForm, setIngForm] = useState({ insumoId: "", qtdLiquida: "", fatorCorrecao: "1.0" });
  const [embForm, setEmbForm] = useState({ nome: "", custo: "" });

  const newFicha = () => {
    const f = { id: Date.now(), nome: "", rendimento: 1, cmv: 35, ingredientes: [], embalagens: [] };
    setFichas(p => [...p, f]);
    setCurrent(f.id);
    setView("edit");
  };

  const editFicha = (id) => { setCurrent(id); setView("edit"); };
  const deleteFicha = (id) => setFichas(p => p.filter(f => f.id !== id));

  const updateField = (field, value) =>
    setFichas(p => p.map(f => f.id === current ? { ...f, [field]: value } : f));

  const addIng = () => {
    if (!ingForm.insumoId || !ingForm.qtdLiquida) return;
    setFichas(p => p.map(f => f.id === current
      ? { ...f, ingredientes: [...f.ingredientes, { insumoId: +ingForm.insumoId, qtdLiquida: +ingForm.qtdLiquida, fatorCorrecao: +ingForm.fatorCorrecao || 1 }] }
      : f));
    setIngForm({ insumoId: "", qtdLiquida: "", fatorCorrecao: "1.0" });
  };

  const removeIng = (idx) =>
    setFichas(p => p.map(f => f.id === current ? { ...f, ingredientes: f.ingredientes.filter((_, i) => i !== idx) } : f));

  const addEmb = () => {
    if (!embForm.nome || !embForm.custo) return;
    setFichas(p => p.map(f => f.id === current
      ? { ...f, embalagens: [...f.embalagens, { nome: embForm.nome, custo: +embForm.custo }] }
      : f));
    setEmbForm({ nome: "", custo: "" });
  };

  const removeEmb = (idx) =>
    setFichas(p => p.map(f => f.id === current ? { ...f, embalagens: f.embalagens.filter((_, i) => i !== idx) } : f));

  const exportCSV = () => {
    const rows = [["Prato", "Rendimento", "CMV%", "Ingrediente", "Qtd Líquida", "Fator Correção", "Custo Item (R$)", "Custo Total (R$)"]];
    fichas.forEach(f => {
      const total = calcCustoFicha(f, insumos);
      f.ingredientes.forEach((ing, i) => {
        const ins = insumos.find(x => x.id === ing.insumoId);
        const custoItem = ins ? calcCustoUso(ins) * ing.qtdLiquida * ing.fatorCorrecao : 0;
        rows.push([i === 0 ? f.nome : "", i === 0 ? f.rendimento : "", i === 0 ? f.cmv : "", ins?.nome || "?", ing.qtdLiquida, ing.fatorCorrecao, custoItem.toFixed(4), i === 0 ? total.toFixed(4) : ""]);
      });
    });
    downloadCSV("fichas_tecnicas.csv", rows);
  };

  if (view === "edit") {
    const ficha = fichas.find(f => f.id === current);
    if (!ficha) { setView("list"); return null; }
    const custoTotal = calcCustoFicha(ficha, insumos);
    const custoIng = ficha.ingredientes.reduce((acc, ing) => {
      const ins = insumos.find(x => x.id === ing.insumoId);
      return acc + (ins ? calcCustoUso(ins) * ing.qtdLiquida * ing.fatorCorrecao : 0);
    }, 0);
    const custoEmb = ficha.embalagens.reduce((a, e) => a + e.custo, 0);
    const cmvReal = ficha.rendimento > 0 && custoTotal > 0 ? (custoTotal / (custoTotal / (ficha.cmv / 100))) * 100 : 0;

    return (
      <div className="screen">
        <div className="screen-header">
          <button className="btn-back" onClick={() => setView("list")}>← Fichas</button>
          <h2>Ficha Técnica</h2>
        </div>

        <div className="card form-card">
          <div className="field">
            <label>Nome do Prato</label>
            <input value={ficha.nome} onChange={e => updateField("nome", e.target.value)} placeholder="Ex: Temaki Salmão" />
          </div>
          <div className="row-2">
            <div className="field">
              <label>Rendimento (porções)</label>
              <input type="number" value={ficha.rendimento} onChange={e => updateField("rendimento", +e.target.value)} />
            </div>
            <div className="field">
              <label>CMV Máx (%)</label>
              <input type="number" value={ficha.cmv} onChange={e => updateField("cmv", +e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Ingredientes</h3>
          <div className="field">
            <label>Ingrediente</label>
            <select value={ingForm.insumoId} onChange={e => setIngForm(p => ({ ...p, insumoId: e.target.value }))}>
              <option value="">— Selecionar —</option>
              {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidadeUso})</option>)}
            </select>
          </div>
          <div className="row-2">
            <div className="field">
              <label>Qtd Líquida</label>
              <input type="number" value={ingForm.qtdLiquida} onChange={e => setIngForm(p => ({ ...p, qtdLiquida: e.target.value }))} placeholder="Ex: 80" />
            </div>
            <div className="field">
              <label>Fator Correção</label>
              <input type="number" step="0.01" value={ingForm.fatorCorrecao} onChange={e => setIngForm(p => ({ ...p, fatorCorrecao: e.target.value }))} />
            </div>
          </div>
          <button className="btn-secondary" onClick={addIng}><Icon d={ICONS.plus} size={16}/> Adicionar Ingrediente</button>

          {ficha.ingredientes.map((ing, idx) => {
            const ins = insumos.find(x => x.id === ing.insumoId);
            const custo = ins ? calcCustoUso(ins) * ing.qtdLiquida * ing.fatorCorrecao : 0;
            return (
              <div className="ing-row" key={idx}>
                <div className="ing-info">
                  <span className="ing-name">{ins?.nome || "?"}</span>
                  <span className="ing-detail">{ing.qtdLiquida}{ins?.unidadeUso} × {ing.fatorCorrecao}</span>
                </div>
                <div className="ing-cost">{fmt(custo)}</div>
                <button className="btn-icon btn-danger" onClick={() => removeIng(idx)}><Icon d={ICONS.trash} size={14}/></button>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3 className="card-title">Embalagens</h3>
          <div className="row-2">
            <div className="field">
              <label>Item</label>
              <input value={embForm.nome} onChange={e => setEmbForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Pote plástico" />
            </div>
            <div className="field">
              <label>Custo (R$)</label>
              <input type="number" value={embForm.custo} onChange={e => setEmbForm(p => ({ ...p, custo: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <button className="btn-secondary" onClick={addEmb}><Icon d={ICONS.plus} size={16}/> Adicionar Embalagem</button>

          {ficha.embalagens.map((e, idx) => (
            <div className="ing-row" key={idx}>
              <span className="ing-name">{e.nome}</span>
              <div className="ing-cost">{fmt(e.custo)}</div>
              <button className="btn-icon btn-danger" onClick={() => removeEmb(idx)}><Icon d={ICONS.trash} size={14}/></button>
            </div>
          ))}
        </div>

        <div className="card summary-card">
          <h3 className="card-title">Resumo de Custos</h3>
          <div className="summary-row"><span>Ingredientes</span><strong>{fmt(custoIng)}</strong></div>
          <div className="summary-row"><span>Embalagens</span><strong>{fmt(custoEmb)}</strong></div>
          <div className="summary-divider"/>
          <div className="summary-row total-row"><span>Custo Total / Porção</span><strong>{fmt(custoTotal)}</strong></div>
          <div className={`cmv-badge ${custoTotal > 0 && ficha.cmv > 0 ? "cmv-info" : "cmv-neutral"}`}>
            CMV-alvo: {ficha.cmv}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Fichas Técnicas</h2>
        <p className="subtitle">Composição e custo de cada prato</p>
      </div>
      <div className="section-header">
        <h3>Pratos ({fichas.length})</h3>
        <button className="btn-export" onClick={exportCSV}><Icon d={ICONS.download} size={16}/> Excel</button>
      </div>
      <button className="btn-primary" style={{marginBottom:12}} onClick={newFicha}><Icon d={ICONS.plus} size={18}/> Nova Ficha Técnica</button>
      <div className="list">
        {fichas.map(f => {
          const custo = calcCustoFicha(f, insumos);
          return (
            <div className="list-item clickable" key={f.id} onClick={() => editFicha(f.id)}>
              <div className="list-item-info">
                <span className="item-name">{f.nome || "(sem nome)"}</span>
                <div className="item-meta">
                  <span className="badge">{f.ingredientes.length} ing.</span>
                  <span>{f.embalagens.length} emb.</span>
                </div>
              </div>
              <div className="list-item-right">
                <div className="cost-box">
                  <span className="cost-label">custo</span>
                  <span className="cost-value">{fmt(custo)}</span>
                </div>
                <button className="btn-icon btn-danger" onClick={e => { e.stopPropagation(); deleteFicha(f.id); }}><Icon d={ICONS.trash} size={16}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SCREEN 3: CARDÁPIO ────────────────────────────────────────────────────────
function TelaCardapio({ fichas, insumos, cardapio, setCardapio }) {
  const getRow = (fichaId) => cardapio.find(c => c.fichaId === fichaId) || { fichaId, qtdVendida: 0, precoVenda: 0 };
  const update = (fichaId, field, value) =>
    setCardapio(p => {
      const exists = p.find(c => c.fichaId === fichaId);
      if (exists) return p.map(c => c.fichaId === fichaId ? { ...c, [field]: +value } : c);
      return [...p, { fichaId, qtdVendida: 0, precoVenda: 0, [field]: +value }];
    });

  const totals = fichas.reduce((acc, f) => {
    const row = getRow(f.id);
    const custo = calcCustoFicha(f, insumos);
    const margem = row.precoVenda - custo;
    const receita = row.precoVenda * row.qtdVendida;
    const lucro = margem * row.qtdVendida;
    return { receita: acc.receita + receita, lucro: acc.lucro + lucro, custo: acc.custo + custo * row.qtdVendida };
  }, { receita: 0, lucro: 0, custo: 0 });

  const exportCSV = () => {
    const rows = [["Prato", "Custo (R$)", "Preço Venda (R$)", "Margem (R$)", "Margem (%)", "Qtd Vendida", "Receita (R$)", "Lucro (R$)"]];
    fichas.forEach(f => {
      const row = getRow(f.id);
      const custo = calcCustoFicha(f, insumos);
      const margem = row.precoVenda - custo;
      const margemPct = row.precoVenda > 0 ? (margem / row.precoVenda) * 100 : 0;
      rows.push([f.nome, custo.toFixed(2), row.precoVenda.toFixed(2), margem.toFixed(2), margemPct.toFixed(1), row.qtdVendida, (row.precoVenda * row.qtdVendida).toFixed(2), (margem * row.qtdVendida).toFixed(2)]);
    });
    downloadCSV("cardapio_lucro.csv", rows);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Cardápio & Lucro</h2>
        <p className="subtitle">Análise de rentabilidade mensal</p>
      </div>

      <div className="totals-bar">
        <div className="total-item">
          <span>Receita</span>
          <strong>{fmt(totals.receita)}</strong>
        </div>
        <div className="total-divider"/>
        <div className="total-item">
          <span>Custo</span>
          <strong className="text-danger">{fmt(totals.custo)}</strong>
        </div>
        <div className="total-divider"/>
        <div className="total-item">
          <span>Lucro</span>
          <strong className="text-success">{fmt(totals.lucro)}</strong>
        </div>
      </div>

      <div className="section-header" style={{marginTop:16}}>
        <h3>Pratos</h3>
        <button className="btn-export" onClick={exportCSV}><Icon d={ICONS.download} size={16}/> Excel</button>
      </div>

      <div className="list">
        {fichas.map(f => {
          const row = getRow(f.id);
          const custo = calcCustoFicha(f, insumos);
          const margem = row.precoVenda > 0 ? row.precoVenda - custo : 0;
          const margemPct = row.precoVenda > 0 ? (margem / row.precoVenda) * 100 : 0;
          const isGood = margemPct >= 50;
          const isOk = margemPct >= 30 && margemPct < 50;

          return (
            <div className="prato-card" key={f.id}>
              <div className="prato-header">
                <span className="item-name">{f.nome}</span>
                <span className={`margem-badge ${isGood ? "good" : isOk ? "ok" : "bad"}`}>
                  {row.precoVenda > 0 ? pct(margemPct) : "—"}
                </span>
              </div>
              <div className="prato-custo">Custo: {fmt(custo)}</div>
              <div className="prato-inputs">
                <div className="field-inline">
                  <label>Qtd Vendida/mês</label>
                  <input type="number" value={row.qtdVendida || ""} onChange={e => update(f.id, "qtdVendida", e.target.value)} placeholder="0" />
                </div>
                <div className="field-inline">
                  <label>Preço de Venda</label>
                  <input type="number" step="0.01" value={row.precoVenda || ""} onChange={e => update(f.id, "precoVenda", e.target.value)} placeholder="R$ 0,00" />
                </div>
              </div>
              {row.precoVenda > 0 && (
                <div className="prato-results">
                  <div className="result-item">
                    <span>Margem/unid.</span>
                    <strong className={margem >= 0 ? "text-success" : "text-danger"}>{fmt(margem)}</strong>
                  </div>
                  <div className="result-item">
                    <span>Receita mês</span>
                    <strong>{fmt(row.precoVenda * row.qtdVendida)}</strong>
                  </div>
                  <div className="result-item">
                    <span>Lucro mês</span>
                    <strong className={margem >= 0 ? "text-success" : "text-danger"}>{fmt(margem * row.qtdVendida)}</strong>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const [insumos, setInsumos] = useState(SAMPLE_INSUMOS);
  const [fichas, setFichas] = useState(SAMPLE_FICHAS);
  const [cardapio, setCardapio] = useState(SAMPLE_CARDAPIO);

  const tabs = [
    { label: "Insumos", icon: ICONS.box },
    { label: "Fichas", icon: ICONS.clipboard },
    { label: "Cardápio", icon: ICONS.chart },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0f1117;
          --surface: #1a1d27;
          --surface2: #22263a;
          --border: #2e3248;
          --accent: #f5a623;
          --accent2: #e8753a;
          --text: #eef0f8;
          --text2: #8b90a8;
          --success: #3ecf8e;
          --danger: #f16c6c;
          --warning: #f5c842;
          --radius: 14px;
          --radius-sm: 8px;
        }

        html, body, #root { height: 100%; }

        body {
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }

        #root {
          display: flex;
          flex-direction: column;
          max-width: 480px;
          margin: 0 auto;
          min-height: 100dvh;
          background: var(--bg);
          position: relative;
        }

        /* ── APP HEADER ── */
        .app-header {
          padding: 16px 20px 12px;
          background: linear-gradient(135deg, #1a1d27 0%, #0f1117 100%);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .app-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .app-header p { font-size: 12px; color: var(--text2); margin-top: 2px; }

        /* ── CONTENT AREA ── */
        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: 0 0 80px;
          scrollbar-width: none;
        }
        .content-area::-webkit-scrollbar { display: none; }

        /* ── SCREEN ── */
        .screen { padding: 16px 16px 0; }
        .screen-header { margin-bottom: 16px; }
        .screen-header h2 {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 700;
          letter-spacing: -0.3px;
        }
        .subtitle { font-size: 13px; color: var(--text2); margin-top: 4px; }
        .btn-back {
          background: none; border: none; color: var(--accent);
          font-family: 'Syne', sans-serif; font-weight: 600;
          font-size: 14px; cursor: pointer; padding: 0 0 8px;
        }

        /* ── CARDS ── */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 12px;
        }
        .form-card { border-left: 3px solid var(--accent); }
        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700;
          color: var(--accent); letter-spacing: 0.5px;
          text-transform: uppercase; margin-bottom: 14px;
        }

        /* ── FORM FIELDS ── */
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .field label { font-size: 12px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; }
        .field input, .field select {
          background: var(--surface2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          padding: 11px 13px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .field input:focus, .field select:focus { border-color: var(--accent); }
        .field input::placeholder { color: var(--text2); }
        .field select option { background: var(--surface2); }

        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .calc-preview {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(245,166,35,0.08);
          border: 1px solid rgba(245,166,35,0.2);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          margin-bottom: 12px;
          font-size: 13px; color: var(--text2);
        }
        .calc-preview strong { color: var(--accent); font-size: 15px; }

        /* ── BUTTONS ── */
        .btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: #fff; border: none; border-radius: var(--radius-sm);
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 15px; padding: 14px;
          cursor: pointer; width: 100%;
          transition: opacity 0.2s, transform 0.1s;
        }
        .btn-primary:active { transform: scale(0.98); }
        .btn-success { background: linear-gradient(135deg, var(--success), #2aaa75) !important; }

        .btn-secondary {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: var(--surface2);
          color: var(--text); border: 1.5px dashed var(--border); border-radius: var(--radius-sm);
          font-family: 'Inter', sans-serif; font-weight: 600;
          font-size: 14px; padding: 11px;
          cursor: pointer; width: 100%; margin-bottom: 12px;
          transition: border-color 0.2s;
        }
        .btn-secondary:hover { border-color: var(--accent); }

        .btn-export {
          display: flex; align-items: center; gap: 5px;
          background: rgba(245,166,35,0.1);
          border: 1px solid rgba(245,166,35,0.3);
          color: var(--accent);
          font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 20px;
          cursor: pointer; transition: background 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .btn-export:hover { background: rgba(245,166,35,0.2); }

        .btn-icon {
          background: none; border: none; cursor: pointer;
          padding: 6px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .btn-danger { color: var(--danger); }
        .btn-danger:hover { background: rgba(241,108,108,0.1); }

        /* ── SECTION HEADER ── */
        .section-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 10px;
        }
        .section-header h3 {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
        }

        /* ── LIST ── */
        .list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .list-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px;
          display: flex; align-items: center; gap: 10px;
        }
        .list-item.clickable { cursor: pointer; transition: border-color 0.2s; }
        .list-item.clickable:hover { border-color: var(--accent); }
        .list-item-info { flex: 1; min-width: 0; }
        .item-name { display: block; font-weight: 600; font-size: 15px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); }
        .badge {
          background: var(--surface2); border: 1px solid var(--border);
          padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;
        }
        .list-item-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .cost-box { text-align: right; }
        .cost-label { display: block; font-size: 10px; color: var(--text2); text-transform: uppercase; }
        .cost-value { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--accent); }

        /* ── INGREDIENT ROWS ── */
        .ing-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .ing-row:last-of-type { border-bottom: none; }
        .ing-info { flex: 1; }
        .ing-name { display: block; font-size: 14px; font-weight: 500; }
        .ing-detail { font-size: 12px; color: var(--text2); }
        .ing-cost { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: var(--text); white-space: nowrap; }

        /* ── SUMMARY ── */
        .summary-card { border-color: rgba(245,166,35,0.3); }
        .summary-row {
          display: flex; justify-content: space-between;
          font-size: 14px; padding: 6px 0;
        }
        .total-row { font-size: 17px; font-weight: 700; }
        .total-row strong { color: var(--accent); font-family: 'Syne', sans-serif; }
        .summary-divider { border: none; border-top: 1px solid var(--border); margin: 8px 0; }
        .cmv-badge {
          margin-top: 10px; text-align: center;
          padding: 8px; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 600;
        }
        .cmv-info { background: rgba(245,166,35,0.1); color: var(--accent); }
        .cmv-neutral { background: var(--surface2); color: var(--text2); }

        /* ── TOTALS BAR ── */
        .totals-bar {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .total-item { flex: 1; text-align: center; }
        .total-item span { display: block; font-size: 11px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .total-item strong { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
        .total-divider { width: 1px; height: 36px; background: var(--border); }

        /* ── PRATO CARD ── */
        .prato-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 10px;
        }
        .prato-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .prato-custo { font-size: 12px; color: var(--text2); margin-bottom: 12px; }
        .prato-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .field-inline { display: flex; flex-direction: column; gap: 4px; }
        .field-inline label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; }
        .field-inline input {
          background: var(--surface2); border: 1.5px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text);
          font-size: 14px; padding: 9px 10px; outline: none;
          transition: border-color 0.2s; font-family: 'Inter', sans-serif;
        }
        .field-inline input:focus { border-color: var(--accent); }

        .prato-results {
          background: var(--surface2);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          display: flex; justify-content: space-between;
        }
        .result-item { text-align: center; }
        .result-item span { display: block; font-size: 10px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 3px; }
        .result-item strong { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; }

        .margem-badge {
          font-size: 13px; font-weight: 700;
          padding: 4px 10px; border-radius: 20px;
          font-family: 'Syne', sans-serif;
        }
        .good { background: rgba(62,207,142,0.15); color: var(--success); }
        .ok   { background: rgba(245,200,66,0.15); color: var(--warning); }
        .bad  { background: rgba(241,108,108,0.15); color: var(--danger); }

        .text-success { color: var(--success) !important; }
        .text-danger  { color: var(--danger) !important; }

        /* ── BOTTOM NAV ── */
        .bottom-nav {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 480px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          display: flex;
          padding: 8px 0 max(8px, env(safe-area-inset-bottom));
          z-index: 100;
        }
        .nav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          color: var(--text2); transition: color 0.2s; padding: 6px 0;
        }
        .nav-btn.active { color: var(--accent); }
        .nav-btn span { font-size: 11px; font-weight: 600; font-family: 'Syne', sans-serif; }
        .nav-indicator {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--accent);
          position: absolute; bottom: 6px;
          opacity: 0; transition: opacity 0.2s;
        }
        .nav-btn.active .nav-indicator { opacity: 1; }
      `}</style>

      <div className="app-header">
        <h1>🍱 KitchenCost</h1>
        <p>Gestão de cozinha & controlo de custos</p>
      </div>

      <div className="content-area">
        {tab === 0 && <TelaInsumos insumos={insumos} setInsumos={setInsumos} />}
        {tab === 1 && <TelaFichas insumos={insumos} fichas={fichas} setFichas={setFichas} />}
        {tab === 2 && <TelaCardapio fichas={fichas} insumos={insumos} cardapio={cardapio} setCardapio={setCardapio} />}
      </div>

      <nav className="bottom-nav">
        {tabs.map((t, i) => (
          <button key={i} className={`nav-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
            <Icon d={t.icon} size={22} />
            <span>{t.label}</span>
            <div className="nav-indicator" />
          </button>
        ))}
      </nav>
    </>
  );
}
