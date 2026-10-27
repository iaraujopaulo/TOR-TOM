(function () {
  "use strict";
  var D = window.D;
  var app = document.getElementById("app");
  var appbar = document.getElementById("appbar"), bottom = document.getElementById("bottom");
  var bottomLabel = document.getElementById("bottomLabel"), btnPrev = document.getElementById("btnPrev"), btnNext = document.getElementById("btnNext");
  var overlay = document.getElementById("overlay"), avatar = document.getElementById("avatar");

  // ---------- estado ----------
  function novoEstado() {
    return { ativ: "", imgUrl: "", imgNome: "", vidUrl: "", vidNome: "", jornada: "",
      grupoFR: null, fr: null, ff: null, fpm: [{ peso: "", dist: "", vezes: "", forcada: false }],
      fpd: {}, fee: {}, fcm: {}, fpb: null, pond: null,
      torConhecida: null, torManual: "", pr: {}, prOutra: "", abee: [{ desc: "", dur: "", vezes: "" }], pi: "", pcec: "", tm: "" };
  }
  var S = novoEstado();
  var passoAtual = "home";

  // ---------- utilidades ----------
  function h(tag, a, kids) {
    var n = document.createElement(tag);
    Object.keys(a || {}).forEach(function (k) {
      if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), a[k]);
      else if (k === "class") n.className = a[k];
      else if (k === "html") n.innerHTML = a[k];
      else if (k === "checked" || k === "value" || k === "disabled") n[k] = a[k];
      else n.setAttribute(k, a[k]);
    });
    [].concat(kids == null ? [] : kids).forEach(function (c) { if (c != null && c !== false) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function num(v) { var x = parseFloat(String(v).replace(",", ".")); return isNaN(x) ? 0 : x; }
  function temNum(v) { return String(v).trim() !== "" && !isNaN(parseFloat(String(v).replace(",", "."))); }
  function f1(x) { return (Math.round(x * 10) / 10).toFixed(1).replace(".", ","); }
  function fi(x) { return Math.round(x * 10) / 10 === Math.round(x) ? String(Math.round(x)) : f1(x); }

  // ---------- cálculos (extraídos do app original) ----------
  function calcFR() { return S.fr ? D.FR[S.fr.r][2][S.fr.c] : 0; }
  function calcFF() { return S.ff ? D.FF[S.ff.r][1][S.ff.c] : 0; }
  function fpmItem(it) {
    var carga = num(it.peso) * num(it.dist) * num(it.vezes), i = 0;
    while (i < D.FPM_lim.length && carga > D.FPM_lim[i]) i++;
    return { carga: carga, desc: (it.forcada ? D.FPM_B : D.FPM_A)[i], acima: i === D.FPM_lim.length };
  }
  function calcFPM() { return S.fpm.reduce(function (s, it) { return s + fpmItem(it).desc; }, 0); }
  function calcFPD() {
    var m = 0;
    Object.keys(S.fpd).forEach(function (k) {
      var p = k.split("|"), v = D.FPD[+p[0]][1][+p[1]][2] * D.FPD_tempo[S.fpd[k]][1];
      if (v > m) m = v;
    });
    return m;
  }
  function calcFEE() { var m = 0; Object.keys(S.fee).forEach(function (k) { var v = D.FEE[+k][2][S.fee[k]]; if (v > m) m = v; }); return m; }
  function calcFCM() { var n = Object.keys(S.fcm).filter(function (k) { return S.fcm[k]; }).length; return n > 5 ? 10 : n; }
  function calcFPB() { return S.fpb == null ? 0 : D.FPB[S.fpb][1]; }
  function ajustePond() { return S.pond == null ? 0 : D.PONDERACAO[S.pond][1]; }
  function calcTOM() { return 95 - calcFR() - calcFF() - calcFPM() - calcFPD() - calcFEE() - calcFCM() + ajustePond(); }
  function pctMin(lista) {
    var j = num(S.jornada); if (j <= 0) return 0;
    var tot = lista.reduce(function (s, x) { return s + num(x.dur) * (temNum(x.vezes) ? num(x.vezes) : 1); }, 0);
    return tot * 100 / j;
  }
  function prLista() { return D.PAUSAS.map(function (n) { return S.pr[n] || { dur: "", vezes: "" }; }); }
  function calcPR() { return pctMin(prLista()); }
  function calcABEE() { return pctMin(S.abee); }
  function calcTOR() {
    if (S.torConhecida) return num(S.torManual);
    return 100 - calcPR() - calcABEE() - num(S.pi) - num(S.pcec) - num(S.tm);
  }
  function faixa(d) {
    var T = D.T;
    if (d < -15) return { cls: "verde", txt: T.ok2 };
    if (d <= 0) return { cls: "verde", txt: T.ok };
    if (d <= 2) return { cls: "amarelo", txt: T.b1 };
    if (d <= 5) return { cls: "amarelo", txt: T.b2 };
    if (d <= 10) return { cls: "vermelho", txt: T.b3 };
    if (d <= 15) return { cls: "vermelho", txt: T.b4 };
    return { cls: "roxo", txt: T.b5 };
  }

  // ---------- fluxo ----------
  function passos() {
    var l = ["FR", "FF", "FPM", "FPD", "FEE", "FCM", "FPB", "TOM", "PRETOR"];
    if (S.torConhecida === false) l = l.concat(["PR", "ABEE", "PI", "PCEC", "TM", "TOR"]);
    return l.concat(["RESULT"]);
  }
  var TELAS = {};
  function ir(p) { passoAtual = p; TELAS[p](); window.scrollTo(0, 0); }
  function proximo() { var l = passos(), i = l.indexOf(passoAtual); if (i >= 0 && i < l.length - 1) ir(l[i + 1]); }
  function anterior() {
    var l = passos(), i = l.indexOf(passoAtual);
    if (i <= 0) ir("home"); else ir(l[i - 1]);
  }
  btnPrev.addEventListener("click", anterior);
  btnNext.addEventListener("click", proximo);
  document.getElementById("btnBack").addEventListener("click", anterior);
  avatar.addEventListener("click", verMidia);

  function moldura(titulo, labelRodape, podeAvancar, corpo, ultima) {
    appbar.classList.remove("d-none"); bottom.classList.remove("d-none");
    document.getElementById("appTitle").textContent = "AVALIAÇÃO";
    app.innerHTML = ""; app.appendChild(h("div", { class: "titulo-tela" }, titulo)); app.appendChild(corpo);
    bottomLabel.textContent = labelRodape || "";
    btnNext.disabled = !podeAvancar; btnNext.style.visibility = ultima ? "hidden" : "visible";
    avatar.style.backgroundImage = S.imgUrl ? "url('" + S.imgUrl + "')" : "";
  }
  // atualiza só o rodapé (evita redesenhar campos em edição)
  function rodape(label, ok) { bottomLabel.textContent = label; btnNext.disabled = !ok; }

  function verMidia() {
    var dlg = h("div", { class: "dlg" }, [h("h2", {}, S.ativ || "Atividade")]);
    if (S.imgUrl) dlg.appendChild(h("img", { src: S.imgUrl, alt: "Imagem da atividade" }));
    if (S.vidUrl) dlg.appendChild(h("video", { src: S.vidUrl, controls: "controls" }));
    if (!S.imgUrl && !S.vidUrl) dlg.appendChild(h("p", {}, "Nenhuma mídia adicionada."));
    dlg.appendChild(h("div", { class: "text-center" }, h("button", { class: "btn btn-marrom", onclick: fechar }, "Fechar")));
    abrir(dlg);
  }
  function abrir(dlg) { overlay.innerHTML = ""; overlay.appendChild(dlg); overlay.classList.remove("d-none"); }
  function fechar() { overlay.classList.add("d-none"); overlay.innerHTML = ""; }

  // ---------- componentes ----------
  function campoNum(label, val, on, ph) {
    return h("div", { class: "mb-2" }, [h("label", { class: "form-label small mb-1" }, label),
      h("input", { class: "form-control", type: "number", step: "any", min: "0", placeholder: ph || "", value: val, oninput: function (e) { on(e.target.value); } })]);
  }
  function campoTxt(label, val, on) {
    return h("div", { class: "mb-2" }, [h("label", { class: "form-label small mb-1" }, label),
      h("input", { class: "form-control", type: "text", value: val, oninput: function (e) { on(e.target.value); } })]);
  }
  function linha(a, b) { return h("div", { class: "linha" }, [h("span", {}, a), h("strong", {}, b)]); }
  function chip(txt, sel, on) { return h("span", { class: "chip" + (sel ? " sel" : ""), role: "button", onclick: on }, txt); }

  // ---------- telas ----------
  var ICON_VIDEO = '<svg width="64" height="48" viewBox="0 0 64 48"><rect x="0" y="6" width="46" height="36" rx="5" fill="#2196f3"/><path d="M64 6v36L48 30V18z" fill="#2196f3"/></svg>';
  var ICON_IMG = '<svg width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" rx="8" fill="#2196f3"/><path d="M6 46l16-18 10 11 7-7 15 14z" fill="#e3f2fd"/><circle cx="42" cy="18" r="5" fill="#e3f2fd"/></svg>';

  function telaHome() {
    appbar.classList.add("d-none"); bottom.classList.add("d-none");
    var vid = h("input", { type: "file", accept: "video/*", class: "d-none" });
    var img = h("input", { type: "file", accept: "image/*", class: "d-none" });
    var btnVid = h("button", { class: "media-btn" + (S.vidUrl ? " ok" : ""), type: "button", onclick: function () { vid.click(); } },
      [h("span", { html: ICON_VIDEO }), h("span", {}, S.vidNome ? "VÍDEO: " + S.vidNome : "ADICIONAR VIDEO\nDA ATIVIDADE")]);
    var btnImg = h("button", { class: "media-btn" + (S.imgUrl ? " ok" : ""), type: "button", onclick: function () { img.click(); } },
      [h("span", { html: ICON_IMG }), h("span", {}, S.imgNome ? "IMAGEM: " + S.imgNome : "ADICIONAR IMAGEM\nDA ATIVIDADE")]);
    btnVid.lastChild.style.whiteSpace = "pre-line"; btnVid.lastChild.style.textAlign = "center";
    btnImg.lastChild.style.whiteSpace = "pre-line"; btnImg.lastChild.style.textAlign = "center";
    var ini = h("button", { class: "btn-iniciar", type: "button", onclick: function () { ir("FR"); } }, "INICIAR AVALIAÇÃO");
    function valida() { ini.disabled = !(S.ativ.trim() && S.imgUrl); }
    vid.addEventListener("change", function () {
      var f = vid.files[0]; if (!f) return;
      if (S.vidUrl) URL.revokeObjectURL(S.vidUrl);
      S.vidUrl = URL.createObjectURL(f); S.vidNome = f.name; telaHome();
    });
    img.addEventListener("change", function () {
      var f = img.files[0]; if (!f) return;
      if (S.imgUrl) URL.revokeObjectURL(S.imgUrl);
      S.imgUrl = URL.createObjectURL(f); S.imgNome = f.name; telaHome();
    });
    var ativ = h("input", { class: "form-control campo-pill", type: "text", placeholder: "Qual atividade deseja avaliar?", value: S.ativ,
      oninput: function (e) { S.ativ = e.target.value; valida(); } });
    app.innerHTML = "";
    app.appendChild(h("div", {}, [
      h("img", { class: "home-logo", src: "assets/logo.png", alt: "TOR-TOM" }),
      h("div", { class: "obrig" }, "Obrigatório*"), ativ,
      h("div", { class: "mt-3" }, btnVid),
      h("div", { class: "obrig mt-2" }, "Obrigatório*"), btnImg,
      ini, vid, img,
      h("p", { class: "small text-muted mt-3" }, D.TERMO)]));
    valida();
  }

  function dialogoPrimeiroAcesso() {
    var visto = false; try { visto = localStorage.getItem("tt_visto") === "1"; } catch (e) {}
    if (visto) return;
    abrir(h("div", { class: "dlg" }, [
      h("h2", {}, "METODO TOR-TOM MEMBROS SUPERIORES"),
      h("p", {}, "Analisa a exigência ergonômica de trabalho com os membros superiores comparando o tempo em que o trabalhador executa a atividade durante a jornada (TOR) e o tempo que poderia executá-la (TOM). Sinaliza segurança ergonômica ou risco de lesões de membros superiores."),
      h("p", {}, "Autor principal: Hudson de Araújo Couto."),
      h("div", { class: "text-center" }, h("button", { class: "btn btn-marrom px-4", onclick: function () {
        try { localStorage.setItem("tt_visto", "1"); } catch (e) {} fechar(); } }, "Entendi"))]));
  }

  // grupos de opções com sub-linhas e colunas de pontuação
  function matrizGrupos(linhasDef, cols, sel, onSel, grupoSel, onGrupo) {
    var grupos = [], mapa = {};
    linhasDef.forEach(function (l, r) {
      var g = l.grupo || "";
      if (!(g in mapa)) { mapa[g] = []; grupos.push(g); }
      mapa[g].push({ l: l, r: r });
    });
    var box = h("div", {});
    grupos.forEach(function (g) {
      var aberto = grupoSel === g || (!g);
      var card = h("div", { class: "opt-card" + (grupoSel === g ? " sel" : "") });
      if (g) card.appendChild(h("div", { class: "head", onclick: function () { onGrupo(g); } }, [h("span", { class: "rad" }), h("span", {}, g)]));
      if (aberto) {
        var sub = h("div", { class: g ? "sub" : "" });
        mapa[g].forEach(function (x) {
          sub.appendChild(h("div", { class: "sub-row" }, [h("div", { class: "t" }, x.l.texto),
            h("div", {}, cols.map(function (c, i) {
              return chip(c + " (" + x.l.vals[i] + ")", sel && sel.r === x.r && sel.c === i, function () { onSel({ r: x.r, c: i }); });
            }))]));
        });
        card.appendChild(sub);
      }
      box.appendChild(card);
    });
    return box;
  }

  TELAS.home = telaHome;

  TELAS.FR = function () {
    var linhas = D.FR.map(function (x) { return { grupo: x[0], texto: x[1], vals: x[2] }; });
    if (S.grupoFR == null && S.fr) S.grupoFR = D.FR[S.fr.r][0];
    var corpo = matrizGrupos(linhas, D.FR_cols, S.fr,
      function (v) { S.fr = v; TELAS.FR(); },
      S.grupoFR, function (g) { S.grupoFR = g; if (S.fr && D.FR[S.fr.r][0] !== g) S.fr = null; TELAS.FR(); });
    moldura("FR - FATOR REPETITIVIDADE", S.fr ? "FR - PONTUAÇÃO TOTAL: " + calcFR() + " PONTOS" : "FR - PONTUAÇÃO TOTAL:", !!S.fr, corpo);
  };

  TELAS.FF = function () {
    var linhas = D.FF.map(function (x) { return { grupo: "", texto: x[0], vals: x[1] }; });
    var corpo = matrizGrupos(linhas, D.FF_cols, S.ff, function (v) { S.ff = v; TELAS.FF(); }, "", function () {});
    moldura("FF - FATOR FORÇA", S.ff ? "FF - PONTUAÇÃO TOTAL: " + calcFF() + " PONTOS" : "FF - PONTUAÇÃO TOTAL:", !!S.ff, corpo);
  };

  TELAS.FPM = function () {
    var corpo = h("div", {}, [h("p", { class: "small text-muted" }, "Movimentação de pesos e cargas. Carga = peso × distância × vezes por hora.")]);
    var infos = [];
    S.fpm.forEach(function (it, i) {
      var info = h("div", { class: "small mt-2" }); infos.push(info);
      corpo.appendChild(h("div", { class: "card-i" }, [
        h("div", { class: "row g-2" }, [
          h("div", { class: "col-4" }, campoNum("Peso(kg)", it.peso, function (v) { it.peso = v; atual(); })),
          h("div", { class: "col-4" }, campoNum("Distância(m)", it.dist, function (v) { it.dist = v; atual(); })),
          h("div", { class: "col-4" }, campoNum("Vezes (n/h)", it.vezes, function (v) { it.vezes = v; atual(); }))]),
        h("label", { class: "form-check" }, [h("input", { type: "checkbox", class: "form-check-input", checked: it.forcada, onchange: function (e) { it.forcada = e.target.checked; atual(); } }),
          h("span", { class: "form-check-label small" }, "Movimenta o peso estando sentado; ou de pé, porém com postura forçada da coluna")]),
        info,
        S.fpm.length > 1 ? h("button", { class: "btn btn-sm btn-outline-danger mt-2", onclick: function () { S.fpm.splice(i, 1); TELAS.FPM(); } }, "Remover") : null]));
    });
    corpo.appendChild(h("button", { class: "btn btn-outline-secondary btn-sm", onclick: function () { S.fpm.push({ peso: "", dist: "", vezes: "", forcada: false }); TELAS.FPM(); } }, "Adicionar item"));
    function atual() {
      S.fpm.forEach(function (it, i) { var r = fpmItem(it);
        infos[i].textContent = "Carga: " + f1(r.carga) + " → desconto " + r.desc + (r.acima ? " (acima do limite aceitável)" : ""); });
      rodape("FPM - PONTUAÇÃO TOTAL: " + calcFPM() + " PONTOS", true);
    }
    moldura("FPM - FATOR PESO MOVIMENTADO", "", true, corpo); atual();
  };

  TELAS.FPD = function () {
    var corpo = h("div", {}, [h("p", { class: "small text-muted" }, "Marque os desvios presentes e a parcela do tempo em que ocorrem. Vale o maior valor.")]);
    D.FPD.forEach(function (g, gi) {
      corpo.appendChild(h("h3", { class: "h6 mt-3" }, g[0]));
      g[1].forEach(function (o, oi) {
        var k = gi + "|" + oi, sel = S.fpd[k];
        corpo.appendChild(h("div", { class: "card-i d-flex gap-3 align-items-center flex-wrap" }, [
          h("img", { class: "thumb", src: "assets/" + o[1], alt: "" }),
          h("div", { class: "flex-grow-1" }, [h("div", {}, o[0] + " (" + o[2] + ")"),
            h("div", { class: "mt-1" }, [chip("Nenhum", sel == null, function () { delete S.fpd[k]; TELAS.FPD(); })]
              .concat(D.FPD_tempo.map(function (t, ti) { return chip(t[0], sel === ti, function () { S.fpd[k] = ti; TELAS.FPD(); }); })))])]));
      });
    });
    moldura("FPD - FATOR POSTURA EM DESVIO", "FPD - PONTUAÇÃO TOTAL: " + fi(calcFPD()) + " PONTOS", true, corpo);
  };

  TELAS.FEE = function () {
    var corpo = h("div", {}, [h("p", { class: "small text-muted" }, "Marque as posturas mantidas e a parcela da jornada ou ciclo. Vale o maior valor.")]);
    D.FEE.forEach(function (o, i) {
      var sel = S.fee[i];
      corpo.appendChild(h("div", { class: "card-i d-flex gap-3 align-items-center flex-wrap" }, [
        h("img", { class: "thumb", src: "assets/" + o[1], alt: "" }),
        h("div", { class: "flex-grow-1" }, [h("div", {}, o[0]),
          h("div", { class: "mt-1" }, [chip("Nenhum", sel == null, function () { delete S.fee[i]; TELAS.FEE(); })]
            .concat(D.FEE_cols.map(function (c, ci) { return chip(c + " (" + o[2][ci] + ")", sel === ci, function () { S.fee[i] = ci; TELAS.FEE(); }); })))])]));
    });
    moldura("FEE - FATOR ESFORÇO ESTÁTICO", "FEE - PONTUAÇÃO TOTAL: " + calcFEE() + " PONTOS", true, corpo);
  };

  TELAS.FCM = function () {
    var corpo = h("div", {}, [h("p", { class: "small text-muted" }, "Cada item marcado soma 1 ponto; acima de 5 itens o fator vale 10.")]);
    D.FCM.forEach(function (t, i) {
      corpo.appendChild(h("label", { class: "opt-card" + (S.fcm[i] ? " sel" : "") }, h("div", { class: "head" }, [
        h("input", { type: "checkbox", class: "form-check-input m-0", checked: !!S.fcm[i], onchange: function (e) { S.fcm[i] = e.target.checked; TELAS.FCM(); } }), h("span", {}, t)])));
    });
    moldura("FCM - FATOR CARGA MENTAL", "FCM - PONTUAÇÃO TOTAL: " + calcFCM() + " PONTOS", true, corpo);
  };

  TELAS.FPB = function () {
    var corpo = h("div", {}, [h("p", { class: "small text-muted" }, "Postura básica de trabalho. No aplicativo original ela gera alertas no relatório e não é subtraída na fórmula da TOM.")]);
    D.FPB.forEach(function (o, i) {
      corpo.appendChild(h("div", { class: "opt-card" + (S.fpb === i ? " sel" : ""), onclick: function () { S.fpb = i; TELAS.FPB(); } },
        h("div", { class: "head" }, [h("span", { class: "rad" }), h("span", {}, o[0] + " (" + o[1] + ")")])));
    });
    moldura("FPB - FATOR POSTURA BÁSICA", S.fpb == null ? "FPB - PONTUAÇÃO TOTAL:" : "FPB - PONTUAÇÃO TOTAL: " + calcFPB() + " PONTOS", true, corpo);
  };

  function breakdownTOM() {
    var p = ajustePond();
    return "95 - " + calcFR() + " - " + calcFF() + " - " + calcFPM() + " - " + fi(calcFPD()) + " - " + calcFEE() + " - " + calcFCM() +
      (p > 0 ? " + 5" : p < 0 ? " - 5" : "") + " = " + fi(calcTOM());
  }
  TELAS.TOM = function () {
    var corpo = h("div", {}, [
      h("div", { class: "fw-semibold mb-2" }, "Ponderação da TOM:"),
      h("div", {}, D.PONDERACAO.map(function (o, i) {
        return h("div", { class: "opt-card" + (S.pond === i ? " sel" : ""), onclick: function () { S.pond = i; TELAS.TOM(); } },
          h("div", { class: "head" }, [h("span", { class: "rad" }), h("span", {}, o[0])]));
      })),
      h("div", { class: "card-i" }, [
        linha("Fator repetitividade", calcFR() + "%"), linha("Fator força", calcFF() + "%"), linha("Fator peso movimentado", calcFPM() + "%"),
        linha("Fator postura em desvio", fi(calcFPD()) + "%"), linha("Fator esforço estático", calcFEE() + "%"), linha("Fator carga mental", calcFCM() + "%")]),
      S.pond == null ? h("div", { class: "small text-danger" }, "Obrigatório*: selecione a ponderação para calcular a TOM.") :
        h("div", { class: "calc" }, breakdownTOM())]);
    moldura("Cálculo da Taxa de Ocupação Máxima (TOM):", S.pond == null ? "TOM-FINAL:" : "TOM-FINAL: " + fi(calcTOM()) + "%", S.pond != null, corpo);
  };

  TELAS.PRETOR = function () {
    var corpo = h("div", {}, [
      h("div", { class: "opt-card" + (S.torConhecida === false ? " sel" : ""), onclick: function () { S.torConhecida = false; TELAS.PRETOR(); } },
        h("div", { class: "head" }, [h("span", { class: "rad" }), h("span", {}, "Não tenho o valor da TOR, preciso calcular.")])),
      h("div", { class: "opt-card" + (S.torConhecida === true ? " sel" : ""), onclick: function () { S.torConhecida = true; TELAS.PRETOR(); } },
        h("div", { class: "head" }, [h("span", { class: "rad" }), h("span", {}, "Já tenho o valor da TOR.")]))]);
    if (S.torConhecida === true) corpo.appendChild(campoNum("Informe o valor da TOR (%)", S.torManual, function (v) { S.torManual = v; rodape("TOR: " + (temNum(v) ? fi(num(v)) + "%" : ""), temNum(v)); }));
    var ok = S.torConhecida === false || (S.torConhecida === true && temNum(S.torManual));
    moldura("Cálculo da Taxa de Ocupação Real (TOR):", S.torConhecida === true && temNum(S.torManual) ? "TOR: " + fi(num(S.torManual)) + "%" : "", ok, corpo);
  };

  TELAS.PR = function () {
    var corpo = h("div", {}, [
      campoNum("Duração da Jornada: (minutos) *", S.jornada, function (v) { S.jornada = v; atual(); }),
      h("p", { class: "small text-muted" }, "Pausas regulares: informe a duração (min) e quantas vezes ocorrem na jornada.")]);
    var perc = [];
    D.PAUSAS.forEach(function (n, idx) {
      var it = S.pr[n] || (S.pr[n] = { dur: "", vezes: "" });
      var cab = [h("div", { class: "fw-semibold" }, n)];
      if (n === "Outras") cab.push(campoTxt("Informe qual a outra atividade", S.prOutra, function (v) { S.prOutra = v; }));
      var info = h("div", { class: "small text-muted" }); perc.push(info);
      corpo.appendChild(h("div", { class: "card-i" }, cab.concat([h("div", { class: "row g-2" }, [
        h("div", { class: "col-6" }, campoNum("Duração(min)", it.dur, function (v) { it.dur = v; atual(); })),
        h("div", { class: "col-6" }, campoNum("Vezes", it.vezes, function (v) { it.vezes = v; atual(); }))]), info])));
    });
    function atual() {
      D.PAUSAS.forEach(function (n, i) { var it = S.pr[n]; perc[i].textContent = "= " + f1(pctMin([it])) + "% da jornada"; });
      rodape("PR - PONTUAÇÃO TOTAL: " + f1(calcPR()) + "%", num(S.jornada) > 0);
    }
    moldura("PR - PAUSAS REGULARES", "", false, corpo); atual();
  };

  TELAS.ABEE = function () {
    var corpo = h("div", {}, [h("p", { class: "small text-muted" }, "Atividades de baixa exigência ergonômica: descrição, duração (min) e vezes na jornada.")]);
    var perc = [];
    S.abee.forEach(function (it, i) {
      var info = h("div", { class: "small text-muted" }); perc.push(info);
      corpo.appendChild(h("div", { class: "card-i" }, [
        campoTxt("Descrição da atividade", it.desc, function (v) { it.desc = v; }),
        h("div", { class: "row g-2" }, [
          h("div", { class: "col-6" }, campoNum("Duração(min)", it.dur, function (v) { it.dur = v; atual(); })),
          h("div", { class: "col-6" }, campoNum("Vezes", it.vezes, function (v) { it.vezes = v; atual(); }))]), info,
        S.abee.length > 1 ? h("button", { class: "btn btn-sm btn-outline-danger mt-2", onclick: function () { S.abee.splice(i, 1); TELAS.ABEE(); } }, "Remover") : null]));
    });
    corpo.appendChild(h("button", { class: "btn btn-outline-secondary btn-sm", onclick: function () { S.abee.push({ desc: "", dur: "", vezes: "" }); TELAS.ABEE(); } }, "Adicionar atividade"));
    function atual() {
      S.abee.forEach(function (it, i) { perc[i].textContent = "= " + f1(pctMin([it])) + "% da jornada"; });
      rodape("ABEE - PONTUAÇÃO TOTAL: " + f1(calcABEE()) + "%", true);
    }
    moldura("ABEE - ATIVIDADES DE BAIXA EXIGÊNCIA ERGONÔMICA", "", true, corpo); atual();
  };

  function telaPercentual(titulo, rotulo, chave, sigla) {
    return function () {
      var corpo = h("div", {}, [campoNum(rotulo, S[chave], function (v) { S[chave] = v; rodape(sigla + " - PONTUAÇÃO TOTAL: " + f1(num(v)) + "%", true); })]);
      moldura(titulo, sigla + " - PONTUAÇÃO TOTAL: " + f1(num(S[chave])) + "%", true, corpo);
    };
  }
  TELAS.PI = telaPercentual("PI - PAUSAS IRREGULARES", "Percentagem apurada ou estimada (%)", "pi", "PI");
  TELAS.PCEC = telaPercentual("PCEC - PAUSAS CURTÍSSIMAS ENTRE OS CICLOS", "Percentagem apurada (%)", "pcec", "PCEC");
  TELAS.TM = telaPercentual("TM - TEMPO DE MÁQUINA", "Percentagem do tempo de máquina (%)", "tm", "TM");

  TELAS.TOR = function () {
    var corpo = h("div", {}, [
      h("div", { class: "card-i" }, [
        linha("Pausas regulares", f1(calcPR()) + "%"), linha("Atividades de baixa exigência", f1(calcABEE()) + "%"),
        linha("Pausas irregulares", f1(num(S.pi)) + "%"), linha("Pausas curtíssimas entre ciclos", f1(num(S.pcec)) + "%"),
        linha("Tempo de máquina", f1(num(S.tm)) + "%")]),
      h("div", { class: "calc" }, "100 - " + f1(calcPR()) + " - " + f1(calcABEE()) + " - " + f1(num(S.pi)) + " - " + f1(num(S.pcec)) + " - " + f1(num(S.tm)) + " = " + f1(calcTOR()))]);
    moldura("Cálculo da Taxa de Ocupação Real (TOR):", "TOR-FINAL: " + f1(calcTOR()) + "%", true, corpo);
  };

  function gauge(d) {
    var a = Math.max(-1, Math.min(1, d / 20)) * 80; // graus a partir da vertical
    var rad = (a - 90) * Math.PI / 180, cx = 140, cy = 140, x = cx + 100 * Math.cos(rad), y = cy + 100 * Math.sin(rad);
    function arco(a0, a1, cor) {
      var r0 = (a0 - 180) * Math.PI / 180, r1 = (a1 - 180) * Math.PI / 180;
      var x0 = cx + 120 * Math.cos(r0), y0 = cy + 120 * Math.sin(r0), x1 = cx + 120 * Math.cos(r1), y1 = cy + 120 * Math.sin(r1);
      var x2 = cx + 70 * Math.cos(r1), y2 = cy + 70 * Math.sin(r1), x3 = cx + 70 * Math.cos(r0), y3 = cy + 70 * Math.sin(r0);
      return '<path d="M' + x0 + ' ' + y0 + ' A120 120 0 0 1 ' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + ' A70 70 0 0 0 ' + x3 + ' ' + y3 + 'Z" fill="' + cor + '"/>';
    }
    return '<svg class="gauge" viewBox="0 0 280 160">' + arco(0, 90, "#198754") + arco(90, 135, "#e0c000") + arco(135, 180, "#c62828") +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="#5b3a12" stroke-width="6" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="9" fill="#5b3a12"/>' +
      '<text x="62" y="120" font-size="16" fill="#fff" font-weight="bold">&lt;&lt;0</text><text x="122" y="30" font-size="14" fill="#fff" font-weight="bold">0</text><text x="200" y="120" font-size="16" fill="#fff" font-weight="bold">&gt;&gt;0</text></svg>';
  }

  TELAS.RESULT = function () {
    var tom = calcTOM(), tor = calcTOR(), d = Math.round((tor - tom) * 10) / 10, fx = faixa(d);
    var fr = calcFR(), ff = calcFF(), fpm = calcFPM(), fee = calcFEE(), fpb = calcFPB();
    var alertas = [];
    if (fr >= 10) alertas.push(D.ALERTAS.FR);
    if (ff >= 20) alertas.push(D.ALERTAS.FF);
    if (S.fpm.some(function (it) { return fpmItem(it).acima; })) alertas.push(D.ALERTAS.FPM);
    if (fee >= 20) alertas.push(D.ALERTAS.FEE);
    if (fpb >= 20) alertas.push(D.ALERTAS.FPB);
    var corpo = h("div", {}, [
      h("div", { class: "text-center fw-bold mb-2" }, "RESULTADO DA APLICAÇÃO DO MÉTODO TOR-TOM PARA MEMBROS SUPERIORES"),
      h("div", { html: gauge(d) }),
      h("div", { class: "res-box res-" + fx.cls }, [h("div", { class: "fw-bold fs-5" }, "TOR menos TOM = " + (d > 0 ? "+" : "") + f1(d) + " (" + fx.cls + ")")]
        .concat(fx.txt.split("\n").map(function (p) { return h("div", { class: "mt-2" }, p); }))),
      alertas.length ? h("div", { class: "alert alert-warning" }, [h("div", { class: "fw-bold" }, D.ALERTAS.cab), h("div", { class: "mt-1" }, D.ALERTAS.eng)].concat(alertas.map(function (a) { return h("div", {}, "• " + a); }))) : null,
      fpb > 5 ? h("div", { class: "alert alert-warning" }, D.ALERTAS.pernas) : null,
      h("div", { class: "card-i" }, [
        linha("Atividade", S.ativ || "—"), linha("Duração da jornada", S.torConhecida ? "—" : num(S.jornada) + " min"),
        linha("Postura Básica de Trabalho", S.fpb == null ? "—" : D.FPB[S.fpb][0] + " (" + fpb + ")")]),
      S.imgUrl ? h("img", { src: S.imgUrl, class: "img-fluid rounded mb-2", alt: "Imagem da atividade" }) : null,
      S.vidUrl ? h("video", { src: S.vidUrl, controls: "controls", class: "w-100 rounded mb-2 no-print" }) : null,
      h("div", { class: "card-i" }, [h("div", { class: "fw-bold" }, "TOR (Taxa de Ocupação Real): " + f1(tor) + "%")].concat(S.torConhecida ? [] : [
        linha("Pausas regulares", f1(calcPR()) + "%"), linha("Atividades de baixa exigência", f1(calcABEE()) + "%"),
        linha("Pausas irregulares", f1(num(S.pi)) + "%"), linha("Pausas curtíssimas entre ciclos", f1(num(S.pcec)) + "%"),
        linha("Tempo de máquina", f1(num(S.tm)) + "%")])),
      h("div", { class: "card-i" }, [h("div", { class: "fw-bold" }, "TOM (Taxa de Ocupação Máxima): " + fi(tom) + "%"),
        linha("Fator repetitividade", fr + "%"), linha("Fator força", ff + "%"), linha("Fator peso movimentado", fpm + "%"),
        linha("Fator postura em desvio", fi(calcFPD()) + "%"), linha("Fator esforço estático", fee + "%"), linha("Fator carga mental", calcFCM() + "%"),
        linha("Ponderação da TOM", S.pond == null ? "—" : D.PONDERACAO[S.pond][0]),
        h("div", { class: "small text-muted mt-1" }, breakdownTOM())]),
      h("p", { class: "small text-muted" }, D.AUTOR + " " + D.TERMO),
      h("p", { class: "small fw-bold no-print" }, "ATENÇÃO: antes de fechar, certifique-se de haver encaminhado o relatório em PDF."),
      h("div", { class: "d-grid gap-2 no-print" }, [
        h("button", { class: "btn btn-marrom", onclick: function () { window.print(); } }, "Relatório em PDF (imprimir / salvar como PDF)"),
        h("button", { class: "btn btn-outline-secondary", onclick: function () {
          if (confirm("Iniciar uma nova avaliação? Os dados atuais serão apagados.")) { S = novoEstado(); ir("home"); } } }, "Nova avaliação")])]);
    moldura("RESULTADO\nTOR - TOM", "TOR - TOM: " + (d > 0 ? "+" : "") + f1(d), true, corpo, true);
    document.querySelector(".titulo-tela").style.whiteSpace = "pre-line";
  };

  // splash -> home -> aviso de primeiro acesso
  appbar.classList.add("d-none"); bottom.classList.add("d-none");
  app.innerHTML = ""; app.appendChild(h("div", { id: "splash" }, h("img", { src: "assets/logo.png", style: "max-width:260px;width:70%", alt: "TOR-TOM" })));
  setTimeout(function () { ir("home"); dialogoPrimeiroAcesso(); }, 1200);

  window.__TT = { S: function () { return S; }, ir: ir, calcTOM: calcTOM, calcTOR: calcTOR, faixa: faixa, passos: passos };
})();
