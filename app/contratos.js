/* =====================================================================
   Moreno's Dog Training · Contratos de servicio con firma
   Lo usan la app (morenosdogtraining.com/app) y la página web.
   Antes de cualquier pago, el cliente lee el contrato del servicio,
   marca que acepta y firma con el dedo. La firma se guarda en Supabase.
   ===================================================================== */
(function () {
  "use strict";
  const VERSION = "2026-11-v1";
  const SB_URL = "https://izxrwlfppyhmixzgtszi.supabase.co";
  const SB_KEY = "sb_publishable_zlagmwExxroomeqSBvWAWA_OT2nouon";
  const NEGOCIO = "Moreno's Dog Training and More";
  const DIRECCION = "Calle Carazo, Guaynabo, Puerto Rico";
  const TEL = "(787) 472-2230";

  const money = (n) => "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));
  const fecha = (d) => d.toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric" });

  /* Datos de cada paquete de entrenamiento */
  const PAQ = {
    basico: { nombre: "Básico", clases: 8, vence: 4 },
    intensivo: { nombre: "Intensivo", clases: 12, vence: 6 },
    servicio: { nombre: "Acceso Público", clases: 14, vence: 8 }
  };
  const MOD = { clases: "con clases", daycare: "en daycare (daycare + entrenamiento)", parque: "en parque", domicilio: "a domicilio" };

  /* ---------- Texto del contrato ----------
     o = { tipo, titulo, total, plan, deposito, paquete, modalidad, loc, cliente:{nombre,tel,email}, perro }
     Devuelve [[título, [párrafos]], ...] */
  function secciones(o) {
    const orl = o.tipo === "orlando";
    const S = [];
    const pagoHoy = o.plan === "dep" ? o.deposito : o.total;
    const balance = Math.max(0, (o.total || 0) - (o.deposito || 0));
    const p = o.paquete && PAQ[o.paquete];

    S.push(["1. Las partes", [
      `Este contrato es entre ${NEGOCIO} ("Moreno's"), ${orl ? "en su servicio de entrenamiento en Orlando, Florida" : "con local en " + DIRECCION}, teléfono ${TEL}, y la persona que firma abajo ("el Cliente").`,
      `El Cliente declara que es el dueño del perro${o.perro ? " " + o.perro : ""}, o que el dueño le autorizó a contratar este servicio, y que es mayor de 21 años o tiene capacidad legal para contratar.`
    ]]);

    const serv = [`Servicio contratado: ${o.titulo}.`, `Precio total: ${money(o.total)}${o.tipo === "membresia" ? " al mes" : ""}.`];
    if (o.tipo === "train" && p) {
      serv.push(`El paquete ${p.nombre} incluye ${p.clases} clases e incluye los mismos 5 comandos de todos los paquetes: ven, siéntate, échate, caminar sin halar y quieto. Lo que cambia entre paquetes es dónde y con cuántas distracciones el perro los obedece.`);
      if (o.modalidad === "daycare") serv.push(`Modalidad en daycare: el perro se queda en el daycare de lunes a viernes, entrena durante el día y el Cliente lo recoge en la tarde. Al final se incluyen 2 clases con el Cliente para que aprenda a manejar los comandos.`);
      else serv.push(`Modalidad ${MOD[o.modalidad] || ""}: clases de 45 a 60 minutos. El paquete vence ${p.vence} semanas después de la primera clase; las clases que no se usen antes de esa fecha se pierden y no se reembolsan.`);
    }
    if (o.tipo === "preapertura") serv.push(
      `Oferta de pre-apertura: Paquete Intensivo en daycare (12 clases, daycare + entrenamiento de lunes a viernes, más 2 clases con el Cliente al final). Valor regular ${money(1100)}; precio de oferta ${money(800)}.`,
      `La oferta es solo para quien paga un depósito de ${money(200)} antes de la apertura del local de Moreno's. La fecha de comienzo se coordina con el Cliente después de la apertura. Si la apertura se atrasa, el espacio y el precio de oferta se mantienen.`);
    if (o.tipo === "orlando") serv.push(`Entrenamiento Súper Intensivo en Orlando: 9 clases para aprender 4 comandos (sit, down, stay y heel), con práctica en tiendas y lugares públicos. Las fechas y lugares se coordinan con el Cliente.`);
    if (o.tipo === "daycare") serv.push(`Daycare: juego supervisado en grupo, de lunes a viernes de 8:00 am a 5:30 pm. Los días de un paquete se usan según disponibilidad de espacio.`);
    if (o.tipo === "consulta") serv.push(`Consulta de conducta de 45 a 60 minutos para trabajar un problema de conducta específico.`);
    if (o.tipo === "uncomando") serv.push(`Clase de un comando de unos 30 minutos para trabajar una sola destreza.`);
    if (o.tipo === "grupal") serv.push(`Clase grupal los sábados de 8:00 am a 1:00 pm, de 6 a 10 perros. La fecha se fija cuando se llena el grupo. Es para perros que ya saben algunos comandos.`);
    if (o.tipo === "membresia") serv.push(`Membresía mensual con los beneficios publicados en la app y en la página web. Se cobra automáticamente cada mes hasta que el Cliente la cancele. Los días o clases incluidos no se acumulan de un mes a otro.`);
    S.push(["2. El servicio", serv]);

    const pago = [];
    if (o.plan === "dep") pago.push(`El Cliente paga hoy un depósito de ${money(o.deposito)} para apartar su espacio. El balance de ${money(balance)} se paga antes de la mitad del ${orl ? "programa" : "paquete"}. El perro se gradúa cuando el pago está completo.`);
    else if (o.tipo === "membresia") pago.push(`El Cliente autoriza el cobro de ${money(o.total)} cada mes al método de pago que use. Puede cancelar en cualquier momento antes del próximo cobro; lo ya cobrado del mes en curso no se reembolsa.`);
    else pago.push(`El Cliente paga ${money(pagoHoy)} para reservar el servicio.`);
    if (o.tipo !== "membresia") pago.push(`EL DEPÓSITO NO ES REEMBOLSABLE bajo ninguna circunstancia que dependa del Cliente: cambio de planes, cancelación, ausencias, mudanza, que el perro no pueda seguir por su conducta o su salud, o cualquier otra razón del Cliente. Lo mismo aplica a los paquetes una vez comienzan.`);
    pago.push(
      `Si el Cliente paga con Klarna, Afterpay u otra compañía de financiamiento, ese acuerdo es entre el Cliente y esa compañía. Moreno's recibe el pago completo y el Cliente sigue obligado con la compañía aunque cancele el servicio.`,
      `El Cliente se compromete a comunicarse primero con Moreno's ante cualquier problema con un cobro, en lugar de hacer una disputa o contracargo con su banco por servicios que se prestaron o se apartaron conforme a este contrato.`,
      `Si Moreno's cancela el servicio por causas propias y no puede reprogramarlo, devuelve lo pagado por la parte del servicio que no se prestó.`);
    S.push(["3. Pagos y depósito no reembolsable", pago]);

    S.push(["4. Cancelaciones, ausencias y vencimiento", [
      `Para cambiar una cita, el Cliente avisa con por lo menos 24 horas de anticipación. Una cita a la que no llega sin avisar a tiempo cuenta como usada y no se reembolsa.`,
      `Moreno's puede reprogramar por mal tiempo, emergencias o razones de seguridad. En ese caso la cita se repone sin costo.`,
      `Si el Cliente llega tarde, la clase termina a la hora programada.`
    ]]);

    S.push(["5. Salud y vacunas", [
      `El perro debe tener al día sus vacunas de Rabia, DHPP (moquillo y parvovirus) y Bordetella (tos de perrera), y estar libre de pulgas y garrapatas con su prevención al día. El Cliente entrega evidencia de las vacunas antes del primer día y certifica que la información que da sobre su perro es cierta y completa.`,
      `El Cliente avisa antes de cada servicio si su perro está enfermo, en celo, en tratamiento o tuvo algún cambio de salud. Moreno's puede no recibir a un perro que se vea enfermo o sin vacunas al día, y esa cita cuenta como usada.`,
      `Aun con todas las vacunas, los perros que comparten espacio pueden contagiarse enfermedades como la tos de perrera, al igual que en parques, veterinarios y otros lugares. El Cliente entiende y acepta ese riesgo.`
    ]]);

    S.push(["6. Conducta del perro", [
      `El Cliente declara si su perro ha mordido, atacado o mostrado agresividad hacia personas u otros animales. Ocultar esa información es incumplimiento de este contrato.`,
      `Todo perro nuevo pasa por una evaluación de temperamento. Moreno's puede limitar, suspender o terminar el servicio si el perro representa un peligro para personas, para otros perros o para sí mismo. En ese caso el depósito no se reembolsa.`,
      `El Cliente es responsable de los daños que su perro cause a personas, a otros animales o a la propiedad, y se compromete a cubrir a Moreno's por cualquier reclamación de terceros causada por su perro.`
    ]]);

    S.push(["7. Riesgos y relevo de responsabilidad", [
      `El Cliente entiende que el entrenamiento, el ejercicio, el juego y la convivencia con otros perros y personas tienen riesgos propios que no se pueden eliminar del todo, aun con supervisión y cuidado. Entre otros: arañazos, mordidas, lesiones durante el juego, torceduras, cortes, golpes de calor, estrés, enfermedades contagiosas, reacciones a premios o comida, escape y, en casos extremos, lesiones graves o la muerte.`,
      `El Cliente acepta esos riesgos de forma voluntaria y libera a Moreno's, a su dueño Hector Moreno, a sus empleados y a sus agentes de toda responsabilidad y reclamación por lesiones, enfermedad, pérdida o muerte del perro, o por daños al Cliente o a su propiedad, que surjan de esos riesgos, en la máxima medida que permite la ley.`,
      `Este relevo no aplica a daños causados por dolo (intención) o negligencia grave de Moreno's, que la ley no permite renunciar.`,
      `Moreno's no es responsable por collares, correas, juguetes, camas u otras pertenencias que se dañen o se pierdan.`
    ]]);

    S.push(["8. Emergencias veterinarias", [
      `Si el perro se lesiona o se enferma bajo el cuidado de Moreno's, Moreno's intentará comunicarse con el Cliente y con su contacto de emergencia. Si no logra comunicarse a tiempo, el Cliente autoriza a Moreno's a llevar al perro a su veterinario o al veterinario disponible más cercano y a autorizar el tratamiento necesario.`,
      `Los gastos veterinarios y de transporte son responsabilidad del Cliente, salvo que el daño se deba a dolo o negligencia grave de Moreno's.`
    ]]);

    const res = [
      `Moreno's se compromete a entrenar con dedicación y a explicarle al Cliente sus métodos. Cada perro es un animal con su propia personalidad, por lo que Moreno's no garantiza resultados específicos ni que el perro obedezca siempre.`,
      `El resultado depende en gran parte de que el Cliente practique en casa lo que se le enseña y siga las recomendaciones.`
    ];
    if (o.paquete === "servicio") res.push(`El paquete Acceso Público no es una certificación de perro de servicio y Moreno's no emite certificados ni registros. Bajo la ley federal ADA, un perro de servicio es el que está entrenado para hacer tareas relacionadas con la discapacidad de su dueño. El Cliente es el único responsable de la conducta de su perro en lugares públicos y de cumplir con las leyes que apliquen.`);
    S.push(["9. Entrenamiento y resultados", res]);

    const lugar = [];
    if (o.tipo === "daycare" || o.modalidad === "daycare" || o.tipo === "preapertura") lugar.push(`El perro se entrega con correa y collar o arnés con identificación, y se recoge antes de las 5:30 pm. Pasada esa hora puede aplicar un cargo adicional. Si el Cliente no recoge a su perro ni se comunica, Moreno's lo cuidará y el Cliente pagará el cuidado adicional.`, `El Cliente trae la comida porcionada y las medicinas rotuladas con instrucciones.`);
    if (o.modalidad === "parque" || o.tipo === "orlando") lugar.push(`Las clases en parques, tiendas y otros lugares públicos tienen riesgos adicionales que Moreno's no controla, como otros perros sueltos, personas, tráfico, superficies y clima. El Cliente acepta esos riesgos y es responsable de su perro en todo momento junto al entrenador.`);
    if (o.modalidad === "domicilio") lugar.push(`En las clases a domicilio, el Cliente se asegura de que su casa sea un lugar seguro para la clase y avisa de otras mascotas, niños o personas presentes. Moreno's no es responsable por accidentes causados por condiciones de la propiedad.`);
    if (o.tipo === "grupal") lugar.push(`El Cliente se queda con su perro durante la clase grupal, lo mantiene con correa salvo que el entrenador indique lo contrario, y sigue las instrucciones del entrenador.`);
    lugar.push(`El Cliente trae lo necesario para cada clase: correa, collar o arnés, premios y agua.`);
    S.push(["10. Reglas del servicio", lugar]);

    S.push(["11. Fotos y videos", [
      `El Cliente autoriza a Moreno's a tomar fotos y videos de su perro y a usarlos en la app, la página web y las redes sociales de Moreno's, sin compensación. Si no lo desea, puede pedirlo por escrito o por WhatsApp en cualquier momento.`
    ]]);

    S.push(["12. Otras condiciones", [
      `Este contrato se rige por las leyes de ${orl ? "Florida" : "Puerto Rico"}. Si una parte del contrato se declara inválida, el resto sigue vigente.`,
      `Este contrato, junto con las reglas publicadas en la app y en la página web, es el acuerdo completo entre las partes para este servicio. Cualquier cambio tiene que ser por escrito, incluyendo WhatsApp o email.`,
      `El Cliente acepta firmar de forma electrónica y que su firma electrónica tiene el mismo valor que una firma en papel. Puede descargar o imprimir una copia de este contrato al firmarlo.`
    ]]);
    return S;
  }

  function encabezado(o) {
    return [
      `CONTRATO DE SERVICIO Y RELEVO DE RESPONSABILIDAD`,
      `${NEGOCIO}`,
      `Servicio: ${o.titulo}`,
      `Cliente: ${o.cliente.nombre || ""}${o.cliente.tel ? " · Tel. " + o.cliente.tel : ""}${o.cliente.email ? " · " + o.cliente.email : ""}`,
      o.perro ? `Perro: ${o.perro}` : "",
      `Versión ${VERSION}`
    ].filter(Boolean);
  }
  function textoPlano(o, firmado) {
    const lines = encabezado(o).concat([""]);
    secciones(o).forEach((s) => { lines.push(s[0].toUpperCase()); s[1].forEach((p) => lines.push(p)); lines.push(""); });
    lines.push("ACEPTACIÓN");
    ACEPTO(o).forEach((a) => lines.push("[X] " + a));
    lines.push("", `Firmado electrónicamente por ${firmado.nombre} el ${firmado.cuando}.`);
    return lines.join("\n");
  }
  const ACEPTO = (o) => [
    "Leí todo el contrato y estoy de acuerdo con sus términos.",
    o.tipo === "membresia" ? "Entiendo que la membresía se cobra cada mes hasta que la cancele." : "Entiendo que el depósito NO es reembolsable.",
    "Acepto los riesgos y el relevo de responsabilidad (sección 7).",
    "La información que di sobre mi perro, sus vacunas y su conducta es cierta."
  ];

  /* ---------- Estilos ---------- */
  const CSS = `
  .mdtc{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center;font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif}
  .mdtc *{box-sizing:border-box}
  .mdtc-p{width:min(640px,100%);max-height:96vh;max-height:96dvh;display:flex;flex-direction:column;background:#F4EEE9;color:#17191A;border-radius:24px 24px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.4);animation:mdtcup .25s ease}
  @media(min-width:700px){.mdtc{align-items:center}.mdtc-p{border-radius:24px;max-height:92vh}}
  @keyframes mdtcup{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
  .mdtc-h{padding:18px 20px 12px;border-bottom:1px solid #DCCFC6;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
  .mdtc-h b{font-family:"Baloo 2",system-ui,sans-serif;font-size:22px;line-height:1.1;display:block}
  .mdtc-h small{display:block;color:#4F676B;font-size:13px;margin-top:4px;line-height:1.4}
  .mdtc-x{flex-shrink:0;width:40px;height:40px;border-radius:20px;border:0;background:#E5D9D0;color:#17191A;font-size:20px;cursor:pointer}
  .mdtc-b{overflow:auto;padding:14px 20px 8px;-webkit-overflow-scrolling:touch}
  .mdtc-doc{background:#fff;border:1px solid #DCCFC6;border-radius:16px;padding:14px 16px;font-size:14px;line-height:1.55}
  .mdtc-doc h4{margin:14px 0 4px;font-size:14px;color:#B04A22;text-transform:uppercase;letter-spacing:.04em}
  .mdtc-doc h4:first-child{margin-top:0}
  .mdtc-doc p{margin:0 0 8px}
  .mdtc-sum{background:#17191A;color:#F4EEE9;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.6;margin-bottom:12px}
  .mdtc-sum b{color:#FFB08F}
  .mdtc-f{display:flex;flex-direction:column;gap:12px;padding:14px 0 6px}
  .mdtc-f label.t{font-size:13px;font-weight:700;color:#4F676B;display:block;margin:0 0 4px}
  .mdtc-f input[type=text],.mdtc-f input[type=tel],.mdtc-f input[type=email]{width:100%;min-height:48px;border-radius:12px;border:1px solid #C9BAB0;background:#fff;padding:0 12px;font-size:16px;color:#17191A;font-family:inherit;margin:0}
  .mdtc-ck{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.4;cursor:pointer;padding:4px 0;font-weight:500;margin:0;color:#17191A}
  .mdtc-ck input{width:22px;height:22px;flex-shrink:0;accent-color:#DE6A3E;margin:0}
  .mdtc-sig{position:relative;background:#fff;border:2px dashed #C9BAB0;border-radius:14px;height:170px;touch-action:none}
  .mdtc-sig canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:12px;cursor:crosshair}
  .mdtc-sig span{position:absolute;left:14px;bottom:30px;right:14px;border-top:1px solid #B5A69C;pointer-events:none}
  .mdtc-sig em{position:absolute;left:14px;top:10px;font-style:normal;font-size:12px;color:#8A7B72;pointer-events:none}
  .mdtc-clr{position:absolute;right:8px;top:8px;border:0;background:#E5D9D0;border-radius:10px;padding:6px 10px;font-size:13px;font-weight:700;cursor:pointer;color:#17191A}
  .mdtc-ft{padding:12px 20px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid #DCCFC6;display:flex;flex-direction:column;gap:8px}
  .mdtc-btn{min-height:52px;border:0;border-radius:16px;background:#F08455;color:#17191A;font-weight:800;font-size:16px;cursor:pointer;font-family:inherit;text-decoration:none;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 16px}
  .mdtc-btn[disabled]{opacity:.45;cursor:not-allowed}
  .mdtc-btn.g{background:transparent;border:1px solid #B5A69C}
  .mdtc-err{background:#FFD9D2;color:#5A1209;border-radius:12px;padding:10px 12px;font-size:14px;font-weight:600}
  .mdtc-ok{font-size:14px;color:#0E3D25;background:#BFF0D4;border-radius:12px;padding:10px 12px;font-weight:600}`;
  function css() { if (!document.getElementById("mdtc-css")) { const s = document.createElement("style"); s.id = "mdtc-css"; s.textContent = CSS; document.head.appendChild(s); } }

  function docHtml(o) {
    return `<div class="mdtc-doc">${secciones(o).map((s) => `<h4>${esc(s[0])}</h4>${s[1].map((p) => `<p>${esc(p)}</p>`).join("")}`).join("")}</div>`;
  }

  /* ---------- Firma con el dedo ---------- */
  function pad(canvas) {
    const ctx = canvas.getContext("2d"); let drawing = false, last = null, inked = 0;
    function size() { const r = canvas.getBoundingClientRect(), k = window.devicePixelRatio || 1; canvas.width = Math.round(r.width * k); canvas.height = Math.round(r.height * k); ctx.setTransform(k, 0, 0, k, 0, 0); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0F2528"; inked = 0; }
    const pt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); drawing = true; last = pt(e); ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, Math.PI * 2); ctx.fillStyle = "#0F2528"; ctx.fill(); });
    canvas.addEventListener("pointermove", (e) => { if (!drawing) return; e.preventDefault(); const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); inked += Math.hypot(p.x - last.x, p.y - last.y); last = p; });
    const end = () => { drawing = false; if (canvas.onink) canvas.onink(); };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    requestAnimationFrame(size);
    return {
      clear: size,
      ok: () => inked > 60,
      png: () => { // reduce a un tamaño razonable
        const out = document.createElement("canvas"), w = 600, h = Math.round(600 * canvas.height / canvas.width);
        out.width = w; out.height = h; const c = out.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); c.drawImage(canvas, 0, 0, w, h);
        return out.toDataURL("image/png");
      }
    };
  }

  async function guardar(row, sb) {
    if (sb) {
      const { error } = await sb.from("contracts").insert(row);
      if (error) throw error;
      return;
    }
    const r = await fetch(SB_URL + "/rest/v1/contracts", {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row)
    });
    if (!r.ok) throw new Error((await r.text()) || "No se pudo guardar el contrato");
  }

  /* Abre una copia lista para imprimir o guardar como PDF */
  function copia(row, win) {
    const w = win || window.open("", "_blank");
    if (!w) return false;
    const o = row._o || null;
    const body = o ? `<h1>Contrato de servicio y relevo de responsabilidad</h1><p class="m">${esc(NEGOCIO)} · ${esc(DIRECCION)} · ${esc(TEL)}</p>
      <p class="m"><b>Servicio:</b> ${esc(row.titulo)} · <b>Total:</b> ${money(row.total)}<br><b>Cliente:</b> ${esc(row.cliente_nombre)}${row.cliente_tel ? " · " + esc(row.cliente_tel) : ""}${row.cliente_email ? " · " + esc(row.cliente_email) : ""}${row.perro ? "<br><b>Perro:</b> " + esc(row.perro) : ""}</p>
      ${secciones(o).map((s) => `<h2>${esc(s[0])}</h2>${s[1].map((p) => `<p>${esc(p)}</p>`).join("")}`).join("")}`
      : `<pre>${esc(row.texto)}</pre>`;
    w.document.open();
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Contrato · ${esc(row.titulo)}</title>
      <style>body{font-family:Georgia,serif;max-width:720px;margin:24px auto;padding:0 18px;color:#111;line-height:1.5;font-size:14px}h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;text-transform:uppercase;margin:18px 0 4px;color:#B04A22}.m{color:#444}pre{white-space:pre-wrap;font-family:inherit}
      .sig{margin-top:24px;border-top:1px solid #999;padding-top:12px}.sig img{height:110px;display:block}button{font-size:16px;padding:10px 18px;border-radius:10px;border:0;background:#F08455;font-weight:700;margin:12px 0}@media print{button{display:none}}</style></head>
      <body><button onclick="print()">Imprimir o guardar como PDF</button>${body}
      <div class="sig"><img src="${row.firma}" alt="Firma"><b>${esc(row.cliente_nombre)}</b><br>Firmado electrónicamente el ${esc(new Date(row.created_at || Date.now()).toLocaleString("es-PR"))}<br>Contrato núm. ${esc(String(row.id).slice(0, 8).toUpperCase())} · Versión ${esc(row.version)}</div></body></html>`);
    w.document.close();
    return true;
  }

  /* ---------- Abrir el contrato para firmar ----------
     Resuelve con el contrato firmado ({id, ...}) o null si el cliente cierra. */
  function abrir(o) {
    css();
    o = Object.assign({ plan: "full", deposito: 0, cliente: {}, perro: "", origen: "app" }, o);
    o.cliente = Object.assign({ nombre: "", tel: "", email: "" }, o.cliente);
    return new Promise((resolve) => {
      const el = document.createElement("div");
      el.className = "mdtc"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Contrato del servicio");
      const pide = !o.cliente.nombre || !o.cliente.tel || (o.origen === "web" && !o.perro);
      const hoy = o.plan === "dep" ? o.deposito : o.total;
      el.innerHTML = `<div class="mdtc-p">
        <div class="mdtc-h"><div><b>Firma tu contrato</b><small>Antes de pagar, lee y firma el contrato de este servicio. Te toma un minuto.</small></div><button class="mdtc-x" type="button" aria-label="Cerrar" data-x>✕</button></div>
        <div class="mdtc-b">
          <div class="mdtc-sum"><b>${esc(o.titulo)}</b><br>Total ${money(o.total)}${o.tipo === "membresia" ? " al mes" : ""}${o.plan === "dep" ? ` · Depósito hoy ${money(o.deposito)} (no reembolsable)` : ""}</div>
          ${docHtml(o)}
          <form class="mdtc-f" novalidate>
            ${pide ? `<div><label class="t" for="mdtc-n">Tu nombre completo</label><input type="text" id="mdtc-n" autocomplete="name" value="${esc(o.cliente.nombre)}" maxlength="80"></div>
            <div><label class="t" for="mdtc-t">Teléfono (WhatsApp)</label><input type="tel" id="mdtc-t" autocomplete="tel" value="${esc(o.cliente.tel)}" maxlength="20"></div>
            ${o.origen === "web" ? `<div><label class="t" for="mdtc-e">Email</label><input type="email" id="mdtc-e" autocomplete="email" value="${esc(o.cliente.email)}" maxlength="80"></div>
            <div><label class="t" for="mdtc-d">Nombre y raza de tu perro</label><input type="text" id="mdtc-d" value="${esc(o.perro)}" maxlength="80"></div>` : ""}`
              : `<div><label class="t" for="mdtc-n">Tu nombre completo (como firma)</label><input type="text" id="mdtc-n" autocomplete="name" value="${esc(o.cliente.nombre)}" maxlength="80"></div>`}
            ${ACEPTO(o).map((a, i) => `<label class="mdtc-ck"><input type="checkbox" data-ck="${i}"><span>${i === 1 ? "<b>" + esc(a) + "</b>" : esc(a)}</span></label>`).join("")}
            <div><label class="t">Firma aquí con el dedo</label>
              <div class="mdtc-sig"><canvas aria-label="Espacio para firmar"></canvas><span></span><em>Firma</em><button type="button" class="mdtc-clr" data-clr>Borrar</button></div></div>
            <div data-msg></div>
          </form>
        </div>
        <div class="mdtc-ft"><button class="mdtc-btn" type="button" data-sign disabled>Firmar${hoy ? " y seguir al pago" : ""}</button><span style="font-size:12px;color:#4F676B;text-align:center">Fecha: ${esc(fecha(new Date()))}</span></div>
      </div>`;
      document.body.appendChild(el);
      const prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
      const q = (s) => el.querySelector(s);
      const P = pad(q("canvas"));
      const val = (id) => { const x = q("#" + id); return x ? x.value.trim() : ""; };
      function check() {
        const ok = [...el.querySelectorAll("[data-ck]")].every((c) => c.checked) && P.ok() && val("mdtc-n").length >= 3 && (!q("#mdtc-t") || val("mdtc-t").replace(/\D/g, "").length >= 7) && (!q("#mdtc-d") || val("mdtc-d").length >= 2);
        q("[data-sign]").disabled = !ok;
        return ok;
      }
      q("canvas").onink = check;
      el.addEventListener("input", check); el.addEventListener("change", check);
      const close = (v) => { document.body.style.overflow = prevOverflow; el.remove(); resolve(v); };
      q("[data-x]").onclick = () => close(null);
      q("[data-clr]").onclick = () => { P.clear(); check(); };
      q("[data-sign]").onclick = async () => {
        const msg = q("[data-msg]");
        if (!check()) { msg.innerHTML = '<div class="mdtc-err">Completa tu nombre, marca las casillas y firma.</div>'; return; }
        const btn = q("[data-sign]"); btn.disabled = true; btn.textContent = "Guardando tu firma…";
        o.cliente.nombre = val("mdtc-n"); if (q("#mdtc-t")) o.cliente.tel = val("mdtc-t"); if (q("#mdtc-e")) o.cliente.email = val("mdtc-e"); if (q("#mdtc-d")) o.perro = val("mdtc-d");
        const now = new Date();
        const row = {
          id: uuid(), tipo: o.tipo, titulo: o.titulo, total: o.total, plan: o.plan, version: VERSION,
          cliente_nombre: o.cliente.nombre, cliente_tel: o.cliente.tel, cliente_email: o.cliente.email, perro: o.perro,
          texto: textoPlano(o, { nombre: o.cliente.nombre, cuando: now.toLocaleString("es-PR") }),
          firma: P.png(), origen: o.origen, user_agent: navigator.userAgent.slice(0, 300),
          owner_id: o.ownerId || null, dog_id: o.dogId || null
        };
        try {
          await guardar(row, o.sb);
          row.created_at = now.toISOString(); row._o = o;
          close(row);
        } catch (err) {
          btn.disabled = false; btn.textContent = "Intentar otra vez";
          msg.innerHTML = `<div class="mdtc-err">No pudimos guardar tu firma. Revisa tu internet e intenta otra vez.${/fetch|network/i.test(String(err && err.message)) ? "" : "<br><small>" + esc(String((err && err.message) || err).slice(0, 160)) + "</small>"}</div>`;
        }
      };
    });
  }

  /* Añade el número de contrato al enlace de pago de Stripe, para saber qué pago va con qué firma */
  function payUrl(url, row) {
    if (!url) return url;
    try {
      const u = new URL(url);
      if (row && row.id) u.searchParams.set("client_reference_id", "contrato_" + String(row.id).replace(/-/g, ""));
      if (row && row.cliente_email) u.searchParams.set("prefilled_email", row.cliente_email);
      return u.toString();
    } catch (e) { return url; }
  }

  window.MDTContrato = { abrir, copia, payUrl, secciones, VERSION, numero: (id) => String(id || "").slice(0, 8).toUpperCase() };
})();
